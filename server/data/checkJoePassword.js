import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/user.model.js';

async function checkJoePassword() {
  try {
    await mongoose.connect('mongodb://localhost:27017/online_examination');
    console.log('Connected to MongoDB');
    
    const user = await User.findOne({ email: 'joe.doe@student.edu' });
    if (user) {
      console.log('Joe Doe found:');
      console.log('- Email:', user.email);
      console.log('- Password (hashed):', user.password);
      console.log('- Password length:', user.password.length);
      console.log('- Is bcrypt hash:', user.password.startsWith('$2b$'));
      
      // Test password comparison
      const isValidPlain = user.password === 'password123';
      console.log('- Plain text match:', isValidPlain);
      
      if (user.password.startsWith('$2b$')) {
        const isValidBcrypt = await bcrypt.compare('password123', user.password);
        console.log('- Bcrypt match:', isValidBcrypt);
      }
      
      // If password is not hashed, hash it
      if (!user.password.startsWith('$2b$')) {
        console.log('Password is not hashed, updating...');
        const hashedPassword = await bcrypt.hash('password123', 10);
        await User.updateOne(
          { email: 'joe.doe@student.edu' },
          { password: hashedPassword }
        );
        console.log('Password updated with bcrypt hash');
      }
    } else {
      console.log('Joe Doe not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkJoePassword();
