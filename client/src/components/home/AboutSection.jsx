import { motion } from 'framer-motion';
import { CheckCircle, Target, Users, Zap } from 'lucide-react';

const AboutSection = () => {
  const features = [
    {
      icon: Target,
      title: 'Precision Testing',
      description: 'Advanced algorithms ensure accurate assessment and fair evaluation for all students.'
    },
    {
      icon: Users,
      title: 'Collaborative Learning',
      description: 'Connect educators and students in a seamless digital learning environment.'
    },
    {
      icon: Zap,
      title: 'Instant Results',
      description: 'Get immediate feedback and detailed analytics to track progress effectively.'
    },
    {
      icon: CheckCircle,
      title: 'Secure Platform',
      description: 'Enterprise-grade security ensures data protection and exam integrity.'
    }
  ];

  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Empowering Education Through
              <span className="text-blue-600 block">Smart Assessment</span>
            </h2>
            
            <p className="text-lg text-gray-600 mb-8">
              Our comprehensive online examination system revolutionizes how educational institutions 
              conduct assessments. From quiz creation to result analysis, we provide everything you 
              need for modern digital education.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start space-x-3"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <feature.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Content - Stats */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6">Why Choose ExamSystem?</h3>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">99.9%</div>
                  <div className="text-blue-100 text-sm">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">50+</div>
                  <div className="text-blue-100 text-sm">Countries</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">24/7</div>
                  <div className="text-blue-100 text-sm">Support</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">500K+</div>
                  <div className="text-blue-100 text-sm">Users</div>
                </div>
              </div>

              <div className="bg-white/10 rounded-xl p-6">
                <h4 className="font-semibold mb-3">Trusted by Leading Institutions</h4>
                <p className="text-blue-100 text-sm">
                  Universities, schools, and training centers worldwide rely on our platform 
                  for their assessment needs.
                </p>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-yellow-400 rounded-full opacity-20"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-green-400 rounded-full opacity-20"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
