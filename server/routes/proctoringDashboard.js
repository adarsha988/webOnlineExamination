import express from 'express';
import ProctoringLog from '../models/proctoringLog.model.js';
import StudentExam from '../models/studentExam.model.js';
import Exam from '../models/exam.model.js';
import User from '../models/user.model.js';
import { authenticateToken, requireInstructor } from '../middleware/auth.js';

const router = express.Router();

// Get comprehensive proctoring dashboard data for an exam
router.get('/dashboard/:examId', authenticateToken, requireInstructor, async (req, res) => {
  try {
    const { examId } = req.params;
    
    // Verify instructor has access to this exam
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    
    if (exam.instructorId.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get all student attempts for this exam
    const studentExams = await StudentExam.find({ examId })
      .populate('studentId', 'name email')
      .lean();
    
    // Get all proctoring logs for this exam
    const proctoringLogs = await ProctoringLog.find({ examId }).lean();
    
    // Calculate overview statistics
    const activeStudents = studentExams.filter(se => 
      se.status === 'in_progress' || se.status === 'started'
    ).length;
    
    const totalViolations = proctoringLogs.length;
    
    // Calculate AI-generated risk scores for each student
    const studentsWithRisk = await Promise.all(
      studentExams.map(async (studentExam) => {
        const studentLogs = proctoringLogs.filter(log => 
          log.attemptId.toString() === studentExam._id.toString()
        );
        
        const riskScore = calculateRiskScore(studentLogs, studentExam);
        const violationCount = studentLogs.length;
        const tabSwitches = studentLogs.filter(log => log.eventType === 'tab_switch').length;
        
        // Get recent violations (last 10)
        const recentViolations = studentLogs
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 10)
          .map(log => ({
            type: log.eventType,
            severity: log.severity,
            timestamp: log.timestamp
          }));
        
        // Determine status based on risk score and violations
        let status = 'active';
        if (studentExam.status === 'terminated') {
          status = 'terminated';
        } else if (riskScore >= 70 || violationCount >= 10) {
          status = 'warning';
        }
        
        return {
          id: studentExam._id,
          name: studentExam.studentId.name,
          email: studentExam.studentId.email,
          riskScore: Math.round(riskScore),
          violationCount,
          tabSwitches,
          status,
          cameraActive: getLatestCameraStatus(studentLogs),
          micActive: getLatestMicStatus(studentLogs),
          recentViolations,
          faceMissingCount: studentLogs.filter(log => log.eventType === 'face_not_detected').length,
          gazeAwayCount: studentLogs.filter(log => log.eventType === 'gaze_away').length,
          audioIssues: studentLogs.filter(log => log.eventType === 'multiple_voices').length
        };
      })
    );
    
    const highRiskStudents = studentsWithRisk.filter(s => s.riskScore >= 60).length;
    const avgRiskScore = studentsWithRisk.length > 0 
      ? Math.round(studentsWithRisk.reduce((sum, s) => sum + s.riskScore, 0) / studentsWithRisk.length)
      : 0;
    
    // Analyze violations by type
    const violationsByType = proctoringLogs.reduce((acc, log) => {
      const existing = acc.find(item => item.name === log.eventType);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ name: log.eventType, count: 1 });
      }
      return acc;
    }, []);
    
    // Analyze violations by severity
    const violationsBySeverity = proctoringLogs.reduce((acc, log) => {
      const existing = acc.find(item => item.severity === log.severity);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ severity: log.severity, count: 1 });
      }
      return acc;
    }, []);
    
    // Create timeline data (violations per 10-minute interval)
    const timeline = createViolationTimeline(proctoringLogs, exam.startTime);
    
    // AI Analytics
    const analytics = calculateAIAnalytics(proctoringLogs, studentsWithRisk);
    
    const dashboardData = {
      overview: {
        activeStudents,
        totalViolations,
        highRiskStudents,
        avgRiskScore
      },
      students: studentsWithRisk,
      violations: {
        byType: violationsByType,
        bySeverity: violationsBySeverity,
        timeline
      },
      analytics
    };
    
    res.json(dashboardData);
    
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// AI-powered risk score calculation
function calculateRiskScore(logs, studentExam) {
  if (logs.length === 0) return 0;
  
  let riskScore = 0;
  const weights = {
    // Critical violations
    'face_mismatch': 25,
    'multiple_faces': 20,
    'dev_tools_open': 30,
    'suspicious_activity': 15,
    
    // High-risk violations
    'face_not_detected': 10,
    'gaze_away': 8,
    'multiple_voices': 12,
    'tab_switch': 5,
    'window_blur': 3,
    
    // Medium-risk violations
    'copy_paste': 7,
    'right_click': 2,
    'keyboard_shortcut': 4,
    
    // Behavioral patterns
    'rapid_answer_change': 6,
    'unusual_typing_pattern': 5
  };
  
  // Calculate base score from violations
  logs.forEach(log => {
    const weight = weights[log.eventType] || 1;
    const severityMultiplier = {
      'info': 0.5,
      'warning': 1,
      'critical': 2
    }[log.severity] || 1;
    
    riskScore += weight * severityMultiplier;
  });
  
  // Apply frequency penalties
  const violationFrequency = logs.length / Math.max(1, (Date.now() - new Date(studentExam.startTime)) / (1000 * 60)); // violations per minute
  if (violationFrequency > 0.5) { // More than 1 violation per 2 minutes
    riskScore *= 1.5;
  }
  
  // Apply pattern analysis
  const patternScore = analyzeViolationPatterns(logs);
  riskScore += patternScore;
  
  // Normalize to 0-100 scale
  return Math.min(100, riskScore);
}

// Analyze violation patterns for additional risk assessment
function analyzeViolationPatterns(logs) {
  let patternScore = 0;
  
  // Check for violation clusters (multiple violations in short time)
  const sortedLogs = logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  let clusterCount = 0;
  
  for (let i = 0; i < sortedLogs.length - 2; i++) {
    const time1 = new Date(sortedLogs[i].timestamp);
    const time2 = new Date(sortedLogs[i + 1].timestamp);
    const time3 = new Date(sortedLogs[i + 2].timestamp);
    
    // If 3 violations within 30 seconds
    if (time3 - time1 < 30000) {
      clusterCount++;
    }
  }
  
  patternScore += clusterCount * 10;
  
  // Check for escalating violation severity
  let escalationCount = 0;
  const severityValues = { 'info': 1, 'warning': 2, 'critical': 3 };
  
  for (let i = 1; i < sortedLogs.length; i++) {
    const prevSeverity = severityValues[sortedLogs[i - 1].severity];
    const currSeverity = severityValues[sortedLogs[i].severity];
    
    if (currSeverity > prevSeverity) {
      escalationCount++;
    }
  }
  
  patternScore += escalationCount * 5;
  
  return patternScore;
}

// Get latest camera status from logs
function getLatestCameraStatus(logs) {
  const cameraLogs = logs
    .filter(log => log.metadata?.cameraActive !== undefined)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  return cameraLogs.length > 0 ? cameraLogs[0].metadata.cameraActive : false;
}

// Get latest microphone status from logs
function getLatestMicStatus(logs) {
  const micLogs = logs
    .filter(log => log.metadata?.micActive !== undefined)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  return micLogs.length > 0 ? micLogs[0].metadata.micActive : false;
}

// Create violation timeline data
function createViolationTimeline(logs, examStartTime) {
  const timeline = [];
  const startTime = new Date(examStartTime);
  const now = new Date();
  const intervalMinutes = 10;
  
  // Create 10-minute intervals from exam start to now
  for (let time = new Date(startTime); time <= now; time.setMinutes(time.getMinutes() + intervalMinutes)) {
    const intervalEnd = new Date(time.getTime() + intervalMinutes * 60000);
    const violationsInInterval = logs.filter(log => {
      const logTime = new Date(log.timestamp);
      return logTime >= time && logTime < intervalEnd;
    }).length;
    
    timeline.push({
      time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      count: violationsInInterval
    });
  }
  
  return timeline.slice(-12); // Return last 2 hours of data
}

// Calculate AI analytics metrics
function calculateAIAnalytics(logs, students) {
  // Simulate AI confidence scores (in real implementation, these would come from actual AI models)
  const faceDetectionLogs = logs.filter(log => log.eventType.includes('face'));
  const gazeTrackingLogs = logs.filter(log => log.eventType.includes('gaze'));
  const audioLogs = logs.filter(log => log.eventType.includes('voice') || log.eventType.includes('audio'));
  
  const analytics = {
    faceDetectionConfidence: Math.max(70, 100 - (faceDetectionLogs.length * 2)),
    gazeTrackingConfidence: Math.max(65, 100 - (gazeTrackingLogs.length * 3)),
    audioAnalysisConfidence: Math.max(75, 100 - (audioLogs.length * 2.5)),
    behavioralConfidence: Math.max(60, 100 - (logs.length * 0.5)),
    
    // Anomaly detection results
    anomalies: detectAnomalies(logs, students),
    
    // Model performance metrics (simulated)
    accuracy: 87,
    precision: 84,
    recall: 89
  };
  
  return analytics;
}

// Detect anomalies in student behavior
function detectAnomalies(logs, students) {
  const anomalies = [];
  
  // Detect students with unusual violation patterns
  students.forEach(student => {
    if (student.violationCount > 15) {
      anomalies.push({
        type: 'High Violation Count',
        description: `${student.name} has ${student.violationCount} violations`,
        confidence: Math.min(95, 60 + student.violationCount * 2)
      });
    }
    
    if (student.tabSwitches > 8) {
      anomalies.push({
        type: 'Excessive Tab Switching',
        description: `${student.name} switched tabs ${student.tabSwitches} times`,
        confidence: Math.min(90, 50 + student.tabSwitches * 3)
      });
    }
    
    if (student.riskScore > 80) {
      anomalies.push({
        type: 'Critical Risk Level',
        description: `${student.name} has a risk score of ${student.riskScore}%`,
        confidence: student.riskScore
      });
    }
  });
  
  // Detect time-based anomalies
  const recentLogs = logs.filter(log => 
    new Date(log.timestamp) > new Date(Date.now() - 10 * 60 * 1000) // Last 10 minutes
  );
  
  if (recentLogs.length > 20) {
    anomalies.push({
      type: 'Violation Spike',
      description: `${recentLogs.length} violations in the last 10 minutes`,
      confidence: Math.min(95, 50 + recentLogs.length)
    });
  }
  
  return anomalies.slice(0, 10); // Return top 10 anomalies
}

// Get individual student proctoring summary
router.get('/student/:attemptId/summary', authenticateToken, async (req, res) => {
  try {
    const { attemptId } = req.params;
    
    // Get student exam attempt
    const studentExam = await StudentExam.findById(attemptId)
      .populate('studentId', 'name email')
      .populate('examId', 'title instructorId');
    
    if (!studentExam) {
      return res.status(404).json({ error: 'Student exam not found' });
    }
    
    // Check permissions
    const isInstructor = studentExam.examId.instructorId.toString() === req.user.userId;
    const isStudent = studentExam.studentId._id.toString() === req.user.userId;
    const isAdmin = req.user.role === 'admin';
    
    if (!isInstructor && !isStudent && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get proctoring logs for this attempt
    const logs = await ProctoringLog.find({ attemptId }).sort({ timestamp: 1 });
    
    // Calculate summary statistics
    const summary = {
      totalViolations: logs.length,
      riskScore: Math.round(calculateRiskScore(logs, studentExam)),
      violationsByType: logs.reduce((acc, log) => {
        acc[log.eventType] = (acc[log.eventType] || 0) + 1;
        return acc;
      }, {}),
      violationsBySeverity: logs.reduce((acc, log) => {
        acc[log.severity] = (acc[log.severity] || 0) + 1;
        return acc;
      }, {}),
      timeline: logs.map(log => ({
        timestamp: log.timestamp,
        eventType: log.eventType,
        severity: log.severity,
        description: log.description
      })),
      flaggedBehaviors: identifyFlaggedBehaviors(logs),
      recommendations: generateRecommendations(logs, studentExam)
    };
    
    res.json(summary);
    
  } catch (error) {
    console.error('Student summary error:', error);
    res.status(500).json({ error: 'Failed to fetch student summary' });
  }
});

// Identify flagged behaviors for instructor review
function identifyFlaggedBehaviors(logs) {
  const behaviors = [];
  
  // Multiple face detection
  const multipleFaces = logs.filter(log => log.eventType === 'multiple_faces');
  if (multipleFaces.length > 0) {
    behaviors.push({
      type: 'Multiple Faces Detected',
      count: multipleFaces.length,
      severity: 'critical',
      description: 'Multiple people detected in camera feed'
    });
  }
  
  // Face mismatch
  const faceMismatch = logs.filter(log => log.eventType === 'face_mismatch');
  if (faceMismatch.length > 0) {
    behaviors.push({
      type: 'Identity Verification Failed',
      count: faceMismatch.length,
      severity: 'critical',
      description: 'Face does not match registered student'
    });
  }
  
  // Excessive tab switching
  const tabSwitches = logs.filter(log => log.eventType === 'tab_switch');
  if (tabSwitches.length > 5) {
    behaviors.push({
      type: 'Excessive Tab Switching',
      count: tabSwitches.length,
      severity: 'warning',
      description: 'Student switched browser tabs frequently'
    });
  }
  
  // Extended periods without face detection
  const faceNotDetected = logs.filter(log => log.eventType === 'face_not_detected');
  if (faceNotDetected.length > 10) {
    behaviors.push({
      type: 'Extended Absence from Camera',
      count: faceNotDetected.length,
      severity: 'warning',
      description: 'Student was not visible in camera for extended periods'
    });
  }
  
  return behaviors;
}

// Generate recommendations for instructor action
function generateRecommendations(logs, studentExam) {
  const recommendations = [];
  const riskScore = calculateRiskScore(logs, studentExam);
  
  if (riskScore > 80) {
    recommendations.push({
      priority: 'high',
      action: 'Manual Review Required',
      description: 'High risk score indicates potential academic dishonesty. Recommend detailed review and possible interview.'
    });
  } else if (riskScore > 60) {
    recommendations.push({
      priority: 'medium',
      action: 'Additional Verification',
      description: 'Moderate risk detected. Consider reviewing specific violations and student responses.'
    });
  }
  
  const criticalViolations = logs.filter(log => log.severity === 'critical');
  if (criticalViolations.length > 0) {
    recommendations.push({
      priority: 'high',
      action: 'Investigate Critical Violations',
      description: `${criticalViolations.length} critical violations detected. Review timestamps and context.`
    });
  }
  
  const tabSwitches = logs.filter(log => log.eventType === 'tab_switch').length;
  if (tabSwitches > 8) {
    recommendations.push({
      priority: 'medium',
      action: 'Review Tab Switch Activity',
      description: 'Excessive tab switching may indicate external resource usage.'
    });
  }
  
  return recommendations;
}

export default router;
