import { useSelector } from 'react-redux';
import { useLocation } from 'wouter';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useSelector((state: any) => state.auth);
  const [, setLocation] = useLocation();

  useEffect(() => {
    console.log('🛡️ PROTECTED ROUTE CHECK:', { 
      isAuthenticated, 
      user: user?.email, 
      userRole: user?.role, 
      allowedRoles 
    });

    if (!isAuthenticated) {
      console.log('🚫 Not authenticated - redirecting to homepage');
      setLocation('/');
      return;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      console.log('⚠️ Role not allowed - redirecting to appropriate dashboard');
      // Redirect to appropriate dashboard based on user role
      if (user.role === 'admin') {
        setLocation('/admin/dashboard');
      } else if (user.role === 'instructor') {
        setLocation('/instructor/dashboard');
      } else {
        setLocation('/student/dashboard');
      }
    }
  }, [isAuthenticated, user, allowedRoles, setLocation]);

  console.log('🔍 PROTECTED ROUTE RENDER:', { 
    isAuthenticated, 
    hasUser: !!user, 
    roleAllowed: !allowedRoles || (user && allowedRoles.includes(user.role))
  });

  if (!isAuthenticated) {
    return null;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
