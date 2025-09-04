import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Clock, 
  BarChart3, 
  Shield, 
  Users, 
  Smartphone,
  Brain,
  Award,
  FileText
} from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: BookOpen,
      title: 'Easy Exam Creation',
      description: 'Create comprehensive exams with multiple question types, time limits, and custom settings in minutes.',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Clock,
      title: 'Real-time Monitoring',
      description: 'Monitor exam progress in real-time with live dashboards and instant notifications.',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Get detailed insights with comprehensive reports, performance metrics, and trend analysis.',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: Shield,
      title: 'Secure Environment',
      description: 'Advanced security features including browser lockdown, plagiarism detection, and secure access.',
      color: 'from-red-500 to-red-600'
    },
    {
      icon: Users,
      title: 'Multi-role Support',
      description: 'Separate interfaces for administrators, instructors, and students with role-based permissions.',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      icon: Smartphone,
      title: 'Mobile Friendly',
      description: 'Fully responsive design works seamlessly across all devices and screen sizes.',
      color: 'from-pink-500 to-pink-600'
    },
    {
      icon: Brain,
      title: 'AI-Powered Grading',
      description: 'Intelligent auto-grading for essays and open-ended questions using advanced AI algorithms.',
      color: 'from-orange-500 to-orange-600'
    },
    {
      icon: Award,
      title: 'Certification System',
      description: 'Generate and manage digital certificates with verification and blockchain integration.',
      color: 'from-teal-500 to-teal-600'
    },
    {
      icon: FileText,
      title: 'Question Bank',
      description: 'Build and manage extensive question libraries with categorization and tagging systems.',
      color: 'from-yellow-500 to-yellow-600'
    }
  ];

  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Powerful Features for Modern Education
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to create, manage, and analyze online examinations 
            with professional-grade tools and insights.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                {feature.title}
              </h3>
              
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Join thousands of educators who trust our platform for their assessment needs. 
              Start your free trial today and experience the difference.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200">
                Start Free Trial
              </button>
              <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors duration-200">
                View Demo
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
