import { onAuthStateChanged } from 'firebase/auth'
import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useBrightness } from '../../contexts/BrightnessContext'
import { useGradingStage } from '@/contexts/GradingStageContext'
import { getLearningStageConfig, getStageDiagnosticRecord, resolveStageForSelection, type LearningStageKey } from '../data/learningStage'
import {
  PRETEST_POINTS_LIMIT,
  getCATPretestInitialQuestions,
  getCATPretestNextQuestion,
  getDiagnosticQuestionsByIdsForStage,
} from '../data/diagnosticQuestions'
import { auth } from '../../lib/firebase'
import { ROUTE_PATHS } from '../../routes/paths'
import { getUserAssessmentProgress, upsertAssessmentProgress } from '../../services/assessmentProgress'
const DIAGNOSTIC_PASSING_PERCENTAGE = 70

const toPercentage = (correct: number, total: number) => {
  if (total <= 0) {
    return 0
  }

  return Number(((correct / total) * 100).toFixed(2))
}

const formatPoints = (points: number) => String(Math.round(points * 2) / 2).replace(/\.0$/, '')

const DiagnosticPretestPage = () => {
  const { isBrightMode } = useBrightness()
  const { selectedStage } = useGradingStage()
  const navigate = useNavigate()
  const [questions, setQuestions] = useState(() => getCATPretestInitialQuestions('prelim'))
  const [hasStarted, setHasStarted] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [uid, setUid] = useState<string | null>(null)
  const [isHydratingState, setIsHydratingState] = useState(true)
  const [hasEverPassed, setHasEverPassed] = useState(false)
  const [activeStage, setActiveStage] = useState<LearningStageKey>('prelim')
  const [assessmentKey, setAssessmentKey] = useState(getLearningStageConfig('prelim').diagnosticAssessmentKey)

  const currentQuestion = questions[currentQuestionIndex]
  const answeredCount = Object.keys(selectedAnswers).length
  const completionPercentage = Math.round((answeredCount / questions.length) * 100)
  const canGoNext = currentQuestionIndex < questions.length - 1
  const hasAnswerForCurrentQuestion = selectedAnswers[currentQuestion.id] !== undefined
  const allAnswered = answeredCount === questions.length

  const nextAdaptiveQuestion = currentQuestionIndex === questions.length - 1
    ? getCATPretestNextQuestion({
      stage: activeStage,
      questionIds: questions.map((question) => question.id),
      selectedAnswers,
      maxTotalPoints: PRETEST_POINTS_LIMIT,
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

  const competencyBreakdown = useMemo(() => {
    const bucket = new Map<string, { correct: number; total: number }>()

    for (const question of questions) {
      const code = question.competencyCode
      const isCorrect = selectedAnswers[question.id] === question.correctAnswerIndex
      const current = bucket.get(code) ?? { correct: 0, total: 0 }

      current.total += question.weight
      current.correct += isCorrect ? question.weight : 0
      bucket.set(code, current)
    }

    return Object.fromEntries(
      Array.from(bucket.entries()).map(([code, value]) => [
        code,
        {
          correct: value.correct,
          total: value.total,
          percentage: toPercentage(value.correct, value.total),
        },
      ]),
    )
  }, [questions, selectedAnswers])

  const totalPossible = useMemo(() => {
    return questions.reduce((total, question) => total + question.weight, 0)
  }, [questions])

  const scorePercentage = toPercentage(score, totalPossible)
  const passed = scorePercentage >= DIAGNOSTIC_PASSING_PERCENTAGE

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    let isCancelled = false

    const hydrateSavedState = async () => {
      setIsHydratingState(true)

      if (!uid) {
        if (!isCancelled) {
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
      const record = getStageDiagnosticRecord(assessmentMap, stage)

      setActiveStage(stage)
      setAssessmentKey(stageConfig.diagnosticAssessmentKey)

      if (!record) {
        const generatedQuestions = getCATPretestInitialQuestions(stage)
        setQuestions(generatedQuestions)

        if (!isCancelled) {
          setIsHydratingState(false)
        }
        return
      }

      const persistedQuestionIds = (record.questionIds ?? []).filter((questionId) => Number.isFinite(Number(questionId))).map(Number)

      const resolvedQuestions = persistedQuestionIds.length > 0
        ? getDiagnosticQuestionsByIdsForStage(persistedQuestionIds, stage)
        : getCATPretestInitialQuestions(stage)
      setQuestions(resolvedQuestions)

      const restoredAnswers = Object.fromEntries(
        Object.entries(record.selectedAnswers ?? {}).map(([questionId, answerIndex]) => [Number(questionId), Number(answerIndex)]),
      ) as Record<number, number>

      const maxQuestionIndex = resolvedQuestions.length - 1
      const restoredQuestionIndex = Math.min(Math.max(record.currentQuestionIndex ?? 0, 0), maxQuestionIndex)

      setSelectedAnswers(restoredAnswers)
      setCurrentQuestionIndex(restoredQuestionIndex)
      setIsSubmitted(record.isSubmitted ?? false)
      setHasEverPassed(record.passed === true)
      setIsHydratingState(false)
    }

    void hydrateSavedState()

    return () => {
      isCancelled = true
    }
  }, [uid, selectedStage])

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
        passed: hasEverPassed,
        competencyBreakdown,
        questionIds: questions.map((question) => question.id),
        selectedAnswers: selectedAnswersForStorage,
        currentQuestionIndex,
        isSubmitted,
        isFinished: isSubmitted,
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
    hasEverPassed,
    score,
    scorePercentage,
    competencyBreakdown,
    questions.length,
    totalPossible,
  ])

  const handleSelectAnswer = (optionIndex: number) => {
    if (isSubmitted) {
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
    if (!allAnswered) {
      return
    }

    setIsSubmitted(true)
    const finalPassed = hasEverPassed || passed
    setHasEverPassed(finalPassed)

    if (!uid) {
      return
    }

    await upsertAssessmentProgress({
      uid,
      assessmentKey,
      score,
      totalItems: totalPossible,
      percentage: scorePercentage,
      passed: finalPassed,
      competencyBreakdown,
      questionIds: questions.map((question) => question.id),
      selectedAnswers: Object.fromEntries(Object.entries(selectedAnswers).map(([questionId, answerIndex]) => [String(questionId), answerIndex])),
      currentQuestionIndex,
      isSubmitted: true,
      isFinished: true,
    })
  }

  return (
    <section
      className={`rounded-4xl border p-6 md:p-8 ${
        isBrightMode ? 'border-slate-200 bg-white/80' : 'border-slate-700/60 bg-[#0b0e14]/70'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h1 className={`text-3xl font-black tracking-tight ${isBrightMode ? 'text-slate-900' : 'text-white'}`}>
            {getLearningStageConfig(activeStage).label}
          </h1>
          <p className={`mt-2 text-sm ${isBrightMode ? 'text-slate-600' : 'text-slate-400'}`}>
            {activeStage.toUpperCase()} stage assessment. Answer each question to estimate your current mastery before starting the adaptive flow.
          </p>
        </div>

        <div className={`rounded-2xl px-4 py-3 border ${isBrightMode ? 'border-slate-200 bg-slate-50' : 'border-slate-700 bg-[#0f172a]'}`}>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Progress</p>
          <p className={`text-lg font-black ${isBrightMode ? 'text-slate-900' : 'text-white'}`}>{completionPercentage}%</p>
        </div>
      </div>

      <div className={`h-2 w-full rounded-full overflow-hidden mb-8 ${isBrightMode ? 'bg-slate-100' : 'bg-slate-800'}`}>
        <div className="h-full bg-blue-600 transition-all duration-700" style={{ width: `${completionPercentage}%` }} />
      </div>

      {!hasStarted ? (
        <div className={`rounded-3xl border p-8 md:p-10 ${isBrightMode ? 'border-slate-200 bg-white' : 'border-slate-700/60 bg-[#111827]'}`}>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-500 mb-3">Welcome</p>
          <h2 className={`text-2xl md:text-3xl font-black tracking-tight ${isBrightMode ? 'text-slate-900' : 'text-white'}`}>
            Ready to begin {getLearningStageConfig(activeStage).label} Pre-test?
          </h2>
          <p className={`mt-4 text-sm leading-relaxed ${isBrightMode ? 'text-slate-600' : 'text-slate-300'}`}>
            This is a quick check of your current knowledge. It is not recorded as a grade or final score for your course.
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
          <h2 className={`text-2xl font-black tracking-tight ${isBrightMode ? 'text-slate-900' : 'text-white'}`}>Pre-test Completed</h2>
          <p className={`mt-2 text-sm ${isBrightMode ? 'text-slate-600' : 'text-slate-300'}`}>
            You scored {formatPoints(score)} out of {formatPoints(totalPossible)} points ({scorePercentage}%).
          </p>
          <p className={`mt-2 text-xs font-black uppercase tracking-wider ${passed ? 'text-emerald-500' : 'text-amber-500'}`}>
            {passed ? 'Passed' : `Need ${DIAGNOSTIC_PASSING_PERCENTAGE}% to pass`}
          </p>
          <button
            type="button"
            onClick={() => navigate(ROUTE_PATHS.dashboard.gapAnalysis)}
            className="mt-3 inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 transition-colors"
          >
            Go to Gap Analysis
            <ChevronRight size={14} />
          </button>
        </div>
      ) : hasStarted ? (
        <>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <article className={`rounded-3xl border p-6 md:p-8 ${isBrightMode ? 'border-slate-200 bg-white' : 'border-slate-700/60 bg-[#111827]'}`}>
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">
                  Question {currentQuestionIndex + 1} · {formatPoints(currentQuestion.weight)} pt{currentQuestion.weight === 1 ? '' : 's'}
                </p>
            <h2 className={`mt-4 text-xl md:text-2xl font-black leading-snug ${isBrightMode ? 'text-slate-900' : 'text-white'}`}>
              {currentQuestion.question}
            </h2>

            <div className="mt-6 space-y-3">
              {currentQuestion.options.map((option, optionIndex) => {
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
                      onClick={handleSubmit}
                      disabled={!allAnswered}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit Test
                      <CheckCircle2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <aside className={`rounded-3xl border p-4 lg:w-64 ${isBrightMode ? 'border-slate-200 bg-white' : 'border-slate-700/60 bg-[#111827]'}`}>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                Questions · {formatPoints(totalPossible)}/{PRETEST_POINTS_LIMIT} pts
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
          </div>
        </>
      ) : null}
    </section>
  )
}

export default DiagnosticPretestPage
