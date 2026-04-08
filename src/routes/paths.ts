export const ROUTE_PATHS = {
  auth: {
    login: '/auth/login',
    signin: '/auth/signin',
  },
  admin: {
    login: '/admin/login',
    home: '/admin',
  },
  dashboard: {
    home: '/dashboard',
    courses: '/dashboard/courses',
    profile: '/dashboard/profile',
    modules: '/dashboard/modules',
    moduleViewer: '/dashboard/modules/viewer',
    diagnostic: '/dashboard/prelim',
    diagnosticLegacy: '/dashboard/diagnostic-pretest',
    gapAnalysis: '/dashboard/gap-analysis',
    studyPlan: '/dashboard/personalized-study-plan',
    review: '/dashboard/review',
    reviewFlashcards: '/dashboard/review/flashcards',
    reviewAudiobook: '/dashboard/review/audiobook',
    reviewCheatsheet: '/dashboard/review/cheatsheet',
    postTest: '/dashboard/summative-posttest',
    results: '/dashboard/learning-results',
    certification: '/dashboard/certification',

  },
} as const
