export type ModuleConfig = {
  id: number
  title: string
  competencyCode: string
  stage: 'prelim' | 'midterm' | 'final'
  order: number
}

export const MODULE_CONFIG: ModuleConfig[] = [
  { id: 1, title: 'CPU Components', competencyCode: 'CPU', stage: 'prelim', order: 1 },
  { id: 2, title: 'Architecture Fundamentals', competencyCode: 'ARCH', stage: 'prelim', order: 2 },
  { id: 3, title: 'Memory Hierarchy', competencyCode: 'MH', stage: 'prelim', order: 3 },
  { id: 4, title: 'Cache Organization', competencyCode: 'CACHE', stage: 'midterm', order: 4 },
  { id: 5, title: 'Virtual Memory and ECC', competencyCode: 'VM', stage: 'midterm', order: 5 },
  { id: 6, title: 'Instruction Set Architecture', competencyCode: 'ISA', stage: 'midterm', order: 6 },
  { id: 7, title: 'Pipelining and Hazards', competencyCode: 'PIPE', stage: 'final', order: 7 },
  { id: 8, title: 'Advanced Execution', competencyCode: 'ILP', stage: 'final', order: 8 },
  { id: 9, title: 'Performance Analysis', competencyCode: 'PERF', stage: 'final', order: 9 },
]

export const getModuleConfigByTitle = (title: string) => {
  return MODULE_CONFIG.find((moduleConfig) => moduleConfig.title === title)
}

export const getModuleConfigByCompetencyCode = (competencyCode: string) => {
  return MODULE_CONFIG.find((moduleConfig) => moduleConfig.competencyCode === competencyCode)
}

export const getStageFromModule = (moduleTitle: string) => {
  return getModuleConfigByTitle(moduleTitle)?.stage
}

