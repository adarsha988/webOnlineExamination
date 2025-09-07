import express from 'express';
import multer from 'multer';
import aiProctoringService from '../services/aiProctoringService.js';
import realTimeProcessor from '../services/realTimeProcessor.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and audio files are allowed'));
    }
  }
});

// Initialize AI proctoring service
router.post('/initialize', authenticateToken, async (req, res) => {
  try {
    if (!aiProctoringService.isInitialized) {
      await aiProctoringService.initialize();
    }
    
    res.json({
      success: true,
      message: 'AI Proctoring Service initialized successfully',
      models: {
        faceDetection: aiProctoringService.faceDetectionModel?.loaded || false,
        gazeTracking: aiProctoringService.gazeTrackingModel?.loaded || false,
        anomalyDetection: aiProctoringService.anomalyDetectionModel?.loaded || false
      }
    });
  } catch (error) {
    console.error('AI initialization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize AI Proctoring Service',
      error: error.message
    });
  }
});

// Start real-time processing for an exam attempt
router.post('/start-processing', authenticateToken, async (req, res) => {
  try {
    const { attemptId, examConfig } = req.body;
    const userId = req.user.userId;

    await realTimeProcessor.startProcessing(attemptId, userId, examConfig);

    res.json({
      success: true,
      message: 'Real-time processing started',
      attemptId,
      processingId: `proc_${attemptId}_${Date.now()}`
    });
  } catch (error) {
    console.error('Error starting processing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start real-time processing',
      error: error.message
    });
  }
});

// Stop real-time processing
router.post('/stop-processing', authenticateToken, async (req, res) => {
  try {
    const { attemptId } = req.body;

    const finalReport = await realTimeProcessor.stopProcessing(attemptId);

    res.json({
      success: true,
      message: 'Real-time processing stopped',
      finalReport
    });
  } catch (error) {
    console.error('Error stopping processing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop real-time processing',
      error: error.message
    });
  }
});

// Process a single frame (image + metadata)
router.post('/process-frame', authenticateToken, upload.single('frame'), async (req, res) => {
  try {
    const { attemptId, frameMetadata } = req.body;
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No frame image provided'
      });
    }

    const frameData = {
      image: req.file.buffer,
      metadata: JSON.parse(frameMetadata || '{}'),
      timestamp: new Date(),
      userId
    };

    // Add frame to processing queue
    const added = await realTimeProcessor.addFrame(attemptId, frameData);

    if (added) {
      res.json({
        success: true,
        message: 'Frame added to processing queue',
        frameId: frameData.frameId
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to add frame to processing queue'
      });
    }
  } catch (error) {
    console.error('Error processing frame:', error);
    res.status(500).json({
      success: false,
      message: 'Frame processing failed',
      error: error.message
    });
  }
});

// Face detection endpoint
router.post('/detect-face', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image provided'
      });
    }

    const result = await aiProctoringService.detectFace(req.file.buffer, userId);

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Face detection error:', error);
    res.status(500).json({
      success: false,
      message: 'Face detection failed',
      error: error.message
    });
  }
});

// Gaze tracking endpoint
router.post('/track-gaze', authenticateToken, async (req, res) => {
  try {
    const { faceData, screenDimensions } = req.body;

    if (!faceData || !screenDimensions) {
      return res.status(400).json({
        success: false,
        message: 'Face data and screen dimensions are required'
      });
    }

    const result = await aiProctoringService.trackGaze(faceData, screenDimensions);

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Gaze tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Gaze tracking failed',
      error: error.message
    });
  }
});

// Audio analysis endpoint
router.post('/analyze-audio', authenticateToken, upload.single('audio'), async (req, res) => {
  try {
    const { duration } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No audio file provided'
      });
    }

    const result = await aiProctoringService.analyzeAudio(req.file.buffer, parseFloat(duration));

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Audio analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Audio analysis failed',
      error: error.message
    });
  }
});

// Behavioral anomaly detection
router.post('/detect-anomalies', authenticateToken, async (req, res) => {
  try {
    const { behaviorData, userProfile } = req.body;

    if (!behaviorData) {
      return res.status(400).json({
        success: false,
        message: 'Behavior data is required'
      });
    }

    const result = await aiProctoringService.detectAnomalies(behaviorData, userProfile);

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Anomaly detection error:', error);
    res.status(500).json({
      success: false,
      message: 'Anomaly detection failed',
      error: error.message
    });
  }
});

// Store face descriptor for identity verification
router.post('/store-face-descriptor', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image provided'
      });
    }

    // Detect face and extract descriptor
    const faceResult = await aiProctoringService.detectFace(req.file.buffer, userId);
    
    if (!faceResult.faceDetected) {
      return res.status(400).json({
        success: false,
        message: 'No face detected in image'
      });
    }

    // Store the descriptor
    await aiProctoringService.storeFaceDescriptor(userId, faceResult.descriptor);

    res.json({
      success: true,
      message: 'Face descriptor stored successfully',
      confidence: faceResult.confidence
    });
  } catch (error) {
    console.error('Error storing face descriptor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to store face descriptor',
      error: error.message
    });
  }
});

// Verify identity
router.post('/verify-identity', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image provided'
      });
    }

    // Detect face and extract descriptor
    const faceResult = await aiProctoringService.detectFace(req.file.buffer, userId);
    
    if (!faceResult.faceDetected) {
      return res.status(400).json({
        success: false,
        message: 'No face detected in image'
      });
    }

    // Verify identity
    const verificationResult = await aiProctoringService.verifyIdentity(userId, faceResult.descriptor);

    res.json({
      success: true,
      verified: verificationResult.verified,
      confidence: verificationResult.confidence,
      message: verificationResult.reason
    });
  } catch (error) {
    console.error('Identity verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Identity verification failed',
      error: error.message
    });
  }
});

// Get processing status
router.get('/processing-status/:attemptId', authenticateToken, async (req, res) => {
  try {
    const { attemptId } = req.params;

    const status = realTimeProcessor.getProcessingStatus(attemptId);

    if (!status) {
      return res.status(404).json({
        success: false,
        message: 'No active processing found for this attempt'
      });
    }

    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Error getting processing status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get processing status',
      error: error.message
    });
  }
});

// Get AI model status
router.get('/model-status', authenticateToken, async (req, res) => {
  try {
    const status = {
      initialized: aiProctoringService.isInitialized,
      models: {
        faceDetection: {
          loaded: aiProctoringService.faceDetectionModel?.loaded || false,
          version: aiProctoringService.faceDetectionModel?.version || null
        },
        gazeTracking: {
          loaded: aiProctoringService.gazeTrackingModel?.loaded || false,
          version: aiProctoringService.gazeTrackingModel?.version || null,
          accuracy: aiProctoringService.gazeTrackingModel?.accuracy || null
        },
        anomalyDetection: {
          loaded: aiProctoringService.anomalyDetectionModel?.loaded || false,
          version: aiProctoringService.anomalyDetectionModel?.version || null,
          threshold: aiProctoringService.anomalyDetectionModel?.threshold || null
        }
      },
      activeProcessors: realTimeProcessor.getActiveProcessors().length,
      systemHealth: {
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
      }
    };

    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Error getting model status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get model status',
      error: error.message
    });
  }
});

// Batch process multiple frames
router.post('/batch-process', authenticateToken, upload.array('frames', 10), async (req, res) => {
  try {
    const { attemptId, batchMetadata } = req.body;
    const userId = req.user.userId;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No frames provided'
      });
    }

    const results = [];
    const metadata = JSON.parse(batchMetadata || '{}');

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const frameMetadata = metadata[i] || {};

      const frameData = {
        image: file.buffer,
        metadata: frameMetadata,
        timestamp: new Date(),
        userId,
        batchIndex: i
      };

      try {
        const added = await realTimeProcessor.addFrame(attemptId, frameData);
        results.push({
          index: i,
          success: added,
          frameId: frameData.frameId
        });
      } catch (error) {
        results.push({
          index: i,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Processed ${results.filter(r => r.success).length}/${results.length} frames`,
      results
    });
  } catch (error) {
    console.error('Batch processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Batch processing failed',
      error: error.message
    });
  }
});

// Get AI insights for an attempt
router.get('/insights/:attemptId', authenticateToken, async (req, res) => {
  try {
    const { attemptId } = req.params;

    // This would typically fetch from database and generate insights
    const insights = {
      attemptId,
      overallRisk: 'medium',
      confidence: 0.87,
      keyFindings: [
        'Normal facial recognition patterns detected',
        'Gaze tracking shows typical exam behavior',
        'No significant audio anomalies detected',
        'Behavioral patterns consistent with focused study'
      ],
      recommendations: [
        'Continue monitoring for remainder of exam',
        'No immediate intervention required',
        'Standard post-exam review recommended'
      ],
      riskFactors: [],
      timestamp: new Date()
    };

    res.json({
      success: true,
      insights
    });
  } catch (error) {
    console.error('Error getting AI insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI insights',
      error: error.message
    });
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
      });
    }
  }

  console.error('AI Proctoring route error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message
  });
});

export default router;
