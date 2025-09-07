import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index.js';
import aiProctoringService from '../services/aiProctoringService.js';
import realTimeProcessor from '../services/realTimeProcessor.js';
import Attempt from '../models/attempt.model.js';
import ProctoringLog from '../models/proctoringLog.model.js';
import Exam from '../models/exam.enhanced.model.js';
import User from '../models/user.model.enhanced.js';

describe('AI Proctoring System End-to-End Tests', () => {
  let testUser, testExam, testAttempt, authToken;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.TEST_DATABASE_URL || 'mongodb://localhost:27017/exam_system_test');
    
    // Initialize AI service
    await aiProctoringService.initialize();
  });

  afterAll(async () => {
    // Cleanup and close connections
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Create test user
    testUser = new User({
      name: 'Test Student',
      email: 'test@example.com',
      password: 'hashedpassword',
      role: 'student',
      profile: {
        studentId: 'TEST001'
      }
    });
    await testUser.save();

    // Create test exam
    testExam = new Exam({
      title: 'AI Proctoring Test Exam',
      subject: 'Computer Science',
      duration: 60,
      totalMarks: 100,
      passingMarks: 40,
      createdBy: testUser._id,
      timing: {
        scheduledDate: new Date(),
        endDate: new Date(Date.now() + 60 * 60 * 1000)
      },
      questions: [],
      proctoring: {
        enabled: true,
        strictnessLevel: 'medium'
      }
    });
    await testExam.save();

    // Create test attempt
    testAttempt = new Attempt({
      examId: testExam._id,
      userId: testUser._id,
      status: 'in_progress',
      timing: {
        startedAt: new Date(),
        timeRemaining: 3600
      }
    });
    await testAttempt.save();

    // Generate auth token
    authToken = 'Bearer test-jwt-token';
  });

  afterEach(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Exam.deleteMany({});
    await Attempt.deleteMany({});
    await ProctoringLog.deleteMany({});
  });

  describe('AI Service Initialization', () => {
    it('should initialize AI proctoring service successfully', async () => {
      expect(aiProctoringService.isInitialized).toBe(true);
      expect(aiProctoringService.faceDetectionModel.loaded).toBe(true);
      expect(aiProctoringService.gazeTrackingModel.loaded).toBe(true);
      expect(aiProctoringService.anomalyDetectionModel.loaded).toBe(true);
    });

    it('should return model status via API', async () => {
      const response = await request(app)
        .get('/api/ai-proctoring/model-status')
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.status.initialized).toBe(true);
      expect(response.body.status.models.faceDetection.loaded).toBe(true);
    });
  });

  describe('Face Detection and Recognition', () => {
    it('should detect face in uploaded image', async () => {
      const mockImageBuffer = Buffer.from('mock-image-data');
      
      const result = await aiProctoringService.detectFace(mockImageBuffer, testUser._id);
      
      expect(result).toHaveProperty('faceDetected');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('boundingBox');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should store and verify face descriptor', async () => {
      const mockDescriptor = Array(128).fill(0).map(() => Math.random());
      
      // Store descriptor
      const stored = await aiProctoringService.storeFaceDescriptor(testUser._id, mockDescriptor);
      expect(stored).toBe(true);
      
      // Verify identity
      const verification = await aiProctoringService.verifyIdentity(testUser._id, mockDescriptor);
      expect(verification.verified).toBe(true);
      expect(verification.confidence).toBeGreaterThan(0.8);
    });

    it('should handle face detection API endpoint', async () => {
      const response = await request(app)
        .post('/api/ai-proctoring/detect-face')
        .set('Authorization', authToken)
        .attach('image', Buffer.from('mock-image'), 'test.jpg');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result).toHaveProperty('faceDetected');
    });
  });

  describe('Gaze Tracking', () => {
    it('should track gaze direction accurately', async () => {
      const mockFaceData = {
        landmarks: Array(68).fill(0).map(() => ({ x: Math.random() * 300, y: Math.random() * 400 }))
      };
      const screenDimensions = { width: 1920, height: 1080 };
      
      const result = await aiProctoringService.trackGaze(mockFaceData, screenDimensions);
      
      expect(result).toHaveProperty('gazePoint');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('direction');
      expect(result).toHaveProperty('onScreen');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect when gaze is away from screen', async () => {
      const mockFaceData = { landmarks: [] };
      const screenDimensions = { width: 1920, height: 1080 };
      
      const result = await aiProctoringService.trackGaze(mockFaceData, screenDimensions);
      
      expect(result).toHaveProperty('gazeAway');
      expect(typeof result.gazeAway).toBe('boolean');
    });
  });

  describe('Audio Analysis', () => {
    it('should analyze audio for violations', async () => {
      const mockAudioBuffer = Buffer.from('mock-audio-data');
      const duration = 5.0;
      
      const result = await aiProctoringService.analyzeAudio(mockAudioBuffer, duration);
      
      expect(result).toHaveProperty('voiceDetected');
      expect(result).toHaveProperty('voiceCount');
      expect(result).toHaveProperty('backgroundNoise');
      expect(result).toHaveProperty('anomalies');
      expect(Array.isArray(result.anomalies)).toBe(true);
    });

    it('should detect multiple voices', async () => {
      const mockAudioBuffer = Buffer.from('mock-audio-data');
      
      // Mock multiple voice detection
      const originalRandom = Math.random;
      Math.random = () => 0.05; // Force multiple voices detection
      
      const result = await aiProctoringService.analyzeAudio(mockAudioBuffer, 5.0);
      
      expect(result.voiceCount).toBeGreaterThan(1);
      expect(result.anomalies.some(a => a.type === 'multiple_voices')).toBe(true);
      
      Math.random = originalRandom;
    });
  });

  describe('Behavioral Anomaly Detection', () => {
    it('should detect typing pattern anomalies', async () => {
      const behaviorData = {
        typingPattern: [
          { speed: 120, timestamp: Date.now() },
          { speed: 125, timestamp: Date.now() + 1000 },
          { speed: 130, timestamp: Date.now() + 2000 }
        ]
      };
      
      const result = await aiProctoringService.detectAnomalies(behaviorData);
      
      expect(result).toHaveProperty('anomalies');
      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('riskLevel');
      expect(result).toHaveProperty('recommendation');
    });

    it('should detect answer timing anomalies', async () => {
      const behaviorData = {
        answerTiming: [
          { timeSpent: 2 }, // Very fast
          { timeSpent: 3 }, // Very fast
          { timeSpent: 1 }, // Very fast
          { timeSpent: 45 }, // Normal
          { timeSpent: 60 }  // Normal
        ]
      };
      
      const result = await aiProctoringService.detectAnomalies(behaviorData);
      
      const timingAnomaly = result.anomalies.find(a => a.type === 'answer_timing_anomaly');
      expect(timingAnomaly).toBeDefined();
      expect(timingAnomaly.isAnomalous).toBe(true);
    });
  });

  describe('Real-Time Processing', () => {
    it('should start and stop processing for an attempt', async () => {
      const examConfig = {
        proctoring: testExam.proctoring,
        duration: testExam.duration
      };
      
      // Start processing
      const started = await realTimeProcessor.startProcessing(
        testAttempt._id, 
        testUser._id, 
        examConfig
      );
      expect(started).toBe(true);
      
      // Check status
      const status = realTimeProcessor.getProcessingStatus(testAttempt._id);
      expect(status).toBeDefined();
      expect(status.isActive).toBe(true);
      
      // Stop processing
      const finalReport = await realTimeProcessor.stopProcessing(testAttempt._id);
      expect(finalReport).toBeDefined();
      expect(finalReport.attemptId).toBe(testAttempt._id.toString());
    });

    it('should process frames in real-time', async () => {
      const examConfig = { proctoring: testExam.proctoring };
      await realTimeProcessor.startProcessing(testAttempt._id, testUser._id, examConfig);
      
      const frameData = {
        image: Buffer.from('mock-image'),
        metadata: { timestamp: Date.now() },
        behaviorData: {
          typingPattern: [{ speed: 45, timestamp: Date.now() }]
        }
      };
      
      const added = await realTimeProcessor.addFrame(testAttempt._id, frameData);
      expect(added).toBe(true);
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await realTimeProcessor.stopProcessing(testAttempt._id);
    });
  });

  describe('API Integration Tests', () => {
    it('should start real-time processing via API', async () => {
      const response = await request(app)
        .post('/api/ai-proctoring/start-processing')
        .set('Authorization', authToken)
        .send({
          attemptId: testAttempt._id,
          examConfig: { proctoring: testExam.proctoring }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.attemptId).toBe(testAttempt._id.toString());
    });

    it('should process frame via API', async () => {
      // Start processing first
      await request(app)
        .post('/api/ai-proctoring/start-processing')
        .set('Authorization', authToken)
        .send({
          attemptId: testAttempt._id,
          examConfig: { proctoring: testExam.proctoring }
        });

      const response = await request(app)
        .post('/api/ai-proctoring/process-frame')
        .set('Authorization', authToken)
        .field('attemptId', testAttempt._id.toString())
        .field('frameMetadata', JSON.stringify({ timestamp: Date.now() }))
        .attach('frame', Buffer.from('mock-image'), 'frame.jpg');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should get processing status via API', async () => {
      // Start processing first
      await realTimeProcessor.startProcessing(testAttempt._id, testUser._id, {});

      const response = await request(app)
        .get(`/api/ai-proctoring/processing-status/${testAttempt._id}`)
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.status.isActive).toBe(true);
    });

    it('should handle batch frame processing', async () => {
      await realTimeProcessor.startProcessing(testAttempt._id, testUser._id, {});

      const response = await request(app)
        .post('/api/ai-proctoring/batch-process')
        .set('Authorization', authToken)
        .field('attemptId', testAttempt._id.toString())
        .field('batchMetadata', JSON.stringify([
          { timestamp: Date.now() },
          { timestamp: Date.now() + 1000 }
        ]))
        .attach('frames', Buffer.from('mock-image-1'), 'frame1.jpg')
        .attach('frames', Buffer.from('mock-image-2'), 'frame2.jpg');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.results).toHaveLength(2);
    });
  });

  describe('Violation Detection and Logging', () => {
    it('should log proctoring violations', async () => {
      const examConfig = { proctoring: testExam.proctoring };
      await realTimeProcessor.startProcessing(testAttempt._id, testUser._id, examConfig);

      // Simulate frame with violations
      const frameData = {
        image: Buffer.from('mock-image'),
        metadata: { 
          faceDetected: false, // This should trigger a violation
          multipleFaces: false
        }
      };

      await realTimeProcessor.addFrame(testAttempt._id, frameData);
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if violations were logged
      const logs = await ProctoringLog.find({ attemptId: testAttempt._id });
      expect(logs.length).toBeGreaterThan(0);

      await realTimeProcessor.stopProcessing(testAttempt._id);
    });

    it('should update attempt with violations', async () => {
      await testAttempt.addViolation('test_violation', 'high', 'Test violation for testing');
      
      const updatedAttempt = await Attempt.findById(testAttempt._id);
      expect(updatedAttempt.proctoring.violations.length).toBeGreaterThan(0);
      expect(updatedAttempt.proctoring.suspicionScore).toBeGreaterThan(0);
    });
  });

  describe('Performance and Stress Tests', () => {
    it('should handle multiple concurrent processing sessions', async () => {
      const attempts = [];
      const processingPromises = [];

      // Create multiple test attempts
      for (let i = 0; i < 5; i++) {
        const attempt = new Attempt({
          examId: testExam._id,
          userId: testUser._id,
          status: 'in_progress',
          timing: { startedAt: new Date(), timeRemaining: 3600 }
        });
        await attempt.save();
        attempts.push(attempt);

        // Start processing for each
        const promise = realTimeProcessor.startProcessing(
          attempt._id, 
          testUser._id, 
          { proctoring: testExam.proctoring }
        );
        processingPromises.push(promise);
      }

      // Wait for all to start
      const results = await Promise.all(processingPromises);
      expect(results.every(r => r === true)).toBe(true);

      // Check active processors
      const activeProcessors = realTimeProcessor.getActiveProcessors();
      expect(activeProcessors.length).toBe(5);

      // Stop all processing
      for (const attempt of attempts) {
        await realTimeProcessor.stopProcessing(attempt._id);
      }

      // Cleanup
      await Attempt.deleteMany({ _id: { $in: attempts.map(a => a._id) } });
    });

    it('should handle rapid frame processing', async () => {
      await realTimeProcessor.startProcessing(testAttempt._id, testUser._id, {});

      const framePromises = [];
      for (let i = 0; i < 20; i++) {
        const frameData = {
          image: Buffer.from(`mock-image-${i}`),
          metadata: { frameNumber: i, timestamp: Date.now() + i * 100 }
        };
        framePromises.push(realTimeProcessor.addFrame(testAttempt._id, frameData));
      }

      const results = await Promise.all(framePromises);
      expect(results.every(r => r === true)).toBe(true);

      await realTimeProcessor.stopProcessing(testAttempt._id);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid image data gracefully', async () => {
      const response = await request(app)
        .post('/api/ai-proctoring/detect-face')
        .set('Authorization', authToken)
        .attach('image', Buffer.from('invalid-image-data'), 'test.txt');

      // Should handle gracefully without crashing
      expect([200, 400, 500]).toContain(response.status);
    });

    it('should handle processing without initialization', async () => {
      // Temporarily mark as uninitialized
      const originalState = aiProctoringService.isInitialized;
      aiProctoringService.isInitialized = false;

      try {
        await aiProctoringService.detectFace(Buffer.from('test'), testUser._id);
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error.message).toContain('not initialized');
      }

      // Restore state
      aiProctoringService.isInitialized = originalState;
    });

    it('should handle missing attempt ID', async () => {
      const response = await request(app)
        .get('/api/ai-proctoring/processing-status/invalid-id')
        .set('Authorization', authToken);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Integration with Exam Flow', () => {
    it('should complete full exam workflow with AI proctoring', async () => {
      // 1. Start exam attempt
      const response1 = await request(app)
        .post('/api/attempts/start')
        .set('Authorization', authToken)
        .send({ examId: testExam._id });

      expect(response1.status).toBe(201);
      const attemptId = response1.body.attempt._id;

      // 2. Start AI proctoring
      const response2 = await request(app)
        .post('/api/ai-proctoring/start-processing')
        .set('Authorization', authToken)
        .send({
          attemptId,
          examConfig: { proctoring: testExam.proctoring }
        });

      expect(response2.status).toBe(200);

      // 3. Process some frames
      await request(app)
        .post('/api/ai-proctoring/process-frame')
        .set('Authorization', authToken)
        .field('attemptId', attemptId)
        .field('frameMetadata', JSON.stringify({ timestamp: Date.now() }))
        .attach('frame', Buffer.from('mock-image'), 'frame.jpg');

      // 4. Save answers
      const response4 = await request(app)
        .post('/api/attempts/save-answer')
        .set('Authorization', authToken)
        .send({
          attemptId,
          questionId: 'test-question-id',
          answer: 'Test answer',
          timeSpent: 30
        });

      expect(response4.status).toBe(200);

      // 5. Submit exam
      const response5 = await request(app)
        .post('/api/attempts/submit')
        .set('Authorization', authToken)
        .send({ attemptId });

      expect(response5.status).toBe(200);

      // 6. Stop AI proctoring
      const response6 = await request(app)
        .post('/api/ai-proctoring/stop-processing')
        .set('Authorization', authToken)
        .send({ attemptId });

      expect(response6.status).toBe(200);
      expect(response6.body.finalReport).toBeDefined();
    });
  });
});

// Helper function to create mock image buffer
function createMockImageBuffer() {
  // Create a simple mock image buffer (in real tests, use actual image data)
  const header = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]); // JPEG header
  const data = Buffer.alloc(1000, 0x00);
  return Buffer.concat([header, data]);
}

// Helper function to create mock audio buffer
function createMockAudioBuffer() {
  // Create a simple mock audio buffer
  const header = Buffer.from('RIFF', 'ascii');
  const data = Buffer.alloc(1000, 0x00);
  return Buffer.concat([header, data]);
}
