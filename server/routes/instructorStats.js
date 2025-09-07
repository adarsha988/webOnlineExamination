import express from 'express';
import Exam from '../models/exam.model.js';
import StudentExam from '../models/studentExam.model.js';
import Question from '../models/question.model.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.ts';

const router = express.Router();

// GET /api/instructor/stats/:instructorId - Get instructor dashboard statistics
router.get('/:instructorId', authenticateToken, authorizeRole(['instructor', 'admin']), async (req, res) => {
  try {
    const { instructorId } = req.params;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Get total exams created by instructor
    const totalExams = await Exam.countDocuments({
      instructorId,
      status: { $ne: 'inactive' }
    });

    // Get active exams today (ongoing or scheduled for today)
    const activeToday = await Exam.countDocuments({
      instructorId,
      status: { $in: ['ongoing', 'published'] },
      $or: [
        {
          examDate: {
            $gte: startOfDay,
            $lt: endOfDay
          }
        },
        {
          status: 'ongoing'
        }
      ]
    });

    // Get completed exams
    const completedExams = await Exam.countDocuments({
      instructorId,
      status: 'completed'
    });

    // Get upcoming exams
    const upcomingExams = await Exam.countDocuments({
      instructorId,
      status: { $in: ['published', 'upcoming'] },
      examDate: { $gt: now }
    });

    // Get recent exam performance data
    const recentExams = await Exam.find({
      instructorId,
      status: { $in: ['completed', 'ongoing'] }
    })
    .populate({
      path: 'attempts',
      populate: {
        path: 'student',
        select: 'name email'
      }
    })
    .sort({ examDate: -1 })
    .limit(5);

    // Calculate average performance
    let totalStudents = 0;
    let totalScore = 0;
    
    for (const exam of recentExams) {
      const studentExams = await StudentExam.find({
        examId: exam._id,
        status: { $in: ['submitted', 'auto_submitted'] }
      });
      
      totalStudents += studentExams.length;
      totalScore += studentExams.reduce((sum, se) => sum + (se.percentage || 0), 0);
    }

    const averagePerformance = totalStudents > 0 ? Math.round(totalScore / totalStudents) : 0;

    // Get question bank stats
    const totalQuestions = await Question.countDocuments({
      createdBy: instructorId
    });

    const sharedQuestions = await Question.countDocuments({
      createdBy: instructorId,
      scope: 'shared'
    });

    res.json({
      success: true,
      data: {
        totalExams,
        activeToday,
        completedExams,
        upcomingExams,
        averagePerformance,
        totalQuestions,
        sharedQuestions,
        recentActivity: recentExams.map(exam => ({
          id: exam._id,
          title: exam.title,
          subject: exam.subject,
          examDate: exam.examDate,
          status: exam.status,
          studentsCount: exam.attempts?.length || 0
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching instructor stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch instructor statistics',
      error: error.message
    });
  }
});

// GET /api/instructor/performance/:instructorId - Get detailed performance analytics
router.get('/performance/:instructorId', authenticateToken, authorizeRole(['instructor', 'admin']), async (req, res) => {
  try {
    const { instructorId } = req.params;
    const { period = '30' } = req.query; // days
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Get exams in the specified period
    const exams = await Exam.find({
      instructorId,
      examDate: { $gte: daysAgo },
      status: { $in: ['completed', 'ongoing'] }
    });

    const examIds = exams.map(exam => exam._id);

    // Get student exam results
    const studentExams = await StudentExam.find({
      examId: { $in: examIds },
      status: { $in: ['submitted', 'auto_submitted'] }
    }).populate('examId', 'title subject examDate');

    // Calculate performance metrics
    const performanceBySubject = {};
    const performanceByDate = {};

    studentExams.forEach(se => {
      const subject = se.examId.subject;
      const date = se.examId.examDate.toISOString().split('T')[0];

      if (!performanceBySubject[subject]) {
        performanceBySubject[subject] = { total: 0, count: 0 };
      }
      if (!performanceByDate[date]) {
        performanceByDate[date] = { total: 0, count: 0 };
      }

      performanceBySubject[subject].total += se.percentage || 0;
      performanceBySubject[subject].count += 1;
      performanceByDate[date].total += se.percentage || 0;
      performanceByDate[date].count += 1;
    });

    // Calculate averages
    const subjectPerformance = Object.entries(performanceBySubject).map(([subject, data]) => ({
      subject,
      average: Math.round(data.total / data.count),
      count: data.count
    }));

    const datePerformance = Object.entries(performanceByDate).map(([date, data]) => ({
      date,
      average: Math.round(data.total / data.count),
      count: data.count
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      success: true,
      data: {
        subjectPerformance,
        datePerformance,
        totalStudentExams: studentExams.length,
        averageScore: studentExams.length > 0 
          ? Math.round(studentExams.reduce((sum, se) => sum + (se.percentage || 0), 0) / studentExams.length)
          : 0
      }
    });
  } catch (error) {
    console.error('Error fetching instructor performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance analytics',
      error: error.message
    });
  }
});

export default router;
