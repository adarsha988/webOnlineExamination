import mongoose from 'mongoose';
import Attempt from '../models/attempt.model.js';
import Exam from '../models/exam.model.js';
import User from '../models/user.model.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/online_examination');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

const createSampleAttempts = async () => {
  try {
    await connectDB();

    // Get instructor John's exams
    const instructor = await User.findOne({ email: 'john@university.edu' });
    if (!instructor) {
      console.log('❌ Instructor John not found');
      return;
    }

    const exams = await Exam.find({ instructorId: instructor._id }).limit(3);
    if (exams.length === 0) {
      console.log('❌ No exams found for instructor');
      return;
    }

    // Get some students
    const students = await User.find({ role: 'student' }).limit(5);
    if (students.length === 0) {
      console.log('❌ No students found');
      return;
    }

    console.log(`📊 Creating sample attempts for ${exams.length} exams and ${students.length} students`);

    // Clear existing attempts for these exams
    await Attempt.deleteMany({ examId: { $in: exams.map(e => e._id) } });

    const sampleAttempts = [];

    // Create attempts for each exam
    for (const exam of exams) {
      // Create 2-4 attempts per exam
      const attemptCount = Math.floor(Math.random() * 3) + 2;
      
      for (let i = 0; i < attemptCount && i < students.length; i++) {
        const student = students[i];
        
        // Generate realistic scores
        const percentage = Math.floor(Math.random() * 60) + 30; // 30-90%
        const score = Math.round((percentage / 100) * (exam.totalMarks || 100));
        
        // Generate realistic timing
        const examDuration = exam.duration || 60; // minutes
        const timeSpent = Math.floor(Math.random() * (examDuration * 60)) + (examDuration * 30); // 30-90% of exam time in seconds
        
        // Random status with bias toward submitted
        const statuses = ['submitted', 'submitted', 'submitted', 'auto_submitted', 'terminated'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        // Create sample answers
        const answers = [];
        const questionCount = exam.questions?.length || 5;
        for (let q = 0; q < Math.min(questionCount, 5); q++) {
          answers.push({
            questionId: new mongoose.Types.ObjectId(),
            answer: `Sample answer ${q + 1}`,
            isCorrect: Math.random() > 0.3, // 70% correct rate
            marksObtained: Math.random() > 0.3 ? (exam.totalMarks || 100) / questionCount : 0,
            timeSpent: Math.floor(Math.random() * 120) + 30 // 30-150 seconds per question
          });
        }

        // Generate proctoring data
        const violationCount = Math.floor(Math.random() * 3);
        const violations = [];
        const violationTypes = ['gaze_away', 'tab_switch', 'multiple_faces', 'no_face'];
        
        for (let v = 0; v < violationCount; v++) {
          violations.push({
            type: violationTypes[Math.floor(Math.random() * violationTypes.length)],
            severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
            timestamp: new Date(Date.now() - Math.random() * 3600000), // Random time in last hour
            description: `Automated detection of ${violationTypes[Math.floor(Math.random() * violationTypes.length)]}`
          });
        }

        const attempt = {
          examId: exam._id,
          userId: student._id,
          answers,
          score,
          percentage,
          grade: percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F',
          status,
          timing: {
            startedAt: new Date(Date.now() - timeSpent * 1000),
            submittedAt: status !== 'in_progress' ? new Date() : null,
            totalTimeSpent: timeSpent,
            lastActivity: new Date()
          },
          proctoring: {
            enabled: true,
            violations,
            suspicionScore: violations.length * 15,
            integrityRating: violations.length === 0 ? 'high' : violations.length <= 1 ? 'medium' : 'low'
          },
          session: {
            ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            deviceInfo: {
              platform: 'Windows',
              browser: 'Chrome',
              mobile: false
            }
          },
          feedback: {
            reviewRequired: violations.length > 2 || percentage < 40,
            systemRecommendations: violations.length > 2 ? ['Manual review required'] : []
          }
        };

        sampleAttempts.push(attempt);
      }
    }

    // Insert all attempts
    const createdAttempts = await Attempt.insertMany(sampleAttempts);
    
    console.log(`✅ Created ${createdAttempts.length} sample attempts`);
    
    // Display summary
    const stats = {
      totalAttempts: createdAttempts.length,
      avgScore: Math.round(createdAttempts.reduce((sum, a) => sum + a.percentage, 0) / createdAttempts.length),
      passRate: Math.round((createdAttempts.filter(a => a.percentage >= 40).length / createdAttempts.length) * 100),
      pendingReview: createdAttempts.filter(a => a.feedback.reviewRequired).length,
      highSuspicion: createdAttempts.filter(a => a.proctoring.suspicionScore >= 25).length
    };
    
    console.log('📈 Analytics Summary:');
    console.log(`   Total Attempts: ${stats.totalAttempts}`);
    console.log(`   Average Score: ${stats.avgScore}%`);
    console.log(`   Pass Rate: ${stats.passRate}%`);
    console.log(`   Pending Review: ${stats.pendingReview}`);
    console.log(`   High Suspicion: ${stats.highSuspicion}`);

  } catch (error) {
    console.error('❌ Error creating sample attempts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
};

// Run the script
createSampleAttempts();
