import {
  LayoutGrid,
  Book,
  User,
  Layers,
  ClipboardCheck,
  BrainCircuit,
  FileText,
  CheckSquare,
  BarChart,
  Award,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronDown,
} from 'lucide-react'
import { onAuthStateChanged } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useBrightness } from '../contexts/BrightnessContext'
import { useGradingStage } from '@/contexts/GradingStageContext'
import {
  areStageModulesCompleted,
  getStageDiagnosticRecord,
  getStageSummativeRecord,
  hasReviewerForStage,
  isCourseLocked,
  resolveLearningStage,
  getLearningStageConfig,
  type LearningStageKey,
} from './data/learningStage'
import { auth } from '../lib/firebase'
import { ROUTE_PATHS } from '../routes/paths'
import { getUserAssessmentProgress } from '../services/assessmentProgress'
import { getUserModuleProgress } from '../services/moduleProgress'

type NavItemProps = {
  icon: React.ReactNode
  label: string
  isActive?: boolean
  isLocked?: boolean
  isUnlocked?: boolean
  subtitle?: string
  to?: string
  isCollapsed?: boolean
  isBrightMode?: boolean
  statusIcon?: React.ReactNode
}

type StageOption = {
  key: LearningStageKey
  label: string
  subtitle: string
}

const STAGE_OPTIONS: StageOption[] = [
  { key: 'prelim', label: 'Prelim', subtitle: 'Semester 1' },
  { key: 'midterm', label: 'Midterm', subtitle: 'Semester 2' },
  { key: 'final', label: 'Finals', subtitle: 'Semester 3' },
]

const getStageUnlockStatus = (
  stage: LearningStageKey,
  assessmentMap: Map<string, ReturnType<typeof getStageDiagnosticRecord> extends infer R ? R extends undefined ? never : NonNullable<R> : never>,
) => {
  if (stage === 'prelim') {
    return { unlocked: true, reason: '' }
  }

  const previousStage = stage === 'midterm' ? 'prelim' : 'midterm'
  const previousSummativeKey = getLearningStageConfig(previousStage).summativeAssessmentKey
  const previousSummative = assessmentMap.get(previousSummativeKey)
  const previousPassed = previousSummative?.passed === true && previousSummative?.isSubmitted === true && previousSummative?.isFinished === true

  if (!previousPassed) {
    return {
      unlocked: false,
      reason: stage === 'midterm' ? 'Locked until Prelim is passed' : 'Locked until Midterm is passed',
    }
  }

  return { unlocked: true, reason: '' }
}

const NavItem = ({ icon, label, isActive, isLocked, isUnlocked, subtitle, to, isCollapsed, isBrightMode, statusIcon }: NavItemProps) => {
  const classes = `relative group flex items-center px-4 py-3 rounded-xl transition-all cursor-pointer ${
    isActive
      ? isBrightMode
        ? 'bg-blue-50 text-blue-700'
        : 'bg-[#161f31] text-blue-400'
      : isBrightMode
        ? 'hover:bg-gray-200/60 hover:text-gray-900'
        : 'hover:bg-gray-800/30 hover:text-gray-200'
  } ${isLocked ? 'opacity-70' : ''} ${isCollapsed ? 'justify-center px-2' : ''}`

  const content = (
    <>
      {isActive && <div className="absolute right-3 w-1.5 h-6 bg-blue-500 rounded-full" />}

      <div className={`flex items-center w-full transition-all duration-300 ${isCollapsed ? 'justify-center gap-0' : 'justify-start gap-4'}`}>
        <div
          className={`shrink-0 ${
            isActive
              ? 'text-blue-500'
              : isUnlocked
                ? 'text-blue-500'
                : isBrightMode
                  ? 'text-gray-600'
                  : 'text-gray-500'
          }`}
        >
          {icon}
        </div>

        <div
          className={`flex flex-col overflow-hidden whitespace-nowrap transition-all duration-300 ${
            isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-40 opacity-100 ml-0'
          }`}
        >
          <span
            className={`text-sm font-semibold tracking-wide ${
              isActive
                ? isBrightMode
                  ? 'text-blue-700'
                  : 'text-blue-100'
                : isUnlocked
                  ? 'text-blue-400'
                  : isBrightMode
                    ? 'text-gray-900'
                    : ''
            }`}
          >
            {label}
          </span>
          {subtitle ? (
            <span
              className={`text-[9px] font-bold tracking-widest ${
                isActive
                  ? 'text-blue-500'
                  : isUnlocked
                    ? 'text-blue-500'
                    : isBrightMode
                      ? 'text-gray-500'
                      : 'text-gray-600'
              }`}
            >
              {subtitle}
            </span>
          ) : null}
        </div>

        <div className={`ml-auto flex items-center transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-3.5'}`}>
          {statusIcon ?? (
            isLocked ? <Lock size={14} className={isBrightMode ? 'text-gray-500' : 'text-gray-600'} /> : null
          )}
        </div>
      </div>
    </>
  )

  if (to) {
    return (
      <Link to={to} className={classes} title={isCollapsed ? label : undefined}>
        {content}
      </Link>
    )
  }

  return (
    <div className={classes} title={isCollapsed ? label : undefined}>
      {content}
    </div>
  )
}

const Sidebar = () => {
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { isBrightMode } = useBrightness()
  const { selectedStage, setSelectedStage } = useGradingStage()
  const [resolvedStage, setResolvedStage] = useState<LearningStageKey>('prelim')
  const [isGapAnalysisUnlocked, setIsGapAnalysisUnlocked] = useState(false)
  const [isPostTestGapAnalysisUnlocked, setIsPostTestGapAnalysisUnlocked] = useState(false)
  const [isDiagnosticUnlocked, setIsDiagnosticUnlocked] = useState(false)
  const [isStudyPlanUnlocked, setIsStudyPlanUnlocked] = useState(false)
  const [isReviewUnlocked, setIsReviewUnlocked] = useState(false)
  const [isSummativeUnlocked, setIsSummativeUnlocked] = useState(false)
  const [isResultsUnlocked, setIsResultsUnlocked] = useState(false)
  const [isCertificationUnlocked, setIsCertificationUnlocked] = useState(false)
  const [hasPassedSummative, setHasPassedSummative] = useState(false)
  const [hasReviewerCreated, setHasReviewerCreated] = useState(false)
  const [courseLocked, setCourseLocked] = useState(false)
  const [stageLocks, setStageLocks] = useState<Record<LearningStageKey, { unlocked: boolean; reason: string }>>({
    prelim: { unlocked: true, reason: '' },
    midterm: { unlocked: false, reason: 'Locked until Prelim is passed' },
    final: { unlocked: false, reason: 'Locked until Midterm is passed' },
  })

  useEffect(() => {
    let isCancelled = false

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsGapAnalysisUnlocked(false)
        setIsPostTestGapAnalysisUnlocked(false)
        setIsDiagnosticUnlocked(false)
        setIsStudyPlanUnlocked(false)
        setIsReviewUnlocked(false)
        setIsSummativeUnlocked(false)
        setIsResultsUnlocked(false)
        setIsCertificationUnlocked(false)
        setHasPassedSummative(false)
        setHasReviewerCreated(false)
        setCourseLocked(false)
        setStageLocks({
          prelim: { unlocked: true, reason: '' },
          midterm: { unlocked: false, reason: 'Locked until Prelim is passed' },
          final: { unlocked: false, reason: 'Locked until Midterm is passed' },
        })
        return
      }

      const [moduleRecords, diagnosticRecord] = await Promise.all([
        getUserModuleProgress(user.uid),
        getUserAssessmentProgress(user.uid),
      ])

      if (isCancelled) {
        return
      }

      const assessmentMap = new Map(diagnosticRecord.map((record) => [record.assessmentKey, record]))
      const activeStage = resolveLearningStage(assessmentMap)
      const prelimLock = getStageUnlockStatus('prelim', assessmentMap)
      const midtermLock = getStageUnlockStatus('midterm', assessmentMap)
      const finalLock = getStageUnlockStatus('final', assessmentMap)

      setResolvedStage(activeStage)

      if (selectedStage === null) {
        setSelectedStage(activeStage)
      }

      const displayedStage = selectedStage ?? activeStage
      const displayedStageRecord = getStageDiagnosticRecord(assessmentMap, displayedStage)
      const displayedStageSummativeRecord = getStageSummativeRecord(assessmentMap, displayedStage)
      const finalStageSummativeRecord = getStageSummativeRecord(assessmentMap, 'final')
      const lockedCourse = isCourseLocked(assessmentMap)

      setIsDiagnosticUnlocked(areStageModulesCompleted(moduleRecords, displayedStage))
      setIsGapAnalysisUnlocked(displayedStageRecord?.isSubmitted === true || displayedStageRecord?.isFinished === true)
      setIsPostTestGapAnalysisUnlocked(
        (displayedStageSummativeRecord?.isSubmitted === true || displayedStageSummativeRecord?.isFinished === true) && 
        displayedStageSummativeRecord?.passed === false
      )
      setIsStudyPlanUnlocked(displayedStageRecord?.isStudyPlanUnlocked === true)
      setIsReviewUnlocked(displayedStageRecord?.isReviewUnlocked === true)
      setIsSummativeUnlocked(displayedStageRecord?.isReviewUnlocked === true)
      setIsResultsUnlocked(displayedStageSummativeRecord?.isSubmitted === true || displayedStageSummativeRecord?.isFinished === true)
      setIsCertificationUnlocked(finalStageSummativeRecord?.isSubmitted === true || finalStageSummativeRecord?.isFinished === true)
      setHasPassedSummative(displayedStageSummativeRecord?.passed === true)
      setHasReviewerCreated(hasReviewerForStage(displayedStageRecord))
      setCourseLocked(lockedCourse)

      setStageLocks({
        prelim: prelimLock,
        midterm: midtermLock,
        final: finalLock,
      })

      const selectedStageIsUnlocked = stageLocks[displayedStage]?.unlocked ?? true
      if (!selectedStageIsUnlocked && displayedStage !== activeStage) {
        setSelectedStage(activeStage)
      }
    })

    return () => {
      isCancelled = true
      unsubscribe()
    }
  }, [selectedStage, setSelectedStage])

  const isDashboardActive = location.pathname === ROUTE_PATHS.dashboard.home
  const isCoursesActive = location.pathname === ROUTE_PATHS.dashboard.courses
  const isProfileActive = location.pathname === ROUTE_PATHS.dashboard.profile
  const isModulesActive = location.pathname === ROUTE_PATHS.dashboard.modules
  const isDiagnosticActive = location.pathname === ROUTE_PATHS.dashboard.diagnostic
  const isGapAnalysisActive = location.pathname === ROUTE_PATHS.dashboard.gapAnalysis
  const isPostTestGapAnalysisActive = location.pathname === ROUTE_PATHS.dashboard.postTestGapAnalysis
  const isStudyPlanActive = location.pathname === ROUTE_PATHS.dashboard.studyPlan
  const isReviewActive =
    location.pathname === ROUTE_PATHS.dashboard.review ||
    location.pathname === ROUTE_PATHS.dashboard.reviewFlashcards ||
    location.pathname === ROUTE_PATHS.dashboard.reviewAudiobook ||
    location.pathname === ROUTE_PATHS.dashboard.reviewCheatsheet
  const isPostTestActive = location.pathname === ROUTE_PATHS.dashboard.postTest
  const isResultsActive = location.pathname === ROUTE_PATHS.dashboard.results
  const isCertificationActive = location.pathname === ROUTE_PATHS.dashboard.certification
  const effectiveStage = selectedStage ?? resolvedStage
  const effectiveStageConfig = getLearningStageConfig(effectiveStage)
  const effectiveStageIsLocked = !stageLocks[effectiveStage]?.unlocked

  return (
    <div
      className={`sticky top-0 h-screen shrink-0 border-r flex flex-col font-sans transition-all duration-300 ${
        isBrightMode ? 'bg-[#f6f3ea] border-gray-200 text-gray-700' : 'bg-[#111827] border-slate-700/60 text-gray-400'
      } ${
        isCollapsed ? 'w-20' : 'w-72'
      } overflow-hidden`}
    >
      <div className={`pb-4 flex items-center ${isCollapsed ? 'p-4 justify-center' : 'p-8 gap-2'}`}>
        <div className="flex items-end gap-0.5">
          <div className="w-1.5 h-3 bg-blue-500 rounded-full" />
          <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
          <div className="w-1.5 h-4 bg-blue-400 rounded-full" />
        </div>
        <span
          className={`text-xl font-bold tracking-tight overflow-hidden whitespace-nowrap transition-all duration-300 ${
            isBrightMode ? 'text-gray-900' : 'text-white'
          } ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-35 opacity-100'}`}
        >
          CEM<span className="text-blue-500">.</span>
        </span>
      </div>

      <div className={`flex-1 overflow-y-auto py-6 space-y-8 ${isCollapsed ? 'px-2' : 'px-4'}`}>
        <section>
          <h3
            className={`px-4 text-[10px] font-bold tracking-[0.2em] uppercase mb-4 overflow-hidden whitespace-nowrap transition-all duration-300 ${
              isCollapsed ? 'max-h-0 opacity-0 mb-0' : 'max-h-8 opacity-100'
            }`}
          >
            Overview
          </h3>
          <nav className="space-y-1">
            <NavItem
              icon={<LayoutGrid size={20} />}
              label="Dashboard"
              isActive={isDashboardActive}
              to={ROUTE_PATHS.dashboard.home}
              isCollapsed={isCollapsed}
              isBrightMode={isBrightMode}
            />
            <NavItem
              icon={<Book size={20} />}
              label="Courses"
              isActive={isCoursesActive}
              isUnlocked={!courseLocked}
              isLocked={courseLocked}
              subtitle={courseLocked ? 'LOCKED' : 'BROWSE'}
              to={!courseLocked ? ROUTE_PATHS.dashboard.courses : undefined}
              isCollapsed={isCollapsed}
              isBrightMode={isBrightMode}
            />
            <NavItem
              icon={<User size={20} />}
              label="Profile"
              isActive={isProfileActive}
              to={ROUTE_PATHS.dashboard.profile}
              isCollapsed={isCollapsed}
              isBrightMode={isBrightMode}
            />
          </nav>
        </section>

        <section>
          <h3
            className={`px-4 text-[10px] font-bold tracking-[0.2em] uppercase mb-4 overflow-hidden whitespace-nowrap transition-all duration-300 ${
              isBrightMode ? 'text-gray-500' : 'text-gray-500'
            } ${isCollapsed ? 'max-h-0 opacity-0 mb-0' : 'max-h-8 opacity-100'}`}
          >
            Grading Stages
          </h3>
          <div className={isCollapsed ? 'hidden' : 'px-4'}>
            <div
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                isBrightMode ? 'border-gray-200 bg-white' : 'border-gray-700/60 bg-[#0b1220]'
              }`}
            >
              <span className={`text-[9px] font-black uppercase tracking-[0.22em] shrink-0 ${isBrightMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Stage
              </span>
              <div className="relative flex-1 min-w-0">
                <select
                  value={effectiveStageIsLocked ? resolvedStage : effectiveStage}
                  onChange={(event) => {
                    const nextStage = event.target.value as LearningStageKey
                    if (stageLocks[nextStage]?.unlocked) {
                      setSelectedStage(nextStage)
                    }
                  }}
                  className={`w-full appearance-none rounded-md py-0.5 pl-1 pr-6 text-sm font-semibold outline-none ${
                    isBrightMode ? 'bg-white text-gray-900' : 'bg-[#0b1220] text-gray-100'
                  }`}
                  aria-label="Select grading stage"
                >
                  {STAGE_OPTIONS.map((stageOption) => {
                    const isLocked = !stageLocks[stageOption.key]?.unlocked

                    return (
                      <option
                        key={stageOption.key}
                        value={stageOption.key}
                        className={isBrightMode ? 'bg-white text-gray-900' : 'bg-[#0b1220] text-gray-100'}
                        disabled={isLocked}
                      >
                        {stageOption.label}{isLocked ? ` - ${stageLocks[stageOption.key]?.reason ?? 'Locked'}` : ''}
                      </option>
                    )
                  })}
                </select>
                <ChevronDown
                  size={13}
                  className={`pointer-events-none absolute right-0.5 top-1/2 -translate-y-1/2 ${isBrightMode ? 'text-gray-500' : 'text-gray-400'}`}
                />
              </div>
            </div>
            <p className={`mt-1.5 px-1 text-[9px] font-medium uppercase tracking-[0.22em] ${isBrightMode ? 'text-gray-500' : 'text-gray-500'}`}>
              Viewing: {effectiveStageConfig.label}
            </p>
          </div>
        </section>

        <section>
          <h3
            className={`px-4 text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase mb-4 overflow-hidden whitespace-nowrap transition-all duration-300 ${
              isCollapsed ? 'max-h-0 opacity-0 mb-0' : 'max-h-8 opacity-100'
            }`}
          >
            Learning Flow
          </h3>
          <nav className="space-y-1">
            <NavItem
              icon={<Layers size={20} />}
              label="Course Modules"
              isActive={isModulesActive}
              isUnlocked={!courseLocked && !effectiveStageIsLocked}
              isLocked={courseLocked || effectiveStageIsLocked}
              subtitle={courseLocked || effectiveStageIsLocked ? 'LOCKED' : 'CURRENT'}
              to={!courseLocked && !effectiveStageIsLocked ? ROUTE_PATHS.dashboard.modules : undefined}
              isCollapsed={isCollapsed}
              isBrightMode={isBrightMode}
            />
            <NavItem
              icon={<ClipboardCheck size={20} />}
              label="Diagnostic Pre-test"
              isActive={isDiagnosticActive}
              isUnlocked={!courseLocked && isDiagnosticUnlocked}
              isLocked={courseLocked || !isDiagnosticUnlocked}
              subtitle={!courseLocked && isDiagnosticUnlocked ? 'UNLOCKED' : 'LOCKED'}
              statusIcon={!courseLocked && isDiagnosticUnlocked ? <Unlock size={14} className={isBrightMode ? 'text-blue-500' : 'text-blue-400'} /> : undefined}
              to={!courseLocked && isDiagnosticUnlocked ? ROUTE_PATHS.dashboard.diagnostic : undefined}
              isCollapsed={isCollapsed}
              isBrightMode={isBrightMode}
            />
            <NavItem
              icon={<BrainCircuit size={20} />}
              label="Gap Analysis"
              isActive={isGapAnalysisActive}
              isUnlocked={!courseLocked && isGapAnalysisUnlocked}
              isLocked={courseLocked || !isGapAnalysisUnlocked}
              subtitle={!courseLocked && isGapAnalysisUnlocked ? 'UNLOCKED' : 'LOCKED'}
              statusIcon={!courseLocked && isGapAnalysisUnlocked ? <Unlock size={14} className={isBrightMode ? 'text-blue-500' : 'text-blue-400'} /> : undefined}
              to={!courseLocked && isGapAnalysisUnlocked ? ROUTE_PATHS.dashboard.gapAnalysis : undefined}
              isCollapsed={isCollapsed}
              isBrightMode={isBrightMode}
            />
            {!hasReviewerCreated ? (
              <NavItem
                icon={<FileText size={20} />}
                label="Personalized Study Plan"
                isActive={isStudyPlanActive}
                isUnlocked={!courseLocked && isStudyPlanUnlocked}
                isLocked={courseLocked || !isStudyPlanUnlocked}
                subtitle={!courseLocked && isStudyPlanUnlocked ? 'UNLOCKED' : 'LOCKED'}
                statusIcon={!courseLocked && isStudyPlanUnlocked ? <Unlock size={14} className={isBrightMode ? 'text-blue-500' : 'text-blue-400'} /> : undefined}
                to={!courseLocked && isStudyPlanUnlocked ? ROUTE_PATHS.dashboard.studyPlan : undefined}
                isCollapsed={isCollapsed}
                isBrightMode={isBrightMode}
              />
            ) : (
              <NavItem
                icon={<FileText size={20} />}
                label="Review Page"
                isActive={isReviewActive}
                isUnlocked={!courseLocked && isReviewUnlocked}
                isLocked={courseLocked || !isReviewUnlocked}
                subtitle={!courseLocked && isReviewUnlocked ? 'READY' : 'LOCKED'}
                statusIcon={!courseLocked && isReviewUnlocked ? <Unlock size={14} className={isBrightMode ? 'text-blue-500' : 'text-blue-400'} /> : undefined}
                to={!courseLocked && isReviewUnlocked ? ROUTE_PATHS.dashboard.review : undefined}
                isCollapsed={isCollapsed}
                isBrightMode={isBrightMode}
              />
            )}
            <NavItem
              icon={<CheckSquare size={20} />}
              label="Summative Post-test"
              isActive={isPostTestActive}
              isUnlocked={!courseLocked && isSummativeUnlocked}
              isLocked={courseLocked || !isSummativeUnlocked}
              subtitle={!courseLocked && isSummativeUnlocked ? 'UNLOCKED' : 'LOCKED'}
              statusIcon={!courseLocked && isSummativeUnlocked ? <Unlock size={14} className={isBrightMode ? 'text-blue-500' : 'text-blue-400'} /> : undefined}
              to={!courseLocked && isSummativeUnlocked ? ROUTE_PATHS.dashboard.postTest : undefined}
              isCollapsed={isCollapsed}
              isBrightMode={isBrightMode}
            />
            {isPostTestGapAnalysisUnlocked && (
              <NavItem
                icon={<BrainCircuit size={20} />}
                label="Post-Test Gap Analysis"
                isActive={isPostTestGapAnalysisActive}
                isUnlocked={!courseLocked && isPostTestGapAnalysisUnlocked}
                isLocked={courseLocked}
                subtitle={!courseLocked && isPostTestGapAnalysisUnlocked ? 'FAILED TEST' : 'LOCKED'}
                statusIcon={!courseLocked && isPostTestGapAnalysisUnlocked ? <Unlock size={14} className={isBrightMode ? 'text-blue-500' : 'text-blue-400'} /> : undefined}
                to={!courseLocked && isPostTestGapAnalysisUnlocked ? ROUTE_PATHS.dashboard.postTestGapAnalysis : undefined}
                isCollapsed={isCollapsed}
                isBrightMode={isBrightMode}
              />
            )}
            <NavItem
              icon={<BarChart size={20} />}
              label="Learning Results"
              isActive={isResultsActive}
              isUnlocked={isResultsUnlocked}
              isLocked={!isResultsUnlocked}
              subtitle={
                isResultsUnlocked
                  ? hasPassedSummative
                    ? 'PASSED'
                    : 'RETAKE REQUIRED'
                  : 'LOCKED'
              }
              statusIcon={isResultsUnlocked ? <Unlock size={14} className={isBrightMode ? 'text-blue-500' : 'text-blue-400'} /> : undefined}
              to={isResultsUnlocked ? ROUTE_PATHS.dashboard.results : undefined}
              isCollapsed={isCollapsed}
              isBrightMode={isBrightMode}
            />
            {isCertificationUnlocked ? (
              <NavItem
                icon={<Award size={20} />}
                label="Certification"
                isActive={isCertificationActive}
                isUnlocked={true}
                subtitle="UNLOCKED"
                statusIcon={<Unlock size={14} className={isBrightMode ? 'text-blue-500' : 'text-blue-400'} />}
                to={ROUTE_PATHS.dashboard.certification}
                isCollapsed={isCollapsed}
                isBrightMode={isBrightMode}
              />
            ) : null}
          </nav>
        </section>
      </div>

      <div className={`p-6 border-t flex justify-center ${isBrightMode ? 'border-gray-200' : 'border-gray-800/50'}`}>
        <button
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className={`transition-colors ${isBrightMode ? 'text-gray-500 hover:text-gray-900' : 'text-gray-600 hover:text-white'}`}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft size={20} />
        </button>
      </div>
    </div>
  )
}

export default Sidebar
