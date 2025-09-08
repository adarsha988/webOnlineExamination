import axios from 'axios';

const API_BASE_URL = '/api';

// Student Exam API calls
export const studentExamAPI = {
  // Get exam lists
  getUpcomingExams: async (studentId) => {
    const response = await axios.get(`${API_BASE_URL}/student/${studentId}/exams/upcoming`);
    return response.data;
  },

  getOngoingExams: async (studentId) => {
    const response = await axios.get(`${API_BASE_URL}/student/${studentId}/exams/ongoing`);
    return response.data;
  },

  getCompletedExams: async (studentId, page = 1, limit = 10) => {
    const response = await axios.get(`${API_BASE_URL}/student/${studentId}/exams/completed`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Exam session management
  startExam: async (examId, studentId, sessionData = {}) => {
    const response = await axios.post(`${API_BASE_URL}/student/${studentId}/exam/${examId}/start`, {
      sessionData: {
        ipAddress: sessionData.ipAddress || 'unknown',
        userAgent: navigator.userAgent,
        browserFingerprint: sessionData.browserFingerprint || 'unknown'
      }
    });
    return response.data;
  },

  getExamSession: async (examId, studentId) => {
    const response = await axios.get(`${API_BASE_URL}/student/${studentId}/exam/${examId}/session`);
    return response.data;
  },

  saveAnswer: async (examId, studentId, questionId, answer, timeSpent = 0) => {
    const response = await axios.post(`${API_BASE_URL}/student/${studentId}/exam/${examId}/answer`, {
      questionId,
      answer,
      timeSpent
    });
    return response.data;
  },

  submitExam: async (examId, studentId, finalAnswers = []) => {
    const response = await axios.post(`${API_BASE_URL}/student/${studentId}/exam/${examId}/submit`, {
      finalAnswers
    });
    return response.data;
  },

  getExamResult: async (examId, studentId) => {
    const response = await axios.get(`${API_BASE_URL}/student/${studentId}/exam/${examId}/result`);
    return response.data;
  },

  // Violation reporting
  reportViolation: async (examId, studentId, type, details = '') => {
    const response = await axios.post(`${API_BASE_URL}/student/${studentId}/exam/${examId}/violation`, {
      type,
      details
    });
    return response.data;
  }
};

// Student Analytics API calls
export const studentAnalyticsAPI = {
  getOverview: async (studentId, limit = 5) => {
    const response = await axios.get(`${API_BASE_URL}/analytics/student/${studentId}/overview`, {
      params: { limit }
    });
    return response.data;
  },

  getScoresOverTime: async (studentId, months = 6) => {
    const response = await axios.get(`${API_BASE_URL}/analytics/student/${studentId}/scores-over-time`, {
      params: { months }
    });
    return response.data;
  },

  getSubjectBreakdown: async (studentId) => {
    const response = await axios.get(`${API_BASE_URL}/analytics/student/${studentId}/subject-breakdown`);
    return response.data;
  },

  getComparativeAnalysis: async (studentId, examId) => {
    const response = await axios.get(`${API_BASE_URL}/analytics/student/${studentId}/comparative/${examId}`);
    return response.data;
  },

  getDifficultyAnalysis: async (studentId) => {
    const response = await axios.get(`${API_BASE_URL}/analytics/student/${studentId}/difficulty-analysis`);
    return response.data;
  },

  getTrends: async (studentId, period = 'month') => {
    const response = await axios.get(`${API_BASE_URL}/analytics/student/${studentId}/trends`, {
      params: { period }
    });
    return response.data;
  },

  exportAnalytics: async (studentId, format = 'csv') => {
    const response = await axios.get(`${API_BASE_URL}/analytics/student/${studentId}/export`, {
      params: { format },
      responseType: format === 'csv' ? 'blob' : 'json'
    });
    
    if (format === 'csv') {
      // Create download link for CSV
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'student-analytics.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return { success: true, message: 'Analytics exported successfully' };
    }
    
    return response.data;
  }
};

// Student Notifications API calls
export const studentNotificationsAPI = {
  getNotifications: async (studentId, page = 1, limit = 20, unreadOnly = false) => {
    const response = await axios.get(`${API_BASE_URL}/student/${studentId}/notifications`, {
      params: { page, limit, unreadOnly }
    });
    return response.data;
  },

  markAsRead: async (studentId, notificationId) => {
    const response = await axios.patch(`${API_BASE_URL}/student/${studentId}/notifications/${notificationId}/read`);
    return response.data;
  },

  deleteNotification: async (studentId, notificationId) => {
    const response = await axios.delete(`${API_BASE_URL}/student/${studentId}/notifications/${notificationId}`);
    return response.data;
  },

  markAllAsRead: async (studentId) => {
    const response = await axios.patch(`${API_BASE_URL}/notifications/read-all`, {
      params: { studentId }
    });
    return response.data;
  }
};
