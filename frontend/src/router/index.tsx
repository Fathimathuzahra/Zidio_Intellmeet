import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AuthLayout from './AuthLayout'
import DashboardLayout from './DashboardLayout'
import ProtectedRoute from './ProtectedRoute'
import PublicRoute from './PublicRoute'

const LoginPage = lazy(() => import('../pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'))
const GoogleSuccess = lazy(() => import('../pages/auth/GoogleSuccess'))
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPassword'))
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPassword'))
const AuthSuccess = lazy(() => import('../pages/AuthSuccess'))
const TermsPage = lazy(() => import('../pages/legal/TermsPage'))
const PrivacyPage = lazy(() => import('../pages/legal/PrivacyPage'))
const AcceptInvitationPage = lazy(() => import('../pages/AcceptInvitation'))
const DashboardHome = lazy(() => import('../pages/dashboard/DashboardHome'))
const MeetingsPage = lazy(() => import('../pages/dashboard/MeetingsPage'))
const TasksPage = lazy(() => import('../pages/dashboard/TasksPage'))
const TeamsPage = lazy(() => import('../pages/dashboard/TeamsPage'))
const MyTeamsPage = lazy(() => import('@/pages/dashboard/MyTeamsPage'))
const AnalyticsPage = lazy(() => import('../pages/dashboard/AnalyticsPage'))
const ProfilePage = lazy(() => import('../pages/dashboard/ProfilePage'))
const MeetingRoomPage = lazy(() => import('../pages/meeting/MeetingRoomPage'))
const JoinMeetingPage = lazy(() => import('../pages/meeting/JoinMeetingPage'))

function RouteLoader() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="h-10 w-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
    </div>
  )
}

export default function Router() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route element={<PublicRoute />}>
            <Route element={<AuthLayout />} >
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path='/forgot-password' element={<ForgotPasswordPage />} />
              <Route path='/reset-password' element={<ResetPasswordPage />} />
              <Route path='/auth-success' element={<AuthSuccess />} />
              <Route path='/terms' element={<TermsPage />} />
              <Route path='/privacy' element={<PrivacyPage />} />
            </Route>
            <Route path="/auth/google/success" element={<GoogleSuccess />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardHome />} />
              <Route path="/meetings" element={<MeetingsPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/teams" element={<TeamsPage />} />
              <Route path="/my-teams" element={<MyTeamsPage />} />
              <Route path="/teams/invitations/:token/accept" element={<AcceptInvitationPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
            <Route path="/meeting/:roomId" element={<MeetingRoomPage />} />
          </Route>

          <Route path="/join/:roomId" element={<JoinMeetingPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
