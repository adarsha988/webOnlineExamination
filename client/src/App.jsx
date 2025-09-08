import React from 'react';
import { Provider } from 'react-redux';
import { Router, Route, Switch } from 'wouter';
import { Toaster } from 'sonner';
import { store } from './store';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import AdminDashboard from './pages/admin/Dashboard';
import InstructorDashboard from './pages/instructor/Dashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import ExamCreation from './pages/instructor/ExamCreation';
import QuestionBank from './pages/instructor/QuestionBank';
import ExamReview from './pages/instructor/ExamReview';
import ProctoringDashboard from './pages/instructor/ProctoringDashboard';
import ExamTaking from './pages/student/ExamTaking';
import ExamResult from './pages/student/ExamResult';
import GlobalAnalytics from './pages/GlobalAnalytics';
import './App.css';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="App">
          <Switch>
            {/* Auth Routes */}
            <Route path="/login" component={AuthPage} />
            <Route path="/register" component={AuthPage} />
            
            {/* Admin Routes */}
            <ProtectedRoute path="/admin/dashboard" component={AdminDashboard} requiredRole="admin" />
            <ProtectedRoute path="/admin/analytics" component={GlobalAnalytics} requiredRole="admin" />
            
            {/* Instructor Routes */}
            <ProtectedRoute path="/instructor/dashboard" component={InstructorDashboard} requiredRole="instructor" />
            <ProtectedRoute path="/instructor/exam-creation" component={ExamCreation} requiredRole="instructor" />
            <ProtectedRoute path="/instructor/question-bank" component={QuestionBank} requiredRole="instructor" />
            <ProtectedRoute path="/instructor/exam/:examId/review" component={ExamReview} requiredRole="instructor" />
            <ProtectedRoute path="/instructor/exam/:examId/proctoring" component={ProctoringDashboard} requiredRole="instructor" />
            
            {/* Student Routes */}
            <ProtectedRoute path="/student/dashboard" component={StudentDashboard} requiredRole="student" />
            <ProtectedRoute path="/student/exam/:id" component={ExamTaking} requiredRole="student" />
            <ProtectedRoute path="/student/exam/:id/result" component={ExamResult} requiredRole="student" />
            
            {/* Default Route */}
            <Route path="/" component={AuthPage} />
          </Switch>
          
          <Toaster position="top-right" />
        </div>
      </Router>
    </Provider>
  );
}

export default App;
