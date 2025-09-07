import express from 'express';
import Question from '../models/question.model.js';
import SharedBank from '../models/sharedBank.model.js';
import Activity from '../models/activity.model.js';
import User from '../models/user.model.js';
import { authenticateToken } from '../middleware/auth.ts';

const router = express.Router();

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
};

// Activity logging helper
const logActivity = async (userId, type, description, metadata = {}) => {
  try {
    await Activity.create({
      user: userId,
      type,
      description,
      metadata,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

// GET /api/admin/questions/pending - Get all pending shared questions for review
router.get('/questions/pending', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      subject,
      difficulty,
      type,
      sharedBankId,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query for pending questions
    const query = {
      scope: 'shared',
      status: { $in: ['suggested', 'draft'] },
      isActive: true
    };

    // Apply filters
    if (subject) query.subject = subject;
    if (difficulty) query.difficulty = difficulty;
    if (type) query.type = type;
    if (sharedBankId) query.sharedBankId = sharedBankId;

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    // Fetch pending questions
    const questions = await Question.find(query)
      .populate('createdBy', 'name email departmentId')
      .populate('suggestedBy', 'name email')
      .populate('sharedBankId', 'name subject departmentId owners')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const total = await Question.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);

    // Get summary statistics
    const stats = await Question.aggregate([
      { $match: { scope: 'shared', isActive: true } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusCounts = {
      pending: 0,
      approved: 0,
      rejected: 0
    };

    stats.forEach(stat => {
      if (['suggested', 'draft'].includes(stat._id)) {
        statusCounts.pending += stat.count;
      } else if (stat._id === 'approved') {
        statusCounts.approved = stat.count;
      } else if (stat._id === 'rejected') {
        statusCounts.rejected = stat.count;
      }
    });

    res.json({
      questions,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      },
      stats: statusCounts
    });

  } catch (error) {
    console.error('Error fetching pending questions:', error);
    res.status(500).json({ message: 'Error fetching pending questions', error: error.message });
  }
});

// PATCH /api/admin/questions/:id/approve - Approve a shared question
router.patch('/questions/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { feedback } = req.body;

    const question = await Question.findById(id)
      .populate('createdBy', 'name email')
      .populate('sharedBankId', 'name');

    if (!question || !question.isActive) {
      return res.status(404).json({ message: 'Question not found' });
    }

    if (question.scope !== 'shared') {
      return res.status(400).json({ message: 'Only shared questions can be approved' });
    }

    if (question.status === 'approved') {
      return res.status(400).json({ message: 'Question is already approved' });
    }

    // Update question status
    question.status = 'approved';
    question.approvedBy = userId;
    if (feedback) {
      question.metadata = { ...question.metadata, approvalFeedback: feedback };
    }
    await question.save();

    // Update shared bank stats
    if (question.sharedBankId) {
      await SharedBank.findById(question.sharedBankId).then(bank => bank?.updateStats());
    }

    // Log activity
    await logActivity(
      userId,
      'question_approved',
      `Approved shared question: ${question.questionText.substring(0, 50)}...`,
      {
        questionId: question._id,
        sharedBankId: question.sharedBankId,
        originalAuthor: question.createdBy._id,
        feedback,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    const approvedQuestion = await Question.findById(id)
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('sharedBankId', 'name');

    res.json({
      message: 'Question approved successfully',
      question: approvedQuestion
    });

  } catch (error) {
    console.error('Error approving question:', error);
    res.status(500).json({ message: 'Error approving question', error: error.message });
  }
});

// PATCH /api/admin/questions/:id/reject - Reject a shared question
router.patch('/questions/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const question = await Question.findById(id)
      .populate('createdBy', 'name email')
      .populate('sharedBankId', 'name');

    if (!question || !question.isActive) {
      return res.status(404).json({ message: 'Question not found' });
    }

    if (question.scope !== 'shared') {
      return res.status(400).json({ message: 'Only shared questions can be rejected' });
    }

    if (question.status === 'rejected') {
      return res.status(400).json({ message: 'Question is already rejected' });
    }

    // Update question status
    question.status = 'rejected';
    question.metadata = { 
      ...question.metadata, 
      rejectionReason: reason,
      rejectedBy: userId,
      rejectedAt: new Date()
    };
    await question.save();

    // Update shared bank stats
    if (question.sharedBankId) {
      await SharedBank.findById(question.sharedBankId).then(bank => bank?.updateStats());
    }

    // Log activity
    await logActivity(
      userId,
      'question_rejected',
      `Rejected shared question: ${question.questionText.substring(0, 50)}...`,
      {
        questionId: question._id,
        sharedBankId: question.sharedBankId,
        originalAuthor: question.createdBy._id,
        reason,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    const rejectedQuestion = await Question.findById(id)
      .populate('createdBy', 'name email')
      .populate('sharedBankId', 'name');

    res.json({
      message: 'Question rejected successfully',
      question: rejectedQuestion
    });

  } catch (error) {
    console.error('Error rejecting question:', error);
    res.status(500).json({ message: 'Error rejecting question', error: error.message });
  }
});

// GET /api/admin/questions/stats - Get question bank statistics
router.get('/questions/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { departmentId, timeframe = '30d' } = req.query;

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

    // Build base query
    let baseQuery = { isActive: true };
    if (departmentId) {
      // Get users from specific department
      const departmentUsers = await User.find({ departmentId }).select('_id');
      baseQuery.createdBy = { $in: departmentUsers.map(u => u._id) };
    }

    // Overall statistics
    const overallStats = await Question.aggregate([
      { $match: baseQuery },
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

    // Questions by subject
    const subjectStats = await Question.aggregate([
      { $match: { ...baseQuery, ...dateFilter } },
      {
        $group: {
          _id: '$subject',
          count: { $sum: 1 },
          private: { $sum: { $cond: [{ $eq: ['$scope', 'private'] }, 1, 0] } },
          shared: { $sum: { $cond: [{ $eq: ['$scope', 'shared'] }, 1, 0] } }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Questions by difficulty
    const difficultyStats = await Question.aggregate([
      { $match: { ...baseQuery, ...dateFilter } },
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 }
        }
      }
    ]);

    // Questions by type
    const typeStats = await Question.aggregate([
      { $match: { ...baseQuery, ...dateFilter } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    // Top contributors (instructors with most questions)
    const contributorStats = await Question.aggregate([
      { $match: { ...baseQuery, ...dateFilter } },
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
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          name: '$user.name',
          email: '$user.email',
          departmentId: '$user.departmentId',
          totalQuestions: 1,
          sharedQuestions: 1,
          approvedShared: 1,
          contributionScore: { $add: ['$totalQuestions', { $multiply: ['$approvedShared', 2] }] }
        }
      },
      { $sort: { contributionScore: -1 } },
      { $limit: 10 }
    ]);

    // Recent activity trends
    const activityTrends = await Question.aggregate([
      { $match: { ...baseQuery, ...dateFilter } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          count: { $sum: 1 },
          private: { $sum: { $cond: [{ $eq: ['$scope', 'private'] }, 1, 0] } },
          shared: { $sum: { $cond: [{ $eq: ['$scope', 'shared'] }, 1, 0] } }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    res.json({
      overall: overallStats[0] || {
        totalQuestions: 0,
        privateQuestions: 0,
        sharedQuestions: 0,
        approvedShared: 0,
        pendingShared: 0
      },
      bySubject: subjectStats,
      byDifficulty: difficultyStats,
      byType: typeStats,
      topContributors: contributorStats,
      activityTrends,
      timeframe,
      departmentId
    });

  } catch (error) {
    console.error('Error fetching question stats:', error);
    res.status(500).json({ message: 'Error fetching question statistics', error: error.message });
  }
});

// GET /api/admin/shared-banks - Get all shared banks with stats
router.get('/shared-banks', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      departmentId,
      subject,
      sort = 'updatedAt',
      order = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    let query = { isActive: true };
    if (departmentId) query.departmentId = departmentId;
    if (subject) query.subject = subject;

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    // Fetch shared banks
    const sharedBanks = await SharedBank.find(query)
      .populate('owners', 'name email departmentId')
      .populate('collaborators.userId', 'name email departmentId')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const total = await SharedBank.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);

    // Get overall shared bank statistics
    const overallStats = await SharedBank.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalBanks: { $sum: 1 },
          totalQuestions: { $sum: '$stats.totalQuestions' },
          totalApproved: { $sum: '$stats.approvedQuestions' },
          totalPending: { $sum: '$stats.pendingQuestions' },
          totalCollaborators: { $sum: '$stats.totalCollaborators' }
        }
      }
    ]);

    res.json({
      sharedBanks,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      },
      stats: overallStats[0] || {
        totalBanks: 0,
        totalQuestions: 0,
        totalApproved: 0,
        totalPending: 0,
        totalCollaborators: 0
      }
    });

  } catch (error) {
    console.error('Error fetching shared banks:', error);
    res.status(500).json({ message: 'Error fetching shared banks', error: error.message });
  }
});

// PATCH /api/admin/questions/bulk-approve - Bulk approve questions
router.patch('/questions/bulk-approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { questionIds, feedback } = req.body;
    const userId = req.user.userId;

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ message: 'Question IDs array is required' });
    }

    // Find and update questions
    const questions = await Question.find({
      _id: { $in: questionIds },
      scope: 'shared',
      status: { $in: ['suggested', 'draft'] },
      isActive: true
    });

    if (questions.length === 0) {
      return res.status(404).json({ message: 'No eligible questions found for approval' });
    }

    const approvedQuestions = [];
    const sharedBankIds = new Set();

    for (const question of questions) {
      question.status = 'approved';
      question.approvedBy = userId;
      if (feedback) {
        question.metadata = { ...question.metadata, approvalFeedback: feedback };
      }
      await question.save();
      
      approvedQuestions.push(question);
      if (question.sharedBankId) {
        sharedBankIds.add(question.sharedBankId.toString());
      }
    }

    // Update shared bank stats
    for (const bankId of sharedBankIds) {
      await SharedBank.findById(bankId).then(bank => bank?.updateStats());
    }

    // Log activity
    await logActivity(
      userId,
      'questions_bulk_approved',
      `Bulk approved ${approvedQuestions.length} shared questions`,
      {
        questionIds: approvedQuestions.map(q => q._id),
        count: approvedQuestions.length,
        feedback,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.json({
      message: `Successfully approved ${approvedQuestions.length} questions`,
      approvedCount: approvedQuestions.length,
      questions: approvedQuestions
    });

  } catch (error) {
    console.error('Error bulk approving questions:', error);
    res.status(500).json({ message: 'Error bulk approving questions', error: error.message });
  }
});

export default router;
