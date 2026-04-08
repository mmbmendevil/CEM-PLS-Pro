import { FormEvent, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { useBrightness } from '@/contexts/BrightnessContext'
import { ROUTE_PATHS } from '@/routes/paths'
import { isAdminAuthenticated, signInAdmin } from '@/services/adminAuth'

const AdminLoginPage = () => {
  const { isBrightMode } = useBrightness()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  if (isAdminAuthenticated()) {
    return <Navigate to={ROUTE_PATHS.admin.home} replace />
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const isAllowed = signInAdmin(username, password)

    if (!isAllowed) {
      setErrorMessage('Invalid admin credentials.')
      return
    }

    const redirectPath =
      typeof location.state === 'object' &&
      location.state !== null &&
      'from' in location.state &&
      typeof (location.state as { from?: unknown }).from === 'string'
        ? (location.state as { from: string }).from
        : ROUTE_PATHS.admin.home

    navigate(redirectPath, { replace: true })
  }

  return (
    <main
      className={`min-h-screen px-4 py-8 sm:px-6 lg:px-8 ${
        isBrightMode
          ? 'bg-[radial-gradient(circle_at_top,#dbeafe,#f8fafc_45%)] text-gray-900'
          : 'bg-[radial-gradient(circle_at_top,#1e3a8a,#020617_50%)] text-slate-100'
      }`}
    >
      <section className="mx-auto flex min-h-[80vh] w-full max-w-md items-center">
        <article
          className={`w-full rounded-3xl border p-8 shadow-2xl ${
            isBrightMode ? 'border-white/60 bg-white/90' : 'border-slate-700/60 bg-slate-900/75'
          }`}
        >
          <div className="mb-6 flex items-center gap-3">
            <div
              className={`rounded-2xl p-2 ${
                isBrightMode ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-300'
              }`}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Admin Login</h1>
              <p className={`mt-1 text-sm ${isBrightMode ? 'text-gray-600' : 'text-slate-300'}`}>
                Use the static admin account to access the admin console.
              </p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-1.5">
              <span className={`text-xs font-semibold uppercase tracking-[0.2em] ${isBrightMode ? 'text-gray-500' : 'text-slate-400'}`}>
                Username
              </span>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition ${
                  isBrightMode
                    ? 'border-gray-300 bg-white text-gray-900 focus:border-blue-500'
                    : 'border-slate-600 bg-slate-950/60 text-slate-100 focus:border-blue-400'
                }`}
                autoComplete="username"
                required
              />
            </label>

            <label className="block space-y-1.5">
              <span className={`text-xs font-semibold uppercase tracking-[0.2em] ${isBrightMode ? 'text-gray-500' : 'text-slate-400'}`}>
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition ${
                  isBrightMode
                    ? 'border-gray-300 bg-white text-gray-900 focus:border-blue-500'
                    : 'border-slate-600 bg-slate-950/60 text-slate-100 focus:border-blue-400'
                }`}
                autoComplete="current-password"
                required
              />
            </label>

            {errorMessage ? (
              <p className={`rounded-xl border px-3 py-2 text-sm ${isBrightMode ? 'border-red-200 bg-red-50 text-red-700' : 'border-red-500/40 bg-red-950/30 text-red-200'}`}>
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Sign in to Admin
            </button>
          </form>
        </article>
      </section>
    </main>
  )
}

export default AdminLoginPage
