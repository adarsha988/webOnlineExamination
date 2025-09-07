import express from 'express';
import mongoose from 'mongoose';
import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';
import Exam from '../models/exam.model.js';
import StudentExam from '../models/studentExam.model.js';

const router = express.Router();

// Get notifications for a user (role-aware)
router.get('/', async (req, res) => {
  try {
    const { role, userId, page = 1, limit = 20, unreadOnly = false } = req.query;
    const skip = (page - 1) * limit;

    // Build query based on role and user
    let query = {};
    
    if (role && userId) {
      // Specific user notifications + role-based broadcasts
      query = {
        $or: [
          { recipientId: new mongoose.Types.ObjectId(userId) },
          { roleTarget: role },
          { roleTarget: 'all' }
        ]
      };
    } else if (userId) {
      // Just user-specific notifications
      query.recipientId = new mongoose.Types.ObjectId(userId);
    }

    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate('senderId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      ...query,
      isRead: false
    });

    res.json({
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasMore: skip + notifications.length < totalCount
      },
      unreadCount
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Create notification (Admin/Instructor)
router.post('/', async (req, res) => {
  try {
    const { 
      senderId, 
      recipientId, 
      roleTarget, 
      message, 
      type = 'system', 
      link,
      priority = 'normal'
    } = req.body;

    // Validate sender permissions
    const sender = await User.findById(senderId);
    if (!sender || !['admin', 'instructor'].includes(sender.role)) {
      return res.status(403).json({ message: 'Insufficient permissions to send notifications' });
    }

    // Create notification
    const notification = new Notification({
      senderId,
      recipientId: recipientId ? new mongoose.Types.ObjectId(recipientId) : null,
      roleTarget,
      message,
      type,
      link,
      priority,
      metadata: {
        senderRole: sender.role,
        createdAt: new Date()
      }
    });

    await notification.save();

    // Populate sender info for response
    await notification.populate('senderId', 'name email role');

    res.status(201).json({
      success: true,
      notification,
      message: 'Notification sent successfully'
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Failed to create notification' });
  }
});

// Mark notification as read
router.patch('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Check if user has permission to mark this notification as read
    if (notification.recipientId && notification.recipientId.toString() !== userId) {
      return res.status(403).json({ message: 'Cannot mark this notification as read' });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read for a user
router.patch('/read-all', async (req, res) => {
  try {
    const { userId, role } = req.body;

    // Build query for user's notifications
    const query = {
      $or: [
        { recipientId: new mongoose.Types.ObjectId(userId) },
        { roleTarget: role },
        { roleTarget: 'all' }
      ],
      isRead: false
    };

    const result = await Notification.updateMany(query, {
      isRead: true,
      readAt: new Date()
    });

    res.json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Failed to mark all notifications as read' });
  }
});

// Send bulk notifications (Admin only)
router.post('/bulk', async (req, res) => {
  try {
    const { senderId, recipients, message, type = 'system', link } = req.body;

    // Validate sender is admin
    const sender = await User.findById(senderId);
    if (!sender || sender.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can send bulk notifications' });
    }

    const notifications = [];

    // Create notifications for each recipient
    for (const recipient of recipients) {
      const notification = new Notification({
        senderId,
        recipientId: recipient.userId ? new mongoose.Types.ObjectId(recipient.userId) : null,
        roleTarget: recipient.role,
        message,
        type,
        link,
        metadata: {
          senderRole: 'admin',
          bulkSent: true,
          createdAt: new Date()
        }
      });

      notifications.push(notification);
    }

    // Bulk insert
    const savedNotifications = await Notification.insertMany(notifications);

    res.status(201).json({
      success: true,
      count: savedNotifications.length,
      message: `Sent ${savedNotifications.length} notifications successfully`
    });

  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    res.status(500).json({ message: 'Failed to send bulk notifications' });
  }
});

// Auto-generate notifications for system events
router.post('/auto-generate', async (req, res) => {
  try {
    const { eventType, data } = req.body;
    const notifications = [];

    switch (eventType) {
      case 'exam_assigned':
        // Notify students when exam is assigned
        const exam = await Exam.findById(data.examId).populate('instructorId', 'name');
        if (exam && exam.attempts) {
          for (const attempt of exam.attempts) {
            notifications.push({
              senderId: exam.instructorId._id,
              recipientId: attempt.student,
              message: `New exam "${exam.title}" has been assigned to you. Scheduled for ${new Date(exam.scheduledDate).toLocaleDateString()}.`,
              type: 'exam',
              link: `/student/exam/${exam._id}`,
              metadata: {
                examId: exam._id,
                examTitle: exam.title,
                scheduledDate: exam.scheduledDate
              }
            });
          }
        }
        break;

      case 'result_published':
        // Notify students when results are published
        const studentExams = await StudentExam.find({ examId: data.examId })
          .populate('examId', 'title')
          .populate('studentId', 'name email');
        
        for (const studentExam of studentExams) {
          notifications.push({
            senderId: data.instructorId,
            recipientId: studentExam.studentId._id,
            message: `Results for "${studentExam.examId.title}" have been published. Score: ${studentExam.percentage}%`,
            type: 'result',
            link: `/student/exam/${studentExam.examId._id}/result`,
            metadata: {
              examId: studentExam.examId._id,
              score: studentExam.score,
              percentage: studentExam.percentage
            }
          });
        }
        break;

      case 'user_created':
        // Welcome notification for new users
        notifications.push({
          senderId: data.createdBy,
          recipientId: data.userId,
          message: `Welcome to the Online Examination System! Your account has been created successfully.`,
          type: 'system',
          link: `/${data.role}/dashboard`,
          metadata: {
            welcomeMessage: true,
            userRole: data.role
          }
        });
        break;

      case 'exam_reminder':
        // Remind students about upcoming exams
        const upcomingExam = await Exam.findById(data.examId);
        if (upcomingExam && upcomingExam.attempts) {
          for (const attempt of upcomingExam.attempts) {
            notifications.push({
              senderId: upcomingExam.instructorId,
              recipientId: attempt.student,
              message: `Reminder: Exam "${upcomingExam.title}" is scheduled for ${new Date(upcomingExam.scheduledDate).toLocaleDateString()}.`,
              type: 'exam',
              link: `/student/exam/${upcomingExam._id}`,
              priority: 'high',
              metadata: {
                examId: upcomingExam._id,
                reminderType: 'upcoming',
                scheduledDate: upcomingExam.scheduledDate
              }
            });
          }
        }
        break;

      default:
        return res.status(400).json({ message: 'Unknown event type' });
    }

    // Save all notifications
    if (notifications.length > 0) {
      const savedNotifications = await Notification.insertMany(notifications);
      res.status(201).json({
        success: true,
        count: savedNotifications.length,
        message: `Generated ${savedNotifications.length} notifications for ${eventType}`
      });
    } else {
      res.json({
        success: true,
        count: 0,
        message: 'No notifications generated'
      });
    }

  } catch (error) {
    console.error('Error auto-generating notifications:', error);
    res.status(500).json({ message: 'Failed to generate notifications' });
  }
});

// Get notification statistics
router.get('/stats', async (req, res) => {
  try {
    const { userId, role, timeRange = '30d' } = req.query;
    
    const days = parseInt(timeRange.replace('d', '')) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build base query
    let baseQuery = { createdAt: { $gte: startDate } };
    if (userId) {
      baseQuery.$or = [
        { recipientId: new mongoose.Types.ObjectId(userId) },
        { roleTarget: role },
        { roleTarget: 'all' }
      ];
    }

    // Get statistics
    const [totalNotifications, unreadNotifications, notificationsByType] = await Promise.all([
      Notification.countDocuments(baseQuery),
      Notification.countDocuments({ ...baseQuery, isRead: false }),
      Notification.aggregate([
        { $match: baseQuery },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $project: { type: '$_id', count: 1, _id: 0 } }
      ])
    ]);

    // Notification activity over time
    const dailyActivity = await Notification.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          date: '$_id.date',
          count: 1,
          _id: 0
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.json({
      totalNotifications,
      unreadNotifications,
      readRate: totalNotifications > 0 ? ((totalNotifications - unreadNotifications) / totalNotifications * 100) : 0,
      notificationsByType,
      dailyActivity
    });

  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({ message: 'Failed to fetch notification statistics' });
  }
});

// Delete notification (Admin only)
router.delete('/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;

    // Verify user is admin
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete notifications' });
    }

    const notification = await Notification.findByIdAndDelete(notificationId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
});

export default router;
