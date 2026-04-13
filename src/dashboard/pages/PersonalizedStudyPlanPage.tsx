import { onAuthStateChanged } from 'firebase/auth'
import { ArrowRight, Brain, CircleDot, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useBrightness } from '../../contexts/BrightnessContext'
import { useGradingStage } from '@/contexts/GradingStageContext'
import { getLearningStageConfig, getStageDiagnosticRecord, getStageSummativeRecord, resolveStageForSelection } from '../data/learningStage'
import {
  getDiagnosticQuestionPoolForStage,
  getDiagnosticQuestionsByIdsForStage,
  normalizeSelectedAnswersForStage,
} from '../data/diagnosticQuestions'
import {
  buildFallbackReviewer,
  buildReviewerPrompt,
  getReviewerSystemInstruction,
  reviewerPreferenceOptions,
  type ReviewerPreference,
} from '../data/reviewerPromptBuilder'
import { auth } from '../../lib/firebase'
import { ROUTE_PATHS } from '../../routes/paths'
import type { AssessmentCompetencyBreakdown, AssessmentProgressRecord } from '../../services/assessmentProgress'
import {
  getUserAssessmentProgress,
  loadReviewerNarrationScript,
  saveReviewerNarrationScript,
  upsertAssessmentProgress,
} from '../../services/assessmentProgress'
import { sendOpenAIChat } from '../../services/openai'

type PlanPhase = 'setup' | 'initializing' | 'ready'

type InitStep = {
  id: number
  label: string
}

const initSteps: InitStep[] = [
  { id: 1, label: 'Reading diagnostic result set' },
  { id: 2, label: 'Basing users learning performance' },
  { id: 3, label: 'Building reviewer payload' },
  { id: 4, label: 'Finalizing reviewer output' },
]

const buildCompetencyBreakdown = (
  questions: Array<{
    competencyCode: string
    correctAnswerIndex: number
    id: number
  }>,
  selectedAnswers: Record<number, number>,
) => {
  const breakdown: AssessmentCompetencyBreakdown = {}

  for (const question of questions) {
    const competency = question.competencyCode
    if (!breakdown[competency]) {
      breakdown[competency] = { correct: 0, total: 0, percentage: 0 }
    }

    const isCorrect = selectedAnswers[question.id] === question.correctAnswerIndex
    breakdown[competency].total += 1
    breakdown[competency].correct += isCorrect ? 1 : 0
  }

  Object.values(breakdown).forEach((entry) => {
    entry.percentage = entry.total > 0 ? Number(((entry.correct / entry.total) * 100).toFixed(2)) : 0
  })

  return breakdown
}

const PersonalizedStudyPlanPage = () => {
  const { isBrightMode } = useBrightness()
  const { selectedStage } = useGradingStage()
  const location = useLocation()
  const navigate = useNavigate()
  const [uid, setUid] = useState<string | null>(null)
  const [isLoadingAccess, setIsLoadingAccess] = useState(true)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [phase, setPhase] = useState<PlanPhase>('setup')
  const [assessmentKey, setAssessmentKey] = useState(getLearningStageConfig('prelim').diagnosticAssessmentKey)
  const [activeStage, setActiveStage] = useState<'prelim' | 'midterm' | 'final'>('prelim')
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [initProgress, setInitProgress] = useState(0)
  const [reviewerPreference, setReviewerPreference] = useState<ReviewerPreference>('flashcards')
  const [score, setScore] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [percentage, setPercentage] = useState(0)
  const [, setPassedPretest] = useState(false)
  const [competencyBreakdown, setCompetencyBreakdown] = useState<AssessmentCompetencyBreakdown>({})
  const [questionIds, setQuestionIds] = useState<number[]>([])
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [aiReviewer, setAiReviewer] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [diagnosticRecord, setDiagnosticRecord] = useState<AssessmentProgressRecord | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    let isCancelled = false

    const loadProgress = async () => {
      setIsLoadingAccess(true)

      if (!uid) {
        if (!isCancelled) {
          setIsUnlocked(false)
          setIsLoadingAccess(false)
        }
        return
      }

      const assessmentRecords = await getUserAssessmentProgress(uid)

      if (isCancelled) {
        return
      }

      const assessmentMap = new Map(assessmentRecords.map((record) => [record.assessmentKey, record]))
      const activeStage = resolveStageForSelection(assessmentMap, selectedStage)
      const activeStageConfig = getLearningStageConfig(activeStage)
      const diagnosticRecord = getStageDiagnosticRecord(assessmentMap, activeStage)
      const summativeRecord = getStageSummativeRecord(assessmentMap, activeStage)
      const hasSummative = Boolean(summativeRecord?.isSubmitted === true || summativeRecord?.isFinished === true)
      const reviewerSourceRecord = hasSummative ? summativeRecord : diagnosticRecord
      setActiveStage(activeStage)
      setAssessmentKey(activeStageConfig.diagnosticAssessmentKey)

      setDiagnosticRecord(diagnosticRecord ?? null)
      setIsUnlocked(diagnosticRecord?.isStudyPlanUnlocked === true)
      setScore(reviewerSourceRecord?.score ?? 0)
      setTotalItems(reviewerSourceRecord?.totalItems ?? getDiagnosticQuestionPoolForStage(activeStage).length)
      setPercentage(reviewerSourceRecord?.percentage ?? 0)
      setPassedPretest(diagnosticRecord?.passed === true)

      const reviewerQuestionIds = (reviewerSourceRecord?.questionIds ?? []).map(Number).filter((questionId) => Number.isFinite(questionId))
      const reviewerSelectedAnswers = normalizeSelectedAnswersForStage(
        Object.fromEntries(
          Object.entries(reviewerSourceRecord?.selectedAnswers ?? {}).map(([questionId, answerIndex]) => [Number(questionId), Number(answerIndex)]),
        ),
        activeStage,
      )

      const reviewerQuestions = reviewerQuestionIds.length > 0
        ? getDiagnosticQuestionsByIdsForStage(reviewerQuestionIds, activeStage)
        : getDiagnosticQuestionPoolForStage(activeStage)

      setCompetencyBreakdown(
        reviewerSourceRecord?.competencyBreakdown ?? buildCompetencyBreakdown(reviewerQuestions, reviewerSelectedAnswers),
      )
      setQuestionIds(reviewerQuestionIds)
      setSelectedAnswers(reviewerSelectedAnswers)
      const existingReviewer = diagnosticRecord
        ? await loadReviewerNarrationScript({
            uid,
            assessmentKey: diagnosticRecord.assessmentKey,
            fallbackInline: diagnosticRecord.aiReviewerOutput,
            narrationStorage: diagnosticRecord.reviewerNarrationStorage,
          })
        : ''
      setAiReviewer(existingReviewer)
      setPhase(existingReviewer ? 'ready' : 'setup')

      const loadedPreference = diagnosticRecord?.reviewerPreference
      if (
        loadedPreference === 'flashcards' ||
        loadedPreference === 'audiobook' ||
        loadedPreference === 'cheatsheet-pdf' ||
        loadedPreference === 'cheatsheet-image'
      ) {
        setReviewerPreference(loadedPreference)
      }

      setIsLoadingAccess(false)
    }

    void loadProgress()

    return () => {
      isCancelled = true
    }
  }, [uid, selectedStage])

  useEffect(() => {
    if (phase !== 'initializing') {
      setInitProgress(0)
      return
    }

    const startTime = Date.now()
    const fastDuration = 2100
    const slowDuration = 3900
    const totalDuration = fastDuration + slowDuration

    const animationId = setInterval(() => {
      const elapsed = Date.now() - startTime

      if (elapsed < fastDuration) {
        const fastProgress = Math.round((elapsed / fastDuration) * 70)
        setInitProgress(Math.min(fastProgress, 70))
      } else if (elapsed < totalDuration) {
        const slowElapsed = elapsed - fastDuration
        const slowProgress = Math.round((slowElapsed / slowDuration) * 30)
        setInitProgress(Math.min(70 + slowProgress, 100))
      } else {
        setInitProgress(100)
        clearInterval(animationId)
      }
    }, 50)

    return () => clearInterval(animationId)
  }, [phase])

  const activeQuestions = useMemo(() => {
    const stagePool = getDiagnosticQuestionPoolForStage(activeStage)
    return questionIds.length > 0 ? getDiagnosticQuestionsByIdsForStage(questionIds, activeStage) : stagePool
  }, [questionIds, activeStage])

  const wrongQuestions = useMemo(() => {
    return activeQuestions
      .filter((question) => {
        const selected = selectedAnswers[question.id]
        return selected === undefined || selected !== question.correctAnswerIndex
      })
      .map((question) => ({
        id: question.id,
        competencyCode: question.competencyCode,
        module: question.module,
        bloomLevel: question.bloomLevel,
        question: question.question,
        options: question.options,
        correctOptionIndex: question.correctAnswerIndex,
        selectedOptionIndex: selectedAnswers[question.id] ?? null,
      }))
  }, [activeQuestions, selectedAnswers])

  const correctQuestions = useMemo(() => {
    return activeQuestions
      .filter((question) => {
        const selected = selectedAnswers[question.id]
        return selected !== undefined && selected === question.correctAnswerIndex
      })
      .map((question) => ({
        id: question.id,
        competencyCode: question.competencyCode,
        module: question.module,
        bloomLevel: question.bloomLevel,
        question: question.question,
        options: question.options,
        correctOptionIndex: question.correctAnswerIndex,
        selectedOptionIndex: selectedAnswers[question.id] ?? null,
      }))
  }, [activeQuestions, selectedAnswers])

  const unseenQuestions = useMemo(() => {
    const activeQuestionIdSet = new Set(activeQuestions.map((question) => question.id))
    const stagePool = getDiagnosticQuestionPoolForStage(activeStage)

    return stagePool.filter((question) => !activeQuestionIdSet.has(question.id)).map((question) => ({
      id: question.id,
      competencyCode: question.competencyCode,
      module: question.module,
      bloomLevel: question.bloomLevel,
      question: question.question,
      options: question.options,
      correctOptionIndex: question.correctAnswerIndex,
    }))
  }, [activeQuestions, activeStage])

  const handleCreateReviewer = async () => {
    if (!uid || isGenerating) {
      return
    }

    setIsGenerating(true)
    setErrorMessage('')
    setPhase('initializing')
    setActiveStep(0)

    const storageSelectedAnswers = diagnosticRecord?.selectedAnswers ?? Object.fromEntries(
      Object.entries(selectedAnswers).map(([questionId, answerIndex]) => [String(questionId), answerIndex]),
    )
    const storageQuestionIds = diagnosticRecord?.questionIds ?? questionIds
    const selectedAnswersForStorage = Object.fromEntries(
      Object.entries(storageSelectedAnswers).map(([questionId, answerIndex]) => [String(questionId), Number(answerIndex)]),
    )

    const start = Date.now()
    const totalDuration = 6000
    const fastPhaseEnd = totalDuration * 0.7
    const slowPhaseDuration = totalDuration * 0.3
    const timers: number[] = []

    initSteps.forEach((_, index) => {
      let delay: number

      if (index < 2) {
        delay = Math.floor((fastPhaseEnd / 2) * (index + 1) / 2)
      } else {
        delay = fastPhaseEnd + Math.floor((slowPhaseDuration / 2) * (index - 1))
      }

      const timerId = window.setTimeout(() => {
        setActiveStep(index)
      }, delay)
      timers.push(timerId)
    })

    try {
      let reviewerOutput = ''

      if (reviewerPreference === 'flashcards') {
        reviewerOutput = 'FLASHCARD_READY'
      } else {
        const prompt = buildReviewerPrompt({
          score,
          totalItems,
          percentage,
          competencyBreakdown,
          wrongQuestions,
          unseenQuestions,
          correctQuestions,
          reviewerPreference,
        })

        try {
          const response = await sendOpenAIChat({
            messages: [
              {
                role: 'system',
                content: getReviewerSystemInstruction(reviewerPreference),
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
          })
          reviewerOutput = response.content.trim()
        } catch {
          reviewerOutput = ''
        }

        if (!reviewerOutput) {
          reviewerOutput = buildFallbackReviewer({
            score,
            totalItems,
            percentage,
            competencyBreakdown,
            reviewerPreference,
          })
          setErrorMessage('AI service was unavailable. Fallback reviewer was created from your saved progress.')
        }

      }

      const elapsed = Date.now() - start
      if (elapsed < totalDuration) {
        await new Promise((resolve) => window.setTimeout(resolve, totalDuration - elapsed))
      }

      setAiReviewer(reviewerOutput)

      await upsertAssessmentProgress({
        uid,
        assessmentKey,
        score: diagnosticRecord?.score ?? score,
        totalItems: diagnosticRecord?.totalItems ?? totalItems,
        percentage: diagnosticRecord?.percentage ?? percentage,
        passed: diagnosticRecord?.passed === true,
        aiReviewerOutput: reviewerPreference === 'flashcards' ? reviewerOutput : undefined,
        isStudyPlanUnlocked: true,
        isReviewUnlocked: true,
        reviewerPreference,
        competencyBreakdown: diagnosticRecord?.competencyBreakdown ?? competencyBreakdown,
        questionIds: storageQuestionIds,
        selectedAnswers: selectedAnswersForStorage,
        isSubmitted: diagnosticRecord?.isSubmitted ?? true,
        isFinished: diagnosticRecord?.isFinished ?? true,
      })

      if (reviewerPreference !== 'flashcards') {
        await saveReviewerNarrationScript({
          uid,
          assessmentKey,
          script: reviewerOutput,
        })
      }

      await new Promise((resolve) => window.setTimeout(resolve, 1000))
      setPhase('ready')
    } catch (error) {
      setPhase('setup')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create reviewer.')
    } finally {
      timers.forEach((timer) => window.clearTimeout(timer))
      setIsGenerating(false)
    }
  }

  const surface = isBrightMode
    ? 'border-cyan-100 bg-linear-to-br from-white via-cyan-50/60 to-slate-50'
    : 'border-cyan-900/40 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.14),_transparent_42%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.12),_transparent_38%),linear-gradient(to_bottom,_#070b12,_#05070d)]'
  const muted = isBrightMode ? 'text-slate-600' : 'text-slate-300'
  const heading = isBrightMode ? 'text-slate-900' : 'text-slate-100'
  const redirectNotice = (location.state as { redirectNotice?: string } | null)?.redirectNotice ?? ''
  const reviewTargetRoute =
    reviewerPreference === 'audiobook'
      ? ROUTE_PATHS.dashboard.reviewAudiobook
      : reviewerPreference === 'cheatsheet-pdf' || reviewerPreference === 'cheatsheet-image'
        ? ROUTE_PATHS.dashboard.reviewCheatsheet
        : ROUTE_PATHS.dashboard.reviewFlashcards

  if (isLoadingAccess) {
    return <section className={`rounded-3xl border p-10 text-lg ${surface}`}>Loading reviewer maker...</section>
  }

  if (!isUnlocked) {
    return (
      <section className={`rounded-3xl border p-10 md:p-12 ${surface}`}>
        {redirectNotice ? (
          <div className={`mb-6 rounded-2xl border px-5 py-4 text-base ${isBrightMode ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-sky-900/40 bg-sky-950/30 text-sky-300'}`}>
            {redirectNotice}
          </div>
        ) : null}
        <h1 className={`text-4xl font-black tracking-tight ${heading}`}>Reviewer Maker is locked</h1>
        <p className={`mt-4 max-w-2xl text-lg ${muted}`}>
          Finish Gap Analysis and press Analyze Concepts first to unlock this page.
        </p>
        <Link
          to={ROUTE_PATHS.dashboard.gapAnalysis}
          className={`mt-8 inline-flex h-14 items-center gap-2 rounded-xl px-8 text-xs font-black uppercase tracking-widest text-white transition-colors ${isBrightMode ? 'bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          Go to Gap Analysis
          <ArrowRight size={16} />
        </Link>
      </section>
    )
  }

  if (phase === 'initializing') {
    return (
      <section className={`relative overflow-hidden rounded-3xl border p-12 md:p-16 ${surface}`}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className={`absolute -top-20 -left-16 h-52 w-52 rounded-full blur-3xl ${isBrightMode ? 'bg-cyan-200/60' : 'bg-cyan-700/30'}`} />
          <div className={`absolute -bottom-24 -right-20 h-64 w-64 rounded-full blur-3xl ${isBrightMode ? 'bg-emerald-200/60' : 'bg-emerald-700/20'}`} />
        </div>
        <div className="relative max-w-4xl mx-auto space-y-8">
          {redirectNotice ? (
            <div className={`rounded-2xl border px-5 py-4 text-base ${isBrightMode ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-sky-900/40 bg-sky-950/30 text-sky-300'}`}>
              {redirectNotice}
            </div>
          ) : null}
          <div className="text-center">
            <motion.div
              animate={{ scale: [1, 1.05, 1], opacity: [0.9, 1, 0.9] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`mx-auto h-24 w-24 rounded-full flex items-center justify-center ${isBrightMode ? 'bg-cyan-100 text-cyan-700' : 'bg-cyan-900/30 text-cyan-300'}`}
            >
              <Brain size={42} />
            </motion.div>
            <h1 className={`mt-4 text-4xl md:text-5xl font-black ${heading}`}>Initializing Reviewer Builder</h1>
            <p className={`mt-3 text-lg ${muted}`}>Creating your reviewer based on prioritized learning flow.</p>

            <div className="mt-6 max-w-xl mx-auto">
              <div className="flex items-center justify-between text-xs font-black tracking-wider uppercase">
                <span className={muted}>Generation Progress</span>
                <span className={heading}>{initProgress}%</span>
              </div>
              <div className={`mt-2 h-2 rounded-full overflow-hidden ${isBrightMode ? 'bg-slate-200' : 'bg-slate-800'}`}>
                <motion.div
                  className={isBrightMode ? 'h-full bg-cyan-600' : 'h-full bg-cyan-400'}
                  initial={{ width: 0 }}
                  animate={{ width: `${initProgress}%` }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {initSteps.map((step, index) => {
              const done = index < activeStep
              const active = index === activeStep

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0.65, y: 8 }}
                  animate={{ opacity: active || done ? 1 : 0.72, y: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className={`rounded-2xl border p-4 md:p-5 flex items-center gap-3 ${done ? isBrightMode ? 'border-emerald-300 bg-emerald-50' : 'border-emerald-800 bg-emerald-900/20' : active ? isBrightMode ? 'border-cyan-300 bg-cyan-50' : 'border-cyan-800 bg-cyan-900/20' : isBrightMode ? 'border-slate-200 bg-white/80' : 'border-slate-700 bg-slate-900/40'}`}
                >
                  <CircleDot size={18} className={done ? 'text-emerald-500' : active ? 'text-cyan-500' : 'text-slate-400'} />
                  <p className={`font-semibold ${heading}`}>{step.label}</p>
                </motion.div>
              )
            })}
          </div>

          <p className={`text-center text-sm ${muted}`}>
            Flow order: Wrong answers first, unseen questions second, correctly answered questions last.
          </p>
        </div>
      </section>
    )
  }

  if (phase === 'ready') {
    return (
      <section className={`relative overflow-hidden rounded-3xl border p-12 md:p-16 ${surface}`}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className={`absolute -top-20 -left-16 h-52 w-52 rounded-full blur-3xl ${isBrightMode ? 'bg-emerald-200/60' : 'bg-emerald-700/30'}`} />
          <div className={`absolute -bottom-24 -right-20 h-64 w-64 rounded-full blur-3xl ${isBrightMode ? 'bg-cyan-200/60' : 'bg-cyan-700/20'}`} />
        </div>

        <div className="relative max-w-4xl mx-auto space-y-8 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`mx-auto h-24 w-24 rounded-full flex items-center justify-center ${isBrightMode ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-900/30 text-emerald-300'}`}
          >
            <Sparkles size={48} />
          </motion.div>

          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="space-y-2"
          >
            <h1 className={`text-5xl md:text-6xl font-black tracking-tight ${heading}`}>
              Your Reviewer is Ready
            </h1>
            <p className={`text-xl ${muted}`}>
              {reviewerPreference === 'flashcards'
                ? 'Your flashcard reviewer has been created and is ready for your review session.'
                : reviewerPreference === 'audiobook'
                  ? 'Your audiobook script has been generated and is ready for narration.'
                  : `Your ${reviewerPreference === 'cheatsheet-pdf' ? 'PDF' : 'image'} cheatsheet has been created and optimized.`}
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
            className={`rounded-3xl border p-8 md:p-10 ${isBrightMode ? 'border-emerald-200 bg-emerald-50/80' : 'border-emerald-800 bg-emerald-900/20'}`}
          >
            <p className={`text-lg font-semibold ${isBrightMode ? 'text-emerald-900' : 'text-emerald-200'}`}>
              Format: <span className="font-black">{reviewerPreferenceOptions.find((opt) => opt.value === reviewerPreference)?.label}</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6, ease: 'easeOut' }}
          >
            <button
              type="button"
              onClick={() => {
                console.log('Navigate clicked', { reviewTargetRoute, reviewerPreference })
                navigate(reviewTargetRoute, {
                  state: { reviewerJustCreated: true }
                })
              }}
              className="h-16 px-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-lg inline-flex items-center gap-3 transition-colors shadow-lg hover:shadow-xl cursor-pointer"
            >
              Go to Review
              <ArrowRight size={20} />
            </button>
          </motion.div>
        </div>
      </section>
    )
  }

  return (
    <section className={`relative overflow-hidden rounded-3xl border p-12 md:p-16 ${surface}`}>
      <div className="relative max-w-6xl mx-auto space-y-10">
        {redirectNotice ? (
          <div className={`rounded-2xl border px-5 py-4 text-base ${isBrightMode ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-sky-900/40 bg-sky-950/30 text-sky-300'}`}>
            {redirectNotice}
          </div>
        ) : null}
        <div className="text-center">
          <p className={`text-xs font-black uppercase tracking-[0.35em] ${isBrightMode ? 'text-cyan-700' : 'text-cyan-300'}`}>Reviewer Maker</p>
          <h1 className={`mt-4 text-6xl md:text-7xl font-black tracking-tighter ${heading}`}>Choose Reviewer Format</h1>
          <p className={`mt-5 text-xl ${muted}`}>
            Pick your preferred format, then create your reviewer.
          </p>
        </div>

        <div className={`rounded-3xl border p-10 md:p-12 ${isBrightMode ? 'border-amber-100 bg-white/80' : 'border-amber-800/30 bg-[#1a1410]/60'}`}>
          <p className={`text-xs font-black uppercase tracking-[0.25em] ${isBrightMode ? 'text-amber-700' : 'text-amber-300'}`}>
            Preferred Reviewer Format
          </p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviewerPreferenceOptions.map((option) => {
              const isSelected = reviewerPreference === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={isGenerating}
                  onClick={() => setReviewerPreference(option.value)}
                  className={`rounded-2xl border p-6 text-left transition-colors ${isSelected ? isBrightMode ? 'border-amber-400 bg-amber-50' : 'border-amber-500/60 bg-amber-900/20' : isBrightMode ? 'border-slate-200 bg-white hover:border-amber-200' : 'border-slate-700 bg-slate-900/40 hover:border-amber-700/40'} ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <p className={`text-lg font-black ${heading}`}>{option.label}</p>
                  <p className={`mt-2 text-sm ${muted}`}>{option.hint}</p>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={handleCreateReviewer}
            disabled={isGenerating}
            className="h-14 px-10 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase tracking-widest text-xs inline-flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Creating Reviewer...' : 'Create Reviewer'}
            <Sparkles size={16} />
          </button>
        </div>

        {aiReviewer.trim() ? (
          <div className={`rounded-2xl border px-5 py-4 text-base ${isBrightMode ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-emerald-900/40 bg-emerald-950/30 text-emerald-300'}`}>
            Reviewer created successfully. You can create a new reviewer or modify your preferences above.
          </div>
        ) : null}

        {errorMessage ? (
          <div className={`rounded-2xl border px-5 py-4 text-base ${isBrightMode ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-rose-900/40 bg-rose-950/30 text-rose-300'}`}>
            {errorMessage}
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default PersonalizedStudyPlanPage
