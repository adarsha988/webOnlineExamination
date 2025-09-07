import mongoose from 'mongoose';

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: Number, // in minutes
    required: true,
    min: 1
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
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'ongoing', 'completed', 'upcoming', 'inactive'],
    default: 'draft'
  },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  examDate: {
    type: Date,
    default: null
  },
  scheduledDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  },
  assignedStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  attempts: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    score: Number,
    startTime: Date,
    endTime: Date,
    answers: [{
      questionId: mongoose.Schema.Types.ObjectId,
      answer: String,
      isCorrect: Boolean
    }]
  }],
  settings: {
    allowRetake: {
      type: Boolean,
      default: false
    },
    showResults: {
      type: Boolean,
      default: true
    },
    randomizeQuestions: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
examSchema.index({ createdBy: 1 });
examSchema.index({ status: 1 });
examSchema.index({ scheduledDate: 1 });

export default mongoose.model('Exam', examSchema);
