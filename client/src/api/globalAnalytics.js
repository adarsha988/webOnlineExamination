import axios from 'axios';

const API_BASE_URL = '/api/global-analytics';

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

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const globalAnalyticsAPI = {
  // Get system overview analytics (Admin only)
  getSystemOverview: async (params = {}) => {
    const { timeRange = '30d', subject } = params;
    const queryParams = new URLSearchParams({ timeRange });
    if (subject) queryParams.append('subject', subject);
    
    const response = await api.get(`/system-overview?${queryParams}`);
    return response.data;
  },

  // Get instructor analytics
  getInstructorAnalytics: async (instructorId, params = {}) => {
    const { timeRange = '30d', subject } = params;
    const queryParams = new URLSearchParams({ timeRange });
    if (subject) queryParams.append('subject', subject);
    
    const response = await api.get(`/instructor/${instructorId}?${queryParams}`);
    return response.data;
  },

  // Get student analytics
  getStudentAnalytics: async (studentId, params = {}) => {
    const { timeRange = '30d', subject } = params;
    const queryParams = new URLSearchParams({ timeRange });
    if (subject) queryParams.append('subject', subject);
    
    const response = await api.get(`/student/${studentId}?${queryParams}`);
    return response.data;
  },

  // Export analytics data
  exportAnalytics: async (role, userId, params = {}) => {
    const { format = 'csv', timeRange = '30d' } = params;
    const queryParams = new URLSearchParams({ format, timeRange });
    
    const response = await api.get(`/export/${role}/${userId}?${queryParams}`, {
      responseType: format === 'pdf' ? 'blob' : 'text'
    });
    
    return response.data;
  },

  // Download analytics report
  downloadReport: async (role, userId, format = 'csv', timeRange = '30d') => {
    try {
      const response = await api.get(`/export/${role}/${userId}`, {
        params: { format, timeRange },
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const extension = format === 'pdf' ? 'pdf' : 'csv';
      const filename = `analytics-${role}-${new Date().toISOString().split('T')[0]}.${extension}`;
      link.setAttribute('download', filename);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true, filename };
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }
};

export default globalAnalyticsAPI;
