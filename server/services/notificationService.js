import Notification from '../models/notification.model.js';

class NotificationService {
  // Create system notification
  static async createSystemNotification(title, message, link = null, priority = 'medium') {
    try {
      return await Notification.createSystemNotification(title, message, link, priority);
    } catch (error) {
      console.error('Error creating system notification:', error);
      throw error;
    }
  }

  // Create user activity notification
  static async createUserNotification(title, message, link = null, userId = null) {
    try {
      return await Notification.createUserNotification(title, message, link, userId);
    } catch (error) {
      console.error('Error creating user notification:', error);
      throw error;
    }
  }

  // Create exam notification
  static async createExamNotification(title, message, link = null, userId = null) {
    try {
      return await Notification.createExamNotification(title, message, link, userId);
    } catch (error) {
      console.error('Error creating exam notification:', error);
      throw error;
    }
  }

  // Create security notification
  static async createSecurityNotification(title, message, link = null, priority = 'high') {
    try {
      return await Notification.createSecurityNotification(title, message, link, priority);
    } catch (error) {
      console.error('Error creating security notification:', error);
      throw error;
    }
  }

  // Seed initial notifications for demo
  static async seedNotifications() {
    try {
      const existingCount = await Notification.countDocuments();
      if (existingCount > 0) {
        console.log('Notifications already exist, skipping seed');
        return;
      }

      const notifications = [
        {
          type: 'system',
          title: 'System Maintenance Scheduled',
          message: 'System maintenance is scheduled for tonight at 2:00 AM. Expected downtime: 30 minutes.',
          priority: 'medium',
          link: '/admin/system-analytics'
        },
        {
          type: 'user',
          title: 'New User Registration',
          message: 'John Doe has registered as a new student in the system.',
          priority: 'low',
          link: '/admin/users'
        },
        {
          type: 'exam',
          title: 'Exam Submitted',
          message: 'Mathematics Final Exam has been submitted by 25 students.',
          priority: 'medium',
          link: '/admin/exams'
        },
        {
          type: 'security',
          title: 'Multiple Failed Login Attempts',
          message: 'User account admin@example.com has 5 failed login attempts in the last hour.',
          priority: 'high',
          link: '/admin/security'
        },
        {
          type: 'system',
          title: 'Database Backup Completed',
          message: 'Daily database backup completed successfully at 3:00 AM.',
          priority: 'low',
          link: '/admin/system-analytics'
        },
        {
          type: 'user',
          title: 'Password Reset Request',
          message: 'Jane Smith has requested a password reset.',
          priority: 'medium',
          link: '/admin/users'
        },
        {
          type: 'exam',
          title: 'New Exam Created',
          message: 'Physics Midterm exam has been created and is ready for review.',
          priority: 'medium',
          link: '/admin/exams'
        },
        {
          type: 'security',
          title: 'Unauthorized Access Attempt',
          message: 'Suspicious activity detected from IP 192.168.1.100.',
          priority: 'critical',
          link: '/admin/security'
        }
      ];

      for (const notificationData of notifications) {
        await Notification.create(notificationData);
      }

      console.log('✅ Notification seeding completed successfully!');
    } catch (error) {
      console.error('Error seeding notifications:', error);
    }
  }
}

export default NotificationService;
