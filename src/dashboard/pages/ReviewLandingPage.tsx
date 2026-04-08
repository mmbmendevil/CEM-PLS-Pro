import { onAuthStateChanged } from 'firebase/auth'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useGradingStage } from '@/contexts/GradingStageContext'
import { getStageDiagnosticRecord, resolveStageForSelection } from '../data/learningStage'
import { auth } from '../../lib/firebase'
import { ROUTE_PATHS } from '../../routes/paths'
import { getUserAssessmentProgress } from '../../services/assessmentProgress'

type LandingState = {
  redirectNotice?: string
  playInitAnimation?: boolean
}

type InitStep = {
  id: number
  label: string
}

const initSteps: InitStep[] = [
  { id: 1, label: 'Reading reviewer progress' },
  { id: 2, label: 'Preparing prioritized review flow' },
  { id: 3, label: 'Loading review deck' },
  { id: 4, label: 'Opening reviewer view' },
]

const REVIEWER_INIT_MIN_DURATION = 4200
const REVIEWER_INIT_STEP_DURATION = 950

const getInitSeenStorageKey = (uid: string, stage: string) => `review-init-seen:${uid}:${stage}`

const ReviewLandingPage = () => {
  const { selectedStage } = useGradingStage()
  const location = useLocation()
  const navigate = useNavigate()
  const [uid, setUid] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [targetRoute, setTargetRoute] = useState<string>(ROUTE_PATHS.dashboard.reviewFlashcards)
  const [resolvedStage, setResolvedStage] = useState<'prelim' | 'midterm' | 'final'>('prelim')
  const [activeStep, setActiveStep] = useState(0)
  const [canPlayInitAnimation, setCanPlayInitAnimation] = useState(false)
  const [canContinue, setCanContinue] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    let isCancelled = false

    const resolveTargetRoute = async () => {
      setIsLoading(true)

      if (!uid) {
        if (!isCancelled) {
          setTargetRoute(ROUTE_PATHS.dashboard.reviewFlashcards)
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
      const activeRecord = getStageDiagnosticRecord(assessmentMap, activeStage)
      const preference = activeRecord?.reviewerPreference
      const landingState = (location.state as LandingState | null) ?? {}
      const initRequested = landingState.playInitAnimation === true
      const initSeenKey = getInitSeenStorageKey(uid, activeStage)
      const initSeen = window.localStorage.getItem(initSeenKey) === 'true'

      setResolvedStage(activeStage)
      setCanPlayInitAnimation(initRequested && !initSeen)

      if (preference === 'audiobook') {
        setTargetRoute(ROUTE_PATHS.dashboard.reviewAudiobook)
      } else if (preference === 'cheatsheet-pdf' || preference === 'cheatsheet-image') {
        setTargetRoute(ROUTE_PATHS.dashboard.reviewCheatsheet)
      } else {
        setTargetRoute(ROUTE_PATHS.dashboard.reviewFlashcards)
      }

      setIsLoading(false)
    }

    void resolveTargetRoute()

    return () => {
      isCancelled = true
    }
  }, [location.state, selectedStage, uid])

  const landingState = (location.state as LandingState | null) ?? {}
  const redirectNotice = landingState.redirectNotice ?? ''

  useEffect(() => {
    if (!canPlayInitAnimation || isLoading || !uid) {
      return
    }

    window.localStorage.setItem(getInitSeenStorageKey(uid, resolvedStage), 'true')
    setActiveStep(0)
    const timers: number[] = []

    initSteps.forEach((_, index) => {
      const timerId = window.setTimeout(() => {
        setActiveStep(index)
      }, index * REVIEWER_INIT_STEP_DURATION)
      timers.push(timerId)
    })

    const completeTimer = window.setTimeout(() => {
      setActiveStep(initSteps.length - 1)
      setCanContinue(true)
    }, REVIEWER_INIT_MIN_DURATION)

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
      window.clearTimeout(completeTimer)
    }
  }, [canPlayInitAnimation, isLoading, navigate, redirectNotice, resolvedStage, targetRoute, uid])

  if (isLoading) {
    return <section className="rounded-3xl border border-cyan-900/40 bg-[#05070d] p-10 text-lg text-slate-200">Loading review page...</section>
  }

  if (canPlayInitAnimation) {
    return (
      <section className="relative overflow-hidden rounded-3xl border border-cyan-900/40 bg-[#05070d] p-10 md:p-12 text-slate-100">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-16 h-52 w-52 rounded-full bg-cyan-700/30 blur-3xl" />
          <div className="absolute -bottom-24 -right-20 h-64 w-64 rounded-full bg-emerald-700/20 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl space-y-8 text-center">
          {redirectNotice ? (
            <div className="rounded-2xl border border-sky-900/40 bg-sky-950/30 px-5 py-4 text-base text-sky-300">
              {redirectNotice}
            </div>
          ) : null}
          <div>
            <motion.div
              animate={{ scale: [1, 1.05, 1], opacity: [0.9, 1, 0.9] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-cyan-900/30 text-cyan-300"
            >
              <span className="text-3xl font-black">R</span>
            </motion.div>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white">Initializing Review Page</h1>
            <p className="mt-3 text-lg text-slate-300">Your reviewer is ready.</p>
          </div>

          <div className="space-y-3 text-left">
            {initSteps.map((step, index) => {
              const done = index < activeStep
              const active = index === activeStep

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0.65, y: 8 }}
                  animate={{ opacity: active || done ? 1 : 0.72, y: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className={`flex items-center gap-3 rounded-2xl border p-4 md:p-5 ${done ? 'border-emerald-800 bg-emerald-900/20' : active ? 'border-cyan-800 bg-cyan-900/20' : 'border-slate-700 bg-slate-900/40'}`}
                >
                  <div className={`h-3 w-3 rounded-full ${done ? 'bg-emerald-400' : active ? 'bg-cyan-400' : 'bg-slate-500'}`} />
                  <p className="font-semibold text-slate-100">{step.label}</p>
                </motion.div>
              )
            })}
          </div>
          {canContinue && (
            <button onClick={() => navigate(targetRoute, { replace: true, state: redirectNotice ? { redirectNotice } : undefined })} className="mt-4 rounded bg-blue-500 px-4 py-2 text-white">
              Proceed to Review
            </button>
          )}
        </div>
      </section>
    )
  }

  return (
    <Navigate
      to={targetRoute}
      replace
      state={redirectNotice ? { redirectNotice } : undefined}
    />
  )
}

export default ReviewLandingPage
