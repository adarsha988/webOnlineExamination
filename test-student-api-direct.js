import axios from 'axios';

async function testStudentAPIDirectly() {
  try {
    console.log('🔍 Testing student API endpoints directly...');
    
    // Test the upcoming exams endpoint
    const studentId = 'bob@student.edu';
    const baseURL = 'http://127.0.0.1:5000/api';
    
    console.log(`📞 Calling: GET ${baseURL}/student/${studentId}/exams/upcoming`);
    
    try {
      const response = await axios.get(`${baseURL}/student/${studentId}/exams/upcoming`);
      console.log('✅ API Response Status:', response.status);
      console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));
      
      if (response.data && response.data.data) {
        console.log(`📚 Found ${response.data.data.length} exams for student`);
        response.data.data.forEach((exam, index) => {
          console.log(`${index + 1}. ${exam.title} - ${exam.status} (${exam.subject})`);
        });
      }
    } catch (apiError) {
      console.error('❌ API Error:', apiError.response?.status, apiError.response?.data || apiError.message);
    }
    
    // Also test ongoing exams
    console.log(`\n📞 Calling: GET ${baseURL}/student/${studentId}/exams/ongoing`);
    
    try {
      const ongoingResponse = await axios.get(`${baseURL}/student/${studentId}/exams/ongoing`);
      console.log('✅ Ongoing API Response Status:', ongoingResponse.status);
      console.log('📊 Ongoing Response Data:', JSON.stringify(ongoingResponse.data, null, 2));
    } catch (apiError) {
      console.error('❌ Ongoing API Error:', apiError.response?.status, apiError.response?.data || apiError.message);
    }
    
  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

testStudentAPIDirectly();
