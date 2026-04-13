import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

export type AssessmentCompetencyBreakdown = Record<
  string,
  {
    correct: number
    total: number
    percentage: number
  }
>

export type AssessmentProgressInput = {
  uid: string
  assessmentKey: string
  score: number
  totalItems: number
  percentage: number
  passed: boolean
  aiReviewerOutput?: string
  aiReviewerAudioUrl?: string
  reviewerNarrationStorage?: 'inline' | 'chunks'
  reviewerNarrationChunkCount?: number
  isStudyPlanUnlocked?: boolean
  isReviewUnlocked?: boolean
  reviewerPreference?: 'flashcards' | 'audiobook' | 'cheatsheet-pdf' | 'cheatsheet-image'
  competencyBreakdown?: AssessmentCompetencyBreakdown
  questionIds?: number[]
  selectedAnswers?: Record<string, number>
  currentQuestionIndex?: number
  isSubmitted?: boolean
  isFinished?: boolean
  failedAttempts?: number
  isLocked?: boolean
  scoreHistory?: number[]
  summativeAttemptDetails?: SummativeAttemptDetail[]
}

export type AssessmentProgressRecord = AssessmentProgressInput & {
  updatedAt?: unknown
  passedAt?: unknown
}

export type SummativeAttemptDetail = {
  score: number
  totalItems: number
  percentage: number
  questionIds: number[]
  selectedAnswers: Record<string, number>
  submittedAt?: unknown
}

const ASSESSMENT_PROGRESS_COLLECTION = 'AssessmentProgress'
const REVIEWER_NARRATION_CHUNKS_COLLECTION = 'ReviewerNarrationChunks'
const REVIEWER_NARRATION_INLINE_CHAR_LIMIT = 90000
const REVIEWER_NARRATION_CHUNK_SIZE = 18000

const getAssessmentDoc = (uid: string, assessmentKey: string) =>
  doc(db, 'userProfiles', uid, ASSESSMENT_PROGRESS_COLLECTION, assessmentKey)

const getAssessmentCollection = (uid: string) =>
  collection(db, 'userProfiles', uid, ASSESSMENT_PROGRESS_COLLECTION)

const getNarrationChunkCollection = (uid: string, assessmentKey: string) =>
  collection(db, 'userProfiles', uid, ASSESSMENT_PROGRESS_COLLECTION, assessmentKey, REVIEWER_NARRATION_CHUNKS_COLLECTION)

const getNarrationChunkDoc = (uid: string, assessmentKey: string, index: number) =>
  doc(db, 'userProfiles', uid, ASSESSMENT_PROGRESS_COLLECTION, assessmentKey, REVIEWER_NARRATION_CHUNKS_COLLECTION, `chunk-${String(index).padStart(4, '0')}`)

export const upsertAssessmentProgress = async (payload: AssessmentProgressInput) => {
  const assessmentRef = getAssessmentDoc(payload.uid, payload.assessmentKey)
  const sanitizedPayload = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  ) as AssessmentProgressInput

  await setDoc(
    assessmentRef,
    {
      ...sanitizedPayload,
      updatedAt: serverTimestamp(),
      passedAt: payload.passed ? serverTimestamp() : null,
    },
    { merge: true },
  )

  return assessmentRef.id
}

export const getAssessmentProgress = async (uid: string, assessmentKey: string) => {
  const assessmentRef = getAssessmentDoc(uid, assessmentKey)
  const snapshot = await getDoc(assessmentRef)

  if (!snapshot.exists()) {
    return null
  }

  return snapshot.data() as AssessmentProgressRecord
}

export const getUserAssessmentProgress = async (uid: string) => {
  const snapshots = await getDocs(getAssessmentCollection(uid))
  return snapshots.docs.map((entry) => entry.data() as AssessmentProgressRecord)
}

const splitNarrationScript = (script: string, chunkSize: number) => {
  const chunks: string[] = []

  for (let index = 0; index < script.length; index += chunkSize) {
    chunks.push(script.slice(index, index + chunkSize))
  }

  return chunks
}

const clearReviewerNarrationChunks = async (uid: string, assessmentKey: string) => {
  const snapshots = await getDocs(getNarrationChunkCollection(uid, assessmentKey))
  await Promise.all(snapshots.docs.map((entry) => deleteDoc(entry.ref)))
}

export const saveReviewerNarrationScript = async ({
  uid,
  assessmentKey,
  script,
}: {
  uid: string
  assessmentKey: string
  script: string
}) => {
  const trimmedScript = script.trim()

  if (!trimmedScript) {
    await setDoc(
      getAssessmentDoc(uid, assessmentKey),
      {
        aiReviewerOutput: '',
        reviewerNarrationStorage: 'inline',
        reviewerNarrationChunkCount: 0,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )

    await clearReviewerNarrationChunks(uid, assessmentKey)
    return
  }

  if (trimmedScript.length <= REVIEWER_NARRATION_INLINE_CHAR_LIMIT) {
    await setDoc(
      getAssessmentDoc(uid, assessmentKey),
      {
        aiReviewerOutput: trimmedScript,
        reviewerNarrationStorage: 'inline',
        reviewerNarrationChunkCount: 0,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )

    await clearReviewerNarrationChunks(uid, assessmentKey)
    return
  }

  const chunks = splitNarrationScript(trimmedScript, REVIEWER_NARRATION_CHUNK_SIZE)

  await Promise.all(
    chunks.map((content, index) =>
      setDoc(
        getNarrationChunkDoc(uid, assessmentKey, index),
        {
          index,
          content,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      ),
    ),
  )

  const chunkSnapshots = await getDocs(getNarrationChunkCollection(uid, assessmentKey))
  await Promise.all(
    chunkSnapshots.docs
      .filter((entry) => {
        const payload = entry.data() as { index?: number }
        const entryIndex = Number(payload.index ?? Number.NaN)
        return Number.isFinite(entryIndex) && entryIndex >= chunks.length
      })
      .map((entry) => deleteDoc(entry.ref)),
  )

  await setDoc(
    getAssessmentDoc(uid, assessmentKey),
    {
      aiReviewerOutput: chunks[0],
      reviewerNarrationStorage: 'chunks',
      reviewerNarrationChunkCount: chunks.length,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export const loadReviewerNarrationScript = async ({
  uid,
  assessmentKey,
  fallbackInline,
  narrationStorage,
}: {
  uid: string
  assessmentKey: string
  fallbackInline?: string
  narrationStorage?: 'inline' | 'chunks'
}) => {
  if (narrationStorage !== 'chunks') {
    return fallbackInline?.trim() ?? ''
  }

  const chunkSnapshots = await getDocs(getNarrationChunkCollection(uid, assessmentKey))

  if (chunkSnapshots.empty) {
    return fallbackInline?.trim() ?? ''
  }

  const orderedChunks = chunkSnapshots.docs
    .map((entry) => entry.data() as { index?: number; content?: string })
    .filter((entry) => Number.isFinite(Number(entry.index)) && typeof entry.content === 'string')
    .sort((first, second) => Number(first.index) - Number(second.index))
    .map((entry) => entry.content as string)

  return orderedChunks.join('')
}
