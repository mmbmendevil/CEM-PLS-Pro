import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BarChart3, LogOut, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useBrightness } from '@/contexts/BrightnessContext'
import type { LearningStageKey } from '@/dashboard/data/learningStage'
import { ROUTE_PATHS } from '@/routes/paths'
import { signOutAdmin } from '@/services/adminAuth'
import { getAdminItemAnalysis, type AdminItemAnalysisMode, type AdminItemAnalysisRow } from '@/services/admin'

const STAGES: Array<{ key: LearningStageKey; label: string }> = [
  { key: 'prelim', label: 'Prelim' },
  { key: 'midterm', label: 'Midterm' },
  { key: 'final', label: 'Final' },
]

const MODES: Array<{ key: AdminItemAnalysisMode; label: string }> = [
  { key: 'summative', label: 'Summative Post-test' },
  { key: 'diagnostic', label: 'Diagnostic Pretest' },
]

const formatLetter = (index: number) => String.fromCharCode(65 + index)

const AdminItemAnalysisPage = () => {
  const navigate = useNavigate()
  const { isBrightMode } = useBrightness()

  const [stage, setStage] = useState<LearningStageKey>('prelim')
  const [mode, setMode] = useState<AdminItemAnalysisMode>('summative')
  const [minAttempts, setMinAttempts] = useState(5)
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<'module' | 'difficulty' | 'discrimination' | 'attempts'>('module')
  const [rows, setRows] = useState<AdminItemAnalysisRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const load = async (refreshing = false) => {
    if (refreshing) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    setErrorMessage('')

    try {
      const result = await getAdminItemAnalysis({ stage, mode })
      setRows(result)
    } catch {
      setRows([])
      setErrorMessage('Unable to load item analysis. Check Firestore permissions for collectionGroup reads.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, mode])

  const handleLogout = () => {
    signOutAdmin()
    navigate(ROUTE_PATHS.admin.login, { replace: true })
  }

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return rows.filter((row) => {
      if (row.attempts < minAttempts) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      return (
        row.module.toLowerCase().includes(normalizedQuery) ||
        row.question.toLowerCase().includes(normalizedQuery) ||
        row.competencyCode.toLowerCase().includes(normalizedQuery) ||
        String(row.questionId).includes(normalizedQuery)
      )
    })
  }, [minAttempts, query, rows])

  const sortedRows = useMemo(() => {
    const next = [...filteredRows]

    next.sort((first, second) => {
      if (sortBy === 'attempts') {
        return second.attempts - first.attempts
      }

      if (sortBy === 'difficulty') {
        return first.percentCorrect - second.percentCorrect
      }

      if (sortBy === 'discrimination') {
        const firstDisc = first.discrimination ?? -999
        const secondDisc = second.discrimination ?? -999
        return secondDisc - firstDisc
      }

      if (first.module !== second.module) {
        return first.module.localeCompare(second.module)
      }

      return first.questionId - second.questionId
    })

    return next
  }, [filteredRows, sortBy])

  const surface = isBrightMode ? 'border-gray-200 bg-white' : 'border-slate-700/60 bg-slate-900/70'

  return (
    <main className={`min-h-screen p-8 ${isBrightMode ? 'bg-[#fffdf7]' : 'bg-[#0f172a]'}`}>
      <section className="mx-auto w-full max-w-6xl space-y-6">
        <header
          className={`rounded-3xl border p-7 ${
            isBrightMode
              ? 'border-gray-200 bg-linear-to-r from-white via-blue-50 to-cyan-50'
              : 'border-slate-700/60 bg-linear-to-r from-slate-900 via-slate-900 to-blue-950/40'
          }`}
        >
          <div className="flex flex-wrap items-center gap-3">
            <div className={`rounded-2xl p-2 ${isBrightMode ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-300'}`}>
              <BarChart3 size={22} />
            </div>
            <div className="min-w-[220px]">
              <h1 className={`text-2xl font-bold tracking-tight ${isBrightMode ? 'text-gray-900' : 'text-slate-100'}`}>Item Analysis</h1>
              <p className={`mt-1 text-sm ${isBrightMode ? 'text-gray-600' : 'text-slate-300'}`}>
                Question difficulty, discrimination, and distractor selection.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate(ROUTE_PATHS.admin.home)}
              className={`ml-auto inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                isBrightMode ? 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50' : 'border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800'
              }`}
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <button
              type="button"
              onClick={() => void load(true)}
              disabled={isRefreshing}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                isBrightMode ? 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50' : 'border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800'
              } ${isRefreshing ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              Refresh
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                isBrightMode ? 'border-red-300 bg-white text-red-700 hover:bg-red-50' : 'border-red-500/50 bg-red-950/30 text-red-200 hover:bg-red-900/40'
              }`}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </header>

        {errorMessage ? (
          <article className={`rounded-2xl border px-4 py-3 text-sm ${isBrightMode ? 'border-red-200 bg-red-50 text-red-800' : 'border-red-500/40 bg-red-950/30 text-red-200'}`}>
            {errorMessage}
          </article>
        ) : null}

        <article className={`rounded-2xl border p-5 ${surface}`}>
          <div className="grid gap-4 md:grid-cols-4">
            <label className="block space-y-1.5">
              <span className={`text-xs font-semibold uppercase tracking-[0.2em] ${isBrightMode ? 'text-gray-500' : 'text-slate-400'}`}>Stage</span>
              <select
                value={stage}
                onChange={(event) => setStage(event.target.value as LearningStageKey)}
                className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition ${
                  isBrightMode ? 'border-gray-300 bg-white text-gray-900 focus:border-blue-500' : 'border-slate-600 bg-slate-950/60 text-slate-100 focus:border-blue-400'
                }`}
              >
                {STAGES.map((entry) => (
                  <option key={entry.key} value={entry.key}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className={`text-xs font-semibold uppercase tracking-[0.2em] ${isBrightMode ? 'text-gray-500' : 'text-slate-400'}`}>Assessment</span>
              <select
                value={mode}
                onChange={(event) => setMode(event.target.value as AdminItemAnalysisMode)}
                className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition ${
                  isBrightMode ? 'border-gray-300 bg-white text-gray-900 focus:border-blue-500' : 'border-slate-600 bg-slate-950/60 text-slate-100 focus:border-blue-400'
                }`}
              >
                {MODES.map((entry) => (
                  <option key={entry.key} value={entry.key}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className={`text-xs font-semibold uppercase tracking-[0.2em] ${isBrightMode ? 'text-gray-500' : 'text-slate-400'}`}>Min attempts</span>
              <input
                type="number"
                min={0}
                value={minAttempts}
                onChange={(event) => {
                  const nextValue = Number(event.target.value)
                  setMinAttempts(Number.isFinite(nextValue) ? Math.max(0, nextValue) : 0)
                }}
                className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition ${
                  isBrightMode ? 'border-gray-300 bg-white text-gray-900 focus:border-blue-500' : 'border-slate-600 bg-slate-950/60 text-slate-100 focus:border-blue-400'
                }`}
              />
            </label>

            <label className="block space-y-1.5">
              <span className={`text-xs font-semibold uppercase tracking-[0.2em] ${isBrightMode ? 'text-gray-500' : 'text-slate-400'}`}>Sort</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
                className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition ${
                  isBrightMode ? 'border-gray-300 bg-white text-gray-900 focus:border-blue-500' : 'border-slate-600 bg-slate-950/60 text-slate-100 focus:border-blue-400'
                }`}
              >
                <option value="module">Module</option>
                <option value="attempts">Attempts</option>
                <option value="difficulty">Difficulty (% correct)</option>
                <option value="discrimination">Discrimination</option>
              </select>
            </label>
          </div>

          <div className="mt-4">
            <label className="block space-y-1.5">
              <span className={`text-xs font-semibold uppercase tracking-[0.2em] ${isBrightMode ? 'text-gray-500' : 'text-slate-400'}`}>Search</span>
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Module, competency code, question text, or ID..."
                className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition ${
                  isBrightMode ? 'border-gray-300 bg-white text-gray-900 focus:border-blue-500' : 'border-slate-600 bg-slate-950/60 text-slate-100 focus:border-blue-400'
                }`}
              />
            </label>
          </div>
        </article>

        <article className={`rounded-2xl border p-5 ${surface}`}>
          {isLoading ? (
            <p className={`text-sm ${isBrightMode ? 'text-gray-600' : 'text-slate-300'}`}>Loading item analysis...</p>
          ) : sortedRows.length === 0 ? (
            <p className={`text-sm ${isBrightMode ? 'text-gray-600' : 'text-slate-300'}`}>
              No rows match the current filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className={`${isBrightMode ? 'text-gray-600' : 'text-slate-300'}`}>
                    <th className="py-2 pr-4 text-[11px] font-black uppercase tracking-[0.18em]">Item</th>
                    <th className="py-2 pr-4 text-[11px] font-black uppercase tracking-[0.18em]">Module</th>
                    <th className="py-2 pr-4 text-[11px] font-black uppercase tracking-[0.18em]">Attempts</th>
                    <th className="py-2 pr-4 text-[11px] font-black uppercase tracking-[0.18em]">% Correct</th>
                    <th className="py-2 pr-4 text-[11px] font-black uppercase tracking-[0.18em]">Disc.</th>
                    <th className="py-2 pr-4 text-[11px] font-black uppercase tracking-[0.18em]">Key</th>
                    <th className="py-2 pr-4 text-[11px] font-black uppercase tracking-[0.18em]">Distractors</th>
                    <th className="py-2 text-[11px] font-black uppercase tracking-[0.18em]">Question</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((row) => {
                    const correctLetter = formatLetter(row.correctAnswerIndex)
                    const distractorSummary = row.optionPercents
                      .map((percent, index) => ({
                        index,
                        percent,
                        isCorrect: index === row.correctAnswerIndex,
                      }))
                      .filter((entry) => !entry.isCorrect)
                      .sort((a, b) => b.percent - a.percent)
                      .slice(0, 2)
                      .map((entry) => `${formatLetter(entry.index)} ${entry.percent}%`)
                      .join(' · ')

                    return (
                      <tr key={row.questionId} className={`${isBrightMode ? 'border-t border-gray-200' : 'border-t border-slate-700/60'}`}>
                        <td className={`py-3 pr-4 font-semibold ${isBrightMode ? 'text-gray-900' : 'text-slate-100'}`}>#{row.questionId}</td>
                        <td className={`py-3 pr-4 ${isBrightMode ? 'text-gray-800' : 'text-slate-200'}`}>
                          <div className="font-semibold">{row.module}</div>
                          <div className={`mt-0.5 text-[11px] ${isBrightMode ? 'text-gray-500' : 'text-slate-400'}`}>
                            {row.competencyCode} · {row.bloomLevel}
                          </div>
                        </td>
                        <td className={`py-3 pr-4 ${isBrightMode ? 'text-gray-800' : 'text-slate-200'}`}>{row.attempts}</td>
                        <td className={`py-3 pr-4 font-semibold ${isBrightMode ? 'text-gray-900' : 'text-slate-100'}`}>{row.percentCorrect}%</td>
                        <td className={`py-3 pr-4 ${isBrightMode ? 'text-gray-800' : 'text-slate-200'}`}>
                          {row.discrimination === null ? '-' : row.discrimination}
                        </td>
                        <td className={`py-3 pr-4 font-black ${isBrightMode ? 'text-emerald-700' : 'text-emerald-300'}`}>{correctLetter}</td>
                        <td className={`py-3 pr-4 ${isBrightMode ? 'text-gray-800' : 'text-slate-200'}`}>
                          {distractorSummary || '-'}
                        </td>
                        <td className={`py-3 ${isBrightMode ? 'text-gray-800' : 'text-slate-200'}`}>
                          <p className="max-w-[520px] leading-snug">{row.question}</p>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>
    </main>
  )
}

export default AdminItemAnalysisPage
