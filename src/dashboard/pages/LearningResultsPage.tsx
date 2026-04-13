import { onAuthStateChanged } from 'firebase/auth'
import { motion } from 'framer-motion'
import {
  RotateCcw,
  Trophy,
  TrendingUp,
  Target,
  BookOpen,
  ChevronRight,
  CheckCircle2,
  Award,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useBrightness } from '@/contexts/BrightnessContext'
import { useGradingStage } from '@/contexts/GradingStageContext'
import {
  getStageDiagnosticRecord,
  getStageSummativeRecord,
  getLearningStageConfig,
  LEARNING_STAGE_ORDER,
  resolveStageForSelection,
  type LearningStageKey,
} from '../data/learningStage'
import { auth } from '../../lib/firebase'
import { ROUTE_PATHS } from '../../routes/paths'
import {
  getUserAssessmentProgress,
  clearReviewerData,
} from '../../services/assessmentProgress'

type ScoreMetric = {
  label: string
  value: string
  icon: React.ReactNode
  isHighlight?: boolean
}

const formatPercent = (value: number) => {
  if (Number.isInteger(value)) {
    return `${value}%`
  }

  return `${value.toFixed(2)}%`
}

const SUMMATIVE_MAX_FAILED_ATTEMPTS = 3

const LearningResultsPage = () => {
  const navigate = useNavigate()
  const { isBrightMode } = useBrightness()
  const { selectedStage, setSelectedStage } = useGradingStage()
  const [uid, setUid] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [resultStage, setResultStage] = useState<LearningStageKey | null>(null)
  const [passed, setPassed] = useState<boolean | null>(null)
  const [posttestPercentage, setPosttestPercentage] = useState<number>(0)
  const [pretestPercentage, setPretestPercentage] = useState<number>(0)
  const [failedAttempts, setFailedAttempts] = useState<number>(0)
  const [isSummativeLocked, setIsSummativeLocked] = useState<boolean>(false)
  const [summativeScoreHistory, setSummativeScoreHistory] = useState<number[]>([])
  const [isResettingReviewer, setIsResettingReviewer] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    let isCancelled = false

    const loadResults = async () => {
      setIsLoading(true)

      if (!uid) {
        if (!isCancelled) {
          setIsLoading(false)
        }
        return
      }

      const assessmentRecords = await getUserAssessmentProgress(uid)

      if (isCancelled) {
        return
      }

      const assessmentMap = new Map(assessmentRecords.map((record) => [record.assessmentKey, record]))
      const activeStage = resolveStageForSelection(assessmentMap, selectedStage)
      const activeStageSummative = getStageSummativeRecord(assessmentMap, activeStage)

      if (!activeStageSummative || (!activeStageSummative.isSubmitted && !activeStageSummative.isFinished)) {
        setResultStage(null)
        setPassed(null)
        setPosttestPercentage(0)
        setPretestPercentage(0)
        setFailedAttempts(0)
        setIsSummativeLocked(false)
        setSummativeScoreHistory([])
      } else {
        const stageDiagnostic = getStageDiagnosticRecord(assessmentMap, activeStage)
        const attempts = Math.max(0, Number(activeStageSummative.failedAttempts ?? 0))
        const locked = activeStageSummative.isLocked === true || attempts >= SUMMATIVE_MAX_FAILED_ATTEMPTS
        const history = Array.isArray(activeStageSummative.scoreHistory)
          ? activeStageSummative.scoreHistory
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value))
          : []

        setResultStage(activeStage)
        setPassed(activeStageSummative.passed === true)
        setPosttestPercentage(typeof activeStageSummative.percentage === 'number' ? activeStageSummative.percentage : 0)
        setPretestPercentage(typeof stageDiagnostic?.percentage === 'number' ? stageDiagnostic.percentage : 0)
        setFailedAttempts(attempts)
        setIsSummativeLocked(locked)
        setSummativeScoreHistory(history)
      }

      setIsLoading(false)
    }

    void loadResults()

    return () => {
      isCancelled = true
    }
  }, [uid, selectedStage])

  const improvement = posttestPercentage - pretestPercentage
  const previousSummativeScores = summativeScoreHistory.length > 1 ? summativeScoreHistory.slice(0, -1) : []

  const nextStage = useMemo(() => {
    if (!resultStage) {
      return null
    }

    const index = LEARNING_STAGE_ORDER.indexOf(resultStage)
    if (index < 0 || index >= LEARNING_STAGE_ORDER.length - 1) {
      return null
    }

    return LEARNING_STAGE_ORDER[index + 1]
  }, [resultStage])

  const metrics: ScoreMetric[] = [
    { label: 'Before (Pre-Test)', value: formatPercent(pretestPercentage), icon: <Target size={20} /> },
    { label: 'After (Post-Test)', value: formatPercent(posttestPercentage), icon: <Trophy size={20} />, isHighlight: true },
    {
      label: 'Improvement',
      value: `${improvement >= 0 ? '+' : ''}${formatPercent(improvement).replace('%', '')}%`,
      icon: <TrendingUp size={20} />,
    },
  ]

  const steps = ['Learn Modules', 'Pre-Test', 'Gap Analysis', 'Personalized Study', 'Post-Test', 'Results']

  if (isLoading) {
    return (
      <section className={`rounded-3xl border p-8 ${isBrightMode ? 'border-gray-200 bg-white text-gray-900' : 'border-white/10 bg-[#050505] text-slate-200'}`}>
        Loading learning results...
      </section>
    )
  }

  if (!resultStage || passed === null) {
    return (
      <section className={`rounded-3xl border p-8 ${isBrightMode ? 'border-gray-200 bg-white text-gray-900' : 'border-white/10 bg-[#050505] text-slate-200'}`}>
        <h1 className={`text-3xl font-black ${isBrightMode ? 'text-gray-900' : 'text-white'}`}>Learning Results</h1>
        <p className={`mt-3 ${isBrightMode ? 'text-gray-600' : 'text-slate-400'}`}>
          Complete a summative post-test first to view your results.
        </p>
        <Link
          to={ROUTE_PATHS.dashboard.postTest}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-blue-700"
        >
          Go to Summative Post-test
          <ChevronRight size={14} />
        </Link>
      </section>
    )
  }

  const stageLabel = getLearningStageConfig(resultStage).label
  const handleContinue = () => {
    if (nextStage) {
      setSelectedStage(nextStage)
    }

    navigate(ROUTE_PATHS.dashboard.modules)
  }

  const handleResetReviewer = async () => {
    if (!uid || !resultStage || isResettingReviewer) {
      return
    }

    setIsResettingReviewer(true)

    const assessmentKey = getLearningStageConfig(resultStage).diagnosticAssessmentKey

    try {
      await clearReviewerData({ uid, assessmentKey })

      navigate(ROUTE_PATHS.dashboard.studyPlan, {
        state: {
          redirectNotice: 'Reviewer cleared. Choose a format and create a new one.',
        },
      })
    } finally {
      setIsResettingReviewer(false)
    }
  }

  return (
    <div className={`min-h-screen rounded-3xl p-6 md:p-10 font-sans ${isBrightMode ? 'bg-white text-gray-900' : 'bg-[#050505] text-slate-200'}`}>
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        <div className="w-full flex items-center justify-between mb-16 relative">
          <div className={`absolute top-1/2 left-0 w-full h-px -translate-y-1/2 z-0 ${isBrightMode ? 'bg-gray-200' : 'bg-white/10'}`} />
          {steps.map((step, index) => (
            <div key={step} className="relative z-10 flex flex-col items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
                  index === steps.length - 1
                    ? 'bg-blue-600 border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.5)]'
                    : 'bg-emerald-500 border-emerald-400'
                }`}
              >
                {index === steps.length - 1 ? <Trophy size={14} className="text-white" /> : <CheckCircle2 size={14} className="text-white" />}
              </div>
              <span className={`text-[8px] font-black uppercase tracking-widest whitespace-nowrap ${isBrightMode ? 'text-emerald-600' : 'text-emerald-400/90'}`}>
                {step}
              </span>
            </div>
          ))}
        </div>

        <div className="text-center space-y-6 mb-12">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            className={`inline-flex h-20 w-20 rounded-3xl items-center justify-center mb-4 ${passed ? 'bg-emerald-600 shadow-[0_0_40px_rgba(5,150,105,0.3)]' : 'bg-orange-500 shadow-[0_0_40px_rgba(249,115,22,0.3)]'}`}
          >
            {passed ? <Trophy size={40} className="text-white" /> : <RotateCcw size={40} className="text-white" />}
          </motion.div>

          <div className="space-y-2">
            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${passed ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-orange-500/10 border border-orange-500/20 text-orange-400'}`}>
              {passed ? 'Stage Cleared' : 'Almost There'}
            </span>
            <h1 className={`text-5xl md:text-6xl font-black italic uppercase tracking-tighter ${isBrightMode ? 'text-gray-900' : 'text-white'}`}>
              {passed ? 'Excellent Work!' : 'Good Effort!'}
            </h1>
            <p className={`text-sm max-w-md mx-auto leading-relaxed ${isBrightMode ? 'text-gray-600' : 'text-slate-500'}`}>
              {passed
                ? `You passed the ${stageLabel} post-test with ${formatPercent(posttestPercentage)}. ${nextStage ? `You can now move to ${getLearningStageConfig(nextStage).label}.` : 'You completed the final stage.'}`
                : `You scored ${formatPercent(posttestPercentage)}, and you need at least 75% to advance. Review your weak topics and try again.`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-10">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-8 rounded-4xl border flex flex-col items-center justify-center gap-4 transition-all ${
                metric.isHighlight
                  ? passed
                    ? 'bg-emerald-500/5 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                    : 'bg-orange-500/5 border-orange-500/40 shadow-lg shadow-orange-500/5'
                  : isBrightMode ? 'bg-blue-50 border-blue-200' : 'bg-[#07163a] border-blue-500/20'
              }`}
            >
              <div className={metric.isHighlight ? (passed ? 'text-emerald-500' : 'text-orange-500') : 'text-blue-500'}>
                {metric.icon}
              </div>
              <div className="text-center">
                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isBrightMode ? 'text-gray-600' : 'text-slate-500'}`}>
                  {metric.label}
                </p>
                <p className={`text-4xl font-black ${metric.isHighlight ? (passed ? 'text-emerald-500' : 'text-orange-500') : 'text-blue-500'}`}>
                  {metric.value}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className={`w-full border rounded-[2.5rem] p-10 text-center space-y-8 relative overflow-hidden ${isBrightMode ? 'border-blue-200 bg-blue-50' : 'border-blue-500/20 bg-[#07163a]'}`}>
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className={`flex items-center gap-2 ${passed ? 'text-emerald-500' : 'text-orange-500'}`}>
              <BookOpen size={20} />
              <h3 className="text-xs font-black uppercase tracking-[0.3em]">
                {passed ? 'Keep your momentum' : 'You can do better'}
              </h3>
            </div>
            <p className={`text-sm max-w-lg mx-auto leading-relaxed ${isBrightMode ? 'text-gray-600' : 'text-slate-500'}`}>
              {passed
                ? 'Review your study materials to reinforce retention before starting the next stage.'
                : 'Review your study plan and focus on weak topics. When you are ready, retake the post-test and aim for 75% to advance.'}
            </p>
            {!passed && (
              <p className={`text-xs font-semibold ${isBrightMode ? 'text-gray-700' : 'text-slate-300'}`}>
                {isSummativeLocked
                  ? `Post-test locked permanently after ${SUMMATIVE_MAX_FAILED_ATTEMPTS} failed attempts.`
                  : `Remaining tries: ${Math.max(SUMMATIVE_MAX_FAILED_ATTEMPTS - failedAttempts, 0)} of ${SUMMATIVE_MAX_FAILED_ATTEMPTS}`}
              </p>
            )}
            {previousSummativeScores.length > 0 && (
              <p className={`text-xs ${isBrightMode ? 'text-gray-700' : 'text-slate-300'}`}>
                Previous post-test scores: {previousSummativeScores.map((value) => formatPercent(value)).join(', ')}
              </p>
            )}

           <div className="flex flex-col sm:flex-row gap-4 pt-4">
            {!passed && (
              <>
                <Link
                  to={ROUTE_PATHS.dashboard.postTestGapAnalysis}
                  className={`h-14 px-10 rounded-2xl border transition-all font-black uppercase text-[10px] tracking-[0.2em] inline-flex items-center gap-3 ${isBrightMode ? 'border-blue-300 bg-blue-100 hover:bg-blue-200 text-blue-900' : 'border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400'}`}
                >
                  <Target size={16} /> Gap Analysis
                </Link>
                <Link
                  to={ROUTE_PATHS.dashboard.review}
                  className={`h-14 px-10 rounded-2xl border transition-all font-black uppercase text-[10px] tracking-[0.2em] inline-flex items-center gap-3 ${isBrightMode ? 'border-gray-300 bg-gray-100 hover:bg-gray-200 text-gray-900' : 'border-white/30 bg-white/5 hover:bg-white/10 text-white'}`}
                >
                  <BookOpen size={16} /> Review
                </Link>
                <button
                  type="button"
                  onClick={handleResetReviewer}
                  disabled={isResettingReviewer}
                  className={`h-14 px-10 rounded-2xl border transition-all font-black uppercase text-[10px] tracking-[0.2em] inline-flex items-center gap-3 ${isBrightMode ? 'border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700' : 'border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300'} ${isResettingReviewer ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <RotateCcw size={16} /> Reset Reviewer
                </button>
              </>
            )}

              {passed ? (
                resultStage === 'final' ? (
                  <button
                    type="button"
                    onClick={() => navigate(ROUTE_PATHS.dashboard.certification)}
                    className="h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-[10px] tracking-[0.2em] inline-flex items-center gap-3 transition-all shadow-lg shadow-blue-600/20"
                  >
                    <Award size={16} /> View Certification
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleContinue}
                    className="h-14 px-10 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[10px] tracking-[0.2em] inline-flex items-center gap-3 transition-all shadow-lg shadow-emerald-600/20"
                  >
                    <ChevronRight size={16} /> {nextStage ? `Continue to ${getLearningStageConfig(nextStage).label}` : 'Continue Modules'}
                  </button>
                )
              ) : isSummativeLocked ? (
                <button
                  type="button"
                  disabled
                  className="h-14 px-10 rounded-2xl bg-slate-500/40 text-white/80 font-black uppercase text-[10px] tracking-[0.2em] inline-flex items-center gap-3 cursor-not-allowed"
                >
                  <RotateCcw size={16} /> Retake Locked
                </button>
              ) : (
                <Link
                  to={ROUTE_PATHS.dashboard.postTest}
                  state={{ retake: true }}
                  className="h-14 px-10 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-black uppercase text-[10px] tracking-[0.2em] inline-flex items-center gap-3 transition-all shadow-lg shadow-orange-600/20"
                >
                  <RotateCcw size={16} /> Retake Post-Test
                </Link>
              )}
            </div>
          </div>

          <div className={`absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-[100px] ${passed ? 'bg-emerald-600/10' : 'bg-orange-600/8'}`} />
        </div>
      </div>
    </div>
  )
}

export default LearningResultsPage
