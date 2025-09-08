import mongoose from 'mongoose';
import Exam from './server/models/exam.model.js';
import User from './server/models/user.model.js';

async function testStudentDashboardAPI() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/online-examination');
    
    console.log('📊 Connected to MongoDB');
    
    // Create a test student if none exists
    let student = await User.findOne({ role: 'student' });
    if (!student) {
      student = await User.create({
        name: 'Test Student',
        email: 'test@student.edu',
        password: 'hashedpassword',
        role: 'student'
      });
      console.log('👤 Created test student:', student.email);
    } else {
      console.log('👤 Found existing student:', student.email);
    }
    
    // Create a test instructor if none exists
    let instructor = await User.findOne({ role: 'instructor' });
    if (!instructor) {
      instructor = await User.create({
        name: 'Dr. Test Instructor',
        email: 'instructor@test.edu',
        password: 'hashedpassword',
        role: 'instructor'
      });
      console.log('👨‍🏫 Created test instructor:', instructor.email);
    } else {
      console.log('👨‍🏫 Found existing instructor:', instructor.email);
    }
    
    // Create test published exams for students to take
    const existingExams = await Exam.find({ status: 'published' });
    if (existingExams.length === 0) {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      const currentDate = new Date();
      
      const testExams = await Exam.insertMany([
        {
          title: 'JavaScript Fundamentals',
          subject: 'Computer Science',
          description: 'Test your knowledge of JavaScript basics',
          duration: 60,
          totalMarks: 100,
          passingMarks: 60,
          questions: [],
          createdBy: instructor._id,
          instructorId: instructor._id,
          status: 'published',
          scheduledDate: futureDate,
          endDate: new Date(futureDate.getTime() + 60 * 60 * 1000),
          attempts: [{
            student: student._id,
            maxAttempts: 1,
            attemptsUsed: 0
          }],
          settings: {
            shuffleQuestions: false,
            showResults: true,
            allowReview: true,
            proctoring: { enabled: false, lockdown: false, recordScreen: false }
          }
        },
        {
          title: 'React Components Quiz',
          subject: 'Computer Science',
          description: 'Understanding React component lifecycle and hooks',
          duration: 90,
          totalMarks: 100,
          passingMarks: 70,
          questions: [],
          createdBy: instructor._id,
          instructorId: instructor._id,
          status: 'published',
          scheduledDate: currentDate,
          endDate: new Date(currentDate.getTime() + 2 * 60 * 60 * 1000),
          attempts: [{
            student: student._id,
            maxAttempts: 1,
            attemptsUsed: 0
          }],
          settings: {
            shuffleQuestions: true,
            showResults: false,
            allowReview: false,
            proctoring: { enabled: true, lockdown: false, recordScreen: false }
          }
        }
      ]);
      
      console.log(`📝 Created ${testExams.length} test published exams`);
    } else {
      console.log(`📝 Found ${existingExams.length} existing published exams`);
    }
    
    // Test the student API logic - fetch published exams
    console.log('\n🔍 Testing student dashboard API logic...');
    
    const publishedExams = await Exam.find({
      status: 'published'
    })
    .populate('instructorId', 'name email')
    .sort({ scheduledDate: 1 });
    
    console.log(`📚 Published exams available for students: ${publishedExams.length}`);
    
    publishedExams.forEach((exam, index) => {
      console.log(`\n${index + 1}. ${exam.title}`);
      console.log(`   Subject: ${exam.subject}`);
      console.log(`   Duration: ${exam.duration} minutes`);
      console.log(`   Total Marks: ${exam.totalMarks}`);
      console.log(`   Instructor: ${exam.instructorId?.name || 'Unknown'}`);
      console.log(`   Scheduled: ${exam.scheduledDate}`);
      console.log(`   Status: ${exam.status}`);
      console.log(`   Questions: ${exam.questions?.length || 0}`);
    });
    
    // Test categorization for student dashboard
    const now = new Date();
    const upcomingExams = publishedExams.filter(exam => 
      new Date(exam.scheduledDate) > now
    );
    const ongoingExams = publishedExams.filter(exam => 
      new Date(exam.scheduledDate) <= now && new Date(exam.endDate) > now
    );
    
    console.log(`\n📊 Exam categorization for student dashboard:`);
    console.log(`   📅 Upcoming exams: ${upcomingExams.length}`);
    console.log(`   🔄 Ongoing exams: ${ongoingExams.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testStudentDashboardAPI();
