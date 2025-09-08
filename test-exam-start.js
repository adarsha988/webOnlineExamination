import axios from 'axios';

async function testExamStart() {
  try {
    console.log('🚀 Testing exam start functionality...');
    
    const studentId = 'bob@student.edu';
    const baseURL = 'http://127.0.0.1:5000/api';
    
    // First, get available exams
    console.log('📚 Getting available exams...');
    const examsResponse = await axios.get(`${baseURL}/student/${studentId}/exams/upcoming`);
    
    if (!examsResponse.data.success || examsResponse.data.data.length === 0) {
      console.log('❌ No exams available for testing');
      return;
    }
    
    const availableExam = examsResponse.data.data[0];
    console.log(`✅ Found exam to test: ${availableExam.title}`);
    console.log(`   Exam ID: ${availableExam._id}`);
    console.log(`   Can Start: ${availableExam.canStart}`);
    
    if (!availableExam.canStart) {
      console.log('❌ Exam cannot be started (canStart: false)');
      return;
    }
    
    // Test starting the exam
    console.log('\n🎯 Starting exam...');
    try {
      const startResponse = await axios.post(`${baseURL}/student/${studentId}/exam/${availableExam._id}/start`, {
        sessionData: {
          ipAddress: '127.0.0.1',
          userAgent: 'Test User Agent',
          browserFingerprint: 'test-fingerprint'
        }
      });
      
      console.log('✅ Exam start response:', startResponse.status);
      console.log('📊 Response data:', JSON.stringify(startResponse.data, null, 2));
      
      if (startResponse.data.success) {
        console.log('🎉 Exam started successfully!');
        
        // Test getting exam session
        console.log('\n📖 Getting exam session...');
        try {
          const sessionResponse = await axios.get(`${baseURL}/student/${studentId}/exam/${availableExam._id}/session`);
          console.log('✅ Session response:', sessionResponse.status);
          console.log('📊 Session data:', JSON.stringify(sessionResponse.data, null, 2));
        } catch (sessionError) {
          console.error('❌ Session error:', sessionError.response?.status, sessionError.response?.data || sessionError.message);
        }
      }
      
    } catch (startError) {
      console.error('❌ Start exam error:', startError.response?.status, startError.response?.data || startError.message);
    }
    
  } catch (error) {
    console.error('❌ General error:', error.message);
  }
}

testExamStart();
