import express from 'express';
import Exam from '../models/exam.model.js';
import StudentExam from '../models/studentExam.model.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.ts';

const router = express.Router();

// GET /api/student/stats/:studentId - Get student dashboard statistics
router.get('/:studentId', authenticateToken, authorizeRole(['student', 'admin']), async (req, res) => {
  try {
    const { studentId } = req.params;
    const now = new Date();

    // Get total exams available to student
    const totalExams = await Exam.countDocuments({
      $or: [
        { assignedStudents: studentId },
        { assignedStudents: { $exists: false } },
        { assignedStudents: { $size: 0 } }
      ],
      status: { $ne: 'inactive' }
    });

    // Get completed exams by student
    const completedExams = await StudentExam.countDocuments({
      studentId,
      status: { $in: ['submitted', 'auto_submitted'] }
    });

    // Get upcoming exams count
    const upcomingExams = await Exam.countDocuments({
      examDate: { $gt: now },
      status: { $in: ['published', 'upcoming'] },
      $or: [
        { assignedStudents: studentId },
        { assignedStudents: { $exists: false } },
        { assignedStudents: { $size: 0 } }
      ]
    });

    // Calculate average score
    const studentExamResults = await StudentExam.find({
      studentId,
      status: { $in: ['submitted', 'auto_submitted'] },
      percentage: { $ne: null }
    });

    const averageScore = studentExamResults.length > 0
      ? Math.round(studentExamResults.reduce((sum, se) => sum + se.percentage, 0) / studentExamResults.length)
      : 0;

    // Get recent performance data
    const recentExams = await StudentExam.find({
      studentId,
      status: { $in: ['submitted', 'auto_submitted'] }
    })
    .populate('examId', 'title subject examDate totalMarks')
    .sort({ submittedAt: -1 })
    .limit(10);

    // Calculate subject-wise performance
    const subjectPerformance = {};
    recentExams.forEach(se => {
      if (se.examId && se.percentage !== null) {
        const subject = se.examId.subject;
        if (!subjectPerformance[subject]) {
          subjectPerformance[subject] = { total: 0, count: 0, scores: [] };
        }
        subjectPerformance[subject].total += se.percentage;
        subjectPerformance[subject].count += 1;
        subjectPerformance[subject].scores.push(se.percentage);
      }
    });

    const subjectStats = Object.entries(subjectPerformance).map(([subject, data]) => ({
      subject,
      average: Math.round(data.total / data.count),
      examCount: data.count,
      highest: Math.max(...data.scores),
      lowest: Math.min(...data.scores)
    }));

    // Get grade distribution
    const gradeDistribution = {
      'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'F': 0
    };

    studentExamResults.forEach(se => {
      if (se.grade && gradeDistribution.hasOwnProperty(se.grade)) {
        gradeDistribution[se.grade]++;
      }
    });

    // Get monthly performance trend (last 6 months)
    const monthlyPerformance = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthlyExams = await StudentExam.find({
        studentId,
        status: { $in: ['submitted', 'auto_submitted'] },
        submittedAt: { $gte: startOfMonth, $lte: endOfMonth },
        percentage: { $ne: null }
      });

      const monthAverage = monthlyExams.length > 0
        ? Math.round(monthlyExams.reduce((sum, se) => sum + se.percentage, 0) / monthlyExams.length)
        : 0;

      monthlyPerformance.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        average: monthAverage,
        examCount: monthlyExams.length
      });
    }

    res.json({
      success: true,
      data: {
        totalExams,
        completedExams,
        upcomingExams,
        averageScore,
        subjectStats,
        gradeDistribution,
        monthlyPerformance,
        recentActivity: recentExams.slice(0, 5).map(se => ({
          id: se._id,
          examTitle: se.examId?.title || 'Unknown Exam',
          subject: se.examId?.subject || 'Unknown',
          score: se.score,
          percentage: se.percentage,
          grade: se.grade,
          submittedAt: se.submittedAt
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching student stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student statistics',
      error: error.message
    });
  }
});

// GET /api/student/performance/:studentId - Get detailed performance analytics
router.get('/performance/:studentId', authenticateToken, authorizeRole(['student', 'admin']), async (req, res) => {
  try {
    const { studentId } = req.params;
    const { subject, period = '90' } = req.query; // days

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    let query = {
      studentId,
      status: { $in: ['submitted', 'auto_submitted'] },
      submittedAt: { $gte: daysAgo }
    };

    const studentExams = await StudentExam.find(query)
      .populate('examId', 'title subject examDate totalMarks')
      .sort({ submittedAt: -1 });

    // Filter by subject if specified
    const filteredExams = subject 
      ? studentExams.filter(se => se.examId?.subject === subject)
      : studentExams;

    // Calculate performance trends
    const performanceData = filteredExams.map(se => ({
      date: se.submittedAt.toISOString().split('T')[0],
      examTitle: se.examId?.title || 'Unknown',
      subject: se.examId?.subject || 'Unknown',
      score: se.score,
      percentage: se.percentage,
      grade: se.grade,
      timeSpent: se.timeElapsed || 0
    }));

    // Calculate improvement trend
    const scores = filteredExams.map(se => se.percentage).filter(p => p !== null);
    let improvementTrend = 0;
    if (scores.length >= 2) {
      const firstHalf = scores.slice(Math.floor(scores.length / 2));
      const secondHalf = scores.slice(0, Math.floor(scores.length / 2));
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      improvementTrend = Math.round(((secondAvg - firstAvg) / firstAvg) * 100);
    }

    // Get strengths and weaknesses by subject
    const subjectAnalysis = {};
    filteredExams.forEach(se => {
      if (se.examId && se.percentage !== null) {
        const subj = se.examId.subject;
        if (!subjectAnalysis[subj]) {
          subjectAnalysis[subj] = { scores: [], count: 0 };
        }
        subjectAnalysis[subj].scores.push(se.percentage);
        subjectAnalysis[subj].count++;
      }
    });

    const strengths = [];
    const weaknesses = [];

    Object.entries(subjectAnalysis).forEach(([subj, data]) => {
      const average = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
      if (average >= 80) {
        strengths.push({ subject: subj, average: Math.round(average), examCount: data.count });
      } else if (average < 60) {
        weaknesses.push({ subject: subj, average: Math.round(average), examCount: data.count });
      }
    });

    res.json({
      success: true,
      data: {
        performanceData,
        improvementTrend,
        strengths,
        weaknesses,
        totalExamsAnalyzed: filteredExams.length,
        averageScore: scores.length > 0 
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0
      }
    });
  } catch (error) {
    console.error('Error fetching student performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance analytics',
      error: error.message
    });
  }
});

export default router;
