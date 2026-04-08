import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut,
  signInWithEmailAndPassword,
  signInWithPopup,
  type UserCredential,
} from 'firebase/auth'
import { auth } from '../lib/firebase'

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

export const signUpWithEmailPassword = (email: string, password: string): Promise<UserCredential> => {
  return createUserWithEmailAndPassword(auth, email, password)
}

export const signInWithEmailPassword = (email: string, password: string): Promise<UserCredential> => {
  return signInWithEmailAndPassword(auth, email, password)
}

export const signInWithGoogle = (): Promise<UserCredential> => {
  return signInWithPopup(auth, googleProvider)
}

export const sendResetPasswordEmail = (email: string): Promise<void> => {
  return sendPasswordResetEmail(auth, email)
}

export const signOutUser = (): Promise<void> => {
  return signOut(auth)
}
