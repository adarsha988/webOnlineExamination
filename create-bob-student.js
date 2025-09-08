import mongoose from 'mongoose';
import User from './server/models/user.model.js';

async function createBobStudent() {
  try {
    await mongoose.connect('mongodb://localhost:27017/online-examination');
    console.log('📊 Connected to MongoDB');
    
    // Check if bob@student.edu already exists
    let bob = await User.findOne({ email: 'bob@student.edu' });
    
    if (bob) {
      console.log('✅ bob@student.edu already exists:', bob.name);
    } else {
      // Create bob@student.edu
      bob = await User.create({
        name: 'Bob Student',
        email: 'bob@student.edu',
        password: 'hashedpassword123',
        role: 'student',
        profile: {
          firstName: 'Bob',
          lastName: 'Student',
          dateOfBirth: new Date('1995-01-01'),
          phone: '123-456-7890'
        }
      });
      console.log('✅ Created bob@student.edu:', bob.name);
    }
    
    // Test the API call again
    console.log('\n🔍 Testing API logic with bob@student.edu...');
    
    const publishedExams = await mongoose.model('Exam').find({
      status: 'published'
    })
    .populate('instructorId', 'name email')
    .sort({ scheduledDate: 1 });
    
    console.log(`📚 Published exams available: ${publishedExams.length}`);
    publishedExams.forEach(exam => {
      console.log(`  - ${exam.title} (${exam.status})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

createBobStudent();
