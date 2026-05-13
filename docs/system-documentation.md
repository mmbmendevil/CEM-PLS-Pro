# Final System Documentation (Thesis-Ready)

System/Project Identifier (from source): `pls-pro` (see `package.json`)

This document is generated strictly from the current codebase. Any information not directly supported by implementation is written as: **NOT SPECIFIED IN SYSTEM**.

---

## 0. Recent Revisions (2026-04-24)
- Assessment point caps:
  - Pre-test capped at 15 points â€” `src/dashboard/data/diagnosticQuestions.ts`
  - Post-test capped at 30 points â€” `src/dashboard/data/diagnosticQuestions.ts`
- Bloom-based weights (used for scoring and caps):
  - Remember/Understand = 1, Apply/Analyze = 1.5, Evaluate/Create = 2 â€” `src/dashboard/data/diagnosticQuestions.ts`
- Adaptive selection:
  - Pre-test uses CAT-style adaptive next-question selection â€” `src/dashboard/pages/DiagnosticPretestPage.tsx`, `src/dashboard/data/diagnosticQuestions.ts`
  - Post-test uses CAT-style adaptive next-question selection â€” `src/dashboard/pages/SummativePosttestPage.tsx`, `src/dashboard/data/diagnosticQuestions.ts`
- Assessment UI updates:
  - Question header simplified to “Question N” (no “of N”) â€” `src/dashboard/pages/DiagnosticPretestPage.tsx`, `src/dashboard/pages/SummativePosttestPage.tsx`
  - Right-side question list shows per-question points + running total vs cap â€” `src/dashboard/pages/DiagnosticPretestPage.tsx`, `src/dashboard/pages/SummativePosttestPage.tsx`
- Reviewer/flashcards:
  - Reviewer prompt/fallback updated to wrong/correct emphasis (unseen folded into “needs review”) â€” `src/dashboard/data/reviewerPromptBuilder.ts`
  - Flashcards show only wrong/correct counts, but can include unseen questions as extra practice cards â€” `src/dashboard/pages/FlashcardReviewPage.tsx`
  - Cheatsheet UI removed “unseen” section and legend references â€” `src/dashboard/pages/CheatsheetReviewPage.tsx`

## 1. System Overview

### System Name
- `pls-pro` (package name) — `package.json`
- “Personalized Learning System” (UI heading) — `src/dashboard/pages/CertificationPage.tsx`

### Description
- A browser-based (React + Vite) learning application that uses:
  - Course modules (video + lesson text) — `src/dashboard/data/modulesCatalog.ts`, `src/dashboard/pages/ModuleViewerPage.tsx`
  - Diagnostic (pre-test) assessment — `src/dashboard/pages/DiagnosticPretestPage.tsx`, `src/dashboard/data/diagnosticQuestions.ts`
  - Gap analysis visualization — `src/dashboard/pages/GapAnalysisPage.tsx`, `src/dashboard/pages/PostTestGapAnalysisPage.tsx`
  - Personalized reviewer creation (AI-assisted with fallback) and review modes (flashcards / audiobook / cheatsheet) — `src/dashboard/pages/PersonalizedStudyPlanPage.tsx`, `src/dashboard/data/reviewerPromptBuilder.ts`, `src/dashboard/pages/FlashcardReviewPage.tsx`, `src/dashboard/pages/AudiobookReviewPage.tsx`, `src/dashboard/pages/CheatsheetReviewPage.tsx`
  - Summative (post-test) assessment with attempt limits — `src/dashboard/pages/SummativePosttestPage.tsx`
  - Learning results and stage progression gating — `src/dashboard/pages/LearningResultsPage.tsx`, `src/dashboard/data/learningStage.ts`
  - Firebase Auth + Firestore persistence — `src/lib/firebase.ts`, `src/services/*`
  - Admin dashboard for metrics and account progress reset/deletion — `src/admin/pages/AdminDashboardPage.tsx`, `src/services/admin.ts`

### Assessment / Modeling Methods (CAT / IRT / BKT / CDM)
- CAT (Computerized Adaptive Testing):
  - Implemented as **CAT-style heuristic item selection**, not calibrated CAT (no item bank calibration).
  - Pre-test selection: module balancing + weight-based difficulty targeting with a fixed point cap (15 pts) — `src/dashboard/data/diagnosticQuestions.ts:getCATPretestInitialQuestions`, `src/dashboard/data/diagnosticQuestions.ts:getCATPretestNextQuestion`
  - Post-test selection: similar heuristic targeting + pre-test gap focus + module balancing with a fixed point cap (30 pts) — `src/dashboard/data/diagnosticQuestions.ts:getCATPosttestInitialQuestions`, `src/dashboard/data/diagnosticQuestions.ts:getCATPosttestNextQuestion`
- IRT (Item Response Theory):
  - No calibrated IRT model (no item parameters `a/b/c`, no estimation procedure over an item bank).
  - Implemented "theta-like" computations:
    - Gap analysis result generation uses a **logit transform of proportion-correct** (`theta = log(correct/(total-correct))` when `0 < correct < total`) — `src/services/assessmentProgress.ts:computeTheta`, `src/services/assessmentProgress.ts:generateResult`
    - Dashboard shows a **linear transform of percentage** into a theta-like index (`(percentage-50)/50`) — `src/dashboard/pages/DashboardPage.tsx`
- BKT (Bayesian Knowledge Tracing):
  - NOT IMPLEMENTED (no per-skill hidden state, no slip/guess parameters, no temporal update model found in code).
- CDM (Cognitive Diagnostic Models):
  - NOT IMPLEMENTED (no Q-matrix/attribute mastery estimation; only question→competency aggregation + thresholding in gap analysis) — `src/services/assessmentProgress.ts:computeCompetencies`, `src/services/assessmentProgress.ts:computeGaps`

### Core Objective (aligned with problem in Chapter 1)
- NOT SPECIFIED IN SYSTEM (Chapter 1 problem statement is not present in the repository).
- Implemented objectives implied by the UI and logic:
  - Identify weak competencies from diagnostic answers and present gap analysis — `src/dashboard/pages/DiagnosticPretestPage.tsx`, `src/dashboard/pages/GapAnalysisPage.tsx`
  - Generate a prioritized reviewer (AI-assisted) based on wrong/correct questions (unseen questions are used only as extra practice cards in flashcards) — `src/dashboard/pages/PersonalizedStudyPlanPage.tsx`, `src/dashboard/data/reviewerPromptBuilder.ts`, `src/dashboard/pages/FlashcardReviewPage.tsx`
  - Track progress across modules and assessments — `src/services/moduleProgress.ts`, `src/services/assessmentProgress.ts`

### Target Users
- Student (primary UI flows) — multiple pages under `src/dashboard/pages/*`, `src/auth/*`
- Admin (admin console) — `src/admin/pages/AdminDashboardPage.tsx`, `src/admin/pages/AdminLoginPage.tsx`

### Operational Context
- Runs as a client-side SPA in the browser — `src/main.tsx`, `src/App.tsx`
- Navigation handled by React Router — `src/routes/AppRoutes.tsx`, `src/routes/paths.ts`
- Authentication via Firebase Auth — `src/lib/firebase.ts`, `src/services/auth.ts`
- Persistence via Firestore (Firebase client SDK) — `src/lib/firebase.ts`, `src/services/*`
- Optional AI reviewer generation via an OpenAI proxy exposed by the Vite dev/preview server — `vite.config.ts`, `src/services/openai.ts`

### Scope (explicit capabilities)
- User sign-up / sign-in (email+password and Google) + password reset — `src/auth/SigninPage.tsx`, `src/auth/LoginPage.tsx`, `src/services/auth.ts`
- User profile create/upsert/read (Firestore `userProfiles`) — `src/services/userProfiles.ts`
- Course modules viewing and completion progress tracking — `src/dashboard/pages/ModulesPage.tsx`, `src/dashboard/pages/ModuleViewerPage.tsx`, `src/services/moduleProgress.ts`
- Diagnostic pre-test:
  - CAT-style adaptive question selection with Bloom-based point weights and a fixed points cap (15 pts) — `src/dashboard/pages/DiagnosticPretestPage.tsx`, `src/dashboard/data/diagnosticQuestions.ts`
  - Score + competency breakdown computation and persistence — `src/dashboard/pages/DiagnosticPretestPage.tsx`, `src/services/assessmentProgress.ts`
- Gap analysis:
  - Pre-test analysis — `src/dashboard/pages/GapAnalysisPage.tsx`
  - Post-test failure analysis — `src/dashboard/pages/PostTestGapAnalysisPage.tsx`
- Personalized reviewer creation (AI or fallback) and saving narration scripts (inline/chunks) — `src/dashboard/pages/PersonalizedStudyPlanPage.tsx`, `src/services/assessmentProgress.ts`, `src/services/openai.ts`, `vite.config.ts`
- Review modes:
  - Flashcard mode (derived from diagnostic question pools and saved answers) — `src/dashboard/pages/FlashcardReviewPage.tsx`
  - Audiobook mode (browser SpeechSynthesis over reviewer script) — `src/dashboard/pages/AudiobookReviewPage.tsx`
  - Cheatsheet mode with export to PNG/PDF via html2canvas + jsPDF — `src/dashboard/pages/CheatsheetReviewPage.tsx`
- Summative post-test:
  - CAT-style adaptive question selection with a fixed points cap (30 pts) — `src/dashboard/pages/SummativePosttestPage.tsx`, `src/dashboard/data/diagnosticQuestions.ts`
  - Attempt tracking, lock after max failed attempts — `src/dashboard/pages/SummativePosttestPage.tsx`
- Learning results display and reviewer reset — `src/dashboard/pages/LearningResultsPage.tsx`, `src/services/assessmentProgress.ts`
- Certification page with print/download — `src/dashboard/pages/CertificationPage.tsx`
- Admin console:
  - List users, compute metrics, view stage details, reset/delete user progress — `src/admin/pages/AdminDashboardPage.tsx`, `src/services/admin.ts`

### Limitations (explicit exclusions)
- No standalone backend service code is present (only Vite dev/preview middleware plugin for `/api/openai/chat`) — `vite.config.ts`
- Only one functional enrolled course is implemented in UI (“Computer Organization and Architecture”); other course cards are locked (UI-only) — `src/dashboard/pages/CoursesPage.tsx`
- No server-side authorization layer for admin actions is implemented in this repo; admin authentication is localStorage-based — `src/services/adminAuth.ts`, `src/admin/components/AdminRoute.tsx`
- Any integration beyond OpenAI `/chat/completions` is NOT SPECIFIED IN SYSTEM — `vite.config.ts`

---

## 2. Problem–Solution–Implementation Mapping (CRITICAL)

| Problem (Ch1) | Feature | Module | Algorithm | Data Used | Evidence (file/function) |
|---|---|---|---|---|---|
| NOT SPECIFIED IN SYSTEM | Track module learning progress | Module Viewer + Module Progress Service | Progress = `videoProgress*0.8 + scrollProgress*0.2`, persisted with debounce | `ModuleProgress` documents under `userProfiles/{uid}` | `src/dashboard/pages/ModuleViewerPage.tsx`, `src/services/moduleProgress.ts` |
| NOT SPECIFIED IN SYSTEM | Gate diagnostic access on module completion | Sidebar + learningStage module completion logic | `areStageModulesCompleted()` checks each module in stage range | `ModuleProgressRecord` set; stage module range config | `src/dashboard/Sidebar.tsx`, `src/dashboard/data/learningStage.ts` |
| NOT SPECIFIED IN SYSTEM | Diagnostic pre-test question selection | Diagnostic Question Dataset | CAT-style adaptive selection (heuristic difficulty targeting + module balancing) capped at 15 points | Diagnostic question pools by stage; saved diagnostic answers | `src/dashboard/data/diagnosticQuestions.ts:getCATPretestInitialQuestions`, `src/dashboard/data/diagnosticQuestions.ts:getCATPretestNextQuestion` |
| NOT SPECIFIED IN SYSTEM | Diagnostic scoring | Diagnostic Pre-test Page | `score = sum(weight for correct answers)`; `percentage = (score/totalPossible)*100` | `selectedAnswers`, `questions[]` with `weight` | `src/dashboard/pages/DiagnosticPretestPage.tsx` |
| NOT SPECIFIED IN SYSTEM | Competency breakdown per diagnostic | Diagnostic Pre-test Page | Bucket by `competencyCode` and compute per-bucket percentage | `questions[].competencyCode`, `selectedAnswers` | `src/dashboard/pages/DiagnosticPretestPage.tsx` |
| NOT SPECIFIED IN SYSTEM | Pre-test gap analysis metrics (theta computed; not displayed in UI) | Gap Analysis Page + generateResult | Gap aggregation from mapped (question→competency) responses, theta = `log(correct/(total-correct))` if interior | `correct`, `total`, computed `responses`, computed `mapping` | `src/services/assessmentProgress.ts:generateResult`, `src/dashboard/pages/GapAnalysisPage.tsx` |
| NOT SPECIFIED IN SYSTEM | Personalized reviewer generation (AI) | Personalized Study Plan Page + OpenAI proxy | Build prompt (wrong/correct sections; unseen folded into “needs review”), send chat request, fallback if empty/error | Diagnostic record, selected answers, competency breakdown | `src/dashboard/pages/PersonalizedStudyPlanPage.tsx`, `src/dashboard/data/reviewerPromptBuilder.ts`, `src/services/openai.ts`, `vite.config.ts` |
| NOT SPECIFIED IN SYSTEM | Save/stream long reviewer scripts | Assessment Progress Service | Inline storage if length ≤ 90000 chars else chunk into docs sized 18000 chars | Firestore `ReviewerNarrationChunks` subcollection | `src/services/assessmentProgress.ts:saveReviewerNarrationScript` |
| NOT SPECIFIED IN SYSTEM | Summative post-test adaptive question set | Diagnostic Question Dataset | CAT-style adaptive selection (heuristic difficulty targeting + pretest gap focus + module balancing) capped at 30 points | Diagnostic question pool; diagnostic answers | `src/dashboard/data/diagnosticQuestions.ts:getCATPosttestInitialQuestions`, `src/dashboard/data/diagnosticQuestions.ts:getCATPosttestNextQuestion` |
| NOT SPECIFIED IN SYSTEM | Limit retakes (trial-based) | Summative Post-test Page | `failedAttempts` increments when `!passed`; lock when `>=3` | Firestore `AssessmentProgress.failedAttempts`, `isLocked` | `src/dashboard/pages/SummativePosttestPage.tsx` |
| NOT SPECIFIED IN SYSTEM | Admin analytics dashboard | Admin Service + Admin Dashboard | Compute averages over submitted records; collectionGroup scan | Firestore `userProfiles`, `AssessmentProgress` | `src/services/admin.ts:getAdminMetrics`, `src/admin/pages/AdminDashboardPage.tsx` |

---

## 3. System Architecture

### Architectural Style (derived from system)
- Client-side single-page application (SPA) using React + React Router — `src/main.tsx`, `src/routes/AppRoutes.tsx`
- Direct client-to-Firebase access (Auth + Firestore) via Firebase web SDK — `src/lib/firebase.ts`, `src/services/*`
- Optional AI integration is mediated by Vite dev/preview middleware at `/api/openai/chat` — `vite.config.ts`

### Components

#### Frontend
- React UI with page-level components under `src/dashboard/pages/*`, `src/auth/*`, `src/admin/pages/*`
- State storage in React hooks (`useState`, `useEffect`, `useMemo`) and localStorage — examples: `src/contexts/BrightnessContext.tsx`, `src/contexts/GradingStageContext.tsx`

#### Backend
- NOT SPECIFIED IN SYSTEM as an independent deployed backend.
- Development/preview middleware for OpenAI proxy exists inside Vite config — `vite.config.ts`

#### Database
- Firestore (Firebase) — `src/lib/firebase.ts`, `src/services/*`

#### External Services
- Firebase Auth (email/password and Google popup) — `src/services/auth.ts`
- OpenAI Chat Completions (server-side fetch from the Vite middleware) — `vite.config.ts`
- Browser Web Speech API (SpeechSynthesis) for audiobook review playback — `src/dashboard/pages/AudiobookReviewPage.tsx`

### Data Flow (STEP-BY-STEP)

#### A) Authentication (student)
1. User opens `/auth/signin` or `/auth/login` — `src/routes/paths.ts`, `src/routes/AppRoutes.tsx`
2. UI calls Firebase Auth helpers:
   - Sign-up: `createUserWithEmailAndPassword` — `src/services/auth.ts`, `src/auth/SigninPage.tsx`
   - Sign-in: `signInWithEmailAndPassword` — `src/services/auth.ts`, `src/auth/LoginPage.tsx`
   - Google sign-in: `signInWithPopup` — `src/services/auth.ts`
3. On success, UI navigates to `/dashboard` — `src/auth/LoginPage.tsx`, `src/auth/SigninPage.tsx`, `src/routes/paths.ts`
4. Profile is created/upserted in Firestore `userProfiles/{uid}` — `src/services/userProfiles.ts`

#### B) Module learning and progress persistence
1. Student enters module viewer via `/dashboard/modules/viewer` with `location.state.moduleId` — `src/dashboard/pages/ModulesPage.tsx`, `src/dashboard/pages/ModuleViewerPage.tsx`
2. Viewer hydrates existing module progress from Firestore — `src/services/moduleProgress.ts:getModuleProgress`
3. Viewer computes progress: `0.8 * videoProgress + 0.2 * scrollProgress` (rounded) — `src/dashboard/pages/ModuleViewerPage.tsx`
4. Viewer upserts `ModuleProgress` to Firestore with `serverTimestamp()` after debounce — `src/services/moduleProgress.ts:upsertModuleProgress`, `src/dashboard/pages/ModuleViewerPage.tsx`

#### C) Diagnostic pre-test and persistence
1. Student starts pre-test at `/dashboard/prelim` — `src/routes/paths.ts`, `src/routes/AppRoutes.tsx`
2. Questions are selected adaptively (CAT-style) using `getCATPretestInitialQuestions()` + `getCATPretestNextQuestion()` and capped at 15 points — `src/dashboard/pages/DiagnosticPretestPage.tsx`, `src/dashboard/data/diagnosticQuestions.ts`
3. Answers are stored in component state; score computed as the sum of point weights for correct answers (weights derived from Bloom level) — `src/dashboard/pages/DiagnosticPretestPage.tsx`, `src/dashboard/data/diagnosticQuestions.ts`
4. Competency breakdown is bucketed by `question.competencyCode` — `src/dashboard/pages/DiagnosticPretestPage.tsx`
5. Progress is persisted periodically via `upsertAssessmentProgress(...)` (debounced) with:
   - `assessmentKey = <stage>.diagnosticAssessmentKey`
   - `questionIds`, `selectedAnswers`, `currentQuestionIndex`, `isSubmitted` — `src/services/assessmentProgress.ts`, `src/dashboard/pages/DiagnosticPretestPage.tsx`

### ASCII Diagram (REQUIRED)

#### Primary student workflow (high level)
`[Student] -> [/auth/* UI] -> [Firebase Auth] -> [/dashboard UI] -> [Firestore (userProfiles/...)] -> [Rendered progress/results]`

#### AI reviewer (development/preview)
`[Student] -> [PersonalizedStudyPlanPage] -> [fetch /api/openai/chat] -> [Vite middleware] -> [OpenAI /v1/chat/completions] -> [Reviewer script] -> [Firestore save]`

---

## 4. Technology Stack

| Layer | Technology | Role | Evidence |
|---|---|---|---|
| Runtime | Browser | Executes SPA, SpeechSynthesis API | `src/main.tsx`, `src/dashboard/pages/AudiobookReviewPage.tsx` |
| Frontend Framework | React 18 | UI components, state management | `package.json`, `src/App.tsx` |
| Build Tool | Vite | Dev server, bundling, preview server | `package.json`, `vite.config.ts` |
| Routing | react-router-dom | Page routing and route guards | `package.json`, `src/routes/AppRoutes.tsx` |
| Language | TypeScript | Type safety across UI/services | `tsconfig.json`, `src/**/*.ts(x)` |
| Styling | Tailwind CSS (via `@import "tailwindcss"`) | Utility-first styling | `src/index.css`, `tailwind.config.ts`, `postcss.config.js` |
| Icons | lucide-react | UI icon components | `package.json`, imports across pages |
| Charts | recharts | Radar/line charts for analytics | `package.json`, `src/dashboard/pages/DashboardPage.tsx`, `src/dashboard/pages/GapAnalysisPage.tsx` |
| Graph UI | @xyflow/react | Concept graph rendering | `package.json`, `src/dashboard/pages/GapAnalysisPage.tsx` |
| Animation | framer-motion | Animated transitions | `package.json`, `src/dashboard/pages/PersonalizedStudyPlanPage.tsx` |
| PDF/PNG Export | html2canvas + jsPDF | Cheatsheet/certificate export | `package.json`, `src/dashboard/pages/CheatsheetReviewPage.tsx`, `src/dashboard/pages/CertificationPage.tsx` |
| Auth + DB | Firebase (Auth + Firestore + Analytics + Storage) | Identity, persistence, analytics initialization | `package.json`, `src/lib/firebase.ts`, `src/services/*` |
| AI Provider | OpenAI Chat Completions (via Vite middleware) | Reviewer generation | `vite.config.ts`, `src/services/openai.ts` |

---

## 5. File and Code Structure (VERY IMPORTANT)

### Project Root
- `vite.config.ts` — Vite configuration and `/api/openai/chat` middleware proxy to OpenAI
- `package.json` — scripts (`dev`, `build`, `preview`) and dependency list
- `.env` — environment variables for Firebase, OpenAI proxy routing/model, and admin credentials (values present in repo; not reproduced here)
- `tailwind.config.ts`, `postcss.config.js`, `src/index.css` — styling pipeline

### `/src` Breakdown
- `src/main.tsx` — React root + `BrowserRouter`
- `src/App.tsx` — wraps `AppRoutes` in providers
- `src/routes/AppRoutes.tsx` — route map + auth gates + stage/reviewer gates
- `src/routes/paths.ts` — route constants
- `src/contexts/BrightnessContext.tsx` — theme mode + localStorage persistence
- `src/contexts/GradingStageContext.tsx` — stage selection + localStorage persistence
- `src/lib/firebase.ts` — Firebase app init, Auth/Firestore/Storage handles, optional Analytics
- `src/services/*` — Firestore and auth service functions
- `src/auth/*` — login/signin pages and theme toggle
- `src/dashboard/*` — dashboard layout + sidebar/topbar + all student pages + datasets
- `src/admin/*` — admin guard and admin pages

---

## 6. System Modules (FULL DETAIL)

### Module: Routing and Access Control
- Purpose: Define application routes and enforce access rules based on authentication and stage/reviewer state.
- Responsibilities:
  - Redirect unauthenticated users away from `/dashboard/*` — `src/routes/AppRoutes.tsx`
  - Gate “study-plan” vs “review” routes based on whether a reviewer exists — `ReviewerRouteGate` in `src/routes/AppRoutes.tsx`
  - Gate summative/results/certification based on submitted records — `StageFlowGate` in `src/routes/AppRoutes.tsx`
- Inputs:
  - Firebase auth state (`onAuthStateChanged`) — `src/routes/AppRoutes.tsx`
  - Firestore assessment records (`getUserAssessmentProgress`) — `src/routes/AppRoutes.tsx`
  - Selected stage (`useGradingStage`) — `src/routes/AppRoutes.tsx`
- Internal Processing (step-by-step):
  1. Wait for auth readiness (`isAuthReady`).
  2. If a gate component mounts, load assessment records for the user.
  3. Resolve active stage based on stage selection and unlocked stage.
  4. Decide whether to redirect based on `isStudyPlanUnlocked`, `isReviewUnlocked`, `isSubmitted`, `isFinished`.
- Outputs:
  - Render correct route element or `Navigate` redirect.
- Dependencies:
  - `firebase/auth`, `react-router-dom`
  - `src/services/assessmentProgress.ts`
  - `src/dashboard/data/learningStage.ts`
- Source Code Reference:
  - `src/routes/AppRoutes.tsx`
  - `src/routes/paths.ts`

### Module: Theme and Stage Context
- Purpose: Provide UI-level global state (theme brightness, selected grading stage).
- Responsibilities:
  - Persist theme in localStorage and apply dataset/class changes on `<html>` — `src/contexts/BrightnessContext.tsx`
  - Persist stage selection in localStorage; validate allowed values — `src/contexts/GradingStageContext.tsx`
- Inputs:
  - localStorage keys:
    - `pls-auth-brightness-mode` — `src/contexts/BrightnessContext.tsx`
    - `pls-grading-stage` — `src/contexts/GradingStageContext.tsx`
- Internal Processing (step-by-step):
  - Brightness:
    1. Read storage key; map `'bright'` to `light`, default `dark`.
    2. On mode change, write storage key and apply DOM classes/data attributes.
  - Stage:
    1. Read storage key; allow only `'prelim'|'midterm'|'final'`.
    2. Persist/remove key when stage changes.
- Outputs:
  - Context values consumed across pages.
- Dependencies:
  - `localStorage`, DOM `document.documentElement`
- Source Code Reference:
  - `src/contexts/BrightnessContext.tsx`
  - `src/contexts/GradingStageContext.tsx`

### Module: Firebase Initialization
- Purpose: Initialize Firebase services used across the system.
- Responsibilities:
  - Initialize app from Vite environment variables.
  - Export `auth`, `db`, `storage`.
  - Initialize Analytics conditionally (if supported).
- Inputs:
  - `import.meta.env.VITE_FIREBASE_*` variables — `src/lib/firebase.ts`
- Outputs:
  - Firebase service handles.
- Dependencies:
  - Firebase SDK modules: `firebase/app`, `firebase/auth`, `firebase/firestore`, `firebase/storage`, `firebase/analytics`
- Source Code Reference:
  - `src/lib/firebase.ts`

### Module: Authentication Services
- Purpose: Wrap Firebase Auth API calls used by UI pages.
- Responsibilities:
  - Email/password sign-up and sign-in.
  - Google sign-in via popup.
  - Password reset and sign-out.
- Inputs (source + format):
  - UI form strings: `email`, `password` — `src/auth/LoginPage.tsx`, `src/auth/SigninPage.tsx`
- Internal Processing (step-by-step):
  - Call the corresponding Firebase function (e.g., `signInWithEmailAndPassword`).
  - Return `UserCredential` promise.
- Outputs:
  - `UserCredential` or throw error.
- Dependencies:
  - `firebase/auth`
- Source Code Reference:
  - `src/services/auth.ts`

### Module: User Profile Services
- Purpose: Persist and read user identity in Firestore.
- Responsibilities:
  - `createUserProfile` (initial write with `createdAt`)
  - `upsertUserProfile` (merge update with `updatedAt`)
  - `getUserProfile`
  - `isUserAdmin`
- Inputs (source + format):
  - `UserProfileInput = { uid, fullName, email }` — `src/services/userProfiles.ts`
- Internal Processing (step-by-step):
  - Build doc ref at `userProfiles/{uid}`.
  - Write fields and timestamps; merge on upsert.
  - Read and return typed `UserProfile` or `null`.
- Outputs:
  - Firestore writes or loaded profile object.
- Dependencies:
  - `firebase/firestore`
- Source Code Reference:
  - `src/services/userProfiles.ts`

### Module: Module Progress Services
- Purpose: Persist and retrieve module consumption progress per user.
- Responsibilities:
  - Upsert progress documents keyed by module id.
  - Read a single module progress record.
  - Read all module progress records for a user.
- Inputs (source + format):
  - `ModuleProgressInput = { uid, moduleId, videoProgress, scrollProgress, overallProgress, isCompleted }` — `src/services/moduleProgress.ts`
- Internal Processing (step-by-step):
  1. Resolve doc ref `userProfiles/{uid}/ModuleProgress/{moduleId}`.
  2. `setDoc(..., { ...payload, updatedAt: serverTimestamp() }, { merge: true })`.
  3. For reads: `getDoc` / `getDocs` and return typed records (or `null` for missing single doc).
- Outputs:
  - Module progress doc id (on upsert) or loaded progress record(s).
- Dependencies:
  - `firebase/firestore`
- Source Code Reference:
  - `src/services/moduleProgress.ts`

### Module: Assessment Progress Services
- Purpose: Persist and retrieve assessment state (diagnostic and summative) and reviewer script storage.
- Responsibilities:
  - Upsert assessment progress documents by `assessmentKey`.
  - Load assessment collection for a user.
  - Clear reviewer-specific fields (`clearReviewerData`).
  - Save and load reviewer narration script (inline or chunked).
  - Provide computed result utilities (`computeTheta`, `computeCompetencies`, `computeGaps`, `generateResult`).
- Inputs (source + format):
  - `AssessmentProgressInput` — `src/services/assessmentProgress.ts`
  - Reviewer script string (`script`) — `saveReviewerNarrationScript`
- Internal Processing (step-by-step):
  - Upsert:
    1. Filter out `undefined` values from payload (sanitization).
    2. `setDoc(..., { ...sanitizedPayload, updatedAt: serverTimestamp(), passedAt: passed ? serverTimestamp() : null }, { merge:true })`.
  - Narration save:
    1. Trim script.
    2. Inline save when empty or below inline character limit.
    3. Chunk into `ReviewerNarrationChunks` docs when above limit.
  - Narration load:
    1. If not chunk mode, return trimmed inline fallback.
    2. Else load chunk docs, order by `index`, and join content.
- Outputs:
  - Firestore docs in `AssessmentProgress` and optional chunks subcollection.
- Dependencies:
  - `firebase/firestore`
- Source Code Reference:
  - `src/services/assessmentProgress.ts`

### Module: Diagnostic Question Dataset
- Purpose: Provide question banks and algorithms to select pre-test and summative question sets.
- Responsibilities:
  - Export question pools for stages (`prelim`, `midterm`, `final`).
  - Normalize legacy question IDs for certain ranges.
  - Assign per-question point weights from Bloom level and enforce fixed points caps (pretest 15 pts, post-test 30 pts).
    - Bloom point mapping (implementation):
      - Remember: 1
      - Understand: 1
      - Apply: 1.5
      - Analyze: 1.5
      - Evaluate: 2
      - Create: 2
  - CAT-style adaptive pretest selection (`getCATPretestInitialQuestions`, `getCATPretestNextQuestion`).
  - CAT-style adaptive post-test selection (`getCATPosttestInitialQuestions`, `getCATPosttestNextQuestion`).
- Inputs (source + format):
  - Static question bank arrays in `src/dashboard/data/diagnosticQuestions.ts`.
- Internal Processing (step-by-step):
  - Add point weights to static question banks based on Bloom level.
  - Select questions subject to a fixed points cap (supports half-point weights).
  - Use heuristic adaptive selection for pretest/post-test (difficulty targeting + module balancing; post-test also considers pretest gap signals).
  - Normalize legacy ID ranges (midterm and final) when mapping persisted IDs.
- Outputs:
  - `DiagnosticQuestion[]` sets and normalization helpers.
- Dependencies:
  - None external (pure in-memory operations).
- Source Code Reference:
  - `src/dashboard/data/diagnosticQuestions.ts`

### Module: Learning Stage Logic
- Purpose: Define stage boundaries, unlocking, and record selection for diagnostic/summative per stage.
- Responsibilities:
  - Stage configs for module ranges and assessment keys.
  - Determine unlocked stage based on passed summative assessments.
  - Resolve stage based on user selection and unlock state.
  - Determine if all modules in a stage are completed.
  - Determine if reviewer exists for a stage.
  - Select stage diagnostic and summative records from an assessment map.
- Inputs (source + format):
  - `AssessmentProgressRecord[]` and `ModuleProgressRecord[]` (loaded from services).
- Outputs:
  - Effective `LearningStageKey`, boolean gates, and selected records.
- Dependencies:
  - Types from `src/services/assessmentProgress.ts` and `src/services/moduleProgress.ts`.
- Source Code Reference:
  - `src/dashboard/data/learningStage.ts`

### Module: Reviewer Prompt Builder
- Purpose: Build structured prompts and fallback outputs for AI reviewer generation.
- Responsibilities:
  - Define reviewer preferences and labels.
  - Generate system instructions by preference.
  - Build prompt payload including competency breakdown and categorized questions.
  - Build fallback reviewer string when AI is unavailable.
- Inputs (source + format):
  - Assessment summary values and categorized question lists built from the diagnostic dataset.
- Outputs:
  - Prompt strings and fallback reviewer strings.
- Dependencies:
  - `AssessmentCompetencyBreakdown` type — `src/dashboard/data/reviewerPromptBuilder.ts`
- Source Code Reference:
  - `src/dashboard/data/reviewerPromptBuilder.ts`

### Module: OpenAI Client Wrapper
- Purpose: Call the configured OpenAI chat endpoint from the browser.
- Responsibilities:
  - Determine base URL and default model from Vite env.
  - POST JSON `{ model, messages }` to `${apiBaseUrl}/chat`.
  - Normalize errors and extract content.
- Inputs (source + format):
  - `{ messages, model?, signal? }` — `src/services/openai.ts`
- Outputs:
  - `{ content, raw? }`
- Dependencies:
  - Browser `fetch`.
- Source Code Reference:
  - `src/services/openai.ts`

### Module: Vite OpenAI Proxy (Dev/Preview Middleware)
- Purpose: Provide `/api/openai/chat` endpoint for the SPA and forward requests to OpenAI.
- Responsibilities:
  - Validate method is POST.
  - Parse request JSON with `messages` and `model`.
  - Require an OpenAI API key (from `OPENAI_API_KEY` or `VITE_OPENAI_API_KEY`).
  - Forward request to OpenAI chat completions and return `{ content }`.
- Inputs (source + format):
  - Node middleware `req` stream, `res`.
- Outputs:
  - JSON response with either `content` or `error.message`.
- Dependencies:
  - `vite` server middleware, Node `fetch`.
- Source Code Reference:
  - `vite.config.ts`

### Module: Admin Services and Admin UI
- Purpose: Provide administrative functions and UI to view aggregated metrics and manage users.
- Responsibilities:
  - Admin authentication via localStorage session key.
  - List `userProfiles` and normalize role/email/name.
  - Compute metrics across `AssessmentProgress` collection group.
  - Load per-user stage details including score history and attempts.
  - Reset user progress and delete user profile doc.
- Inputs (source + format):
  - Firestore snapshots for `userProfiles` and `AssessmentProgress` group.
  - Local storage admin session key: `pls_admin_session`.
- Outputs:
  - Admin metrics, user lists, and destructive operations (progress reset/delete).
- Dependencies:
  - `firebase/firestore`
  - Local storage for admin session
- Source Code Reference:
  - `src/services/admin.ts`
  - `src/services/adminAuth.ts`
  - `src/admin/pages/AdminDashboardPage.tsx`
  - `src/admin/pages/AdminLoginPage.tsx`
  - `src/admin/components/AdminRoute.tsx`

### Module: Dashboard Layout Shell (Layout + Sidebar + TopBar)
- Purpose: Provide persistent navigation and layout for all `/dashboard/*` pages.
- Responsibilities:
  - Layout wrapper with `Sidebar`, `TopBar`, and nested `<Outlet />` — `src/dashboard/DashboardLayout.tsx`
  - Sidebar shows navigation items and gating (locked/unlocked) states — `src/dashboard/Sidebar.tsx`
  - TopBar shows page title, notifications UI, theme toggle, and logout — `src/dashboard/TopBar.tsx`
- Inputs (source + format):
  - Route location (`useLocation`) — Sidebar/TopBar
  - Firebase auth state (`onAuthStateChanged`) — Sidebar/TopBar
  - Assessment records and module progress records — Sidebar
  - Local storage stage selection (`useGradingStage`) — Sidebar
- Internal Processing (step-by-step):
  - Sidebar:
    1. On auth state change, load `getUserModuleProgress` and `getUserAssessmentProgress`.
    2. Build `assessmentMap` and resolve current stage.
    3. Compute stage locks based on previous stage summative pass and submission flags.
    4. Compute navigation locks:
       - Diagnostic unlock requires `areStageModulesCompleted(...)`.
       - Gap analysis unlock requires diagnostic submission/finish.
       - Study plan / review / summative / results / certification unlocks depend on stored flags.
  - TopBar:
    1. On auth, load user profile and determine display name.
    2. Provide logout action via Firebase sign-out.
- Outputs:
  - Visible navigation state (locked/unlocked indicators) and navigation links.
- Dependencies:
  - `react-router-dom`, `firebase/auth`, `src/services/*`, `src/dashboard/data/learningStage.ts`
- Source Code Reference:
  - `src/dashboard/DashboardLayout.tsx`
  - `src/dashboard/Sidebar.tsx`
  - `src/dashboard/TopBar.tsx`

### Module: Modules Page (Course Module Selection)
- Purpose: Display module list for the selected/effective term and gate access to pre-test by completion.
- Responsibilities:
  - Display modules from `MODULES_CATALOG`.
  - Determine which modules are available based on unlocked term and prior gates.
  - Navigate into module viewer with selected module id.
  - Enable “Start Pretest” only when all modules in active term are completed.
- Inputs (source + format):
  - Module catalog (`MODULES_CATALOG`) — `src/dashboard/data/modulesCatalog.ts`
  - Module progress records (`getUserModuleProgress`) — `src/services/moduleProgress.ts`
  - Assessment records (`getUserAssessmentProgress`) to determine unlocked term — `src/services/assessmentProgress.ts`
  - Stage selection from `useGradingStage` — `src/contexts/GradingStageContext.tsx`
- Internal Processing (step-by-step):
  1. On auth, load progress + assessments.
  2. Compute `unlockedTermIndex` by checking `passed === true` on required summative keys.
  3. Clamp `selectedStage` to unlocked index if needed.
  4. Mark modules completed by progress record (`isCompleted` or `overallProgress >= 100`).
  5. Compute `canTakePretest` as “every module in active term is completed”.
- Outputs:
  - Module list UI, term selection behavior, and navigation to viewer.
- Dependencies:
  - `src/dashboard/data/modulesCatalog.ts`, `src/services/moduleProgress.ts`, `src/services/assessmentProgress.ts`
- Source Code Reference:
  - `src/dashboard/pages/ModulesPage.tsx`

### Module: Module Viewer Page (Learning Content Consumption)
- Purpose: Present a single module’s learning content and persist progress.
- Responsibilities:
  - Render module title/description and lesson content text.
  - Render module video from `public/videos/...`.
  - Track and persist:
    - `videoProgress`
    - `scrollProgress`
    - `overallProgress`
    - `isCompleted`
- Inputs (source + format):
  - `location.state.moduleId` (number) — `src/dashboard/pages/ModuleViewerPage.tsx`
  - Module catalog entry (`MODULES_CATALOG`) — `src/dashboard/data/modulesCatalog.ts`
  - Persisted progress record (`getModuleProgress`) — `src/services/moduleProgress.ts`
- Internal Processing (step-by-step):
  1. Resolve module by id (fallback to first module if missing).
  2. Hydrate persisted progress and lock completion if already complete.
  3. Compute `progress = video*0.8 + scroll*0.2` and round.
  4. Debounced upsert to Firestore.
  5. Detect scroll completion and video completion (implementation details are in page logic).
- Outputs:
  - Updated `ModuleProgress` doc and navigation back to modules.
- Dependencies:
  - `src/services/moduleProgress.ts`
- Source Code Reference:
  - `src/dashboard/pages/ModuleViewerPage.tsx`

### Module: Diagnostic Pre-test Page
- Purpose: Conduct the diagnostic assessment, compute competency breakdown, and persist state.
- Responsibilities:
  - Load/generate question set for the effective stage.
  - Track user answers and progress.
  - Compute:
    - `score`
    - `percentage`
    - `competencyBreakdown`
  - Persist progress and final submission to Firestore.
- Inputs (source + format):
  - Diagnostic question pool functions — `src/dashboard/data/diagnosticQuestions.ts`
  - Stage config and record selection — `src/dashboard/data/learningStage.ts`
  - Auth uid — `firebase/auth` state
- Internal Processing (step-by-step):
  1. On auth, fetch assessment records and hydrate persisted diagnostic state if present.
  2. Restore `questionIds`, `selectedAnswers`, `currentQuestionIndex`, `isSubmitted`.
  3. Compute score and breakdown via in-memory loops.
  4. Debounced upsert to Firestore (and final upsert on submit).
- Outputs:
  - `AssessmentProgress` diagnostic record for the current stage.
- Dependencies:
  - `src/services/assessmentProgress.ts`
- Source Code Reference:
  - `src/dashboard/pages/DiagnosticPretestPage.tsx`

### Module: Gap Analysis Page (Pre-test)
- Purpose: Present diagnostic results visualization and unlock the next step (study plan/reviewer).
- Responsibilities:
  - Load diagnostic record, compute chart datasets, and display summary.
  - On “Analyze Concepts” action, set `isStudyPlanUnlocked: true` and mark record submitted/finished.
  - Compute dynamic metrics from `generateResult`:
    - percentage display
    - knowledge gap count
  - IRT/theta is computed in `generateResult` but is not shown in the Gap Analysis UI.
- Inputs (source + format):
  - Diagnostic record fields: `score`, `totalItems`, `questionIds`, `selectedAnswers` — `src/services/assessmentProgress.ts`
  - Stage question pool for mapping question → competency — `src/dashboard/data/diagnosticQuestions.ts`
- Internal Processing (step-by-step):
  1. Load diagnostic record and hydrate `score`, `totalItems`, `questionIds`, `selectedAnswers`.
  2. Resolve active question set based on stored IDs or stage pool.
  3. Derive:
     - `responses` as `{question_id, correctness}`
     - `mapping` as `{question_id, competency_id}`
  4. Call `generateResult(correct, total, responses, mapping)` and render metrics.
  5. Unlock study plan by `upsertAssessmentProgress(...)` write.
- Outputs:
  - Updated diagnostic record unlock flags and a rendered gap analysis UI.
- Dependencies:
  - `src/services/assessmentProgress.ts` (including `generateResult`)
- Source Code Reference:
  - `src/dashboard/pages/GapAnalysisPage.tsx`

### Module: Personalized Study Plan Page (Reviewer Maker)
- Purpose: Generate and persist a reviewer output and unlock review flow.
- Responsibilities:
  - Load diagnostic record and (if present) summative record to select reviewer source.
  - Let user pick `reviewerPreference`.
  - Build question categories: wrong / correct (unseen is folded into “needs review” for AI outputs; flashcards may still include unseen as extra practice cards).
  - Generate reviewer output via OpenAI proxy (or fallback) and persist to Firestore.
  - Save narration script inline/chunks for non-flashcard preferences.
- Inputs (source + format):
  - Assessment records for stage (`getUserAssessmentProgress`) — `src/services/assessmentProgress.ts`
  - Diagnostic question pool (for building question lists) — `src/dashboard/data/diagnosticQuestions.ts`
  - Prompt templates and system instructions — `src/dashboard/data/reviewerPromptBuilder.ts`
- Internal Processing (step-by-step):
  1. Resolve active stage and load diagnostic + optional summative record.
  2. Build `competencyBreakdown` from stored record or recompute from questions + selected answers.
  3. Derive wrong/correct question lists (and optionally unseen practice cards for flashcards).
  4. If preference is flashcards: set `reviewerOutput = 'FLASHCARD_READY'`.
  5. Else call `sendOpenAIChat` with system/user messages and capture returned content.
  6. If AI output is empty/unavailable: build fallback reviewer.
  7. Persist unlock flags and reviewer fields to the diagnostic record.
  8. Persist narration script using `saveReviewerNarrationScript` for non-flashcards.
- Outputs:
  - Reviewer output stored and review unlocked (`isReviewUnlocked: true`).
- Dependencies:
  - `src/services/openai.ts`, `src/services/assessmentProgress.ts`, `src/dashboard/data/reviewerPromptBuilder.ts`
- Source Code Reference:
  - `src/dashboard/pages/PersonalizedStudyPlanPage.tsx`

### Module: Review Landing Page
- Purpose: Redirect `/dashboard/review` to the correct review route based on stored `reviewerPreference`, optionally showing an initialization animation.
- Responsibilities:
  - Determine target route (flashcards/audiobook/cheatsheet).
  - Play init animation only once per uid+stage using localStorage key `review-init-seen:{uid}:{stage}`.
- Inputs (source + format):
  - Diagnostic record `reviewerPreference` — `src/services/assessmentProgress.ts`
  - Local storage init flag — `src/dashboard/pages/ReviewLandingPage.tsx`
- Outputs:
  - Redirect to one of:
    - `/dashboard/review/flashcards`
    - `/dashboard/review/audiobook`
    - `/dashboard/review/cheatsheet`
- Source Code Reference:
  - `src/dashboard/pages/ReviewLandingPage.tsx`

### Module: Flashcard Review Page
- Purpose: Provide an interactive flashcard review flow based on diagnostic answers (wrong/correct), while also including unseen questions as extra practice cards (unseen is not shown as a separate UI stat).
- Responsibilities:
  - Load diagnostic record’s `questionIds` and `selectedAnswers`.
  - Compute wrong/correct question sets from saved answers, and unseen questions from the stage pool.
  - Build a combined flow list and group cards by `module` into decks.
- Inputs (source + format):
  - Diagnostic record answers and question IDs — `src/services/assessmentProgress.ts`
  - Stage question pool — `src/dashboard/data/diagnosticQuestions.ts`
- Outputs:
  - Flashcard deck UI and navigation through cards.
- Source Code Reference:
  - `src/dashboard/pages/FlashcardReviewPage.tsx`

### Module: Audiobook Review Page
- Purpose: Convert a reviewer script into chapters and play them using browser SpeechSynthesis.
- Responsibilities:
  - Load reviewer script (inline/chunks) from diagnostic record.
  - Split script blocks by blank lines into chapters; assign priority based on keywords (wrong/correct) and reorder chapters.
  - Use SpeechSynthesis voices; select preferred voice when available; play/pause/skip controls.
- Inputs (source + format):
  - Reviewer script (string) — `src/services/assessmentProgress.ts:loadReviewerNarrationScript`
  - Browser speech voices list — `window.speechSynthesis.getVoices()`
- Outputs:
  - Spoken audio playback and on-screen chapter navigation.
- Source Code Reference:
  - `src/dashboard/pages/AudiobookReviewPage.tsx`

### Module: Cheatsheet Review Page
- Purpose: Render a cheatsheet-style reviewer and export it as PNG or PDF.
- Responsibilities:
  - Load reviewer script (inline/chunks) and normalize into blocks and Q/A lines.
  - Categorize blocks by title keywords (wrong/correct).
  - Export rendered DOM to PNG/PDF using `html2canvas` and `jsPDF`.
- Inputs (source + format):
  - Reviewer script from Firestore
  - DOM element ref for export (`exportRef`)
- Outputs:
  - Downloaded PNG or PDF file via browser download flow.
- Source Code Reference:
  - `src/dashboard/pages/CheatsheetReviewPage.tsx`

### Module: Summative Post-test Page
- Purpose: Conduct summative assessment with CAT-style adaptive question selection, attempt tracking, and locking.
- Responsibilities:
  - Generate question set using `getCATPosttestInitialQuestions` + `getCATPosttestNextQuestion` (capped at 30 points).
  - Persist in-progress state (answers, questionIds, index).
  - On submission:
    - Append an attempt detail
    - Update `failedAttempts`, `isLocked`, and `scoreHistory`
    - Navigate to results
- Inputs (source + format):
  - Diagnostic record as basis for weighting (question ids + answers)
  - Summative record for persistence and retake behavior
- Outputs:
  - Summative `AssessmentProgress` record keyed by `<stage>.summativeAssessmentKey`.
- Source Code Reference:
  - `src/dashboard/pages/SummativePosttestPage.tsx`

### Module: Post-test Gap Analysis Page
- Purpose: Provide gap visualization and review of Q/A after summative completion (particularly when failed).
- Responsibilities:
  - Load summative record for stage and compute chart datasets by competency correctness.
  - Compute weak competency count by grouping questions by `competencyCode` and flagging any competency with mastery `< 75%` (displayed as “Weak Competencies”).
  - Provide per-question Q/A review list derived from selected answers.
- Inputs (source + format):
  - Summative record fields: score, totalItems, questionIds, selectedAnswers — `src/services/assessmentProgress.ts`
  - Stage question pool for hydration and normalization — `src/dashboard/data/diagnosticQuestions.ts`
- Outputs:
  - Radar chart, concept graph, and Q/A review UI for post-test context.
- Source Code Reference:
  - `src/dashboard/pages/PostTestGapAnalysisPage.tsx`

### Module: Learning Results Page
- Purpose: Display outcome of the most recent summative assessment for the effective stage.
- Responsibilities:
  - Load diagnostic and summative percentages for the effective stage.
  - Compute improvement (`posttestPercentage - pretestPercentage`).
  - Determine lock state (`isLocked` or failed attempts >= 3).
  - Support clearing reviewer data to regenerate reviewer.
- Inputs (source + format):
  - Assessment records for user — `src/services/assessmentProgress.ts`
- Outputs:
  - Results UI and navigation to next stage’s modules (by updating selectedStage).
- Source Code Reference:
  - `src/dashboard/pages/LearningResultsPage.tsx`

### Module: Certification Page
- Purpose: Generate and export a certificate when the final stage is completed.
- Responsibilities:
  - Determine completion based on final stage summative record submission/finish.
  - Build certificate id from year and uid prefix.
  - List completed modules based on module progress.
  - Export as PDF using html2canvas + jsPDF; support print.
- Inputs (source + format):
  - `getStageSummativeRecord(..., 'final')`, `getUserModuleProgress`, `getUserProfile` — `src/dashboard/pages/CertificationPage.tsx`
- Outputs:
  - Rendered certificate and downloadable PDF.
- Source Code Reference:
  - `src/dashboard/pages/CertificationPage.tsx`

### Module: Dashboard Page (Student Overview)
- Purpose: Provide a single-page summary of progress across the current stage flow.
- Responsibilities:
  - Load profile, assessments, and modules on auth change.
  - Compute course progress and step completion (modules → pre-test → gap analysis → study → post-test → results).
  - Render radar and line charts based on competency breakdown and pre/post results.
- Inputs (source + format):
  - Assessment records, module records, profile data.
- Outputs:
  - Dashboard UI and “next action” navigation based on computed state.
- Source Code Reference:
  - `src/dashboard/pages/DashboardPage.tsx`

### Module: Profile Page
- Purpose: View and edit user profile (full name) and show account details.
- Responsibilities:
  - Load auth user email and profile `fullName`.
  - Upsert profile changes to Firestore and update Firebase Auth displayName.
- Inputs (source + format):
  - Auth currentUser and Firestore userProfile.
- Outputs:
  - Updated profile data in Firestore (and Auth displayName).
- Source Code Reference:
  - `src/dashboard/pages/ProfilePage.tsx`

### Module: Admin Login and Admin Dashboard Pages
- Purpose: Provide a static-credential admin console for user/metrics management.
- Responsibilities:
  - Admin login:
    - Validate username/password via `signInAdmin`, then set localStorage session key.
  - Admin dashboard:
    - Load metrics and users via admin services.
    - Send password reset emails (Firebase Auth email reset).
    - Reset/delete user progress using Firestore operations.
- Inputs (source + format):
  - Admin credentials from env (or defaults) — `src/services/adminAuth.ts`
  - Firestore user/assessment/module collections — `src/services/admin.ts`
- Outputs:
  - Admin UI actions and Firestore modifications.
- Source Code Reference:
  - `src/admin/pages/AdminLoginPage.tsx`
  - `src/admin/pages/AdminDashboardPage.tsx`
  - `src/services/adminAuth.ts`
  - `src/services/admin.ts`

---

## 7. Core Algorithms and Logic (CRITICAL SECTION)

### Algorithm: Stage Unlock Resolution
- Purpose: Determine which learning stage is unlocked based on passed summative assessments.
- Trigger condition: Any time pages need effective stage (Sidebar, Dashboard, gates).
- Input data:
  - `assessmentMap: Map<string, AssessmentProgressRecord>` — created from `getUserAssessmentProgress(...)` results.
- Step-by-step execution:
  1. If midterm summative is passed: stage = `final`.
  2. Else if prelim summative is passed: stage = `midterm`.
  3. Else stage = `prelim`.
- Decision logic:
  - If `assessmentMap.get(<summativeKey>)?.passed === true` then advance.
- Output:
  - `LearningStageKey`
- Data transformation:
  - Summative records (by key) → selected stage key.
- Source reference:
  - `src/dashboard/data/learningStage.ts:resolveLearningStage`

### Algorithm: Stage Selection With Guard (selected stage vs unlocked stage)
- Purpose: Prevent selecting a stage beyond unlocked progression.
- Trigger condition: When a stage-dependent page loads or a user changes stage.
- Input data:
  - `assessmentMap`
  - `selectedStage: LearningStageKey | null | undefined`
- Step-by-step execution:
  1. Compute `unlockedStage = resolveLearningStage(assessmentMap)`.
  2. If `selectedStage` is null/undefined, return `unlockedStage`.
  3. Find indices in `LEARNING_STAGE_ORDER`.
  4. If selected index is invalid or beyond unlocked index, return `unlockedStage`; else return `selectedStage`.
- Output:
  - Effective `LearningStageKey`
- Source reference:
  - `src/dashboard/data/learningStage.ts:resolveStageForSelection`

### Algorithm: Module Completion Gate
- Purpose: Determine if diagnostic pre-test should be unlocked for a stage.
- Trigger condition: Sidebar gating and ModulesPage “Start Pretest” button.
- Input data:
  - `moduleRecords: ModuleProgressRecord[]`
  - Stage config range (`moduleStartId`..`moduleEndId`)
- Step-by-step execution:
  1. Build map `moduleId -> ModuleProgressRecord`.
  2. For each moduleId in stage range:
     - Completed if `isCompleted === true` OR `(overallProgress ?? 0) >= 100`.
  3. If any module is incomplete, return `false`. Else return `true`.
- Output:
  - boolean
- Source reference:
  - `src/dashboard/data/learningStage.ts:areStageModulesCompleted`

### Algorithm: CAT Diagnostic Pre-test (adaptive, point-capped)
- Purpose: Build an adaptive pre-test question sequence capped at 15 points.
- Trigger condition: Diagnostic pre-test flow (as the learner progresses through questions).
- Input data:
  - Stage question pool (`prelim` / `midterm` / `final`)
  - `questionIds: number[]` (asked so far)
  - `selectedAnswers: Record<number, number>`
  - Point weights derived from Bloom level
- Step-by-step execution:
  1. Start with `getCATPretestInitialQuestions(stage)` (starter question selection).
  2. When the learner is on the last currently-generated question, compute a next candidate with `getCATPretestNextQuestion({ stage, questionIds, selectedAnswers, maxTotalPoints: 15 })`.
  3. Heuristic next-question selection (implementation-derived):
     - Estimate performance from earned points vs total points so far.
     - Choose a target difficulty weight (1, 1.5, or 2 points).
     - Prefer modules with fewer asked questions (module balancing).
     - Choose an unseen question that fits remaining points under the cap.
  4. Stop adding questions when no candidate fits or the points cap is reached.
- Output:
  - `DiagnosticQuestion[]` (built incrementally; saved `questionIds` persist the generated set)
- Source reference:
  - `src/dashboard/data/diagnosticQuestions.ts:getCATPretestInitialQuestions`
  - `src/dashboard/data/diagnosticQuestions.ts:getCATPretestNextQuestion`

### Algorithm: CAT Summative Post-test (adaptive, point-capped)
- Purpose: Build an adaptive post-test question sequence capped at 30 points.
- Trigger condition: Summative post-test generation and progression.
- Input data:
  - Pretest `questionIds` and `selectedAnswers` (used as gap signal)
  - Post-test asked `questionIds` and current `selectedAnswers`
  - Stage question pool (`prelim` / `midterm` / `final`)
- Step-by-step execution:
  1. Initialize with `getCATPosttestInitialQuestions({ stage, pretestQuestionIds, pretestSelectedAnswers })`.
     - Prefers questions not in the pretest set when available.
  2. When the learner is on the last currently-generated question, compute a next candidate with `getCATPosttestNextQuestion({ stage, pretestQuestionIds, pretestSelectedAnswers, posttestQuestionIds, posttestSelectedAnswers, maxTotalPoints: 30 })`.
  3. Heuristic next-question selection (implementation-derived):
     - Estimate current post-test performance from earned vs total points so far.
     - Choose a target difficulty weight (1, 1.5, or 2 points).
     - Prioritize modules with larger pretest “gap” (weighted wrongness), while also balancing module coverage.
     - Choose an unseen question that fits remaining points under the cap.
  4. Stop adding questions when no candidate fits or the points cap is reached.
- Output:
  - `DiagnosticQuestion[]` (built incrementally; saved `questionIds` persist the generated set)
- Source reference:
  - `src/dashboard/data/diagnosticQuestions.ts:getCATPosttestInitialQuestions`
  - `src/dashboard/data/diagnosticQuestions.ts:getCATPosttestNextQuestion`

### Algorithm: Competency Breakdown Computation (diagnostic)
- Purpose: Compute per-competency correctness totals and percentages.
- Trigger condition: Diagnostic pre-test page render and persistence.
- Input data:
  - `questions[]` with `competencyCode`, `correctAnswerIndex`, `id`, `weight`
  - `selectedAnswers: Record<number, number>`
- Step-by-step execution:
  1. For each question, initialize bucket if needed.
  2. Compare selected answer to correct index and increment `correct` by `weight` when correct.
  3. Increment `total` per competency by `weight`.
  4. Compute `percentage = (correct/total)*100` (rounded to 2 decimals in some pages).
- Output:
  - `AssessmentCompetencyBreakdown`
- Source reference:
  - `src/dashboard/pages/DiagnosticPretestPage.tsx`
  - `src/dashboard/pages/PersonalizedStudyPlanPage.tsx:buildCompetencyBreakdown`

### Algorithm: Reviewer Prompt Construction (wrong/correct priority)
- Purpose: Build a deterministic prompt that constrains the AI to use provided data only.
- Trigger condition: Reviewer generation for non-flashcard preferences.
- Input data:
  - Assessment summary values and categorized question lists.
- Step-by-step execution:
  1. Serialize competency breakdown into lines.
  2. Serialize each question into a multi-line block with student answer and correct answer.
  3. Prepend strict instruction text and preference label.
- Output:
  - Prompt string.
- Source reference:
  - `src/dashboard/data/reviewerPromptBuilder.ts:buildReviewerPrompt`

### Algorithm: AI Reviewer Generation With Fallback
- Purpose: Produce reviewer output even when AI service is unavailable.
- Trigger condition: Reviewer creation action in Personalized Study Plan page.
- Input data:
  - System instruction + prompt.
- Step-by-step execution:
  1. If preference is `flashcards`, set output to `FLASHCARD_READY`.
  2. Else call `sendOpenAIChat(...)`.
  3. If call throws or returns empty, generate fallback reviewer via `buildFallbackReviewer(...)`.
  4. Persist unlock flags and reviewer preference; persist narration script if applicable.
- Output:
  - Reviewer output and updated diagnostic assessment record.
- Source reference:
  - `src/dashboard/pages/PersonalizedStudyPlanPage.tsx`
  - `src/services/openai.ts`
  - `src/dashboard/data/reviewerPromptBuilder.ts`
  - `src/services/assessmentProgress.ts`

### Algorithm: Reviewer Script Chunking (inline vs chunks)
- Purpose: Store long reviewer outputs without exceeding a single-document size.
- Trigger condition: Saving narration script.
- Input data:
  - `script: string`
- Step-by-step execution:
  1. Trim.
  2. Inline store if empty or <= 90000 chars.
  3. Else split into 18000-char chunks, write each chunk doc with `index` + `content`.
  4. Store first chunk inline and set storage metadata fields.
- Output:
  - Firestore doc writes in `AssessmentProgress` and optional `ReviewerNarrationChunks`.
- Source reference:
  - `src/services/assessmentProgress.ts:saveReviewerNarrationScript`

### Algorithm: Theta (IRT-like logit) Computation
- Purpose: Provide an ability estimate based on correct/incorrect counts.
- Trigger condition: Used via `generateResult` in gap analysis.
- Input data:
  - `correct`, `total`
- Step-by-step execution:
  1. If `correct === 0` OR `correct === total`, return `null`.
  2. Else return `Math.log(correct / (total - correct))`.
- Output:
  - `number | null`
- Source reference:
  - `src/services/assessmentProgress.ts:computeTheta`

### Algorithm: Competency Aggregation and Gap Ranking (generateResult)
- Purpose: Aggregate responses by competency and rank gaps by deviation from threshold.
- Trigger condition: Gap analysis computation.
- Input data:
  - `responses: {question_id, correctness}[]`
  - `mapping: {question_id, competency_id}[]`
- Step-by-step execution:
  1. Build `question_id -> competency_id` map.
  2. For each response:
     - Skip if no mapping exists.
     - Accumulate `correct_count` and `total_items`.
  3. Compute `performance = correct_count/total_items`.
  4. Filter where `performance < threshold` (default 0.75).
  5. Compute deviation and sort descending.
  6. Set `knowledge_gaps = gaps.length`.
- Output:
  - `{ score, percentage, theta, gaps, knowledge_gaps }` or `null`.
- Source reference:
  - `src/services/assessmentProgress.ts:computeCompetencies`
  - `src/services/assessmentProgress.ts:computeGaps`
  - `src/services/assessmentProgress.ts:generateResult`

---

## 8. Learning Mechanism and Adaptive Logic

### Trial-based progression
- Summative post-test limits failed attempts to 3:
  - `SUMMATIVE_MAX_FAILED_ATTEMPTS = 3` — `src/dashboard/pages/SummativePosttestPage.tsx`
  - `failedAttempts` increments only when `!passed` — `src/dashboard/pages/SummativePosttestPage.tsx`
  - Permanent lock when `failedAttemptsAfterSubmit >= 3` — `src/dashboard/pages/SummativePosttestPage.tsx`

### State transitions
- Stage progression is driven by `passed === true` on summative records:
  - `prelim passed` → unlock `midterm`
  - `midterm passed` → unlock `final`
  — `src/dashboard/data/learningStage.ts`

### Learning state updates (persistence events)
- Module viewing updates `ModuleProgress` docs — `src/dashboard/pages/ModuleViewerPage.tsx`
- Diagnostic and summative pages update `AssessmentProgress` docs — `src/dashboard/pages/DiagnosticPretestPage.tsx`, `src/dashboard/pages/SummativePosttestPage.tsx`
- Gap analysis unlock updates diagnostic assessment doc flags:
  - `isStudyPlanUnlocked: true` and `isFinished/isSubmitted` set — `src/dashboard/pages/GapAnalysisPage.tsx`
- Reviewer creation unlock updates diagnostic assessment doc flags:
  - `isReviewUnlocked: true` and `reviewerPreference` set — `src/dashboard/pages/PersonalizedStudyPlanPage.tsx`

### Gap detection criteria
- Gap threshold in `generateResult` is `0.75` — `src/services/assessmentProgress.ts`
- Summative question selection uses pretest performance as a gap signal and adapts difficulty/module focus during the post-test (CAT-style, capped at 30 points) — `src/dashboard/data/diagnosticQuestions.ts`, `src/dashboard/pages/SummativePosttestPage.tsx`

### Reinforcement triggers
- Reviewer prompt and review flows prioritize wrong answers first, then correct-answer reinforcement (flashcards may also include unseen questions as extra practice cards) — `src/dashboard/data/reviewerPromptBuilder.ts`, `src/dashboard/pages/FlashcardReviewPage.tsx`

---

## 9. Database Design

### Database Technology
- Firestore (Firebase) — `src/lib/firebase.ts`, `src/services/*`

### Tables / Collections (COMPLETE LIST FOUND IN CODE)

Note: Firestore is document-oriented; “tables” below represent collections/subcollections referenced by the code.

| Table (Collection Path) | Field | Type | Description | Source |
|---|---|---|---|---|
| `userProfiles/{uid}` | `uid` | string | User UID | `src/services/userProfiles.ts` |
| `userProfiles/{uid}` | `fullName` | string | User full name | `src/services/userProfiles.ts` |
| `userProfiles/{uid}` | `email` | string | User email | `src/services/userProfiles.ts` |
| `userProfiles/{uid}` | `role` | `'admin' \| 'student'` (optional) | User role for admin metrics and checks | `src/services/userProfiles.ts`, `src/services/admin.ts` |
| `userProfiles/{uid}` | `createdAt` | Firestore timestamp (TS `unknown`) | Server timestamp on initial create | `src/services/userProfiles.ts` |
| `userProfiles/{uid}` | `updatedAt` | Firestore timestamp (TS `unknown`) | Server timestamp on upsert | `src/services/userProfiles.ts` |
| `userProfiles/{uid}/ModuleProgress/{moduleId}` | `uid` | string | User UID | `src/services/moduleProgress.ts` |
| `userProfiles/{uid}/ModuleProgress/{moduleId}` | `moduleId` | number | Module identifier | `src/services/moduleProgress.ts` |
| `userProfiles/{uid}/ModuleProgress/{moduleId}` | `videoProgress` | number | Video progress metric (0..100 as used by UI) | `src/dashboard/pages/ModuleViewerPage.tsx`, `src/services/moduleProgress.ts` |
| `userProfiles/{uid}/ModuleProgress/{moduleId}` | `scrollProgress` | number | Scroll progress metric (0..100 as used by UI) | `src/dashboard/pages/ModuleViewerPage.tsx`, `src/services/moduleProgress.ts` |
| `userProfiles/{uid}/ModuleProgress/{moduleId}` | `overallProgress` | number | Weighted overall progress | `src/dashboard/pages/ModuleViewerPage.tsx`, `src/services/moduleProgress.ts` |
| `userProfiles/{uid}/ModuleProgress/{moduleId}` | `isCompleted` | boolean | Completion flag | `src/services/moduleProgress.ts` |
| `userProfiles/{uid}/ModuleProgress/{moduleId}` | `updatedAt` | Firestore timestamp (TS `unknown`) | Server timestamp | `src/services/moduleProgress.ts` |
| `userProfiles/{uid}/AssessmentProgress/{assessmentKey}` | `uid` | string | User UID | `src/services/assessmentProgress.ts` |
| `userProfiles/{uid}/AssessmentProgress/{assessmentKey}` | `assessmentKey` | string | Diagnostic/summative key | `src/dashboard/data/learningStage.ts`, `src/services/assessmentProgress.ts` |
| `userProfiles/{uid}/AssessmentProgress/{assessmentKey}` | `score` | number | Correct count | `src/services/assessmentProgress.ts` |
| `userProfiles/{uid}/AssessmentProgress/{assessmentKey}` | `totalItems` | number | Total items | `src/services/assessmentProgress.ts` |
| `userProfiles/{uid}/AssessmentProgress/{assessmentKey}` | `percentage` | number | Percentage score | `src/services/assessmentProgress.ts` |
| `userProfiles/{uid}/AssessmentProgress/{assessmentKey}` | `passed` | boolean | Pass/fail | `src/services/assessmentProgress.ts` |
| `userProfiles/{uid}/AssessmentProgress/{assessmentKey}` | `aiReviewerOutput` | string (optional) | Inline reviewer output | `src/services/assessmentProgress.ts` |
| `userProfiles/{uid}/AssessmentProgress/{assessmentKey}` | `aiReviewerAudioUrl` | string (optional) | NOT SPECIFIED IN SYSTEM (declared field; not set by current code) | `src/services/assessmentProgress.ts` |
| `userProfiles/{uid}/AssessmentProgress/{assessmentKey}` | `reviewerNarrationStorage` | `'inline' \| 'chunks'` (optional) | Storage mode | `src/services/assessmentProgress.ts` |
| `userProfiles/{uid}/AssessmentProgress/{assessmentKey}` | `reviewerNarrationChunkCount` | number (optional) | Chunk count | `src/services/assessmentProgress.ts` |
| `userProfiles/{uid}/AssessmentProgress/{assessmentKey}` | `isStudyPlanUnlocked` | boolean (optional) | Study plan unlock | `src/services/assessmentProgress.ts`, `src/dashboard/pages/GapAnalysisPage.tsx` |
| `userProfiles/{uid}/AssessmentProgress/{assessmentKey}` | `isReviewUnlocked` | boolean (optional) | Review unlock | `src/services/assessmentProgress.ts`, `src/dashboard/pages/PersonalizedStudyPlanPage.tsx` |
| `userProfiles/{uid}/AssessmentProgress/{assessmentKey}` | `reviewerPreference` | union string (optional) | Reviewer format key | `src/services/assessmentProgress.ts` |
| `userProfiles/{uid}/AssessmentProgress/{assessmentKey}` | `competencyBreakdown` | `AssessmentCompetencyBreakdown` (optional) | Per-competency counts/percentages | `src/services/assessmentProgress.ts` |
| `userProfiles/{uid}/AssessmentProgress/{assessmentKey}` | `questionIds` | number[] (optional) | Questions used in attempt | `src/services/assessmentProgress.ts` |
| `userProfiles/{uid}/AssessmentProgress/{assessmentKey}` | `selectedAnswers` | `Record<string, number>` (optional) | Stored answers by question id string | `src/services/assessmentProgress.ts` |
| `userProfiles/{uid}/AssessmentProgress/{assessmentKey}` | `currentQuestionIndex` | number (optional) | Persisted navigation index | `src/services/assessmentProgress.ts` |
| `userProfiles/{uid}/AssessmentProgress/{assessmentKey}` | `isSubmitted` | boolean (optional) | Submit flag | `src/services/assessmentProgress.ts` |
| `userProfiles/{uid}/AssessmentProgress/{assessmentKey}` | `isFinished` | boolean (optional) | Finished flag | `src/services/assessmentProgress.ts` |
| `userProfiles/{uid}/AssessmentProgress/{assessmentKey}` | `failedAttempts` | number (optional) | Summative failed attempt count | `src/services/assessmentProgress.ts`, `src/dashboard/pages/SummativePosttestPage.tsx` |
| `userProfiles/{uid}/AssessmentProgress/{assessmentKey}` | `isLocked` | boolean (optional) | Summative lock | `src/services/assessmentProgress.ts`, `src/dashboard/pages/SummativePosttestPage.tsx` |
| `userProfiles/{uid}/AssessmentProgress/{assessmentKey}` | `scoreHistory` | number[] (optional) | Past percentage list | `src/services/assessmentProgress.ts`, `src/dashboard/pages/SummativePosttestPage.tsx` |
| `userProfiles/{uid}/AssessmentProgress/{assessmentKey}` | `summativeAttemptDetails` | `SummativeAttemptDetail[]` (optional) | Attempt list | `src/services/assessmentProgress.ts`, `src/dashboard/pages/SummativePosttestPage.tsx` |
| `userProfiles/{uid}/AssessmentProgress/{assessmentKey}` | `updatedAt` | Firestore timestamp (TS `unknown`) | Upsert timestamp | `src/services/assessmentProgress.ts` |
| `userProfiles/{uid}/AssessmentProgress/{assessmentKey}` | `passedAt` | Firestore timestamp/null (TS `unknown`) | Set when passed | `src/services/assessmentProgress.ts` |
| `userProfiles/{uid}/AssessmentProgress/{assessmentKey}/ReviewerNarrationChunks/{chunkId}` | `index` | number | Chunk index | `src/services/assessmentProgress.ts` |
| `userProfiles/{uid}/AssessmentProgress/{assessmentKey}/ReviewerNarrationChunks/{chunkId}` | `content` | string | Chunk content | `src/services/assessmentProgress.ts` |
| `userProfiles/{uid}/AssessmentProgress/{assessmentKey}/ReviewerNarrationChunks/{chunkId}` | `updatedAt` | Firestore timestamp | Chunk updated timestamp | `src/services/assessmentProgress.ts` |

### Relationships
- `userProfiles (1) -> AssessmentProgress (many)` via subcollection under each user profile — `src/services/assessmentProgress.ts`
- `userProfiles (1) -> ModuleProgress (many)` via subcollection under each user profile — `src/services/moduleProgress.ts`
- `AssessmentProgress (1) -> ReviewerNarrationChunks (many)` when chunk mode is used — `src/services/assessmentProgress.ts`

### Constraints
- Firestore rules/constraints are NOT SPECIFIED IN SYSTEM (no rules included in this repo).

### ERD (TEXT FORMAT REQUIRED)

```
userProfiles (collection)
  |
  |-- userProfiles/{uid} (document)
        |
        |-- ModuleProgress (subcollection)
        |     |-- ModuleProgress/{moduleId} (document)
        |
        |-- AssessmentProgress (subcollection)
              |-- AssessmentProgress/{assessmentKey} (document)
                    |
                    |-- ReviewerNarrationChunks (subcollection; optional)
                          |-- ReviewerNarrationChunks/chunk-#### (document)
```

---

## 10. API Documentation

### Endpoint: `/api/openai/chat`
- Method: `POST`
- Description: Chat proxy used by the SPA to generate reviewer content (dev/preview server middleware).
- Parameters: NOT SPECIFIED IN SYSTEM (no query parameters are used by client code).
- Request Body:
  - JSON object with:
    - `model?: string`
    - `messages: { role?: string, content?: string }[]`
- Response:
  - On success: `{ "content": string }` — `vite.config.ts`
  - On error: `{ "error": { "message": string } }` — `vite.config.ts`
- Backend Processing Logic:
  1. Ensure method is POST.
  2. Parse request JSON.
  3. Require `OPENAI_API_KEY`/`VITE_OPENAI_API_KEY`.
  4. Forward to `https://api.openai.com/v1/chat/completions`.
  5. Extract `choices[0].message.content`.
- Source reference:
  - `vite.config.ts:createMockOpenAIPlugin`
  - Client usage: `src/services/openai.ts:sendOpenAIChat`

### Other HTTP endpoints
- NOT SPECIFIED IN SYSTEM (no other `fetch(...)` usage exists in the repository beyond `src/services/openai.ts`).

---

## 11. User Interface and Interaction Flow

### Route Map (as implemented)

Student/Auth:
- `/auth/login` — `src/auth/LoginPage.tsx`
- `/auth/signin` — `src/auth/SigninPage.tsx`

Admin:
- `/admin/login` — `src/admin/pages/AdminLoginPage.tsx`
- `/admin` — `src/admin/pages/AdminDashboardPage.tsx` (guarded by `AdminRoute`)

Dashboard (guarded by Firebase Auth state):
- `/dashboard` — `src/dashboard/pages/DashboardPage.tsx`
- `/dashboard/courses` — `src/dashboard/pages/CoursesPage.tsx`
- `/dashboard/profile` — `src/dashboard/pages/ProfilePage.tsx`
- `/dashboard/modules` — `src/dashboard/pages/ModulesPage.tsx`
- `/dashboard/modules/viewer` — `src/dashboard/pages/ModuleViewerPage.tsx`
- `/dashboard/prelim` — `src/dashboard/pages/DiagnosticPretestPage.tsx`
- `/dashboard/gap-analysis` — `src/dashboard/pages/GapAnalysisPage.tsx`
- `/dashboard/personalized-study-plan` — `src/dashboard/pages/PersonalizedStudyPlanPage.tsx` (gated by `ReviewerRouteGate`)
- `/dashboard/review` — `src/dashboard/pages/ReviewLandingPage.tsx` (redirects to format route)
- `/dashboard/review/flashcards` — `src/dashboard/pages/FlashcardReviewPage.tsx`
- `/dashboard/review/audiobook` — `src/dashboard/pages/AudiobookReviewPage.tsx`
- `/dashboard/review/cheatsheet` — `src/dashboard/pages/CheatsheetReviewPage.tsx`
- `/dashboard/summative-posttest` — `src/dashboard/pages/SummativePosttestPage.tsx` (gated by `StageFlowGate`)
- `/dashboard/post-test-gap-analysis` — `src/dashboard/pages/PostTestGapAnalysisPage.tsx`
- `/dashboard/learning-results` — `src/dashboard/pages/LearningResultsPage.tsx` (gated by `StageFlowGate`)
- `/dashboard/certification` — `src/dashboard/pages/CertificationPage.tsx` (gated by `StageFlowGate`)

Source reference: `src/routes/AppRoutes.tsx`, `src/routes/paths.ts`

### Step-by-step user journey (student)
1. Sign in or sign up — `src/auth/LoginPage.tsx`, `src/auth/SigninPage.tsx`
2. Dashboard loads user profile, module progress, and assessment records — `src/dashboard/pages/DashboardPage.tsx`
3. Modules:
   - Student views modules and enters viewer — `src/dashboard/pages/ModulesPage.tsx`
   - Viewer persists progress — `src/dashboard/pages/ModuleViewerPage.tsx`
4. Diagnostic pre-test becomes available when stage modules are complete — `src/dashboard/Sidebar.tsx`, `src/dashboard/data/learningStage.ts`
5. Gap Analysis unlocks after diagnostic submission — `src/dashboard/pages/GapAnalysisPage.tsx`
6. Personalized Study Plan unlocks after gap analysis “Analyze Concepts” action sets `isStudyPlanUnlocked` — `src/dashboard/pages/GapAnalysisPage.tsx`
7. Review unlocks after reviewer generation sets `isReviewUnlocked` — `src/dashboard/pages/PersonalizedStudyPlanPage.tsx`
8. Summative post-test unlocks after review unlock — `src/routes/AppRoutes.tsx:StageFlowGate`
9. Learning Results unlocks after summative submission — `src/routes/AppRoutes.tsx:StageFlowGate`
10. Certification unlocks after final stage summative submission — `src/routes/AppRoutes.tsx:StageFlowGate`

---

## 12. End-to-End System Workflow

### Full pipeline: INPUT → PROCESSING → OUTPUT

#### 12.1 Pretest (Diagnostic)
- Input:
  - Stage question pool and user-selected answers — `src/dashboard/data/diagnosticQuestions.ts`, `src/dashboard/pages/DiagnosticPretestPage.tsx`
- Processing:
  - Local scoring and competency breakdown.
  - Periodic persistence into Firestore `AssessmentProgress`.
- Output:
  - Diagnostic record available for dashboard analytics, gap analysis, and reviewer generation.

#### 12.2 Diagnosis (Gap Analysis)
- Input:
  - Diagnostic record and derived `responses/mapping` (from active questions) — `src/dashboard/pages/GapAnalysisPage.tsx`
- Processing:
  - Compute `result = generateResult(correct, total, responses, mapping)` — `src/services/assessmentProgress.ts`
- Output:
  - `percentage` and `knowledge_gaps` displayed in UI (theta computed but not displayed) — `src/dashboard/pages/GapAnalysisPage.tsx`

#### 12.3 Recommendation (Reviewer / Study Plan)
- Input:
  - Assessment record (diagnostic or summative), question pools, reviewer preference — `src/dashboard/pages/PersonalizedStudyPlanPage.tsx`
- Processing:
  - Prompt build and OpenAI call (or fallback) — `src/dashboard/data/reviewerPromptBuilder.ts`, `src/services/openai.ts`, `vite.config.ts`
  - Persist `isStudyPlanUnlocked`, `isReviewUnlocked`, preference, and narration script — `src/services/assessmentProgress.ts`
- Output:
  - Review routes unlocked and reviewer content available.

#### 12.4 Reinforcement (Review)
- Input:
  - Reviewer preference and stored reviewer output; diagnostic question pool and saved answers for flashcards — `src/dashboard/pages/*ReviewPage.tsx`
- Processing:
  - Flashcards: show wrong/correct stats, include unseen as extra practice cards, grouped into module decks.
  - Audiobook: parse script blocks to chapters and speak via SpeechSynthesis.
  - Cheatsheet: parse and export via html2canvas/jsPDF.
- Output:
  - Interactive review experience and optional exported artifacts.

#### 12.5 Posttest (Summative)
- Input:
  - CAT-style adaptive question sequence derived from pretest performance signals (point-capped at 30) — `src/dashboard/data/diagnosticQuestions.ts`, `src/dashboard/pages/SummativePosttestPage.tsx`
- Processing:
  - Attempt scoring, pass/fail check, attempt history updates, lock logic.
- Output:
  - Summative record used for results and stage unlocking — `src/dashboard/data/learningStage.ts`

---

## 13. Validation and Constraints (FOR CHAPTER 5)

### Input validation rules (UI-level)
- Login requires both email and password — `src/auth/LoginPage.tsx`
- Password reset requires email — `src/auth/LoginPage.tsx`
- Sign-up requires all fields, password length >= 6, and password confirmation match — `src/auth/SigninPage.tsx`

### Logical validation (assessment rules)
- Diagnostic submit is guarded by `allAnswered` — `src/dashboard/pages/DiagnosticPretestPage.tsx`
- Summative submit is guarded by:
  - `uid` exists
  - `allAnswered`
  - `!isSubmitting`
  - `!isPermanentlyLocked`
  — `src/dashboard/pages/SummativePosttestPage.tsx`

### Thresholds (explicit)
- Diagnostic passing percentage: `DIAGNOSTIC_PASSING_PERCENTAGE = 70` — `src/dashboard/pages/DiagnosticPretestPage.tsx`
- Gap analysis “qualified” threshold: `GAP_ANALYSIS_PASSING_PERCENTAGE = 75` — `src/dashboard/pages/GapAnalysisPage.tsx`
- Summative passing percentage: `SUMMATIVE_PASSING_PERCENTAGE = 75` — `src/dashboard/pages/SummativePosttestPage.tsx`
- Gap ranking threshold (performance): `0.75` — `src/services/assessmentProgress.ts:computeGaps`

### Constraint enforcement
- Max summative failed attempts: `SUMMATIVE_MAX_FAILED_ATTEMPTS = 3` — `src/dashboard/pages/SummativePosttestPage.tsx`
- Permanent lock after max failures:
  - Stored in `isLocked` and enforced in UI render — `src/dashboard/pages/SummativePosttestPage.tsx`

### Error handling behavior
- Auth errors surfaced using FirebaseError messages — `src/auth/LoginPage.tsx`, `src/auth/SigninPage.tsx`
- Reviewer generation falls back when AI call fails or yields empty output — `src/dashboard/pages/PersonalizedStudyPlanPage.tsx`
- Admin UI shows action messages and error messages on failures — `src/admin/pages/AdminDashboardPage.tsx`

---

## 14. Performance and Optimization

### Debounced persistence to Firestore
- Module viewer progress upsert after 350ms — `src/dashboard/pages/ModuleViewerPage.tsx`
- Diagnostic progress upsert after 300ms — `src/dashboard/pages/DiagnosticPretestPage.tsx`
- Summative progress upsert after 300ms — `src/dashboard/pages/SummativePosttestPage.tsx`

### Memoization of derived data
- Extensive use of `useMemo` for charts, derived lists, and computed metrics — examples:
  - `src/dashboard/pages/DashboardPage.tsx`
  - `src/dashboard/pages/GapAnalysisPage.tsx`
  - `src/dashboard/pages/PostTestGapAnalysisPage.tsx`

### Script storage optimization
- Inline vs chunked narration storage reduces large document risk — `src/services/assessmentProgress.ts`

---

## 15. Security Considerations

### Authentication
- Student authentication uses Firebase Auth — `src/lib/firebase.ts`, `src/services/auth.ts`
- Dashboard routes require authenticated `user` — `src/routes/AppRoutes.tsx`

### Authorization
- Admin route gating uses localStorage-based session flag — `src/services/adminAuth.ts`, `src/admin/components/AdminRoute.tsx`
- Firestore permission enforcement is NOT SPECIFIED IN SYSTEM (no Firebase security rules are present in this repository).

### Data protection
- Firebase configuration is loaded from Vite environment variables — `src/lib/firebase.ts`, `.env`
- OpenAI API key is sourced by the Vite proxy from `OPENAI_API_KEY` or `VITE_OPENAI_API_KEY` — `vite.config.ts`
- Reviewer outputs and assessment answers are persisted to Firestore — `src/services/assessmentProgress.ts`

### Known security risks (derived from implementation)
- Admin credentials defaults:
  - `VITE_ADMIN_USERNAME ?? 'admin'`
  - `VITE_ADMIN_PASSWORD ?? 'admin123'`
  — `src/services/adminAuth.ts`
- Admin session is stored in localStorage under key `pls_admin_session` — `src/services/adminAuth.ts`
- `.env` contains a `VITE_OPENAI_API_KEY` value (Vite `VITE_` variables are exposed to client builds by design). Evidence:
  - `.env` defines the variable
  - `src/vite-env.d.ts` declares `VITE_OPENAI_API_KEY?: string`
  - `vite.config.ts` reads `env.VITE_OPENAI_API_KEY`

---

## 16. Deployment and Environment Setup

### Installation steps
- NOT SPECIFIED IN SYSTEM as a full deployment guide.
- Available npm scripts — `package.json`:
  - `dev`: `vite`
  - `build`: `tsc && vite build`
  - `preview`: `vite preview`

### Dependencies
- Node/npm dependency graph defined in `package.json` and locked by `package-lock.json`.

### Environment variables (names referenced by code)

Firebase (`src/lib/firebase.ts`):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

OpenAI proxy + client (`vite.config.ts`, `src/services/openai.ts`):
- `OPENAI_API_KEY` (proxy key source)
- `VITE_OPENAI_API_KEY` (proxy key source; also declared for client env)
- `VITE_OPENAI_API_BASE_URL` (client base URL, default `/api/openai`)
- `VITE_OPENAI_DEFAULT_MODEL` (client model default, default `gpt-4.1-mini`)

Admin credentials (`src/services/adminAuth.ts`):
- `VITE_ADMIN_USERNAME`
- `VITE_ADMIN_PASSWORD`

Additional env keys declared in TypeScript types (usage not shown in OpenAI wrapper):
- `VITE_AI_PROVIDER`, `VITE_GOOGLE_AI_API_KEY`, `VITE_GOOGLE_AI_BASE_URL`, `VITE_GOOGLE_AI_DEFAULT_MODEL` — `src/vite-env.d.ts`

### How to run the system
- Development: `npm run dev` — `package.json`
- Build: `npm run build` — `package.json`
- Preview: `npm run preview` — `package.json`

---

## 17. Logging, Monitoring, and Debugging

### Logs generated
- NOT SPECIFIED IN SYSTEM (no dedicated logging subsystem is present in the codebase).

### Monitoring
- NOT SPECIFIED IN SYSTEM (no monitoring/telemetry service integration is present beyond optional Firebase Analytics initialization).

### Debugging mechanisms
- UI error messages are maintained in component state and rendered:
  - Auth errors — `src/auth/LoginPage.tsx`, `src/auth/SigninPage.tsx`
  - Reviewer generation fallback notice — `src/dashboard/pages/PersonalizedStudyPlanPage.tsx`
  - Admin action/error messages — `src/admin/pages/AdminDashboardPage.tsx`

### System traceability
- Firestore timestamps written using `serverTimestamp()`:
  - Assessment progress `updatedAt`, `passedAt` — `src/services/assessmentProgress.ts`
  - Module progress `updatedAt` — `src/services/moduleProgress.ts`

---

## 18. Known Issues and Limitations

The items below are based on concrete implementation details in the repository:

- Profile page contains hardcoded display fields:
  - `memberSince` is set to `'APRIL 2, 2026'`
  - `studentNumber` is set to `'—'` (appears as mojibake in source file)
  — `src/dashboard/pages/ProfilePage.tsx`
- Courses page has static course tiles; only one is visually “Enrolled”, others are locked in UI — `src/dashboard/pages/CoursesPage.tsx`
- Text encoding artifacts (mojibake) appear in multiple files:
  - Multiplication sign shown as `Ã—` in a diagnostic option — `src/dashboard/data/diagnosticQuestions.ts`
  - Bullet/decoration characters appear as `â€¢` / `âœ¦` in UI text processing and certificate UI — `src/dashboard/pages/CheatsheetReviewPage.tsx`, `src/dashboard/pages/CertificationPage.tsx`
- Competency code sets differ between learning content and diagnostic question banks:
  - Modules catalog uses codes such as `CACHE`, `ARCH`, `PERF` — `src/dashboard/data/modulesCatalog.ts`
  - Diagnostic pools use codes such as `CM`, `AF`, `PA` — `src/dashboard/data/diagnosticQuestions.ts`
- Theta computation differs across pages:
  - Dashboard uses a linear transform of percentage for theta-like display — `src/dashboard/pages/DashboardPage.tsx`
  - Gap Analysis uses `generateResult` theta (logit), but the theta UI is removed from gap analysis pages — `src/services/assessmentProgress.ts`, `src/dashboard/pages/GapAnalysisPage.tsx`, `src/dashboard/pages/PostTestGapAnalysisPage.tsx`

---

## 19. Traceability Matrix (MANDATORY)

| Feature | Module | Algorithm | Database | API |
|---|---|---|---|---|
| Sign-up / Sign-in | `src/auth/*`, `src/services/auth.ts` | Form validation + Firebase Auth operations | `userProfiles/{uid}` created/upserted | Firebase Auth (SDK) |
| User profile persistence | `src/services/userProfiles.ts`, `src/dashboard/pages/ProfilePage.tsx` | Upsert merge with `serverTimestamp()` | `userProfiles/{uid}` | Firestore (SDK) |
| Module viewing + progress | `src/dashboard/pages/ModuleViewerPage.tsx`, `src/services/moduleProgress.ts` | Weighted overall progress + debounce | `userProfiles/{uid}/ModuleProgress/{moduleId}` | Firestore (SDK) |
| Stage gating | `src/dashboard/data/learningStage.ts`, `src/routes/AppRoutes.tsx` | Resolve stage + gate redirects | Assessment progress records by key | Firestore (SDK) |
| Diagnostic pre-test | `src/dashboard/pages/DiagnosticPretestPage.tsx`, `src/dashboard/data/diagnosticQuestions.ts` | CAT-style adaptive selection (point-capped) + weight-based scoring | `AssessmentProgress/{diagnosticKey}` | Firestore (SDK) |
| Gap analysis metrics | `src/dashboard/pages/GapAnalysisPage.tsx`, `src/services/assessmentProgress.ts` | `generateResult` (gaps; theta computed) | Reads diagnostic record; uses derived mapping | Firestore (SDK) |
| Reviewer generation | `src/dashboard/pages/PersonalizedStudyPlanPage.tsx`, `src/dashboard/data/reviewerPromptBuilder.ts` | Prompt build + AI call + fallback + script chunking | `AssessmentProgress` + optional `ReviewerNarrationChunks` | `/api/openai/chat` (POST) |
| Review modes | `src/dashboard/pages/*ReviewPage.tsx` | Wrong/correct prioritization (unseen as flashcard-only practice); chapter parsing; Q/A parsing | Reviewer script loaded from Firestore | Firestore (SDK) |
| Summative post-test | `src/dashboard/pages/SummativePosttestPage.tsx`, `src/dashboard/data/diagnosticQuestions.ts` | CAT-style adaptive selection (point-capped) + attempt lock | `AssessmentProgress/{summativeKey}` | Firestore (SDK) |
| Learning results | `src/dashboard/pages/LearningResultsPage.tsx` | Improvement computation (`post - pre`) | Reads diagnostic + summative records | Firestore (SDK) |
| Certification | `src/dashboard/pages/CertificationPage.tsx` | Render + html2canvas + jsPDF export | Reads final summative + module progress | Firestore (SDK) |
| Admin console | `src/admin/pages/AdminDashboardPage.tsx`, `src/services/admin.ts` | CollectionGroup metrics + reset/delete | `userProfiles`, `AssessmentProgress`, `ModuleProgress` | Firestore (SDK) |

---

## 20. Appendix

### A. File hierarchy (major paths)

```
/
  vite.config.ts
  package.json
  .env
  tailwind.config.ts
  postcss.config.js
  tsconfig.json
  /public
    /videos
  /src
    main.tsx
    App.tsx
    vite-env.d.ts
    /routes
      AppRoutes.tsx
      paths.ts
    /contexts
      BrightnessContext.tsx
      GradingStageContext.tsx
    /lib
      firebase.ts
    /services
      auth.ts
      userProfiles.ts
      moduleProgress.ts
      assessmentProgress.ts
      openai.ts
      adminAuth.ts
      admin.ts
    /auth
      LoginPage.tsx
      SigninPage.tsx
      ThemeToggle.tsx
    /dashboard
      DashboardLayout.tsx
      Sidebar.tsx
      TopBar.tsx
      /data
        learningStage.ts
        diagnosticQuestions.ts
        modulesCatalog.ts
        reviewerPromptBuilder.ts
      /pages
        DashboardPage.tsx
        CoursesPage.tsx
        ModulesPage.tsx
        ModuleViewerPage.tsx
        DiagnosticPretestPage.tsx
        GapAnalysisPage.tsx
        PersonalizedStudyPlanPage.tsx
        ReviewLandingPage.tsx
        FlashcardReviewPage.tsx
        AudiobookReviewPage.tsx
        CheatsheetReviewPage.tsx
        SummativePosttestPage.tsx
        PostTestGapAnalysisPage.tsx
        LearningResultsPage.tsx
        CertificationPage.tsx
        ProfilePage.tsx
    /admin
      /components
        AdminRoute.tsx
      /pages
        AdminLoginPage.tsx
        AdminDashboardPage.tsx
```

### B. Final validation checklist (as required)

- ✔ No missing sections (1–20 present)
- ✔ “NOT SPECIFIED IN SYSTEM” used where the repository does not define required details
- ✔ Features mapped to actual modules, logic, and data structures
- ✔ Deep technical explanations present (algorithms, data flows, persistence, gates)
- ✔ Supports Chapter 3 (design/architecture), Chapter 4 (algorithms/implementation), and Chapter 5 (validation/constraints)
