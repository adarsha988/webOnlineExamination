import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: 10
  },
  description: {
    type: String,
    maxlength: 500
  },
  headOfDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  instructors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  subjects: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    credits: {
      type: Number,
      default: 3,
      min: 1,
      max: 6
    },
    semester: {
      type: Number,
      min: 1,
      max: 8
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  establishedYear: {
    type: Number,
    min: 1900,
    max: new Date().getFullYear()
  },
  contactInfo: {
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    office: {
      type: String,
      trim: true
    }
  },
  metadata: {
    totalStudents: {
      type: Number,
      default: 0
    },
    totalInstructors: {
      type: Number,
      default: 0
    },
    totalSubjects: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes
departmentSchema.index({ name: 1 });
departmentSchema.index({ code: 1 });
departmentSchema.index({ isActive: 1 });
departmentSchema.index({ headOfDepartment: 1 });

// Virtual for student count
departmentSchema.virtual('studentCount').get(function() {
  return this.students ? this.students.length : 0;
});

// Virtual for instructor count
departmentSchema.virtual('instructorCount').get(function() {
  return this.instructors ? this.instructors.length : 0;
});

// Virtual for subject count
departmentSchema.virtual('subjectCount').get(function() {
  return this.subjects ? this.subjects.length : 0;
});

// Pre-save middleware to update metadata
departmentSchema.pre('save', function(next) {
  this.metadata.totalStudents = this.students ? this.students.length : 0;
  this.metadata.totalInstructors = this.instructors ? this.instructors.length : 0;
  this.metadata.totalSubjects = this.subjects ? this.subjects.length : 0;
  next();
});

// Static methods
departmentSchema.statics.findActive = function() {
  return this.find({ isActive: true })
    .populate('headOfDepartment', 'name email')
    .populate('instructors', 'name email')
    .sort({ name: 1 });
};

departmentSchema.statics.findByInstructor = function(instructorId) {
  return this.find({ instructors: instructorId })
    .populate('headOfDepartment', 'name email')
    .sort({ name: 1 });
};

departmentSchema.statics.findByStudent = function(studentId) {
  return this.find({ students: studentId })
    .populate('headOfDepartment', 'name email')
    .sort({ name: 1 });
};

// Instance methods
departmentSchema.methods.addStudent = function(studentId) {
  if (!this.students.includes(studentId)) {
    this.students.push(studentId);
  }
  return this.save();
};

departmentSchema.methods.removeStudent = function(studentId) {
  this.students = this.students.filter(id => !id.equals(studentId));
  return this.save();
};

departmentSchema.methods.addInstructor = function(instructorId) {
  if (!this.instructors.includes(instructorId)) {
    this.instructors.push(instructorId);
  }
  return this.save();
};

departmentSchema.methods.removeInstructor = function(instructorId) {
  this.instructors = this.instructors.filter(id => !id.equals(instructorId));
  return this.save();
};

departmentSchema.methods.addSubject = function(subject) {
  // Check if subject with same code already exists
  const existingSubject = this.subjects.find(s => s.code === subject.code);
  if (!existingSubject) {
    this.subjects.push(subject);
  }
  return this.save();
};

departmentSchema.methods.removeSubject = function(subjectCode) {
  this.subjects = this.subjects.filter(s => s.code !== subjectCode);
  return this.save();
};

const Department = mongoose.model('Department', departmentSchema);

export default Department;
