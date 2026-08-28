import { Bell, ChevronDown, ChevronRight, Menu } from 'lucide-react'
import { onAuthStateChanged } from 'firebase/auth'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import ThemeToggle from '../auth/ThemeToggle'
import { useBrightness } from '../contexts/BrightnessContext'
import { auth } from '../lib/firebase'
import { ROUTE_PATHS } from '../routes/paths'
import { signOutUser } from '../services/auth'
import { getUserProfile } from '../services/userProfiles'

type TopBarProps = {
  onMenuClick: () => void
}

const TopBar = ({ onMenuClick }: TopBarProps) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [fullName, setFullName] = useState('Learner')
  const menuRef = useRef<HTMLDivElement | null>(null)
  const notificationRef = useRef<HTMLDivElement | null>(null)
  const { isBrightMode } = useBrightness()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setFullName('Learner')
        return
      }

      const profile = await getUserProfile(user.uid)

      if (profile?.fullName) {
        setFullName(profile.fullName)
        return
      }

      if (user.displayName) {
        setFullName(user.displayName)
        return
      }

      if (user.email) {
        setFullName(user.email.split('@')[0])
      }
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node

      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsMenuOpen(false)
      }

      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setIsNotificationOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const initials = useMemo(() => {
    const parts = fullName
      .trim()
      .split(' ')
      .filter(Boolean)

    if (parts.length === 0) {
      return 'U'
    }

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase()
    }

    return (parts[0][0] + parts[1][0]).toUpperCase()
  }, [fullName])

  const handleLogout = async () => {
    await signOutUser()
    navigate(ROUTE_PATHS.auth.login)
  }

  const pageTitle =
    location.pathname === ROUTE_PATHS.dashboard.courses
      ? 'Courses'
      : location.pathname === ROUTE_PATHS.dashboard.profile
        ? 'Profile'
        : location.pathname === ROUTE_PATHS.dashboard.modules
          ? 'Course Modules'
          : location.pathname === ROUTE_PATHS.dashboard.diagnostic
            ? 'Prelim'
            : location.pathname === ROUTE_PATHS.dashboard.gapAnalysis
              ? 'Gap Analysis'
              : location.pathname === ROUTE_PATHS.dashboard.studyPlan
                ? 'Personalized Study Plan'
                : location.pathname === ROUTE_PATHS.dashboard.postTest
                  ? 'Summative Post-test'
                  : location.pathname === ROUTE_PATHS.dashboard.results
                    ? 'Learning Results'
                    : location.pathname === ROUTE_PATHS.dashboard.certification
                      ? 'Certification'
          : 'Dashboard'

  return (
    <header
      className={`sticky top-0 z-40 w-full shrink-0 border-b flex items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4 lg:h-20 lg:px-8 font-sans transition-colors ${
        isBrightMode
          ? 'bg-[#fffdf7] border-gray-200 text-black'
          : 'bg-[#111827] border-slate-700/60 text-white'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          className={`inline-flex items-center justify-center rounded-xl p-2 transition-colors lg:hidden ${
            isBrightMode ? 'text-gray-700 hover:bg-gray-200/70' : 'text-gray-300 hover:bg-slate-800/70'
          }`}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <nav className="hidden md:flex items-center gap-3 min-w-0">
          <Link
            to={ROUTE_PATHS.dashboard.home}
            className={`text-xs font-black tracking-widest cursor-pointer uppercase transition-colors ${
              isBrightMode ? 'text-gray-600 hover:text-black' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Home
          </Link>
          <ChevronRight size={14} className={isBrightMode ? 'text-gray-500' : 'text-gray-600'} />
          <span className={`text-xs font-black tracking-widest uppercase ${isBrightMode ? 'text-gray-900' : 'text-gray-100'}`}>
            {pageTitle}
          </span>
        </nav>

        <div className="md:hidden min-w-0">
          <p className={`text-[10px] font-black tracking-[0.22em] uppercase ${isBrightMode ? 'text-gray-900' : 'text-gray-100'}`}>
            {pageTitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className={`hidden sm:flex items-center gap-4 pr-3 lg:pr-6 ${isBrightMode ? 'border-r border-gray-200' : 'border-r border-gray-800'}`}>
          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={() => setIsNotificationOpen((prev) => !prev)}
              className={`relative p-2 rounded-lg transition-all ${
                isBrightMode
                  ? 'text-gray-600 hover:text-black hover:bg-gray-200/70'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <Bell size={18} />
              <span
                className={`absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 ${
                  isBrightMode ? 'border-[#fffdf7]' : 'border-[#111827]'
                }`}
              />
            </button>

            {isNotificationOpen ? (
              <div
                className={`absolute right-0 mt-2 w-64 rounded-xl border shadow-xl z-30 p-3 ${
                  isBrightMode ? 'bg-white border-gray-200' : 'bg-[#101620] border-gray-800'
                }`}
              >
                <p className={`text-sm font-semibold ${isBrightMode ? 'text-gray-900' : 'text-gray-100'}`}>
                  Notifications
                </p>
                <p className={`mt-2 text-xs ${isBrightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                  No new notifications right now.
                </p>
              </div>
            ) : null}
          </div>

          <ThemeToggle />
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 sm:gap-3 group cursor-pointer"
          >
            <div className="relative">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/20 border border-blue-400/30 text-white">
                {initials}
              </div>
            </div>

            <div className="hidden md:flex flex-col items-start leading-tight">
              <span
                className={`text-sm font-black tracking-tight uppercase group-hover:text-blue-400 transition-colors ${
                  isBrightMode ? 'text-gray-900' : 'text-white'
                }`}
              >
                {fullName}
              </span>
              <span className={`text-[10px] font-bold tracking-wider uppercase ${isBrightMode ? 'text-gray-600' : 'text-gray-500'}`}>
                Student
              </span>
            </div>

            <ChevronDown
              size={16}
              className={`hidden md:block transition-colors ${isBrightMode ? 'text-gray-600 group-hover:text-black' : 'text-gray-500 group-hover:text-white'}`}
            />
          </button>

          {isMenuOpen ? (
            <div
              className={`absolute right-0 mt-2 w-36 rounded-xl border shadow-xl z-30 p-1 ${
                isBrightMode ? 'border-gray-200 bg-white' : 'border-gray-800 bg-[#101620]'
              }`}
            >
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
              >
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}

export default TopBar
