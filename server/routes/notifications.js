import express from 'express';
const router = express.Router();
import Notification from '../models/notification.model.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

// GET /api/notifications - Get notifications with pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const userId = req.user.id;
    
    const query = {
      $or: [
        { userId: userId }, // User-specific notifications
        { userId: null }    // Global notifications
      ]
    };
    
    if (unreadOnly === 'true') {
      query.isRead = false;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      ...query,
      isRead: false
    });
    
    // Add timeAgo to each notification
    const notificationsWithTime = notifications.map(notification => ({
      ...notification,
      timeAgo: getTimeAgo(notification.createdAt)
    }));
    
    res.json({
      notifications: notificationsWithTime,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
});

// GET /api/notifications/unread-count - Get unread count only
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const unreadCount = await Notification.countDocuments({
      $or: [
        { userId: userId },
        { userId: null }
      ],
      isRead: false
    });
    
    res.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Error fetching unread count', error: error.message });
  }
});

// POST /api/notifications - Create new notification (admin only)
router.post('/', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { type, title, message, link, userId, priority } = req.body;
    
    const notification = new Notification({
      type,
      title,
      message,
      link,
      userId,
      priority
    });
    
    await notification.save();
    
    res.status(201).json({
      ...notification.toObject(),
      timeAgo: getTimeAgo(notification.createdAt)
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(400).json({ message: 'Error creating notification', error: error.message });
  }
});

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const notification = await Notification.findOneAndUpdate(
      { 
        _id: id,
        $or: [
          { userId: userId },
          { userId: null }
        ]
      },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json({
      ...notification.toObject(),
      timeAgo: getTimeAgo(notification.createdAt)
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error marking notification as read', error: error.message });
  }
});

// PATCH /api/notifications/read-all - Mark all notifications as read
router.patch('/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await Notification.updateMany(
      {
        $or: [
          { userId: userId },
          { userId: null }
        ],
        isRead: false
      },
      { isRead: true }
    );
    
    res.json({ 
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Error marking all notifications as read', error: error.message });
  }
});

// DELETE /api/notifications/all - Delete all notifications
router.delete('/all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await Notification.deleteMany({
      $or: [
        { userId: userId },
        { userId: null }
      ]
    });
    
    res.json({ 
      message: 'All notifications deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({ message: 'Error deleting all notifications', error: error.message });
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Only admins can delete any notification, users can only delete their own
    const query = { _id: id };
    if (userRole !== 'admin') {
      query.$or = [
        { userId: userId },
        { userId: null }
      ];
    }
    
    const notification = await Notification.findOneAndDelete(query);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Error deleting notification', error: error.message });
  }
});

// Helper function to calculate time ago
function getTimeAgo(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export default router;
