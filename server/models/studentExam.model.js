import mongoose from 'mongoose';

const studentExamSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
    index: true
  },
  studentId: {
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
      type: mongoose.Schema.Types.Mixed // String or Array for multiple answers
    },
    isCorrect: {
      type: Boolean,
      default: null
    },
    marksObtained: {
      type: Number,
      default: 0
    },
    timeSpent: {
      type: Number, // in seconds
      default: 0
    }
  }],
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'submitted', 'auto_submitted'],
    default: 'not_started',
    index: true
  },
  score: {
    type: Number,
    default: null
  },
  percentage: {
    type: Number,
    default: null
  },
  grade: {
    type: String,
    default: null
  },
  feedback: {
    type: String,
    default: null
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  gradedAt: {
    type: Date,
    default: null
  },
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
  lastSavedAt: {
    type: Date,
    default: Date.now
  },
  sessionData: {
    ipAddress: String,
    userAgent: String,
    browserFingerprint: String
  },
  violations: [{
    type: {
      type: String,
      enum: ['tab_switch', 'window_blur', 'copy_paste', 'right_click', 'dev_tools']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: String
  }],
  isLocked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
studentExamSchema.index({ studentId: 1, examId: 1 }, { unique: true });
studentExamSchema.index({ studentId: 1, status: 1, createdAt: -1 });
studentExamSchema.index({ examId: 1, status: 1 });
studentExamSchema.index({ submittedAt: -1 });

// Virtual for calculating time elapsed
studentExamSchema.virtual('timeElapsed').get(function() {
  if (!this.startedAt) return 0;
  const endTime = this.submittedAt || new Date();
  return Math.floor((endTime - this.startedAt) / 1000); // in seconds
});

// Virtual for pass/fail status
studentExamSchema.virtual('isPassed').get(function() {
  if (this.score === null || this.score === undefined) return null;
  // Will be calculated based on exam's passing marks
  return this.percentage >= 40; // Default 40% pass rate
});

// Pre-save middleware
studentExamSchema.pre('save', function(next) {
  // Update lastSavedAt when answers are modified
  if (this.isModified('answers')) {
    this.lastSavedAt = new Date();
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

// Static methods
studentExamSchema.statics.findByStudent = function(studentId, options = {}) {
  const query = { studentId };
  
  if (options.status) query.status = options.status;
  if (options.examId) query.examId = options.examId;
  
  return this.find(query)
    .populate('examId', 'title subject duration totalMarks passingMarks scheduledDate endDate status')
    .populate('studentId', 'name email')
    .sort(options.sort || { createdAt: -1 });
};

studentExamSchema.statics.findByExam = function(examId, options = {}) {
  const query = { examId };
  
  if (options.status) query.status = options.status;
  if (options.studentId) query.studentId = options.studentId;
  
  return this.find(query)
    .populate('studentId', 'name email')
    .populate('examId', 'title subject duration totalMarks passingMarks')
    .sort(options.sort || { submittedAt: -1 });
};

// Instance methods
studentExamSchema.methods.canStart = function() {
  return this.status === 'not_started' && !this.isLocked;
};

studentExamSchema.methods.canResume = function() {
  return this.status === 'in_progress' && !this.isLocked;
};

studentExamSchema.methods.canSubmit = function() {
  return ['in_progress'].includes(this.status) && !this.isLocked;
};

studentExamSchema.methods.calculateScore = async function() {
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
      case 'truefalse':
        isCorrect = answer.answer === question.correctAnswer;
        break;
      case 'short':
        // Simple string comparison (case-insensitive)
        isCorrect = answer.answer?.toLowerCase().trim() === 
                   question.correctAnswer?.toLowerCase().trim();
        break;
      case 'long':
        // For long answers, manual grading is required
        // For now, mark as correct if answer exists
        isCorrect = answer.answer && answer.answer.trim().length > 0;
        break;
    }
    
    answer.isCorrect = isCorrect;
    answer.marksObtained = isCorrect ? (question.marks || 1) : 0;
    totalScore += answer.marksObtained;
  }
  
  this.score = totalScore;
  this.percentage = exam.totalMarks ? Math.round((totalScore / exam.totalMarks) * 100) : 0;
  
  // Assign grade based on percentage
  if (this.percentage >= 90) this.grade = 'A+';
  else if (this.percentage >= 80) this.grade = 'A';
  else if (this.percentage >= 70) this.grade = 'B+';
  else if (this.percentage >= 60) this.grade = 'B';
  else if (this.percentage >= 50) this.grade = 'C+';
  else if (this.percentage >= 40) this.grade = 'C';
  else this.grade = 'F';
  
  this.gradedAt = new Date();
  
  return this.save();
};

studentExamSchema.methods.addViolation = function(type, details = '') {
  this.violations.push({
    type,
    details,
    timestamp: new Date()
  });
  return this.save();
};

const StudentExam = mongoose.model('StudentExam', studentExamSchema);

export default StudentExam;
