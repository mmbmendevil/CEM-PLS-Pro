import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { type ReactElement, useEffect, useState } from 'react'
import { useGradingStage } from '@/contexts/GradingStageContext'
import { auth } from '../lib/firebase'
import DashboardLayout from '../dashboard/DashboardLayout'
import CoursesPage from '../dashboard/pages/CoursesPage'
import DashboardPage from '../dashboard/pages/DashboardPage'
import DiagnosticPretestPage from '../dashboard/pages/DiagnosticPretestPage'
import GapAnalysisPage from '../dashboard/pages/GapAnalysisPage'
import PostTestGapAnalysisPage from '../dashboard/pages/PostTestGapAnalysisPage'
import LearningResultsPage from '../dashboard/pages/LearningResultsPage'
import CertificationPage from '../dashboard/pages/CertificationPage'
import ModuleViewerPage from '../dashboard/pages/ModuleViewerPage'
import ModulesPage from '../dashboard/pages/ModulesPage'
import PersonalizedStudyPlanPage from '../dashboard/pages/PersonalizedStudyPlanPage'
import ProfilePage from '../dashboard/pages/ProfilePage'
import AudiobookReviewPage from '../dashboard/pages/AudiobookReviewPage.tsx'
import CheatsheetReviewPage from '../dashboard/pages/CheatsheetReviewPage.tsx'
import FlashcardReviewPage from '../dashboard/pages/FlashcardReviewPage.tsx'
import ReviewLandingPage from '../dashboard/pages/ReviewLandingPage.tsx'
import SummativePosttestPage from '../dashboard/pages/SummativePosttestPage.tsx'
import LoginPage from '../auth/LoginPage'
import SigninPage from '../auth/SigninPage'
import AdminRoute from '../admin/components/AdminRoute'
import AdminDashboardPage from '../admin/pages/AdminDashboardPage'
import AdminLoginPage from '../admin/pages/AdminLoginPage'
import {
  getStageDiagnosticRecord,
  getStageSummativeRecord,
  hasReviewerForStage,
  resolveStageForSelection,
} from '../dashboard/data/learningStage'
import { getUserAssessmentProgress } from '../services/assessmentProgress'
import { ROUTE_PATHS } from './paths'

type ReviewerRouteGateProps = {
  user: User
  mode: 'study-plan' | 'review'
  element: ReactElement
}

type StageFlowGateProps = {
  user: User
  mode: 'summative' | 'results' | 'certification'
  element: ReactElement
}

const ReviewerRouteGate = ({ user, mode, element }: ReviewerRouteGateProps) => {
  const { selectedStage } = useGradingStage()
  const [isLoading, setIsLoading] = useState(true)
  const [hasReviewerCreated, setHasReviewerCreated] = useState(false)
  const location = useLocation()
  const reviewerJustCreated = (location.state as { reviewerJustCreated?: boolean } | null)?.reviewerJustCreated === true

  useEffect(() => {
    let isCancelled = false

    const loadReviewerState = async () => {
      setIsLoading(true)
      const assessmentRecords = await getUserAssessmentProgress(user.uid)

      if (isCancelled) {
        return
      }

      const assessmentMap = new Map(assessmentRecords.map((record) => [record.assessmentKey, record]))
      const activeStage = resolveStageForSelection(assessmentMap, selectedStage)
      const activeStageRecord = getStageDiagnosticRecord(assessmentMap, activeStage)

      setHasReviewerCreated(hasReviewerForStage(activeStageRecord))
      setIsLoading(false)
    }

    void loadReviewerState()

    return () => {
      isCancelled = true
    }
  }, [selectedStage, user.uid])

  if (isLoading && !reviewerJustCreated) {
    return <div className="min-h-screen bg-[#050a15]" />
  }

  if (mode === 'study-plan' && hasReviewerCreated) {
    return (
      <Navigate
        to={ROUTE_PATHS.dashboard.review}
        replace
        state={{ redirectNotice: 'Reviewer already created. Redirected to Review Page.' }}
      />
    )
  }

  if (mode === 'review' && !hasReviewerCreated && !reviewerJustCreated) {
    return (
      <Navigate
        to={ROUTE_PATHS.dashboard.studyPlan}
        replace
        state={{ redirectNotice: '' }}
      />
    )
  }

  return element
}

const StageFlowGate = ({ user, mode, element }: StageFlowGateProps) => {
  const { selectedStage } = useGradingStage()
  const [isLoading, setIsLoading] = useState(true)
  const [isAllowed, setIsAllowed] = useState(false)

  useEffect(() => {
    let isCancelled = false

    const loadFlowState = async () => {
      setIsLoading(true)
      const assessmentRecords = await getUserAssessmentProgress(user.uid)

      if (isCancelled) {
        return
      }

      const assessmentMap = new Map(assessmentRecords.map((record) => [record.assessmentKey, record]))
      const activeStage = resolveStageForSelection(assessmentMap, selectedStage)
      const activeStageDiagnosticRecord = getStageDiagnosticRecord(assessmentMap, activeStage)
      const activeStageSummativeRecord = getStageSummativeRecord(assessmentMap, activeStage)
      const finalSummativeRecord = getStageSummativeRecord(assessmentMap, 'final')

      if (mode === 'summative') {
        setIsAllowed(activeStageDiagnosticRecord?.isReviewUnlocked === true)
      } else if (mode === 'certification') {
        setIsAllowed(finalSummativeRecord?.isSubmitted === true || finalSummativeRecord?.isFinished === true)
      } else {
        setIsAllowed(activeStageSummativeRecord?.isSubmitted === true || activeStageSummativeRecord?.isFinished === true)
      }

      setIsLoading(false)
    }

    void loadFlowState()

    return () => {
      isCancelled = true
    }
  }, [mode, selectedStage, user.uid])

  if (isLoading) {
    return <div className="min-h-screen bg-[#050a15]" />
  }

  if (!isAllowed) {
    if (mode === 'summative') {
      return <Navigate to={ROUTE_PATHS.dashboard.review} replace state={{ redirectNotice: 'Finish Review first to unlock Summative Post-test.' }} />
    }

    if (mode === 'results') {
      return <Navigate to={ROUTE_PATHS.dashboard.postTest} replace state={{ redirectNotice: 'Complete Summative Post-test first to unlock Learning Results.' }} />
    }

    return <Navigate to={ROUTE_PATHS.dashboard.results} replace state={{ redirectNotice: 'Complete the Final stage to unlock Certification.' }} />
  }

  return element
}

const AppRoutes = () => {
  const [user, setUser] = useState<User | null>(auth.currentUser)
  const [isAuthReady, setIsAuthReady] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setIsAuthReady(true)
    })

    return unsubscribe
  }, [])

  if (!isAuthReady) {
    return <div className="min-h-screen bg-[#050a15]" />
  }

  return (
    <Routes>
      <Route
        path={ROUTE_PATHS.auth.login}
        element={user ? <Navigate to={ROUTE_PATHS.dashboard.home} replace /> : <LoginPage />}
      />
      <Route
        path={ROUTE_PATHS.auth.signin}
        element={user ? <Navigate to={ROUTE_PATHS.dashboard.home} replace /> : <SigninPage />}
      />
      <Route
        path={ROUTE_PATHS.admin.login}
        element={<AdminLoginPage />}
      />
      <Route
        path={ROUTE_PATHS.admin.home}
        element={<AdminRoute element={<AdminDashboardPage />} />}
      />
      <Route
        path={ROUTE_PATHS.dashboard.home}
        element={user ? <DashboardLayout /> : <Navigate to={ROUTE_PATHS.auth.login} replace />}
      >
        <Route index element={<DashboardPage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="modules" element={<ModulesPage />} />
        <Route path="modules/viewer" element={<ModuleViewerPage />} />
        <Route path="prelim" element={<DiagnosticPretestPage />} />
        <Route path="diagnostic-pretest" element={<Navigate to={ROUTE_PATHS.dashboard.diagnostic} replace />} />
        <Route path="gap-analysis" element={<GapAnalysisPage />} />
        <Route
          path="personalized-study-plan"
          element={
            user ? (
              <ReviewerRouteGate user={user} mode="study-plan" element={<PersonalizedStudyPlanPage />} />
            ) : (
              <Navigate to={ROUTE_PATHS.auth.login} replace />
            )
          }
        />
        <Route
          path="review"
          element={
            user ? (
              <ReviewerRouteGate user={user} mode="review" element={<ReviewLandingPage />} />
            ) : (
              <Navigate to={ROUTE_PATHS.auth.login} replace />
            )
          }
        />
        <Route
          path="review/flashcards"
          element={
            user ? (
              <ReviewerRouteGate user={user} mode="review" element={<FlashcardReviewPage />} />
            ) : (
              <Navigate to={ROUTE_PATHS.auth.login} replace />
            )
          }
        />
        <Route
          path="review/audiobook"
          element={
            user ? (
              <ReviewerRouteGate user={user} mode="review" element={<AudiobookReviewPage />} />
            ) : (
              <Navigate to={ROUTE_PATHS.auth.login} replace />
            )
          }
        />
        <Route
          path="review/cheatsheet"
          element={
            user ? (
              <ReviewerRouteGate user={user} mode="review" element={<CheatsheetReviewPage />} />
            ) : (
              <Navigate to={ROUTE_PATHS.auth.login} replace />
            )
          }
        />
        <Route
          path="summative-posttest"
          element={
            user ? (
              <StageFlowGate user={user} mode="summative" element={<SummativePosttestPage />} />
            ) : (
              <Navigate to={ROUTE_PATHS.auth.login} replace />
            )
          }
        />
        <Route
          path="post-test-gap-analysis"
          element={user ? <PostTestGapAnalysisPage /> : <Navigate to={ROUTE_PATHS.auth.login} replace />}
        />
        <Route
          path="learning-results"
          element={
            user ? (
              <StageFlowGate user={user} mode="results" element={<LearningResultsPage />} />
            ) : (
              <Navigate to={ROUTE_PATHS.auth.login} replace />
            )
          }
        />
        <Route
          path="certification"
          element={
            user ? (
              <StageFlowGate user={user} mode="certification" element={<CertificationPage />} />
            ) : (
              <Navigate to={ROUTE_PATHS.auth.login} replace />
            )
          }
        />
      </Route>
      <Route path="*" element={<Navigate to={ROUTE_PATHS.auth.login} replace />} />
    </Routes>
  )
}

export default AppRoutes
