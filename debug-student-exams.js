import mongoose from 'mongoose';
import Exam from './server/models/exam.model.js';
import User from './server/models/user.model.js';
import StudentExam from './server/models/studentExam.model.js';

async function debugStudentExams() {
  try {
    await mongoose.connect('mongodb://localhost:27017/online-examination');
    console.log('📊 Connected to MongoDB');
    
    // Check what users exist
    const students = await User.find({ role: 'student' }).select('name email');
    console.log(`👤 Students in database: ${students.length}`);
    students.forEach(s => console.log(`  - ${s.name} (${s.email})`));
    
    // Check what published exams exist
    const publishedExams = await Exam.find({ status: 'published' })
      .populate('instructorId', 'name email')
      .select('title status scheduledDate endDate instructorId');
    
    console.log(`\n📚 Published exams: ${publishedExams.length}`);
    publishedExams.forEach(exam => {
      console.log(`  - ${exam.title} (${exam.status})`);
      console.log(`    Instructor: ${exam.instructorId?.name}`);
      console.log(`    Scheduled: ${exam.scheduledDate}`);
    });
    
    // Check StudentExam records
    const studentExamRecords = await StudentExam.find({})
      .populate('studentId', 'name email')
      .populate('examId', 'title status');
    
    console.log(`\n📋 StudentExam records: ${studentExamRecords.length}`);
    studentExamRecords.forEach(record => {
      console.log(`  - Student: ${record.studentId?.email} | Exam: ${record.examId?.title} | Status: ${record.status}`);
    });
    
    // Test the exact API logic for bob@student.edu
    console.log('\n🔍 Testing API logic for bob@student.edu...');
    
    const bobUser = await User.findOne({ email: 'bob@student.edu' });
    if (!bobUser) {
      console.log('❌ bob@student.edu not found in database');
      return;
    }
    
    console.log(`✅ Found bob: ${bobUser.name} (${bobUser._id})`);
    
    // Get published exams
    const upcomingExams = await Exam.find({
      status: 'published'
    })
    .populate('instructorId', 'name email')
    .sort({ scheduledDate: 1 });
    
    console.log(`📚 Found ${upcomingExams.length} published exams`);
    
    // Check StudentExam records for bob
    const examIds = upcomingExams.map(exam => exam._id);
    const studentExams = await StudentExam.find({
      studentId: bobUser._id,
      examId: { $in: examIds }
    });
    
    console.log(`📋 Found ${studentExams.length} StudentExam records for bob`);
    
    // Show what would be returned
    const studentExamMap = {};
    studentExams.forEach(se => {
      studentExamMap[se.examId.toString()] = se;
    });
    
    const enrichedExams = upcomingExams.map(exam => ({
      _id: exam._id,
      title: exam.title,
      status: exam.status,
      studentStatus: studentExamMap[exam._id.toString()]?.status || 'not_started',
      canStart: !studentExamMap[exam._id.toString()] || 
                studentExamMap[exam._id.toString()].status === 'not_started'
    }));
    
    console.log('\n📊 Final enriched exams that would be returned:');
    enrichedExams.forEach(exam => {
      console.log(`  - ${exam.title}: ${exam.status} (studentStatus: ${exam.studentStatus}, canStart: ${exam.canStart})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

debugStudentExams();
