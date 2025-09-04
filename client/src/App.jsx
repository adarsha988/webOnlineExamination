import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { checkAuth } from "./store/authSlice";
import ProtectedRoute from "./components/ProtectedRoute";

// Auth pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Student pages
import StudentDashboard from "./pages/student/Dashboard";
import ExamInterface from "./pages/student/ExamInterface";
import Results from "./pages/student/Results";

// Instructor pages
import InstructorDashboard from "./pages/instructor/Dashboard";
import ExamCreator from "./pages/instructor/ExamCreator";
import QuestionBuilder from "./pages/instructor/QuestionBuilder";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import UserManagement from "./pages/admin/UserManagement";

import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Auth Routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Student Routes */}
      <ProtectedRoute path="/student/dashboard" role="student" component={StudentDashboard} />
      <ProtectedRoute path="/student/exam/:id" role="student" component={ExamInterface} />
      <ProtectedRoute path="/student/results" role="student" component={Results} />
      
      {/* Instructor Routes */}
      <ProtectedRoute path="/instructor/dashboard" role="instructor" component={InstructorDashboard} />
      <ProtectedRoute path="/instructor/exam/create" role="instructor" component={ExamCreator} />
      <ProtectedRoute path="/instructor/exam/:id/questions" role="instructor" component={QuestionBuilder} />
      
      {/* Admin Routes */}
      <ProtectedRoute path="/admin/dashboard" role="admin" component={AdminDashboard} />
      <ProtectedRoute path="/admin/users" role="admin" component={UserManagement} />
      
      {/* Default redirect */}
      <Route path="/">
        {() => {
          const token = localStorage.getItem('token');
          if (!token) {
            window.location.href = '/login';
            return null;
          }
          // Redirect based on user role stored in token
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const role = payload.role;
            if (role === 'admin') window.location.href = '/admin/dashboard';
            else if (role === 'instructor') window.location.href = '/instructor/dashboard';
            else window.location.href = '/student/dashboard';
          } catch {
            window.location.href = '/login';
          }
          return null;
        }}
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Check if user is authenticated on app start
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <TooltipProvider>
      <Toaster />
      <Router />
    </TooltipProvider>
  );
}

export default App;
