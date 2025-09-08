import mongoose from 'mongoose';
import Exam from './server/models/exam.model.js';
import User from './server/models/user.model.js';

async function debugExamAssignment() {
  try {
    await mongoose.connect('mongodb://localhost:27017/online-examination');
    console.log('📊 Connected to MongoDB');
    
    // Get bob's user ID
    const bob = await User.findOne({ email: 'bob@student.edu' });
    if (!bob) {
      console.log('❌ Bob not found');
      return;
    }
    console.log(`👤 Bob's ID: ${bob._id}`);
    
    // Get the first exam
    const exam = await Exam.findOne({ status: 'published' });
    if (!exam) {
      console.log('❌ No published exam found');
      return;
    }
    
    console.log(`📚 Exam: ${exam.title}`);
    console.log(`   ID: ${exam._id}`);
    console.log(`   Status: ${exam.status}`);
    console.log(`   Assigned Students: ${exam.assignedStudents.length}`);
    console.log(`   Assigned Student IDs:`, exam.assignedStudents.map(id => id.toString()));
    console.log(`   Bob is assigned: ${exam.assignedStudents.includes(bob._id)}`);
    
    // Update exam to have empty assignedStudents array (allow all students)
    await Exam.updateOne(
      { _id: exam._id },
      { $set: { assignedStudents: [] } }
    );
    
    console.log('✅ Updated exam to allow all students (empty assignedStudents array)');
    
    // Verify the update
    const updatedExam = await Exam.findById(exam._id);
    console.log(`   Updated Assigned Students: ${updatedExam.assignedStudents.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

debugExamAssignment();
