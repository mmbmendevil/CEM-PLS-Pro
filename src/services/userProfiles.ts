import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

export type UserProfileInput = {
  uid: string
  fullName: string
  email: string
}

export type UserRole = 'admin' | 'student'

export type UserProfile = UserProfileInput & {
  role?: UserRole
  createdAt?: unknown
  updatedAt?: unknown
}

export const createUserProfile = async (payload: UserProfileInput) => {
  const profileRef = doc(db, 'userProfiles', payload.uid)

  await setDoc(profileRef, {
    uid: payload.uid,
    fullName: payload.fullName,
    email: payload.email,
    createdAt: serverTimestamp(),
  })

  return payload.uid
}

export const upsertUserProfile = async (payload: UserProfileInput) => {
  const profileRef = doc(db, 'userProfiles', payload.uid)

  await setDoc(
    profileRef,
    {
      uid: payload.uid,
      fullName: payload.fullName,
      email: payload.email,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )

  return payload.uid
}

export const getUserProfile = async (uid: string) => {
  const profileRef = doc(db, 'userProfiles', uid)
  const snapshot = await getDoc(profileRef)

  if (!snapshot.exists()) {
    return null
  }

  return snapshot.data() as UserProfile
}

export const isUserAdmin = async (uid: string) => {
  const profile = await getUserProfile(uid)

  return profile?.role === 'admin'
}
