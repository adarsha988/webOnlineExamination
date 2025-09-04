import React from 'react';
import HeroSection from './HeroSection';
import MathQuizSection from './MathQuizSection';
import TestimonialsSection from './TestimonialsSection';
import LocationSection from './LocationSection';
import ContactSection from './ContactSection';

const HomePage = ({ onOpenAuth }) => {
  return (
    <div className="min-h-screen">
      <HeroSection onOpenAuth={onOpenAuth} />
      <MathQuizSection />
      <TestimonialsSection />
      <LocationSection />
      <ContactSection />
    </div>
  );
};

export default HomePage;
