import mongoose from 'mongoose';

const attemptSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    answer: {
      type: mongoose.Schema.Types.Mixed, // String, Array, or Object for different question types
      default: null
    },
    isCorrect: {
      type: Boolean,
      default: null
    },
    marksObtained: {
      type: Number,
      default: 0,
      min: 0
    },
    timeSpent: {
      type: Number, // in seconds
      default: 0,
      min: 0
    },
    confidence: {
      type: Number, // AI confidence in answer correctness (0-1)
      default: null,
      min: 0,
      max: 1
    },
    flagged: {
      type: Boolean,
      default: false
    },
    flagReason: {
      type: String,
      enum: ['suspicious_timing', 'pattern_anomaly', 'proctoring_violation', 'manual_review'],
      default: null
    }
  }],
  score: {
    type: Number,
    default: null,
    min: 0
  },
  percentage: {
    type: Number,
    default: null,
    min: 0,
    max: 100
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'],
    default: null
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'submitted', 'auto_submitted', 'terminated', 'under_review'],
    default: 'not_started',
    index: true
  },
  timing: {
    startedAt: {
      type: Date,
      default: null
    },
    submittedAt: {
      type: Date,
      default: null
    },
    timeRemaining: {
      type: Number, // in seconds
      default: null
    },
    totalTimeSpent: {
      type: Number, // in seconds
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  proctoring: {
    enabled: {
      type: Boolean,
      default: true
    },
    violations: [{
      type: {
        type: String,
        enum: ['no_face', 'multiple_faces', 'face_mismatch', 'gaze_away', 'tab_switch', 'window_blur', 'multiple_voices', 'suspicious_audio', 'screen_share', 'external_device', 'copy_paste', 'right_click', 'dev_tools', 'fullscreen_exit'],
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
      },
      description: String,
      screenshotUrl: String,
      audioUrl: String,
      metadata: mongoose.Schema.Types.Mixed
    }],
    proctoringLogs: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProctoringLog'
    }],
    suspicionScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    integrityRating: {
      type: String,
      enum: ['high', 'medium', 'low', 'compromised'],
      default: 'high'
    },
    aiAnalysis: {
      behaviorPattern: String,
      anomalies: [String],
      confidence: {
        type: Number,
        min: 0,
        max: 1
      },
      recommendation: {
        type: String,
        enum: ['accept', 'review', 'reject', 'retest']
      }
    }
  },
  session: {
    ipAddress: String,
    userAgent: String,
    browserFingerprint: String,
    screenResolution: String,
    deviceInfo: {
      platform: String,
      browser: String,
      version: String,
      mobile: Boolean
    },
    location: {
      country: String,
      region: String,
      city: String,
      timezone: String
    }
  },
  feedback: {
    studentFeedback: String,
    instructorNotes: String,
    systemRecommendations: [String],
    reviewRequired: {
      type: Boolean,
      default: false
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date
  },
  metadata: {
    version: {
      type: Number,
      default: 1
    },
    migrated: {
      type: Boolean,
      default: false
    },
    tags: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Compound indexes for efficient queries
attemptSchema.index({ userId: 1, examId: 1 }, { unique: true });
attemptSchema.index({ userId: 1, status: 1, createdAt: -1 });
attemptSchema.index({ examId: 1, status: 1 });
attemptSchema.index({ 'timing.submittedAt': -1 });
attemptSchema.index({ 'proctoring.suspicionScore': -1 });

// Virtual for time elapsed
attemptSchema.virtual('timeElapsed').get(function() {
  if (!this.timing.startedAt) return 0;
  const endTime = this.timing.submittedAt || new Date();
  return Math.floor((endTime - this.timing.startedAt) / 1000);
});

// Virtual for pass/fail status
attemptSchema.virtual('isPassed').get(function() {
  if (this.percentage === null || this.percentage === undefined) return null;
  return this.percentage >= 40; // Default 40% pass rate
});

// Virtual for violation count
attemptSchema.virtual('violationCount').get(function() {
  return this.proctoring.violations.length;
});

// Virtual for critical violations
attemptSchema.virtual('criticalViolations').get(function() {
  return this.proctoring.violations.filter(v => v.severity === 'critical').length;
});

// Pre-save middleware
attemptSchema.pre('save', function(next) {
  // Update last activity
  this.timing.lastActivity = new Date();
  
  // Calculate suspicion score based on violations
  if (this.proctoring.violations.length > 0) {
    const severityWeights = { low: 1, medium: 3, high: 7, critical: 15 };
    const totalScore = this.proctoring.violations.reduce((sum, violation) => {
      return sum + severityWeights[violation.severity];
    }, 0);
    
    this.proctoring.suspicionScore = Math.min(100, totalScore);
    
    // Update integrity rating
    if (this.proctoring.suspicionScore >= 50) {
      this.proctoring.integrityRating = 'compromised';
    } else if (this.proctoring.suspicionScore >= 25) {
      this.proctoring.integrityRating = 'low';
    } else if (this.proctoring.suspicionScore >= 10) {
      this.proctoring.integrityRating = 'medium';
    } else {
      this.proctoring.integrityRating = 'high';
    }
  }
  
  // Calculate percentage if score is available
  if (this.score !== null && this.populated('examId')) {
    const exam = this.examId;
    if (exam && exam.totalMarks) {
      this.percentage = Math.round((this.score / exam.totalMarks) * 100);
    }
  }
  
  next();
});

// Instance methods
attemptSchema.methods.canStart = function() {
  return this.status === 'not_started';
};

attemptSchema.methods.canResume = function() {
  return this.status === 'in_progress';
};

attemptSchema.methods.canSubmit = function() {
  return ['in_progress'].includes(this.status);
};

attemptSchema.methods.addViolation = function(type, severity = 'medium', description = '', metadata = {}) {
  this.proctoring.violations.push({
    type,
    severity,
    description,
    metadata,
    timestamp: new Date()
  });
  
  // Auto-terminate if too many critical violations
  const criticalCount = this.proctoring.violations.filter(v => v.severity === 'critical').length;
  if (criticalCount >= 3) {
    this.status = 'terminated';
    this.timing.submittedAt = new Date();
  }
  
  return this.save();
};

attemptSchema.methods.calculateScore = async function() {
  if (!this.populated('examId')) {
    await this.populate('examId');
  }
  
  let totalScore = 0;
  const exam = this.examId;
  
  // Populate questions to get correct answers and marks
  await this.populate('answers.questionId');
  
  for (const answer of this.answers) {
    const question = answer.questionId;
    if (!question) continue;
    
    let isCorrect = false;
    
    // Check answer based on question type
    switch (question.type) {
      case 'mcq':
        isCorrect = answer.answer === question.correctAnswer;
        break;
      case 'short':
        // Simple string comparison (case-insensitive)
        isCorrect = answer.answer?.toLowerCase().trim() === 
                   question.correctAnswer?.toLowerCase().trim();
        break;
      case 'coding':
        // For coding questions, manual grading is required
        // For now, mark as correct if answer exists and not flagged
        isCorrect = answer.answer && answer.answer.trim().length > 0 && !answer.flagged;
        break;
    }
    
    answer.isCorrect = isCorrect;
    answer.marksObtained = isCorrect ? (question.marks || 1) : 0;
    totalScore += answer.marksObtained;
  }
  
  this.score = totalScore;
  this.percentage = exam.totalMarks ? Math.round((totalScore / exam.totalMarks) * 100) : 0;
  
  // Assign grade based on percentage
  if (this.percentage >= 95) this.grade = 'A+';
  else if (this.percentage >= 90) this.grade = 'A';
  else if (this.percentage >= 85) this.grade = 'A-';
  else if (this.percentage >= 80) this.grade = 'B+';
  else if (this.percentage >= 75) this.grade = 'B';
  else if (this.percentage >= 70) this.grade = 'B-';
  else if (this.percentage >= 65) this.grade = 'C+';
  else if (this.percentage >= 60) this.grade = 'C';
  else if (this.percentage >= 55) this.grade = 'C-';
  else if (this.percentage >= 50) this.grade = 'D+';
  else if (this.percentage >= 40) this.grade = 'D';
  else this.grade = 'F';
  
  return this.save();
};

// Static methods
attemptSchema.statics.findByStudent = function(userId, options = {}) {
  const query = { userId };
  
  if (options.status) query.status = options.status;
  if (options.examId) query.examId = options.examId;
  
  return this.find(query)
    .populate('examId', 'title subject duration totalMarks passingMarks timing.scheduledDate timing.endDate status')
    .populate('userId', 'name email profile.studentId')
    .sort(options.sort || { createdAt: -1 });
};

attemptSchema.statics.findByExam = function(examId, options = {}) {
  const query = { examId };
  
  if (options.status) query.status = options.status;
  if (options.userId) query.userId = options.userId;
  
  return this.find(query)
    .populate('userId', 'name email profile.studentId')
    .populate('examId', 'title subject duration totalMarks passingMarks')
    .sort(options.sort || { 'timing.submittedAt': -1 });
};

attemptSchema.statics.getSuspiciousAttempts = function(threshold = 25) {
  return this.find({
    'proctoring.suspicionScore': { $gte: threshold },
    status: { $in: ['submitted', 'auto_submitted', 'terminated'] }
  })
  .populate('userId', 'name email')
  .populate('examId', 'title subject')
  .sort({ 'proctoring.suspicionScore': -1 });
};

// Check if model already exists to avoid overwrite error
const Attempt = mongoose.models.Attempt || mongoose.model('Attempt', attemptSchema);

export default Attempt;
