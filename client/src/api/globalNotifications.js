import axios from 'axios';

const API_BASE_URL = '/api/global-notifications';

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
    console.error('Notifications API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const globalNotificationsAPI = {
  // Get notifications for a user
  getNotifications: async (params = {}) => {
    const { role, userId, page = 1, limit = 20, unreadOnly = false } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      unreadOnly: unreadOnly.toString()
    });
    
    if (role) queryParams.append('role', role);
    if (userId) queryParams.append('userId', userId);
    
    const response = await api.get(`/?${queryParams}`);
    return response.data;
  },

  // Create a new notification
  createNotification: async (notificationData) => {
    const response = await api.post('/', notificationData);
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId, userId) => {
    const response = await api.patch(`/${notificationId}/read`, { userId });
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async (userId, role) => {
    const response = await api.patch('/read-all', { userId, role });
    return response.data;
  },

  // Send bulk notifications
  sendBulkNotifications: async (bulkData) => {
    const response = await api.post('/bulk', bulkData);
    return response.data;
  },

  // Auto-generate notifications for system events
  autoGenerateNotifications: async (eventType, data) => {
    const response = await api.post('/auto-generate', { eventType, data });
    return response.data;
  },

  // Get notification statistics
  getNotificationStats: async (params = {}) => {
    const { userId, role, timeRange = '30d' } = params;
    const queryParams = new URLSearchParams({ timeRange });
    
    if (userId) queryParams.append('userId', userId);
    if (role) queryParams.append('role', role);
    
    const response = await api.get(`/stats?${queryParams}`);
    return response.data;
  },

  // Delete notification (Admin only)
  deleteNotification: async (notificationId, userId) => {
    const response = await api.delete(`/${notificationId}`, { data: { userId } });
    return response.data;
  },

  // Helper methods for common notification types
  notifyExamAssigned: async (examId, instructorId) => {
    return await globalNotificationsAPI.autoGenerateNotifications('exam_assigned', {
      examId,
      instructorId
    });
  },

  notifyResultPublished: async (examId, instructorId) => {
    return await globalNotificationsAPI.autoGenerateNotifications('result_published', {
      examId,
      instructorId
    });
  },

  notifyUserCreated: async (userId, role, createdBy) => {
    return await globalNotificationsAPI.autoGenerateNotifications('user_created', {
      userId,
      role,
      createdBy
    });
  },

  notifyExamReminder: async (examId) => {
    return await globalNotificationsAPI.autoGenerateNotifications('exam_reminder', {
      examId
    });
  },

  // Send notification to all users of a specific role
  sendToRole: async (senderId, role, message, type = 'system', options = {}) => {
    return await globalNotificationsAPI.createNotification({
      senderId,
      roleTarget: role,
      message,
      type,
      priority: options.priority || 'normal',
      link: options.link || null
    });
  },

  // Send notification to specific user
  sendToUser: async (senderId, recipientId, message, type = 'system', options = {}) => {
    return await globalNotificationsAPI.createNotification({
      senderId,
      recipientId,
      message,
      type,
      priority: options.priority || 'normal',
      link: options.link || null
    });
  },

  // Send notification to all users
  sendToAll: async (senderId, message, type = 'system', options = {}) => {
    return await globalNotificationsAPI.createNotification({
      senderId,
      roleTarget: 'all',
      message,
      type,
      priority: options.priority || 'normal',
      link: options.link || null
    });
  }
};

export default globalNotificationsAPI;
