import mongoose from 'mongoose';
import { seedComprehensiveData } from './server/data/comprehensiveSeedData.js';

async function runSeed() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/online_examination');
    console.log('✅ Connected to MongoDB');
    
    // Run the seed function
    await seedComprehensiveData();
    
    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

runSeed();
