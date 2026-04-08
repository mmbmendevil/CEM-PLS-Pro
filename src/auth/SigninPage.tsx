import { useState } from 'react'
import { FirebaseError } from 'firebase/app'
import { User, Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useBrightness } from '../contexts/BrightnessContext'
import ThemeToggle from './ThemeToggle'
import { ROUTE_PATHS } from '../routes/paths'
import { signInWithGoogle, signUpWithEmailPassword } from '../services/auth'
import { createUserProfile, upsertUserProfile } from '../services/userProfiles'

const SigninPage = () => {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const { isBrightMode } = useBrightness()
  const navigate = useNavigate()

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!fullName || !email || !password || !confirmPassword) {
      setErrorMessage('Please fill in all fields.')
      return
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    try {
      setIsSubmitting(true)

      const credential = await signUpWithEmailPassword(email.trim(), password)

      await createUserProfile({
        uid: credential.user.uid,
        fullName: fullName.trim(),
        email: email.trim(),
      })

      setSuccessMessage('Account created and saved to Firestore.')
      setFullName('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      navigate(ROUTE_PATHS.dashboard.home)
    } catch (error) {
      if (error instanceof FirebaseError) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('Sign up failed. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setErrorMessage('')
    setSuccessMessage('')

    try {
      setIsSubmitting(true)
      const credential = await signInWithGoogle()

      if (!credential.user.email) {
        setErrorMessage('Google account email is required.')
        return
      }

      await upsertUserProfile({
        uid: credential.user.uid,
        fullName: credential.user.displayName || 'Google User',
        email: credential.user.email,
      })

      setSuccessMessage('Google account connected and saved to Firestore.')
      navigate(ROUTE_PATHS.dashboard.home)
    } catch (error) {
      if (error instanceof FirebaseError) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('Google sign up failed. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className={`min-h-screen px-6 py-10 md:px-12 md:py-16 relative overflow-hidden transition-all duration-300 ${
        isBrightMode ? 'bg-[#fffdf7] text-black' : 'bg-[#050a15] text-white'
      }`}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div
          className={`absolute -top-24 -left-20 h-80 w-80 rounded-full blur-3xl ${
            isBrightMode ? 'bg-amber-200/70' : 'bg-cyan-500/10'
          }`}
        />
        <div
          className={`absolute -bottom-24 -right-20 h-96 w-96 rounded-full blur-3xl ${
            isBrightMode ? 'bg-orange-200/70' : 'bg-blue-600/10'
          }`}
        />
      </div>

      <header className="relative z-20 mb-8 flex justify-end">
        <ThemeToggle />
      </header>

      <div className="relative z-10 max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <section className="space-y-6">
          <p className="text-cyan-400 font-semibold tracking-wide">GET STARTED</p>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
            Build Your Personalized
            <span className="block text-blue-500">Learning Journey</span>
          </h1>
          <p className={`max-w-xl ${isBrightMode ? 'text-gray-700' : 'text-slate-400'}`}>
            Create your account to unlock adaptive learning plans, skill analytics, and AI-guided study
            recommendations tailored to your strengths and gaps.
          </p>
          <div className={`flex items-center gap-3 ${isBrightMode ? 'text-gray-800' : 'text-slate-300'}`}>
            <Sparkles className="text-blue-400" size={18} />
            <span>Personalized from your first assessment</span>
          </div>
        </section>

        <section
          className={`backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-2xl ${
            isBrightMode ? 'bg-white/90 border border-gray-200' : 'bg-[#0b1221]/60 border border-slate-800'
          }`}
        >
          <h2 className="text-2xl font-bold mb-6">Create Account</h2>
          <form className="space-y-4" onSubmit={handleSignUp}>
            <div className="relative">
              <User
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  isBrightMode ? 'text-gray-600' : 'text-slate-500'
                }`}
                size={18}
              />
              <input
                type="text"
                placeholder="Full name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className={`w-full rounded-xl py-3 pl-10 pr-4 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                  isBrightMode
                    ? 'bg-white border-gray-300 text-black placeholder:text-gray-500'
                    : 'bg-[#111927] border-slate-700 text-white placeholder:text-slate-500'
                }`}
              />
            </div>

            <div className="relative">
              <Mail
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  isBrightMode ? 'text-gray-600' : 'text-slate-500'
                }`}
                size={18}
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={`w-full rounded-xl py-3 pl-10 pr-4 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                  isBrightMode
                    ? 'bg-white border-gray-300 text-black placeholder:text-gray-500'
                    : 'bg-[#111927] border-slate-700 text-white placeholder:text-slate-500'
                }`}
              />
            </div>

            <div className="relative">
              <Lock
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  isBrightMode ? 'text-gray-600' : 'text-slate-500'
                }`}
                size={18}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={`w-full rounded-xl py-3 pl-10 pr-10 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                  isBrightMode
                    ? 'bg-white border-gray-300 text-black placeholder:text-gray-500'
                    : 'bg-[#111927] border-slate-700 text-white placeholder:text-slate-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                  isBrightMode ? 'text-gray-600 hover:text-black' : 'text-slate-500 hover:text-slate-200'
                }`}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="relative">
              <Lock
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  isBrightMode ? 'text-gray-600' : 'text-slate-500'
                }`}
                size={18}
              />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className={`w-full rounded-xl py-3 pl-10 pr-10 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                  isBrightMode
                    ? 'bg-white border-gray-300 text-black placeholder:text-gray-500'
                    : 'bg-[#111927] border-slate-700 text-white placeholder:text-slate-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                  isBrightMode ? 'text-gray-600 hover:text-black' : 'text-slate-500 hover:text-slate-200'
                }`}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>

            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={isSubmitting}
              className={`w-full font-semibold py-3 rounded-xl border transition-all disabled:opacity-70 disabled:cursor-not-allowed ${
                isBrightMode
                  ? 'bg-white text-black border-gray-300 hover:bg-gray-50'
                  : 'bg-[#111927] text-white border-slate-700 hover:bg-[#0f172a]'
              }`}
            >
              Sign up with Google
            </button>

            {errorMessage ? <p className="text-sm text-red-500">{errorMessage}</p> : null}
            {successMessage ? <p className="text-sm text-green-500">{successMessage}</p> : null}
          </form>

          <p className={`text-sm mt-6 text-center ${isBrightMode ? 'text-gray-700' : 'text-slate-500'}`}>
            Already have an account?{' '}
            <Link to={ROUTE_PATHS.auth.login} className="text-blue-400 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </div>
  )
}

export default SigninPage