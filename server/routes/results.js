import express from 'express';
import Attempt from '../models/attempt.model.js';
import Exam from '../models/exam.enhanced.model.js';
import ProctoringLog from '../models/proctoringLog.model.js';
import User from '../models/user.model.enhanced.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get detailed results for an attempt
router.get('/attempt/:attemptId', authenticateToken, async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.userId;

    const attempt = await Attempt.findById(attemptId)
      .populate('examId', 'title subject totalMarks passingMarks duration settings createdBy')
      .populate('userId', 'name email profile')
      .populate('answers.questionId', 'title content type options correctAnswer explanation marks');

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    // Check access permissions
    const isStudent = attempt.userId._id.toString() === userId;
    const isInstructor = attempt.examId.createdBy.toString() === userId;
    
    if (!isStudent && !isInstructor) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get proctoring summary
    const proctoringLogs = await ProctoringLog.find({ attemptId })
      .sort({ timestamp: -1 });

    const violationSummary = await ProctoringLog.getViolationSummary(attemptId);

    // Calculate detailed analytics
    const analytics = {
      timeAnalysis: {
        totalTime: attempt.timing.totalTimeSpent,
        averageTimePerQuestion: attempt.answers.length > 0 
          ? attempt.timing.totalTimeSpent / attempt.answers.length 
          : 0,
        timeDistribution: attempt.answers.map(answer => ({
          questionId: answer.questionId._id,
          timeSpent: answer.timeSpent,
          percentage: (answer.timeSpent / attempt.timing.totalTimeSpent) * 100
        }))
      },
      performanceAnalysis: {
        correctAnswers: attempt.answers.filter(a => a.isCorrect).length,
        totalQuestions: attempt.answers.length,
        accuracyRate: attempt.answers.length > 0 
          ? (attempt.answers.filter(a => a.isCorrect).length / attempt.answers.length) * 100 
          : 0,
        scoreBreakdown: attempt.answers.map(answer => ({
          questionId: answer.questionId._id,
          questionTitle: answer.questionId.title,
          marksObtained: answer.marksObtained,
          totalMarks: answer.questionId.marks,
          isCorrect: answer.isCorrect
        }))
      },
      proctoringAnalysis: {
        integrityRating: attempt.proctoring.integrityRating,
        suspicionScore: attempt.proctoring.suspicionScore,
        totalViolations: attempt.violationCount,
        criticalViolations: attempt.criticalViolations,
        violationBreakdown: violationSummary,
        aiRecommendation: attempt.proctoring.aiAnalysis?.recommendation || 'accept'
      }
    };

    const results = {
      attempt: {
        _id: attempt._id,
        status: attempt.status,
        score: attempt.score,
        percentage: attempt.percentage,
        grade: attempt.grade,
        startedAt: attempt.timing.startedAt,
        submittedAt: attempt.timing.submittedAt,
        totalTimeSpent: attempt.timing.totalTimeSpent
      },
      student: {
        _id: attempt.userId._id,
        name: attempt.userId.name,
        email: attempt.userId.email,
        studentId: attempt.userId.profile?.studentId
      },
      exam: {
        _id: attempt.examId._id,
        title: attempt.examId.title,
        subject: attempt.examId.subject,
        totalMarks: attempt.examId.totalMarks,
        passingMarks: attempt.examId.passingMarks,
        duration: attempt.examId.duration
      },
      analytics,
      answers: isInstructor || attempt.examId.settings.showCorrectAnswers 
        ? attempt.answers.map(answer => ({
            questionId: answer.questionId._id,
            question: {
              title: answer.questionId.title,
              content: answer.questionId.content,
              type: answer.questionId.type,
              options: answer.questionId.options,
              marks: answer.questionId.marks
            },
            userAnswer: answer.answer,
            correctAnswer: answer.questionId.correctAnswer,
            isCorrect: answer.isCorrect,
            marksObtained: answer.marksObtained,
            timeSpent: answer.timeSpent,
            explanation: answer.questionId.explanation,
            flagged: answer.flagged,
            flagReason: answer.flagReason
          }))
        : null,
      proctoringLogs: isInstructor ? proctoringLogs.slice(0, 50) : null // Limit for performance
    };

    res.json({ results });
  } catch (error) {
    console.error('Error fetching detailed results:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get exam results summary (instructor view)
router.get('/exam/:examId/summary', authenticateToken, async (req, res) => {
  try {
    const { examId } = req.params;
    const userId = req.user.userId;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Check if user is instructor
    if (exam.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get all attempts for this exam
    const attempts = await Attempt.findByExam(examId, { status: 'submitted' });

    // Calculate summary statistics
    const totalAttempts = attempts.length;
    const completedAttempts = attempts.filter(a => a.status === 'submitted').length;
    const passedAttempts = attempts.filter(a => a.isPassed).length;
    
    const scores = attempts.map(a => a.score).filter(s => s !== null);
    const percentages = attempts.map(a => a.percentage).filter(p => p !== null);
    
    const averageScore = scores.length > 0 
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
      : 0;
    
    const averagePercentage = percentages.length > 0 
      ? percentages.reduce((sum, pct) => sum + pct, 0) / percentages.length 
      : 0;

    // Grade distribution
    const gradeDistribution = attempts.reduce((dist, attempt) => {
      if (attempt.grade) {
        dist[attempt.grade] = (dist[attempt.grade] || 0) + 1;
      }
      return dist;
    }, {});

    // Time analysis
    const timeTaken = attempts.map(a => a.timing.totalTimeSpent).filter(t => t > 0);
    const averageTime = timeTaken.length > 0 
      ? timeTaken.reduce((sum, time) => sum + time, 0) / timeTaken.length 
      : 0;

    // Proctoring analysis
    const proctoringStats = {
      totalViolations: attempts.reduce((sum, a) => sum + a.violationCount, 0),
      suspiciousAttempts: attempts.filter(a => a.proctoring.suspicionScore > 25).length,
      criticalAttempts: attempts.filter(a => a.proctoring.suspicionScore > 50).length,
      integrityDistribution: attempts.reduce((dist, attempt) => {
        const rating = attempt.proctoring.integrityRating;
        dist[rating] = (dist[rating] || 0) + 1;
        return dist;
      }, {})
    };

    // Question-wise analysis
    const questionAnalysis = [];
    if (attempts.length > 0) {
      const allQuestions = new Set();
      attempts.forEach(attempt => {
        attempt.answers.forEach(answer => {
          allQuestions.add(answer.questionId.toString());
        });
      });

      for (const questionId of allQuestions) {
        const questionAttempts = [];
        attempts.forEach(attempt => {
          const answer = attempt.answers.find(a => a.questionId.toString() === questionId);
          if (answer) questionAttempts.push(answer);
        });

        if (questionAttempts.length > 0) {
          const correctCount = questionAttempts.filter(a => a.isCorrect).length;
          const totalCount = questionAttempts.length;
          const avgTime = questionAttempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0) / totalCount;

          questionAnalysis.push({
            questionId,
            totalAttempts: totalCount,
            correctAttempts: correctCount,
            successRate: (correctCount / totalCount) * 100,
            averageTime: avgTime,
            difficulty: correctCount / totalCount < 0.3 ? 'hard' : 
                       correctCount / totalCount < 0.7 ? 'medium' : 'easy'
          });
        }
      }
    }

    const summary = {
      exam: {
        _id: exam._id,
        title: exam.title,
        subject: exam.subject,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        duration: exam.duration
      },
      statistics: {
        totalAttempts,
        completedAttempts,
        passedAttempts,
        passRate: completedAttempts > 0 ? (passedAttempts / completedAttempts) * 100 : 0,
        averageScore,
        averagePercentage,
        averageTime: Math.round(averageTime),
        gradeDistribution,
        scoreRange: {
          highest: Math.max(...scores, 0),
          lowest: Math.min(...scores, 0),
          median: scores.length > 0 ? scores.sort()[Math.floor(scores.length / 2)] : 0
        }
      },
      proctoringStats,
      questionAnalysis: questionAnalysis.sort((a, b) => a.successRate - b.successRate),
      attempts: attempts.map(attempt => ({
        _id: attempt._id,
        student: {
          _id: attempt.userId._id,
          name: attempt.userId.name,
          email: attempt.userId.email
        },
        score: attempt.score,
        percentage: attempt.percentage,
        grade: attempt.grade,
        timeSpent: attempt.timing.totalTimeSpent,
        submittedAt: attempt.timing.submittedAt,
        proctoring: {
          suspicionScore: attempt.proctoring.suspicionScore,
          integrityRating: attempt.proctoring.integrityRating,
          violationCount: attempt.violationCount
        }
      }))
    };

    res.json({ summary });
  } catch (error) {
    console.error('Error fetching exam summary:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get student performance analytics
router.get('/student/:studentId/analytics', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const userId = req.user.userId;

    // Check if requesting own data or if instructor
    if (studentId !== userId) {
      // Additional role checking should be implemented here
      // For now, allow if user is requesting their own data
    }

    const attempts = await Attempt.findByStudent(studentId)
      .populate('examId', 'title subject totalMarks duration');

    if (attempts.length === 0) {
      return res.json({
        message: 'No attempts found',
        analytics: {
          totalExams: 0,
          completedExams: 0,
          averageScore: 0,
          averagePercentage: 0,
          passRate: 0,
          subjectPerformance: {},
          timeAnalysis: {},
          proctoringAnalysis: {}
        }
      });
    }

    const completedAttempts = attempts.filter(a => a.status === 'submitted');
    const passedAttempts = completedAttempts.filter(a => a.isPassed);

    // Subject-wise performance
    const subjectPerformance = {};
    completedAttempts.forEach(attempt => {
      const subject = attempt.examId.subject;
      if (!subjectPerformance[subject]) {
        subjectPerformance[subject] = {
          totalExams: 0,
          totalScore: 0,
          totalPercentage: 0,
          passed: 0,
          totalTime: 0
        };
      }
      
      subjectPerformance[subject].totalExams++;
      subjectPerformance[subject].totalScore += attempt.score || 0;
      subjectPerformance[subject].totalPercentage += attempt.percentage || 0;
      subjectPerformance[subject].totalTime += attempt.timing.totalTimeSpent || 0;
      if (attempt.isPassed) subjectPerformance[subject].passed++;
    });

    // Calculate averages for each subject
    Object.keys(subjectPerformance).forEach(subject => {
      const data = subjectPerformance[subject];
      data.averageScore = data.totalScore / data.totalExams;
      data.averagePercentage = data.totalPercentage / data.totalExams;
      data.passRate = (data.passed / data.totalExams) * 100;
      data.averageTime = data.totalTime / data.totalExams;
    });

    // Performance trends (last 10 exams)
    const recentAttempts = completedAttempts
      .sort((a, b) => new Date(b.timing.submittedAt) - new Date(a.timing.submittedAt))
      .slice(0, 10);

    const performanceTrend = recentAttempts.reverse().map(attempt => ({
      examTitle: attempt.examId.title,
      subject: attempt.examId.subject,
      percentage: attempt.percentage,
      date: attempt.timing.submittedAt,
      passed: attempt.isPassed
    }));

    // Proctoring analysis
    const proctoringAnalysis = {
      totalViolations: attempts.reduce((sum, a) => sum + a.violationCount, 0),
      averageSuspicionScore: attempts.length > 0 
        ? attempts.reduce((sum, a) => sum + a.proctoring.suspicionScore, 0) / attempts.length 
        : 0,
      integrityDistribution: attempts.reduce((dist, attempt) => {
        const rating = attempt.proctoring.integrityRating;
        dist[rating] = (dist[rating] || 0) + 1;
        return dist;
      }, {}),
      flaggedExams: attempts.filter(a => a.proctoring.suspicionScore > 25).length
    };

    const analytics = {
      totalExams: attempts.length,
      completedExams: completedAttempts.length,
      passedExams: passedAttempts.length,
      passRate: completedAttempts.length > 0 ? (passedAttempts.length / completedAttempts.length) * 100 : 0,
      averageScore: completedAttempts.length > 0 
        ? completedAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / completedAttempts.length 
        : 0,
      averagePercentage: completedAttempts.length > 0 
        ? completedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / completedAttempts.length 
        : 0,
      subjectPerformance,
      performanceTrend,
      timeAnalysis: {
        averageTimePerExam: completedAttempts.length > 0 
          ? completedAttempts.reduce((sum, a) => sum + (a.timing.totalTimeSpent || 0), 0) / completedAttempts.length 
          : 0,
        fastestExam: Math.min(...completedAttempts.map(a => a.timing.totalTimeSpent || Infinity)),
        slowestExam: Math.max(...completedAttempts.map(a => a.timing.totalTimeSpent || 0))
      },
      proctoringAnalysis,
      gradeDistribution: attempts.reduce((dist, attempt) => {
        if (attempt.grade) {
          dist[attempt.grade] = (dist[attempt.grade] || 0) + 1;
        }
        return dist;
      }, {})
    };

    res.json({ analytics });
  } catch (error) {
    console.error('Error fetching student analytics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Export results to CSV (instructor only)
router.get('/exam/:examId/export', authenticateToken, async (req, res) => {
  try {
    const { examId } = req.params;
    const { format = 'csv' } = req.query;
    const userId = req.user.userId;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    if (exam.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const attempts = await Attempt.findByExam(examId, { status: 'submitted' });

    if (format === 'csv') {
      let csvContent = 'Student Name,Email,Student ID,Score,Percentage,Grade,Time Spent,Submitted At,Integrity Rating,Suspicion Score,Violations\n';
      
      attempts.forEach(attempt => {
        const row = [
          attempt.userId.name,
          attempt.userId.email,
          attempt.userId.profile?.studentId || '',
          attempt.score || 0,
          attempt.percentage || 0,
          attempt.grade || '',
          Math.round((attempt.timing.totalTimeSpent || 0) / 60), // minutes
          attempt.timing.submittedAt?.toISOString() || '',
          attempt.proctoring.integrityRating,
          attempt.proctoring.suspicionScore,
          attempt.violationCount
        ].map(field => `"${field}"`).join(',');
        
        csvContent += row + '\n';
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${exam.title}_results.csv"`);
      res.send(csvContent);
    } else {
      // JSON format
      const exportData = {
        exam: {
          title: exam.title,
          subject: exam.subject,
          totalMarks: exam.totalMarks,
          exportedAt: new Date().toISOString()
        },
        results: attempts.map(attempt => ({
          student: {
            name: attempt.userId.name,
            email: attempt.userId.email,
            studentId: attempt.userId.profile?.studentId
          },
          performance: {
            score: attempt.score,
            percentage: attempt.percentage,
            grade: attempt.grade,
            timeSpent: attempt.timing.totalTimeSpent,
            submittedAt: attempt.timing.submittedAt
          },
          proctoring: {
            integrityRating: attempt.proctoring.integrityRating,
            suspicionScore: attempt.proctoring.suspicionScore,
            violationCount: attempt.violationCount
          }
        }))
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${exam.title}_results.json"`);
      res.json(exportData);
    }
  } catch (error) {
    console.error('Error exporting results:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
