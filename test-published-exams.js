import mongoose from 'mongoose';
import Exam from './server/models/exam.model.js';

async function testPublishedExams() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/online-examination');
    
    console.log('📊 Connected to MongoDB');
    
    // Check for published exams
    const publishedExams = await Exam.find({ status: 'published' })
      .populate('instructorId', 'name email')
      .select('title subject status scheduledDate endDate duration totalMarks instructorId');
    
    console.log(`📋 Published exams found: ${publishedExams.length}`);
    
    if (publishedExams.length > 0) {
      publishedExams.forEach(exam => {
        console.log(`  - ${exam.title}`);
        console.log(`    Subject: ${exam.subject}`);
        console.log(`    Instructor: ${exam.instructorId?.name || 'Unknown'}`);
        console.log(`    Duration: ${exam.duration} minutes`);
        console.log(`    Total Marks: ${exam.totalMarks}`);
        console.log(`    Scheduled: ${exam.scheduledDate}`);
        console.log(`    Status: ${exam.status}`);
        console.log('');
      });
    } else {
      console.log('⚠️ No published exams found in database');
    }
    
    // Also check all exam statuses
    const allExamStatuses = await Exam.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    console.log('📊 Exam status distribution:');
    allExamStatuses.forEach(status => {
      console.log(`  - ${status._id}: ${status.count} exams`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testPublishedExams();
