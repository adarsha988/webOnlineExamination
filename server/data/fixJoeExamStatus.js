import mongoose from 'mongoose';
import Exam from '../models/exam.model.js';
import User from '../models/user.model.js';

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/online_examination');
    console.log('📍 Connected to database');

    // Find Joe Doe
    const joeDoe = await User.findOne({ email: 'joe.doe@student.edu' });
    if (!joeDoe) {
      console.log('❌ Joe Doe not found');
      return;
    }

    // Find Joe's exam
    const joeExam = await Exam.findOne({ 
      title: 'JavaScript Fundamentals Quiz for Joe',
      assignedStudents: joeDoe._id 
    });

    if (!joeExam) {
      console.log('❌ Joe\'s exam not found');
      return;
    }

    // Update exam status to 'upcoming' so it shows in the API
    const currentDate = new Date();
    const examStartDate = new Date(currentDate.getTime() + 10 * 60 * 1000); // 10 minutes from now
    
    joeExam.status = 'upcoming';
    joeExam.scheduledDate = examStartDate;
    joeExam.endDate = new Date(examStartDate.getTime() + 2 * 60 * 60 * 1000);
    
    await joeExam.save();

    console.log('✅ Updated exam status to upcoming');
    console.log(`📝 Exam: ${joeExam.title}`);
    console.log(`⏰ Scheduled: ${examStartDate.toLocaleString()}`);
    console.log(`🎯 Status: ${joeExam.status}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('📍 Disconnected from database');
  }
}

main();
