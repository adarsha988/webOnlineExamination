import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Quote, Users } from 'lucide-react';

const TestimonialsSection = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch testimonials from API
  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const response = await fetch('/api/testimonial');
      if (response.ok) {
        const data = await response.json();
        setTestimonials(data);
      } else {
        // Fallback to sample testimonials if API fails
        setTestimonials(sampleTestimonials);
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      setTestimonials(sampleTestimonials);
    } finally {
      setLoading(false);
    }
  };

  // Sample testimonials as fallback
  const sampleTestimonials = [
    {
      name: 'Dr. Sarah Johnson',
      designation: 'Professor of Computer Science',
      company: 'Stanford University',
      message: 'ExamSystem has revolutionized how we conduct assessments. The AI-powered grading saves us hours of work while maintaining accuracy.',
      profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      linkedinUrl: 'https://linkedin.com/in/sarahjohnson',
      universityUrl: 'https://stanford.edu'
    },
    {
      name: 'Michael Chen',
      designation: 'Training Director',
      company: 'TechCorp Solutions',
      message: 'The analytics and reporting features give us incredible insights into our team\'s learning progress. Highly recommended!',
      profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      linkedinUrl: 'https://linkedin.com/in/michaelchen',
      universityUrl: 'https://techcorp.com'
    },
    {
      name: 'Emily Rodriguez',
      designation: 'High School Principal',
      company: 'Lincoln Academy',
      message: 'Our students love the intuitive interface, and teachers appreciate the comprehensive question bank and easy exam creation.',
      profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      linkedinUrl: 'https://linkedin.com/in/emilyrodriguez',
      universityUrl: 'https://lincolnacademy.edu'
    },
    {
      name: 'David Park',
      designation: 'Online Course Creator',
      company: 'EduTech Pro',
      message: 'The mobile-friendly design and real-time monitoring have made remote assessments seamless for our global student base.',
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      linkedinUrl: 'https://linkedin.com/in/davidpark',
      universityUrl: 'https://edutechpro.com'
    },
    {
      name: 'Lisa Thompson',
      designation: 'Department Head',
      company: 'Medical Training Institute',
      message: 'Security features are top-notch. We can conduct high-stakes certification exams with complete confidence in the platform.',
      profileImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face',
      linkedinUrl: 'https://linkedin.com/in/lisathompson',
      universityUrl: 'https://medicaltraining.edu'
    },
    {
      name: 'James Wilson',
      designation: 'IT Administrator',
      company: 'Global University',
      message: 'Implementation was smooth, and the 24/7 support team has been incredibly responsive. Great platform overall.',
      profileImage: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face',
      linkedinUrl: 'https://linkedin.com/in/jameswilson',
      universityUrl: 'https://globaluniversity.edu'
    }
  ];

  return (
    <section id="testimonials" className="py-20 bg-white">
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
            Trusted by Educators Worldwide
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See what our users have to say about their experience with ExamSystem
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-all duration-300 relative"
            >
              {/* Quote Icon */}
              <Quote className="h-8 w-8 text-blue-600 opacity-20 absolute top-4 right-4" />
              
              {/* Rating */}
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                ))}
              </div>

              {/* Content */}
              <p className="text-gray-700 mb-6 italic leading-relaxed">
                "{testimonial.message}"
              </p>

              {/* Author */}
              <div className="flex items-center">
                <img
                  src={testimonial.profileImage}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover mr-4"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}&background=3b82f6&color=fff&size=150`;
                  }}
                />
                <div>
                  {/* Clickable Name - LinkedIn */}
                  {testimonial.linkedinUrl ? (
                    <a
                      href={testimonial.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-blue-600 hover:text-blue-800 transition-colors duration-200 cursor-pointer hover:underline"
                    >
                      {testimonial.name}
                    </a>
                  ) : (
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                  )}
                  <p className="text-sm text-gray-600">{testimonial.designation}</p>
                  {/* Clickable University/Company */}
                  {testimonial.universityUrl ? (
                    <a
                      href={testimonial.universityUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200 cursor-pointer hover:underline"
                    >
                      {testimonial.company}
                    </a>
                  ) : (
                    <p className="text-sm text-blue-600">{testimonial.company}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">4.9/5</div>
              <div className="text-blue-100">Average Rating</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">98%</div>
              <div className="text-blue-100">Satisfaction Rate</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">1M+</div>
              <div className="text-blue-100">Exams Conducted</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Support Available</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
