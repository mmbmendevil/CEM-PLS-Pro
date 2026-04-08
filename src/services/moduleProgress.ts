import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

export type ModuleProgressInput = {
  uid: string
  moduleId: number
  videoProgress: number
  scrollProgress: number
  overallProgress: number
  isCompleted: boolean
}

export type ModuleProgressRecord = ModuleProgressInput & {
  updatedAt?: unknown
}

const MODULE_PROGRESS_COLLECTION = 'ModuleProgress'

const getUserModuleProgressCollection = (uid: string) =>
  collection(db, 'userProfiles', uid, MODULE_PROGRESS_COLLECTION)

const getUserModuleProgressDoc = (uid: string, moduleId: number) =>
  doc(db, 'userProfiles', uid, MODULE_PROGRESS_COLLECTION, String(moduleId))

export const upsertModuleProgress = async (payload: ModuleProgressInput) => {
  const progressRef = getUserModuleProgressDoc(payload.uid, payload.moduleId)

  await setDoc(
    progressRef,
    {
      ...payload,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )

  return progressRef.id
}

export const getModuleProgress = async (uid: string, moduleId: number) => {
  const progressRef = getUserModuleProgressDoc(uid, moduleId)
  const snapshot = await getDoc(progressRef)

  if (!snapshot.exists()) {
    return null
  }

  return snapshot.data() as ModuleProgressRecord
}

export const getUserModuleProgress = async (uid: string) => {
  const progressCollection = getUserModuleProgressCollection(uid)
  const snapshots = await getDocs(progressCollection)

  return snapshots.docs.map((entry) => entry.data() as ModuleProgressRecord)
}
