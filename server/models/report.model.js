import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['usage-analytics', 'academic-performance', 'security-audit', 'user-activity', 'exam-statistics'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dateRange: {
    startDate: Date,
    endDate: Date
  },
  status: {
    type: String,
    enum: ['generating', 'completed', 'failed'],
    default: 'completed'
  },
  fileUrl: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
reportSchema.index({ type: 1, createdAt: -1 });
reportSchema.index({ generatedBy: 1 });
reportSchema.index({ createdAt: -1 });

export default mongoose.model('Report', reportSchema);
