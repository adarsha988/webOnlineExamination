import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  scope: {
    type: String,
    enum: ['private', 'shared'],
    default: 'private',
    required: true,
    index: true
  },
  sharedBankId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SharedBank',
    index: true
  },
  subject: {
    type: String,
    required: true,
    index: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
    index: true
  },
  type: {
    type: String,
    enum: ['mcq', 'truefalse', 'short', 'long'],
    required: true,
    index: true
  },
  questionText: {
    type: String,
    required: true,
    text: true // Text index for search
  },
  options: [{
    type: String
  }],
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed // String or Array
  },
  explanation: {
    type: String
  },
  marks: {
    type: Number,
    default: 1,
    min: 0
  },
  tags: [{
    type: String,
    index: true
  }],
  metadata: {
    type: Object,
    default: {}
  },
  status: {
    type: String,
    enum: ['draft', 'approved', 'suggested', 'rejected'],
    default: 'approved'
  },
  suggestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  version: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
questionSchema.index({ createdBy: 1, scope: 1 });
questionSchema.index({ sharedBankId: 1, status: 1 });
questionSchema.index({ subject: 1, difficulty: 1, type: 1 });
questionSchema.index({ tags: 1, isActive: 1 });

// Text search index
questionSchema.index({ 
  questionText: 'text', 
  subject: 'text', 
  tags: 'text' 
}, {
  weights: {
    questionText: 10,
    subject: 5,
    tags: 3
  }
});

// Validation middleware
questionSchema.pre('save', function(next) {
  // Validate MCQ options
  if (this.type === 'mcq' && (!this.options || this.options.length < 2)) {
    return next(new Error('MCQ questions must have at least 2 options'));
  }
  
  // Validate True/False options
  if (this.type === 'truefalse') {
    this.options = ['True', 'False'];
    if (!['True', 'False'].includes(this.correctAnswer)) {
      return next(new Error('True/False questions must have True or False as correct answer'));
    }
  }
  
  // Ensure shared questions have sharedBankId
  if (this.scope === 'shared' && !this.sharedBankId) {
    return next(new Error('Shared questions must have a sharedBankId'));
  }
  
  // Ensure private questions don't have sharedBankId
  if (this.scope === 'private' && this.sharedBankId) {
    this.sharedBankId = undefined;
  }
  
  next();
});

// Static methods
questionSchema.statics.findByInstructor = function(instructorId, options = {}) {
  const query = {
    createdBy: instructorId,
    scope: 'private',
    isActive: true
  };
  
  if (options.subject) query.subject = options.subject;
  if (options.difficulty) query.difficulty = options.difficulty;
  if (options.type) query.type = options.type;
  if (options.tags && options.tags.length > 0) query.tags = { $in: options.tags };
  
  return this.find(query)
    .populate('createdBy', 'name email')
    .sort(options.sort || { updatedAt: -1 });
};

questionSchema.statics.findBySharedBank = function(sharedBankId, options = {}) {
  const query = {
    sharedBankId,
    scope: 'shared',
    isActive: true
  };
  
  if (options.status) query.status = options.status;
  if (options.subject) query.subject = options.subject;
  if (options.difficulty) query.difficulty = options.difficulty;
  if (options.type) query.type = options.type;
  
  return this.find(query)
    .populate('createdBy', 'name email')
    .populate('approvedBy', 'name email')
    .populate('suggestedBy', 'name email')
    .sort(options.sort || { updatedAt: -1 });
};

questionSchema.statics.searchQuestions = function(searchTerm, filters = {}) {
  const query = {
    $text: { $search: searchTerm },
    isActive: true
  };
  
  if (filters.scope) query.scope = filters.scope;
  if (filters.createdBy) query.createdBy = filters.createdBy;
  if (filters.sharedBankId) query.sharedBankId = filters.sharedBankId;
  if (filters.subject) query.subject = filters.subject;
  if (filters.difficulty) query.difficulty = filters.difficulty;
  if (filters.type) query.type = filters.type;
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .populate('createdBy', 'name email')
    .sort({ score: { $meta: 'textScore' }, updatedAt: -1 });
};

// Instance methods
questionSchema.methods.canEdit = function(userId, userRole, permissions = {}) {
  // Admin can edit anything
  if (userRole === 'admin') return true;
  
  // Owner can always edit their private questions
  if (this.scope === 'private' && this.createdBy.toString() === userId.toString()) {
    return true;
  }
  
  // For shared questions, check permissions
  if (this.scope === 'shared') {
    if (permissions.isOwner) return true;
    if (permissions.canEdit && this.status !== 'approved') return true;
  }
  
  return false;
};

questionSchema.methods.canDelete = function(userId, userRole, permissions = {}) {
  // Admin can delete anything
  if (userRole === 'admin') return true;
  
  // Owner can delete their private questions
  if (this.scope === 'private' && this.createdBy.toString() === userId.toString()) {
    return true;
  }
  
  // For shared questions, only owners can delete
  if (this.scope === 'shared' && permissions.isOwner) {
    return true;
  }
  
  return false;
};

const Question = mongoose.model('Question', questionSchema);

export default Question;
