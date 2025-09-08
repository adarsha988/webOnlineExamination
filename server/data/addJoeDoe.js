import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/user.model.js';
import Exam from '../models/exam.model.js';
import Question from '../models/question.model.js';
import StudentExam from '../models/studentExam.model.js';

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/online_examination');
    console.log('📍 Connected to database');

    // 1. Create Joe Doe student
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('password123', saltRounds);

    let joeDoe = await User.findOne({ email: 'joe.doe@student.edu' });
    
    if (!joeDoe) {
      joeDoe = new User({
        name: 'Joe Doe',
        email: 'joe.doe@student.edu',
        password: hashedPassword,
        role: 'student',
        status: 'active',
        phone: '+1-555-2000',
        address: 'Student Dormitory, Room 205'
      });
      await joeDoe.save();
      console.log('✅ Created Joe Doe:', joeDoe.email);
    } else {
      console.log('✅ Joe Doe already exists:', joeDoe.email);
    }

    // 2. Get instructor
    const instructor = await User.findOne({ role: 'instructor' });
    if (!instructor) {
      console.log('❌ No instructor found');
      return;
    }

    // 3. Get questions
    const questions = await Question.find({ subject: 'Computer Science' }).limit(5);
    console.log(`📝 Found ${questions.length} questions`);

    // 4. Create exam
    const currentDate = new Date();
    const examStartDate = new Date(currentDate.getTime() + 30 * 60 * 1000); // 30 minutes from now
    const examEndDate = new Date(examStartDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration

    const newExam = new Exam({
      title: 'JavaScript Fundamentals Quiz for Joe',
      subject: 'Computer Science',
      description: 'A quiz specifically created for Joe Doe to test JavaScript fundamentals',
      duration: 120,
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
        score: null,
        startTime: null,
        endTime: null,
        answers: []
      }],
      settings: {
        allowRetake: false,
        showResults: true,
        randomizeQuestions: true
      }
    });

    await newExam.save();
    console.log('✅ Created exam:', newExam.title);

    // 5. Create StudentExam record
    const studentExam = new StudentExam({
      examId: newExam._id,
      studentId: joeDoe._id,
      answers: [],
      status: 'not_started',
      score: null,
      percentage: null,
      grade: null,
      startedAt: null,
      submittedAt: null,
      gradedAt: null
    });

    await studentExam.save();
    console.log('✅ Created StudentExam record');

    console.log('\n🎉 SUCCESS! Joe Doe can now log in and take the exam:');
    console.log(`📧 Email: ${joeDoe.email}`);
    console.log(`🔑 Password: password123`);
    console.log(`📝 Exam: ${newExam.title}`);
    console.log(`⏰ Starts: ${examStartDate.toLocaleString()}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('📍 Disconnected from database');
  }
}

main();
