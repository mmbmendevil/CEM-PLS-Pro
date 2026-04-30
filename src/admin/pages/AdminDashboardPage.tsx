import { useEffect, useMemo, useState } from 'react'
import { ShieldCheck, Users, GraduationCap, ChartLine, MailCheck, RefreshCw, RotateCcw, Trash2, BarChart3 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useBrightness } from '@/contexts/BrightnessContext'
import { ROUTE_PATHS } from '@/routes/paths'
import { sendResetPasswordEmail } from '@/services/auth'
import { getDiagnosticQuestionsByIdsForStage } from '@/dashboard/data/diagnosticQuestions'
import type { LearningStageKey } from '@/dashboard/data/learningStage'
import {
  deleteAdminUserAccount,
  getAdminLearningGains,
  getAdminMetrics,
  getAdminUsers,
  getAdminUserDetailsBundle,
  resetAdminUserProgress,
  type AdminGapAnalysisOutput,
  type AdminLearningGainRow,
  type AdminMetrics,
  type AdminUserRecord,
  type AdminUserStageDetail,
} from '@/services/admin'
import { signOutAdmin } from '@/services/adminAuth'

const GAP_ANALYSIS_THRESHOLD = 75
const roundToOne = (value: number) => Math.round(value * 10) / 10

const KPI = ({
  title,
  value,
  subtitle,
  icon,
  isBrightMode,
}: {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
  isBrightMode: boolean
}) => {
  return (
    <article
      className={`rounded-2xl border p-5 ${
        isBrightMode ? 'border-gray-200 bg-white' : 'border-slate-700/60 bg-slate-900/70'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${isBrightMode ? 'text-gray-500' : 'text-slate-400'}`}>
            {title}
          </p>
          <p className={`mt-2 text-3xl font-bold ${isBrightMode ? 'text-gray-900' : 'text-slate-100'}`}>{value}</p>
          <p className={`mt-1 text-sm ${isBrightMode ? 'text-gray-600' : 'text-slate-300'}`}>{subtitle}</p>
        </div>
        <div className={`rounded-xl p-2 ${isBrightMode ? 'bg-blue-50 text-blue-700' : 'bg-blue-500/20 text-blue-300'}`}>{icon}</div>
      </div>
    </article>
  )
}

const INITIAL_METRICS: AdminMetrics = {
  totalUsers: 0,
  adminUsers: 0,
  studentUsers: 0,
  averageDiagnosticScore: 0,
  averageSummativeScore: 0,
  averageOverallScore: 0,
}

const AdminDashboardPage = () => {
  const navigate = useNavigate()
  const { isBrightMode } = useBrightness()
  const [metrics, setMetrics] = useState<AdminMetrics>(INITIAL_METRICS)
  const [users, setUsers] = useState<AdminUserRecord[]>([])
  const [learningGains, setLearningGains] = useState<AdminLearningGainRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [sendingResetTo, setSendingResetTo] = useState<string | null>(null)
  const [resettingProgressFor, setResettingProgressFor] = useState<string | null>(null)
  const [deletingAccountFor, setDeletingAccountFor] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState('')
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null)
  const [selectedUserDetails, setSelectedUserDetails] = useState<AdminUserStageDetail[]>([])
  const [gapAnalysisOutputs, setGapAnalysisOutputs] = useState<AdminGapAnalysisOutput[]>([])
  const [selectedGapStage, setSelectedGapStage] = useState<LearningStageKey>('prelim')
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [detailsErrorMessage, setDetailsErrorMessage] = useState('')
  const [selectedTrial, setSelectedTrial] = useState<{ stage: LearningStageKey; index: number } | null>(null)

  const loadAdminData = async (refreshing = false) => {
    if (refreshing) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    setErrorMessage('')

    try {
      const [nextMetrics, nextUsers, nextLearningGains] = await Promise.all([getAdminMetrics(), getAdminUsers(), getAdminLearningGains()])
      setMetrics(nextMetrics)
      setUsers(nextUsers)
      setLearningGains(nextLearningGains)
    } catch {
      setErrorMessage('Unable to load admin data. Check your Firestore permissions for admin access.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    void loadAdminData()
  }, [])

  const handleSendReset = async (email: string, uid: string) => {
    if (!email || email === 'No email') {
      setActionMessage('Cannot send reset email because this user has no registered email.')
      return
    }

    setActionMessage('')
    setSendingResetTo(uid)

    try {
      await sendResetPasswordEmail(email)
      setActionMessage(`Password reset link sent to ${email}.`)
    } catch {
      setActionMessage('Unable to send reset email. Verify Firebase Auth email-password provider settings.')
    } finally {
      setSendingResetTo(null)
    }
  }

  const handleResetProgress = async (user: AdminUserRecord) => {
    if (user.role === 'admin') {
      setActionMessage('Progress reset is only available for student accounts.')
      return
    }

    const shouldReset = window.confirm(`Reset all progress for ${user.fullName}? This cannot be undone.`)

    if (!shouldReset) {
      return
    }

    setActionMessage('')
    setResettingProgressFor(user.uid)

    try {
      await resetAdminUserProgress(user.uid)

      if (selectedUser?.uid === user.uid) {
        setSelectedUserDetails([])
      }

      await loadAdminData(true)
      setActionMessage(`Progress reset for ${user.fullName}.`)
    } catch {
      setActionMessage('Unable to reset user progress. Check Firestore permissions and try again.')
    } finally {
      setResettingProgressFor(null)
    }
  }

  const handleDeleteAccount = async (user: AdminUserRecord) => {
    if (user.role === 'admin') {
      setActionMessage('Deleting admin accounts is disabled in the admin dashboard.')
      return
    }

    const shouldDelete = window.confirm(`Delete account for ${user.fullName}? This cannot be undone.`)

    if (!shouldDelete) {
      return
    }

    setActionMessage('')
    setDeletingAccountFor(user.uid)

    try {
      await deleteAdminUserAccount(user.uid)

      if (selectedUser?.uid === user.uid) {
        setSelectedUser(null)
        setSelectedUserDetails([])
      }

      await loadAdminData(true)
      setActionMessage(`Account deleted for ${user.fullName}.`)
    } catch {
      setActionMessage('Unable to delete account. Check Firestore permissions and try again.')
    } finally {
      setDeletingAccountFor(null)
    }
  }

  const placeholders = useMemo(
    () => [
      {
        title: 'Total Users',
        value: String(metrics.totalUsers),
        subtitle: `${metrics.adminUsers} admins and ${metrics.studentUsers} students`,
        icon: <Users size={20} />,
      },
      {
        title: 'Average Pre-test Score',
        value: `${metrics.averageDiagnosticScore}%`,
        subtitle: 'Across all submitted diagnostic assessments',
        icon: <GraduationCap size={20} />,
      },
      {
        title: 'Average Post-test Score',
        value: `${metrics.averageSummativeScore}%`,
        subtitle: `Overall score average: ${metrics.averageOverallScore}%`,
        icon: <ChartLine size={20} />,
      },
    ],
    [metrics],
  )

  const formatGain = (value: number | null) => {
    if (value === null) {
      return '-'
    }

    const sign = value > 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  const gainClass = (value: number | null) => {
    if (value === null) {
      return isBrightMode ? 'text-gray-500' : 'text-slate-400'
    }

    if (value >= 5) {
      return isBrightMode ? 'text-emerald-700' : 'text-emerald-300'
    }

    if (value <= -5) {
      return isBrightMode ? 'text-rose-700' : 'text-rose-300'
    }

    return isBrightMode ? 'text-amber-700' : 'text-amber-300'
  }

  const handleLogout = () => {
    signOutAdmin()
    navigate(ROUTE_PATHS.admin.login, { replace: true })
  }

  const handleSelectUser = async (user: AdminUserRecord) => {
    setSelectedUser(user)
    setSelectedTrial(null)
    setIsLoadingDetails(true)
    setDetailsErrorMessage('')
    setGapAnalysisOutputs([])

    try {
      const bundle = await getAdminUserDetailsBundle(user.uid)
      setSelectedUserDetails(bundle.stageDetails)
      setGapAnalysisOutputs(bundle.gapAnalysisOutputs)

      const defaultStage =
        bundle.gapAnalysisOutputs.find((entry) => entry.diagnosticStatus === 'Submitted')?.stage ??
        bundle.gapAnalysisOutputs.find((entry) => entry.diagnosticStatus === 'In Progress')?.stage ??
        'prelim'
      setSelectedGapStage(defaultStage)
    } catch {
      setSelectedUserDetails([])
      setGapAnalysisOutputs([])
      setDetailsErrorMessage('Unable to load account details for this user.')
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const getStatusClasses = (status: string) => {
    if (status === 'Passed') {
      return isBrightMode ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-300'
    }

    if (status === 'Needs Improvement') {
      return isBrightMode ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/20 text-amber-300'
    }

    if (status === 'In Progress') {
      return isBrightMode ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-300'
    }

    if (status === 'Submitted') {
      return isBrightMode ? 'bg-indigo-100 text-indigo-700' : 'bg-indigo-500/20 text-indigo-300'
    }

    return isBrightMode ? 'bg-gray-100 text-gray-700' : 'bg-slate-700 text-slate-200'
  }

  const selectedGapOutput = useMemo(() => {
    return gapAnalysisOutputs.find((entry) => entry.stage === selectedGapStage) ?? null
  }, [gapAnalysisOutputs, selectedGapStage])

  const selectedUserGainChart = useMemo(() => {
    if (!selectedUser || selectedUserDetails.length === 0) {
      return []
    }

    return selectedUserDetails.map((entry) => {
      const diagnostic = entry.diagnosticScore
      const postTest = entry.summativeScore
      const gain = typeof diagnostic === 'number' && typeof postTest === 'number' ? roundToOne(postTest - diagnostic) : null

      return {
        stage: entry.label,
        diagnostic,
        postTest,
        gain,
      }
    })
  }, [selectedUser, selectedUserDetails])

  const gainDomain = useMemo(() => {
    const gains = selectedUserGainChart.map((entry) => entry.gain).filter((value): value is number => typeof value === 'number')

    if (gains.length === 0) {
      return [-25, 25] as const
    }

    const min = Math.min(...gains, -5)
    const max = Math.max(...gains, 5)
    const pad = 5

    return [Math.floor(min - pad), Math.ceil(max + pad)] as const
  }, [selectedUserGainChart])

  const selectedTrialDetail = useMemo(() => {
    if (!selectedTrial) {
      return null
    }

    return selectedUserDetails.find((detail) => detail.stage === selectedTrial.stage)?.summativeAttemptDetails?.[selectedTrial.index] ?? null
  }, [selectedTrial, selectedUserDetails])

  const selectedTrialQuestions = useMemo(() => {
    if (!selectedTrial || !selectedTrialDetail) {
      return []
    }

    const questions = getDiagnosticQuestionsByIdsForStage(selectedTrialDetail.questionIds ?? [], selectedTrial.stage)
    const selectedAnswers = selectedTrialDetail.selectedAnswers ?? {}

    return questions.map((question) => {
      const selectedIndex = selectedAnswers[String(question.id)]
      return {
        id: question.id,
        module: question.module,
        question: question.question,
        selectedIndex,
        correctIndex: question.correctAnswerIndex,
        options: question.options,
      }
    })
  }, [selectedTrial, selectedTrialDetail])

  if (isLoading) {
    return <div className={`min-h-screen ${isBrightMode ? 'bg-[#fffdf7]' : 'bg-[#0f172a]'}`} />
  }

  return (
    <main className={`min-h-screen p-8 ${isBrightMode ? 'bg-[#fffdf7]' : 'bg-[#0f172a]'}`}>
      <section className="mx-auto w-full max-w-6xl space-y-6">
      <header
        className={`rounded-3xl border p-7 ${
          isBrightMode ? 'border-gray-200 bg-linear-to-r from-white via-blue-50 to-cyan-50' : 'border-slate-700/60 bg-linear-to-r from-slate-900 via-slate-900 to-blue-950/40'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`rounded-2xl p-2 ${isBrightMode ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-300'}`}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className={`text-2xl font-bold tracking-tight ${isBrightMode ? 'text-gray-900' : 'text-slate-100'}`}>Admin Console</h1>
            <p className={`mt-1 text-sm ${isBrightMode ? 'text-gray-600' : 'text-slate-300'}`}>
              Monitor user growth, track average outcomes, and trigger password reset emails.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              void loadAdminData(true)
            }}
            disabled={isRefreshing}
            className={`ml-auto inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              isBrightMode
                ? 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
                : 'border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800'
            } ${isRefreshing ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTE_PATHS.admin.itemAnalysis)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              isBrightMode
                ? 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
                : 'border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800'
            }`}
          >
            <BarChart3 size={16} />
            Item analysis
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              isBrightMode
                ? 'border-red-300 bg-white text-red-700 hover:bg-red-50'
                : 'border-red-500/50 bg-red-950/30 text-red-200 hover:bg-red-900/40'
            }`}
          >
            Logout
          </button>
        </div>
      </header>

      {errorMessage ? (
        <article className={`rounded-2xl border px-4 py-3 text-sm ${isBrightMode ? 'border-red-200 bg-red-50 text-red-800' : 'border-red-500/40 bg-red-950/30 text-red-200'}`}>
          {errorMessage}
        </article>
      ) : null}

      {actionMessage ? (
        <article className={`rounded-2xl border px-4 py-3 text-sm ${isBrightMode ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-blue-500/40 bg-blue-950/30 text-blue-200'}`}>
          {actionMessage}
        </article>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {placeholders.map((item) => (
          <KPI
            key={item.title}
            title={item.title}
            value={item.value}
            subtitle={item.subtitle}
            icon={item.icon}
            isBrightMode={isBrightMode}
          />
        ))}
      </div>

      <article
        className={`rounded-2xl border p-6 ${
          isBrightMode ? 'border-gray-200 bg-white' : 'border-slate-700/60 bg-slate-900/70'
        }`}
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className={`text-lg font-semibold ${isBrightMode ? 'text-gray-900' : 'text-slate-100'}`}>Learning Gains</h2>
            <p className={`mt-1 text-sm ${isBrightMode ? 'text-gray-600' : 'text-slate-300'}`}>
              Diagnostic → Post-test gain per stage (submitted attempts only).
            </p>
          </div>
          <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${isBrightMode ? 'text-gray-500' : 'text-slate-400'}`}>
            {learningGains.length} student{learningGains.length === 1 ? '' : 's'}
          </p>
        </div>

        {learningGains.length === 0 ? (
          <p className={`mt-4 text-sm ${isBrightMode ? 'text-gray-600' : 'text-slate-300'}`}>
            No submitted diagnostic/post-test pairs found yet.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-180 text-left text-sm">
              <thead>
                <tr className={`${isBrightMode ? 'text-gray-600' : 'text-slate-300'}`}>
                  <th className="py-2 pr-3 font-semibold">Student</th>
                  <th className="py-2 pr-3 text-right font-semibold">Prelim</th>
                  <th className="py-2 pr-3 text-right font-semibold">Midterm</th>
                  <th className="py-2 pr-3 text-right font-semibold">Final</th>
                  <th className="py-2 pr-0 text-right font-semibold">Overall</th>
                </tr>
              </thead>
              <tbody>
                {learningGains.map((row) => (
                  <tr
                    key={`gain-${row.uid}`}
                    onClick={() => {
                      const target = users.find((user) => user.uid === row.uid)
                      if (target) {
                        void handleSelectUser(target)
                      }
                    }}
                    className={`cursor-pointer border-t transition ${
                      isBrightMode ? 'border-gray-200 text-gray-800 hover:bg-gray-50' : 'border-slate-700 text-slate-200 hover:bg-slate-800/40'
                    } ${selectedUser?.uid === row.uid ? (isBrightMode ? 'bg-blue-50' : 'bg-blue-950/20') : ''}`}
                  >
                    <td className="py-3 pr-3">
                      <p className="font-semibold">{row.fullName}</p>
                      <p className={`mt-0.5 text-xs ${isBrightMode ? 'text-gray-500' : 'text-slate-400'}`}>{row.email}</p>
                    </td>
                    <td className={`py-3 pr-3 text-right font-semibold ${gainClass(row.prelimGain)}`}>{formatGain(row.prelimGain)}</td>
                    <td className={`py-3 pr-3 text-right font-semibold ${gainClass(row.midtermGain)}`}>{formatGain(row.midtermGain)}</td>
                    <td className={`py-3 pr-3 text-right font-semibold ${gainClass(row.finalGain)}`}>{formatGain(row.finalGain)}</td>
                    <td className={`py-3 pr-0 text-right font-black ${gainClass(row.overallGain)}`}>{formatGain(row.overallGain)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <article
        className={`rounded-2xl border p-6 ${
          isBrightMode ? 'border-gray-200 bg-white' : 'border-slate-700/60 bg-slate-900/70'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className={`text-lg font-semibold ${isBrightMode ? 'text-gray-900' : 'text-slate-100'}`}>User Management</h2>
          <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${isBrightMode ? 'text-gray-500' : 'text-slate-400'}`}>
            {users.length} user{users.length === 1 ? '' : 's'} loaded
          </p>
        </div>

        {users.length === 0 ? (
          <p className={`mt-4 text-sm ${isBrightMode ? 'text-gray-600' : 'text-slate-300'}`}>No users found.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-180 text-left text-sm">
              <thead>
                <tr className={`${isBrightMode ? 'text-gray-600' : 'text-slate-300'}`}>
                  <th className="py-2 pr-3 font-semibold">Name</th>
                  <th className="py-2 pr-3 font-semibold">Email</th>
                  <th className="py-2 pr-3 font-semibold">Role</th>
                  <th className="py-2 pr-0 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.uid}
                    onClick={() => {
                      void handleSelectUser(user)
                    }}
                    className={`cursor-pointer border-t transition ${
                      isBrightMode ? 'border-gray-200 text-gray-800 hover:bg-gray-50' : 'border-slate-700 text-slate-200 hover:bg-slate-800/40'
                    } ${selectedUser?.uid === user.uid ? (isBrightMode ? 'bg-blue-50' : 'bg-blue-950/20') : ''}`}
                  >
                    <td className="py-3 pr-3">{user.fullName}</td>
                    <td className="py-3 pr-3">{user.email}</td>
                    <td className="py-3 pr-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
                          user.role === 'admin'
                            ? isBrightMode
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-blue-500/20 text-blue-300'
                            : isBrightMode
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-slate-700 text-slate-200'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 pl-3 pr-0 text-right">
                      <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          void handleSendReset(user.email, user.uid)
                        }}
                        disabled={
                          sendingResetTo === user.uid ||
                          user.email === 'No email' ||
                          resettingProgressFor === user.uid ||
                          deletingAccountFor === user.uid
                        }
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                          isBrightMode
                            ? 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
                            : 'border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800'
                        } ${(sendingResetTo === user.uid || user.email === 'No email' || resettingProgressFor === user.uid || deletingAccountFor === user.uid) ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <MailCheck size={14} />
                        {sendingResetTo === user.uid ? 'Sending...' : 'Send Reset Password'}
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          void handleResetProgress(user)
                        }}
                        disabled={
                          user.role === 'admin' ||
                          resettingProgressFor === user.uid ||
                          sendingResetTo === user.uid ||
                          deletingAccountFor === user.uid
                        }
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                          isBrightMode
                            ? 'border-amber-300 bg-white text-amber-700 hover:bg-amber-50'
                            : 'border-amber-500/50 bg-amber-950/30 text-amber-200 hover:bg-amber-900/40'
                        } ${(user.role === 'admin' || resettingProgressFor === user.uid || sendingResetTo === user.uid || deletingAccountFor === user.uid) ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <RotateCcw size={14} />
                        {resettingProgressFor === user.uid ? 'Resetting...' : 'Reset Progress'}
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          void handleDeleteAccount(user)
                        }}
                        disabled={
                          user.role === 'admin' ||
                          deletingAccountFor === user.uid ||
                          sendingResetTo === user.uid ||
                          resettingProgressFor === user.uid
                        }
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                          isBrightMode
                            ? 'border-red-300 bg-white text-red-700 hover:bg-red-50'
                            : 'border-red-500/50 bg-red-950/30 text-red-200 hover:bg-red-900/40'
                        } ${(user.role === 'admin' || deletingAccountFor === user.uid || sendingResetTo === user.uid || resettingProgressFor === user.uid) ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <Trash2 size={14} />
                        {deletingAccountFor === user.uid ? 'Deleting...' : 'Delete Account'}
                      </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className={`mt-6 rounded-2xl border p-5 ${isBrightMode ? 'border-gray-200 bg-gray-50/60' : 'border-slate-700/60 bg-slate-950/40'}`}>
          <div className="flex items-center justify-between gap-2">
            <h3 className={`text-base font-semibold ${isBrightMode ? 'text-gray-900' : 'text-slate-100'}`}>Account Details</h3>
            {selectedUser ? (
              <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${isBrightMode ? 'text-gray-500' : 'text-slate-400'}`}>
                {selectedUser.fullName}
              </p>
            ) : null}
          </div>

          {!selectedUser ? (
            <p className={`mt-3 text-sm ${isBrightMode ? 'text-gray-600' : 'text-slate-300'}`}>
              Select an account above to view grading stage scores and status.
            </p>
          ) : null}

          {detailsErrorMessage ? (
            <p className={`mt-3 rounded-xl border px-3 py-2 text-sm ${isBrightMode ? 'border-red-200 bg-red-50 text-red-700' : 'border-red-500/40 bg-red-950/30 text-red-200'}`}>
              {detailsErrorMessage}
            </p>
          ) : null}

          {isLoadingDetails ? (
            <p className={`mt-3 text-sm ${isBrightMode ? 'text-gray-600' : 'text-slate-300'}`}>Loading account details...</p>
          ) : null}

          {!isLoadingDetails && selectedUserDetails.length > 0 ? (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              {selectedUserDetails.map((stageDetail) => (
                <article
                  key={stageDetail.stage}
                  className={`rounded-xl border p-4 ${isBrightMode ? 'border-gray-200 bg-white' : 'border-slate-700 bg-slate-900/70'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={`text-sm font-bold uppercase tracking-[0.16em] ${isBrightMode ? 'text-gray-900' : 'text-slate-100'}`}>
                      {stageDetail.label}
                    </h4>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${getStatusClasses(stageDetail.stageStatus)}`}>
                      {stageDetail.stageStatus}
                    </span>
                  </div>

                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <dt className={isBrightMode ? 'text-gray-600' : 'text-slate-400'}>Diagnostic Score</dt>
                      <dd className={isBrightMode ? 'text-gray-900 font-semibold' : 'text-slate-100 font-semibold'}>
                        {stageDetail.diagnosticScore === null ? 'N/A' : `${stageDetail.diagnosticScore}%`}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt className={isBrightMode ? 'text-gray-600' : 'text-slate-400'}>Diagnostic Status</dt>
                      <dd>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getStatusClasses(stageDetail.diagnosticStatus)}`}>
                          {stageDetail.diagnosticStatus}
                        </span>
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt className={isBrightMode ? 'text-gray-600' : 'text-slate-400'}>Summative Status</dt>
                      <dd>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getStatusClasses(stageDetail.summativeStatus)}`}>
                          {stageDetail.summativeStatus}
                        </span>
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <dt className={isBrightMode ? 'text-gray-600' : 'text-slate-400'}>Post-test Trials</dt>
                      <dd className="w-full">
                        <div className="mt-1 grid grid-cols-3 gap-2 text-[10px] font-semibold uppercase tracking-wide text-center">
                          <span className={isBrightMode ? 'text-gray-500' : 'text-slate-400'}>Trial 1</span>
                          <span className={isBrightMode ? 'text-gray-500' : 'text-slate-400'}>Trial 2</span>
                          <span className={isBrightMode ? 'text-gray-500' : 'text-slate-400'}>Trial 3</span>
                        </div>
                        <div className={`mt-1 grid grid-cols-3 gap-2 text-center text-sm font-semibold ${isBrightMode ? 'text-gray-900' : 'text-slate-100'}`}>
                          {[0, 1, 2].map((index) => {
                            const attempt = stageDetail.summativeAttemptDetails[index]
                            const scoreValue = stageDetail.summativeScoreHistory[index]
                            const isActive = selectedTrial?.stage === stageDetail.stage && selectedTrial?.index === index
                            const canSelect = Boolean(attempt && attempt.questionIds?.length)

                            return (
                              <button
                                key={`${stageDetail.stage}-trial-${index}`}
                                type="button"
                                onClick={() => {
                                  if (canSelect) {
                                    setSelectedTrial({ stage: stageDetail.stage, index })
                                  }
                                }}
                                disabled={!canSelect}
                                className={`rounded-lg border px-2 py-1 transition ${isBrightMode ? 'border-gray-200' : 'border-slate-700'} ${
                                  isActive
                                    ? isBrightMode
                                      ? 'bg-blue-100 text-blue-700 border-blue-200'
                                      : 'bg-blue-500/20 text-blue-200 border-blue-500/40'
                                    : isBrightMode
                                      ? 'bg-white text-gray-900 hover:bg-gray-50'
                                      : 'bg-slate-900/40 text-slate-100 hover:bg-slate-800/60'
                                } ${!canSelect ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {scoreValue !== undefined ? `${scoreValue}%` : '-'}
                              </button>
                            )
                          })}
                        </div>
                        <p className={`mt-2 text-[11px] ${isBrightMode ? 'text-gray-500' : 'text-slate-400'}`}>
                          Trial Q&A is available only for attempts submitted after the Q&A tracking update.
                        </p>
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          ) : null}

          {!isLoadingDetails && selectedUser && selectedUserGainChart.length > 0 ? (
            <div className={`mt-6 rounded-2xl border p-5 ${isBrightMode ? 'border-gray-200 bg-white' : 'border-slate-700/60 bg-slate-900/70'}`}>
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <h4 className={`text-sm font-bold uppercase tracking-[0.16em] ${isBrightMode ? 'text-gray-900' : 'text-slate-100'}`}>
                  Learning Gain Visualization
                </h4>
                <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${isBrightMode ? 'text-gray-500' : 'text-slate-400'}`}>
                  Diagnostic vs Post-test · Gain line
                </p>
              </div>

              <div className="mt-4 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={selectedUserGainChart} margin={{ top: 10, right: 24, bottom: 10, left: 6 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isBrightMode ? '#e5e7eb' : '#334155'} />
                    <XAxis dataKey="stage" tick={{ fill: isBrightMode ? '#475569' : '#cbd5e1', fontSize: 12 }} />
                    <YAxis yAxisId="score" domain={[0, 100]} tick={{ fill: isBrightMode ? '#475569' : '#cbd5e1', fontSize: 12 }} />
                    <YAxis
                      yAxisId="gain"
                      orientation="right"
                      domain={gainDomain}
                      tick={{ fill: isBrightMode ? '#475569' : '#cbd5e1', fontSize: 12 }}
                    />
                    <Tooltip
                      cursor={{ fill: isBrightMode ? 'rgba(148,163,184,0.12)' : 'rgba(2,6,23,0.35)' }}
                      contentStyle={{
                        background: isBrightMode ? '#ffffff' : '#0b1220',
                        border: isBrightMode ? '1px solid #e5e7eb' : '1px solid rgba(148,163,184,0.25)',
                        borderRadius: 12,
                      }}
                      labelStyle={{ color: isBrightMode ? '#0f172a' : '#e2e8f0', fontWeight: 700 }}
                      itemStyle={{ color: isBrightMode ? '#334155' : '#e2e8f0' }}
                      formatter={(value: unknown, name?: string | number) => {
                        const label = name === undefined ? '' : String(name)
                        if (value === null || value === undefined) {
                          return ['N/A', label]
                        }

                        if (typeof value === 'number') {
                          if (label === 'Gain') {
                            const sign = value > 0 ? '+' : ''
                            return [`${sign}${value.toFixed(1)}%`, label]
                          }

                          return [`${value.toFixed(1)}%`, label]
                        }

                        return [String(value), label]
                      }}
                    />

                    <Bar
                      yAxisId="score"
                      dataKey="diagnostic"
                      name="Diagnostic"
                      fill={isBrightMode ? '#60a5fa' : '#38bdf8'}
                      radius={[8, 8, 0, 0]}
                      maxBarSize={42}
                    />
                    <Bar
                      yAxisId="score"
                      dataKey="postTest"
                      name="Post-test"
                      fill={isBrightMode ? '#a78bfa' : '#a78bfa'}
                      radius={[8, 8, 0, 0]}
                      maxBarSize={42}
                    />
                    <Line
                      yAxisId="gain"
                      type="monotone"
                      dataKey="gain"
                      name="Gain"
                      stroke={isBrightMode ? '#10b981' : '#34d399'}
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      connectNulls={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : null}

          {!isLoadingDetails && selectedUser && gapAnalysisOutputs.length > 0 ? (
            <div className={`mt-6 rounded-2xl border p-5 ${isBrightMode ? 'border-gray-200 bg-white' : 'border-slate-700/60 bg-slate-900/70'}`}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <h4 className={`text-sm font-bold uppercase tracking-[0.16em] ${isBrightMode ? 'text-gray-900' : 'text-slate-100'}`}>
                    Gap Analysis Output
                  </h4>
                  {selectedGapOutput ? (
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${getStatusClasses(selectedGapOutput.diagnosticStatus)}`}>
                      {selectedGapOutput.label} · {selectedGapOutput.diagnosticStatus}
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {gapAnalysisOutputs.map((entry) => {
                    const isActive = selectedGapStage === entry.stage
                    const canSelect = entry.diagnosticStatus !== 'Not Started'

                    return (
                      <button
                        key={`gap-stage-${entry.stage}`}
                        type="button"
                        onClick={() => {
                          if (canSelect) {
                            setSelectedGapStage(entry.stage)
                          }
                        }}
                        disabled={!canSelect}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                          isBrightMode ? 'border-gray-200' : 'border-slate-700'
                        } ${
                          isActive
                            ? isBrightMode
                              ? 'bg-blue-100 text-blue-700 border-blue-200'
                              : 'bg-blue-500/20 text-blue-200 border-blue-500/40'
                            : isBrightMode
                              ? 'bg-white text-gray-900 hover:bg-gray-50'
                              : 'bg-slate-900/40 text-slate-100 hover:bg-slate-800/60'
                        } ${!canSelect ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {entry.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {!selectedGapOutput || selectedGapOutput.diagnosticStatus === 'Not Started' ? (
                <p className={`mt-3 text-sm ${isBrightMode ? 'text-gray-600' : 'text-slate-300'}`}>
                  No submitted diagnostic assessment found for this stage.
                </p>
              ) : (
                <>
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className={`rounded-xl border p-4 ${isBrightMode ? 'border-gray-200 bg-gray-50/60' : 'border-slate-700 bg-slate-950/40'}`}>
                      <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${isBrightMode ? 'text-gray-500' : 'text-slate-400'}`}>Overall Score</p>
                      <p className={`mt-2 text-3xl font-black ${isBrightMode ? 'text-gray-900' : 'text-slate-100'}`}>
                        {typeof selectedGapOutput.overallPercentage === 'number' ? `${selectedGapOutput.overallPercentage.toFixed(2)}%` : 'N/A'}
                      </p>
                    </div>
                    <div className={`rounded-xl border p-4 ${isBrightMode ? 'border-gray-200 bg-gray-50/60' : 'border-slate-700 bg-slate-950/40'}`}>
                      <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${isBrightMode ? 'text-gray-500' : 'text-slate-400'}`}>Knowledge Gaps</p>
                      <p className={`mt-2 text-3xl font-black ${isBrightMode ? 'text-gray-900' : 'text-slate-100'}`}>{selectedGapOutput.knowledgeGaps}</p>
                      <p className={`mt-1 text-xs ${isBrightMode ? 'text-gray-600' : 'text-slate-300'}`}>Modules below {GAP_ANALYSIS_THRESHOLD}%</p>
                    </div>
                    <div className={`rounded-xl border p-4 ${isBrightMode ? 'border-gray-200 bg-gray-50/60' : 'border-slate-700 bg-slate-950/40'}`}>
                      <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${isBrightMode ? 'text-gray-500' : 'text-slate-400'}`}>Modules Tracked</p>
                      <p className={`mt-2 text-3xl font-black ${isBrightMode ? 'text-gray-900' : 'text-slate-100'}`}>{selectedGapOutput.moduleResults.length}</p>
                    </div>
                  </div>

                  {selectedGapOutput.moduleResults.length > 0 ? (
                    <div className={`mt-5 overflow-hidden rounded-xl border ${isBrightMode ? 'border-gray-200/70' : 'border-slate-700'}`}>
                      <div className={`grid grid-cols-12 gap-3 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] ${isBrightMode ? 'bg-gray-50 text-gray-500' : 'bg-slate-950/40 text-slate-400'}`}>
                        <span className="col-span-7">Module</span>
                        <span className="col-span-2 text-right">Score</span>
                        <span className="col-span-3 text-right">Wrong</span>
                      </div>
                      <div className={isBrightMode ? 'bg-white' : 'bg-slate-900/40'}>
                        {selectedGapOutput.moduleResults.map((entry) => {
                          const isPassing = entry.modulePerformance >= GAP_ANALYSIS_THRESHOLD
                          const scoreColor = isPassing
                            ? isBrightMode
                              ? 'text-emerald-700'
                              : 'text-emerald-300'
                            : isBrightMode
                              ? 'text-rose-700'
                              : 'text-rose-300'

                          return (
                            <div
                              key={`gap-module-${selectedGapOutput.stage}-${entry.competencyCode}`}
                              className={`grid grid-cols-12 gap-3 border-t px-4 py-3 text-sm ${
                                isBrightMode ? 'border-gray-100 text-gray-800' : 'border-slate-800 text-slate-100'
                              }`}
                            >
                              <div className="col-span-7">
                                <p className="font-semibold">{entry.module}</p>
                                <p className={`mt-0.5 text-[11px] ${isBrightMode ? 'text-gray-500' : 'text-slate-400'}`}>{entry.competencyCode}</p>
                              </div>
                              <div className={`col-span-2 text-right font-bold ${scoreColor}`}>
                                {Number.isFinite(entry.modulePerformance) ? `${entry.modulePerformance.toFixed(2)}%` : '0%'}
                              </div>
                              <div className={`col-span-3 text-right text-xs ${isBrightMode ? 'text-gray-600' : 'text-slate-300'}`}>
                                {entry.wrongQuestions}/{entry.totalQuestions}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className={`mt-3 text-sm ${isBrightMode ? 'text-gray-600' : 'text-slate-300'}`}>
                      No saved module breakdown found for this stage.
                    </p>
                  )}
                </>
              )}
            </div>
          ) : null}

          {selectedTrial ? (
            <div className={`mt-6 rounded-2xl border p-5 ${isBrightMode ? 'border-gray-200 bg-white' : 'border-slate-700/60 bg-slate-900/70'}`}>
              <div className="flex items-center justify-between gap-2">
                <h4 className={`text-sm font-bold uppercase tracking-[0.16em] ${isBrightMode ? 'text-gray-900' : 'text-slate-100'}`}>
                  Post-test Trial Details
                </h4>
                <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${isBrightMode ? 'text-gray-500' : 'text-slate-400'}`}>
                  {selectedUserDetails.find((detail) => detail.stage === selectedTrial.stage)?.label} · Trial {selectedTrial.index + 1}
                </span>
              </div>

              {!selectedTrialDetail ? (
                <p className={`mt-3 text-sm ${isBrightMode ? 'text-gray-600' : 'text-slate-300'}`}>
                  No saved responses for this trial.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {selectedTrialQuestions.map((question, index) => (
                    <div
                      key={`trial-question-${question.id}`}
                      className={`rounded-xl border p-4 ${isBrightMode ? 'border-gray-200 bg-gray-50/60' : 'border-slate-700 bg-slate-950/40'}`}
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${isBrightMode ? 'text-gray-500' : 'text-slate-400'}`}>
                          Q{index + 1}
                        </span>
                        <span className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${isBrightMode ? 'text-gray-500' : 'text-slate-400'}`}>
                          {question.module}
                        </span>
                      </div>
                      <p className={`mt-2 text-sm font-semibold ${isBrightMode ? 'text-gray-900' : 'text-slate-100'}`}>{question.question}</p>
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        <div className={`rounded-lg border px-3 py-2 text-xs ${isBrightMode ? 'border-gray-200 bg-white text-gray-700' : 'border-slate-700 bg-slate-900 text-slate-300'}`}>
                          <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${isBrightMode ? 'text-gray-500' : 'text-slate-400'}`}>User Answer</p>
                          <p className={`mt-1 text-sm ${question.selectedIndex === question.correctIndex ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {question.selectedIndex === undefined ? 'No answer' : question.options[question.selectedIndex]}
                          </p>
                        </div>
                        <div className={`rounded-lg border px-3 py-2 text-xs ${isBrightMode ? 'border-gray-200 bg-white text-gray-700' : 'border-slate-700 bg-slate-900 text-slate-300'}`}>
                          <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${isBrightMode ? 'text-gray-500' : 'text-slate-400'}`}>Correct Answer</p>
                          <p className="mt-1 text-sm text-emerald-600">{question.options[question.correctIndex]}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </article>
      </section>
    </main>
  )
}

export default AdminDashboardPage
