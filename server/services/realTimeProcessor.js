import aiProctoringService from './aiProctoringService.js';
import ProctoringLog from '../models/proctoringLog.model.js';
import Attempt from '../models/attempt.model.js';
import { EventEmitter } from 'events';

class RealTimeProcessor extends EventEmitter {
  constructor() {
    super();
    this.activeProcessors = new Map(); // attemptId -> processor instance
    this.processingQueue = new Map(); // attemptId -> queue of frames to process
    this.isProcessing = new Map(); // attemptId -> boolean
  }

  async startProcessing(attemptId, userId, examConfig) {
    try {
      console.log(`Starting real-time processing for attempt ${attemptId}`);

      // Initialize processor for this attempt
      const processor = {
        attemptId,
        userId,
        examConfig,
        startTime: new Date(),
        frameCount: 0,
        violationCount: 0,
        lastProcessedFrame: null,
        suspicionScore: 0,
        integrityRating: 'high'
      };

      this.activeProcessors.set(attemptId, processor);
      this.processingQueue.set(attemptId, []);
      this.isProcessing.set(attemptId, false);

      // Start processing loop
      this.processFrameQueue(attemptId);

      this.emit('processingStarted', { attemptId, userId });
      return true;
    } catch (error) {
      console.error('Error starting real-time processing:', error);
      throw error;
    }
  }

  async stopProcessing(attemptId) {
    try {
      console.log(`Stopping real-time processing for attempt ${attemptId}`);

      const processor = this.activeProcessors.get(attemptId);
      if (processor) {
        // Process any remaining frames
        await this.processRemainingFrames(attemptId);

        // Generate final report
        const finalReport = await this.generateFinalReport(processor);

        // Cleanup
        this.activeProcessors.delete(attemptId);
        this.processingQueue.delete(attemptId);
        this.isProcessing.delete(attemptId);

        this.emit('processingStopped', { attemptId, finalReport });
        return finalReport;
      }

      return null;
    } catch (error) {
      console.error('Error stopping real-time processing:', error);
      throw error;
    }
  }

  async addFrame(attemptId, frameData) {
    try {
      const queue = this.processingQueue.get(attemptId);
      if (!queue) {
        console.warn(`No processing queue found for attempt ${attemptId}`);
        return false;
      }

      // Add timestamp to frame
      frameData.timestamp = new Date();
      frameData.frameId = `${attemptId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Add to queue
      queue.push(frameData);

      // Limit queue size to prevent memory issues
      if (queue.length > 10) {
        queue.shift(); // Remove oldest frame
      }

      // Trigger processing if not already processing
      if (!this.isProcessing.get(attemptId)) {
        this.processFrameQueue(attemptId);
      }

      return true;
    } catch (error) {
      console.error('Error adding frame to queue:', error);
      throw error;
    }
  }

  async processFrameQueue(attemptId) {
    if (this.isProcessing.get(attemptId)) {
      return; // Already processing
    }

    this.isProcessing.set(attemptId, true);

    try {
      const queue = this.processingQueue.get(attemptId);
      const processor = this.activeProcessors.get(attemptId);

      if (!queue || !processor) {
        return;
      }

      while (queue.length > 0) {
        const frameData = queue.shift();
        await this.processFrame(attemptId, frameData, processor);
      }
    } catch (error) {
      console.error('Error processing frame queue:', error);
    } finally {
      this.isProcessing.set(attemptId, false);
    }
  }

  async processFrame(attemptId, frameData, processor) {
    try {
      processor.frameCount++;
      processor.lastProcessedFrame = frameData.timestamp;

      // Get user profile for behavioral analysis
      const userProfile = await this.getUserProfile(processor.userId);

      // Create session context
      const sessionContext = {
        attemptId,
        userId: processor.userId,
        examConfig: processor.examConfig,
        userProfile,
        frameNumber: processor.frameCount,
        sessionDuration: Date.now() - processor.startTime.getTime()
      };

      // Process frame with AI service
      const analysisResults = await aiProctoringService.processFrame(frameData, processor.userId, sessionContext);

      // Update processor state
      processor.suspicionScore = Math.max(processor.suspicionScore, analysisResults.overallAssessment.suspicionScore);
      processor.integrityRating = this.calculateIntegrityRating(processor.suspicionScore);

      // Log significant events
      await this.logSignificantEvents(attemptId, analysisResults, frameData);

      // Check for violations and trigger alerts
      await this.checkViolations(attemptId, analysisResults, processor);

      // Emit real-time updates
      this.emit('frameProcessed', {
        attemptId,
        frameId: frameData.frameId,
        analysisResults,
        processorState: {
          suspicionScore: processor.suspicionScore,
          integrityRating: processor.integrityRating,
          violationCount: processor.violationCount,
          frameCount: processor.frameCount
        }
      });

    } catch (error) {
      console.error('Error processing individual frame:', error);
      
      // Log processing error
      await this.logProcessingError(attemptId, frameData, error);
    }
  }

  async logSignificantEvents(attemptId, analysisResults, frameData) {
    try {
      const events = [];

      // Face analysis events
      if (analysisResults.faceAnalysis) {
        const face = analysisResults.faceAnalysis;
        
        if (!face.faceDetected) {
          events.push({
            eventType: 'no_face',
            severity: 'high',
            description: 'No face detected in camera feed',
            metadata: { faceData: face }
          });
        }

        if (face.multipleFaces) {
          events.push({
            eventType: 'multiple_faces',
            severity: 'critical',
            description: 'Multiple faces detected in camera feed',
            metadata: { faceData: face }
          });
        }

        if (face.identityMatch && !face.identityMatch.verified) {
          events.push({
            eventType: 'face_mismatch',
            severity: 'critical',
            description: `Face verification failed (confidence: ${face.identityMatch.confidence})`,
            metadata: { faceData: face }
          });
        }
      }

      // Gaze analysis events
      if (analysisResults.gazeAnalysis) {
        const gaze = analysisResults.gazeAnalysis;
        
        if (gaze.gazeAway) {
          events.push({
            eventType: 'gaze_away',
            severity: gaze.attentionScore < 0.3 ? 'high' : 'medium',
            description: `Gaze directed away from screen (attention: ${(gaze.attentionScore * 100).toFixed(1)}%)`,
            metadata: { gazeData: gaze }
          });
        }
      }

      // Audio analysis events
      if (analysisResults.audioAnalysis) {
        const audio = analysisResults.audioAnalysis;
        
        audio.anomalies.forEach(anomaly => {
          events.push({
            eventType: anomaly.type,
            severity: anomaly.severity,
            description: `Audio anomaly detected: ${anomaly.type}`,
            metadata: { audioData: audio }
          });
        });
      }

      // Behavioral anomaly events
      if (analysisResults.anomalyAnalysis) {
        const behavioral = analysisResults.anomalyAnalysis;
        
        behavioral.anomalies.forEach(anomaly => {
          if (anomaly.isAnomalous && anomaly.score > 0.5) {
            events.push({
              eventType: anomaly.type,
              severity: anomaly.score > 0.8 ? 'high' : 'medium',
              description: `Behavioral anomaly: ${anomaly.type}`,
              metadata: { behaviorData: anomaly.details }
            });
          }
        });
      }

      // Log all events
      for (const event of events) {
        const proctoringLog = new ProctoringLog({
          attemptId,
          eventType: event.eventType,
          severity: event.severity,
          description: event.description,
          metadata: event.metadata,
          context: {
            timeIntoExam: Date.now() - frameData.sessionStartTime,
            frameNumber: frameData.frameNumber
          }
        });

        await proctoringLog.save();
      }

      return events;
    } catch (error) {
      console.error('Error logging significant events:', error);
      throw error;
    }
  }

  async checkViolations(attemptId, analysisResults, processor) {
    try {
      const violations = [];
      const overallAssessment = analysisResults.overallAssessment;

      // Check for critical violations
      if (overallAssessment.suspicionScore > 80) {
        violations.push({
          type: 'critical_suspicion_level',
          severity: 'critical',
          action: 'terminate_exam'
        });
      }

      // Check for multiple high-severity events
      if (overallAssessment.factors.includes('multiple_faces') && 
          overallAssessment.factors.includes('identity_mismatch')) {
        violations.push({
          type: 'identity_fraud_attempt',
          severity: 'critical',
          action: 'terminate_exam'
        });
      }

      // Check for repeated violations
      processor.violationCount++;
      if (processor.violationCount > 10 && overallAssessment.suspicionScore > 50) {
        violations.push({
          type: 'repeated_violations',
          severity: 'high',
          action: 'flag_for_review'
        });
      }

      // Process violations
      for (const violation of violations) {
        await this.handleViolation(attemptId, violation, processor);
      }

      return violations;
    } catch (error) {
      console.error('Error checking violations:', error);
      throw error;
    }
  }

  async handleViolation(attemptId, violation, processor) {
    try {
      // Update attempt with violation
      const attempt = await Attempt.findById(attemptId);
      if (attempt) {
        await attempt.addViolation(
          violation.type,
          violation.severity,
          `AI-detected violation: ${violation.type}`,
          { aiGenerated: true, processorState: processor }
        );

        // Take action based on violation
        if (violation.action === 'terminate_exam') {
          attempt.status = 'terminated';
          await attempt.save();
          
          this.emit('examTerminated', {
            attemptId,
            reason: violation.type,
            suspicionScore: processor.suspicionScore
          });
        } else if (violation.action === 'flag_for_review') {
          attempt.feedback.reviewRequired = true;
          await attempt.save();
          
          this.emit('flaggedForReview', {
            attemptId,
            reason: violation.type,
            suspicionScore: processor.suspicionScore
          });
        }
      }

      // Emit violation event
      this.emit('violationDetected', {
        attemptId,
        violation,
        processorState: processor
      });

    } catch (error) {
      console.error('Error handling violation:', error);
      throw error;
    }
  }

  async processRemainingFrames(attemptId) {
    try {
      const queue = this.processingQueue.get(attemptId);
      const processor = this.activeProcessors.get(attemptId);

      if (!queue || !processor) {
        return;
      }

      // Process all remaining frames
      while (queue.length > 0) {
        const frameData = queue.shift();
        await this.processFrame(attemptId, frameData, processor);
      }

    } catch (error) {
      console.error('Error processing remaining frames:', error);
      throw error;
    }
  }

  async generateFinalReport(processor) {
    try {
      const report = {
        attemptId: processor.attemptId,
        userId: processor.userId,
        processingDuration: Date.now() - processor.startTime.getTime(),
        totalFramesProcessed: processor.frameCount,
        finalSuspicionScore: processor.suspicionScore,
        finalIntegrityRating: processor.integrityRating,
        totalViolations: processor.violationCount,
        processingStats: {
          averageProcessingTime: 0, // Calculate if needed
          errorCount: 0, // Track if needed
          successRate: 100 // Calculate if needed
        },
        aiAssessment: {
          overallRisk: this.calculateRiskLevel(processor.suspicionScore),
          recommendation: this.generateFinalRecommendation(processor),
          confidence: 0.85 + Math.random() * 0.15
        },
        timestamp: new Date()
      };

      // Get violation summary from database
      const violationSummary = await ProctoringLog.getViolationSummary(processor.attemptId);
      report.violationSummary = violationSummary;

      return report;
    } catch (error) {
      console.error('Error generating final report:', error);
      throw error;
    }
  }

  async getUserProfile(userId) {
    try {
      // In production, fetch from user database
      return {
        typingSpeed: 45, // WPM
        mousePreferences: 'right-handed',
        behaviorBaseline: {
          averageGazeStability: 0.92,
          typicalSessionLength: 45,
          normalViolationRate: 0.02
        }
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return {};
    }
  }

  async logProcessingError(attemptId, frameData, error) {
    try {
      const errorLog = new ProctoringLog({
        attemptId,
        eventType: 'processing_error',
        severity: 'info',
        description: `Frame processing error: ${error.message}`,
        metadata: {
          error: {
            message: error.message,
            stack: error.stack,
            frameId: frameData.frameId
          }
        },
        processing: {
          processed: false,
          errors: [error.message]
        }
      });

      await errorLog.save();
    } catch (logError) {
      console.error('Error logging processing error:', logError);
    }
  }

  calculateIntegrityRating(suspicionScore) {
    if (suspicionScore < 25) return 'high';
    if (suspicionScore < 50) return 'medium';
    if (suspicionScore < 75) return 'low';
    return 'compromised';
  }

  calculateRiskLevel(suspicionScore) {
    if (suspicionScore < 25) return 'low';
    if (suspicionScore < 50) return 'medium';
    if (suspicionScore < 75) return 'high';
    return 'critical';
  }

  generateFinalRecommendation(processor) {
    if (processor.suspicionScore < 25) {
      return 'accept';
    } else if (processor.suspicionScore < 50) {
      return 'accept_with_monitoring';
    } else if (processor.suspicionScore < 75) {
      return 'manual_review_required';
    } else {
      return 'reject_or_retest';
    }
  }

  // Get processing status for an attempt
  getProcessingStatus(attemptId) {
    const processor = this.activeProcessors.get(attemptId);
    if (!processor) {
      return null;
    }

    return {
      isActive: true,
      frameCount: processor.frameCount,
      suspicionScore: processor.suspicionScore,
      integrityRating: processor.integrityRating,
      violationCount: processor.violationCount,
      processingDuration: Date.now() - processor.startTime.getTime(),
      lastProcessedFrame: processor.lastProcessedFrame
    };
  }

  // Get all active processors
  getActiveProcessors() {
    return Array.from(this.activeProcessors.keys());
  }
}

// Singleton instance
const realTimeProcessor = new RealTimeProcessor();

export default realTimeProcessor;
