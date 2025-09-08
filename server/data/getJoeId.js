import mongoose from 'mongoose';
import User from '../models/user.model.js';

async function getJoeId() {
  try {
    await mongoose.connect('mongodb://localhost:27017/online_examination');
    console.log('Connected to MongoDB');
    
    const user = await User.findOne({ email: 'joe.doe@student.edu' });
    if (user) {
      console.log('Joe Doe ID:', user._id.toString());
    } else {
      console.log('Joe Doe not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

getJoeId();
