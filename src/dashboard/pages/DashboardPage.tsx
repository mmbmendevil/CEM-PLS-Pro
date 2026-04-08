import React, { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  LayoutDashboard,
  Sparkles,
  BookOpen,
  ClipboardCheck,
  Search,
  GraduationCap,
  FileCheck,
  Trophy,
  ArrowRight,
  Target,
  TrendingUp,
  Zap,
  Network,
  History,
  Lock,
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useGradingStage } from '@/contexts/GradingStageContext';
import { useBrightness } from '../../contexts/BrightnessContext';
import { MODULES_CATALOG } from '../data/modulesCatalog';
import {
  getLearningStageConfig,
  getStageDiagnosticRecord,
  getStageSummativeRecord,
  hasReviewerForStage,
  resolveStageForSelection,
  type LearningStageKey,
} from '../data/learningStage';
import { auth } from '../../lib/firebase';
import { ROUTE_PATHS } from '../../routes/paths';
import { getUserAssessmentProgress, type AssessmentProgressRecord } from '../../services/assessmentProgress';
import { getUserModuleProgress, type ModuleProgressRecord } from '../../services/moduleProgress';
import { getUserProfile } from '../../services/userProfiles';

type StepNode = {
  label: string
  completed?: boolean
  active?: boolean
  locked?: boolean
}

type ActivityItem = {
  label: string
  at: string
}

const conceptLabelByCode: Record<string, string> = {
  MH: 'Memory Hierarchy',
  CPU: 'CPU Components',
  PIPE: 'Pipeline Architecture',
  CM: 'Cache Memory',
  VM: 'Virtual Memory',
  ILP: 'Advanced Execution',
  AF: 'Architecture Fundamentals',
  ISA: 'Instruction Set Architecture',
  PA: 'Performance Analysis',
}

const toDateString = (value: unknown) => {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate()
  }

  if (value instanceof Date) {
    return value
  }

  return null
}

const formatTime = (value: Date | null) => {
  if (!value) {
    return 'Not yet synced'
  }

  return value.toLocaleString()
}

const DashboardPage: React.FC = () => {
  const { isBrightMode } = useBrightness();
  const { selectedStage } = useGradingStage();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('Learner');
  const [activeStage, setActiveStage] = useState<LearningStageKey>('prelim')
  const [assessmentRecords, setAssessmentRecords] = useState<AssessmentProgressRecord[]>([])
  const [moduleRecords, setModuleRecords] = useState<ModuleProgressRecord[]>([])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setFullName('Learner');
        setAssessmentRecords([])
        setModuleRecords([])
        setActiveStage('prelim')
        return;
      }

      const [profile, assessments, modules] = await Promise.all([
        getUserProfile(user.uid),
        getUserAssessmentProgress(user.uid),
        getUserModuleProgress(user.uid),
      ])

      const assessmentMap = new Map(assessments.map((record) => [record.assessmentKey, record]))
      const effectiveStage = resolveStageForSelection(assessmentMap, selectedStage)
      setActiveStage(effectiveStage)
      setAssessmentRecords(assessments)
      setModuleRecords(modules)

      if (profile?.fullName) {
        setFullName(profile.fullName);
      } else if (user.displayName) {
        setFullName(user.displayName);
      } else if (user.email) {
        setFullName(user.email.split('@')[0]);
      } else {
        setFullName('Learner');
      }

    });

    return unsubscribe;
  }, [selectedStage]);

  const assessmentMap = useMemo(
    () => new Map(assessmentRecords.map((record) => [record.assessmentKey, record])),
    [assessmentRecords],
  )

  const stageConfig = getLearningStageConfig(activeStage)
  const stageDiagnostic = getStageDiagnosticRecord(assessmentMap, activeStage)
  const stageSummative = getStageSummativeRecord(assessmentMap, activeStage)
  const stageModules = useMemo(
    () => MODULES_CATALOG.filter((module) => module.id >= stageConfig.moduleStartId && module.id <= stageConfig.moduleEndId),
    [stageConfig.moduleEndId, stageConfig.moduleStartId],
  )

  const completedModules = stageModules.filter((module) => {
    const record = moduleRecords.find((entry) => entry.moduleId === module.id)
    return record?.isCompleted === true || (record?.overallProgress ?? 0) >= 100
  }).length

  const courseProgress = stageModules.length > 0 ? Math.round((completedModules / stageModules.length) * 100) : 0
  const pretestDone = stageDiagnostic?.isSubmitted === true || stageDiagnostic?.isFinished === true
  const gapAnalysisDone = stageDiagnostic?.isStudyPlanUnlocked === true
  const reviewerReady = hasReviewerForStage(stageDiagnostic)
  const postTestDone = stageSummative?.isSubmitted === true || stageSummative?.isFinished === true

  const masteryEntries = Object.entries(stageDiagnostic?.competencyBreakdown ?? {})
  const masteredConcepts = masteryEntries.filter(([, metric]) => (metric.percentage ?? 0) >= 90).length
  const developingConcepts = masteryEntries.filter(([, metric]) => (metric.percentage ?? 0) >= 75 && (metric.percentage ?? 0) < 90).length
  const knowledgeGaps = masteryEntries.filter(([, metric]) => (metric.percentage ?? 0) < 75).length

  const radarData = masteryEntries.length > 0
    ? masteryEntries.map(([code, metric]) => ({
      subject: conceptLabelByCode[code] ?? code,
      A: Math.round(metric.percentage ?? 0),
      fullMark: 100,
    }))
    : stageModules.map((module) => ({ subject: module.title, A: 0, fullMark: 100 }))

  const lineData = [
    { name: 'Pre-Test', score: Math.round(stageDiagnostic?.percentage ?? 0) },
    { name: 'Post-Test', score: Math.round(stageSummative?.percentage ?? 0) },
  ]

  const stepStatus = [
    { label: 'Course Modules', completed: courseProgress >= 100, locked: false },
    { label: 'Pre-Test', completed: pretestDone, locked: courseProgress < 100 },
    { label: 'Gap Analysis', completed: gapAnalysisDone, locked: !pretestDone },
    { label: 'Personalized Study', completed: reviewerReady, locked: !gapAnalysisDone },
    { label: 'Post-Test', completed: postTestDone, locked: !reviewerReady },
    { label: 'Results', completed: postTestDone, locked: !postTestDone },
  ]
  const activeStepIndex = Math.max(stepStatus.findIndex((step) => !step.completed), 0)
  const dependencyGraphData: StepNode[] = stepStatus.map((step, index) => ({
    label: step.label,
    completed: step.completed,
    locked: step.locked,
    active: index === activeStepIndex,
  }))

  let nextRoute: string = ROUTE_PATHS.dashboard.modules
  let nextLabel = 'Continue Modules'
  if (courseProgress < 100) {
    nextRoute = ROUTE_PATHS.dashboard.modules
    nextLabel = `Continue ${stageConfig.label} Modules`
  } else if (!pretestDone) {
    nextRoute = ROUTE_PATHS.dashboard.diagnostic
    nextLabel = `Take ${stageConfig.label} Pre-test`
  } else if (!gapAnalysisDone) {
    nextRoute = ROUTE_PATHS.dashboard.gapAnalysis
    nextLabel = 'Open Gap Analysis'
  } else if (!reviewerReady) {
    nextRoute = ROUTE_PATHS.dashboard.studyPlan
    nextLabel = 'Generate Study Plan'
  } else if (!postTestDone) {
    nextRoute = ROUTE_PATHS.dashboard.postTest
    nextLabel = `Take ${stageConfig.label} Post-test`
  } else {
    nextRoute = ROUTE_PATHS.dashboard.results
    nextLabel = 'View Learning Results'
  }

  const thetaRaw = (Math.round(stageSummative?.percentage ?? stageDiagnostic?.percentage ?? 0) - 50) / 50
  const theta = Number(thetaRaw.toFixed(2))
  const thetaPercent = Math.max(0, Math.min(100, Math.round(((theta + 1) / 2) * 100)))

  const lastSyncedAt = useMemo(() => {
    const assessmentDates = assessmentRecords.map((record) => toDateString(record.updatedAt)).filter((value): value is Date => Boolean(value))
    const moduleDates = moduleRecords.map((record) => toDateString(record.updatedAt)).filter((value): value is Date => Boolean(value))
    const combined = [...assessmentDates, ...moduleDates]

    if (combined.length === 0) {
      return null
    }

    return new Date(Math.max(...combined.map((value) => value.getTime())))
  }, [assessmentRecords, moduleRecords])

  const activityLog: ActivityItem[] = []
  if (courseProgress > 0) {
    activityLog.push({ label: `${stageConfig.label} modules progress updated (${courseProgress}%)`, at: 'Modules' })
  }
  if (pretestDone) {
    activityLog.push({ label: `${stageConfig.label} pre-test submitted (${Math.round(stageDiagnostic?.percentage ?? 0)}%)`, at: 'Assessment' })
  }
  if (reviewerReady) {
    activityLog.push({ label: 'Reviewer generated and review unlocked', at: 'AI Review' })
  }
  if (postTestDone) {
    activityLog.push({ label: `${stageConfig.label} post-test submitted (${Math.round(stageSummative?.percentage ?? 0)}%)`, at: 'Assessment' })
  }

  const handleStartModules = () => {
    navigate(nextRoute)
  };

  return (
    <main
      className={`min-h-screen transition-colors duration-500 pb-20 relative overflow-x-hidden ${
        isBrightMode ? 'bg-[#fffdf7] text-slate-900' : 'bg-[#0f172a] text-slate-100'
      }`}
    >
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/20 blur-[100px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] bg-indigo-500/20 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-10 space-y-8 relative z-10">
        <header className={`flex items-center justify-between backdrop-blur-xl border p-5 rounded-4xl shadow-xl shadow-slate-200/50 ${
          isBrightMode ? 'bg-white/80 border-white/70' : 'bg-[#111827] border-slate-700/60'
        }`}>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <LayoutDashboard size={24} />
            </div>
            <div>
              <h1 className={`text-xl font-black tracking-tight ${isBrightMode ? 'text-slate-900' : 'text-white'}`}>Adaptive Learning OS</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Computer Organization and Architecture</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end mr-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 text-right">Status</p>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className={`text-xs font-black uppercase tracking-tighter ${isBrightMode ? 'text-slate-900' : 'text-slate-100'}`}>AI Engine Active</span>
              </div>
            </div>
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isBrightMode ? 'bg-slate-100 border border-slate-200' : 'bg-slate-800 border border-slate-700'}`}>
              <Sparkles size={20} className="text-amber-500" />
            </div>
          </div>
        </header>

        <section
          className={`rounded-4xl border p-8 shadow-sm ${
            isBrightMode
              ? 'border-blue-100 bg-linear-to-r from-blue-600/5 via-indigo-600/5 to-transparent'
              : 'border-slate-700/60 bg-linear-to-r from-blue-500/10 via-indigo-500/10 to-slate-900/0'
          }`}
        >
          <h1 className={`text-3xl font-black tracking-tight ${isBrightMode ? 'text-slate-900' : 'text-white'}`}>
            Welcome back, <span className="text-blue-600">{fullName}</span>
          </h1>
          <p className={`mt-2 font-medium text-base ${isBrightMode ? 'text-slate-500' : 'text-slate-300'}`}>Continue your {stageConfig.label} adaptive learning journey.</p>
        </section>

        <section className="px-2">
          <div className="hidden sm:flex items-center justify-between w-full">
            <StepItem icon={<BookOpen size={20} />} label="Course Modules" active={dependencyGraphData[0]?.active} completed={dependencyGraphData[0]?.completed} locked={dependencyGraphData[0]?.locked} />
            <ProgressDivider />
            <StepItem icon={<ClipboardCheck size={20} />} label="Pre-Test" active={dependencyGraphData[1]?.active} completed={dependencyGraphData[1]?.completed} locked={dependencyGraphData[1]?.locked} />
            <ProgressDivider />
            <StepItem icon={<Search size={20} />} label="Gap Analysis" active={dependencyGraphData[2]?.active} completed={dependencyGraphData[2]?.completed} locked={dependencyGraphData[2]?.locked} />
            <ProgressDivider />
            <StepItem icon={<GraduationCap size={20} />} label="Personalized Study" active={dependencyGraphData[3]?.active} completed={dependencyGraphData[3]?.completed} locked={dependencyGraphData[3]?.locked} />
            <ProgressDivider />
            <StepItem icon={<FileCheck size={20} />} label="Post-Test" active={dependencyGraphData[4]?.active} completed={dependencyGraphData[4]?.completed} locked={dependencyGraphData[4]?.locked} />
            <ProgressDivider />
            <StepItem icon={<Trophy size={20} />} label="Results" active={dependencyGraphData[5]?.active} completed={dependencyGraphData[5]?.completed} locked={dependencyGraphData[5]?.locked} />
          </div>

          <div className={`sm:hidden flex items-center gap-3 rounded-2xl px-5 py-3 border ${isBrightMode ? 'bg-slate-50 border-slate-100' : 'bg-[#111827] border-slate-700/60'}`}>
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <BookOpen size={16} />
            </div>
            <div className="flex-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Step 1 of 6</p>
              <p className={`text-sm font-black uppercase tracking-tight ${isBrightMode ? 'text-slate-900' : 'text-white'}`}>{dependencyGraphData[activeStepIndex]?.label ?? 'Course Modules'}</p>
            </div>
            <div className="text-[10px] font-black text-blue-600">{courseProgress}%</div>
          </div>
        </section>

        <section className={`backdrop-blur-xl border rounded-4xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 group hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 ${
          isBrightMode ? 'bg-white/80 border-slate-200' : 'bg-[#111827] border-slate-700/60'
        }`}>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 mb-2">Next Recommended Step</p>
            <h2 className={`text-2xl font-black tracking-tight ${isBrightMode ? 'text-slate-900' : 'text-white'}`}>{nextLabel}</h2>
          </div>
          <button type="button" onClick={handleStartModules} className="h-16 px-10 bg-linear-to-r from-blue-600 to-indigo-600 text-white font-black uppercase tracking-widest text-[11px] rounded-3xl shadow-[0_0_30px_-5px_rgba(59,130,246,0.5)] hover:shadow-[0_0_40px_-5px_rgba(59,130,246,0.6)] transition-all active:scale-95 hover:scale-105 flex items-center gap-3">
            {nextLabel} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </section>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Course Progress" value={`${courseProgress}%`} color="bg-blue-500" isBrightMode={isBrightMode} progress={courseProgress} />
          <StatCard label="Mastered Concepts" value={String(masteredConcepts)} color="bg-emerald-500" isBrightMode={isBrightMode} progress={masteredConcepts > 0 ? 100 : 0} />
          <StatCard label="Developing" value={String(developingConcepts)} color="bg-amber-500" isBrightMode={isBrightMode} progress={developingConcepts > 0 ? 100 : 0} />
          <StatCard label="Knowledge Gaps" value={String(knowledgeGaps)} color="bg-rose-500" isBrightMode={isBrightMode} progress={knowledgeGaps > 0 ? 100 : 0} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ChartContainer title="Concept Mastery Map" icon={<Target size={20} className="text-blue-500" />} isBrightMode={isBrightMode}>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#334155" opacity={0.3} />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }} />
                <Radar name="Mastery" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </ChartContainer>

          <ChartContainer title="Academic Gain Progression" icon={<TrendingUp size={20} className="text-indigo-500" />} isBrightMode={isBrightMode}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={4} dot={{ r: 5, fill: '#6366f1' }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        <section className={`${isBrightMode ? 'bg-white/80 border border-slate-200' : 'bg-[#111827] border border-slate-700/60'} rounded-2xl p-6`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Zap className="text-yellow-500 animate-pulse" size={20} />
              <div>
                <h3 className={`text-xs font-black uppercase tracking-widest ${isBrightMode ? 'text-slate-500' : 'text-slate-300'}`}>Cognitive Ability Index</h3>
                <p className={`text-[10px] font-medium ${isBrightMode ? 'text-slate-400' : 'text-slate-300'}`}>IRT-based student proficiency estimate.</p>
              </div>
            </div>
            <div className="flex-1 max-w-lg w-full">
              <div className="flex justify-between items-end mb-2">
                  <span className={`text-3xl font-black tabular-nums ${isBrightMode ? 'text-slate-900' : 'text-white'}`}>{theta.toFixed(2)}</span>
                  <span className="text-[10px] font-black uppercase text-blue-500">{theta >= 0.7 ? 'Advanced' : theta >= 0.3 ? 'Skilled' : theta >= 0 ? 'Developing' : 'Beginner'}</span>
              </div>
              <div className={`h-3 w-full rounded-full overflow-hidden p-0.5 border ${isBrightMode ? 'bg-slate-200 border-slate-300' : 'bg-slate-800 border-slate-700'}`}>
                <div
                  className="h-full bg-linear-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1500"
                    style={{ width: `${thetaPercent}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className={`xl:col-span-8 rounded-2xl p-5 min-h-55 flex flex-col items-center ${isBrightMode ? 'bg-white/80 border border-slate-200' : 'bg-[#111827] border border-slate-700/60'}`}>
            <div className="w-full flex items-center gap-3 mb-8">
              <Network size={20} className="text-purple-500" />
              <h3 className={`text-xs font-black uppercase tracking-widest ${isBrightMode ? 'text-slate-500' : 'text-slate-300'}`}>Concept Dependency Graph</h3>
            </div>
            <div className="w-full overflow-x-auto py-4">
              <div className="flex items-center min-w-180 w-full">
                {dependencyGraphData.map((node, index) => (
                  <React.Fragment key={node.label}>
                    {index > 0 ? (
                      <div className={`flex-1 mx-3 h-1 rounded-full ${isBrightMode ? 'bg-slate-200' : 'bg-slate-700/70'}`} />
                    ) : null}
                    <div
                      className={`flex flex-col items-center justify-center px-5 py-4 rounded-2xl border min-w-27.5 transition-all ${
                        node.active
                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                          : node.completed
                            ? isBrightMode
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-emerald-900/20 border-emerald-500/30 text-emerald-300'
                            : node.locked
                            ? isBrightMode
                              ? 'bg-slate-50 border-slate-200 text-slate-400'
                              : 'bg-[#0f172a] border-slate-700/60 text-slate-400'
                            : isBrightMode
                              ? 'bg-white border-slate-200 text-slate-700'
                              : 'bg-[#111827] border-slate-700/60 text-slate-300'
                      }`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">{node.label}</span>
                      {node.locked ? <Lock size={12} className="mt-2" /> : node.completed ? <span className="mt-2 text-[9px] font-black uppercase">Done</span> : null}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          <div className={`xl:col-span-4 rounded-2xl p-5 h-80 flex flex-col ${isBrightMode ? 'bg-white/80 border border-slate-200' : 'bg-[#111827] border border-slate-700/60'}`}>
            <div className="flex items-center gap-2 mb-6">
              <History size={20} className="text-blue-500" />
              <h3 className={`text-xs font-black uppercase tracking-widest ${isBrightMode ? 'text-slate-500' : 'text-slate-300'}`}>Activity Log</h3>
            </div>
            <div className="space-y-4 overflow-y-auto pr-2 flex-1">
              {activityLog.length === 0 ? (
                <p className={`text-[10px] text-center py-10 uppercase opacity-50 font-black tracking-widest ${isBrightMode ? 'text-slate-500' : 'text-slate-300'}`}>No activity yet.</p>
              ) : activityLog.map((item) => (
                <div key={item.label} className={`rounded-xl border px-3 py-3 ${isBrightMode ? 'border-slate-200 bg-slate-50' : 'border-slate-700 bg-[#0f172a]'}`}>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${isBrightMode ? 'text-slate-700' : 'text-slate-200'}`}>{item.label}</p>
                  <p className="text-[9px] mt-1 uppercase tracking-wider text-slate-400">{item.at}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <footer className={`mt-2 flex flex-col md:flex-row items-center justify-between gap-6 pt-8 pb-4 px-4 rounded-2xl border ${isBrightMode ? 'border-slate-200 bg-white/80' : 'border-slate-700/60 bg-[#111827]'}`}>
          <div className={`flex items-center gap-4 ${isBrightMode ? 'text-slate-600' : 'text-slate-300'}`}>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isBrightMode ? 'bg-slate-200/80' : 'bg-slate-800'}`}>
              <History size={16} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest">Last synced: {formatTime(lastSyncedAt)}</p>
          </div>
          <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${isBrightMode ? 'text-slate-700' : 'text-slate-200'}`}>
            Built with AI Psychometrics & Adaptive Intelligence
          </p>
        </footer>
      </div>
    </main>
  );
};

const StepItem = ({ icon, label, active, locked, completed }: { icon: React.ReactNode; label: string; active?: boolean; locked?: boolean; completed?: boolean }) => (
  <div className="flex flex-col items-center gap-2 relative">
    <div
      className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 ${
        active
          ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-100'
          : completed
            ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
          : locked
            ? 'bg-slate-50 border-slate-200 text-slate-300'
          : 'bg-slate-50 border-slate-200 text-slate-300'
      }`}
    >
      {locked ? <Lock size={14} /> : icon}
    </div>
    <span className={`text-[9px] font-black uppercase tracking-[0.15em] whitespace-nowrap ${active ? 'text-blue-600' : 'text-slate-300'}`}>
      {label}
    </span>
  </div>
);

const ProgressDivider = () => (
  <div className="flex-1 mx-2">
    <div className="h-0.75 rounded-full bg-slate-100" />
  </div>
);

const StatCard = ({ label, value, color, isBrightMode, progress }: { label: string; value: string; color: string; isBrightMode: boolean; progress: number }) => (
  <div className={`rounded-xl p-5 hover:-translate-y-0.5 transition-all group shadow-sm border ${isBrightMode ? 'bg-white/80 border-slate-200' : 'bg-[#111827] border-slate-700/60'}`}>
    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-blue-500 transition-colors">
      {label}
    </p>
    <div className="flex justify-between items-end mt-2 mb-3">
      <p className={`text-2xl font-black tracking-tighter ${isBrightMode ? 'text-slate-900' : 'text-white'}`}>{value}</p>
      <span className={`text-[8px] font-black ${color.replace('bg-', 'text-')}`}>{progress}%</span>
    </div>
    <div className={`h-1 w-full rounded-full overflow-hidden ${isBrightMode ? 'bg-slate-200' : 'bg-slate-800'}`}>
      <div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
    </div>
  </div>
);

const ChartContainer = ({
  title,
  icon,
  children,
  isBrightMode,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isBrightMode: boolean;
}) => (
  <div className={`rounded-2xl p-6 min-h-80 hover:border-blue-500/30 transition-all border ${isBrightMode ? 'bg-white/80 border-slate-200' : 'bg-[#111827] border-slate-700/60'}`}>
    <div className="flex items-center gap-2 mb-6">
      {icon}
      <h3 className={`text-xs font-black uppercase tracking-widest ${isBrightMode ? 'text-slate-500' : 'text-slate-300'}`}>{title}</h3>
    </div>
    <div className="h-65 w-full">{children}</div>
  </div>
);

export default DashboardPage;
