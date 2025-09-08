import mongoose from 'mongoose';
import Exam from '../models/exam.model.js';

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/online_examination');
    console.log('📍 Connected to database');

    // Find Joe's exam and make it ongoing
    const joeExam = await Exam.findOne({ 
      title: 'JavaScript Fundamentals Quiz for Joe'
    });

    if (!joeExam) {
      console.log('❌ Joe\'s exam not found');
      return;
    }

    // Update exam status to 'ongoing' and adjust timing
    const currentDate = new Date();
    const examStartDate = new Date(currentDate.getTime() - 5 * 60 * 1000); // Started 5 minutes ago
    const examEndDate = new Date(currentDate.getTime() + 115 * 60 * 1000); // Ends in 115 minutes
    
    joeExam.status = 'ongoing';
    joeExam.scheduledDate = examStartDate;
    joeExam.endDate = examEndDate;
    
    await joeExam.save();

    console.log('✅ Updated exam status to ongoing');
    console.log(`📝 Exam: ${joeExam.title}`);
    console.log(`⏰ Started: ${examStartDate.toLocaleString()}`);
    console.log(`⏰ Ends: ${examEndDate.toLocaleString()}`);
    console.log(`🎯 Status: ${joeExam.status}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('📍 Disconnected from database');
  }
}

main();
