import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import Header from '../../components/home/Header';
import HeroSection from '../../components/home/HeroSection';
import AboutSection from '../../components/home/AboutSection';
import FeaturesSection from '../../components/home/FeaturesSection';
import TestimonialsSection from '../../components/home/TestimonialsSection';
import ContactSection from '../../components/home/ContactSection';
import Footer from '../../components/home/Footer';
import AuthModal from '../../components/auth/AuthModal';
import { checkAuth } from '../../store/authSlice';

const GuestHomepage = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [, setLocation] = useLocation();
  const dispatch = useDispatch();
  
  const { isAuthenticated, user, isLoading } = useSelector((state) => state.auth);

  useEffect(() => {
    // Check if user is already authenticated
    dispatch(checkAuth());
  }, [dispatch]);

  useEffect(() => {
    // Redirect authenticated users to their dashboard
    if (isAuthenticated && user) {
      console.log('🏠 HOMEPAGE: Redirecting authenticated user:', user.role);
      const dashboardRoutes = {
        admin: '/admin/dashboard',
        instructor: '/instructor/dashboard',
        student: '/student/dashboard'
      };
      const targetRoute = dashboardRoutes[user.role] || '/student/dashboard';
      console.log('🏠 HOMEPAGE: Redirecting to:', targetRoute);
      setLocation(targetRoute);
    }
  }, [isAuthenticated, user, setLocation]);

  const openAuthModal = (mode = 'login') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header onOpenAuth={openAuthModal} />
      
      <main>
        <HeroSection onOpenAuth={openAuthModal} />
        <AboutSection />
        <FeaturesSection />
        <TestimonialsSection />
        <ContactSection />
      </main>

      <Footer />

      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  );
};

export default GuestHomepage;
