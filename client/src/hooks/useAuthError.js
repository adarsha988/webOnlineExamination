import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { logout } from '../store/authSlice';

// Global auth error handler hook
export const useAuthError = () => {
  const dispatch = useDispatch();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleAuthError = (error, showPopup = true) => {
    console.log('🚨 AUTH ERROR HANDLER:', error);
    
    // Clear authentication data
    dispatch(logout());
    
    if (showPopup) {
      let title = '🔐 Session Expired';
      let description = 'Your session has expired. Please login again.';
      
      if (error?.status === 401) {
        title = '🔐 Unauthorized Access';
        description = 'You are not authorized to access this resource. Please login with valid credentials.';
      } else if (error?.status === 403) {
        title = '🚫 Access Forbidden';
        description = 'You do not have permission to access this resource.';
      } else if (error?.message?.includes('401')) {
        title = '🔐 Authentication Required';
        description = 'Please login to continue.';
      } else if (error?.message?.includes('403')) {
        title = '🚫 Access Denied';
        description = 'You do not have sufficient permissions.';
      }
      
      toast({
        title,
        description,
        variant: 'destructive',
        duration: 6000,
      });
    }
    
    // Redirect to login after a short delay
    setTimeout(() => {
      setLocation('/login');
    }, 1000);
  };

  return { handleAuthError };
};

// Axios interceptor for global auth error handling
export const setupAuthInterceptor = (axiosInstance, handleAuthError) => {
  // Response interceptor to catch auth errors
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleAuthError(error.response);
      }
      return Promise.reject(error);
    }
  );
};

export default useAuthError;
