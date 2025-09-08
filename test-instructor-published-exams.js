import mongoose from 'mongoose';
import Exam from './server/models/exam.model.js';
import User from './server/models/user.model.js';

async function testInstructorPublishedExams() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/online-examination');
    
    console.log('📊 Connected to MongoDB');
    
    // First, find all instructors
    const instructors = await User.find({ role: 'instructor' }).select('name email');
    console.log(`👨‍🏫 Found ${instructors.length} instructors:`);
    instructors.forEach(instructor => {
      console.log(`  - ${instructor.name} (${instructor.email})`);
    });
    
    // Find all published exams with instructor details
    const publishedExams = await Exam.find({ status: 'published' })
      .populate('instructorId', 'name email role')
      .populate('createdBy', 'name email role')
      .select('title subject status scheduledDate endDate duration totalMarks instructorId createdBy');
    
    console.log(`\n📋 Published exams found: ${publishedExams.length}`);
    
    if (publishedExams.length > 0) {
      publishedExams.forEach((exam, index) => {
        console.log(`\n${index + 1}. ${exam.title}`);
        console.log(`   Subject: ${exam.subject}`);
        console.log(`   Status: ${exam.status}`);
        console.log(`   Duration: ${exam.duration} minutes`);
        console.log(`   Total Marks: ${exam.totalMarks}`);
        console.log(`   Scheduled: ${exam.scheduledDate}`);
        console.log(`   End Date: ${exam.endDate}`);
        console.log(`   Instructor: ${exam.instructorId?.name || 'Unknown'} (${exam.instructorId?.email || 'N/A'})`);
        console.log(`   Created By: ${exam.createdBy?.name || 'Unknown'} (${exam.createdBy?.email || 'N/A'})`);
      });
    } else {
      console.log('⚠️ No published exams found');
      
      // Check what exams exist and their statuses
      const allExams = await Exam.find({})
        .populate('instructorId', 'name email')
        .select('title status instructorId');
      
      console.log(`\n📊 All exams in database (${allExams.length}):`);
      allExams.forEach(exam => {
        console.log(`  - ${exam.title}: ${exam.status} (Instructor: ${exam.instructorId?.name || 'Unknown'})`);
      });
    }
    
    // Test the student API endpoint for published exams
    console.log('\n🔍 Testing student API logic for published exams...');
    const studentPublishedExams = await Exam.find({
      status: 'published'
    })
    .populate('instructorId', 'name email')
    .sort({ scheduledDate: 1 });
    
    console.log(`📚 Exams available for students: ${studentPublishedExams.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testInstructorPublishedExams();
