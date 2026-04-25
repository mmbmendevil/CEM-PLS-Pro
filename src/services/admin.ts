import { collection, collectionGroup, deleteDoc, doc, getDocs } from 'firebase/firestore'
import {
  LEARNING_STAGE_CONFIGS,
  LEARNING_STAGE_ORDER,
  getLearningStageConfig,
  getStageDiagnosticRecord,
  getStageSummativeRecord,
  type LearningStageKey,
} from '@/dashboard/data/learningStage'
import {
  getDiagnosticQuestionsByIdsForStage,
  normalizeSelectedAnswersForStage,
  type DiagnosticQuestion,
  type DiagnosticQuestionStage,
} from '@/dashboard/data/diagnosticQuestions'
import { db } from '@/lib/firebase'
import type { AssessmentProgressRecord, SummativeAttemptDetail } from '@/services/assessmentProgress'
import { getUserAssessmentProgress } from '@/services/assessmentProgress'
import type { UserProfile, UserRole } from '@/services/userProfiles'

export type AdminUserRecord = {
  uid: string
  fullName: string
  email: string
  role: UserRole
}

export type AdminMetrics = {
  totalUsers: number
  adminUsers: number
  studentUsers: number
  averageDiagnosticScore: number
  averageSummativeScore: number
  averageOverallScore: number
}

export type AdminUserStageDetail = {
  stage: LearningStageKey
  label: string
  diagnosticScore: number | null
  summativeScore: number | null
  summativeScoreHistory: number[]
  summativeAttemptDetails: SummativeAttemptDetail[]
  diagnosticStatus: 'Not Started' | 'In Progress' | 'Submitted'
  summativeStatus: 'Not Started' | 'In Progress' | 'Submitted'
  stageStatus: 'Not Started' | 'In Progress' | 'Passed' | 'Needs Improvement'
}

const roundToOne = (value: number) => Math.round(value * 10) / 10
const ASSESSMENT_PROGRESS_COLLECTION = 'AssessmentProgress'
const REVIEWER_NARRATION_CHUNKS_COLLECTION = 'ReviewerNarrationChunks'
const MODULE_PROGRESS_COLLECTION = 'ModuleProgress'

export type AdminItemAnalysisMode = 'diagnostic' | 'summative'

export type AdminItemAnalysisRow = {
  questionId: number
  module: string
  bloomLevel: DiagnosticQuestion['bloomLevel']
  competencyCode: string
  question: string
  correctAnswerIndex: number
  attempts: number
  correct: number
  percentCorrect: number
  discrimination: number | null
  avgTotalScore: number
  avgTotalScoreCorrect: number | null
  avgTotalScoreIncorrect: number | null
  optionCounts: number[]
  optionPercents: number[]
}

const deleteUserSubcollectionDocs = async (uid: string, subcollectionName: string) => {
  const snapshots = await getDocs(collection(db, 'userProfiles', uid, subcollectionName))
  await Promise.all(snapshots.docs.map((entry) => deleteDoc(entry.ref)))
}

const deleteAssessmentProgressWithChunks = async (uid: string) => {
  const assessmentSnapshots = await getDocs(collection(db, 'userProfiles', uid, ASSESSMENT_PROGRESS_COLLECTION))

  await Promise.all(
    assessmentSnapshots.docs.map(async (assessmentDoc) => {
      const chunkSnapshots = await getDocs(
        collection(
          db,
          'userProfiles',
          uid,
          ASSESSMENT_PROGRESS_COLLECTION,
          assessmentDoc.id,
          REVIEWER_NARRATION_CHUNKS_COLLECTION,
        ),
      )

      await Promise.all(chunkSnapshots.docs.map((entry) => deleteDoc(entry.ref)))
      await deleteDoc(assessmentDoc.ref)
    }),
  )
}

const getAverage = (values: number[]) => {
  if (values.length === 0) {
    return 0
  }

  const sum = values.reduce((total, value) => total + value, 0)
  return roundToOne(sum / values.length)
}

export const getAdminUsers = async () => {
  const snapshots = await getDocs(collection(db, 'userProfiles'))

  const users = snapshots.docs.map((entry) => {
    const payload = entry.data() as Partial<UserProfile>

    return {
      uid: entry.id,
      fullName: payload.fullName?.trim() || 'Unnamed User',
      email: payload.email?.trim() || 'No email',
      role: payload.role === 'admin' ? 'admin' : 'student',
    } as AdminUserRecord
  })

  return users.sort((first, second) => first.fullName.localeCompare(second.fullName))
}

export const getAdminMetrics = async (): Promise<AdminMetrics> => {
  const [userSnapshots, assessmentSnapshots] = await Promise.all([
    getDocs(collection(db, 'userProfiles')),
    getDocs(collectionGroup(db, 'AssessmentProgress')),
  ])

  const totalUsers = userSnapshots.size
  let adminUsers = 0

  userSnapshots.forEach((entry) => {
    const payload = entry.data() as Partial<UserProfile>
    if (payload.role === 'admin') {
      adminUsers += 1
    }
  })

  const studentUsers = Math.max(totalUsers - adminUsers, 0)

  const configs = Object.values(LEARNING_STAGE_CONFIGS)
  const diagnosticKeys = new Set(configs.flatMap((config) => [config.diagnosticAssessmentKey, ...config.legacyDiagnosticAssessmentKeys]))
  const summativeKeys = new Set(configs.map((config) => config.summativeAssessmentKey))

  const diagnosticScores: number[] = []
  const summativeScores: number[] = []

  assessmentSnapshots.forEach((entry) => {
    const record = entry.data() as Partial<AssessmentProgressRecord>
    const key = String(record.assessmentKey ?? '')
    const isSubmitted = record.isSubmitted === true || record.isFinished === true
    const percentage = Number(record.percentage)

    if (!isSubmitted || Number.isNaN(percentage)) {
      return
    }

    if (diagnosticKeys.has(key)) {
      diagnosticScores.push(percentage)
      return
    }

    if (summativeKeys.has(key)) {
      summativeScores.push(percentage)
    }
  })

  const allScores = [...diagnosticScores, ...summativeScores]

  return {
    totalUsers,
    adminUsers,
    studentUsers,
    averageDiagnosticScore: getAverage(diagnosticScores),
    averageSummativeScore: getAverage(summativeScores),
    averageOverallScore: getAverage(allScores),
  }
}

const resolveAssessmentStatus = (record: AssessmentProgressRecord | undefined): 'Not Started' | 'In Progress' | 'Submitted' => {
  if (!record) {
    return 'Not Started'
  }

  if (record.isSubmitted === true || record.isFinished === true) {
    return 'Submitted'
  }

  return 'In Progress'
}

const resolveStageStatus = (
  diagnosticStatus: 'Not Started' | 'In Progress' | 'Submitted',
  summativeStatus: 'Not Started' | 'In Progress' | 'Submitted',
  summativeRecord: AssessmentProgressRecord | undefined,
): 'Not Started' | 'In Progress' | 'Passed' | 'Needs Improvement' => {
  if (summativeStatus === 'Submitted') {
    return summativeRecord?.passed === true ? 'Passed' : 'Needs Improvement'
  }

  if (diagnosticStatus === 'Submitted' || diagnosticStatus === 'In Progress' || summativeStatus === 'In Progress') {
    return 'In Progress'
  }

  return 'Not Started'
}

export const getAdminUserStageDetails = async (uid: string): Promise<AdminUserStageDetail[]> => {
  const records = await getUserAssessmentProgress(uid)
  const assessmentMap = new Map(records.map((record) => [String(record.assessmentKey ?? ''), record]))

  return LEARNING_STAGE_ORDER.map((stage) => {
    const config = getLearningStageConfig(stage)
    const diagnosticRecord = getStageDiagnosticRecord(assessmentMap, stage)
    const summativeRecord = getStageSummativeRecord(assessmentMap, stage)
    const diagnosticStatus = resolveAssessmentStatus(diagnosticRecord)
    const summativeStatus = resolveAssessmentStatus(summativeRecord)
    const summativeScoreHistory = Array.isArray(summativeRecord?.scoreHistory)
      ? summativeRecord.scoreHistory
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value))
      : []
    const summativeAttemptDetails = Array.isArray(summativeRecord?.summativeAttemptDetails)
      ? summativeRecord.summativeAttemptDetails.filter((entry) => entry && typeof entry === 'object')
      : []

    return {
      stage,
      label: config.label,
      diagnosticScore: Number.isFinite(Number(diagnosticRecord?.percentage)) ? Number(diagnosticRecord?.percentage) : null,
      summativeScore: Number.isFinite(Number(summativeRecord?.percentage)) ? Number(summativeRecord?.percentage) : null,
      summativeScoreHistory,
      summativeAttemptDetails,
      diagnosticStatus,
      summativeStatus,
      stageStatus: resolveStageStatus(diagnosticStatus, summativeStatus, summativeRecord),
    }
  })
}

export const resetAdminUserProgress = async (uid: string) => {
  await Promise.all([
    deleteAssessmentProgressWithChunks(uid),
    deleteUserSubcollectionDocs(uid, MODULE_PROGRESS_COLLECTION),
  ])
}

export const deleteAdminUserAccount = async (uid: string) => {
  await resetAdminUserProgress(uid)
  await deleteDoc(doc(db, 'userProfiles', uid))
}

const computeDiscrimination = ({
  attempts,
  correct,
  sumTotalScore,
  sumTotalScoreSq,
  sumTotalScoreCorrect,
  sumTotalScoreIncorrect,
}: {
  attempts: number
  correct: number
  sumTotalScore: number
  sumTotalScoreSq: number
  sumTotalScoreCorrect: number
  sumTotalScoreIncorrect: number
}) => {
  if (attempts < 3) {
    return null
  }

  const incorrect = attempts - correct
  if (correct <= 0 || incorrect <= 0) {
    return null
  }

  const mean = sumTotalScore / attempts
  const variance = sumTotalScoreSq / attempts - mean * mean
  const stdDev = Math.sqrt(Math.max(variance, 0))

  if (!Number.isFinite(stdDev) || stdDev === 0) {
    return null
  }

  const p = correct / attempts
  const q = 1 - p
  const meanCorrect = sumTotalScoreCorrect / correct
  const meanIncorrect = sumTotalScoreIncorrect / incorrect

  const discrimination = ((meanCorrect - meanIncorrect) / stdDev) * Math.sqrt(p * q)
  return Number.isFinite(discrimination) ? roundToOne(discrimination) : null
}

const toAttemptPayloads = (record: Partial<AssessmentProgressRecord>): Array<{
  questionIds: number[]
  selectedAnswers: Record<string, number>
  percentage: number
}> => {
  const recordQuestionIds = Array.isArray(record.questionIds)
    ? record.questionIds.map((value) => Number(value)).filter((value) => Number.isFinite(value))
    : []

  const recordSelectedAnswers =
    record.selectedAnswers && typeof record.selectedAnswers === 'object'
      ? (record.selectedAnswers as Record<string, number>)
      : {}

  const recordPercentage = Number(record.percentage)

  const attemptDetails = Array.isArray(record.summativeAttemptDetails)
    ? (record.summativeAttemptDetails as SummativeAttemptDetail[]).filter((entry) => entry && typeof entry === 'object')
    : []

  if (attemptDetails.length > 0) {
    return attemptDetails.map((entry) => ({
      questionIds: Array.isArray(entry.questionIds)
        ? entry.questionIds.map((value) => Number(value)).filter((value) => Number.isFinite(value))
        : [],
      selectedAnswers: entry.selectedAnswers ?? {},
      percentage: Number(entry.percentage),
    }))
  }

  return [
    {
      questionIds: recordQuestionIds,
      selectedAnswers: recordSelectedAnswers,
      percentage: recordPercentage,
    },
  ]
}

export const getAdminItemAnalysis = async ({
  stage,
  mode,
}: {
  stage: LearningStageKey
  mode: AdminItemAnalysisMode
}): Promise<AdminItemAnalysisRow[]> => {
  const config = getLearningStageConfig(stage)
  const stageAsDiagnostic = stage as unknown as DiagnosticQuestionStage

  const allowedAssessmentKeys =
    mode === 'diagnostic'
      ? new Set([config.diagnosticAssessmentKey, ...config.legacyDiagnosticAssessmentKeys])
      : new Set([config.summativeAssessmentKey])

  const questionById = new Map<number, DiagnosticQuestion>()

  const snapshots = await getDocs(collectionGroup(db, ASSESSMENT_PROGRESS_COLLECTION))

  const agg = new Map<
    number,
    {
      question: DiagnosticQuestion
      attempts: number
      correct: number
      optionCounts: number[]
      sumTotalScore: number
      sumTotalScoreSq: number
      sumTotalScoreCorrect: number
      sumTotalScoreIncorrect: number
    }
  >()

  const ensureQuestion = (questionId: number) => {
    const existing = questionById.get(questionId)
    if (existing) {
      return existing
    }

    const resolved = getDiagnosticQuestionsByIdsForStage([questionId], stageAsDiagnostic)[0]
    if (resolved) {
      questionById.set(resolved.id, resolved)
      return resolved
    }

    return null
  }

  snapshots.forEach((entry) => {
    const record = entry.data() as Partial<AssessmentProgressRecord>
    const assessmentKey = String(record.assessmentKey ?? entry.id ?? '')

    if (!allowedAssessmentKeys.has(assessmentKey)) {
      return
    }

    const isSubmitted = record.isSubmitted === true || record.isFinished === true
    if (!isSubmitted) {
      return
    }

    const attemptPayloads = toAttemptPayloads(record).filter((payload) => payload.questionIds.length > 0)

    for (const attempt of attemptPayloads) {
      const attemptPercentage = Number(attempt.percentage)
      if (!Number.isFinite(attemptPercentage)) {
        continue
      }

      const selectedAnswersNumeric = Object.fromEntries(
        Object.entries(attempt.selectedAnswers ?? {}).map(([questionId, answerIndex]) => [Number(questionId), Number(answerIndex)]),
      ) as Record<number, number>

      const normalizedSelectedAnswers = normalizeSelectedAnswersForStage(selectedAnswersNumeric, stageAsDiagnostic)
      const resolvedQuestions = getDiagnosticQuestionsByIdsForStage(attempt.questionIds, stageAsDiagnostic)

      for (const question of resolvedQuestions) {
        const selectedIndex = normalizedSelectedAnswers[question.id]
        if (selectedIndex === undefined || !Number.isFinite(selectedIndex)) {
          continue
        }

        const resolvedQuestion = ensureQuestion(question.id)
        if (!resolvedQuestion) {
          continue
        }

        const state =
          agg.get(resolvedQuestion.id) ??
          ({
            question: resolvedQuestion,
            attempts: 0,
            correct: 0,
            optionCounts: new Array(resolvedQuestion.options.length).fill(0),
            sumTotalScore: 0,
            sumTotalScoreSq: 0,
            sumTotalScoreCorrect: 0,
            sumTotalScoreIncorrect: 0,
          } as {
            question: DiagnosticQuestion
            attempts: number
            correct: number
            optionCounts: number[]
            sumTotalScore: number
            sumTotalScoreSq: number
            sumTotalScoreCorrect: number
            sumTotalScoreIncorrect: number
          })

        const isCorrect = selectedIndex === resolvedQuestion.correctAnswerIndex
        state.attempts += 1
        state.correct += isCorrect ? 1 : 0
        state.sumTotalScore += attemptPercentage
        state.sumTotalScoreSq += attemptPercentage * attemptPercentage
        if (isCorrect) {
          state.sumTotalScoreCorrect += attemptPercentage
        } else {
          state.sumTotalScoreIncorrect += attemptPercentage
        }

        if (selectedIndex >= 0 && selectedIndex < state.optionCounts.length) {
          state.optionCounts[selectedIndex] += 1
        }

        agg.set(resolvedQuestion.id, state)
      }
    }
  })

  const rows: AdminItemAnalysisRow[] = Array.from(agg.values()).map((entry) => {
    const percentCorrectRaw = entry.attempts > 0 ? (entry.correct / entry.attempts) * 100 : 0
    const avgTotalScore = entry.attempts > 0 ? entry.sumTotalScore / entry.attempts : 0
    const incorrect = entry.attempts - entry.correct

    const avgTotalScoreCorrect = entry.correct > 0 ? entry.sumTotalScoreCorrect / entry.correct : null
    const avgTotalScoreIncorrect = incorrect > 0 ? entry.sumTotalScoreIncorrect / incorrect : null

    const optionPercents = entry.optionCounts.map((count) => (entry.attempts > 0 ? roundToOne((count / entry.attempts) * 100) : 0))

    return {
      questionId: entry.question.id,
      module: entry.question.module,
      bloomLevel: entry.question.bloomLevel,
      competencyCode: entry.question.competencyCode,
      question: entry.question.question,
      correctAnswerIndex: entry.question.correctAnswerIndex,
      attempts: entry.attempts,
      correct: entry.correct,
      percentCorrect: roundToOne(percentCorrectRaw),
      discrimination: computeDiscrimination({
        attempts: entry.attempts,
        correct: entry.correct,
        sumTotalScore: entry.sumTotalScore,
        sumTotalScoreSq: entry.sumTotalScoreSq,
        sumTotalScoreCorrect: entry.sumTotalScoreCorrect,
        sumTotalScoreIncorrect: entry.sumTotalScoreIncorrect,
      }),
      avgTotalScore: roundToOne(avgTotalScore),
      avgTotalScoreCorrect: avgTotalScoreCorrect === null ? null : roundToOne(avgTotalScoreCorrect),
      avgTotalScoreIncorrect: avgTotalScoreIncorrect === null ? null : roundToOne(avgTotalScoreIncorrect),
      optionCounts: entry.optionCounts,
      optionPercents,
    }
  })

  return rows.sort((first, second) => {
    if (first.module !== second.module) {
      return first.module.localeCompare(second.module)
    }

    return first.questionId - second.questionId
  })
}
