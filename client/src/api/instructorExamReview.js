import axios from 'axios';

const API_BASE_URL = '/api';

export const instructorExamReviewAPI = {
  // Get exam submissions for review
  getExamSubmissions: async (examId) => {
    const response = await axios.get(`${API_BASE_URL}/instructor/exam/${examId}/submissions`);
    return response.data;
  },

  // Approve exam result and send to student
  approveExamResult: async (approvalData) => {
    const response = await axios.post(`${API_BASE_URL}/instructor/exam/approve-result`, approvalData);
    return response.data;
  },

  // Get pending reviews count
  getPendingReviews: async () => {
    const response = await axios.get(`${API_BASE_URL}/instructor/pending-reviews`);
    return response.data;
  }
};

export default instructorExamReviewAPI;
