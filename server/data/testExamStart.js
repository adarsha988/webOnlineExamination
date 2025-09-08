import mongoose from 'mongoose';
import User from '../models/user.model.js';
import Exam from '../models/exam.model.js';
import StudentExam from '../models/studentExam.model.js';

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/online_examination');
    console.log('📍 Connected to database');

    // Find Joe Doe
    const joeDoe = await User.findOne({ email: 'joe.doe@student.edu' });
    console.log('👤 Joe Doe:', joeDoe ? joeDoe.email : 'Not found');

    // Find the exam
    const exam = await Exam.findOne({ title: 'JavaScript Fundamentals Quiz for Joe' });
    console.log('📝 Exam:', exam ? `${exam.title} (${exam.status})` : 'Not found');

    if (!joeDoe || !exam) {
      console.log('❌ Missing user or exam');
      return;
    }

    // Check existing StudentExam record
    let studentExam = await StudentExam.findOne({
      studentId: joeDoe._id,
      examId: exam._id
    });

    console.log('📊 Existing StudentExam:', studentExam ? studentExam.status : 'Not found');

    // Try to create a new StudentExam record if none exists
    if (!studentExam) {
      console.log('🔄 Creating new StudentExam record...');
      
      studentExam = new StudentExam({
        studentId: joeDoe._id,
        examId: exam._id,
        status: 'in_progress',
        startedAt: new Date(),
        timeRemaining: exam.duration * 60,
        answers: []
      });

      try {
        await studentExam.save();
        console.log('✅ StudentExam created successfully');
      } catch (error) {
        console.log('❌ StudentExam creation failed:', error.message);
        console.log('📋 Validation errors:', error.errors);
      }
    } else {
      console.log('✅ StudentExam already exists');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('📍 Disconnected from database');
  }
}

main();
