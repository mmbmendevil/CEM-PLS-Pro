import { onAuthStateChanged } from 'firebase/auth'
import { useEffect, useMemo, useState } from 'react'
import { BookOpen, CheckCircle2, ChevronRight, GraduationCap, Lock, Sparkles, Unlock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useBrightness } from '../../contexts/BrightnessContext'
import { useGradingStage } from '@/contexts/GradingStageContext'
import { MODULES_CATALOG, type ModuleCatalogItem } from '../data/modulesCatalog'
import { getLearningStageConfig, getStageDiagnosticRecord, type LearningStageKey } from '../data/learningStage'
import { auth } from '../../lib/firebase'
import { ROUTE_PATHS } from '../../routes/paths'
import { getUserAssessmentProgress } from '../../services/assessmentProgress'
import { getUserModuleProgress } from '../../services/moduleProgress'

type ModuleItem = ModuleCatalogItem & {
  isCompleted: boolean
  isAvailable?: boolean
}

type TermGroup = {
  key: LearningStageKey
  label: string
  startId: number
  endId: number
  unlockByAssessmentKey?: string
  gateAssessmentKey: string
  legacyGateAssessmentKeys: string[]
  gateLabel: string
}

const TERM_GROUPS: TermGroup[] = [
  {
    key: 'prelim',
    label: 'Prelim',
    startId: 1,
    endId: 3,
    gateAssessmentKey: getLearningStageConfig('prelim').diagnosticAssessmentKey,
    legacyGateAssessmentKeys: getLearningStageConfig('prelim').legacyDiagnosticAssessmentKeys,
    gateLabel: 'Prelim',
  },
  {
    key: 'midterm',
    label: 'Midterm',
    startId: 4,
    endId: 6,
    unlockByAssessmentKey: 'prelim-summative-posttest',
    gateAssessmentKey: getLearningStageConfig('midterm').diagnosticAssessmentKey,
    legacyGateAssessmentKeys: getLearningStageConfig('midterm').legacyDiagnosticAssessmentKeys,
    gateLabel: 'Midterm',
  },
  {
    key: 'final',
    label: 'Final',
    startId: 7,
    endId: 9,
    unlockByAssessmentKey: 'midterm-summative-posttest',
    gateAssessmentKey: getLearningStageConfig('final').diagnosticAssessmentKey,
    legacyGateAssessmentKeys: getLearningStageConfig('final').legacyDiagnosticAssessmentKeys,
    gateLabel: 'Final',
  },
]

const getModuleTermLabel = (moduleId: number) => {
  const term = TERM_GROUPS.find((group) => moduleId >= group.startId && moduleId <= group.endId)
  return term?.label ?? 'Prelim'
}

const ModulesPage = () => {
  const { isBrightMode } = useBrightness()
  const { selectedStage, setSelectedStage } = useGradingStage()
  const navigate = useNavigate()
  const [activeModuleId, setActiveModuleId] = useState<number>(1)
  const [unlockedTermIndex, setUnlockedTermIndex] = useState(0)
  const [hasPassedCurrentGate, setHasPassedCurrentGate] = useState(false)
  const [modules, setModules] = useState<ModuleItem[]>(
    MODULES_CATALOG.map((module) => ({
      ...module,
      isCompleted: false,
      isAvailable: module.id === 1,
    })),
  )

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUnlockedTermIndex(0)
        setHasPassedCurrentGate(false)
        setModules(
          MODULES_CATALOG.map((module, index) => ({
            ...module,
            isCompleted: false,
            isAvailable: index === 0,
          })),
        )
        setActiveModuleId(1)
        return
      }

      const [progressRecords, assessmentRecords] = await Promise.all([
        getUserModuleProgress(user.uid),
        getUserAssessmentProgress(user.uid),
      ])

      const progressMap = new Map(progressRecords.map((record) => [record.moduleId, record]))
      const assessmentMap = new Map(assessmentRecords.map((record) => [record.assessmentKey, record]))

      let nextUnlockedTermIndex = 0
      for (let termIndex = 1; termIndex < TERM_GROUPS.length; termIndex += 1) {
        const requiredAssessmentKey = TERM_GROUPS[termIndex].unlockByAssessmentKey

        if (!requiredAssessmentKey) {
          nextUnlockedTermIndex = termIndex
          continue
        }

        const hasPassedRequiredAssessment = assessmentMap.get(requiredAssessmentKey)?.passed === true

        if (!hasPassedRequiredAssessment) {
          break
        }

        nextUnlockedTermIndex = termIndex
      }

      const selectedTermIndex = selectedStage
        ? TERM_GROUPS.findIndex((termGroup) => termGroup.key === selectedStage)
        : nextUnlockedTermIndex
      const displayedTermIndex = Math.min(selectedTermIndex < 0 ? nextUnlockedTermIndex : selectedTermIndex, nextUnlockedTermIndex)

      if (selectedStage && selectedTermIndex > nextUnlockedTermIndex) {
        setSelectedStage(TERM_GROUPS[nextUnlockedTermIndex].key)
      }

      const visibleEndModuleId = TERM_GROUPS[displayedTermIndex].endId
      const activeTerm = TERM_GROUPS[displayedTermIndex]
      const hasCurrentGatePass =
        getStageDiagnosticRecord(assessmentMap, activeTerm.key)?.passed === true ||
        activeTerm.legacyGateAssessmentKeys.some((legacyKey) => assessmentMap.get(legacyKey)?.passed === true)

      const nextModules = MODULES_CATALOG.map((module, index) => {
        const currentRecord = progressMap.get(module.id)
        const previousRecord = index > 0 ? progressMap.get(MODULES_CATALOG[index - 1].id) : null
        const isCompleted = currentRecord?.isCompleted ?? (currentRecord?.overallProgress ?? 0) >= 100
        const isWithinVisibleTerm = module.id <= visibleEndModuleId
        const isAvailable =
          isWithinVisibleTerm &&
          (index === 0 || previousRecord?.isCompleted === true || (previousRecord?.overallProgress ?? 0) >= 100 || isCompleted)

        return {
          ...module,
          isCompleted,
          isAvailable,
        }
      })

      const visibleModules = nextModules.filter((module) => module.id <= visibleEndModuleId)
      const firstAvailableModule = visibleModules.find((module) => module.isAvailable) ?? visibleModules[0]
      setUnlockedTermIndex(displayedTermIndex)
      setHasPassedCurrentGate(hasCurrentGatePass)
      setModules(nextModules)
      setActiveModuleId(firstAvailableModule.id)
    })

    return unsubscribe
  }, [selectedStage, setSelectedStage])

  const visibleEndModuleId = TERM_GROUPS[unlockedTermIndex].endId
  const visibleModules = useMemo(
    () => modules.filter((module) => module.id <= visibleEndModuleId),
    [modules, visibleEndModuleId],
  )
  const completedCount = visibleModules.filter((module) => module.isCompleted).length
  const totalModules = visibleModules.length
  const progressPercentage = Math.round((completedCount / totalModules) * 100)

  const activeModule = useMemo(
    () => visibleModules.find((module) => module.id === activeModuleId) ?? visibleModules[0],
    [activeModuleId, visibleModules],
  )
  const activeTermLabel = getModuleTermLabel(activeModule.id)
  const activeTerm = TERM_GROUPS[unlockedTermIndex]
  const activeTermModules = useMemo(
    () => modules.filter((module) => module.id >= activeTerm.startId && module.id <= activeTerm.endId),
    [modules, activeTerm.endId, activeTerm.startId],
  )
  const canTakePretest = activeTermModules.length > 0 && activeTermModules.every((module) => module.isCompleted)

  const surface = isBrightMode ? 'bg-white/80 border-slate-200' : 'bg-[#111827] border-slate-700/60'
  const mutedText = isBrightMode ? 'text-slate-500' : 'text-slate-400'
  const pretestButtonClass = isBrightMode
  ? canTakePretest
    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20'
    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
  : canTakePretest
    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20'
    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'

  const handleEnterModule = (module: ModuleItem) => {
    if (!module.isCompleted && !module.isAvailable) {
      return
    }

    setActiveModuleId(module.id)
    navigate(ROUTE_PATHS.dashboard.moduleViewer, {
      state: {
        moduleId: module.id,
        progress: progressPercentage,
      },
    })
  }

  const handleStartPretest = () => {
    if (canTakePretest) {
      navigate(ROUTE_PATHS.dashboard.diagnostic)
    }
  }

  return (
    <main className={`min-h-[calc(100vh-6rem)] rounded-4xl p-6 md:p-10 ${surface}`}>
      <div className="space-y-12 animate-in fade-in duration-1000 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-4 border-b border-slate-200/70 dark:border-slate-700/60">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em]">{activeTermLabel}</span>
              <span className="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest">
                Learning Materials
              </span>
            </div>
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${isBrightMode ? 'border-slate-200 bg-white' : 'border-slate-700 bg-[#0f172a]'}`}>
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">Competency</span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${isBrightMode ? 'text-slate-900' : 'text-white'}`}>
                {activeModule.competencyCode}
              </span>
            </div>
            <h1 className={`text-3xl md:text-5xl font-black tracking-tight flex items-center gap-4 ${isBrightMode ? 'text-slate-900' : 'text-white'}`}>
              <div className="h-14 w-14 bg-blue-600 rounded-[1.25rem] flex items-center justify-center shadow-xl shadow-blue-500/20 text-white">
                <BookOpen size={28} />
              </div>
              Course Modules
            </h1>
            <p className={mutedText}>Finish the active term modules and pass its gate test to unlock the next term.</p>
          </div>

          <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 border ${isBrightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#0f172a] border-slate-700/60'}`}>
            <Sparkles className="text-amber-500" size={18} />
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.25em] ${mutedText}`}>Active Module</p>
              <p className={`text-sm font-black uppercase tracking-tight ${isBrightMode ? 'text-slate-900' : 'text-white'}`}>{activeModule.title}</p>
            </div>
          </div>
        </div>

        <div className={`rounded-[2.5rem] p-8 lg:p-10 border shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 ${surface}`}>
          <div className="flex items-center gap-6">
            <div className="h-14 w-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600">
              <GraduationCap size={24} />
            </div>
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Progress</div>
              <div className={`text-2xl font-black uppercase tracking-tight ${isBrightMode ? 'text-slate-900' : 'text-white'}`}>
                {completedCount} / {totalModules} Modules Completed
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-sm px-4 w-full">
            <div className={`h-2 w-full rounded-full overflow-hidden ${isBrightMode ? 'bg-slate-100' : 'bg-slate-800'}`}>
              <div className="h-full bg-blue-600 transition-all duration-[1.5s]" style={{ width: `${progressPercentage}%` }} />
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartPretest}
            disabled={!canTakePretest}
            className={`h-16 px-10 rounded-[1.25rem] font-black uppercase tracking-widest text-[10px] gap-3 flex items-center transition-all disabled:cursor-not-allowed disabled:opacity-80 ${pretestButtonClass}`}
          >
            {hasPassedCurrentGate ? (
              <CheckCircle2 size={16} className={isBrightMode ? 'text-emerald-600' : 'text-emerald-400'} />
            ) : canTakePretest ? (
              <Unlock size={16} className={isBrightMode ? 'text-blue-600' : 'text-blue-400'} />
            ) : (
              <Lock size={16} className={isBrightMode ? 'text-slate-400' : 'text-slate-500'} />
            )}
            {hasPassedCurrentGate
              ? `${activeTerm.gateLabel} Passed`
              : canTakePretest
                ? `Take ${activeTerm.gateLabel} Pre-test`
                : `Complete ${activeTerm.label} to unlock`}
          </button>
        </div>

        <div className="space-y-10 pb-10">
          {TERM_GROUPS.map((termGroup) => {
            const shouldHideTerm = termGroup.endId > visibleEndModuleId

            if (shouldHideTerm) {
              return null
            }

            const termModules = modules.filter((module) => module.id >= termGroup.startId && module.id <= termGroup.endId)
            const termCompleted = termModules.filter((module) => module.isCompleted).length

            return (
              <section key={termGroup.key}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-lg md:text-xl font-black uppercase tracking-[0.12em] ${isBrightMode ? 'text-slate-900' : 'text-white'}`}>
                    {termGroup.label} Modules
                  </h2>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${mutedText}`}>
                    {termCompleted} / {termModules.length} completed
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {termModules.map((module) => (
                    <ModuleCard
                      key={module.id}
                      module={module}
                      isBrightMode={isBrightMode}
                      isSelected={activeModuleId === module.id}
                      onOpen={handleEnterModule}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </main>
  )
}

const ModuleCard = ({
  module,
  isBrightMode,
  isSelected,
  onOpen,
}: {
  module: ModuleItem
  isBrightMode: boolean
  isSelected: boolean
  onOpen: (module: ModuleItem) => void
}) => {
  const isAvailable = module.isAvailable && !module.isCompleted
  const locked = !module.isCompleted && !isAvailable

  return (
    <button
      type="button"
      onClick={() => onOpen(module)}
      className={`group relative text-left rounded-[2.5rem] p-8 lg:p-10 shadow-sm transition-all duration-300 flex flex-col justify-between hover:-translate-y-2 hover:shadow-2xl cursor-pointer border ${
        isSelected ? 'ring-2 ring-blue-500/50' : ''
      } ${
        module.isCompleted
          ? isBrightMode
            ? 'bg-white border-emerald-100'
            : 'bg-[#111827] border-emerald-900/30'
          : isAvailable
            ? isBrightMode
              ? 'bg-white border-blue-200'
              : 'bg-[#111827] border-blue-800/60'
            : isBrightMode
              ? 'bg-white border-slate-100 opacity-80'
              : 'bg-[#111827] border-slate-700/60 opacity-80'
      }`}
    >
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner ${module.isCompleted ? 'bg-emerald-50 text-emerald-500' : isAvailable ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
            {module.isCompleted ? <CheckCircle2 size={20} /> : locked ? <Lock size={20} /> : <BookOpen size={20} />}
          </div>
          <span className={`px-3 py-1 rounded-full font-black text-[8px] uppercase tracking-widest ${module.isCompleted ? 'bg-emerald-50 text-emerald-600' : isAvailable ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
            {module.isCompleted ? 'Completed' : isAvailable ? 'Available' : 'Locked'}
          </span>
        </div>

        <div className="space-y-3">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Module {module.id}</div>
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 border ${isBrightMode ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-slate-700 bg-slate-800 text-slate-200'}`}>
            <span className="text-[9px] font-black uppercase tracking-[0.25em]">Code</span>
            <span className="text-[10px] font-black uppercase tracking-widest">{module.competencyCode}</span>
          </div>
          <h3 className={`text-xl font-black uppercase tracking-tight leading-tight group-hover:text-blue-600 transition-colors ${isBrightMode ? 'text-slate-900' : 'text-white'}`}>
            {module.title}
          </h3>
          <p className={`text-xs leading-relaxed line-clamp-3 ${isBrightMode ? 'text-slate-500' : 'text-slate-400'}`}>
            {module.description}
          </p>
        </div>
      </div>

      <div className={`mt-8 w-full h-12 rounded-xl font-black uppercase tracking-widest text-[9px] gap-2 flex items-center justify-center transition-all border ${module.isCompleted ? 'border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200' : isAvailable ? 'bg-blue-600 text-white border-transparent hover:bg-blue-700 shadow-xl shadow-blue-500/20' : 'bg-slate-100 text-slate-400 border-transparent dark:bg-slate-800'}`}>
        {module.isCompleted ? 'Review Module' : locked ? 'Locked Module' : 'Enter Module'}
        <ChevronRight size={12} />
      </div>
    </button>
  )
}

export default ModulesPage
