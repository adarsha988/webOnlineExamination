import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Question Bank API functions
export const questionBankAPI = {
  // Get questions with filters and pagination
  getQuestions: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 20,
        ...(params.scope && { scope: params.scope }),
        ...(params.search && { search: params.search }),
        ...(params.subject && { subject: params.subject }),
        ...(params.difficulty && { difficulty: params.difficulty }),
        ...(params.type && { type: params.type }),
        ...(params.status && { status: params.status }),
      });

      const response = await api.get(`/questions?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching questions:', error);
      throw error.response?.data || error;
    }
  },

  // Create new question
  createQuestion: async (questionData) => {
    try {
      const response = await api.post('/questions', questionData);
      return response.data;
    } catch (error) {
      console.error('Error creating question:', error);
      throw error.response?.data || error;
    }
  },

  // Update question
  updateQuestion: async (questionId, questionData) => {
    try {
      const response = await api.put(`/questions/${questionId}`, questionData);
      return response.data;
    } catch (error) {
      console.error('Error updating question:', error);
      throw error.response?.data || error;
    }
  },

  // Delete question
  deleteQuestion: async (questionId) => {
    try {
      const response = await api.delete(`/questions/${questionId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting question:', error);
      throw error.response?.data || error;
    }
  },

};

export default questionBankAPI;
