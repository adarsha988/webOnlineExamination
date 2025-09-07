import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['student', 'instructor', 'admin'],
    default: 'student',
    required: true
  },
  photoUrl: {
    type: String,
    default: null,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Photo URL must be a valid image URL'
    }
  },
  profile: {
    studentId: {
      type: String,
      sparse: true,
      unique: true
    },
    department: {
      type: String,
      trim: true
    },
    year: {
      type: Number,
      min: 1,
      max: 6
    },
    phone: {
      type: String,
      match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
    },
    dateOfBirth: Date,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  biometricData: {
    faceDescriptor: {
      type: [Number], // Face-api.js descriptor array
      default: null
    },
    voicePrint: {
      type: String, // Base64 encoded voice sample
      default: null
    },
    lastFaceUpdate: {
      type: Date,
      default: null
    }
  },
  preferences: {
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'es', 'fr', 'de', 'zh', 'hi']
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    notifications: {
      email: { type: Boolean, default: true },
      browser: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    }
  },
  security: {
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: Date,
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    trustedDevices: [{
      deviceId: String,
      deviceName: String,
      lastUsed: Date,
      ipAddress: String
    }]
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending'],
    default: 'active'
  },
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastModified: {
      type: Date,
      default: Date.now
    },
    tags: [String]
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.biometricData;
      delete ret.security.loginAttempts;
      delete ret.security.lockUntil;
      return ret;
    }
  }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'profile.studentId': 1 }, { sparse: true });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.security.lockUntil && this.security.lockUntil > Date.now());
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
  // Hash password if modified
  if (this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }

  // Update lastModified
  this.metadata.lastModified = new Date();
  
  next();
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

userSchema.methods.incrementLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.security.lockUntil && this.security.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { 'security.lockUntil': 1 },
      $set: { 'security.loginAttempts': 1 }
    });
  }
  
  const updates = { $inc: { 'security.loginAttempts': 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.security.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { 'security.lockUntil': Date.now() + 2 * 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { 
      'security.loginAttempts': 1,
      'security.lockUntil': 1
    }
  });
};

userSchema.methods.updateBiometricData = function(faceDescriptor, voicePrint = null) {
  this.biometricData.faceDescriptor = faceDescriptor;
  if (voicePrint) {
    this.biometricData.voicePrint = voicePrint;
  }
  this.biometricData.lastFaceUpdate = new Date();
  return this.save();
};

// Static methods
userSchema.statics.findByRole = function(role) {
  return this.find({ role, status: 'active' });
};

userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.getActiveStudents = function() {
  return this.find({ 
    role: 'student', 
    status: 'active' 
  }).select('name email profile.studentId profile.department');
};

// Check if model already exists to avoid overwrite error
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
