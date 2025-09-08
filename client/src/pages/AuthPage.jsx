import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'wouter';
import AuthModal from '../components/auth/AuthModal';

const AuthPage = () => {
  const [authMode, setAuthMode] = useState('login');
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      switch (user.role) {
        case 'admin':
          setLocation('/admin/dashboard');
          break;
        case 'instructor':
          setLocation('/instructor/dashboard');
          break;
        case 'student':
          setLocation('/student/dashboard');
          break;
        default:
          setLocation('/');
      }
    }
  }, [isAuthenticated, user, setLocation]);

  // Determine auth mode from URL
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/register') {
      setAuthMode('signup');
    } else {
      setAuthMode('login');
    }
  }, []);

  const handleModeChange = (mode) => {
    setAuthMode(mode);
    // Update URL without causing a full page reload
    const newPath = mode === 'signup' ? '/register' : '/login';
    window.history.pushState({}, '', newPath);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="text-center lg:text-left">
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
            Online Examination
            <span className="block text-blue-600">System</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Secure, intelligent, and comprehensive examination platform with AI-powered proctoring
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">AI Proctoring</h3>
              <p className="text-gray-600">Advanced monitoring with face detection and behavior analysis</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Question Bank</h3>
              <p className="text-gray-600">Collaborative question management and sharing</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Analytics</h3>
              <p className="text-gray-600">Comprehensive reporting and performance insights</p>
            </div>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="flex justify-center lg:justify-end">
          <AuthModal
            isOpen={true}
            onClose={() => {}} // No close action needed for full page
            mode={authMode}
            onModeChange={handleModeChange}
          />
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
