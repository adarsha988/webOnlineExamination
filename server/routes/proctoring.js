import express from 'express';
import ProctoringLog from '../models/proctoringLog.model.js';
import Attempt from '../models/attempt.model.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Log proctoring event
router.post('/log-event', authenticateToken, async (req, res) => {
  try {
    const { 
      attemptId, 
      eventType, 
      severity = 'medium', 
      description, 
      metadata = {},
      media = {} 
    } = req.body;
    
    const userId = req.user.userId;

    // Verify attempt belongs to user
    const attempt = await Attempt.findOne({ _id: attemptId, userId });
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    // Create proctoring log
    const proctoringLog = new ProctoringLog({
      attemptId,
      eventType,
      severity,
      description,
      metadata,
      media,
      context: {
        questionId: req.body.questionId,
        questionNumber: req.body.questionNumber,
        timeIntoExam: req.body.timeIntoExam,
        timeRemainingInExam: req.body.timeRemainingInExam,
        currentAnswer: req.body.currentAnswer,
        previousEvents: req.body.previousEvents || []
      }
    });

    await proctoringLog.save();

    // Add to attempt's proctoring logs
    attempt.proctoring.proctoringLogs.push(proctoringLog._id);

    // Update violation if it's a violation event
    const violationEvents = [
      'no_face', 'multiple_faces', 'face_mismatch', 'gaze_away', 
      'tab_switch', 'window_blur', 'multiple_voices', 'copy_paste', 
      'right_click', 'dev_tools_open', 'fullscreen_exit'
    ];

    if (violationEvents.includes(eventType)) {
      await attempt.addViolation(eventType, severity, description, metadata);
    } else {
      await attempt.save();
    }

    res.json({
      message: 'Event logged successfully',
      logId: proctoringLog._id,
      suspicionScore: attempt.proctoring.suspicionScore,
      integrityRating: attempt.proctoring.integrityRating,
      terminated: attempt.status === 'terminated'
    });
  } catch (error) {
    console.error('Error logging proctoring event:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get proctoring logs for an attempt
router.get('/logs/:attemptId', authenticateToken, async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { eventType, severity, category, limit = 50, page = 1 } = req.query;
    const userId = req.user.userId;

    // Verify attempt belongs to user or user is instructor
    const attempt = await Attempt.findById(attemptId).populate('examId', 'createdBy instructors');
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    const isOwner = attempt.userId.toString() === userId;
    const isInstructor = attempt.examId.createdBy.toString() === userId ||
                        attempt.examId.instructors.some(inst => inst.userId.toString() === userId);

    if (!isOwner && !isInstructor) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const options = {
      eventType,
      severity,
      category,
      limit: parseInt(limit),
      sort: { timestamp: -1 }
    };

    const logs = await ProctoringLog.findByAttempt(attemptId, options)
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await ProctoringLog.countDocuments({ attemptId });

    res.json({
      logs,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: logs.length,
        totalRecords: total
      }
    });
  } catch (error) {
    console.error('Error fetching proctoring logs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get violation summary for an attempt
router.get('/violations/:attemptId', authenticateToken, async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.userId;

    // Verify access
    const attempt = await Attempt.findById(attemptId).populate('examId', 'createdBy instructors');
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    const isOwner = attempt.userId.toString() === userId;
    const isInstructor = attempt.examId.createdBy.toString() === userId ||
                        attempt.examId.instructors.some(inst => inst.userId.toString() === userId);

    if (!isOwner && !isInstructor) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const violationSummary = await ProctoringLog.getViolationSummary(attemptId);

    res.json({
      attemptId,
      suspicionScore: attempt.proctoring.suspicionScore,
      integrityRating: attempt.proctoring.integrityRating,
      totalViolations: attempt.violationCount,
      criticalViolations: attempt.criticalViolations,
      violationBreakdown: violationSummary
    });
  } catch (error) {
    console.error('Error fetching violation summary:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Face verification endpoint
router.post('/verify-face', authenticateToken, async (req, res) => {
  try {
    const { attemptId, faceData, referenceImage } = req.body;
    const userId = req.user.userId;

    const attempt = await Attempt.findOne({ _id: attemptId, userId });
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    // Simulate face verification (in real implementation, use AI service)
    const confidence = Math.random() * 0.4 + 0.6; // 0.6 to 1.0
    const isMatch = confidence > 0.8;

    // Log face verification event
    const proctoringLog = new ProctoringLog({
      attemptId,
      eventType: isMatch ? 'face_verification_success' : 'face_mismatch',
      severity: isMatch ? 'info' : 'high',
      description: `Face verification ${isMatch ? 'passed' : 'failed'} with confidence ${confidence.toFixed(3)}`,
      metadata: {
        faceData: {
          confidence,
          boundingBox: faceData.boundingBox,
          landmarks: faceData.landmarks
        },
        aiAnalysis: {
          confidence,
          recommendation: isMatch ? 'accept' : 'review'
        }
      }
    });

    await proctoringLog.save();

    if (!isMatch) {
      await attempt.addViolation('face_mismatch', 'high', 'Face verification failed', {
        confidence,
        threshold: 0.8
      });
    }

    res.json({
      verified: isMatch,
      confidence,
      message: isMatch ? 'Face verification successful' : 'Face verification failed'
    });
  } catch (error) {
    console.error('Error in face verification:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Audio analysis endpoint
router.post('/analyze-audio', authenticateToken, async (req, res) => {
  try {
    const { attemptId, audioData, duration } = req.body;
    const userId = req.user.userId;

    const attempt = await Attempt.findOne({ _id: attemptId, userId });
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    // Simulate audio analysis
    const voiceCount = Math.random() > 0.9 ? 2 : 1; // 10% chance of multiple voices
    const backgroundNoise = Math.random() * 0.5; // 0 to 0.5
    const suspiciousAudio = voiceCount > 1 || backgroundNoise > 0.3;

    let eventType = 'audio_analysis';
    let severity = 'info';
    let description = 'Audio analysis completed';

    if (voiceCount > 1) {
      eventType = 'multiple_voices';
      severity = 'high';
      description = `Multiple voices detected (${voiceCount})`;
    } else if (backgroundNoise > 0.3) {
      eventType = 'suspicious_audio';
      severity = 'medium';
      description = `High background noise detected (${backgroundNoise.toFixed(2)})`;
    }

    const proctoringLog = new ProctoringLog({
      attemptId,
      eventType,
      severity,
      description,
      metadata: {
        audioData: {
          voiceCount,
          backgroundNoise,
          duration,
          confidence: 0.85
        },
        aiAnalysis: {
          anomalyScore: suspiciousAudio ? 0.7 : 0.2,
          recommendation: suspiciousAudio ? 'review' : 'accept'
        }
      }
    });

    await proctoringLog.save();

    if (suspiciousAudio) {
      await attempt.addViolation(eventType, severity, description, {
        voiceCount,
        backgroundNoise,
        duration
      });
    }

    res.json({
      analysis: {
        voiceCount,
        backgroundNoise,
        suspicious: suspiciousAudio,
        confidence: 0.85
      },
      message: 'Audio analysis completed'
    });
  } catch (error) {
    console.error('Error in audio analysis:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Gaze tracking endpoint
router.post('/track-gaze', authenticateToken, async (req, res) => {
  try {
    const { attemptId, gazeData, duration } = req.body;
    const userId = req.user.userId;

    const attempt = await Attempt.findOne({ _id: attemptId, userId });
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    const { x, y, confidence } = gazeData;
    
    // Determine if gaze is away from screen (simplified logic)
    const screenWidth = 1920; // Assume standard resolution
    const screenHeight = 1080;
    const isGazeAway = x < 0 || x > screenWidth || y < 0 || y > screenHeight || confidence < 0.5;

    if (isGazeAway && duration > 3) { // More than 3 seconds away
      const proctoringLog = new ProctoringLog({
        attemptId,
        eventType: 'gaze_away',
        severity: duration > 10 ? 'high' : 'medium',
        description: `Gaze away from screen for ${duration} seconds`,
        metadata: {
          gazeData: {
            x, y, confidence, duration,
            direction: x < 0 ? 'left' : x > screenWidth ? 'right' : y < 0 ? 'up' : 'down'
          }
        }
      });

      await proctoringLog.save();

      if (duration > 5) {
        await attempt.addViolation('gaze_away', duration > 10 ? 'high' : 'medium', 
          `Looked away for ${duration} seconds`, { duration, confidence });
      }
    }

    res.json({
      gazeTracked: true,
      isGazeAway,
      duration,
      confidence
    });
  } catch (error) {
    console.error('Error in gaze tracking:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get real-time proctoring status
router.get('/status/:attemptId', authenticateToken, async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.userId;

    const attempt = await Attempt.findOne({ _id: attemptId, userId });
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    // Get recent violations (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentLogs = await ProctoringLog.find({
      attemptId,
      timestamp: { $gte: fiveMinutesAgo },
      severity: { $in: ['medium', 'high', 'critical'] }
    }).sort({ timestamp: -1 }).limit(10);

    res.json({
      attemptId,
      status: attempt.status,
      proctoring: {
        enabled: attempt.proctoring.enabled,
        suspicionScore: attempt.proctoring.suspicionScore,
        integrityRating: attempt.proctoring.integrityRating,
        totalViolations: attempt.violationCount,
        criticalViolations: attempt.criticalViolations
      },
      recentActivity: recentLogs.map(log => ({
        eventType: log.eventType,
        severity: log.severity,
        timestamp: log.timestamp,
        description: log.description
      })),
      warnings: {
        showWarning: attempt.proctoring.suspicionScore > 25,
        warningLevel: attempt.proctoring.suspicionScore > 50 ? 'critical' : 'medium',
        message: attempt.proctoring.suspicionScore > 50 
          ? 'Multiple violations detected. Your exam may be terminated.'
          : 'Please maintain proper exam conduct.'
      }
    });
  } catch (error) {
    console.error('Error fetching proctoring status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Mark proctoring log as reviewed (instructor only)
router.patch('/logs/:logId/review', authenticateToken, async (req, res) => {
  try {
    const { logId } = req.params;
    const { notes, falsePositive = false } = req.body;
    const userId = req.user.userId;

    const log = await ProctoringLog.findById(logId).populate({
      path: 'attemptId',
      populate: {
        path: 'examId',
        select: 'createdBy instructors'
      }
    });

    if (!log) {
      return res.status(404).json({ message: 'Log not found' });
    }

    // Check if user is instructor
    const exam = log.attemptId.examId;
    const isInstructor = exam.createdBy.toString() === userId ||
                        exam.instructors.some(inst => inst.userId.toString() === userId);

    if (!isInstructor) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await log.markAsReviewed(userId, notes);
    log.flags.falsePositive = falsePositive;
    await log.save();

    res.json({
      message: 'Log reviewed successfully',
      reviewed: true
    });
  } catch (error) {
    console.error('Error reviewing log:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get suspicious attempts (instructor/admin only)
router.get('/suspicious-attempts', authenticateToken, async (req, res) => {
  try {
    const { threshold = 25, limit = 20, page = 1 } = req.query;
    const userId = req.user.userId;

    // This endpoint should have additional role checking in real implementation
    const suspiciousAttempts = await Attempt.getSuspiciousAttempts(parseInt(threshold))
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      attempts: suspiciousAttempts,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        count: suspiciousAttempts.length
      }
    });
  } catch (error) {
    console.error('Error fetching suspicious attempts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
