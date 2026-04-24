import { onAuthStateChanged } from 'firebase/auth'
import { CheckCircle2, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useBrightness } from '../../contexts/BrightnessContext'
import { useGradingStage } from '@/contexts/GradingStageContext'
import { getLearningStageConfig, getStageDiagnosticRecord, getStageSummativeRecord, resolveStageForSelection, type LearningStageKey } from '../data/learningStage'
import { POSTTEST_POINTS_LIMIT, getCATPosttestInitialQuestions, getCATPosttestNextQuestion, getDiagnosticQuestionsByIdsForStage } from '../data/diagnosticQuestions'
import { auth } from '../../lib/firebase'
import { ROUTE_PATHS } from '../../routes/paths'
import { getUserAssessmentProgress, upsertAssessmentProgress, type SummativeAttemptDetail } from '../../services/assessmentProgress'

const SUMMATIVE_PASSING_PERCENTAGE = 75
const SUMMATIVE_MAX_FAILED_ATTEMPTS = 3

const toPercentage = (correct: number, total: number) => {
  if (total <= 0) {
    return 0
  }

  return Number(((correct / total) * 100).toFixed(2))
}

const formatPoints = (points: number) => String(Math.round(points * 2) / 2).replace(/\.0$/, '')

const SummativePosttestPage = () => {
  const { isBrightMode } = useBrightness()
  const { selectedStage } = useGradingStage()
  const navigate = useNavigate()
  const location = useLocation()
  const [uid, setUid] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isHydratingState, setIsHydratingState] = useState(true)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [activeStage, setActiveStage] = useState<LearningStageKey>('prelim')
  const [assessmentKey, setAssessmentKey] = useState(getLearningStageConfig('prelim').summativeAssessmentKey)
  const [pretestQuestionIds, setPretestQuestionIds] = useState<number[]>([])
  const [pretestSelectedAnswers, setPretestSelectedAnswers] = useState<Record<number, number>>({})
  const [questions, setQuestions] = useState(() => getCATPosttestInitialQuestions({ pretestQuestionIds: [], pretestSelectedAnswers: {} }))
  const [hasStarted, setHasStarted] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [isPermanentlyLocked, setIsPermanentlyLocked] = useState(false)
  const [scoreHistory, setScoreHistory] = useState<number[]>([])
  const [attemptDetails, setAttemptDetails] = useState<SummativeAttemptDetail[]>([])

  const currentQuestion = questions[currentQuestionIndex]
  const answeredCount = Object.keys(selectedAnswers).length
  const completionPercentage = Math.round((answeredCount / questions.length) * 100)
  const canGoNext = currentQuestionIndex < questions.length - 1
  const hasAnswerForCurrentQuestion = currentQuestion ? selectedAnswers[currentQuestion.id] !== undefined : false
  const allAnswered = questions.length > 0 && answeredCount === questions.length
  const attemptsRemaining = Math.max(SUMMATIVE_MAX_FAILED_ATTEMPTS - failedAttempts, 0)

  const nextAdaptiveQuestion = !isSubmitted && currentQuestionIndex === questions.length - 1
    ? getCATPosttestNextQuestion({
      stage: activeStage,
      pretestQuestionIds,
      pretestSelectedAnswers,
      posttestQuestionIds: questions.map((question) => question.id),
      posttestSelectedAnswers: selectedAnswers,
      maxTotalPoints: POSTTEST_POINTS_LIMIT,
    })
    : null

  const handleAdvance = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((index) => Math.min(questions.length - 1, index + 1))
      return
    }

    if (!nextAdaptiveQuestion) {
      return
    }

    setQuestions((current) => [...current, nextAdaptiveQuestion])
    setCurrentQuestionIndex((index) => index + 1)
  }

  const score = useMemo(() => {
    return questions.reduce((total, question) => {
      return selectedAnswers[question.id] === question.correctAnswerIndex ? total + question.weight : total
    }, 0)
  }, [questions, selectedAnswers])

  const totalPossible = useMemo(() => {
    return questions.reduce((total, question) => total + question.weight, 0)
  }, [questions])

  const scorePercentage = toPercentage(score, totalPossible)
  const passed = scorePercentage >= SUMMATIVE_PASSING_PERCENTAGE

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    let isCancelled = false

    const loadState = async () => {
      setIsLoading(true)
      setIsHydratingState(true)

      if (!uid) {
        if (!isCancelled) {
          setIsLoading(false)
          setIsHydratingState(false)
        }
        return
      }

      const assessmentRecords = await getUserAssessmentProgress(uid)

      if (isCancelled) {
        return
      }

      const assessmentMap = new Map(assessmentRecords.map((record) => [record.assessmentKey, record]))
      const stage = resolveStageForSelection(assessmentMap, selectedStage)
      const stageConfig = getLearningStageConfig(stage)
      const diagnosticRecord = getStageDiagnosticRecord(assessmentMap, stage)
      const summativeRecord = getStageSummativeRecord(assessmentMap, stage)
      const persistedFailedAttempts = Math.max(0, Number(summativeRecord?.failedAttempts ?? 0))
      const lockedByAttempts = persistedFailedAttempts >= SUMMATIVE_MAX_FAILED_ATTEMPTS
      const isLockedForStage = summativeRecord?.isLocked === true || lockedByAttempts
      const persistedScoreHistory = Array.isArray(summativeRecord?.scoreHistory)
        ? summativeRecord.scoreHistory
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value))
        : []
      const persistedAttemptDetails = Array.isArray(summativeRecord?.summativeAttemptDetails)
        ? summativeRecord.summativeAttemptDetails.filter((entry) => entry && typeof entry === 'object')
        : []

      setActiveStage(stage)
      setAssessmentKey(stageConfig.summativeAssessmentKey)
      setIsUnlocked(diagnosticRecord?.isReviewUnlocked === true)
      setFailedAttempts(persistedFailedAttempts)
      setIsPermanentlyLocked(isLockedForStage)
      setScoreHistory(persistedScoreHistory)
      setAttemptDetails(persistedAttemptDetails)

      if (
        uid &&
        summativeRecord?.isSubmitted === true &&
        persistedAttemptDetails.length === 0 &&
        Array.isArray(summativeRecord?.questionIds) &&
        summativeRecord.questionIds.length > 0 &&
        summativeRecord.selectedAnswers &&
        typeof summativeRecord.selectedAnswers === 'object'
      ) {
        const fallbackAttemptDetails: SummativeAttemptDetail[] = [
          {
            score: Number(summativeRecord.score ?? 0),
            totalItems: Number(summativeRecord.totalItems ?? summativeRecord.questionIds.length),
            percentage: Number(summativeRecord.percentage ?? 0),
            questionIds: summativeRecord.questionIds.map((questionId) => Number(questionId)).filter((questionId) => Number.isFinite(questionId)),
            selectedAnswers: Object.fromEntries(
              Object.entries(summativeRecord.selectedAnswers).map(([questionId, answerIndex]) => [String(questionId), Number(answerIndex)]),
            ),
            submittedAt: summativeRecord.updatedAt ?? new Date(),
          },
        ]

        await upsertAssessmentProgress({
          uid,
          assessmentKey: stageConfig.summativeAssessmentKey,
          score: Number(summativeRecord.score ?? 0),
          totalItems: Number(summativeRecord.totalItems ?? fallbackAttemptDetails[0].questionIds.length),
          percentage: Number(summativeRecord.percentage ?? 0),
          passed: summativeRecord.passed === true,
          questionIds: fallbackAttemptDetails[0].questionIds,
          selectedAnswers: fallbackAttemptDetails[0].selectedAnswers,
          isSubmitted: true,
          isFinished: true,
          failedAttempts: persistedFailedAttempts,
          isLocked: isLockedForStage,
          scoreHistory: persistedScoreHistory,
          summativeAttemptDetails: fallbackAttemptDetails,
        })

        setAttemptDetails(fallbackAttemptDetails)
      }

      const baseQuestionIds = (diagnosticRecord?.questionIds ?? []).map(Number).filter((questionId) => Number.isFinite(questionId))
      const baseSelectedAnswers = Object.fromEntries(
        Object.entries(diagnosticRecord?.selectedAnswers ?? {}).map(([questionId, answerIndex]) => [Number(questionId), Number(answerIndex)]),
      ) as Record<number, number>

      const persistedQuestionIds = (summativeRecord?.questionIds ?? []).map(Number).filter((questionId) => Number.isFinite(questionId))
      const persistedSelectedAnswers = Object.fromEntries(
        Object.entries(summativeRecord?.selectedAnswers ?? {}).map(([questionId, answerIndex]) => [Number(questionId), Number(answerIndex)]),
      ) as Record<number, number>

      const retakeRequested = (location.state as { retake?: boolean } | null)?.retake === true

      const baseForGenerationQuestionIds =
        retakeRequested && persistedQuestionIds.length > 0
          ? persistedQuestionIds
          : baseQuestionIds

      const baseForGenerationSelectedAnswers =
        retakeRequested && Object.keys(persistedSelectedAnswers).length > 0
          ? persistedSelectedAnswers
          : baseSelectedAnswers

      setPretestQuestionIds(baseForGenerationQuestionIds)
      setPretestSelectedAnswers(baseForGenerationSelectedAnswers)

      const generatedQuestions = getCATPosttestInitialQuestions({
        stage,
        pretestQuestionIds: baseForGenerationQuestionIds,
        pretestSelectedAnswers: baseForGenerationSelectedAnswers,
      })

      const resolvedQuestions = retakeRequested
        ? generatedQuestions
        : persistedQuestionIds.length > 0
          ? getDiagnosticQuestionsByIdsForStage(persistedQuestionIds, stage)
          : generatedQuestions

      setQuestions(resolvedQuestions)
      setSelectedAnswers(retakeRequested ? {} : Object.keys(persistedSelectedAnswers).length > 0 ? persistedSelectedAnswers : {})
      setCurrentQuestionIndex(
        retakeRequested
          ? 0
          : Math.min(Math.max(summativeRecord?.currentQuestionIndex ?? 0, 0), Math.max(resolvedQuestions.length - 1, 0)),
      )
      setIsSubmitted(retakeRequested ? false : summativeRecord?.isSubmitted === true)
      setHasStarted(
        retakeRequested
          ? false
          : Boolean(summativeRecord?.isSubmitted === true || Object.keys(persistedSelectedAnswers).length > 0),
      )
      setIsLoading(false)
      setIsHydratingState(false)
    }

    void loadState()

    return () => {
      isCancelled = true
    }
  }, [uid, location.state, selectedStage])

  useEffect(() => {
    if (!uid || isHydratingState) {
      return
    }

    const timer = window.setTimeout(() => {
      const selectedAnswersForStorage = Object.fromEntries(
        Object.entries(selectedAnswers).map(([questionId, answerIndex]) => [String(questionId), answerIndex]),
      )

      void upsertAssessmentProgress({
        uid,
        assessmentKey,
        score,
        totalItems: totalPossible,
        percentage: scorePercentage,
        passed: passed,
        competencyBreakdown: {},
        questionIds: questions.map((question) => question.id),
        selectedAnswers: selectedAnswersForStorage,
        currentQuestionIndex,
        isSubmitted,
        isFinished: isSubmitted,
        failedAttempts,
        isLocked: isPermanentlyLocked,
      })
    }, 300)

    return () => {
      window.clearTimeout(timer)
    }
  }, [
    uid,
    isHydratingState,
    assessmentKey,
    selectedAnswers,
    currentQuestionIndex,
    isSubmitted,
    failedAttempts,
    isPermanentlyLocked,
    score,
    scorePercentage,
    passed,
    questions,
    totalPossible,
  ])

  const handleSelectAnswer = (optionIndex: number) => {
    if (isSubmitted || !currentQuestion) {
      return
    }

    setSelectedAnswers((current) => ({
      ...current,
      [currentQuestion.id]: optionIndex,
    }))
  }

  const handleStartTest = () => {
    setHasStarted(true)
  }

  const handleSubmit = async () => {
    if (!uid || !allAnswered || isSubmitting || isPermanentlyLocked) {
      return
    }

    setIsSubmitting(true)

    try {
      setIsSubmitted(true)

      const selectedAnswersForStorage = Object.fromEntries(
        Object.entries(selectedAnswers).map(([questionId, answerIndex]) => [String(questionId), answerIndex]),
      )

      const failedAttemptsAfterSubmit = !passed
        ? Math.min(failedAttempts + 1, SUMMATIVE_MAX_FAILED_ATTEMPTS)
        : failedAttempts
      const lockedAfterSubmit = !passed && failedAttemptsAfterSubmit >= SUMMATIVE_MAX_FAILED_ATTEMPTS
      const scoreHistoryAfterSubmit = [...scoreHistory, scorePercentage]
      const attemptDetailsAfterSubmit = [
        ...attemptDetails,
        {
          score,
          totalItems: totalPossible,
          percentage: scorePercentage,
          questionIds: questions.map((question) => question.id),
          selectedAnswers: selectedAnswersForStorage,
          submittedAt: new Date(),
        },
      ]

      await upsertAssessmentProgress({
        uid,
        assessmentKey,
        score,
        totalItems: totalPossible,
        percentage: scorePercentage,
        passed,
        competencyBreakdown: {},
        questionIds: questions.map((question) => question.id),
        selectedAnswers: selectedAnswersForStorage,
        currentQuestionIndex,
        isSubmitted: true,
        isFinished: true,
        failedAttempts: failedAttemptsAfterSubmit,
        isLocked: lockedAfterSubmit,
        scoreHistory: scoreHistoryAfterSubmit,
        summativeAttemptDetails: attemptDetailsAfterSubmit,
      })

      setFailedAttempts(failedAttemptsAfterSubmit)
      setIsPermanentlyLocked(lockedAfterSubmit)
      setScoreHistory(scoreHistoryAfterSubmit)
      setAttemptDetails(attemptDetailsAfterSubmit)

      navigate(ROUTE_PATHS.dashboard.results)
    } finally {
      setIsSubmitting(false)
    }
  }

  const surface = isBrightMode
    ? 'border-gray-200 bg-white/80'
    : 'border-gray-800/60 bg-[#0b0e14]/70'

  if (isLoading) {
    return (
      <section className={`rounded-2xl border p-8 ${surface}`}>
        Loading summative post-test...
      </section>
    )
  }

  if (!isUnlocked) {
    return (
      <section className={`rounded-2xl border p-8 ${surface}`}>
        <h1 className={`text-3xl font-bold ${isBrightMode ? 'text-gray-900' : 'text-white'}`}>
          Summative Post-test is locked
        </h1>
        <p className={`mt-3 ${isBrightMode ? 'text-gray-600' : 'text-gray-400'}`}>
          Complete Review first to unlock the summative assessment for {getLearningStageConfig(activeStage).label}.
        </p>
        <Link
          to={ROUTE_PATHS.dashboard.review}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-blue-700"
        >
          Go to Review
        </Link>
      </section>
    )
  }

  if (isPermanentlyLocked) {
    return (
      <section className={`rounded-2xl border p-8 ${surface}`}>
        <h1 className={`text-3xl font-bold ${isBrightMode ? 'text-gray-900' : 'text-white'}`}>
          Summative Post-test is permanently locked
        </h1>
        <p className={`mt-3 ${isBrightMode ? 'text-gray-600' : 'text-gray-400'}`}>
          You reached the maximum of {SUMMATIVE_MAX_FAILED_ATTEMPTS} failed attempts for {getLearningStageConfig(activeStage).label}. This post-test can no longer be retaken.
        </p>
        <p className={`mt-2 text-sm font-semibold ${isBrightMode ? 'text-gray-700' : 'text-gray-300'}`}>
          Failed attempts used: {failedAttempts}/{SUMMATIVE_MAX_FAILED_ATTEMPTS}
        </p>
        <Link
          to={ROUTE_PATHS.dashboard.results}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-blue-700"
        >
          Go to Learning Results
        </Link>
      </section>
    )
  }

  return (
    <section className={`rounded-3xl border p-8 md:p-10 ${surface}`}>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h1 className={`text-3xl font-black tracking-tight ${isBrightMode ? 'text-gray-900' : 'text-white'}`}>
            {getLearningStageConfig(activeStage).label} Summative Post-test
          </h1>
          <p className={`mt-2 text-sm ${isBrightMode ? 'text-gray-600' : 'text-gray-400'}`}>
            Passing this test will move you to the next grading stage. Do your best and good luck.
          </p>
        </div>

        <div className={`rounded-2xl px-4 py-3 border ${isBrightMode ? 'border-slate-200 bg-slate-50' : 'border-slate-700 bg-slate-900/40'}`}>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Progress</p>
          <p className={`text-lg font-black ${isBrightMode ? 'text-gray-900' : 'text-white'}`}>{completionPercentage}%</p>
        </div>
      </div>

      <div className={`h-2 w-full rounded-full overflow-hidden mb-8 ${isBrightMode ? 'bg-slate-100' : 'bg-slate-800'}`}>
        <div className="h-full bg-blue-600 transition-all duration-700" style={{ width: `${completionPercentage}%` }} />
      </div>

      {!hasStarted ? (
        <div className={`rounded-3xl border p-8 md:p-10 ${isBrightMode ? 'border-slate-200 bg-white' : 'border-slate-700/60 bg-[#111827]'}`}>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-500 mb-3">Welcome</p>
          <h2 className={`text-2xl md:text-3xl font-black tracking-tight ${isBrightMode ? 'text-slate-900' : 'text-white'}`}>
            Ready to begin the Summative Post-test?
          </h2>
          <p className={`mt-4 text-sm leading-relaxed ${isBrightMode ? 'text-slate-600' : 'text-slate-300'}`}>
            This 30-item test is based on your Pre-test. Passing it moves you forward to the next grading stage. Good luck.
          </p>
          <p className={`mt-2 text-xs font-semibold ${isBrightMode ? 'text-slate-600' : 'text-slate-300'}`}>
            Remaining tries: {attemptsRemaining} of {SUMMATIVE_MAX_FAILED_ATTEMPTS}
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleStartTest}
              className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-colors"
            >
              Start Test
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      ) : null}

      {hasStarted && isSubmitted ? (
        <div className={`rounded-3xl border p-8 text-center ${isBrightMode ? 'border-emerald-200 bg-emerald-50/60' : 'border-emerald-800/40 bg-emerald-900/20'}`}>
          <CheckCircle2 className="mx-auto text-emerald-500 mb-4" size={44} />
          <h2 className={`text-2xl font-black tracking-tight ${isBrightMode ? 'text-slate-900' : 'text-white'}`}>Summative Completed</h2>
          <p className={`mt-2 text-sm ${isBrightMode ? 'text-slate-600' : 'text-slate-300'}`}>
            You scored {formatPoints(score)} out of {formatPoints(totalPossible)} points ({scorePercentage}%).
          </p>
          <p className={`mt-2 text-xs font-black uppercase tracking-wider ${passed ? 'text-emerald-500' : 'text-amber-500'}`}>
            {passed ? 'Passed' : `Need ${SUMMATIVE_PASSING_PERCENTAGE}% to pass`}
          </p>
          <button
            type="button"
            onClick={() => navigate(ROUTE_PATHS.dashboard.results)}
            className="mt-4 inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 transition-colors"
          >
            Go to Learning Results
          </button>
        </div>
      ) : hasStarted ? (
        <>
          <div className="flex flex-col lg:flex-row-reverse gap-6">
            <aside className={`rounded-3xl border p-4 lg:w-64 ${isBrightMode ? 'border-slate-200 bg-white' : 'border-slate-700/60 bg-[#111827]'}`}>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                Questions · {formatPoints(totalPossible)}/{POSTTEST_POINTS_LIMIT} pts
              </p>
              <div className="mt-3 space-y-2 max-h-[60vh] overflow-auto pr-1">
                {questions.map((question, index) => {
                  const isCurrent = index === currentQuestionIndex
                  const isAnswered = selectedAnswers[question.id] !== undefined

                  return (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`w-full flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-left transition-colors ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-500/10'
                          : isBrightMode
                            ? 'border-slate-200 bg-white hover:border-slate-300'
                            : 'border-slate-700/60 bg-[#0f172a] hover:border-slate-600'
                      }`}
                    >
                      <span className={`text-sm font-black ${isBrightMode ? 'text-slate-900' : 'text-white'}`}>
                        Q{index + 1}
                        <span className={`ml-2 text-[10px] font-black uppercase tracking-widest ${isAnswered ? 'text-emerald-500' : 'text-slate-400'}`}>
                          {isAnswered ? 'Done' : 'Todo'}
                        </span>
                      </span>
                      <span className={`shrink-0 text-[11px] font-black ${isBrightMode ? 'text-slate-600' : 'text-slate-300'}`}>
                        {formatPoints(question.weight)} pt{question.weight === 1 ? '' : 's'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </aside>

            <div className="flex-1">
              <article className={`rounded-3xl border p-6 md:p-8 ${isBrightMode ? 'border-slate-200 bg-white' : 'border-slate-700/60 bg-[#111827]'}`}>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">
              Question {currentQuestionIndex + 1} · {formatPoints(currentQuestion?.weight ?? 0)} pt{(currentQuestion?.weight ?? 0) === 1 ? '' : 's'}
            </p>
            <h2 className={`mt-4 text-xl md:text-2xl font-black leading-snug ${isBrightMode ? 'text-slate-900' : 'text-white'}`}>
              {currentQuestion?.question}
            </h2>

            <div className="mt-6 space-y-3">
              {currentQuestion?.options.map((option, optionIndex) => {
                const isSelected = selectedAnswers[currentQuestion.id] === optionIndex

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSelectAnswer(optionIndex)}
                    className={`w-full text-left rounded-2xl border px-4 py-4 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300'
                        : isBrightMode
                          ? 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                          : 'border-slate-700/60 hover:border-slate-600 bg-[#0f172a] text-slate-300'
                    }`}
                  >
                    <span className="font-semibold">{String.fromCharCode(65 + optionIndex)}.</span> {option}
                  </button>
                )
              })}
            </div>
          </article>

          <div className="mt-6 flex items-center justify-end">
            <div className="w-full sm:w-auto flex items-center gap-3">
              {canGoNext || nextAdaptiveQuestion ? (
                <button
                  type="button"
                  onClick={handleAdvance}
                  disabled={!hasAnswerForCurrentQuestion}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={!allAnswered || isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Test'}
                  <CheckCircle2 size={14} />
                </button>
              )}
            </div>
          </div>
            </div>
          </div>
        </>
      ) : null}
    </section>
  )
}

export default SummativePosttestPage
