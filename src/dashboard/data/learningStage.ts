import type { AssessmentProgressRecord } from '../../services/assessmentProgress'
import type { ModuleProgressRecord } from '../../services/moduleProgress'
import { MODULE_CONFIG } from './moduleConfig'

export type LearningStageKey = 'prelim' | 'midterm' | 'final'

const getStageModuleIds = (stage: LearningStageKey) => {
  return MODULE_CONFIG.filter((moduleConfig) => moduleConfig.stage === stage)
    .sort((first, second) => first.order - second.order)
    .map((moduleConfig) => moduleConfig.id)
}

export const LEARNING_STAGE_MODULE_IDS: Record<LearningStageKey, number[]> = {
  prelim: getStageModuleIds('prelim'),
  midterm: getStageModuleIds('midterm'),
  final: getStageModuleIds('final'),
}

export type LearningStageConfig = {
  key: LearningStageKey
  label: 'Prelim' | 'Midterm' | 'Final'
  moduleStartId: number
  moduleEndId: number
  diagnosticAssessmentKey: string
  legacyDiagnosticAssessmentKeys: string[]
  summativeAssessmentKey: string
}

export const LEARNING_STAGE_ORDER: LearningStageKey[] = ['prelim', 'midterm', 'final']

export const LEARNING_STAGE_CONFIGS: Record<LearningStageKey, LearningStageConfig> = {
  prelim: {
    key: 'prelim',
    label: 'Prelim',
    moduleStartId: LEARNING_STAGE_MODULE_IDS.prelim[0],
    moduleEndId: LEARNING_STAGE_MODULE_IDS.prelim[LEARNING_STAGE_MODULE_IDS.prelim.length - 1],
    diagnosticAssessmentKey: 'prelim',
    legacyDiagnosticAssessmentKeys: ['diagnostic-pretest'],
    summativeAssessmentKey: 'prelim-summative-posttest',
  },
  midterm: {
    key: 'midterm',
    label: 'Midterm',
    moduleStartId: LEARNING_STAGE_MODULE_IDS.midterm[0],
    moduleEndId: LEARNING_STAGE_MODULE_IDS.midterm[LEARNING_STAGE_MODULE_IDS.midterm.length - 1],
    diagnosticAssessmentKey: 'midterm',
    legacyDiagnosticAssessmentKeys: ['midterm-diagnostic-pretest'],
    summativeAssessmentKey: 'midterm-summative-posttest',
  },
  final: {
    key: 'final',
    label: 'Final',
    moduleStartId: LEARNING_STAGE_MODULE_IDS.final[0],
    moduleEndId: LEARNING_STAGE_MODULE_IDS.final[LEARNING_STAGE_MODULE_IDS.final.length - 1],
    diagnosticAssessmentKey: 'final',
    legacyDiagnosticAssessmentKeys: ['final-diagnostic-pretest'],
    summativeAssessmentKey: 'final-summative-posttest',
  },
}

export const getLearningStageConfig = (stage: LearningStageKey) => LEARNING_STAGE_CONFIGS[stage]

export const resolveLearningStage = (
  assessmentMap: Map<string, AssessmentProgressRecord>,
): LearningStageKey => {
  if (assessmentMap.get(LEARNING_STAGE_CONFIGS.midterm.summativeAssessmentKey)?.passed === true) {
    return 'final'
  }

  if (assessmentMap.get(LEARNING_STAGE_CONFIGS.prelim.summativeAssessmentKey)?.passed === true) {
    return 'midterm'
  }

  return 'prelim'
}

export const resolveStageForSelection = (
  assessmentMap: Map<string, AssessmentProgressRecord>,
  selectedStage: LearningStageKey | null | undefined,
): LearningStageKey => {
  const unlockedStage = resolveLearningStage(assessmentMap)

  if (!selectedStage) {
    return unlockedStage
  }

  const unlockedIndex = LEARNING_STAGE_ORDER.indexOf(unlockedStage)
  const selectedIndex = LEARNING_STAGE_ORDER.indexOf(selectedStage)

  if (selectedIndex < 0 || selectedIndex > unlockedIndex) {
    return unlockedStage
  }

  return selectedStage
}

const isModuleCompleted = (record: ModuleProgressRecord | undefined) => {
  if (!record) {
    return false
  }

  return record.isCompleted === true || (record.overallProgress ?? 0) >= 100
}

export const areStageModulesCompleted = (
  moduleRecords: ModuleProgressRecord[],
  stage: LearningStageKey,
) => {
  const config = getLearningStageConfig(stage)
  const moduleRecordMap = new Map(moduleRecords.map((record) => [record.moduleId, record]))

  for (let moduleId = config.moduleStartId; moduleId <= config.moduleEndId; moduleId += 1) {
    if (!isModuleCompleted(moduleRecordMap.get(moduleId))) {
      return false
    }
  }

  return true
}

export const hasReviewerForStage = (record: AssessmentProgressRecord | undefined) => {
  if (!record) {
    return false
  }

  return (
    record.isReviewUnlocked === true ||
    Boolean(record.reviewerPreference) ||
    Boolean(record.aiReviewerOutput?.trim())
  )
}

export const getStageDiagnosticRecord = (
  assessmentMap: Map<string, AssessmentProgressRecord>,
  stage: LearningStageKey,
) => {
  const config = getLearningStageConfig(stage)
  const preferred = assessmentMap.get(config.diagnosticAssessmentKey)

  if (preferred) {
    return preferred
  }

  for (const legacyKey of config.legacyDiagnosticAssessmentKeys) {
    const legacyRecord = assessmentMap.get(legacyKey)
    if (legacyRecord) {
      return legacyRecord
    }
  }

  return undefined
}

export const hasStageDiagnosticPassed = (
  assessmentMap: Map<string, AssessmentProgressRecord>,
  stage: LearningStageKey,
) => {
  const record = getStageDiagnosticRecord(assessmentMap, stage)
  return record?.passed === true
}

export const getStageSummativeRecord = (
  assessmentMap: Map<string, AssessmentProgressRecord>,
  stage: LearningStageKey,
) => assessmentMap.get(getLearningStageConfig(stage).summativeAssessmentKey)

export const getLatestSubmittedSummativeRecord = (
  assessmentMap: Map<string, AssessmentProgressRecord>,
) => {
  for (let index = LEARNING_STAGE_ORDER.length - 1; index >= 0; index -= 1) {
    const stage = LEARNING_STAGE_ORDER[index]
    const record = getStageSummativeRecord(assessmentMap, stage)

    if (record?.isSubmitted === true || record?.isFinished === true) {
      return { stage, record }
    }
  }

  return null
}
