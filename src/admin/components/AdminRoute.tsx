import { onAuthStateChanged } from 'firebase/auth'
import { type ReactElement, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { auth } from '@/lib/firebase'
import { ROUTE_PATHS } from '@/routes/paths'
import { isAdminAuthenticated } from '@/services/adminAuth'
import { isUserAdmin } from '@/services/userProfiles'

type AdminRouteProps = {
  element: ReactElement
}

const AdminRoute = ({ element }: AdminRouteProps) => {
  const hasAdminSession = isAdminAuthenticated()
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [isFirebaseAdmin, setIsFirebaseAdmin] = useState(false)

  useEffect(() => {
    if (!hasAdminSession) {
      setIsAuthReady(true)
      setIsFirebaseAdmin(false)
      return undefined
    }

    let isCancelled = false

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!isCancelled) {
          setIsFirebaseAdmin(false)
          setIsAuthReady(true)
        }
        return
      }

      try {
        const hasAdminRole = await isUserAdmin(user.uid)
        if (!isCancelled) {
          setIsFirebaseAdmin(hasAdminRole)
          setIsAuthReady(true)
        }
      } catch {
        if (!isCancelled) {
          setIsFirebaseAdmin(false)
          setIsAuthReady(true)
        }
      }
    })

    return () => {
      isCancelled = true
      unsubscribe()
    }
  }, [hasAdminSession])

  if (!hasAdminSession) {
    return (
      <Navigate
        to={ROUTE_PATHS.admin.login}
        replace
        state={{ from: ROUTE_PATHS.admin.home }}
      />
    )
  }

  if (!isAuthReady) {
    return <div className="min-h-screen bg-[#050a15]" />
  }

  if (!isFirebaseAdmin) {
    return (
      <Navigate
        to={ROUTE_PATHS.admin.login}
        replace
        state={{
          notice: 'Sign in with the Firebase admin account before opening the admin console.',
        }}
      />
    )
  }

  return element
}

export default AdminRoute
