import mongoose from 'mongoose';
import Exam from './server/models/exam.model.js';

async function updateExamSettings() {
  try {
    await mongoose.connect('mongodb://localhost:27017/online-examination');
    console.log('📊 Connected to MongoDB');
    
    // Update all published exams to hide results (showResults: false)
    const result = await Exam.updateMany(
      { status: 'published' },
      { 
        $set: { 
          'settings.showResults': false,
          'settings.allowReview': false
        } 
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} exams to hide results`);
    
    // Verify the changes
    const updatedExams = await Exam.find({ status: 'published' })
      .select('title settings.showResults settings.allowReview');
    
    console.log('\n📚 Updated exam settings:');
    updatedExams.forEach(exam => {
      console.log(`  - ${exam.title}:`);
      console.log(`    showResults: ${exam.settings?.showResults}`);
      console.log(`    allowReview: ${exam.settings?.allowReview}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

updateExamSettings();
