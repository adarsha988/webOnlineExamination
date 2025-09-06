import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'user_created',
      'user_updated',
      'user_login',
      'user_logout',
      'exam_created',
      'exam_updated',
      'exam_published',
      'exam_taken',
      'profile_updated',
      'password_changed',
      'role_changed',
      'user_deactivated',
      'user_activated',
      'question_created',
      'question_updated',
      'question_deleted',
      'question_approved',
      'question_suggested',
      'question_imported',
      'question_exported',
      'shared_bank_created',
      'shared_bank_updated',
      'shared_bank_deleted',
      'collaborator_added',
      'collaborator_removed',
      'permission_changed'
    ],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ type: 1, createdAt: -1 });
activitySchema.index({ createdAt: -1 });

export default mongoose.model('Activity', activitySchema);
