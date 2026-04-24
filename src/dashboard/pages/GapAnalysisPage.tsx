import { onAuthStateChanged } from 'firebase/auth'
import {
  Activity,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  CirclePlay,
  ListTodo,
  Lock,
  Map as MapIcon,
  Target,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Background, Handle, Position, ReactFlow, type Edge, type Node, type NodeProps } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useBrightness } from '../../contexts/BrightnessContext'
import { useGradingStage } from '@/contexts/GradingStageContext'
import { getLearningStageConfig, getStageDiagnosticRecord, hasReviewerForStage, resolveStageForSelection, type LearningStageKey } from '../data/learningStage'
import { auth } from '../../lib/firebase'
import { ROUTE_PATHS } from '../../routes/paths'
import { getUserAssessmentProgress, upsertAssessmentProgress } from '../../services/assessmentProgress'
import { computeModuleGapPerformance, getDiagnosticQuestionPoolForStage, getDiagnosticQuestionsByIdsForStage, normalizeSelectedAnswersForStage } from '../data/diagnosticQuestions'
const GAP_ANALYSIS_PASSING_PERCENTAGE = 75

const toPercentage = (correct: number, total: number) => {
  if (total <= 0) {
    return 0
  }

  return Number(((correct / total) * 100).toFixed(2))
}

const formatPercentage = (value: number) => {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

const getRecommendationFeedback = (percent: number) => {
  if (percent <= 0) {
    return 'Why are you even here?'
  }

  if (percent >= 90) {
    return 'Excellent mastery in this module. Keep momentum by reviewing only the few missed questions and challenge yourself with advanced practice.'
  }

  if (percent >= 75) {
    return 'You passed this module. Keep working on the missed questions to strengthen mastery.'
  }

  if (percent >= 50) {
    return 'You are close to passing. Review the weak concepts and answer the missed questions again.'
  }

  return 'You have to work on this module more. Revisit core concepts first, then practice this set again.'
}

type ConceptNodeData = {
  label: string
  percentage: number
  color: string
}

const RECOMMENDED_TOPIC_NOTES: Record<string, string> = {
  'CPU Components': 'Review how the ALU, Control Unit, and registers coordinate instruction execution and control signals.',
  'Architecture Fundamentals': 'Focus on Von Neumann vs. Harvard trade-offs, bottlenecks, and why parallel instruction/data access matters.',
  'Memory Hierarchy': 'Focus on locality, hit/miss behavior, and why the hierarchy balances speed, cost, and capacity.',
  'Cache Organization': 'Review cache hits/misses, mapping methods, associativity trade-offs, and data-oriented access patterns.',
  'Virtual Memory and ECC': 'Focus on paging, address translation, protection/isolation, and performance trade-offs like TLB behavior.',
  'Instruction Set Architecture': 'Review RISC vs. CISC trade-offs, instruction formats, and pipeline-friendly decoding considerations.',
  'Pipelining and Hazards': 'Practice identifying hazards, understanding stalls, and reasoning about throughput and structural limits.',
  'Advanced Execution': 'Review ILP limits, out-of-order execution, renaming, and why deeper pipelines trade off with penalties.',
  'Performance Analysis': 'Practice execution-time reasoning using instruction count, CPI, and clock frequency; apply Amdahl’s Law.',
}

type GapTabKey = 'overview' | 'concept-graph' | 'recommendations' | 'study-plan'

const GapAnalysisPage = () => {
  const { isBrightMode } = useBrightness()
  const { selectedStage } = useGradingStage()
  const navigate = useNavigate()
  const [uid, setUid] = useState<string | null>(null)
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [score, setScore] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [questionIds, setQuestionIds] = useState<number[]>([])
  const [isUnlockingStudyPlan, setIsUnlockingStudyPlan] = useState(false)
  const [isOpeningPersonalizedStudyPlan, setIsOpeningPersonalizedStudyPlan] = useState(false)
  const [hasReviewerCreated, setHasReviewerCreated] = useState(false)
  const [activeStage, setActiveStage] = useState<LearningStageKey>('prelim')
  const [assessmentKey, setAssessmentKey] = useState(getLearningStageConfig('prelim').diagnosticAssessmentKey)
  const [activeTab, setActiveTab] = useState<GapTabKey>('overview')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    let isCancelled = false

    const loadAccess = async () => {
      setIsCheckingAccess(true)

      if (!uid) {
        if (!isCancelled) {
          setIsUnlocked(false)
          setIsCheckingAccess(false)
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

      const unlocked = record?.isSubmitted === true || record?.isFinished === true
      setActiveStage(stage)
      setAssessmentKey(stageConfig.diagnosticAssessmentKey)
      setIsUnlocked(unlocked)
      setHasReviewerCreated(hasReviewerForStage(record))
      setScore(record?.score ?? 0)
      setTotalItems(record?.totalItems ?? 0)
      setQuestionIds((record?.questionIds ?? []).map(Number).filter((questionId) => Number.isFinite(questionId)))
      setSelectedAnswers(
        normalizeSelectedAnswersForStage(
          Object.fromEntries(Object.entries(record?.selectedAnswers ?? {}).map(([questionId, answerIndex]) => [Number(questionId), Number(answerIndex)])),
          stage,
        ),
      )
      setIsCheckingAccess(false)
    }

    void loadAccess()

    return () => {
      isCancelled = true
    }
  }, [uid, selectedStage])

  const activeQuestions = useMemo(() => {
    if (questionIds.length <= 0) {
      return getDiagnosticQuestionPoolForStage(activeStage)
    }

    return getDiagnosticQuestionsByIdsForStage(questionIds, activeStage)
  }, [questionIds, activeStage])

  const moduleResults = useMemo(() => {
    return computeModuleGapPerformance(activeQuestions, selectedAnswers, activeStage)
  }, [activeQuestions, selectedAnswers, activeStage])

  const radarData = useMemo(() => {
    const palette = [
      { color: 'bg-cyan-500', stroke: '#06b6d4' },
      { color: 'bg-indigo-500', stroke: '#6366f1' },
      { color: 'bg-emerald-500', stroke: '#10b981' },
      { color: 'bg-amber-500', stroke: '#f59e0b' },
    ]

    return moduleResults.map((entry, index) => {
      const style = palette[index % palette.length]
      return {
        label: entry.module,
        percent: Number(entry.modulePerformance.toFixed(2)),
        color: style.color,
        stroke: style.stroke,
        moduleGapScore: entry.moduleGapScore,
        moduleTotalWeight: entry.moduleTotalWeight,
        totalQuestions: entry.totalQuestions,
        wrongQuestions: entry.wrongQuestions,
      }
    })
  }, [moduleResults])

  const moduleResultByModule = useMemo(() => {
    return new Map(moduleResults.map((entry) => [entry.module, entry]))
  }, [moduleResults])

  const computedPercentage = useMemo(() => {
    return toPercentage(score, totalItems)
  }, [score, totalItems])

  const knowledgeGaps = useMemo(() => {
    return moduleResults.filter((entry) => entry.modulePerformance < GAP_ANALYSIS_PASSING_PERCENTAGE).length
  }, [moduleResults])

  const chartPeak = useMemo(() => {
    return Math.max(100, ...radarData.map((entry) => entry.percent))
  }, [radarData])

  const conceptNodes = useMemo<Node<ConceptNodeData>[]>(() => {
    const graphItems = radarData.map((item) => ({
      label: item.label,
      percentage: item.percent,
      color: item.stroke,
    }))

    const highestPercentage = Math.max(...graphItems.map((item) => item.percentage))
    const lowestPercentage = Math.min(...graphItems.map((item) => item.percentage))
    const percentageRange = highestPercentage - lowestPercentage
    const topY = 60
    const bottomY = 260

    return graphItems.map((item, index) => ({
      id: item.label,
      type: 'conceptNode',
      position: {
        x: 100 + index * 250,
        y:
          percentageRange === 0
            ? Math.round((topY + bottomY) / 2)
            : Math.round(bottomY - ((item.percentage - lowestPercentage) / percentageRange) * (bottomY - topY)),
      },
      data: {
        label: item.label,
        percentage: item.percentage,
        color: item.color,
      },
      draggable: false,
      selectable: false,
    }))
  }, [radarData])

  const conceptEdges = useMemo<Edge[]>(() => {
    if (conceptNodes.length < 2) {
      return []
    }

    return conceptNodes.slice(0, -1).map((node, index) => ({
      id: `${node.id}->${conceptNodes[index + 1].id}`,
      source: node.id,
      target: conceptNodes[index + 1].id,
      animated: true,
      style: { stroke: isBrightMode ? '#94a3b8' : '#475569', strokeWidth: 2 },
    }))
  }, [conceptNodes, isBrightMode])

  const handleJumpToConceptGraph = useCallback(() => {
    setActiveTab('concept-graph')
  }, [])

  const handleTabSelect = useCallback(
    (tab: GapTabKey) => {
      setActiveTab(tab)
    },
    [],
  )

  const isQualified = computedPercentage >= GAP_ANALYSIS_PASSING_PERCENTAGE

  const handleAnalyzeConcepts = async () => {
    if (!uid || isUnlockingStudyPlan) {
      return
    }

    setIsUnlockingStudyPlan(true)

    try {
      await upsertAssessmentProgress({
        uid,
        assessmentKey,
        score,
        totalItems,
        percentage: computedPercentage,
        passed: isQualified,
        questionIds,
        isSubmitted: true,
        isFinished: true,
        isStudyPlanUnlocked: true,
      })

      handleJumpToConceptGraph()
    } finally {
      setIsUnlockingStudyPlan(false)
    }
  }

  const handleOpenPersonalizedStudyPlan = async () => {
    if (!uid || isOpeningPersonalizedStudyPlan) {
      return
    }

    setIsOpeningPersonalizedStudyPlan(true)

    try {
      await upsertAssessmentProgress({
        uid,
        assessmentKey,
        score,
        totalItems,
        percentage: computedPercentage,
        passed: isQualified,
        questionIds,
        isSubmitted: true,
        isFinished: true,
        isStudyPlanUnlocked: true,
      })

      if (hasReviewerCreated) {
        navigate(ROUTE_PATHS.dashboard.review, {
          state: { redirectNotice: 'Reviewer already created. Redirected to Review Page.' },
        })
      } else {
        navigate(ROUTE_PATHS.dashboard.studyPlan)
      }
    } finally {
      setIsOpeningPersonalizedStudyPlan(false)
    }
  }

  const pageSurface = isBrightMode ? 'bg-[#f8f5ee] text-slate-900' : 'bg-[#050505] text-slate-100'
  const cardSurface = isBrightMode ? 'bg-white/90 border-amber-100/80 shadow-[0_18px_60px_-30px_rgba(15,23,42,0.18)]' : 'bg-[#111827] border-slate-700/60'
  const mutedText = isBrightMode ? 'text-slate-600' : 'text-slate-400'
  const softSurface = isBrightMode ? 'bg-gradient-to-br from-amber-50 to-white border-amber-100/80' : 'bg-slate-900/50 border-slate-800'
  const progressTrack = isBrightMode ? 'bg-slate-200' : 'bg-slate-800'
  const highlightText = isBrightMode ? 'text-slate-900' : 'text-white'
  const lightAccent = isBrightMode ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' : 'bg-indigo-900/30 text-indigo-400'

  if (isCheckingAccess) {
    return <main className={`rounded-4xl border p-8 ${pageSurface} ${isBrightMode ? 'border-amber-100/80' : 'border-slate-700/60'}`}>Loading...</main>
  }

  if (!isUnlocked) {
    return (
      <main className={`rounded-4xl border p-8 md:p-10 ${pageSurface} ${isBrightMode ? 'border-amber-100/80 shadow-[0_18px_60px_-30px_rgba(15,23,42,0.18)]' : 'border-slate-700/60'}`}>
        <p className={`text-[11px] font-black uppercase tracking-[0.25em] ${isBrightMode ? 'text-amber-500' : 'text-amber-400'}`}>Locked</p>
        <h1 className={`mt-3 text-3xl font-black tracking-tight ${highlightText}`}>Gap Analysis is locked</h1>
        <p className={`mt-3 max-w-xl ${mutedText}`}>
          Take and submit {getLearningStageConfig(activeStage).label} Pre-test first. After submission, this page will automatically unlock.
        </p>
        <Link
          to={ROUTE_PATHS.dashboard.diagnostic}
          className={`mt-6 inline-flex h-12 items-center gap-2 rounded-xl px-6 text-[10px] font-black uppercase tracking-widest text-white transition-colors ${isBrightMode ? 'bg-linear-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          Go to {getLearningStageConfig(activeStage).label} Pre-test
          <ArrowRight size={14} />
        </Link>
      </main>
    )
  }

  return (
    <main className={`flex-1 overflow-y-auto selection:bg-indigo-500/30 rounded-4xl border ${pageSurface} ${isBrightMode ? 'border-amber-100/80' : 'border-slate-700/60'}`}>
      <div className="max-w-350 mx-auto px-4 sm:px-8 lg:px-12 py-8 pb-32">
        <div className={`max-w-7xl mx-auto px-6 py-6 border-b ${isBrightMode ? 'border-amber-100/80' : 'border-slate-800/50'}`}>
          <div className="hidden md:flex items-start justify-between gap-0">
            <StepItem icon={<CirclePlay size={20} />} label="Modules" status="Done" />
            <Divider />
            <StepItem icon={<CirclePlay size={20} />} label="Pre-Test" status="Done" />
            <Divider />
            <StepItem icon={<CirclePlay size={20} />} label="Diagnosis" status="Current" active />
            <Divider />
            <StepItem icon={<Lock size={16} />} label="Study Plan" status="Locked" />
            <Divider />
            <StepItem icon={<Lock size={16} />} label="Post-Test" status="Locked" />
            <Divider />
            <StepItem icon={<Lock size={16} />} label="Results" status="Locked" />
          </div>
        </div>

        <section className="max-w-7xl mx-auto px-6 py-12 space-y-10">
          <div className="text-center space-y-4">
            <span className={`inline-flex items-center px-4 py-1.5 rounded-full font-black uppercase tracking-widest text-[10px] ${lightAccent}`}>
              Learning Diagnosis
            </span>
            <h1 className={`text-4xl md:text-6xl font-black tracking-tighter ${highlightText}`}>Gap Analysis</h1>
            <p className={`font-medium max-w-2xl mx-auto text-lg ${mutedText}`}>
              Your personalized diagnostic report based on the Pre-Test assessment.
            </p>
          </div>

          <div className={`border rounded-[2.5rem] p-4 shadow-sm flex items-center justify-between ${cardSurface}`}>
            <TabButton icon={<Target size={20} />} label="Overview" active={activeTab === 'overview'} onClick={() => handleTabSelect('overview')} />
            <div className={`flex-1 h-0.5 mx-4 rounded-full ${progressTrack}`} />
            <TabButton icon={<MapIcon size={20} />} label="Concept Graph" active={activeTab === 'concept-graph'} onClick={() => handleTabSelect('concept-graph')} />
            <div className={`flex-1 h-0.5 mx-4 rounded-full ${progressTrack}`} />
            <TabButton icon={<ListTodo size={20} />} label="Recommendations" active={activeTab === 'recommendations'} onClick={() => handleTabSelect('recommendations')} />
            <div className={`flex-1 h-0.5 mx-4 rounded-full ${progressTrack}`} />
            <TabButton icon={<BookOpen size={20} />} label="Study Plan" active={activeTab === 'study-plan'} onClick={() => handleTabSelect('study-plan')} />
          </div>

          <div className="grid grid-cols-1 gap-12">
            {activeTab === 'overview' ? (
              <>
                <div className={`flex flex-col lg:flex-row items-center justify-between gap-12 border rounded-[3rem] p-10 transition-all hover:shadow-md ${cardSurface}`}>
              <div className="space-y-6 flex-1 text-center lg:text-left">
                <h2 className={`text-3xl font-black tracking-tight uppercase ${highlightText}`}>Pre-Test Results</h2>
                <p className={`font-medium max-w-lg leading-relaxed text-lg ${mutedText}`}>
                  Your initial diagnostic assessment reveals your current understanding across core competencies.
                </p>
                <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-2">
                  <Badge
                    label="Academy Status"
                    value={isQualified ? 'Qualified' : 'Not Qualified'}
                    color={isQualified ? 'text-emerald-600' : 'text-rose-500'}
                  />
                  <Badge label="Knowledge Gaps" value={`${knowledgeGaps}`} color={highlightText} />
                </div>
              </div>

              <div className={`flex flex-col sm:flex-row items-center gap-8 p-8 rounded-[2.5rem] border shrink-0 ${softSurface}`}>
                <div className="flex flex-col items-center gap-2">
                  <div className={`h-28 w-28 rounded-full shadow-xl flex flex-col items-center justify-center text-white border-4 ${isBrightMode ? 'bg-linear-to-br from-blue-600 to-indigo-600 border-white/90 shadow-blue-500/20' : 'bg-indigo-600 border-indigo-100 dark:border-indigo-900/50'}`}>
                    <span className="text-3xl font-black">{computedPercentage.toFixed(0) + '%'}</span>
                  </div>
                  <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${isBrightMode ? 'text-slate-500' : 'text-slate-400'}`}>Score</p>
                </div>
                <div className={`hidden sm:block h-20 w-px ${isBrightMode ? 'bg-amber-100' : 'bg-slate-700'}`}></div>
                <div className="text-center sm:text-left">
                  <h3 className={`text-3xl font-black tracking-tighter ${highlightText}`}>
                    {score + '/' + totalItems}
                  </h3>
                  <p className={`text-xs font-bold uppercase tracking-wider ${mutedText}`}>Correct</p>
                </div>
              </div>
                </div>

                <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6 ${isBrightMode ? 'bg-linear-to-br from-slate-900 to-slate-700 text-white' : 'bg-white text-slate-900'}`}>
                  <Activity size={24} />
                </div>
                <div>
                  <h2 className={`text-xl font-black uppercase tracking-tight ${highlightText}`}>Skill Radar</h2>
                  <p className={`text-xs font-medium ${mutedText}`}>Mastery overview per concept.</p>
                </div>
              </div>

              <div className={`rounded-[3rem] border p-6 md:p-10 min-h-100 flex flex-col gap-8 ${cardSurface}`}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
                  {radarData.map((entry) => (
                    <SkillStat key={entry.label} label={entry.label} percent={entry.percent} color={entry.color} />
                  ))}
                </div>

                <div className={`rounded-[2.5rem] border p-4 md:p-6 ${isBrightMode ? 'bg-linear-to-br from-slate-50 to-white border-slate-200' : 'bg-slate-950/50 border-slate-800'}`}>
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${mutedText}`}>Radar Visualization</p>
                      <p className={`text-sm font-medium ${mutedText}`}>A spider chart of concept and cognition performance from your submitted pre-test.</p>
                    </div>
                    <div className={`text-right ${mutedText}`}>
                      <p className="text-[10px] font-black uppercase tracking-[0.25em]">Peak</p>
                      <p className={`text-lg font-black ${highlightText}`}>{formatPercentage(chartPeak)}%</p>
                    </div>
                  </div>

                  <div className="h-80 md:h-104 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} outerRadius="70%">
                        <PolarGrid stroke={isBrightMode ? '#cbd5e1' : '#334155'} opacity={0.35} />
                        <PolarAngleAxis dataKey="label" tick={{ fontSize: 11, fill: isBrightMode ? '#334155' : '#cbd5e1', fontWeight: 700 }} />
                        <Tooltip
                          cursor={{ fill: isBrightMode ? 'rgba(59,130,246,0.08)' : 'rgba(99,102,241,0.12)' }}
                          formatter={(value) => [`${formatPercentage(Number(value))}%`, 'Mastery']}
                          labelFormatter={(label) => `Skill: ${label}`}
                          contentStyle={{
                            background: isBrightMode ? 'rgba(255,255,255,0.96)' : 'rgba(15,23,42,0.96)',
                            border: isBrightMode ? '1px solid rgba(226,232,240,0.9)' : '1px solid rgba(51,65,85,0.9)',
                            borderRadius: '1rem',
                            color: isBrightMode ? '#0f172a' : '#e2e8f0',
                            boxShadow: '0 20px 40px -20px rgba(15,23,42,0.35)',
                          }}
                        />
                        <Radar name="Mastery" dataKey="percent" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.32} strokeWidth={3} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={handleAnalyzeConcepts}
                    disabled={isUnlockingStudyPlan}
                    className={`h-16 px-10 rounded-2xl text-white font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-lg transition-transform active:scale-95 disabled:opacity-80 disabled:cursor-not-allowed ${isBrightMode ? 'bg-linear-to-r from-blue-600 via-indigo-600 to-violet-600 shadow-blue-500/20 hover:from-blue-700 hover:via-indigo-700 hover:to-violet-700' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'}`}
                  >
                    {isUnlockingStudyPlan ? 'Analyzing...' : 'Analyze Concepts'}
                    <ArrowRight size={18} />
                  </button>
                </div>
              </>
            ) : null}

            {activeTab === 'concept-graph' ? (
              <section className="space-y-6">
              <div className="flex items-center gap-6">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg transform rotate-6 ${isBrightMode ? 'bg-linear-to-br from-indigo-600 to-blue-600 text-white' : 'bg-slate-100 text-slate-900'}`}>
                  <MapIcon size={24} />
                </div>
                <div>
                  <h2 className={`text-xl font-black uppercase tracking-tight ${highlightText}`}>Concept Graph</h2>
                  <p className={`text-xs font-medium ${mutedText}`}>Interactive competency map generated from your pre-test scores.</p>
                </div>
              </div>

              <div className={`rounded-[3rem] border p-6 md:p-8 ${cardSurface}`}>
                <div className="mb-5 flex flex-wrap items-center gap-2">
                  {radarData.map((entry) => (
                    <span
                      key={`legend-${entry.label}`}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${isBrightMode ? 'border-slate-200 bg-white text-slate-700' : 'border-slate-700 bg-slate-900 text-slate-200'}`}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.stroke }} />
                      {entry.label}
                    </span>
                  ))}
                </div>

                <div className={`rounded-4xl border overflow-hidden ${isBrightMode ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-[#020617]'}`}>
                  <div className="h-125 w-full">
                    <ReactFlow
                      nodes={conceptNodes}
                      edges={conceptEdges}
                      fitView
                      fitViewOptions={{ padding: 0.3 }}
                      nodesDraggable={false}
                      nodesConnectable={false}
                      elementsSelectable={false}
                      proOptions={{ hideAttribution: true }}
                      nodeTypes={{ conceptNode: ConceptNode }}
                    >
                      <Background color={isBrightMode ? '#cbd5e1' : '#334155'} gap={22} size={1} />
                    </ReactFlow>
                  </div>
                </div>

                <div className={`mt-6 rounded-3xl border p-5 ${isBrightMode ? 'border-slate-200 bg-slate-50' : 'border-slate-700 bg-slate-900/50'}`}>
                  <p className={`text-[10px] font-black uppercase tracking-[0.25em] mb-3 ${mutedText}`}>Concept Dependency Chain</p>
                  <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    {radarData.map((entry, index) => (
                      <div key={`chain-${entry.label}`} className="inline-flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-widest ${isBrightMode ? 'border-slate-200 bg-white text-slate-700' : 'border-slate-700 bg-slate-800 text-slate-200'}`}
                        >
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.stroke }} />
                          {entry.label}
                        </span>
                        {index < radarData.length - 1 ? <ArrowRight size={14} className={mutedText} /> : null}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => handleTabSelect('overview')}
                    className={`inline-flex items-center gap-2 h-11 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest ${isBrightMode ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
                  >
                    <ArrowLeft size={14} />
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabSelect('recommendations')}
                    className={`inline-flex items-center gap-2 h-11 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white ${isBrightMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                  >
                    Recommended Topics
                    <ArrowRight size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabSelect('study-plan')}
                    className={`inline-flex items-center gap-2 h-11 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white ${isBrightMode ? 'bg-slate-900 hover:bg-slate-800' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    Next Study Plan Panel
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
              </section>
            ) : null}

            {activeTab === 'recommendations' ? (
              <section className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg transform rotate-6 ${isBrightMode ? 'bg-linear-to-br from-emerald-600 to-cyan-600 text-white' : 'bg-slate-100 text-slate-900'}`}>
                    <ListTodo size={24} />
                  </div>
                  <div>
                    <h2 className={`text-xl font-black uppercase tracking-tight ${highlightText}`}>Recommended Topics</h2>
                    <p className={`text-xs font-medium ${mutedText}`}>Priority topics generated from your weakest competencies.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...radarData]
                    .sort((a, b) => a.percent - b.percent)
                    .map((entry, index) => {
                      const stats = moduleResultByModule.get(entry.label) ?? { wrongQuestions: 0, totalQuestions: 0 }
                      const feedback = getRecommendationFeedback(entry.percent)

                      return (
                        <article
                          key={`recommend-${entry.label}`}
                          className={`rounded-3xl border p-5 ${isBrightMode ? 'border-slate-200 bg-white' : 'border-slate-700 bg-slate-900/50'}`}
                        >
                          <p className={`text-[10px] font-black uppercase tracking-[0.25em] ${mutedText}`}>Priority #{index + 1}</p>
                          <h3 className={`mt-2 text-lg font-black ${highlightText}`}>
                            {entry.label}
                          </h3>
                          <p className={`mt-2 text-sm ${mutedText}`}>{RECOMMENDED_TOPIC_NOTES[entry.label] ?? 'Review this module in depth.'}</p>
                          <p
                            className={`mt-3 text-xs font-black uppercase tracking-widest ${entry.percent >= 90 ? 'text-cyan-500' : entry.percent >= 75 ? 'text-emerald-500' : entry.percent >= 50 ? 'text-amber-500' : 'text-rose-500'}`}
                          >
                            Current mastery: {formatPercentage(entry.percent)}%
                          </p>
                          <p className={`mt-2 text-xs font-semibold ${mutedText}`}>
                            Mistakes: {stats.wrongQuestions} of {stats.totalQuestions} questions
                          </p>
                          <p className={`mt-2 text-xs leading-relaxed ${mutedText}`}>{feedback}</p>
                        </article>
                      )
                    })}
                </div>

                <div className="flex justify-end">
                  <div className="flex flex-wrap justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => handleTabSelect('concept-graph')}
                      className={`inline-flex items-center gap-2 h-11 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest ${isBrightMode ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
                    >
                      <ArrowLeft size={14} />
                      Back to Concept Graph
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTabSelect('study-plan')}
                      className={`inline-flex items-center gap-2 h-11 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white ${isBrightMode ? 'bg-slate-900 hover:bg-slate-800' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                      Next Study Plan Panel
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </section>
            ) : null}

            {activeTab === 'study-plan' ? (
              <section className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg transform rotate-6 ${isBrightMode ? 'bg-linear-to-br from-blue-700 to-indigo-700 text-white' : 'bg-slate-100 text-slate-900'}`}>
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h2 className={`text-xl font-black uppercase tracking-tight ${highlightText}`}>Study Plan Panel</h2>
                    <p className={`text-xs font-medium ${mutedText}`}>Finalize your gap analysis flow and proceed to your personalized reviewer.</p>
                  </div>
                </div>

                <div className={`rounded-[2.5rem] border p-6 md:p-8 ${isBrightMode ? 'bg-slate-900 text-white border-slate-800' : 'bg-[#020617] text-white border-slate-800'}`}>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">Learning Flow</p>
                  <h3 className="mt-3 text-2xl md:text-3xl font-black tracking-tight">Next Panel: Personalized Study Plan</h3>
                  <p className="mt-3 text-sm text-white/70 max-w-3xl">
                    You are in the {activeStage.toUpperCase()} stage. Continue to the next panel to generate and view your personalized study plan based on your diagnostic performance.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleTabSelect('recommendations')}
                      className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/10 text-white hover:bg-white/20"
                    >
                      <ArrowLeft size={14} />
                      Back to Recommended Topics
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenPersonalizedStudyPlan}
                      disabled={isOpeningPersonalizedStudyPlan}
                      className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isOpeningPersonalizedStudyPlan
                        ? hasReviewerCreated
                          ? 'Opening Review Page...'
                          : 'Opening Study Plan...'
                        : hasReviewerCreated
                          ? 'Open Review Page'
                          : 'Open Personalized Study Plan'}
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </section>
            ) : null}
          </div>
        </section>
      </div>

      <div className={`fixed top-[-5%] right-[-5%] w-100 h-100 rounded-full blur-[120px] -z-10 ${isBrightMode ? 'bg-blue-50/40' : 'bg-blue-900/10'}`} />
      <div className={`fixed bottom-[-5%] left-[-5%] w-100 h-100 rounded-full blur-[120px] -z-10 ${isBrightMode ? 'bg-indigo-50/40' : 'bg-indigo-900/10'}`} />
    </main>
  )
}

const StepItem = ({ icon, label, status, active = false }: { icon: React.ReactNode; label: string; status: string; active?: boolean }) => (
  <div className={`flex flex-col items-center gap-2 min-w-25 py-3 transition-all ${!active ? 'opacity-40' : ''}`}>
    <div
      className={`h-12 w-12 rounded-2xl flex items-center justify-center border-2 shadow-sm transition-all ${
        active
          ? 'bg-indigo-100 border-indigo-400 text-indigo-600 ring-4 ring-indigo-50 dark:bg-indigo-900/30'
          : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-slate-800'
      }`}
    >
      {icon}
    </div>
    <span className={`text-[10px] font-black uppercase tracking-wider ${active ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-400'}`}>{label}</span>
    <span
      className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
        active ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
      }`}
    >
      {status}
    </span>
  </div>
)

const Divider = () => <div className="flex-1 h-0.5 mt-6 mx-1 bg-slate-100 dark:bg-slate-800 rounded-full" />

const TabButton = ({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick?: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all ${active ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'opacity-40 hover:opacity-100'}`}
  >
    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${active ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
      {icon}
    </div>
    <span className={`text-[10px] font-black uppercase tracking-widest hidden sm:block ${active ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-400'}`}>
      {label}
    </span>
  </button>
)

const Badge = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div className="bg-linear-to-br from-white to-amber-50/70 dark:bg-slate-800/50 rounded-2xl px-6 py-4 border border-slate-100 dark:border-slate-700 min-w-35 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.25)]">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className={`text-lg font-black ${color}`}>{value}</p>
  </div>
)

const SkillStat = ({ label, percent, color }: { label: string; percent: number; color: string }) => (
  <div className="flex items-center gap-3 overflow-hidden">
    <span className={`w-3 h-3 rounded-full shrink-0 ${color}`} />
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate">{label}</p>
      <p className={`text-lg font-black tabular-nums leading-none mt-1 ${color.replace('bg-', 'text-')}`}>{formatPercentage(percent)}%</p>
    </div>
  </div>
)

const ConceptNode = ({ data }: NodeProps<Node<ConceptNodeData>>) => {
  const radius = 30
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (data.percentage / 100) * circumference

  return (
    <div className="relative group animate-in zoom-in duration-500">
      <div className="absolute inset-0 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full" style={{ backgroundColor: data.color }} />

      <div className="relative bg-slate-900 border-2 border-slate-800 rounded-3xl p-4 flex flex-col items-center gap-3 shadow-2xl min-w-40">
        <div className="relative h-16 w-16 flex items-center justify-center">
          <svg className="h-full w-full -rotate-90">
            <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" />
            <circle
              cx="32"
              cy="32"
              r={radius}
              stroke={data.color}
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={circumference}
              style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 1s ease-out' }}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-sm font-black text-white">{formatPercentage(data.percentage)}%</span>
        </div>

        <div className="text-center">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">{data.label}</h4>
        </div>

        <Handle type="target" position={Position.Left} className="w-2! h-2! bg-slate-700! border-none!" />
        <Handle type="source" position={Position.Right} className="w-2! h-2! bg-slate-700! border-none!" />
      </div>
    </div>
  )
}

export default GapAnalysisPage
