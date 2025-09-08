import axios from 'axios';

const API_BASE_URL = '/api/proctoring';

// Get comprehensive proctoring dashboard data for an exam
export const getProctoringDashboard = async (examId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/dashboard/${examId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching proctoring dashboard:', error);
    throw error;
  }
};

// Get individual student proctoring summary
export const getStudentProctoringsummary = async (attemptId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/student/${attemptId}/summary`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching student proctoring summary:', error);
    throw error;
  }
};

// Export proctoring data for an exam
export const exportProctoringData = async (examId, format = 'csv') => {
  try {
    const response = await axios.get(`${API_BASE_URL}/export/${examId}`, {
      params: { format },
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `proctoring-data-${examId}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error exporting proctoring data:', error);
    throw error;
  }
};

export const proctoringDashboardAPI = {
  getProctoringDashboard,
  getStudentProctoringsummary,
  exportProctoringData
};
