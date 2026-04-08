import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { updateProfile, onAuthStateChanged } from 'firebase/auth'
import { LayoutDashboard, Pencil, Mail, UserCheck, Calendar, Hash, CheckCircle2, Save, X } from 'lucide-react'
import { useBrightness } from '../../contexts/BrightnessContext'
import { auth } from '../../lib/firebase'
import { getUserProfile, upsertUserProfile } from '../../services/userProfiles'
import { ROUTE_PATHS } from '../../routes/paths'

const ProfilePage = () => {
  const { isBrightMode } = useBrightness()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [fullName, setFullName] = useState('Student')
  const [email, setEmail] = useState('')
  const [memberSince, setMemberSince] = useState('APRIL 2, 2026')
  const [studentNumber, setStudentNumber] = useState('—')
  const [status, setStatus] = useState('VERIFIED')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate(ROUTE_PATHS.auth.login)
        return
      }

      setEmail(user.email ?? '')

      const profile = await getUserProfile(user.uid)
      const resolvedName = profile?.fullName || user.displayName || user.email?.split('@')[0] || 'Student'

      setFullName(resolvedName)
      setStatus(user.emailVerified ? 'VERIFIED' : 'PENDING VERIFICATION')
      setMemberSince('APRIL 2, 2026')
      setStudentNumber('—')
    })

    return unsubscribe
  }, [navigate])

  const userInitial = useMemo(() => fullName.trim().charAt(0).toUpperCase() || 'S', [fullName])

  const shellSurface = isBrightMode ? 'bg-white/80 border-slate-200' : 'bg-[#111827] border-slate-700/60'
  const mutedText = isBrightMode ? 'text-slate-500' : 'text-slate-400'

  const handleGoToDashboard = () => {
    navigate(ROUTE_PATHS.dashboard.home)
  }

  const handleSaveProfile = async () => {
    const currentUser = auth.currentUser

    if (!currentUser) {
      return
    }

    setIsSaving(true)

    try {
      await upsertUserProfile({
        uid: currentUser.uid,
        fullName,
        email: currentUser.email ?? email,
      })

      if (currentUser.displayName !== fullName) {
        await updateProfile(currentUser, { displayName: fullName })
      }

      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className={`min-h-[calc(100vh-6rem)] rounded-4xl p-6 md:p-10 ${shellSurface}`}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className={`text-4xl md:text-5xl font-black tracking-tight uppercase mb-2 ${isBrightMode ? 'text-slate-900' : 'text-white'}`}>
            Profile Overview
          </h1>
          <p className={mutedText}>
            Your digitized learning identity and account status.
          </p>
        </div>

        <div className="flex gap-4 flex-wrap">
          <button type="button" onClick={handleGoToDashboard} className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors ${isBrightMode ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}>
            <LayoutDashboard size={18} />
            Go to Dashboard
          </button>
          {isEditing ? (
            <>
              <button type="button" onClick={() => setIsEditing(false)} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-colors ${isBrightMode ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}>
                <X size={16} />
                Cancel
              </button>
              <button type="button" onClick={handleSaveProfile} disabled={isSaving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-600/20 transition-all active:scale-95">
                <Save size={16} />
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-600/20 transition-all active:scale-95">
              <Pencil size={16} />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      <hr className={`mb-16 ${isBrightMode ? 'border-slate-200' : 'border-slate-700/60'}`} />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5">
          <h2 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-8 ${isBrightMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Member Identity
          </h2>

          <div className={`rounded-[2.5rem] p-8 flex items-center gap-6 border ${shellSurface}`}>
            <div className="relative">
              <div className="h-24 w-24 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-blue-600/20">
                {userInitial}
              </div>
              <div className={`absolute -bottom-2 -right-2 rounded-full p-1 ${isBrightMode ? 'bg-white' : 'bg-[#111827]'}`}>
                <CheckCircle2 className="text-emerald-500" size={28} />
              </div>
            </div>

            <div className="flex flex-col gap-2 min-w-0">
              {isEditing ? (
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className={`text-2xl font-black tracking-tight truncate max-w-[320px] bg-transparent outline-none border-b ${isBrightMode ? 'text-slate-900 border-slate-300 focus:border-blue-500' : 'text-white border-slate-600 focus:border-blue-400'}`}
                />
              ) : (
                <h3 className={`text-2xl font-black tracking-tight truncate max-w-[320px] ${isBrightMode ? 'text-slate-900' : 'text-white'}`}>
                  {fullName}
                </h3>
              )}
              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1 bg-blue-600/10 text-blue-500 text-[9px] font-black rounded-lg uppercase tracking-widest border border-blue-500/20">
                  STUDENT
                </span>
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[9px] font-black rounded-lg uppercase tracking-widest border border-emerald-500/20">
                  Verified Account
                </span>
              </div>
              <div className={`flex items-center gap-2 mt-2 ${mutedText}`}>
                <Mail size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest break-all">{email}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <h2 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-8 ${isBrightMode ? 'text-slate-500' : 'text-slate-400'}`}>
            System Records
          </h2>

          <div className={`rounded-[3rem] p-10 border ${shellSurface}`}>
            <h3 className={`text-2xl font-black tracking-tight mb-2 ${isBrightMode ? 'text-slate-900' : 'text-white'}`}>
              Account Details
            </h3>
            <p className={`text-sm font-medium mb-10 ${mutedText}`}>
              Detailed identification and account status.
            </p>

            <div className="space-y-4">
              <RecordItem icon={<Mail size={20} />} label="Email Address" value={email} isBrightMode={isBrightMode} />
              <RecordItem icon={<UserCheck size={20} />} label="Email Status" value={status} isBrightMode={isBrightMode} />
              <RecordItem icon={<Calendar size={20} />} label="Member Since" value={memberSince} isBrightMode={isBrightMode} />
              <RecordItem icon={<Hash size={20} />} label="Student Number" value={studentNumber} isBrightMode={isBrightMode} />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

const RecordItem = ({
  icon,
  label,
  value,
  isBrightMode,
}: {
  icon: React.ReactNode
  label: string
  value: string
  isBrightMode: boolean
}) => (
  <div className={`flex items-center justify-between p-6 rounded-2xl group hover:border-blue-500/30 transition-all cursor-default border ${isBrightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#0f172a] border-slate-700/60'}`}>
    <div className="flex items-center gap-4 min-w-0">
      <div className={isBrightMode ? 'text-slate-500 group-hover:text-blue-500 transition-colors' : 'text-slate-400 group-hover:text-blue-400 transition-colors'}>
        {icon}
      </div>
      <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isBrightMode ? 'text-slate-500' : 'text-slate-400'}`}>
        {label}
      </span>
    </div>
    <span className={`text-sm font-black uppercase tracking-tight ${isBrightMode ? 'text-slate-900' : 'text-white'}`}>
      {value}
    </span>
  </div>
)

export default ProfilePage
