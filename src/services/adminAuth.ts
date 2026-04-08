const ADMIN_SESSION_KEY = 'pls_admin_session'

const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME ?? 'admin'
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? 'admin123'

const isBrowser = typeof window !== 'undefined'

export const signInAdmin = (username: string, password: string): boolean => {
  const normalizedUsername = username.trim()
  const normalizedPassword = password.trim()

  if (normalizedUsername !== ADMIN_USERNAME || normalizedPassword !== ADMIN_PASSWORD) {
    return false
  }

  if (isBrowser) {
    localStorage.setItem(ADMIN_SESSION_KEY, 'active')
  }

  return true
}

export const isAdminAuthenticated = (): boolean => {
  if (!isBrowser) {
    return false
  }

  return localStorage.getItem(ADMIN_SESSION_KEY) === 'active'
}

export const signOutAdmin = (): void => {
  if (isBrowser) {
    localStorage.removeItem(ADMIN_SESSION_KEY)
  }
}
