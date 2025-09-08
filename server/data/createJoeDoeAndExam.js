import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/user.model.js';
import Exam from '../models/exam.model.js';
import Question from '../models/question.model.js';
import StudentExam from '../models/studentExam.model.js';

export async function createJoeDoeAndExam() {
  try {
    console.log('🚀 Creating Joe Doe and new exam...');

    // 1. Create Joe Doe student user
    const saltRounds = 10;
    const defaultPassword = await bcrypt.hash('password123', saltRounds);

    // Check if Joe Doe already exists
    let joeDoe = await User.findOne({ email: 'joe.doe@student.edu' });
    
    if (!joeDoe) {
      joeDoe = await User.create({
        name: 'Joe Doe',
        email: 'joe.doe@student.edu',
        password: defaultPassword,
        role: 'student',
        status: 'active',
        phone: '+1-555-2000',
        address: 'Student Dormitory, Room 205',
        profile: {
          studentId: 'STU2024001',
          semester: 5,
          gpa: 3.6
        }
      });
      console.log('✅ Created Joe Doe student');
    } else {
      console.log('✅ Joe Doe already exists');
    }

    // 2. Get an instructor to create the exam
    const instructor = await User.findOne({ role: 'instructor', email: 'sarah@university.edu' });
    if (!instructor) {
      throw new Error('No instructor found');
    }

    // 3. Get some questions for the exam
    const questions = await Question.find({ 
      subject: 'Computer Science',
      scope: 'shared'
    }).limit(5);

    if (questions.length === 0) {
      throw new Error('No questions found');
    }

    // 4. Create a new exam for Joe Doe
    const currentDate = new Date();
    const examStartDate = new Date(currentDate.getTime() + 1 * 60 * 60 * 1000); // 1 hour from now
    const examEndDate = new Date(examStartDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration

    const newExam = await Exam.create({
      title: 'JavaScript Fundamentals Quiz',
      subject: 'Computer Science',
      description: 'A comprehensive quiz covering JavaScript basics, functions, and DOM manipulation',
      duration: 120, // 2 hours
      totalMarks: 100,
      passingMarks: 60,
      questions: questions.map(q => q._id),
      createdBy: instructor._id,
      instructorId: instructor._id,
      status: 'published',
      scheduledDate: examStartDate,
      endDate: examEndDate,
      assignedStudents: [joeDoe._id],
      attempts: [{
        student: joeDoe._id,
        maxAttempts: 1,
        attemptsUsed: 0
      }],
      settings: {
        allowRetake: false,
        showResults: true,
        randomizeQuestions: true,
        shuffleQuestions: true,
        allowReview: true,
        proctoring: {
          enabled: false,
          lockdown: false,
          recordScreen: false
        }
      }
    });

    console.log('✅ Created new exam:', newExam.title);

    // 5. Create a StudentExam record for Joe Doe (upcoming exam)
    const studentExam = await StudentExam.create({
      examId: newExam._id,
      studentId: joeDoe._id,
      answers: [],
      status: 'assigned',
      score: null,
      percentage: null,
      grade: null,
      startedAt: null,
      submittedAt: null,
      gradedAt: null,
      timeRemaining: newExam.duration * 60 // in seconds
    });

    console.log('✅ Created StudentExam record for Joe Doe');

    return {
      student: joeDoe,
      exam: newExam,
      studentExam: studentExam,
      message: `Successfully created Joe Doe (${joeDoe.email}) and assigned him to exam "${newExam.title}"`
    };

  } catch (error) {
    console.error('❌ Error creating Joe Doe and exam:', error);
    throw error;
  }
}

// Run the function if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/online_examination');
    console.log('📍 Connected to database');
    
    const result = await createJoeDoeAndExam();
    console.log('🎉 Success:', result.message);
    
    process.exit(0);
  } catch (error) {
    console.error('💥 Failed:', error.message);
    process.exit(1);
  }
}
