# Personalized Learning System (PLS-pro) - Complete Documentation

## 🎓 System Overview

This is an **AI-powered adaptive learning platform** that personalizes education through diagnostic assessments, gap analysis, and customized review materials. It's designed for learners to progress through structured modules with real-time feedback.

---

## 📊 Core Architecture

### Tech Stack:
- **Frontend:** React + TypeScript + Tailwind CSS + Vite
- **Backend/Database:** Firebase (Authentication, Firestore)
- **AI:** OpenAI API (generates personalized review content)
- **Animation:** Framer Motion
- **Routing:** React Router v7

### Key Libraries:
- `lucide-react` - Icons
- `recharts` - Analytics charts
- `html2canvas` + `jsPDF` - Certificate export
- `@xyflow/react` - Flow diagrams

---

## 👥 User Roles

### 1. Learners (Main Users)
- Take diagnostic assessments (pretests)
- Complete course modules
- Perform gap analysis
- Generate personalized reviewers
- Review materials in preferred format
- Complete summative posttests
- View learning results/analytics
- Earn certificates

### 2. Admins
- View all learner accounts
- Monitor progress across accounts
- Access learner details (scores, grading stage, status)
- Static login (no Firestore dependency)

---

## 🎯 The Learning Pipeline (3-Stage System)

The system divides learning into **3 grading stages**: Prelim, Midterm, Final

### Each Stage Follows This Flow:

```
1. COURSE MODULES
   └─ Learner watches educational videos
      └─ Progress tracked (% complete)

2. DIAGNOSTIC PRE-TEST (Unlocked after modules)
   └─ Questions organized by competency
   └─ Assesses knowledge gaps
   └─ Results scored & competency-mapped
      ↓ Pass threshold: 75%

3. GAP ANALYSIS (Unlocked if pretest passed)
   └─ AI analyzes wrong/unseen/correct answers
   └─ Prioritizes learning areas
      ↓ User clicks "Analyze Concepts"

4. PERSONALIZED STUDY PLAN (Unlocked after analysis)
   └─ Choose reviewer format:
      • Flashcards (Q&A cards)
      • Audiobook (narrated script)
      • Cheatsheet PDF (compact notes)
      • Cheatsheet Image (visual notes)
   └─ AI generates reviewer based on gaps
      ↓ ~6 second initialization (fast 0-70%, slow 70-100%)

5. REVIEW PAGE (Format-specific)
   └─ Study with chosen format
   └─ Reviewer unlocked for use
      ↓ User ready

6. SUMMATIVE POST-TEST (Unlocked after review)
   └─ Final assessment on learned material
   └─ Pass requirement: 75%
      ↓ Pass = Unlock next stage

7. LEARNING RESULTS (Unlocked after passing posttest)
   └─ View scores, competency breakdown
   └─ Analytics & performance charts
      ↓ If Final stage passed

8. CERTIFICATION (Only after Final stage complete)
   └─ Beautiful certificate display
   └─ Shows completed modules, hours, completion date
   └─ Print & Download as PDF
```

---

## 🔑 Key Features

### 1. Adaptive Assessment
- **Diagnostic Questions:** Categorized by competency code & Bloom level
- **Competency Breakdown:** Shows which topics need work
- **Scoring:** Percentage-based with right/wrong tracking
- **Progress Tracking:** Knows which modules completed, which questions seen

### 2. AI-Powered Reviewer Generation
- **Analyzes** wrong answers → top priority
- **Analyzes** unseen questions → secondary priority  
- **Analyzes** correct answers → reinforcement
- **Generates** format-specific content via OpenAI
- **Fallback:** Works even if AI service is down

### 3. Personalized Content Formats
- **Flashcards:** Quick Q&A drills (instant, no AI needed)
- **Audiobook:** Full narrated script for listening
- **Cheatsheet PDF:** Compact notes optimized for printing
- **Cheatsheet Image:** Single-screen visual summarization

### 4. Theme System
- **Bright Mode:** Light background (cyan/white/blue)
- **Dark Mode:** Dark background (slate/blue gradients)
- **Context-based:** Automatically applied across all pages

### 5. Grading Stage Context
- Learners select which stage they're viewing (Prelim/Midterm/Final)
- Unlocking rules: Must pass previous stage to unlock next
- Sidebar shows stage-specific content

### 6. Authentication
- **Learners:** Firebase Email/Password auth
- **Admins:** Static username/password (hardcoded, no Firestore)
- **Route Guards:** Redirect users by role & progression

### 7. Progress Persistence
- All data saved to Firestore:
  - Assessment scores & answers
  - Module progress (% watched)
  - Reviewer preferences & output
  - Grading stage & unlock states
  - User profile (name, email)

### 8. Certification
- Unlocked only after **final stage completion**
- Shows: learner name, modules completed, score, hours studied, completion date
- Certificate ID generated from user ID + year
- Print button (browser print)
- Download as PDF

---

## 🗂️ Project Structure

```
src/
├── auth/                    # Login/signin pages + theme toggle
├── admin/                   # Admin dashboard & login
├── dashboard/
│   ├── pages/              # All major learner pages
│   │   ├── CoursesPage     # Module catalog
│   │   ├── DashboardPage   # Home/overview
│   │   ├── DiagnosticPretestPage
│   │   ├── GapAnalysisPage
│   │   ├── PersonalizedStudyPlanPage  # Reviewer maker
│   │   ├── ReviewPage (Flashcards, Audiobook, Cheatsheet)
│   │   ├── SummativePosttestPage
│   │   ├── LearningResultsPage
│   │   ├── CertificationPage
│   │   └── ModuleViewerPage
│   ├── data/               # Static data & builders
│   │   ├── modulesCatalog  # 9 modules (Memory, CPU, Pipelining, etc)
│   │   ├── diagnosticQuestions
│   │   ├── learningStage   # Stage config & unlock logic
│   │   └── reviewerPromptBuilder
│   ├── Sidebar             # Navigation with unlock states
│   └── TopBar              # User profile, settings
├── services/               # Firebase & API calls
│   ├── assessmentProgress  # Firestore CRUD
│   ├── moduleProgress
│   ├── userProfiles
│   ├── auth                # Firebase auth helpers
│   └── openai              # Chat API calls
├── contexts/
│   ├── BrightnessContext   # Dark/Light mode
│   └── GradingStageContext # Selected stage state
├── routes/
│   ├── AppRoutes           # Route configuration + guards
│   └── paths               # Route constants
└── lib/
    └── firebase            # Firebase config
```

---

## 🔄 Data Flow Example: User Taking Pretest

```
1. User clicks "Diagnostic Pre-test" in sidebar (if unlocked)
   
2. DiagnosticPretestPage loads via AppRoutes
   
3. Page fetches from Firestore:
   - getUserAssessmentProgress() → assessment record
   - getDiagnosticQuestionsByIdsForStage() → questions from catalog
   
4. Questions displayed with options
   
5. User selects answers → stored in component state
   
6. User clicks "Submit"
   
7. Calculate:
   - Score (# correct / total)
   - Percentage 
   - Competency breakdown
   - Pass/Fail (75% threshold)
   
8. Save to Firestore via upsertAssessmentProgress()
   - questions answered
   - selected answers
   - score, percentage, passed status
   - unlock isGapAnalysisUnlocked = true
   
9. Sidebar refresh → Gap Analysis now shows UNLOCKED
   
10. Redirect to results summary page
```

---

## 🚀 Reviewer Generation Flow (Real-Time)

```
USER CLICKS "CREATE REVIEWER"
   ↓
[INITIALIZATION ANIMATION - 6 seconds]
   Step 1: Reading diagnostic result set (0-30% in 1s)
   Step 2: Based users learning performance (30-50% in 1s)
   Step 3: Building reviewer payload (50-70% in 2.1s) ← FAST PHASE ENDS
   Step 4: Finalizing reviewer output (70-100% in 3.9s) ← SLOW PHASE
   ↓
IF FORMAT = FLASHCARDS:
   Output = 'FLASHCARD_READY'
   (Flashcards already exist from diagnostic answers)
   ↓
ELSE (Audiobook/Cheatsheet):
   Build prompt with:
   - User's wrong answers (high priority)
   - Unseen questions (medium priority)
   - Correct answers (low priority)
   - Competency breakdown
   ↓
   Send to OpenAI:
   "You are a [format] educator. Generate [format] content
    targeting these learning gaps..."
   ↓
   Receive AI-generated script/notes
   ↓
   Save to Firestore:
   - aiReviewerOutput (text content)
   - reviewerNarrationStorage (audio metadata if applicable)
   ↓
SHOW: "Your Reviewer is Ready"
   Button: "Go to Review"
   ↓
USER CLICKS → Navigate to review page
   Route guard includes reviewerJustCreated flag
   Bypasses Firebase check (data still syncing)
   ↓
REVIEW PAGE LOADED
   Fetch reviewer content from Firestore
   Display in chosen format
```

---

## 🔐 Route Guards & Access Control

### ReviewerRouteGate
- Checks: Did learner complete diagnostic + create reviewer?
- Blocks review page access without reviewer
- **Post-creation exception:** `reviewerJustCreated=true` flag allows immediate access

### StageFlowGate
- Checks: Is learner at right progression level?
- For **Summative Test:** Previous diagnostic must be unlocked
- For **Results:** Posttest must be submitted & finished
- For **Certification:** Final stage posttest must be passed

### AdminRoute
- Checks: Is user logged into admin (static auth)?
- Blocks admin dashboard from regular learners

---

## 📈 Analytics & Results

**LearningResultsPage shows:**
- Final score & percentage
- Competency breakdown (competency → score map)
- Charts (Recharts):
  - Score distribution across competencies
  - Performance trend
  - Module completion status
- Pass/Retake indicator

---

## 🏆 Certification System

### Unlocked when:
- Final stage posttest is submitted AND finished
- Passed threshold (75%)

### Certificate Display shows:
- Learner name (from profile)
- All completed modules (from module progress)
- Total learning hours (# modules × 15 hours)
- Completion date
- Certificate ID (generated: `PLS-YEAR-USER_ID`)
- "For Internal Use Only" disclaimer

### Actions:
- Print button (browser print)
- Download button (exports as PDF via html2canvas + jsPDF)

---

## 🎮 Recent Implementation Work

### PersonalizedStudyPlanPage Updates:

1. **Removed Auto-Redirect:** Previously went straight to review page after initialization
   - Now shows dedicated "Your Reviewer is Ready" confirmation screen
   - User has full control with "Go to Review" button

2. **Realistic Progress Animation:**
   - Fast phase: 0→70% in ~2.1 seconds
   - Slow phase: 70→100% in ~3.9 seconds
   - Total: ~6 seconds
   - Feels authentic and indicates processing work

3. **Route Guard Bypass System:**
   - When clicking "Go to Review", navigation includes `reviewerJustCreated: true` flag
   - ReviewerRouteGate recognizes this flag
   - Allows immediate access without waiting for Firebase verification
   - Firebase write completes during the journey to review page (1 second buffer)

4. **Initialization Steps Display:**
   - Step 1: Reading diagnostic result set
   - Step 2: Based users learning performance  
   - Step 3: Building reviewer payload
   - Step 4: Finalizing reviewer output
   - Each step highlights as it completes

---

## 💾 Data Persistence (Firestore Structure)

```
users/{uid}/
  ├── userProfile
  │   ├── fullName
  │   ├── email
  │   └── profilePicture
  ├── ModuleProgress/{moduleId}
  │   ├── videoProgress (0-100%)
  │   ├── scrollProgress
  │   ├── overallProgress
  │   └── isCompleted
  └── AssessmentProgress/{assessmentKey}
      ├── score
      ├── percentage
      ├── passed
      ├── questionIds
      ├── selectedAnswers
      ├── aiReviewerOutput
      ├── reviewerPreference
      ├── competencyBreakdown
      ├── isStudyPlanUnlocked
      ├── isReviewUnlocked
      ├── isSubmitted
      └── isFinished
```

---

## 🎨 UI/UX Patterns

- **Motion animations** (Framer Motion) for smooth transitions
- **Gradient backgrounds** that change per theme
- **Progress indicators** for long operations
- **Status badges** (UNLOCKED, LOCKED, PASSED, RETAKE REQUIRED)
- **Conditional rendering** based on user progress state
- **Error handling** with fallback content (e.g., AI unavailable → fallback reviewer)
- **Loading states** (spinners, skeleton screens)
- **Responsive design** (mobile/tablet/desktop optimized)

---

## 🎯 Key Learning Thresholds

- **Pretest Pass:** 75% score required
- **Posttest Pass:** 75% score required
- **Stage Unlock:** Must pass previous stage to proceed
- **Certification Unlock:** Must complete & pass final stage

---

## 🔄 State Management

### Contexts Used:
1. **BrightnessContext:** Manages dark/light mode globally
2. **GradingStageContext:** Tracks selected learning stage (prelim/midterm/final)

### Component-Level State:
- Assessment/module progress
- Form inputs (answers during tests)
- UI states (loading, error, success)
- Animation progress

---

## 🌐 API Integration Points

### Firebase Services:
- `getUserAssessmentProgress()` - Fetch test scores & progress
- `getUserModuleProgress()` - Fetch video watch progress
- `getUserProfile()` - Get user info
- `upsertAssessmentProgress()` - Save test & reviewer data
- `saveReviewerNarrationScript()` - Store audio file metadata

### OpenAI Integration:
- `sendOpenAIChat()` - Generate reviewer content
- System prompt varies by format (audiobook/cheatsheet specific instructions)
- User prompt includes learning gaps + question analysis

---

## 🚦 Navigation Flow

```
Login/Signin
   ↓
Dashboard (home)
   ├─ Select Grading Stage
   │  └─ Sidebar updates based on stage selection
   │
   ├─ Courses Page
   │  └─ Browse available modules
   │
   ├─ Modules Page
   │  └─ Module Viewer
   │     └─ Watch video, track progress
   │
   ├─ Diagnostic Pre-test (if unlocked)
   │  └─ Answer questions, submit
   │
   ├─ Gap Analysis (if pretest passed)
   │  └─ View analysis, click "Analyze Concepts"
   │
   ├─ Personalized Study Plan (if analysis done)
   │  └─ Choose format → Create Reviewer → Ready screen → Go to Review
   │
   ├─ Review Pages (if reviewer created)
   │  ├─ Flashcard Review
   │  ├─ Audiobook Review
   │  └─ Cheatsheet Review
   │
   ├─ Summative Post-test (if review unlocked)
   │  └─ Final assessment
   │
   ├─ Learning Results (if posttest passed)
   │  └─ View analytics & scores
   │
   └─ Certification (if final stage passed)
      └─ View certificate, print, download PDF
```

---

## 🔧 Technical Considerations

### Performance Optimizations:
- Lazy loading of pages
- Memoized computations (useMemo for question filtering)
- Efficient Firebase queries (indexed by uid + assessmentKey)
- Response caching where appropriate

### Error Handling:
- AI service down → Use fallback reviewer
- Firebase offline → Graceful error message
- Missing data → Show "not yet unlocked" state
- Invalid routes → Redirect to login

### Security:
- Route guards prevent unauthorized access
- Firebase Rules enforce user isolation (uid-based)
- Admin auth is static (no cross-script vulnerabilities)

---

## 📱 Responsive Design

- Mobile-first approach with Tailwind
- Hamburger navigation on mobile
- Sidebar collapse on smaller screens
- Touch-friendly buttons and spacing
- Charts responsive to container width

---

## 🎓 Learning Goals

**The system teaches Computer Engineering Module topics:**
1. Memory Hierarchy
2. CPU Components
3. Pipelining and Hazards
4. (And 6 more modules across 3 stages)

Each module has:
- Educational video
- Diagnostic questions (3-5 questions per module)
- Competency mapping (e.g., "Understand" vs "Apply" Bloom levels)

---

## 📊 Summary: How It All Works Together

1. **User Onboards** → Authenticates via Firebase
2. **User Learns** → Watches modules, progress tracked
3. **User Assesses** → Takes diagnostic test (blind spots identified)
4. **User Analyzes** → Gap analysis prioritizes learning needs
5. **User Personalizes** → Selects reviewer format (AI generates)
6. **User Reviews** → Studies with preferred content format
7. **User Tests** → Takes summative posttest
8. **User Progresses** → Moves to next stage (if passed)
9. **User Certifies** → Earns certificate after final stage

**At every step, data reinforces personalization for future learning paths.**

---

## 🔗 File References

Key files to understand the system:

### Routing & Guards:
- `src/routes/AppRoutes.tsx` - Route definitions + ReviewerRouteGate & StageFlowGate
- `src/routes/paths.ts` - Route constants

### Core Pages:
- `src/dashboard/pages/PersonalizedStudyPlanPage.tsx` - Reviewer creation
- `src/dashboard/pages/DiagnosticPretestPage.tsx` - Assessment logic
- `src/dashboard/pages/LearningResultsPage.tsx` - Analytics display
- `src/dashboard/pages/CertificationPage.tsx` - Certificate display

### Services:
- `src/services/assessmentProgress.ts` - Firestore operations
- `src/services/openai.ts` - AI prompt & response handling

### Data:
- `src/dashboard/data/learningStage.ts` - Stage definitions & unlock logic
- `src/dashboard/data/modulesCatalog.ts` - 9 modules & metadata
- `src/dashboard/data/diagnosticQuestions.ts` - Question pool

### Contexts:
- `src/contexts/BrightnessContext.tsx` - Theme switching
- `src/contexts/GradingStageContext.tsx` - Stage selection

---

**Last Updated:** April 6, 2026
**System Version:** 1.0.0
**Status:** Production Ready with Real-Time Reviewer Generation

