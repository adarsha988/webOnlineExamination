import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Users, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HeroSection = ({ onOpenAuth }) => {
  const stats = [
    { icon: BookOpen, label: 'Exams Created', value: '500+' },
    { icon: Users, label: 'Active Students', value: '10K+' },
    { icon: Award, label: 'Success Rate', value: '95%' }
  ];

  return (
    <section id="hero" className="pt-16 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <motion.h1 
              className="text-4xl md:text-6xl font-bold text-gray-900 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              Transform Your
              <span className="text-blue-600 block">Learning Experience</span>
            </motion.h1>
            
            <motion.p 
              className="text-xl text-gray-600 mb-8 max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Create, manage, and take online exams with our comprehensive platform. 
              Perfect for educators, institutions, and students worldwide.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <Button 
                size="lg" 
                onClick={() => onOpenAuth('signup')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => onOpenAuth('login')}
                className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 text-lg"
              >
                Sign In
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div 
              className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-gray-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <stat.icon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Content - Illustration */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Mathematics Quiz</h3>
                  <div className="bg-white/20 rounded-full px-3 py-1 text-sm">
                    Question 3/10
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 mb-4">
                  <p className="text-sm mb-3">What is the derivative of x²?</p>
                  <div className="space-y-2">
                    <div className="bg-white/20 rounded px-3 py-2 text-sm">A) x</div>
                    <div className="bg-green-400 rounded px-3 py-2 text-sm">B) 2x ✓</div>
                    <div className="bg-white/20 rounded px-3 py-2 text-sm">C) x³</div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm opacity-80">Time: 05:30</div>
                  <Button size="sm" className="bg-white text-blue-600 hover:bg-gray-100">
                    Next
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Floating elements */}
            <motion.div 
              className="absolute -top-4 -right-4 bg-yellow-400 rounded-full p-3 shadow-lg"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Award className="h-6 w-6 text-white" />
            </motion.div>
            
            <motion.div 
              className="absolute -bottom-4 -left-4 bg-green-400 rounded-full p-3 shadow-lg"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            >
              <BookOpen className="h-6 w-6 text-white" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
