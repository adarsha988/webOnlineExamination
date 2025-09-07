import mongoose from 'mongoose';

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 1000
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  course: {
    type: String,
    trim: true
  },
  duration: {
    type: Number,
    required: true,
    min: 5,
    max: 480 // 8 hours max
  },
  totalMarks: {
    type: Number,
    required: true,
    min: 1
  },
  passingMarks: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Scheduling
  timing: {
    scheduledDate: {
      type: Date,
      required: true,
      index: true
    },
    endDate: {
      type: Date,
      required: true
    },
    timeZone: {
      type: String,
      default: 'UTC'
    },
    bufferTime: {
      type: Number,
      default: 10 // minutes before/after
    }
  },
  
  // Questions
  questions: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    marks: {
      type: Number,
      required: true,
      min: 0.5
    },
    order: {
      type: Number,
      required: true
    },
    timeLimit: Number, // override question time limit
    mandatory: {
      type: Boolean,
      default: true
    }
  }],
  
  // AI Proctoring Configuration
  proctoring: {
    enabled: {
      type: Boolean,
      default: true
    },
    strictnessLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'maximum'],
      default: 'medium'
    },
    
    // Face detection settings
    faceDetection: {
      enabled: {
        type: Boolean,
        default: true
      },
      requireFaceMatch: {
        type: Boolean,
        default: true
      },
      allowMultipleFaces: {
        type: Boolean,
        default: false
      },
      faceMatchThreshold: {
        type: Number,
        min: 0.5,
        max: 1.0,
        default: 0.8
      }
    },
    
    // Gaze tracking settings
    gazeTracking: {
      enabled: {
        type: Boolean,
        default: true
      },
      allowedLookAwayTime: {
        type: Number,
        default: 5 // seconds
      },
      maxLookAwayCount: {
        type: Number,
        default: 3
      }
    },
    
    // Audio monitoring
    audioMonitoring: {
      enabled: {
        type: Boolean,
        default: true
      },
      detectMultipleVoices: {
        type: Boolean,
        default: true
      },
      backgroundNoiseThreshold: {
        type: Number,
        default: 0.3
      }
    },
    
    // Browser monitoring
    browserMonitoring: {
      enabled: {
        type: Boolean,
        default: true
      },
      allowTabSwitch: {
        type: Boolean,
        default: false
      },
      maxTabSwitches: {
        type: Number,
        default: 0
      },
      blockRightClick: {
        type: Boolean,
        default: true
      },
      blockCopyPaste: {
        type: Boolean,
        default: true
      },
      blockDevTools: {
        type: Boolean,
        default: true
      },
      requireFullscreen: {
        type: Boolean,
        default: true
      }
    },
    
    // Violation thresholds
    violationThresholds: {
      autoTerminate: {
        criticalViolations: {
          type: Number,
          default: 3
        },
        totalViolations: {
          type: Number,
          default: 10
        }
      },
      warningLevels: {
        first: {
          type: Number,
          default: 2
        },
        final: {
          type: Number,
          default: 5
        }
      }
    },
    
    // Recording settings
    recording: {
      video: {
        enabled: {
          type: Boolean,
          default: true
        },
        quality: {
          type: String,
          enum: ['low', 'medium', 'high'],
          default: 'medium'
        },
        fps: {
          type: Number,
          default: 15
        }
      },
      audio: {
        enabled: {
          type: Boolean,
          default: true
        },
        quality: {
          type: String,
          enum: ['low', 'medium', 'high'],
          default: 'medium'
        }
      },
      screen: {
        enabled: {
          type: Boolean,
          default: false
        },
        interval: {
          type: Number,
          default: 30 // seconds
        }
      }
    }
  },
  
  // Access control
  access: {
    assignedStudents: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    allowLateSubmission: {
      type: Boolean,
      default: false
    },
    lateSubmissionPenalty: {
      type: Number,
      min: 0,
      max: 100,
      default: 10 // percentage
    },
    maxAttempts: {
      type: Number,
      min: 1,
      max: 10,
      default: 1
    },
    shuffleQuestions: {
      type: Boolean,
      default: false
    },
    shuffleOptions: {
      type: Boolean,
      default: false
    }
  },
  
  // Exam settings
  settings: {
    showResults: {
      type: String,
      enum: ['immediately', 'after_exam', 'manual', 'never'],
      default: 'after_exam'
    },
    showCorrectAnswers: {
      type: Boolean,
      default: false
    },
    allowReview: {
      type: Boolean,
      default: true
    },
    autoSave: {
      enabled: {
        type: Boolean,
        default: true
      },
      interval: {
        type: Number,
        default: 30 // seconds
      }
    },
    navigation: {
      allowBackward: {
        type: Boolean,
        default: true
      },
      allowSkip: {
        type: Boolean,
        default: true
      },
      showProgress: {
        type: Boolean,
        default: true
      }
    }
  },
  
  // Ownership and status
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  instructors: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['primary', 'assistant', 'observer'],
      default: 'assistant'
    },
    permissions: {
      canEdit: Boolean,
      canGrade: Boolean,
      canViewReports: Boolean
    }
  }],
  
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'ongoing', 'completed', 'cancelled', 'archived'],
    default: 'draft',
    index: true
  },
  
  // Analytics and insights
  analytics: {
    totalAttempts: {
      type: Number,
      default: 0
    },
    completedAttempts: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    averageTime: {
      type: Number,
      default: 0
    },
    passRate: {
      type: Number,
      default: 0
    },
    difficultyRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    cheatingIncidents: {
      type: Number,
      default: 0
    },
    suspiciousAttempts: {
      type: Number,
      default: 0
    }
  },
  
  // AI insights
  aiInsights: {
    performancePrediction: {
      expectedPassRate: Number,
      confidence: Number,
      factors: [String]
    },
    cheatingRiskAssessment: {
      riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
      },
      riskFactors: [String],
      recommendations: [String]
    },
    questionAnalysis: [{
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
      },
      difficulty: Number,
      discrimination: Number,
      timeAnalysis: {
        average: Number,
        median: Number,
        outliers: Number
      }
    }]
  },
  
  // Notifications and communication
  notifications: {
    beforeExam: [{
      time: Number, // minutes before
      message: String,
      sent: Boolean
    }],
    duringExam: [{
      trigger: String,
      message: String,
      enabled: Boolean
    }],
    afterExam: [{
      trigger: String,
      message: String,
      enabled: Boolean
    }]
  },
  
  // Backup and recovery
  backup: {
    autoBackup: {
      type: Boolean,
      default: true
    },
    backupInterval: {
      type: Number,
      default: 300 // seconds
    },
    lastBackup: Date
  },
  
  // Metadata
  metadata: {
    version: {
      type: Number,
      default: 1
    },
    tags: [String],
    category: String,
    department: String,
    semester: String,
    academicYear: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Indexes for performance
examSchema.index({ createdBy: 1, status: 1 });
examSchema.index({ 'timing.scheduledDate': 1, status: 1 });
examSchema.index({ 'access.assignedStudents': 1 });
examSchema.index({ subject: 1, status: 1 });

// Virtual for exam duration in human readable format
examSchema.virtual('durationFormatted').get(function() {
  const hours = Math.floor(this.duration / 60);
  const minutes = this.duration % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
});

// Virtual for current status based on timing
examSchema.virtual('currentStatus').get(function() {
  const now = new Date();
  const start = this.timing.scheduledDate;
  const end = this.timing.endDate;
  
  if (this.status === 'cancelled' || this.status === 'archived') return this.status;
  if (now < start) return 'upcoming';
  if (now >= start && now <= end) return 'ongoing';
  if (now > end) return 'completed';
  return this.status;
});

// Virtual for time remaining
examSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  const end = this.timing.endDate;
  
  if (now >= end) return 0;
  return Math.max(0, Math.floor((end - now) / 1000));
});

// Pre-save middleware
examSchema.pre('save', function(next) {
  // Auto-calculate end date if not provided
  if (!this.timing.endDate && this.timing.scheduledDate) {
    this.timing.endDate = new Date(
      this.timing.scheduledDate.getTime() + (this.duration * 60 * 1000)
    );
  }
  
  // Validate passing marks
  if (this.passingMarks > this.totalMarks) {
    return next(new Error('Passing marks cannot exceed total marks'));
  }
  
  // Calculate total marks from questions
  if (this.questions && this.questions.length > 0) {
    const calculatedTotal = this.questions.reduce((sum, q) => sum + q.marks, 0);
    if (Math.abs(calculatedTotal - this.totalMarks) > 0.01) {
      this.totalMarks = calculatedTotal;
    }
  }
  
  next();
});

// Instance methods
examSchema.methods.canStart = function(userId) {
  const now = new Date();
  const start = this.timing.scheduledDate;
  const bufferStart = new Date(start.getTime() - (this.timing.bufferTime * 60 * 1000));
  
  return (
    this.status === 'published' &&
    now >= bufferStart &&
    this.access.assignedStudents.includes(userId)
  );
};

examSchema.methods.isActive = function() {
  const now = new Date();
  return (
    this.status === 'ongoing' ||
    (now >= this.timing.scheduledDate && now <= this.timing.endDate)
  );
};

examSchema.methods.addAttempt = function(userId, attemptData) {
  this.analytics.totalAttempts += 1;
  
  if (attemptData.status === 'completed') {
    this.analytics.completedAttempts += 1;
    
    // Update averages
    const totalScore = this.analytics.averageScore * (this.analytics.completedAttempts - 1) + attemptData.score;
    this.analytics.averageScore = totalScore / this.analytics.completedAttempts;
    
    const totalTime = this.analytics.averageTime * (this.analytics.completedAttempts - 1) + attemptData.timeSpent;
    this.analytics.averageTime = totalTime / this.analytics.completedAttempts;
    
    // Update pass rate
    const passCount = attemptData.percentage >= (this.passingMarks / this.totalMarks * 100) ? 1 : 0;
    this.analytics.passRate = ((this.analytics.passRate * (this.analytics.completedAttempts - 1)) + passCount) / this.analytics.completedAttempts;
  }
  
  return this.save();
};

examSchema.methods.updateProctoringStats = function(violationData) {
  if (violationData.suspicious) {
    this.analytics.suspiciousAttempts += 1;
  }
  
  if (violationData.cheating) {
    this.analytics.cheatingIncidents += 1;
  }
  
  return this.save();
};

// Static methods
examSchema.statics.findByInstructor = function(instructorId, options = {}) {
  const query = {
    $or: [
      { createdBy: instructorId },
      { 'instructors.userId': instructorId }
    ]
  };
  
  if (options.status) query.status = options.status;
  if (options.subject) query.subject = options.subject;
  
  return this.find(query)
    .populate('createdBy', 'name email')
    .populate('questions.questionId')
    .sort(options.sort || { 'timing.scheduledDate': -1 });
};

examSchema.statics.findByStudent = function(studentId, options = {}) {
  const query = {
    'access.assignedStudents': studentId,
    status: { $in: ['published', 'ongoing', 'completed'] }
  };
  
  if (options.status) {
    if (options.status === 'upcoming') {
      query['timing.scheduledDate'] = { $gt: new Date() };
    } else if (options.status === 'ongoing') {
      const now = new Date();
      query['timing.scheduledDate'] = { $lte: now };
      query['timing.endDate'] = { $gte: now };
    } else if (options.status === 'completed') {
      query['timing.endDate'] = { $lt: new Date() };
    }
  }
  
  return this.find(query)
    .populate('createdBy', 'name email')
    .sort({ 'timing.scheduledDate': -1 });
};

examSchema.statics.getAnalytics = function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: null,
        totalExams: { $sum: 1 },
        totalAttempts: { $sum: '$analytics.totalAttempts' },
        averageScore: { $avg: '$analytics.averageScore' },
        averagePassRate: { $avg: '$analytics.passRate' },
        totalCheatingIncidents: { $sum: '$analytics.cheatingIncidents' },
        byStatus: {
          $push: {
            status: '$status',
            count: 1
          }
        }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

// Check if model already exists to avoid overwrite error
const Exam = mongoose.models.Exam || mongoose.model('Exam', examSchema);

export default Exam;
