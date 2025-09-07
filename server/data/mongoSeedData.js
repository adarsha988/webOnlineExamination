import { seedInstructorData } from './instructorSeedData.js';
import Contact from '../models/contact.model.js';
import College from '../models/college.model.js';
import Quiz from '../models/quiz.model.js';
import Testimonial from '../models/testimonial.model.js';

export const seedMongoData = async () => {
  try {
    console.log('🌱 Starting MongoDB seeding...');

    // Seed Quiz Questions
    const existingQuizzes = await Quiz.countDocuments();
    if (existingQuizzes === 0) {
      const sampleQuizzes = [
        {
          question: 'What is 15 + 27?',
          options: ['40', '42', '44', '46'],
          correctAnswer: 1
        },
        {
          question: 'Solve: 8 × 9 = ?',
          options: ['64', '72', '81', '90'],
          correctAnswer: 1
        },
        {
          question: 'What is the square root of 144?',
          options: ['10', '11', '12', '13'],
          correctAnswer: 2
        },
        {
          question: 'If x + 5 = 12, what is x?',
          options: ['5', '6', '7', '8'],
          correctAnswer: 2
        },
        {
          question: 'What is 25% of 80?',
          options: ['15', '20', '25', '30'],
          correctAnswer: 1
        },
        {
          question: 'Solve: 3² + 4² = ?',
          options: ['25', '24', '23', '26'],
          correctAnswer: 0
        },
        {
          question: 'What is 144 ÷ 12?',
          options: ['11', '12', '13', '14'],
          correctAnswer: 1
        },
        {
          question: 'If y = 2x + 3 and x = 4, what is y?',
          options: ['9', '10', '11', '12'],
          correctAnswer: 2
        }
      ];

      await Quiz.insertMany(sampleQuizzes);
      console.log('✅ Quiz questions seeded successfully');
    } else {
      console.log('⏭️  Quiz questions already exist');
    }

    // Seed Testimonials
    const existingTestimonials = await Testimonial.countDocuments();
    if (existingTestimonials === 0) {
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

      await Testimonial.insertMany(sampleTestimonials);
      console.log('✅ Testimonials seeded successfully');
    } else {
      console.log('⏭️  Testimonials already exist');
    }

    // Seed Colleges
    const existingColleges = await College.countDocuments();
    if (existingColleges === 0) {
      const sampleColleges = [
        {
          name: 'Patan Multiple Campus',
          address: 'Lalitpur, Nepal',
          coordinates: {
            latitude: 27.69287908279441,
            longitude: 85.31398931506282
          },
          phone: '9816944639',
          email: 'Adarshakd57@gmail.com',
          website: 'https://patanmultiplecampus.edu.np',
          isActive: true
        },
        {
          name: 'Tribhuvan University',
          address: 'Kirtipur, Kathmandu, Nepal',
          coordinates: {
            latitude: 27.6777,
            longitude: 85.2914
          },
          phone: '01-4330433',
          email: 'info@tribhuvan.edu.np',
          website: 'https://tribhuvan.edu.np',
          isActive: true
        },
        {
          name: 'Kathmandu University',
          address: 'Dhulikhel, Kavre, Nepal',
          coordinates: {
            latitude: 27.6244,
            longitude: 85.5381
          },
          phone: '011-661399',
          email: 'info@ku.edu.np',
          website: 'https://ku.edu.np',
          isActive: true
        }
      ];

      await College.insertMany(sampleColleges);
      console.log('✅ Colleges seeded successfully');
    } else {
      console.log('⏭️  Colleges already exist');
    }

    // Seed Instructor Data (Exams and Questions)
    await seedInstructorData();

    console.log('🎉 MongoDB seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding MongoDB data:', error);
  }
};
