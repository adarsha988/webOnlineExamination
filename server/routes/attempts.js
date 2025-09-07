import express from 'express';
import Attempt from '../models/attempt.model.js';
import Exam from '../models/exam.enhanced.model.js';
import ProctoringLog from '../models/proctoringLog.model.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Start an exam attempt
router.post('/start', authenticateToken, async (req, res) => {
  try {
    const { examId } = req.body;
    const userId = req.user.userId;

    // Check if exam exists and is available
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    if (!exam.canStart(userId)) {
      return res.status(400).json({ message: 'Exam is not available for starting' });
    }

    // Check if user already has an attempt
    const existingAttempt = await Attempt.findOne({ examId, userId });
    if (existingAttempt) {
      if (existingAttempt.status === 'completed' || existingAttempt.status === 'submitted') {
        return res.status(400).json({ message: 'Exam already completed' });
      }
      if (existingAttempt.status === 'in_progress') {
        return res.status(200).json({ 
          message: 'Resuming existing attempt',
          attempt: existingAttempt 
        });
      }
    }

    // Create new attempt
    const attempt = new Attempt({
      examId,
      userId,
      status: 'in_progress',
      timing: {
        startedAt: new Date(),
        timeRemaining: exam.duration * 60 // convert minutes to seconds
      },
      session: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        deviceInfo: {
          platform: req.body.deviceInfo?.platform,
          browser: req.body.deviceInfo?.browser,
          version: req.body.deviceInfo?.version,
          mobile: req.body.deviceInfo?.mobile || false
        }
      },
      proctoring: {
        enabled: exam.proctoring.enabled
      }
    });

    await attempt.save();

    // Log session start
    const proctoringLog = new ProctoringLog({
      attemptId: attempt._id,
      eventType: 'session_start',
      severity: 'info',
      description: 'Exam session started',
      metadata: {
        systemData: {
          screenResolution: req.body.screenResolution,
          browserInfo: req.body.browserInfo
        }
      }
    });
    await proctoringLog.save();

    // Update exam analytics
    await exam.addAttempt(userId, { status: 'started' });

    res.status(201).json({
      message: 'Exam attempt started successfully',
      attempt,
      exam: {
        _id: exam._id,
        title: exam.title,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        questions: exam.questions,
        proctoring: exam.proctoring
      }
    });
  } catch (error) {
    console.error('Error starting exam attempt:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get current attempt
router.get('/current/:examId', authenticateToken, async (req, res) => {
  try {
    const { examId } = req.params;
    const userId = req.user.userId;

    const attempt = await Attempt.findOne({ examId, userId })
      .populate('examId', 'title duration totalMarks questions proctoring')
      .populate('answers.questionId');

    if (!attempt) {
      return res.status(404).json({ message: 'No attempt found' });
    }

    res.json({ attempt });
  } catch (error) {
    console.error('Error fetching current attempt:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Save answer
router.post('/save-answer', authenticateToken, async (req, res) => {
  try {
    const { attemptId, questionId, answer, timeSpent } = req.body;
    const userId = req.user.userId;

    const attempt = await Attempt.findOne({ _id: attemptId, userId });
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    if (!attempt.canSubmit()) {
      return res.status(400).json({ message: 'Cannot save answer for this attempt' });
    }

    // Find existing answer or create new one
    let answerIndex = attempt.answers.findIndex(a => a.questionId.toString() === questionId);
    
    if (answerIndex === -1) {
      attempt.answers.push({
        questionId,
        answer,
        timeSpent: timeSpent || 0
      });
    } else {
      attempt.answers[answerIndex].answer = answer;
      attempt.answers[answerIndex].timeSpent += timeSpent || 0;
    }

    // Update last activity
    attempt.timing.lastActivity = new Date();
    
    await attempt.save();

    res.json({ 
      message: 'Answer saved successfully',
      answerSaved: true 
    });
  } catch (error) {
    console.error('Error saving answer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Submit exam
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { attemptId } = req.body;
    const userId = req.user.userId;

    const attempt = await Attempt.findOne({ _id: attemptId, userId })
      .populate('examId');
    
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    if (!attempt.canSubmit()) {
      return res.status(400).json({ message: 'Cannot submit this attempt' });
    }

    // Update attempt status
    attempt.status = 'submitted';
    attempt.timing.submittedAt = new Date();
    attempt.timing.totalTimeSpent = Math.floor(
      (attempt.timing.submittedAt - attempt.timing.startedAt) / 1000
    );

    // Calculate score
    await attempt.calculateScore();
    await attempt.save();

    // Log session end
    const proctoringLog = new ProctoringLog({
      attemptId: attempt._id,
      eventType: 'session_end',
      severity: 'info',
      description: 'Exam session ended - submitted',
      metadata: {
        systemData: {
          totalTime: attempt.timing.totalTimeSpent,
          score: attempt.score,
          percentage: attempt.percentage
        }
      }
    });
    await proctoringLog.save();

    // Update exam analytics
    await attempt.examId.addAttempt(userId, {
      status: 'completed',
      score: attempt.score,
      timeSpent: attempt.timing.totalTimeSpent,
      percentage: attempt.percentage
    });

    res.json({
      message: 'Exam submitted successfully',
      attempt: {
        _id: attempt._id,
        score: attempt.score,
        percentage: attempt.percentage,
        grade: attempt.grade,
        status: attempt.status,
        submittedAt: attempt.timing.submittedAt
      }
    });
  } catch (error) {
    console.error('Error submitting exam:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Report violation
router.post('/report-violation', authenticateToken, async (req, res) => {
  try {
    const { attemptId, violationType, severity, description, metadata } = req.body;
    const userId = req.user.userId;

    const attempt = await Attempt.findOne({ _id: attemptId, userId });
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    // Add violation to attempt
    await attempt.addViolation(violationType, severity, description, metadata);

    // Create proctoring log
    const proctoringLog = new ProctoringLog({
      attemptId: attempt._id,
      eventType: violationType,
      severity: severity || 'medium',
      description: description || `${violationType} violation detected`,
      metadata: metadata || {}
    });
    await proctoringLog.save();

    // Add log reference to attempt
    attempt.proctoring.proctoringLogs.push(proctoringLog._id);
    await attempt.save();

    res.json({
      message: 'Violation reported successfully',
      violationRecorded: true,
      suspicionScore: attempt.proctoring.suspicionScore,
      integrityRating: attempt.proctoring.integrityRating
    });
  } catch (error) {
    console.error('Error reporting violation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get attempt results
router.get('/results/:attemptId', authenticateToken, async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.userId;

    const attempt = await Attempt.findOne({ _id: attemptId, userId })
      .populate('examId', 'title subject totalMarks passingMarks settings')
      .populate('answers.questionId', 'title content type correctAnswer explanation');

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    if (attempt.status !== 'submitted' && attempt.status !== 'auto_submitted') {
      return res.status(400).json({ message: 'Results not available yet' });
    }

    // Check if results should be shown based on exam settings
    const exam = attempt.examId;
    const showResults = exam.settings.showResults;
    
    if (showResults === 'never' || 
        (showResults === 'manual' && !attempt.feedback.reviewRequired)) {
      return res.status(403).json({ message: 'Results not available' });
    }

    const results = {
      attempt: {
        _id: attempt._id,
        score: attempt.score,
        percentage: attempt.percentage,
        grade: attempt.grade,
        status: attempt.status,
        timeSpent: attempt.timing.totalTimeSpent,
        submittedAt: attempt.timing.submittedAt
      },
      exam: {
        title: exam.title,
        subject: exam.subject,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks
      },
      performance: {
        passed: attempt.isPassed,
        rank: null, // Calculate if needed
        percentile: null // Calculate if needed
      },
      proctoring: {
        integrityRating: attempt.proctoring.integrityRating,
        suspicionScore: attempt.proctoring.suspicionScore,
        violationCount: attempt.violationCount,
        criticalViolations: attempt.criticalViolations
      }
    };

    // Include answers if allowed
    if (exam.settings.showCorrectAnswers) {
      results.answers = attempt.answers.map(answer => ({
        questionId: answer.questionId._id,
        question: answer.questionId.title,
        userAnswer: answer.answer,
        correctAnswer: answer.questionId.correctAnswer,
        isCorrect: answer.isCorrect,
        marksObtained: answer.marksObtained,
        explanation: answer.questionId.explanation
      }));
    }

    res.json({ results });
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get student's attempts history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, limit = 10, page = 1 } = req.query;

    const options = {
      status: status || undefined,
      sort: { createdAt: -1 }
    };

    const attempts = await Attempt.findByStudent(userId, options)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Attempt.countDocuments({ userId });

    res.json({
      attempts,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: attempts.length,
        totalRecords: total
      }
    });
  } catch (error) {
    console.error('Error fetching attempt history:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Auto-submit expired attempts (cron job endpoint)
router.post('/auto-submit-expired', async (req, res) => {
  try {
    const now = new Date();
    
    // Find attempts that should be auto-submitted
    const expiredAttempts = await Attempt.find({
      status: 'in_progress',
      'timing.startedAt': { $exists: true }
    }).populate('examId', 'duration');

    let autoSubmittedCount = 0;

    for (const attempt of expiredAttempts) {
      const examDurationMs = attempt.examId.duration * 60 * 1000;
      const examEndTime = new Date(attempt.timing.startedAt.getTime() + examDurationMs);
      
      if (now > examEndTime) {
        attempt.status = 'auto_submitted';
        attempt.timing.submittedAt = examEndTime;
        attempt.timing.totalTimeSpent = Math.floor(examDurationMs / 1000);
        
        await attempt.calculateScore();
        await attempt.save();

        // Log auto-submission
        const proctoringLog = new ProctoringLog({
          attemptId: attempt._id,
          eventType: 'session_end',
          severity: 'info',
          description: 'Exam auto-submitted due to time expiry'
        });
        await proctoringLog.save();

        autoSubmittedCount++;
      }
    }

    res.json({
      message: `Auto-submitted ${autoSubmittedCount} expired attempts`,
      count: autoSubmittedCount
    });
  } catch (error) {
    console.error('Error auto-submitting expired attempts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
