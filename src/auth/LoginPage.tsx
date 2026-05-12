import { useState } from 'react'
import { FirebaseError } from 'firebase/app'
import { Zap, BookOpen, BarChart3, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useBrightness } from '../contexts/BrightnessContext'
import { sendResetPasswordEmail, signInWithEmailPassword, signInWithGoogle } from '../services/auth'
import { upsertUserProfile } from '../services/userProfiles'
import ThemeToggle from './ThemeToggle'
import { ROUTE_PATHS } from '../routes/paths'

type FeatureItemProps = {
  icon: React.ReactNode
  title: string
  desc: string
  isBrightMode: boolean
}

const FeatureItem = ({ icon, title, desc, isBrightMode }: FeatureItemProps) => (
  <div className="flex items-start gap-4">
    <div
      className={`p-3 border rounded-xl ${
        isBrightMode ? 'bg-white/90 border-gray-300 text-blue-600' : 'bg-[#0f172a] border-gray-800 text-blue-400'
      }`}
    >
      {icon}
    </div>
    <div className="space-y-1">
      <h3 className={`font-bold ${isBrightMode ? 'text-black' : 'text-gray-100'}`}>{title}</h3>
      <p className={`text-sm ${isBrightMode ? 'text-gray-700' : 'text-gray-500'}`}>{desc}</p>
    </div>
  </div>
)

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const { isBrightMode } = useBrightness()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const routeState = location.state as { from?: string; notice?: string } | null
  const requestedRedirect = searchParams.get('from') ?? routeState?.from ?? ''
  const redirectPath = requestedRedirect.startsWith('/') ? requestedRedirect : ROUTE_PATHS.dashboard.home
  const routeNotice = routeState?.notice ?? (redirectPath === ROUTE_PATHS.admin.login ? 'Sign in with the Firebase admin account, then enter the static admin credentials.' : '')

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!email || !password) {
      setErrorMessage('Please enter your email and password.')
      return
    }

    try {
      setIsSubmitting(true)
      await signInWithEmailPassword(email.trim(), password)
      navigate(redirectPath)
    } catch (error) {
      if (error instanceof FirebaseError) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('Sign in failed. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleLogin = async () => {
    setErrorMessage('')
    setSuccessMessage('')

    try {
      setIsSubmitting(true)
      const credential = await signInWithGoogle()

      if (credential.user.email) {
        await upsertUserProfile({
          uid: credential.user.uid,
          fullName: credential.user.displayName || 'Google User',
          email: credential.user.email,
        })
      }

      navigate(redirectPath)
    } catch (error) {
      if (error instanceof FirebaseError) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('Google sign in failed. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleForgotPassword = async () => {
    setErrorMessage('')
    setSuccessMessage('')

    if (!email) {
      setErrorMessage('Enter your email first, then click Forgot password.')
      return
    }

    try {
      setIsResettingPassword(true)
      await sendResetPasswordEmail(email.trim())
      setSuccessMessage('Password reset email sent. Please check your inbox.')
    } catch (error) {
      if (error instanceof FirebaseError) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('Could not send reset email. Please try again.')
      }
    } finally {
      setIsResettingPassword(false)
    }
  }

  return (
    <div
      className={`min-h-screen font-sans flex flex-col p-8 md:p-16 relative overflow-hidden transition-all duration-300 ${
        isBrightMode ? 'bg-[#fffdf7] text-black' : 'bg-[#050a15] text-white'
      }`}
    >
      <div
        className={`absolute top-[-10%] left-[-10%] w-125 h-125 blur-[120px] rounded-full transition-all duration-300 ${
          isBrightMode ? 'bg-amber-200/70' : 'bg-blue-900/20'
        }`}
      />

      <header className="flex justify-between items-center z-10 mb-20">
        <div className="flex items-center gap-2">
          <div className="flex items-end gap-0.5">
            <div className="w-1.5 h-3 bg-blue-500 rounded-full" />
            <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
            <div className="w-1.5 h-4 bg-blue-400 rounded-full" />
          </div>
          <span className="text-2xl font-bold tracking-tight">
            CEM<span className="text-blue-500">.</span>
          </span>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 grid lg:grid-cols-2 gap-12 items-center z-10 max-w-7xl mx-auto w-full">
        <div className="space-y-10">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">
              AI-Powered <br />
              <span className="text-blue-500">Learning System</span>
            </h1>
          </div>

          <div className="space-y-8">
            <FeatureItem
              icon={<Zap className="text-blue-400" size={20} />}
              title="AI Gap Detection"
              desc="Identify weak knowledge areas instantly."
              isBrightMode={isBrightMode}
            />
            <FeatureItem
              icon={<BookOpen className="text-blue-400" size={20} />}
              title="Adaptive Study Plans"
              desc="Receive targeted learning materials."
              isBrightMode={isBrightMode}
            />
            <FeatureItem
              icon={<BarChart3 className="text-blue-400" size={20} />}
              title="Learning Progress Intelligence"
              desc="Track improvement across assessments."
              isBrightMode={isBrightMode}
            />
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <div className="w-full max-w-md">
            <h2 className="text-3xl font-bold mb-8">Welcome Back</h2>

            <div
              className={`p-8 rounded-2xl backdrop-blur-sm shadow-2xl ${
                isBrightMode ? 'bg-white/90 border border-gray-200' : 'bg-[#0b1221]/50 border border-gray-800'
              }`}
            >
              {routeNotice ? <p className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">{routeNotice}</p> : null}

              <form className="space-y-5" onSubmit={handleLogin}>
                <div className="relative group">
                  <Mail
                    className={`absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 transition-colors ${
                      isBrightMode ? 'text-gray-700' : 'text-gray-500'
                    }`}
                    size={20}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={`w-full rounded-xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all ${
                      isBrightMode
                        ? 'bg-white border-gray-300 text-black placeholder:text-gray-500'
                        : 'bg-[#111927] border-gray-700 text-white placeholder:text-gray-500'
                    }`}
                  />
                </div>

                <div className="relative group">
                  <Lock
                    className={`absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 transition-colors ${
                      isBrightMode ? 'text-gray-700' : 'text-gray-500'
                    }`}
                    size={20}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className={`w-full rounded-xl py-4 pl-12 pr-12 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all ${
                      isBrightMode
                        ? 'bg-white border-gray-300 text-black placeholder:text-gray-500'
                        : 'bg-[#111927] border-gray-700 text-white placeholder:text-gray-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 ${
                      isBrightMode ? 'text-gray-600 hover:text-black' : 'text-gray-500 hover:text-white'
                    }`}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label
                    className={`flex items-center gap-2 cursor-pointer ${
                      isBrightMode ? 'text-gray-700 hover:text-black' : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className={`w-4 h-4 rounded text-blue-500 focus:ring-blue-500 ${
                        isBrightMode ? 'border-gray-400 bg-white' : 'border-gray-700 bg-transparent'
                      }`}
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={isResettingPassword}
                    className="text-blue-500 hover:underline font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isResettingPassword ? 'Sending...' : 'Forgot password?'}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Signing In...' : 'Sign In'}
                </button>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
                  className={`w-full font-semibold py-4 rounded-xl border transition-all disabled:opacity-70 disabled:cursor-not-allowed ${
                    isBrightMode
                      ? 'bg-white text-black border-gray-300 hover:bg-gray-50'
                      : 'bg-[#111927] text-white border-gray-700 hover:bg-[#0f172a]'
                  }`}
                >
                  Continue with Google
                </button>

                {errorMessage ? <p className="text-sm text-red-500">{errorMessage}</p> : null}
                {successMessage ? <p className="text-sm text-green-500">{successMessage}</p> : null}
              </form>
            </div>

            <p className={`text-center mt-8 text-sm ${isBrightMode ? 'text-gray-700' : 'text-gray-500'}`}>
              Don&apos;t have an account?{' '}
              <Link to={ROUTE_PATHS.auth.signin} className="text-blue-500 font-semibold hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </main>

      <footer
        className={`mt-12 text-[10px] tracking-[0.2em] uppercase font-bold ${
          isBrightMode ? 'text-gray-700' : 'text-gray-600'
        }`}
      >
        Comprehensive Educational Mastery
      </footer>
    </div>
  )
}

export default LoginPage
