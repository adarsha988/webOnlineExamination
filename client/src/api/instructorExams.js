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

// Instructor Exam API functions
export const instructorExamAPI = {
  // Get recent exams for instructor
  getRecentExams: async (instructorId, limit = 5) => {
    try {
      const response = await api.get(`/exams/instructor/${instructorId}/recent?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recent exams:', error);
      throw error.response?.data || error;
    }
  },

  // Get all exams for instructor with pagination
  getInstructorExams: async (instructorId, params = {}) => {
    try {
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 10,
        ...(params.status && { status: params.status }),
        ...(params.subject && { subject: params.subject }),
        ...(params.search && { search: params.search }),
      });

      const response = await api.get(`/exams/instructor/${instructorId}?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching instructor exams:', error);
      throw error.response?.data || error;
    }
  },

  // Create new exam
  createExam: async (examData) => {
    try {
      const response = await api.post('/exams', examData);
      return response.data;
    } catch (error) {
      console.error('Error creating exam:', error);
      throw error.response?.data || error;
    }
  },

  // Get single exam details
  getExam: async (examId) => {
    try {
      const response = await api.get(`/exams/${examId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching exam:', error);
      throw error.response?.data || error;
    }
  },

  // Update exam
  updateExam: async (examId, examData) => {
    try {
      const response = await api.put(`/exams/${examId}`, examData);
      return response.data;
    } catch (error) {
      console.error('Error updating exam:', error);
      throw error.response?.data || error;
    }
  },

  // Delete exam
  deleteExam: async (examId) => {
    try {
      const response = await api.delete(`/exams/${examId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting exam:', error);
      throw error.response?.data || error;
    }
  },

  // Get instructor dashboard stats
  getDashboardStats: async (instructorId) => {
    try {
      // This will aggregate data from multiple API calls
      const [recentExamsResponse, allExamsResponse] = await Promise.all([
        api.get(`/exams/instructor/${instructorId}/recent?limit=10`),
        api.get(`/exams/instructor/${instructorId}?limit=100`) // Get more for stats calculation
      ]);

      const recentExams = recentExamsResponse.data.exams || [];
      const allExams = allExamsResponse.data.exams || [];

      // Calculate stats
      const totalExams = allExams.length;
      const totalAttempts = allExams.reduce((sum, exam) => sum + (exam.attemptsCount || 0), 0);
      const avgScore = allExams.length > 0 
        ? Math.round(allExams.reduce((sum, exam) => sum + (exam.averageScore || 0), 0) / allExams.length)
        : 0;
      const pendingGrades = allExams.filter(exam => exam.status === 'completed').length;

      return {
        success: true,
        stats: {
          totalExams,
          totalAttempts,
          avgScore,
          pendingGrades
        },
        recentExams
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error.response?.data || error;
    }
  }
};

export default instructorExamAPI;
