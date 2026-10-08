import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoutes from '../components/common/ProtectedRoutes';

import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

import StudentDashboard from '../pages/dashboard/StudentDashboard';
import InstructorDashboard from '../pages/dashboard/InstructorDashboard';
import AdminDashboard from '../pages/dashboard/AdminDashboard';

import CourseCatalogPage from '../pages/courses/CourseCatalogPage';
import CourseDetailPage from '../pages/courses/CourseDetailPage';
import ManageCoursePage from '../pages/courses/ManageCoursePage';

import AssignmentsPage from '../pages/assignments/AssignmentsPage';
import AssignmentDetailPage from '../pages/assignments/AssignmentDetailPage';
import QuizzesPage from '../pages/quizzes/QuizzesPage';
import QuizTakingPage from '../pages/quizzes/QuizTakingPage';
import QuizResultPage from '../pages/quizzes/QuizResultPage';
import QuestionBankPage from '../pages/question-bank/QuestionBankPage';
import GradebookPage from '../pages/grades/GradebookPage';

import AnnouncementsPage from '../pages/announcements/AnnouncementsPage';
import DiscussionsPage from '../pages/discussions/DiscussionsPage';
import DiscussionDetailPage from '../pages/discussions/DiscussionDetailPage';
import AcademicCalendarPage from '../pages/calendar/AcademicCalendarPage';
import InstructorAnalyticsPage from '../pages/analytics/InstructorAnalyticsPage';
import DocumentsPage from '../pages/documents/DocumentsPage';
import ResourcesPage from '../pages/resources/ResourcesPage';
import AIAssistantPage from '../pages/ai/AIAssistantPage';
import AIStudyHubPage from '../pages/ai/AIStudyHubPage';
import AIUsagePage from '../pages/admin/AIUsagePage';

import UnauthorizedPage from '../pages/UnauthorizedPage';
import NotFoundPage from '../pages/NotFoundPage';
import PlaceholderPage from '../pages/PlaceholderPage';

import { useAuthStore } from '../stores/authStore';

export const AppRoutes = () => {
  const { user, isAuthenticated } = useAuthStore();

  const getHomeRedirect = () => {
    if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'INSTRUCTOR') return <Navigate to="/instructor" replace />;
    return <Navigate to="/dashboard" replace />;
  };

  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={getHomeRedirect()} />

      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Protected Routes — Any Authenticated User */}
      <Route element={<ProtectedRoutes />}>
        <Route element={<DashboardLayout />}>
          <Route path="/courses" element={<CourseCatalogPage />} />
          <Route path="/courses/:id" element={<CourseDetailPage />} />
          <Route path="/assignments" element={<AssignmentsPage />} />
          <Route path="/assignments/:id" element={<AssignmentDetailPage />} />
          <Route path="/quizzes" element={<QuizzesPage />} />
          <Route path="/quizzes/:quizId/take" element={<QuizTakingPage />} />
          <Route path="/quizzes/attempts/:attemptId/results" element={<QuizResultPage />} />
          <Route path="/grades" element={<GradebookPage />} />
          
          {/* Phase 4 LMS Core Features */}
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/discussions" element={<DiscussionsPage />} />
          <Route path="/discussions/:id" element={<DiscussionDetailPage />} />
          <Route path="/calendar" element={<AcademicCalendarPage />} />

          {/* Site Resources & Learning Materials */}
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/documents" element={<ResourcesPage />} />

          {/* Phase 6 & 7 AI Learning Station & Assistant */}
          <Route path="/ai-assistant" element={<AIAssistantPage />} />
          <Route path="/study-hub" element={<AIStudyHubPage />} />

          <Route
            path="/profile"
            element={
              <PlaceholderPage
                title="User Profile & Preferences"
                description="Manage your user avatar, academic bio, notification alerts, and password security."
                phase="Phase 2"
              />
            }
          />
          <Route
            path="/settings"
            element={
              <PlaceholderPage
                title="Account Settings"
                description="Global preferences, color themes, API credentials, and privacy configurations."
                phase="Phase 2"
              />
            }
          />
          <Route path="/ai-assistant" element={<AIAssistantPage />} />
        </Route>
      </Route>

      {/* Protected Routes — Student Portal */}
      <Route element={<ProtectedRoutes allowedRoles={['STUDENT']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<StudentDashboard />} />
        </Route>
      </Route>

      {/* Protected Routes — Instructor Portal */}
      <Route element={<ProtectedRoutes allowedRoles={['INSTRUCTOR', 'ADMIN']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/instructor" element={<InstructorDashboard />} />
          <Route path="/courses/:id/manage" element={<ManageCoursePage />} />
          <Route path="/question-bank" element={<QuestionBankPage />} />
          <Route path="/grading" element={<AssignmentsPage />} />
          <Route path="/analytics" element={<InstructorAnalyticsPage />} />
        </Route>
      </Route>

      {/* Protected Routes — Admin Portal */}
      <Route element={<ProtectedRoutes allowedRoles={['ADMIN']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/analytics" element={<AdminDashboard />} />
          <Route
            path="/admin/users"
            element={
              <PlaceholderPage
                title="User & Enrollment Management"
                description="Manage students, instructors, and system administrators with role elevation."
                phase="Phase 4 (LMS Features)"
              />
            }
          />
          <Route
            path="/admin/courses"
            element={
              <PlaceholderPage
                title="Global Course Catalog"
                description="Create, publish, and assign instructors across academic departments."
                phase="Phase 4 (LMS Features)"
              />
            }
          />
          <Route
            path="/admin/ai-usage"
            element={<AIUsagePage />}
          />
        </Route>
      </Route>

      {/* System Status Pages */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
