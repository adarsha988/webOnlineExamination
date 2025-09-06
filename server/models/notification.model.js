import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['system', 'user', 'exam', 'security'],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  link: {
    type: String,
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null means notification is for all admins
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for performance
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

// Virtual for formatted timestamp
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return this.createdAt.toLocaleDateString();
});

// Static method to create system notifications
notificationSchema.statics.createSystemNotification = async function(title, message, link = null, priority = 'medium') {
  return this.create({
    type: 'system',
    title,
    message,
    link,
    priority
  });
};

// Static method to create user activity notifications
notificationSchema.statics.createUserNotification = async function(title, message, link = null, userId = null) {
  return this.create({
    type: 'user',
    title,
    message,
    link,
    userId
  });
};

// Static method to create exam notifications
notificationSchema.statics.createExamNotification = async function(title, message, link = null, userId = null) {
  return this.create({
    type: 'exam',
    title,
    message,
    link,
    userId
  });
};

// Static method to create security notifications
notificationSchema.statics.createSecurityNotification = async function(title, message, link = null, priority = 'high') {
  return this.create({
    type: 'security',
    title,
    message,
    link,
    priority
  });
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
