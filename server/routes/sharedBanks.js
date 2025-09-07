import express from 'express';
import SharedBank from '../models/sharedBank.model.js';
import Question from '../models/question.model.js';
import Activity from '../models/activity.model.js';
import User from '../models/user.model.js';
import { authenticateToken } from '../middleware/auth.ts';

const router = express.Router();

// Middleware to check instructor role
const requireInstructor = (req, res, next) => {
  if (!req.user || !['instructor', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied. Instructor role required.' });
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

// GET /api/shared-banks - List shared banks accessible to user
router.get('/', authenticateToken, requireInstructor, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { departmentId, subject, page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const options = {};
    if (departmentId) options.departmentId = departmentId;
    if (subject) options.subject = subject;

    const sharedBanks = await SharedBank.findByInstructor(userId, options)
      .skip(skip)
      .limit(limitNum);

    const total = await SharedBank.countDocuments({
      $or: [
        { owners: userId },
        { 'collaborators.userId': userId }
      ],
      isActive: true,
      ...(departmentId && { departmentId }),
      ...(subject && { subject })
    });

    const totalPages = Math.ceil(total / limitNum);

    // Add user permissions to each bank
    const banksWithPermissions = sharedBanks.map(bank => {
      const permissions = bank.getUserPermissions(userId);
      return {
        ...bank.toObject(),
        userPermissions: permissions
      };
    });

    res.json({
      sharedBanks: banksWithPermissions,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Error fetching shared banks:', error);
    res.status(500).json({ message: 'Error fetching shared banks', error: error.message });
  }
});

// GET /api/shared-banks/public - List public shared banks in department
router.get('/public', authenticateToken, requireInstructor, async (req, res) => {
  try {
    const { departmentId, subject } = req.query;
    
    if (!departmentId) {
      return res.status(400).json({ message: 'departmentId is required' });
    }

    const options = {};
    if (subject) options.subject = subject;

    const publicBanks = await SharedBank.findPublic(departmentId, options);

    res.json(publicBanks);

  } catch (error) {
    console.error('Error fetching public shared banks:', error);
    res.status(500).json({ message: 'Error fetching public shared banks', error: error.message });
  }
});

// GET /api/shared-banks/:id - Get shared bank details
router.get('/:id', authenticateToken, requireInstructor, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const sharedBank = await SharedBank.findById(id)
      .populate('owners', 'name email departmentId')
      .populate('collaborators.userId', 'name email departmentId');

    if (!sharedBank || !sharedBank.isActive) {
      return res.status(404).json({ message: 'Shared bank not found' });
    }

    const permissions = sharedBank.getUserPermissions(userId);
    if (!permissions.isOwner && !permissions.isCollaborator) {
      return res.status(403).json({ message: 'Access denied to this shared bank' });
    }

    res.json({
      ...sharedBank.toObject(),
      userPermissions: permissions
    });

  } catch (error) {
    console.error('Error fetching shared bank:', error);
    res.status(500).json({ message: 'Error fetching shared bank', error: error.message });
  }
});

// POST /api/shared-banks - Create new shared bank
router.post('/', authenticateToken, requireInstructor, async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      name,
      description,
      departmentId,
      subject,
      settings = {}
    } = req.body;

    if (!name || !subject) {
      return res.status(400).json({ message: 'Name and subject are required' });
    }

    const sharedBankData = {
      name,
      description,
      departmentId: departmentId || req.user.departmentId,
      subject,
      owners: [userId],
      settings: {
        requireApproval: settings.requireApproval !== undefined ? settings.requireApproval : true,
        allowSuggestions: settings.allowSuggestions !== undefined ? settings.allowSuggestions : true,
        autoApproveOwners: settings.autoApproveOwners !== undefined ? settings.autoApproveOwners : true,
        visibility: settings.visibility || 'department'
      }
    };

    const sharedBank = new SharedBank(sharedBankData);
    await sharedBank.save();

    // Log activity
    await logActivity(
      userId,
      'shared_bank_created',
      `Created shared bank: ${name}`,
      {
        sharedBankId: sharedBank._id,
        subject,
        departmentId: sharedBankData.departmentId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    const populatedBank = await SharedBank.findById(sharedBank._id)
      .populate('owners', 'name email departmentId');

    res.status(201).json(populatedBank);

  } catch (error) {
    console.error('Error creating shared bank:', error);
    res.status(500).json({ message: 'Error creating shared bank', error: error.message });
  }
});

// PUT /api/shared-banks/:id - Update shared bank
router.put('/:id', authenticateToken, requireInstructor, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const sharedBank = await SharedBank.findById(id);
    if (!sharedBank || !sharedBank.isActive) {
      return res.status(404).json({ message: 'Shared bank not found' });
    }

    const permissions = sharedBank.getUserPermissions(userId);
    if (!permissions.canManage) {
      return res.status(403).json({ message: 'No permission to manage this shared bank' });
    }

    const updateFields = ['name', 'description', 'settings'];
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'settings') {
          sharedBank.settings = { ...sharedBank.settings, ...req.body[field] };
        } else {
          sharedBank[field] = req.body[field];
        }
      }
    });

    await sharedBank.save();

    // Log activity
    await logActivity(
      userId,
      'shared_bank_updated',
      `Updated shared bank: ${sharedBank.name}`,
      {
        sharedBankId: sharedBank._id,
        changes: Object.keys(req.body),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    const updatedBank = await SharedBank.findById(id)
      .populate('owners', 'name email departmentId')
      .populate('collaborators.userId', 'name email departmentId');

    res.json(updatedBank);

  } catch (error) {
    console.error('Error updating shared bank:', error);
    res.status(500).json({ message: 'Error updating shared bank', error: error.message });
  }
});

// DELETE /api/shared-banks/:id - Delete shared bank
router.delete('/:id', authenticateToken, requireInstructor, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const sharedBank = await SharedBank.findById(id);
    if (!sharedBank || !sharedBank.isActive) {
      return res.status(404).json({ message: 'Shared bank not found' });
    }

    const permissions = sharedBank.getUserPermissions(userId);
    if (!permissions.canManage) {
      return res.status(403).json({ message: 'No permission to delete this shared bank' });
    }

    // Soft delete the shared bank
    sharedBank.isActive = false;
    await sharedBank.save();

    // Soft delete all questions in this shared bank
    await Question.updateMany(
      { sharedBankId: id },
      { isActive: false }
    );

    // Log activity
    await logActivity(
      userId,
      'shared_bank_deleted',
      `Deleted shared bank: ${sharedBank.name}`,
      {
        sharedBankId: sharedBank._id,
        questionCount: sharedBank.stats.totalQuestions,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.json({ message: 'Shared bank deleted successfully' });

  } catch (error) {
    console.error('Error deleting shared bank:', error);
    res.status(500).json({ message: 'Error deleting shared bank', error: error.message });
  }
});

// GET /api/shared-banks/:id/questions - Get questions in shared bank
router.get('/:id/questions', authenticateToken, requireInstructor, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      difficulty = '', 
      type = '', 
      status = '',
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Check if user has access to this shared bank
    const sharedBank = await SharedBank.findById(id);
    if (!sharedBank) {
      return res.status(404).json({ message: 'Shared bank not found' });
    }

    const permissions = sharedBank.getUserPermissions(userId);
    if (!permissions.canView) {
      return res.status(403).json({ message: 'No permission to view this shared bank' });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const options = {
      search,
      difficulty,
      type,
      status,
      sort: { [sort]: order === 'desc' ? -1 : 1 }
    };

    const questions = await Question.findBySharedBank(id, options)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await Question.countDocuments({
      sharedBankId: id,
      isActive: true,
      ...(search && {
        $or: [
          { questionText: { $regex: search, $options: 'i' } },
          { subject: { $regex: search, $options: 'i' } }
        ]
      }),
      ...(difficulty && { difficulty }),
      ...(type && { type }),
      ...(status && { status })
    });

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      questions,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum
      },
      sharedBank: {
        id: sharedBank._id,
        name: sharedBank.name,
        description: sharedBank.description,
        permissions
      }
    });

  } catch (error) {
    console.error('Error fetching shared bank questions:', error);
    res.status(500).json({ message: 'Error fetching shared bank questions', error: error.message });
  }
});

// GET /api/shared-banks/approved-questions - Get approved questions from all accessible shared banks
router.get('/approved-questions', authenticateToken, requireInstructor, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      difficulty = '', 
      type = '', 
      subject = '',
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get user's department from User model
    const user = await User.findById(userId).select('department');
    if (!user || !user.department) {
      return res.status(400).json({ message: 'User department not found' });
    }

    // Find shared banks that the user can access (same department or public)
    const accessibleBanks = await SharedBank.find({
      $or: [
        { department: user.department },
        { isPublic: true }
      ],
      isActive: true
    }).select('_id');

    const bankIds = accessibleBanks.map(bank => bank._id);

    // Build query for approved questions
    let query = {
      sharedBankId: { $in: bankIds },
      status: 'approved',
      isActive: true
    };

    if (search) {
      query.$or = [
        { questionText: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    if (type) {
      query.type = type;
    }

    if (subject) {
      query.subject = { $regex: subject, $options: 'i' };
    }

    // Get questions with pagination
    const [questions, total] = await Promise.all([
      Question.find(query)
        .populate('createdBy', 'name email')
        .populate('sharedBankId', 'name description department')
        .sort({ [sort]: order === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Question.countDocuments(query)
    ]);

    // Format questions for frontend
    const formattedQuestions = questions.map(question => ({
      id: question._id,
      subject: question.subject,
      difficulty: question.difficulty,
      type: question.type,
      questionText: question.questionText,
      options: question.options,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      marks: question.marks,
      tags: question.tags,
      status: question.status,
      createdBy: question.createdBy,
      createdAt: question.createdAt,
      sharedBank: question.sharedBankId ? {
        id: question.sharedBankId._id,
        name: question.sharedBankId.name,
        description: question.sharedBankId.description,
        department: question.sharedBankId.department
      } : null
    }));

    res.json({
      success: true,
      questions: formattedQuestions,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      },
      summary: {
        totalApprovedQuestions: total,
        accessibleBanks: bankIds.length
      }
    });

  } catch (error) {
    console.error('Error fetching approved questions:', error);
    res.status(500).json({ message: 'Error fetching approved questions', error: error.message });
  }
});

// POST /api/shared-banks/:id/invite - Invite collaborator
router.post('/:id/invite', authenticateToken, requireInstructor, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { email, permissions = {} } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const sharedBank = await SharedBank.findById(id);
    if (!sharedBank || !sharedBank.isActive) {
      return res.status(404).json({ message: 'Shared bank not found' });
    }

    const userPermissions = sharedBank.getUserPermissions(userId);
    if (!userPermissions.canInvite) {
      return res.status(403).json({ message: 'No permission to invite collaborators' });
    }

    // Find user by email
    const invitedUser = await User.findOne({ email, isActive: true });
    if (!invitedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!['instructor', 'admin'].includes(invitedUser.role)) {
      return res.status(400).json({ message: 'Only instructors can be invited as collaborators' });
    }

    // Add collaborator
    await sharedBank.addCollaborator(invitedUser._id, permissions);

    // Log activity
    await logActivity(
      userId,
      'collaborator_added',
      `Invited ${invitedUser.name} to shared bank: ${sharedBank.name}`,
      {
        sharedBankId: sharedBank._id,
        invitedUserId: invitedUser._id,
        invitedUserEmail: email,
        permissions,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    const updatedBank = await SharedBank.findById(id)
      .populate('owners', 'name email departmentId')
      .populate('collaborators.userId', 'name email departmentId');

    res.json({
      message: 'Collaborator invited successfully',
      sharedBank: updatedBank
    });

  } catch (error) {
    console.error('Error inviting collaborator:', error);
    res.status(500).json({ message: 'Error inviting collaborator', error: error.message });
  }
});

// DELETE /api/shared-banks/:id/collaborators/:userId - Remove collaborator
router.delete('/:id/collaborators/:collaboratorId', authenticateToken, requireInstructor, async (req, res) => {
  try {
    const { id, collaboratorId } = req.params;
    const userId = req.user.userId;

    const sharedBank = await SharedBank.findById(id);
    if (!sharedBank || !sharedBank.isActive) {
      return res.status(404).json({ message: 'Shared bank not found' });
    }

    const userPermissions = sharedBank.getUserPermissions(userId);
    if (!userPermissions.canManage) {
      return res.status(403).json({ message: 'No permission to remove collaborators' });
    }

    const collaborator = await User.findById(collaboratorId);
    if (!collaborator) {
      return res.status(404).json({ message: 'Collaborator not found' });
    }

    await sharedBank.removeCollaborator(collaboratorId);

    // Log activity
    await logActivity(
      userId,
      'collaborator_removed',
      `Removed ${collaborator.name} from shared bank: ${sharedBank.name}`,
      {
        sharedBankId: sharedBank._id,
        removedUserId: collaboratorId,
        removedUserEmail: collaborator.email,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.json({ message: 'Collaborator removed successfully' });

  } catch (error) {
    console.error('Error removing collaborator:', error);
    res.status(500).json({ message: 'Error removing collaborator', error: error.message });
  }
});

// PUT /api/shared-banks/:id/collaborators/:userId/permissions - Update collaborator permissions
router.put('/:id/collaborators/:collaboratorId/permissions', authenticateToken, requireInstructor, async (req, res) => {
  try {
    const { id, collaboratorId } = req.params;
    const userId = req.user.userId;
    const { permissions } = req.body;

    if (!permissions) {
      return res.status(400).json({ message: 'Permissions are required' });
    }

    const sharedBank = await SharedBank.findById(id);
    if (!sharedBank || !sharedBank.isActive) {
      return res.status(404).json({ message: 'Shared bank not found' });
    }

    const userPermissions = sharedBank.getUserPermissions(userId);
    if (!userPermissions.canManage) {
      return res.status(403).json({ message: 'No permission to update collaborator permissions' });
    }

    await sharedBank.addCollaborator(collaboratorId, permissions);

    // Log activity
    await logActivity(
      userId,
      'permission_changed',
      `Updated permissions for collaborator in shared bank: ${sharedBank.name}`,
      {
        sharedBankId: sharedBank._id,
        collaboratorId,
        newPermissions: permissions,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    const updatedBank = await SharedBank.findById(id)
      .populate('owners', 'name email departmentId')
      .populate('collaborators.userId', 'name email departmentId');

    res.json(updatedBank);

  } catch (error) {
    console.error('Error updating collaborator permissions:', error);
    res.status(500).json({ message: 'Error updating collaborator permissions', error: error.message });
  }
});

export default router;
