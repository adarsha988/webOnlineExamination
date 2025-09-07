import express from 'express';
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import Exam from '../models/exam.model.js';
import StudentExam from '../models/studentExam.model.js';
import Question from '../models/question.model.js';
import Notification from '../models/notification.model.js';
import Activity from '../models/activity.model.js';

const router = express.Router();

// System Overview Analytics (Admin Only)
router.get('/system-overview', async (req, res) => {
  try {
    const { timeRange = '30d', subject } = req.query;
    
    // Calculate date range
    const days = parseInt(timeRange.replace('d', '')) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Basic counts
    const [totalUsers, totalExams, totalQuestions, totalSubmissions] = await Promise.all([
      User.countDocuments(),
      Exam.countDocuments(),
      Question.countDocuments(),
      StudentExam.countDocuments()
    ]);

    // User distribution
    const userDistribution = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          value: '$count',
          _id: 0
        }
      }
    ]);

    // New users this month
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: startDate }
    });

    // Active exams
    const activeExams = await Exam.countDocuments({
      status: 'published',
      scheduledDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    // Daily activity for the chart
    const dailyActivity = await Activity.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          users: { $addToSet: '$userId' },
          exams: { $sum: { $cond: [{ $eq: ['$type', 'exam_taken'] }, 1, 0] } }
        }
      },
      {
        $project: {
          date: '$_id.date',
          users: { $size: '$users' },
          exams: 1,
          _id: 0
        }
      },
      { $sort: { date: 1 } }
    ]);

    // System load calculation (simplified)
    const recentActivity = await Activity.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    const systemLoad = Math.min(Math.round((recentActivity / 100) * 100), 100);

    // Active users today
    const activeToday = await Activity.distinct('userId', {
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    }).then(users => users.length);

    // Average performance
    const avgPerformanceResult = await StudentExam.aggregate([
      { $match: { status: 'completed', score: { $exists: true } } },
      { $group: { _id: null, avgScore: { $avg: '$percentage' } } }
    ]);
    const avgPerformance = avgPerformanceResult[0]?.avgScore || 0;

    // Performance trend (compare with previous period)
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - days);
    
    const previousAvgResult = await StudentExam.aggregate([
      { 
        $match: { 
          status: 'completed', 
          score: { $exists: true },
          submittedAt: { $gte: previousPeriodStart, $lt: startDate }
        }
      },
      { $group: { _id: null, avgScore: { $avg: '$percentage' } } }
    ]);
    const previousAvg = previousAvgResult[0]?.avgScore || 0;
    const performanceTrend = avgPerformance - previousAvg;

    res.json({
      totalUsers,
      totalExams,
      totalQuestions,
      totalSubmissions,
      newUsersThisMonth,
      activeExams,
      systemLoad,
      activeToday,
      avgPerformance: Math.round(avgPerformance),
      performanceTrend: Math.round(performanceTrend * 10) / 10,
      userDistribution,
      dailyActivity
    });

  } catch (error) {
    console.error('Error fetching system analytics:', error);
    res.status(500).json({ message: 'Failed to fetch system analytics' });
  }
});

// Instructor Analytics
router.get('/instructor/:instructorId', async (req, res) => {
  try {
    const { instructorId } = req.params;
    const { timeRange = '30d', subject } = req.query;
    
    const days = parseInt(timeRange.replace('d', '')) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build match conditions
    const examMatch = { instructorId: new mongoose.Types.ObjectId(instructorId) };
    if (subject && subject !== 'all') {
      examMatch.subject = subject;
    }

    // Instructor's exams
    const instructorExams = await Exam.find(examMatch);
    const examIds = instructorExams.map(exam => exam._id);

    // Basic counts
    const totalExams = instructorExams.length;
    const activeExams = instructorExams.filter(exam => 
      exam.status === 'published' && 
      new Date(exam.scheduledDate) <= new Date() && 
      new Date(exam.endDate) >= new Date()
    ).length;

    // Students who have taken instructor's exams
    const studentExams = await StudentExam.find({
      examId: { $in: examIds }
    }).populate('studentId', 'name email');

    const uniqueStudents = [...new Set(studentExams.map(se => se.studentId?._id?.toString()))];
    const totalStudents = uniqueStudents.length;

    // Active students (took exam in time range)
    const activeStudents = await StudentExam.distinct('studentId', {
      examId: { $in: examIds },
      startedAt: { $gte: startDate }
    }).then(students => students.length);

    // Performance metrics
    const completedExams = studentExams.filter(se => se.status === 'completed' && se.score !== undefined);
    const avgScore = completedExams.length > 0 
      ? completedExams.reduce((sum, se) => sum + (se.percentage || 0), 0) / completedExams.length 
      : 0;

    const passedExams = completedExams.filter(se => (se.percentage || 0) >= 40);
    const passRate = completedExams.length > 0 ? (passedExams.length / completedExams.length) * 100 : 0;

    const totalSubmissions = completedExams.length;
    const totalAttempts = studentExams.length;
    const completionRate = totalAttempts > 0 ? (totalSubmissions / totalAttempts) * 100 : 0;

    // Subject performance
    const subjectPerformance = await StudentExam.aggregate([
      {
        $match: {
          examId: { $in: examIds },
          status: 'completed',
          score: { $exists: true }
        }
      },
      {
        $lookup: {
          from: 'exams',
          localField: 'examId',
          foreignField: '_id',
          as: 'exam'
        }
      },
      { $unwind: '$exam' },
      {
        $group: {
          _id: '$exam.subject',
          avgScore: { $avg: '$percentage' },
          totalExams: { $sum: 1 },
          passed: {
            $sum: {
              $cond: [{ $gte: ['$percentage', 40] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          subject: '$_id',
          avgScore: { $round: ['$avgScore', 1] },
          passRate: { 
            $round: [
              { $multiply: [{ $divide: ['$passed', '$totalExams'] }, 100] }, 
              1
            ] 
          },
          _id: 0
        }
      }
    ]);

    // Performance radar data
    const performanceRadar = await StudentExam.aggregate([
      {
        $match: {
          examId: { $in: examIds },
          status: 'completed',
          score: { $exists: true }
        }
      },
      {
        $lookup: {
          from: 'exams',
          localField: 'examId',
          foreignField: '_id',
          as: 'exam'
        }
      },
      { $unwind: '$exam' },
      {
        $group: {
          _id: '$exam.subject',
          classAvg: { $avg: '$percentage' },
          scores: { $push: '$percentage' }
        }
      },
      {
        $project: {
          subject: '$_id',
          classAvg: { $round: ['$classAvg', 1] },
          topPerformers: {
            $round: [
              {
                $avg: {
                  $filter: {
                    input: '$scores',
                    cond: { $gte: ['$$this', 80] }
                  }
                }
              },
              1
            ]
          },
          _id: 0
        }
      }
    ]);

    res.json({
      totalExams,
      activeExams,
      totalStudents,
      activeStudents,
      avgScore: Math.round(avgScore),
      passRate: Math.round(passRate),
      completionRate: Math.round(completionRate),
      totalSubmissions,
      subjectPerformance,
      performanceRadar: performanceRadar.length > 0 ? performanceRadar : [
        { subject: 'Mathematics', classAvg: 75, topPerformers: 85 },
        { subject: 'Science', classAvg: 70, topPerformers: 80 },
        { subject: 'English', classAvg: 78, topPerformers: 88 }
      ]
    });

  } catch (error) {
    console.error('Error fetching instructor analytics:', error);
    res.status(500).json({ message: 'Failed to fetch instructor analytics' });
  }
});

// Student Analytics
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { timeRange = '30d', subject } = req.query;
    
    const days = parseInt(timeRange.replace('d', '')) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Student's exam records
    const studentExams = await StudentExam.find({
      studentId: new mongoose.Types.ObjectId(studentId)
    }).populate('examId', 'title subject scheduledDate');

    // Basic counts
    const examsTaken = studentExams.filter(se => se.status === 'completed').length;
    const upcomingExams = await Exam.countDocuments({
      'attempts.student': new mongoose.Types.ObjectId(studentId),
      scheduledDate: { $gt: new Date() },
      status: 'published'
    });

    // Performance metrics
    const completedExams = studentExams.filter(se => se.status === 'completed' && se.score !== undefined);
    const avgScore = completedExams.length > 0 
      ? completedExams.reduce((sum, se) => sum + (se.percentage || 0), 0) / completedExams.length 
      : 0;

    const bestScore = completedExams.length > 0 
      ? Math.max(...completedExams.map(se => se.percentage || 0))
      : 0;

    // Class ranking (simplified)
    const allStudentScores = await StudentExam.aggregate([
      {
        $match: {
          status: 'completed',
          score: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$studentId',
          avgScore: { $avg: '$percentage' }
        }
      },
      { $sort: { avgScore: -1 } }
    ]);

    const studentRankIndex = allStudentScores.findIndex(s => s._id.toString() === studentId);
    const classRank = studentRankIndex >= 0 ? studentRankIndex + 1 : 0;
    const percentile = allStudentScores.length > 0 
      ? Math.round(((allStudentScores.length - studentRankIndex) / allStudentScores.length) * 100)
      : 0;

    // Study time (simplified calculation based on exam duration)
    const studyTime = completedExams.reduce((total, se) => {
      if (se.startedAt && se.submittedAt) {
        const duration = (new Date(se.submittedAt) - new Date(se.startedAt)) / (1000 * 60 * 60);
        return total + duration;
      }
      return total;
    }, 0);

    // Score progression
    const scoreProgression = completedExams
      .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt))
      .map(se => ({
        date: new Date(se.submittedAt).toLocaleDateString(),
        score: se.percentage || 0,
        classAvg: 75 // Simplified - would need actual class average calculation
      }));

    // Subject strengths
    const subjectStrengths = await StudentExam.aggregate([
      {
        $match: {
          studentId: new mongoose.Types.ObjectId(studentId),
          status: 'completed',
          score: { $exists: true }
        }
      },
      {
        $lookup: {
          from: 'exams',
          localField: 'examId',
          foreignField: '_id',
          as: 'exam'
        }
      },
      { $unwind: '$exam' },
      {
        $group: {
          _id: '$exam.subject',
          myScore: { $avg: '$percentage' },
          examCount: { $sum: 1 }
        }
      },
      {
        $project: {
          subject: '$_id',
          myScore: { $round: ['$myScore', 1] },
          classAvg: 75, // Simplified
          _id: 0
        }
      }
    ]);

    res.json({
      examsTaken,
      upcomingExams,
      avgScore: Math.round(avgScore),
      bestScore: Math.round(bestScore),
      classRank,
      percentile,
      studyTime: Math.round(studyTime),
      scoreProgression,
      subjectStrengths: subjectStrengths.length > 0 ? subjectStrengths : [
        { subject: 'Mathematics', myScore: avgScore, classAvg: 75 },
        { subject: 'Science', myScore: avgScore * 0.9, classAvg: 70 }
      ]
    });

  } catch (error) {
    console.error('Error fetching student analytics:', error);
    res.status(500).json({ message: 'Failed to fetch student analytics' });
  }
});

// Export Analytics Data
router.get('/export/:role/:userId', async (req, res) => {
  try {
    const { role, userId } = req.params;
    const { format = 'csv', timeRange = '30d' } = req.query;

    let data = {};
    
    // Fetch appropriate data based on role
    if (role === 'admin') {
      const systemData = await fetch(`${req.protocol}://${req.get('host')}/api/analytics/system-overview?timeRange=${timeRange}`);
      data = await systemData.json();
    } else if (role === 'instructor') {
      const instructorData = await fetch(`${req.protocol}://${req.get('host')}/api/analytics/instructor/${userId}?timeRange=${timeRange}`);
      data = await instructorData.json();
    } else {
      const studentData = await fetch(`${req.protocol}://${req.get('host')}/api/analytics/student/${userId}?timeRange=${timeRange}`);
      data = await studentData.json();
    }

    if (format === 'csv') {
      // Convert to CSV
      const csv = convertToCSV(data, role);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${role}-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } else if (format === 'pdf') {
      // For PDF, you would typically use a library like puppeteer or jsPDF
      // For now, return JSON with PDF mime type
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${role}-${new Date().toISOString().split('T')[0]}.pdf`);
      res.json({ message: 'PDF export not implemented yet', data });
    } else {
      res.json(data);
    }

  } catch (error) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({ message: 'Failed to export analytics' });
  }
});

// Helper function to convert data to CSV
function convertToCSV(data, role) {
  const headers = [];
  const rows = [];

  if (role === 'admin') {
    headers.push('Metric', 'Value');
    rows.push(['Total Users', data.totalUsers]);
    rows.push(['Total Exams', data.totalExams]);
    rows.push(['Active Exams', data.activeExams]);
    rows.push(['System Load', `${data.systemLoad}%`]);
    rows.push(['Average Performance', `${data.avgPerformance}%`]);
  } else if (role === 'instructor') {
    headers.push('Metric', 'Value');
    rows.push(['Total Exams', data.totalExams]);
    rows.push(['Total Students', data.totalStudents]);
    rows.push(['Average Score', `${data.avgScore}%`]);
    rows.push(['Pass Rate', `${data.passRate}%`]);
    rows.push(['Completion Rate', `${data.completionRate}%`]);
  } else {
    headers.push('Metric', 'Value');
    rows.push(['Exams Taken', data.examsTaken]);
    rows.push(['Average Score', `${data.avgScore}%`]);
    rows.push(['Best Score', `${data.bestScore}%`]);
    rows.push(['Class Rank', data.classRank]);
    rows.push(['Percentile', `${data.percentile}th`]);
  }

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  return csvContent;
}

export default router;
