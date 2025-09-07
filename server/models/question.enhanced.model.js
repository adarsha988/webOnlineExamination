import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  type: {
    type: String,
    enum: ['mcq', 'short', 'long', 'coding', 'essay', 'true_false', 'fill_blank', 'matching'],
    required: true,
    index: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  topic: {
    type: String,
    trim: true,
    index: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'expert'],
    default: 'medium',
    index: true
  },
  marks: {
    type: Number,
    required: true,
    min: 0.5,
    max: 100,
    default: 1
  },
  timeLimit: {
    type: Number, // in seconds
    min: 30,
    max: 3600,
    default: 120
  },
  
  // Question content based on type
  options: [{
    text: {
      type: String,
      required: true,
      maxlength: 500
    },
    isCorrect: {
      type: Boolean,
      default: false
    },
    explanation: {
      type: String,
      maxlength: 300
    }
  }],
  
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed, // String, Array, or Object
    required: function() {
      return ['mcq', 'short', 'true_false', 'fill_blank'].includes(this.type);
    }
  },
  
  sampleAnswer: {
    type: String,
    maxlength: 1000
  },
  
  explanation: {
    type: String,
    maxlength: 1000
  },
  
  hints: [{
    text: String,
    penalty: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.1 // 10% penalty for using hint
    }
  }],
  
  // AI Proctoring specific fields
  proctoring: {
    enabled: {
      type: Boolean,
      default: true
    },
    strictness: {
      type: String,
      enum: ['low', 'medium', 'high', 'maximum'],
      default: 'medium'
    },
    allowedViolations: {
      gazeAway: {
        type: Number,
        default: 3,
        min: 0,
        max: 10
      },
      tabSwitches: {
        type: Number,
        default: 1,
        min: 0,
        max: 5
      },
      faceNotVisible: {
        type: Number,
        default: 2,
        min: 0,
        max: 5
      }
    },
    behaviorAnalysis: {
      trackTypingPattern: {
        type: Boolean,
        default: true
      },
      trackMouseMovement: {
        type: Boolean,
        default: true
      },
      trackAnswerTime: {
        type: Boolean,
        default: true
      },
      detectCopyPaste: {
        type: Boolean,
        default: true
      }
    },
    expectedBehavior: {
      minTypingSpeed: {
        type: Number,
        default: 10 // words per minute
      },
      maxTypingSpeed: {
        type: Number,
        default: 120 // words per minute
      },
      expectedTimeRange: {
        min: Number, // minimum expected time in seconds
        max: Number  // maximum expected time in seconds
      },
      suspiciousPatterns: [String] // patterns that indicate cheating
    }
  },
  
  // Analytics and AI insights
  analytics: {
    totalAttempts: {
      type: Number,
      default: 0
    },
    correctAttempts: {
      type: Number,
      default: 0
    },
    averageTime: {
      type: Number,
      default: 0
    },
    difficultyRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    discriminationIndex: {
      type: Number,
      min: -1,
      max: 1,
      default: 0
    },
    commonMistakes: [{
      answer: String,
      frequency: Number,
      analysis: String
    }],
    performanceByDemographic: {
      byGender: mongoose.Schema.Types.Mixed,
      byAge: mongoose.Schema.Types.Mixed,
      byExperience: mongoose.Schema.Types.Mixed
    }
  },
  
  // AI-powered features
  aiFeatures: {
    autoGrading: {
      enabled: {
        type: Boolean,
        default: false
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1
      },
      model: String,
      lastUpdated: Date
    },
    plagiarismDetection: {
      enabled: {
        type: Boolean,
        default: true
      },
      threshold: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.8
      }
    },
    answerSimilarityCheck: {
      enabled: {
        type: Boolean,
        default: true
      },
      threshold: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.9
      }
    },
    semanticAnalysis: {
      keywords: [String],
      concepts: [String],
      bloomsTaxonomy: {
        type: String,
        enum: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']
      }
    }
  },
  
  // Ownership and sharing
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  scope: {
    type: String,
    enum: ['private', 'shared', 'public'],
    default: 'private',
    index: true
  },
  
  sharedWith: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['view', 'edit', 'admin'],
      default: 'view'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Version control
  version: {
    type: Number,
    default: 1
  },
  
  parentQuestion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  },
  
  changeLog: [{
    version: Number,
    changes: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Status and metadata
  status: {
    type: String,
    enum: ['draft', 'review', 'approved', 'published', 'archived'],
    default: 'draft',
    index: true
  },
  
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  metadata: {
    source: String,
    reference: String,
    copyright: String,
    language: {
      type: String,
      default: 'en'
    },
    accessibility: {
      screenReader: Boolean,
      highContrast: Boolean,
      largeText: Boolean
    }
  },
  
  // Usage tracking
  usage: {
    timesUsed: {
      type: Number,
      default: 0
    },
    lastUsed: Date,
    averageScore: {
      type: Number,
      min: 0,
      max: 100
    },
    flaggedCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Indexes for performance
questionSchema.index({ createdBy: 1, subject: 1, status: 1 });
questionSchema.index({ type: 1, difficulty: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ 'analytics.difficultyRating': 1 });
questionSchema.index({ 'usage.timesUsed': -1 });

// Virtual for success rate
questionSchema.virtual('successRate').get(function() {
  if (this.analytics.totalAttempts === 0) return 0;
  return (this.analytics.correctAttempts / this.analytics.totalAttempts) * 100;
});

// Virtual for difficulty assessment
questionSchema.virtual('actualDifficulty').get(function() {
  const successRate = this.successRate;
  if (successRate >= 80) return 'easy';
  if (successRate >= 60) return 'medium';
  if (successRate >= 40) return 'hard';
  return 'expert';
});

// Pre-save middleware
questionSchema.pre('save', function(next) {
  // Validate options for MCQ questions
  if (this.type === 'mcq') {
    if (!this.options || this.options.length < 2) {
      return next(new Error('MCQ questions must have at least 2 options'));
    }
    
    const correctOptions = this.options.filter(opt => opt.isCorrect);
    if (correctOptions.length === 0) {
      return next(new Error('MCQ questions must have at least one correct option'));
    }
  }
  
  // Set expected time range based on question type and difficulty
  if (!this.proctoring.expectedBehavior.expectedTimeRange) {
    const baseTime = this.timeLimit || 120;
    const difficultyMultiplier = {
      easy: 0.7,
      medium: 1.0,
      hard: 1.3,
      expert: 1.6
    };
    
    const multiplier = difficultyMultiplier[this.difficulty] || 1.0;
    this.proctoring.expectedBehavior.expectedTimeRange = {
      min: Math.floor(baseTime * multiplier * 0.3),
      max: Math.floor(baseTime * multiplier * 1.2)
    };
  }
  
  next();
});

// Instance methods
questionSchema.methods.canEdit = function(userId) {
  if (this.createdBy.toString() === userId.toString()) return true;
  
  const sharedUser = this.sharedWith.find(s => s.userId.toString() === userId.toString());
  return sharedUser && ['edit', 'admin'].includes(sharedUser.permission);
};

questionSchema.methods.canView = function(userId) {
  if (this.scope === 'public') return true;
  if (this.createdBy.toString() === userId.toString()) return true;
  
  return this.sharedWith.some(s => s.userId.toString() === userId.toString());
};

questionSchema.methods.updateAnalytics = function(isCorrect, timeSpent) {
  this.analytics.totalAttempts += 1;
  if (isCorrect) this.analytics.correctAttempts += 1;
  
  // Update average time
  const totalTime = this.analytics.averageTime * (this.analytics.totalAttempts - 1) + timeSpent;
  this.analytics.averageTime = totalTime / this.analytics.totalAttempts;
  
  // Update usage
  this.usage.timesUsed += 1;
  this.usage.lastUsed = new Date();
  
  return this.save();
};

questionSchema.methods.createVersion = function(changes, userId) {
  this.changeLog.push({
    version: this.version,
    changes,
    changedBy: userId
  });
  
  this.version += 1;
  return this.save();
};

// Static methods
questionSchema.statics.findByUser = function(userId, options = {}) {
  const query = {
    $or: [
      { createdBy: userId },
      { 'sharedWith.userId': userId },
      { scope: 'public' }
    ]
  };
  
  if (options.subject) query.subject = options.subject;
  if (options.type) query.type = options.type;
  if (options.difficulty) query.difficulty = options.difficulty;
  if (options.status) query.status = options.status;
  
  return this.find(query)
    .populate('createdBy', 'name email')
    .sort(options.sort || { updatedAt: -1 });
};

questionSchema.statics.getAnalytics = function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: null,
        totalQuestions: { $sum: 1 },
        averageDifficulty: { $avg: '$analytics.difficultyRating' },
        totalAttempts: { $sum: '$analytics.totalAttempts' },
        totalCorrect: { $sum: '$analytics.correctAttempts' },
        byType: {
          $push: {
            type: '$type',
            count: 1
          }
        },
        byDifficulty: {
          $push: {
            difficulty: '$difficulty',
            count: 1
          }
        }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

// Check if model already exists to avoid overwrite error
const Question = mongoose.models.Question || mongoose.model('Question', questionSchema);

export default Question;
