import { useSelector } from 'react-redux';
import { useLocation } from 'wouter';
import { useEffect } from 'react';

const ProtectedRoute = ({ component: Component, role, ...props }) => {
  const { isAuthenticated, user, isLoading } = useSelector((state) => state.auth);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        setLocation('/login');
        return;
      }
      
      if (role && user?.role !== role) {
        // Redirect to appropriate dashboard based on user role
        if (user?.role === 'admin') {
          setLocation('/admin/dashboard');
        } else if (user?.role === 'instructor') {
          setLocation('/instructor/dashboard');
        } else {
          setLocation('/student/dashboard');
        }
        return;
      }
    }
  }, [isAuthenticated, user, role, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || (role && user?.role !== role)) {
    return null;
  }

  return <Component {...props} />;
};

export default ProtectedRoute;
