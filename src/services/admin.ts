import { collection, collectionGroup, deleteDoc, doc, getDocs } from 'firebase/firestore'
import {
  LEARNING_STAGE_CONFIGS,
  LEARNING_STAGE_ORDER,
  getLearningStageConfig,
  getStageDiagnosticRecord,
  getStageSummativeRecord,
  type LearningStageKey,
} from '@/dashboard/data/learningStage'
import { db } from '@/lib/firebase'
import type { AssessmentProgressRecord } from '@/services/assessmentProgress'
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
  diagnosticStatus: 'Not Started' | 'In Progress' | 'Submitted'
  summativeStatus: 'Not Started' | 'In Progress' | 'Submitted'
  stageStatus: 'Not Started' | 'In Progress' | 'Passed' | 'Needs Improvement'
}

const roundToOne = (value: number) => Math.round(value * 10) / 10
const ASSESSMENT_PROGRESS_COLLECTION = 'AssessmentProgress'
const REVIEWER_NARRATION_CHUNKS_COLLECTION = 'ReviewerNarrationChunks'
const MODULE_PROGRESS_COLLECTION = 'ModuleProgress'

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

    return {
      stage,
      label: config.label,
      diagnosticScore: Number.isFinite(Number(diagnosticRecord?.percentage)) ? Number(diagnosticRecord?.percentage) : null,
      summativeScore: Number.isFinite(Number(summativeRecord?.percentage)) ? Number(summativeRecord?.percentage) : null,
      summativeScoreHistory,
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
