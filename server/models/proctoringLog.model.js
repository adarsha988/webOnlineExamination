import mongoose from 'mongoose';

const proctoringLogSchema = new mongoose.Schema({
  attemptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attempt',
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  eventType: {
    type: String,
    enum: [
      // Face detection events
      'no_face',
      'multiple_faces', 
      'face_mismatch',
      'face_obscured',
      'face_too_small',
      'face_too_far',
      
      // Gaze and attention events
      'gaze_away',
      'look_away_extended',
      'eyes_closed',
      'head_turn_left',
      'head_turn_right',
      'head_down',
      'head_up',
      
      // Browser and system events
      'tab_switch',
      'window_blur',
      'window_focus',
      'fullscreen_exit',
      'fullscreen_enter',
      'page_visibility_hidden',
      'page_visibility_visible',
      
      // Audio events
      'multiple_voices',
      'suspicious_audio',
      'audio_level_spike',
      'background_noise',
      'voice_mismatch',
      
      // Input events
      'copy_paste',
      'right_click',
      'keyboard_shortcut',
      'dev_tools_open',
      'dev_tools_close',
      
      // Network and system
      'network_change',
      'screen_share_detected',
      'external_device',
      'virtual_machine',
      
      // Behavioral anomalies
      'typing_pattern_anomaly',
      'mouse_pattern_anomaly',
      'time_anomaly',
      'answer_pattern_anomaly',
      
      // System events
      'session_start',
      'session_end',
      'heartbeat',
      'calibration',
      'warning_issued',
      'violation_recorded'
    ],
    required: true,
    index: true
  },
  severity: {
    type: String,
    enum: ['info', 'low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  metadata: {
    // Face detection data
    faceData: {
      confidence: Number,
      boundingBox: {
        x: Number,
        y: Number,
        width: Number,
        height: Number
      },
      landmarks: mongoose.Schema.Types.Mixed,
      descriptor: [Number],
      expressions: mongoose.Schema.Types.Mixed
    },
    
    // Gaze tracking data
    gazeData: {
      x: Number,
      y: Number,
      confidence: Number,
      direction: String, // 'left', 'right', 'up', 'down', 'center'
      duration: Number // seconds looking away
    },
    
    // Audio analysis data
    audioData: {
      volume: Number,
      frequency: Number,
      voiceCount: Number,
      confidence: Number,
      duration: Number
    },
    
    // Browser/system data
    systemData: {
      windowTitle: String,
      url: String,
      activeElement: String,
      keyPressed: String,
      mousePosition: { x: Number, y: Number },
      screenResolution: String,
      browserInfo: mongoose.Schema.Types.Mixed
    },
    
    // Behavioral analysis
    behaviorData: {
      typingSpeed: Number,
      mouseMovements: Number,
      clickPattern: String,
      timeSpentOnQuestion: Number,
      answerChangeCount: Number,
      confidenceScore: Number
    },
    
    // AI analysis results
    aiAnalysis: {
      anomalyScore: Number,
      patternMatch: String,
      recommendation: String,
      confidence: Number,
      modelVersion: String
    }
  },
  media: {
    screenshotUrl: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
        },
        message: 'Screenshot URL must be a valid image URL'
      }
    },
    audioUrl: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/.+\.(mp3|wav|ogg|m4a)$/i.test(v);
        },
        message: 'Audio URL must be a valid audio file URL'
      }
    },
    videoUrl: String,
    thumbnailUrl: String
  },
  processing: {
    processed: {
      type: Boolean,
      default: false
    },
    processedAt: Date,
    processingTime: Number, // milliseconds
    aiProcessed: {
      type: Boolean,
      default: false
    },
    aiProcessedAt: Date,
    retryCount: {
      type: Number,
      default: 0
    },
    errors: [String]
  },
  context: {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    questionNumber: Number,
    timeIntoExam: Number, // seconds since exam start
    timeRemainingInExam: Number, // seconds remaining
    currentAnswer: String,
    previousEvents: [String] // recent event types for pattern analysis
  },
  flags: {
    reviewed: {
      type: Boolean,
      default: false
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    reviewNotes: String,
    falsePositive: {
      type: Boolean,
      default: false
    },
    escalated: {
      type: Boolean,
      default: false
    },
    escalatedAt: Date,
    escalatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Indexes for efficient queries
proctoringLogSchema.index({ attemptId: 1, timestamp: -1 });
proctoringLogSchema.index({ eventType: 1, severity: 1 });
proctoringLogSchema.index({ timestamp: -1 });
proctoringLogSchema.index({ 'processing.processed': 1 });
proctoringLogSchema.index({ 'flags.reviewed': 1 });

// Virtual for time since event
proctoringLogSchema.virtual('timeSinceEvent').get(function() {
  return Math.floor((new Date() - this.timestamp) / 1000);
});

// Virtual for event category
proctoringLogSchema.virtual('category').get(function() {
  const faceEvents = ['no_face', 'multiple_faces', 'face_mismatch', 'face_obscured'];
  const gazeEvents = ['gaze_away', 'look_away_extended', 'eyes_closed'];
  const systemEvents = ['tab_switch', 'window_blur', 'fullscreen_exit'];
  const audioEvents = ['multiple_voices', 'suspicious_audio', 'voice_mismatch'];
  const inputEvents = ['copy_paste', 'right_click', 'dev_tools_open'];
  
  if (faceEvents.includes(this.eventType)) return 'face';
  if (gazeEvents.includes(this.eventType)) return 'gaze';
  if (systemEvents.includes(this.eventType)) return 'system';
  if (audioEvents.includes(this.eventType)) return 'audio';
  if (inputEvents.includes(this.eventType)) return 'input';
  return 'other';
});

// Pre-save middleware
proctoringLogSchema.pre('save', function(next) {
  // Set processing flags based on event type
  if (this.isNew) {
    const autoProcessEvents = ['heartbeat', 'session_start', 'session_end'];
    if (autoProcessEvents.includes(this.eventType)) {
      this.processing.processed = true;
      this.processing.processedAt = new Date();
    }
  }
  
  next();
});

// Instance methods
proctoringLogSchema.methods.markAsProcessed = function(processingTime = 0) {
  this.processing.processed = true;
  this.processing.processedAt = new Date();
  this.processing.processingTime = processingTime;
  return this.save();
};

proctoringLogSchema.methods.markAsReviewed = function(reviewerId, notes = '') {
  this.flags.reviewed = true;
  this.flags.reviewedBy = reviewerId;
  this.flags.reviewedAt = new Date();
  this.flags.reviewNotes = notes;
  return this.save();
};

proctoringLogSchema.methods.escalate = function(escalatedTo) {
  this.flags.escalated = true;
  this.flags.escalatedAt = new Date();
  this.flags.escalatedTo = escalatedTo;
  return this.save();
};

// Static methods
proctoringLogSchema.statics.findByAttempt = function(attemptId, options = {}) {
  const query = { attemptId };
  
  if (options.eventType) query.eventType = options.eventType;
  if (options.severity) query.severity = options.severity;
  if (options.category) {
    // Filter by event category
    const categoryMap = {
      face: ['no_face', 'multiple_faces', 'face_mismatch', 'face_obscured'],
      gaze: ['gaze_away', 'look_away_extended', 'eyes_closed'],
      system: ['tab_switch', 'window_blur', 'fullscreen_exit'],
      audio: ['multiple_voices', 'suspicious_audio', 'voice_mismatch'],
      input: ['copy_paste', 'right_click', 'dev_tools_open']
    };
    if (categoryMap[options.category]) {
      query.eventType = { $in: categoryMap[options.category] };
    }
  }
  
  return this.find(query)
    .sort(options.sort || { timestamp: -1 })
    .limit(options.limit || 100);
};

proctoringLogSchema.statics.getViolationSummary = function(attemptId) {
  return this.aggregate([
    { $match: { attemptId: mongoose.Types.ObjectId(attemptId) } },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
        severities: { $push: '$severity' },
        firstOccurrence: { $min: '$timestamp' },
        lastOccurrence: { $max: '$timestamp' }
      }
    },
    {
      $project: {
        eventType: '$_id',
        count: 1,
        highSeverityCount: {
          $size: {
            $filter: {
              input: '$severities',
              cond: { $in: ['$$this', ['high', 'critical']] }
            }
          }
        },
        firstOccurrence: 1,
        lastOccurrence: 1
      }
    },
    { $sort: { count: -1 } }
  ]);
};

proctoringLogSchema.statics.getUnprocessedLogs = function(limit = 100) {
  return this.find({
    'processing.processed': false,
    'processing.retryCount': { $lt: 3 }
  })
  .sort({ timestamp: 1 })
  .limit(limit);
};

proctoringLogSchema.statics.getRecentViolations = function(hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return this.find({
    timestamp: { $gte: since },
    severity: { $in: ['high', 'critical'] }
  })
  .populate('attemptId', 'userId examId')
  .sort({ timestamp: -1 });
};

// Check if model already exists to avoid overwrite error
const ProctoringLog = mongoose.models.ProctoringLog || mongoose.model('ProctoringLog', proctoringLogSchema);

export default ProctoringLog;
