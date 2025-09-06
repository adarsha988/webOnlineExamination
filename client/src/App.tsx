import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { store } from "./store";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "@/components/ProtectedRoute.tsx";
import NotFound from "@/pages/not-found";
// @ts-ignore
import GuestHomepage from "@/pages/home/GuestHomepage.jsx";
// @ts-ignore
import StudentDashboard from "@/pages/student/Dashboard.jsx";
// @ts-ignore
import StudentExamInterface from "@/pages/student/ExamInterface.jsx";
// @ts-ignore
import StudentResults from "@/pages/student/Results.jsx";
// @ts-ignore
import InstructorDashboard from "@/pages/instructor/Dashboard.jsx";
// @ts-ignore
import InstructorExamCreator from "@/pages/instructor/ExamCreator.jsx";
// @ts-ignore
import InstructorQuestionBuilder from "@/pages/instructor/QuestionBuilder.jsx";
// @ts-ignore
import QuestionBank from './pages/instructor/QuestionBank';
// @ts-ignore
import ExamCreation from './pages/instructor/ExamCreation';
// @ts-ignore
import ExamList from './pages/instructor/ExamList';
// @ts-ignore
import EditExam from './pages/instructor/EditExam';
// @ts-ignore
import AdminDashboard from "@/pages/admin/Dashboard.jsx";
// @ts-ignore
import AdminUserManagement from "@/pages/admin/UserManagement.jsx";
// @ts-ignore
import StudentsPage from "@/components/admin/StudentsPage.jsx";
// @ts-ignore
import InstructorsPage from "@/components/admin/InstructorsPage.jsx";
// @ts-ignore
import ActiveTodayPage from "@/components/admin/ActiveTodayPage.jsx";
// @ts-ignore
import SystemAnalyticsPage from "@/components/admin/SystemAnalyticsPage.jsx";
// @ts-ignore
import ExamsPage from "@/components/admin/ExamsPage.jsx";

function Router() {
  return (
    <Switch>
      {/* Student Routes */}
      <Route path="/student/dashboard" component={() => (
        <ProtectedRoute allowedRoles={['student']}>
          <StudentDashboard />
        </ProtectedRoute>
      )} />
      <Route path="/student/exam/:id" component={() => (
        <ProtectedRoute allowedRoles={['student']}>
          <StudentExamInterface />
        </ProtectedRoute>
      )} />
      <Route path="/student/results" component={() => (
        <ProtectedRoute allowedRoles={['student']}>
          <StudentResults />
        </ProtectedRoute>
      )} />
      
      {/* Instructor Routes */}
      <Route path="/instructor/dashboard" component={() => (
        <ProtectedRoute allowedRoles={['instructor']}>
          <InstructorDashboard />
        </ProtectedRoute>
      )} />
      <Route path="/instructor/create-exam" component={() => (
        <ProtectedRoute allowedRoles={['instructor']}>
          <InstructorExamCreator />
        </ProtectedRoute>
      )} />
      <Route path="/instructor/exam/:id/questions" component={() => (
        <ProtectedRoute allowedRoles={['instructor']}>
          <InstructorQuestionBuilder />
        </ProtectedRoute>
      )} />
      <Route path="/instructor/question-bank">
        <ProtectedRoute allowedRoles={['instructor', 'admin']}>
          <QuestionBank />
        </ProtectedRoute>
      </Route>
      <Route path="/instructor/exam-creation">
        <ProtectedRoute allowedRoles={['instructor', 'admin']}>
          <ExamCreation />
        </ProtectedRoute>
      </Route>
      <Route path="/instructor/exams">
        <ProtectedRoute allowedRoles={['instructor', 'admin']}>
          <ExamList />
        </ProtectedRoute>
      </Route>
      <Route path="/instructor/exams/:id/edit">
        <ProtectedRoute allowedRoles={['instructor', 'admin']}>
          <EditExam />
        </ProtectedRoute>
      </Route>
      
      {/* Admin Routes */}
      <Route path="/admin/dashboard" component={() => (
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      )} />
      <Route path="/admin/users" component={() => (
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminUserManagement />
        </ProtectedRoute>
      )} />
      <Route path="/admin/students" component={() => (
        <ProtectedRoute allowedRoles={['admin']}>
          <StudentsPage />
        </ProtectedRoute>
      )} />
      <Route path="/admin/instructors" component={() => (
        <ProtectedRoute allowedRoles={['admin']}>
          <InstructorsPage />
        </ProtectedRoute>
      )} />
      <Route path="/admin/analytics" component={() => (
        <ProtectedRoute allowedRoles={['admin']}>
          <ActiveTodayPage />
        </ProtectedRoute>
      )} />
      <Route path="/admin/system-analytics" component={() => (
        <ProtectedRoute allowedRoles={['admin']}>
          <SystemAnalyticsPage />
        </ProtectedRoute>
      )} />
      <Route path="/admin/exams" component={() => (
        <ProtectedRoute allowedRoles={['admin']}>
          <ExamsPage />
        </ProtectedRoute>
      )} />
      
      {/* Guest Homepage with integrated auth - Must be last before 404 */}
      <Route path="/" component={GuestHomepage} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
