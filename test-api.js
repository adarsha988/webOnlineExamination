import axios from 'axios';

async function testInstructorExamsAPI() {
  try {
    console.log('🔍 Testing instructor exams API...');
    
    // First, let's try to login as an instructor to get a token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'john@university.edu',
      password: 'password123'
    });
    
    console.log('✅ Login successful');
    const token = loginResponse.data.token;
    const userId = loginResponse.data.user.id;
    
    console.log('👤 User ID:', userId);
    console.log('🔑 Token:', token ? 'Present' : 'Missing');
    
    // Now test the exams endpoint
    const examsResponse = await axios.get(`http://localhost:5000/api/exams/instructor/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📋 Exams API Response:');
    console.log('Status:', examsResponse.status);
    console.log('Data:', JSON.stringify(examsResponse.data, null, 2));
    
    // Test analytics endpoint too
    const analyticsResponse = await axios.get(`http://localhost:5000/api/exams/instructor/${userId}/analytics`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Analytics API Response:');
    console.log('Status:', analyticsResponse.status);
    console.log('Data:', JSON.stringify(analyticsResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ API Test Failed:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.message);
    console.error('Response:', error.response?.data);
  }
}

testInstructorExamsAPI();
