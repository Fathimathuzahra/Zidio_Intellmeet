import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import GoogleSuccess from '../pages/auth/GoogleSuccess'
import AuthLayout from './AuthLayout'
import DashboardLayout from './DashboardLayout'
import ProtectedRoute from './ProtectedRoute'
import PublicRoute from './PublicRoute'
import DashboardHome from '../pages/dashboard/DashboardHome'
import MeetingsPage from '../pages/dashboard/MeetingsPage'
import TasksPage from '../pages/dashboard/TasksPage'
import TeamsPage from '../pages/dashboard/TeamsPage'
import AnalyticsPage from '../pages/dashboard/AnalyticsPage'
import MeetingRoomPage from '../pages/meeting/MeetingRoomPage'
import JoinMeetingPage from '../pages/meeting/JoinMeetingPage'

import ProfilePage from '../pages/dashboard/ProfilePage'
import AuthSuccess from '../pages/AuthSuccess'
import AcceptInvitationPage from '../pages/AcceptInvitation'
import ForgotPasswordPage from '../pages/auth/ForgotPassword'
import ResetPasswordPage from '../pages/auth/ResetPassword'
import MyTeamsPage from '@/pages/dashboard/MyTeamsPage'

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route element={<PublicRoute />}>
          <Route element={<AuthLayout />} >
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path='/forgot-password' element={<ForgotPasswordPage />} />
              <Route path='/reset-password' element={<ResetPasswordPage />} />
              <Route path='/auth-success' element={<AuthSuccess />} />
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
    </BrowserRouter>
  )
}
