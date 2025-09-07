import express from 'express';
import Question from '../models/question.model.js';
import SharedBank from '../models/sharedBank.model.js';
import User from '../models/user.model.js';
import Activity from '../models/activity.model.js';
import { authenticateToken } from '../middleware/auth.ts';

const router = express.Router();

// Middleware to check instructor or admin role
const requireInstructorOrAdmin = (req, res, next) => {
  if (!req.user || !['instructor', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied. Instructor or Admin role required.' });
  }
  next();
};

// GET /api/analytics/instructor/:id - Instructor analytics dashboard
router.get('/instructor/:id', authenticateToken, requireInstructorOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { timeframe = '30d' } = req.query;
    const requestingUserId = req.user.userId;
    const requestingUserRole = req.user.role;

    // Check permissions - instructors can only view their own analytics, admins can view any
    if (requestingUserRole !== 'admin' && requestingUserId !== id) {
      return res.status(403).json({ message: 'Access denied. Can only view your own analytics.' });
    }

    // Calculate date range
    let dateFilter = {};
    const now = new Date();
    if (timeframe === '7d') {
      dateFilter.createdAt = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
    } else if (timeframe === '30d') {
      dateFilter.createdAt = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
    } else if (timeframe === '90d') {
      dateFilter.createdAt = { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
    } else if (timeframe === '1y') {
      dateFilter.createdAt = { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
    }

    // Get instructor info
    const instructor = await User.findById(id).select('name email departmentId');
    if (!instructor) {
      return res.status(404).json({ message: 'Instructor not found' });
    }

    // Personal question bank statistics
    const personalStats = await Question.aggregate([
      { $match: { createdBy: id, scope: 'private', isActive: true, ...dateFilter } },
      {
        $group: {
          _id: null,
          totalQuestions: { $sum: 1 },
          byDifficulty: {
            $push: {
              difficulty: '$difficulty',
              count: 1
            }
          },
          byType: {
            $push: {
              type: '$type',
              count: 1
            }
          },
          bySubject: {
            $push: {
              subject: '$subject',
              count: 1
            }
          }
        }
      }
    ]);

    // Shared question contributions
    const sharedStats = await Question.aggregate([
      { $match: { createdBy: id, scope: 'shared', isActive: true, ...dateFilter } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Shared banks owned or collaborated
    const sharedBanks = await SharedBank.find({
      $or: [
        { owners: id },
        { 'collaborators.userId': id }
      ],
      isActive: true
    }).populate('owners', 'name email').select('name subject stats owners collaborators');

    // Question creation trends over time
    const creationTrends = await Question.aggregate([
      { $match: { createdBy: id, isActive: true, ...dateFilter } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            scope: '$scope'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Recent activity
    const recentActivity = await Activity.find({
      user: id,
      type: { $in: ['question_created', 'question_updated', 'question_shared', 'question_approved'] },
      ...dateFilter
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('user', 'name email');

    // Usage in exams (mock data for now - would need exam model integration)
    const examUsage = {
      totalExamsCreated: Math.floor(Math.random() * 20) + 5,
      questionsUsedInExams: Math.floor(Math.random() * 100) + 50,
      avgStudentScore: Math.floor(Math.random() * 20) + 75,
      passRate: Math.floor(Math.random() * 30) + 70
    };

    // Process aggregated data
    const processGroupedData = (data, field) => {
      const grouped = {};
      data.forEach(item => {
        const key = item[field];
        grouped[key] = (grouped[key] || 0) + 1;
      });
      return Object.entries(grouped).map(([key, value]) => ({ name: key, value }));
    };

    const personal = personalStats[0] || { totalQuestions: 0, byDifficulty: [], byType: [], bySubject: [] };
    const shared = {
      approved: sharedStats.find(s => s._id === 'approved')?.count || 0,
      pending: sharedStats.find(s => ['suggested', 'draft'].includes(s._id))?.count || 0,
      rejected: sharedStats.find(s => s._id === 'rejected')?.count || 0
    };

    res.json({
      instructor,
      timeframe,
      personal: {
        totalQuestions: personal.totalQuestions,
        byDifficulty: processGroupedData(personal.byDifficulty, 'difficulty'),
        byType: processGroupedData(personal.byType, 'type'),
        bySubject: processGroupedData(personal.bySubject, 'subject')
      },
      shared: {
        ...shared,
        total: shared.approved + shared.pending + shared.rejected,
        banks: sharedBanks.map(bank => ({
          id: bank._id,
          name: bank.name,
          subject: bank.subject,
          isOwner: bank.owners.some(owner => owner._id.toString() === id),
          stats: bank.stats
        }))
      },
      trends: creationTrends,
      examUsage,
      recentActivity
    });

  } catch (error) {
    console.error('Error fetching instructor analytics:', error);
    res.status(500).json({ message: 'Error fetching instructor analytics', error: error.message });
  }
});

// GET /api/analytics/exam/:examId - Exam-level analytics
router.get('/exam/:examId', authenticateToken, requireInstructorOrAdmin, async (req, res) => {
  try {
    const { examId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Mock exam analytics (would integrate with actual exam model)
    const examAnalytics = {
      examId,
      title: 'Sample Exam Analytics',
      totalQuestions: Math.floor(Math.random() * 30) + 20,
      totalAttempts: Math.floor(Math.random() * 100) + 50,
      averageScore: Math.floor(Math.random() * 20) + 75,
      passRate: Math.floor(Math.random() * 30) + 70,
      completionRate: Math.floor(Math.random() * 20) + 80,
      
      // Score distribution
      scoreDistribution: [
        { range: '0-20', count: Math.floor(Math.random() * 5) + 1 },
        { range: '21-40', count: Math.floor(Math.random() * 8) + 2 },
        { range: '41-60', count: Math.floor(Math.random() * 15) + 5 },
        { range: '61-80', count: Math.floor(Math.random() * 25) + 15 },
        { range: '81-100', count: Math.floor(Math.random() * 20) + 10 }
      ],
      
      // Question performance
      questionPerformance: Array.from({ length: 10 }, (_, i) => ({
        questionId: `q${i + 1}`,
        questionText: `Sample Question ${i + 1}`,
        correctAnswers: Math.floor(Math.random() * 40) + 30,
        totalAttempts: 50,
        difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)],
        avgTimeSpent: Math.floor(Math.random() * 120) + 60
      })),
      
      // Time analysis
      timeAnalysis: {
        averageCompletionTime: Math.floor(Math.random() * 1800) + 1200, // seconds
        fastestCompletion: Math.floor(Math.random() * 600) + 300,
        slowestCompletion: Math.floor(Math.random() * 1800) + 2400
      },
      
      // Student performance trends
      performanceTrends: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        attempts: Math.floor(Math.random() * 20) + 5,
        averageScore: Math.floor(Math.random() * 20) + 70
      }))
    };

    res.json(examAnalytics);

  } catch (error) {
    console.error('Error fetching exam analytics:', error);
    res.status(500).json({ message: 'Error fetching exam analytics', error: error.message });
  }
});

// GET /api/analytics/department/:deptId - Department-wide analytics (Admin only)
router.get('/department/:deptId', authenticateToken, async (req, res) => {
  try {
    const { deptId } = req.params;
    const { timeframe = '30d' } = req.query;
    const userRole = req.user.role;

    // Only admins can view department analytics
    if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    // Calculate date range
    let dateFilter = {};
    const now = new Date();
    if (timeframe === '7d') {
      dateFilter.createdAt = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
    } else if (timeframe === '30d') {
      dateFilter.createdAt = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
    } else if (timeframe === '90d') {
      dateFilter.createdAt = { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
    }

    // Get department instructors
    const departmentInstructors = await User.find({
      departmentId: deptId,
      role: 'instructor'
    }).select('_id name email');

    const instructorIds = departmentInstructors.map(i => i._id);

    // Department question statistics
    const departmentStats = await Question.aggregate([
      { $match: { createdBy: { $in: instructorIds }, isActive: true, ...dateFilter } },
      {
        $group: {
          _id: null,
          totalQuestions: { $sum: 1 },
          privateQuestions: { $sum: { $cond: [{ $eq: ['$scope', 'private'] }, 1, 0] } },
          sharedQuestions: { $sum: { $cond: [{ $eq: ['$scope', 'shared'] }, 1, 0] } },
          approvedShared: { 
            $sum: { 
              $cond: [
                { $and: [{ $eq: ['$scope', 'shared'] }, { $eq: ['$status', 'approved'] }] }, 
                1, 
                0
              ] 
            } 
          },
          pendingShared: { 
            $sum: { 
              $cond: [
                { $and: [{ $eq: ['$scope', 'shared'] }, { $in: ['$status', ['suggested', 'draft']] }] }, 
                1, 
                0
              ] 
            } 
          }
        }
      }
    ]);

    // Instructor contributions leaderboard
    const instructorLeaderboard = await Question.aggregate([
      { $match: { createdBy: { $in: instructorIds }, isActive: true, ...dateFilter } },
      {
        $group: {
          _id: '$createdBy',
          totalQuestions: { $sum: 1 },
          sharedQuestions: { $sum: { $cond: [{ $eq: ['$scope', 'shared'] }, 1, 0] } },
          approvedShared: { 
            $sum: { 
              $cond: [
                { $and: [{ $eq: ['$scope', 'shared'] }, { $eq: ['$status', 'approved'] }] }, 
                1, 
                0
              ] 
            } 
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'instructor'
        }
      },
      { $unwind: '$instructor' },
      {
        $project: {
          name: '$instructor.name',
          email: '$instructor.email',
          totalQuestions: 1,
          sharedQuestions: 1,
          approvedShared: 1,
          contributionScore: { $add: ['$totalQuestions', { $multiply: ['$approvedShared', 2] }] }
        }
      },
      { $sort: { contributionScore: -1 } }
    ]);

    // Subject distribution
    const subjectDistribution = await Question.aggregate([
      { $match: { createdBy: { $in: instructorIds }, isActive: true, ...dateFilter } },
      {
        $group: {
          _id: '$subject',
          count: { $sum: 1 },
          instructors: { $addToSet: '$createdBy' }
        }
      },
      {
        $project: {
          subject: '$_id',
          questionCount: '$count',
          instructorCount: { $size: '$instructors' }
        }
      },
      { $sort: { questionCount: -1 } }
    ]);

    // Department shared banks
    const departmentSharedBanks = await SharedBank.find({
      departmentId: deptId,
      isActive: true
    }).populate('owners', 'name email').select('name subject stats owners collaborators createdAt');

    // Activity trends
    const activityTrends = await Question.aggregate([
      { $match: { createdBy: { $in: instructorIds }, isActive: true, ...dateFilter } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            scope: '$scope'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Collaboration metrics
    const collaborationMetrics = await SharedBank.aggregate([
      { $match: { departmentId: deptId, isActive: true } },
      {
        $group: {
          _id: null,
          totalBanks: { $sum: 1 },
          totalCollaborators: { $sum: '$stats.totalCollaborators' },
          avgCollaboratorsPerBank: { $avg: '$stats.totalCollaborators' },
          totalQuestions: { $sum: '$stats.totalQuestions' },
          totalApproved: { $sum: '$stats.approvedQuestions' }
        }
      }
    ]);

    const stats = departmentStats[0] || {
      totalQuestions: 0,
      privateQuestions: 0,
      sharedQuestions: 0,
      approvedShared: 0,
      pendingShared: 0
    };

    const collaboration = collaborationMetrics[0] || {
      totalBanks: 0,
      totalCollaborators: 0,
      avgCollaboratorsPerBank: 0,
      totalQuestions: 0,
      totalApproved: 0
    };

    res.json({
      departmentId: deptId,
      timeframe,
      overview: {
        totalInstructors: departmentInstructors.length,
        ...stats,
        collaborationScore: collaboration.totalBanks > 0 ? 
          Math.round((collaboration.totalApproved / collaboration.totalQuestions) * 100) : 0
      },
      instructorLeaderboard,
      subjectDistribution,
      sharedBanks: departmentSharedBanks,
      activityTrends,
      collaboration
    });

  } catch (error) {
    console.error('Error fetching department analytics:', error);
    res.status(500).json({ message: 'Error fetching department analytics', error: error.message });
  }
});

// GET /api/analytics/shared-bank/:bankId - Shared bank analytics
router.get('/shared-bank/:bankId', authenticateToken, requireInstructorOrAdmin, async (req, res) => {
  try {
    const { bankId } = req.params;
    const { timeframe = '30d' } = req.query;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Get shared bank and check permissions
    const sharedBank = await SharedBank.findById(bankId)
      .populate('owners', 'name email')
      .populate('collaborators.userId', 'name email');

    if (!sharedBank || !sharedBank.isActive) {
      return res.status(404).json({ message: 'Shared bank not found' });
    }

    // Check access permissions
    const permissions = sharedBank.getUserPermissions(userId);
    if (userRole !== 'admin' && !permissions.isOwner && !permissions.isCollaborator) {
      return res.status(403).json({ message: 'Access denied to this shared bank' });
    }

    // Calculate date range
    let dateFilter = {};
    const now = new Date();
    if (timeframe === '7d') {
      dateFilter.createdAt = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
    } else if (timeframe === '30d') {
      dateFilter.createdAt = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
    } else if (timeframe === '90d') {
      dateFilter.createdAt = { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
    }

    // Question statistics
    const questionStats = await Question.aggregate([
      { $match: { sharedBankId: bankId, isActive: true, ...dateFilter } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          byDifficulty: {
            $push: {
              difficulty: '$difficulty',
              count: 1
            }
          },
          byType: {
            $push: {
              type: '$type',
              count: 1
            }
          }
        }
      }
    ]);

    // Contributor statistics
    const contributorStats = await Question.aggregate([
      { $match: { sharedBankId: bankId, isActive: true, ...dateFilter } },
      {
        $group: {
          _id: '$createdBy',
          totalQuestions: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $in: ['$status', ['suggested', 'draft']] }, 1, 0] } }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          name: '$user.name',
          email: '$user.email',
          totalQuestions: 1,
          approved: 1,
          pending: 1,
          approvalRate: { 
            $cond: [
              { $eq: ['$totalQuestions', 0] },
              0,
              { $multiply: [{ $divide: ['$approved', '$totalQuestions'] }, 100] }
            ]
          }
        }
      },
      { $sort: { totalQuestions: -1 } }
    ]);

    // Activity timeline
    const activityTimeline = await Question.aggregate([
      { $match: { sharedBankId: bankId, isActive: true, ...dateFilter } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Process question stats
    const processedStats = {
      approved: 0,
      pending: 0,
      rejected: 0,
      total: 0,
      byDifficulty: {},
      byType: {}
    };

    questionStats.forEach(stat => {
      const count = stat.count;
      processedStats.total += count;
      
      if (stat._id === 'approved') processedStats.approved = count;
      else if (['suggested', 'draft'].includes(stat._id)) processedStats.pending += count;
      else if (stat._id === 'rejected') processedStats.rejected = count;

      // Process difficulty and type distributions
      stat.byDifficulty.forEach(item => {
        processedStats.byDifficulty[item.difficulty] = 
          (processedStats.byDifficulty[item.difficulty] || 0) + 1;
      });
      
      stat.byType.forEach(item => {
        processedStats.byType[item.type] = 
          (processedStats.byType[item.type] || 0) + 1;
      });
    });

    res.json({
      sharedBank: {
        id: sharedBank._id,
        name: sharedBank.name,
        description: sharedBank.description,
        subject: sharedBank.subject,
        departmentId: sharedBank.departmentId,
        owners: sharedBank.owners,
        collaborators: sharedBank.collaborators,
        settings: sharedBank.settings,
        stats: sharedBank.stats
      },
      timeframe,
      questionStats: processedStats,
      contributors: contributorStats,
      activityTimeline,
      permissions
    });

  } catch (error) {
    console.error('Error fetching shared bank analytics:', error);
    res.status(500).json({ message: 'Error fetching shared bank analytics', error: error.message });
  }
});

export default router;
