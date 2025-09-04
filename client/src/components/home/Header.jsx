import { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = ({ onOpenAuth }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { label: 'Home', id: 'hero' },
    { label: 'About', id: 'about' },
    { label: 'Features', id: 'features' },
    { label: 'Testimonials', id: 'testimonials' },
    { label: 'Contact', id: 'contact' }
  ];

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div 
            className="flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
          >
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">ExamSystem</span>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => onOpenAuth('login')}
              className="text-gray-700 hover:text-blue-600"
            >
              Login
            </Button>
            <Button 
              onClick={() => onOpenAuth('signup')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Sign Up
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-700" />
            ) : (
              <Menu className="h-6 w-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden py-4 border-t border-gray-200"
          >
            <nav className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="text-left text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium"
                >
                  {item.label}
                </button>
              ))}
              <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                <Button 
                  variant="ghost" 
                  onClick={() => onOpenAuth('login')}
                  className="justify-start text-gray-700 hover:text-blue-600"
                >
                  Login
                </Button>
                <Button 
                  onClick={() => onOpenAuth('signup')}
                  className="justify-start bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Sign Up
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
};

export default Header;
