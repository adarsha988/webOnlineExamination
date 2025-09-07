import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'mongodb://localhost:27017/exam_system_test';
  
  // Increase timeout for database operations
  jest.setTimeout(30000);
});

afterAll(async () => {
  // Close all database connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock JWT for testing
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token'),
  verify: jest.fn(() => ({ userId: 'test-user-id', role: 'student' })),
  decode: jest.fn(() => ({ userId: 'test-user-id', role: 'student' }))
}));

// Mock multer for file uploads
jest.mock('multer', () => {
  const multer = () => ({
    single: () => (req, res, next) => {
      req.file = {
        buffer: Buffer.from('mock-file-data'),
        originalname: 'test-file.jpg',
        mimetype: 'image/jpeg'
      };
      next();
    },
    array: () => (req, res, next) => {
      req.files = [
        {
          buffer: Buffer.from('mock-file-1'),
          originalname: 'test-file-1.jpg',
          mimetype: 'image/jpeg'
        },
        {
          buffer: Buffer.from('mock-file-2'),
          originalname: 'test-file-2.jpg',
          mimetype: 'image/jpeg'
        }
      ];
      next();
    }
  });
  
  multer.memoryStorage = () => ({});
  multer.MulterError = class MulterError extends Error {
    constructor(code, field) {
      super(`Multer error: ${code}`);
      this.code = code;
      this.field = field;
    }
  };
  
  return multer;
});

// Global test utilities
global.createMockUser = () => ({
  _id: new mongoose.Types.ObjectId(),
  name: 'Test User',
  email: 'test@example.com',
  role: 'student',
  password: 'hashedpassword'
});

global.createMockExam = () => ({
  _id: new mongoose.Types.ObjectId(),
  title: 'Test Exam',
  subject: 'Computer Science',
  duration: 60,
  totalMarks: 100,
  passingMarks: 40,
  questions: [],
  proctoring: {
    enabled: true,
    strictnessLevel: 'medium'
  }
});

global.createMockAttempt = (examId, userId) => ({
  _id: new mongoose.Types.ObjectId(),
  examId: examId || new mongoose.Types.ObjectId(),
  userId: userId || new mongoose.Types.ObjectId(),
  status: 'in_progress',
  timing: {
    startedAt: new Date(),
    timeRemaining: 3600
  }
});
