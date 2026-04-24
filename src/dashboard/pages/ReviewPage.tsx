import { onAuthStateChanged } from 'firebase/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Sparkles, X, RotateCcw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useBrightness } from '../../contexts/BrightnessContext'
import { useGradingStage } from '@/contexts/GradingStageContext'
import { getLearningStageConfig, getStageDiagnosticRecord, resolveStageForSelection } from '../data/learningStage'
import {
  getDiagnosticQuestionPoolForStage,
  getDiagnosticQuestionsByIdsForStage,
  normalizeSelectedAnswersForStage,
} from '../data/diagnosticQuestions'
import { auth } from '../../lib/firebase'
import { ROUTE_PATHS } from '../../routes/paths'
import { clearReviewerData, getUserAssessmentProgress, type AssessmentProgressRecord } from '../../services/assessmentProgress'

const preferenceLabels: Record<string, string> = {
  flashcards: 'Flashcards',
  audiobook: 'Audiobook Script',
  'cheatsheet-pdf': 'Cheatsheet PDF',
  'cheatsheet-image': 'Cheatsheet Image',
}

type FlowQuestion = {
  id: number
  question: string
  module: string
  competencyCode: string
  options: string[]
  correctAnswerIndex: number
  selectedAnswerIndex: number | null
  bucket: 'wrong' | 'unseen' | 'correct'
}

const ReviewPage = () => {
  const { isBrightMode } = useBrightness()
  const { selectedStage } = useGradingStage()
  const location = useLocation()
  const navigate = useNavigate()
  const [uid, setUid] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [reviewerOutput, setReviewerOutput] = useState('')
  const [reviewerPreference, setReviewerPreference] = useState<string>('Not set')
  const [questionIds, setQuestionIds] = useState<number[]>([])
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [activeStage, setActiveStage] = useState<'prelim' | 'midterm' | 'final'>('prelim')
  const [isReviewUnlocked, setIsReviewUnlocked] = useState(false)
  const [selectedModuleDeck, setSelectedModuleDeck] = useState<string | null>(null)
  const [selectedCardIndex, setSelectedCardIndex] = useState(0)
  const [, setDiagnosticRecord] = useState<AssessmentProgressRecord | null>(null)
  const [isResettingReviewer, setIsResettingReviewer] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    let isCancelled = false

    const loadReviewer = async () => {
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
      const record = getStageDiagnosticRecord(assessmentMap, activeStage)

      setActiveStage(activeStage)
      setDiagnosticRecord(record ?? null)
      setReviewerOutput(record?.aiReviewerOutput?.trim() ?? '')
      setReviewerPreference(preferenceLabels[record?.reviewerPreference ?? ''] ?? 'Not set')
      setQuestionIds((record?.questionIds ?? []).map(Number).filter((questionId) => Number.isFinite(questionId)))
      setSelectedAnswers(
        normalizeSelectedAnswersForStage(
          Object.fromEntries(
          Object.entries(record?.selectedAnswers ?? {}).map(([questionId, answerIndex]) => [Number(questionId), Number(answerIndex)]),
          ),
          activeStage,
        ),
      )
      setIsReviewUnlocked(record?.isReviewUnlocked === true)
      setIsLoading(false)
    }

    void loadReviewer()

    return () => {
      isCancelled = true
    }
  }, [uid, selectedStage])

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
        question: question.question,
        module: question.module,
        competencyCode: question.competencyCode,
        options: question.options,
        correctAnswerIndex: question.correctAnswerIndex,
        selectedAnswerIndex: selectedAnswers[question.id] ?? null,
        bucket: 'wrong' as const,
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
        question: question.question,
        module: question.module,
        competencyCode: question.competencyCode,
        options: question.options,
        correctAnswerIndex: question.correctAnswerIndex,
        selectedAnswerIndex: selectedAnswers[question.id] ?? null,
        bucket: 'correct' as const,
      }))
  }, [activeQuestions, selectedAnswers])

  const unseenQuestions = useMemo(() => {
    const activeQuestionIdSet = new Set(activeQuestions.map((question) => question.id))
    const stagePool = getDiagnosticQuestionPoolForStage(activeStage)

    return stagePool.filter((question) => !activeQuestionIdSet.has(question.id)).map((question) => ({
      id: question.id,
      question: question.question,
      module: question.module,
      competencyCode: question.competencyCode,
      options: question.options,
      correctAnswerIndex: question.correctAnswerIndex,
      selectedAnswerIndex: null,
      bucket: 'unseen' as const,
    }))
  }, [activeQuestions, activeStage])

  const flowQuestions: FlowQuestion[] = useMemo(() => {
    return [...wrongQuestions, ...unseenQuestions, ...correctQuestions]
  }, [wrongQuestions, unseenQuestions, correctQuestions])

  const moduleDecks = useMemo(() => {
    const grouped = new Map<string, FlowQuestion[]>()

    for (const item of flowQuestions) {
      const existing = grouped.get(item.module)
      if (existing) {
        existing.push(item)
      } else {
        grouped.set(item.module, [item])
      }
    }

    return Array.from(grouped.entries()).map(([moduleName, questions]) => ({ moduleName, questions }))
  }, [flowQuestions])

  useEffect(() => {
    if (!selectedModuleDeck) {
      return
    }

    if (!moduleDecks.some((deck) => deck.moduleName === selectedModuleDeck)) {
      setSelectedModuleDeck(null)
    }
  }, [moduleDecks, selectedModuleDeck])

  const selectedDeck = useMemo(
    () => moduleDecks.find((deck) => deck.moduleName === selectedModuleDeck) ?? null,
    [moduleDecks, selectedModuleDeck],
  )

  useEffect(() => {
    setSelectedCardIndex(0)
  }, [selectedModuleDeck])

  const selectedCard = selectedDeck?.questions[selectedCardIndex] ?? null
  const selectedDeckProgressPercent = selectedDeck
    ? Math.round(((selectedCardIndex + 1) / selectedDeck.questions.length) * 100)
    : 0

  const surface = isBrightMode
    ? 'border-cyan-100 bg-linear-to-br from-white via-cyan-50/60 to-slate-50'
    : 'border-cyan-900/40 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.14),_transparent_42%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.12),_transparent_38%),linear-gradient(to_bottom,_#070b12,_#05070d)]'
  const muted = isBrightMode ? 'text-slate-600' : 'text-slate-300'
  const heading = isBrightMode ? 'text-slate-900' : 'text-slate-100'
  const redirectNotice = (location.state as { redirectNotice?: string } | null)?.redirectNotice ?? ''

  const handleResetReviewer = async () => {
    if (!uid || isResettingReviewer) {
      return
    }

    setIsResettingReviewer(true)
    const assessmentKey = getLearningStageConfig(activeStage).diagnosticAssessmentKey

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

  if (isLoading) {
    return <section className={`rounded-3xl border p-10 text-lg ${surface}`}>Loading review page...</section>
  }

  if (!isReviewUnlocked) {
    return (
      <section className={`rounded-3xl border p-10 md:p-12 ${surface}`}>
        {redirectNotice ? (
          <div className={`mb-6 rounded-2xl border px-5 py-4 text-base ${isBrightMode ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-sky-900/40 bg-sky-950/30 text-sky-300'}`}>
            {redirectNotice}
          </div>
        ) : null}
        <h1 className={`text-4xl font-black tracking-tight ${heading}`}>Review Page is locked</h1>
        <p className={`mt-4 max-w-2xl text-lg ${muted}`}>
          Go to Personalized Study Plan, choose a format, and create a reviewer first.
        </p>
        <Link
          to={ROUTE_PATHS.dashboard.studyPlan}
          className={`mt-8 inline-flex h-14 items-center gap-2 rounded-xl px-8 text-xs font-black uppercase tracking-widest text-white transition-colors ${isBrightMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
        >
          Back to Reviewer Maker
          <ArrowLeft size={16} />
        </Link>
      </section>
    )
  }

  return (
    <section className={`relative overflow-hidden rounded-3xl border p-10 md:p-12 ${surface}`}>
      <div className="relative max-w-6xl mx-auto space-y-8">
        {redirectNotice ? (
          <div className={`rounded-2xl border px-5 py-4 text-base ${isBrightMode ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-sky-900/40 bg-sky-950/30 text-sky-300'}`}>
            {redirectNotice}
          </div>
        ) : null}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className={`text-xs font-black uppercase tracking-[0.3em] ${isBrightMode ? 'text-cyan-700' : 'text-cyan-300'}`}>Reviewer Page</p>
            <h1 className={`mt-2 text-4xl md:text-5xl font-black ${heading}`}>Prioritized Review Flow</h1>
            <p className={`mt-2 ${muted}`}>Format: {reviewerPreference}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleResetReviewer}
              disabled={isResettingReviewer}
              className={`inline-flex h-12 items-center gap-2 rounded-xl px-6 text-xs font-black uppercase tracking-widest ${isBrightMode ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200' : 'bg-rose-500/10 text-rose-200 hover:bg-rose-500/20 border border-rose-500/40'} ${isResettingReviewer ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <RotateCcw size={14} />
              {isResettingReviewer ? 'Resetting...' : 'Create New Reviewer'}
            </button>
            <Link
              to={ROUTE_PATHS.dashboard.studyPlan}
              className={`inline-flex h-12 items-center gap-2 rounded-xl px-6 text-xs font-black uppercase tracking-widest ${isBrightMode ? 'bg-slate-100 text-slate-800 hover:bg-slate-200' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
            >
              <ArrowLeft size={14} />
              Back to Plan
            </Link>
          </div>
        </div>

        {reviewerPreference === 'Flashcards' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {moduleDecks.map((deck) => {
                const wrongCount = deck.questions.filter((item) => item.bucket === 'wrong').length
                const correctCount = deck.questions.filter((item) => item.bucket === 'correct').length

                return (
                  <motion.button
                    key={deck.moduleName}
                    type="button"
                    whileHover={{ y: -8, scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedModuleDeck(deck.moduleName)}
                    className={`group relative rounded-4xl p-8 md:p-9 text-left border transition-all hover:-translate-y-1 ${isBrightMode ? 'border-slate-200 bg-white hover:border-cyan-300' : 'border-slate-700 bg-slate-900/50 hover:border-cyan-700/50'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className={`h-13 w-13 rounded-2xl flex items-center justify-center ${isBrightMode ? 'bg-cyan-50 text-cyan-700' : 'bg-cyan-900/30 text-cyan-300'}`}>
                        <BookOpen size={24} />
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${isBrightMode ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-300'}`}>
                        {deck.questions.length} cards
                      </span>
                    </div>

                    <h3 className={`mt-6 text-xl font-black uppercase tracking-tight ${isBrightMode ? 'text-slate-900' : 'text-white'}`}>
                      {deck.moduleName}
                    </h3>

                    <div className="mt-5 space-y-2">
                      <p className={`text-xs font-bold uppercase tracking-widest ${isBrightMode ? 'text-rose-600' : 'text-rose-300'}`}>Wrong: {wrongCount}</p>
                      <p className={`text-xs font-bold uppercase tracking-widest ${isBrightMode ? 'text-emerald-600' : 'text-emerald-300'}`}>Correct: {correctCount}</p>
                    </div>

                    <div className={`mt-7 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest ${isBrightMode ? 'text-slate-700' : 'text-slate-200'}`}>
                      Open Deck
                      <BookOpen size={14} />
                    </div>
                  </motion.button>
                )
              })}
            </div>

            <AnimatePresence>
              {selectedDeck ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 overflow-y-auto bg-black/95 p-6 md:p-12 backdrop-blur-sm"
                >
                  <div className="mx-auto max-w-7xl">
                    <div className="mb-10 flex items-center justify-between gap-4">
                      <h2 className="text-3xl font-black uppercase tracking-tight text-white">{selectedDeck.moduleName}</h2>
                      <button
                        type="button"
                        onClick={() => setSelectedModuleDeck(null)}
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white hover:bg-white/10"
                      >
                        <X size={22} />
                      </button>
                    </div>

                    <div className="mx-auto max-w-3xl space-y-6">
                      <div className="flex items-center justify-between text-white/80">
                        <p className="text-xs font-black uppercase tracking-[0.2em]">
                          Card {selectedCardIndex + 1} / {selectedDeck.questions.length}
                        </p>
                        <p className="text-xs font-black uppercase tracking-[0.2em]">
                          {selectedDeckProgressPercent}%
                        </p>
                      </div>

                      <div className="h-2 w-full rounded-full bg-white/15">
                        <div
                          className="h-full rounded-full bg-cyan-400 transition-all duration-300"
                          style={{ width: `${selectedDeckProgressPercent}%` }}
                        />
                      </div>

                      {selectedCard ? (
                        <FlipCard key={`${selectedDeck.moduleName}-${selectedCard.id}`} card={selectedCard} />
                      ) : null}

                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedCardIndex((current) => Math.max(0, current - 1))}
                          disabled={selectedCardIndex === 0}
                          className="inline-flex h-12 items-center gap-2 rounded-xl bg-white/10 px-5 text-xs font-black uppercase tracking-widest text-white hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft size={14} />
                          Previous
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedCardIndex((current) => Math.min(selectedDeck.questions.length - 1, current + 1))}
                          disabled={selectedCardIndex === selectedDeck.questions.length - 1}
                          className="inline-flex h-12 items-center gap-2 rounded-xl bg-white/10 px-5 text-xs font-black uppercase tracking-widest text-white hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </>
        ) : (
          <div className={`rounded-3xl border p-6 md:p-8 ${isBrightMode ? 'border-cyan-100 bg-white/90' : 'border-cyan-800/30 bg-[#0b1320]/65'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isBrightMode ? 'bg-cyan-50 text-cyan-700' : 'bg-cyan-900/30 text-cyan-200'}`}>
                <Sparkles size={18} />
              </div>
              <div>
                <p className={`text-xs font-black uppercase tracking-[0.25em] ${muted}`}>Reviewer Output</p>
                <p className={`text-sm font-semibold ${heading}`}>Generated content</p>
              </div>
            </div>
            {reviewerOutput && reviewerOutput !== 'FLASHCARD_READY' ? (
              <pre className={`whitespace-pre-wrap wrap-break-word text-sm leading-7 font-sans ${muted}`}>{reviewerOutput}</pre>
            ) : (
              <div className={`rounded-2xl border p-4 ${isBrightMode ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-slate-700 bg-slate-900/40 text-slate-300'}`}>
                Reviewer content is not available yet.
              </div>
            )}
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <Link
            to={ROUTE_PATHS.dashboard.postTest}
            className={`inline-flex h-12 items-center gap-2 rounded-xl px-6 text-xs font-black uppercase tracking-widest text-white transition-colors ${isBrightMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            Answer Post-Test
            <ArrowLeft size={16} className="rotate-180" />
          </Link>
        </div>
      </div>
    </section>
  )
}

const FlipCard = ({ card }: { card: FlowQuestion }) => {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <button
      type="button"
      className="h-88 w-full cursor-pointer perspective-distant text-left"
      onClick={() => setIsFlipped((current) => !current)}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="relative h-full w-full transform-3d"
      >
        <div className="absolute inset-0 backface-hidden rounded-3xl border border-white/10 bg-linear-to-br from-blue-600 to-indigo-700 p-10 text-center text-white shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/70">Prompt</p>
          <p className="mt-6 text-3xl font-bold leading-snug">{card.question}</p>
          <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-white/70">{card.competencyCode}</p>
        </div>

        <div className="absolute inset-0 backface-hidden transform-[rotateY(180deg)] rounded-3xl border border-white/10 bg-linear-to-br from-fuchsia-600 to-purple-800 p-10 text-center text-white shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/70">Answer</p>
          <p className="mt-6 text-2xl leading-relaxed text-white/95">{card.options[card.correctAnswerIndex]}</p>
          <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-white/70">
            {card.selectedAnswerIndex === null ? 'Not answered' : `Your choice: ${card.options[card.selectedAnswerIndex]}`}
          </p>
        </div>
      </motion.div>
    </button>
  )
}

export default ReviewPage
