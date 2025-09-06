import mongoose from 'mongoose';

const sharedBankSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  departmentId: {
    type: String,
    index: true
  },
  subject: {
    type: String,
    required: true,
    index: true
  },
  owners: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  collaborators: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    permissions: {
      canCreate: { type: Boolean, default: true },
      canEdit: { type: Boolean, default: false },
      canDelete: { type: Boolean, default: false },
      canApprove: { type: Boolean, default: false },
      canInvite: { type: Boolean, default: false }
    },
    joinedAt: { type: Date, default: Date.now }
  }],
  permissions: {
    owner: {
      type: [String],
      default: ['create', 'edit', 'delete', 'approve', 'invite', 'manage']
    },
    collaborator: {
      type: [String],
      default: ['create', 'suggest']
    }
  },
  settings: {
    requireApproval: { type: Boolean, default: true },
    allowSuggestions: { type: Boolean, default: true },
    autoApproveOwners: { type: Boolean, default: true },
    visibility: {
      type: String,
      enum: ['department', 'organization', 'invite-only'],
      default: 'department'
    }
  },
  stats: {
    totalQuestions: { type: Number, default: 0 },
    approvedQuestions: { type: Number, default: 0 },
    pendingQuestions: { type: Number, default: 0 },
    totalCollaborators: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
sharedBankSchema.index({ departmentId: 1, subject: 1 });
sharedBankSchema.index({ owners: 1 });
sharedBankSchema.index({ 'collaborators.userId': 1 });
sharedBankSchema.index({ name: 'text', description: 'text', subject: 'text' });

// Virtual for total members
sharedBankSchema.virtual('totalMembers').get(function() {
  return this.owners.length + this.collaborators.length;
});

// Static methods
sharedBankSchema.statics.findByInstructor = function(instructorId, options = {}) {
  const query = {
    $or: [
      { owners: instructorId },
      { 'collaborators.userId': instructorId }
    ],
    isActive: true
  };
  
  if (options.departmentId) query.departmentId = options.departmentId;
  if (options.subject) query.subject = options.subject;
  
  return this.find(query)
    .populate('owners', 'name email departmentId')
    .populate('collaborators.userId', 'name email departmentId')
    .sort(options.sort || { updatedAt: -1 });
};

sharedBankSchema.statics.findPublic = function(departmentId, options = {}) {
  const query = {
    departmentId,
    'settings.visibility': { $in: ['department', 'organization'] },
    isActive: true
  };
  
  if (options.subject) query.subject = options.subject;
  
  return this.find(query)
    .populate('owners', 'name email')
    .select('name description subject stats settings owners createdAt')
    .sort({ 'stats.totalQuestions': -1, updatedAt: -1 });
};

// Instance methods
sharedBankSchema.methods.getUserPermissions = function(userId) {
  const userIdStr = userId.toString();
  
  // Check if user is owner
  const isOwner = this.owners.some(ownerId => ownerId.toString() === userIdStr);
  if (isOwner) {
    return {
      isOwner: true,
      isCollaborator: false,
      permissions: this.permissions.owner,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canApprove: true,
      canInvite: true,
      canManage: true
    };
  }
  
  // Check if user is collaborator
  const collaborator = this.collaborators.find(c => c.userId.toString() === userIdStr);
  if (collaborator) {
    return {
      isOwner: false,
      isCollaborator: true,
      permissions: this.permissions.collaborator,
      canCreate: collaborator.permissions.canCreate,
      canEdit: collaborator.permissions.canEdit,
      canDelete: collaborator.permissions.canDelete,
      canApprove: collaborator.permissions.canApprove,
      canInvite: collaborator.permissions.canInvite,
      canManage: false
    };
  }
  
  // No permissions
  return {
    isOwner: false,
    isCollaborator: false,
    permissions: [],
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canApprove: false,
    canInvite: false,
    canManage: false
  };
};

sharedBankSchema.methods.addCollaborator = function(userId, permissions = {}) {
  const userIdStr = userId.toString();
  
  // Check if already a collaborator or owner
  if (this.owners.some(id => id.toString() === userIdStr)) {
    throw new Error('User is already an owner');
  }
  
  const existingIndex = this.collaborators.findIndex(c => c.userId.toString() === userIdStr);
  if (existingIndex !== -1) {
    // Update existing collaborator permissions
    this.collaborators[existingIndex].permissions = {
      ...this.collaborators[existingIndex].permissions,
      ...permissions
    };
  } else {
    // Add new collaborator
    this.collaborators.push({
      userId,
      permissions: {
        canCreate: permissions.canCreate !== undefined ? permissions.canCreate : true,
        canEdit: permissions.canEdit !== undefined ? permissions.canEdit : false,
        canDelete: permissions.canDelete !== undefined ? permissions.canDelete : false,
        canApprove: permissions.canApprove !== undefined ? permissions.canApprove : false,
        canInvite: permissions.canInvite !== undefined ? permissions.canInvite : false
      }
    });
  }
  
  this.stats.totalCollaborators = this.collaborators.length;
  return this.save();
};

sharedBankSchema.methods.removeCollaborator = function(userId) {
  const userIdStr = userId.toString();
  this.collaborators = this.collaborators.filter(c => c.userId.toString() !== userIdStr);
  this.stats.totalCollaborators = this.collaborators.length;
  return this.save();
};

sharedBankSchema.methods.updateStats = async function() {
  const Question = mongoose.model('Question');
  
  const stats = await Question.aggregate([
    { $match: { sharedBankId: this._id, isActive: true } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $in: ['$status', ['draft', 'suggested']] }, 1, 0] } }
      }
    }
  ]);
  
  if (stats.length > 0) {
    this.stats.totalQuestions = stats[0].total;
    this.stats.approvedQuestions = stats[0].approved;
    this.stats.pendingQuestions = stats[0].pending;
  } else {
    this.stats.totalQuestions = 0;
    this.stats.approvedQuestions = 0;
    this.stats.pendingQuestions = 0;
  }
  
  return this.save();
};

// Pre-save middleware
sharedBankSchema.pre('save', function(next) {
  // Ensure at least one owner
  if (!this.owners || this.owners.length === 0) {
    return next(new Error('Shared bank must have at least one owner'));
  }
  
  // Update collaborator count
  this.stats.totalCollaborators = this.collaborators.length;
  
  next();
});

const SharedBank = mongoose.model('SharedBank', sharedBankSchema);

export default SharedBank;
