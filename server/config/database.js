import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const username = process.env.MONGODB_USERNAME;
    const password = process.env.MONGODB_PASSWORD;
    const dbName = process.env.MONGODB_DATABASE;
    const cluster = process.env.MONGODB_CLUSTER || 'clusterdeployment.k87fsfx.mongodb.net';
    
    // Use full DATABASE_URL if provided, otherwise construct from individual parts
    let connectionString = process.env.DATABASE_URL;
    
    if (!connectionString && username && password && dbName) {
      connectionString = `mongodb+srv://${username}:${password}@${cluster}/${dbName}?retryWrites=true&w=majority&appName=Clusterdeployment`;
    } else if (!connectionString) {
      // Fallback to local MongoDB
      connectionString = 'mongodb://localhost:27017/online_examination';
      console.log('Using local MongoDB connection');
    }

    console.log('Attempting to connect to database...');
    console.log('Connection string:', connectionString.replace(/\/\/.*:.*@/, '//***:***@')); // Hide credentials in logs
    
    const connect = await mongoose.connect(connectionString);

    console.log(`✅ Database connected successfully!`);
    console.log(`📍 Host: ${connect.connection.host}`);
    console.log(`🗄️  Database: ${connect.connection.name}`);
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    // Check for common issues
    if (error.message.includes('authentication failed')) {
      console.error('🔐 Authentication failed - check your username and password');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('🌐 Network error - check your internet connection and cluster URL');
    } else if (error.message.includes('IP')) {
      console.error('🚫 IP not whitelisted - add your IP to MongoDB Atlas whitelist');
    }
    
    console.log('\n📋 Troubleshooting checklist:');
    console.log('1. Check your .env.local file has the correct MongoDB credentials');
    console.log('2. Verify your MongoDB Atlas cluster is running');
    console.log('3. Ensure your IP address is whitelisted in MongoDB Atlas');
    console.log('4. Check your internet connection');
    
    process.exit(1);
  }
};

export default connectDB;
