import mongoose from 'mongoose';
import Exam from './server/models/exam.model.js';

async function testUpcomingExams() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/online-examination', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('📊 Connected to MongoDB');
    
    // Check all exams in database
    const allExams = await Exam.find({}).select('title status scheduledDate');
    console.log('📋 All exams in database:');
    allExams.forEach(exam => {
      console.log(`  - ${exam.title}: ${exam.status} (${exam.scheduledDate})`);
    });
    
    // Check specifically for upcoming exams
    const upcomingExams = await Exam.find({ status: 'upcoming' });
    console.log('\n🔮 Upcoming exams found:', upcomingExams.length);
    
    if (upcomingExams.length === 0) {
      console.log('⚠️ No upcoming exams found. Creating one...');
      
      // Create an upcoming exam for testing
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      const testExam = await Exam.create({
        title: 'Test Upcoming Exam',
        subject: 'Computer Science',
        description: 'Test exam for upcoming status',
        duration: 60,
        totalMarks: 100,
        passingMarks: 60,
        questions: [],
        createdBy: new mongoose.Types.ObjectId(),
        instructorId: new mongoose.Types.ObjectId(),
        status: 'upcoming',
        scheduledDate: futureDate,
        endDate: new Date(futureDate.getTime() + 60 * 60 * 1000)
      });
      
      console.log('✅ Created test upcoming exam:', testExam.title);
    } else {
      upcomingExams.forEach(exam => {
        console.log(`  - ${exam.title} (${exam.scheduledDate})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testUpcomingExams();
