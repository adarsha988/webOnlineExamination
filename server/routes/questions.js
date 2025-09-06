import express from 'express';
import Question from '../models/question.model.js';
import SharedBank from '../models/sharedBank.model.js';
import Activity from '../models/activity.model.js';
import { authenticateToken } from '../middleware/auth.ts';
import { config } from '../config/env.js';
import multer from 'multer';
import path from 'path';
import { 
  importQuestions, 
  exportQuestionsToCSV, 
  exportQuestionsToExcel,
  generateCSVTemplate,
  generateExcelTemplate
} from '../utils/importExport.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

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

// GET /api/questions - List questions with filters and search
router.get('/', authenticateToken, requireInstructor, async (req, res) => {
  try {
    const {
      scope = 'private',
      sharedBankId,
      subject,
      difficulty,
      type,
      tags,
      search,
      page = 1,
      limit = 20,
      sort = 'updatedAt',
      order = 'desc'
    } = req.query;

    const userId = req.user.id;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let query = { isActive: true };
    let populateFields = 'createdBy approvedBy suggestedBy';

    // Scope-based filtering
    if (scope === 'private') {
      query.createdBy = userId;
      query.scope = 'private';
    } else if (scope === 'shared' && sharedBankId) {
      // Check if user has access to this shared bank
      const sharedBank = await SharedBank.findById(sharedBankId);
      if (!sharedBank) {
        return res.status(404).json({ message: 'Shared bank not found' });
      }

      const permissions = sharedBank.getUserPermissions(userId);
      if (!permissions.isOwner && !permissions.isCollaborator) {
        return res.status(403).json({ message: 'Access denied to this shared bank' });
      }

      query.sharedBankId = sharedBankId;
      query.scope = 'shared';
    } else if (scope === 'all') {
      // Return both private (owned by user) and shared (accessible to user)
      const accessibleSharedBanks = await SharedBank.find({
        $or: [
          { owners: userId },
          { 'collaborators.userId': userId }
        ],
        isActive: true
      }).select('_id');

      query.$or = [
        { createdBy: userId, scope: 'private' },
        { 
          sharedBankId: { $in: accessibleSharedBanks.map(b => b._id) },
          scope: 'shared'
        }
      ];
    }

    // Apply filters
    if (subject) query.subject = subject;
    if (difficulty) query.difficulty = difficulty;
    if (type) query.type = type;
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      query.tags = { $in: tagArray };
    }

    let questions;
    let total;

    // Handle search
    if (search) {
      questions = await Question.searchQuestions(search, query)
        .populate(populateFields, 'name email')
        .populate('sharedBankId', 'name')
        .skip(skip)
        .limit(limitNum);
      
      total = await Question.countDocuments({
        ...query,
        $text: { $search: search }
      });
    } else {
      // Regular query with sorting
      const sortObj = {};
      sortObj[sort] = order === 'desc' ? -1 : 1;

      questions = await Question.find(query)
        .populate(populateFields, 'name email')
        .populate('sharedBankId', 'name')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum);

      total = await Question.countDocuments(query);
    }

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      questions,
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
    console.error('Error fetching questions:', error);
    res.status(500).json({ message: 'Error fetching questions', error: error.message });
  }
});

// GET /api/questions/:id - Get single question
router.get('/:id', authenticateToken, requireInstructor, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const question = await Question.findById(id)
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('suggestedBy', 'name email')
      .populate('sharedBankId', 'name owners collaborators');

    if (!question || !question.isActive) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check access permissions
    if (question.scope === 'private' && question.createdBy._id.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (question.scope === 'shared') {
      const permissions = question.sharedBankId.getUserPermissions(userId);
      if (!permissions.isOwner && !permissions.isCollaborator) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(question);

  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({ message: 'Error fetching question', error: error.message });
  }
});

// POST /api/questions - Create new question
router.post('/', authenticateToken, requireInstructor, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      scope = 'private',
      sharedBankId,
      subject,
      difficulty,
      type,
      questionText,
      options,
      correctAnswer,
      explanation,
      marks,
      tags
    } = req.body;

    // Validate required fields
    if (!subject || !type || !questionText) {
      return res.status(400).json({ 
        message: 'Missing required fields: subject, type, questionText' 
      });
    }

    // Check shared bank permissions if creating shared question
    let permissions = {};
    if (scope === 'shared') {
      if (!sharedBankId) {
        return res.status(400).json({ message: 'sharedBankId required for shared questions' });
      }

      const sharedBank = await SharedBank.findById(sharedBankId);
      if (!sharedBank) {
        return res.status(404).json({ message: 'Shared bank not found' });
      }

      permissions = sharedBank.getUserPermissions(userId);
      if (!permissions.canCreate) {
        return res.status(403).json({ message: 'No permission to create questions in this shared bank' });
      }
    }

    // Create question
    const questionData = {
      createdBy: userId,
      scope,
      subject,
      difficulty,
      type,
      questionText,
      explanation,
      marks: marks || 1,
      tags: tags || []
    };

    if (scope === 'shared') {
      questionData.sharedBankId = sharedBankId;
      // Auto-approve if user is owner, otherwise set as suggested
      questionData.status = permissions.isOwner ? 'approved' : 'suggested';
      if (questionData.status === 'suggested') {
        questionData.suggestedBy = userId;
      }
    }

    // Handle question type specific data
    if (type === 'mcq' || type === 'truefalse') {
      questionData.options = options;
      questionData.correctAnswer = correctAnswer;
    } else if (type === 'short' || type === 'long') {
      questionData.correctAnswer = correctAnswer;
    }

    const question = new Question(questionData);
    await question.save();

    // Update shared bank stats
    if (scope === 'shared') {
      await SharedBank.findById(sharedBankId).then(bank => bank.updateStats());
    }

    // Log activity
    await logActivity(
      userId,
      'question_created',
      `Created ${scope} question: ${questionText.substring(0, 50)}...`,
      {
        questionId: question._id,
        scope,
        sharedBankId,
        subject,
        type,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    const populatedQuestion = await Question.findById(question._id)
      .populate('createdBy', 'name email')
      .populate('sharedBankId', 'name');

    res.status(201).json(populatedQuestion);

  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ message: 'Error creating question', error: error.message });
  }
});

// PUT /api/questions/:id - Update question
router.put('/:id', authenticateToken, requireInstructor, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const question = await Question.findById(id).populate('sharedBankId');
    if (!question || !question.isActive) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check edit permissions
    let permissions = {};
    if (question.scope === 'shared') {
      permissions = question.sharedBankId.getUserPermissions(userId);
    }

    if (!question.canEdit(userId, userRole, permissions)) {
      return res.status(403).json({ message: 'No permission to edit this question' });
    }

    // Update fields
    const updateFields = [
      'subject', 'difficulty', 'type', 'questionText', 
      'options', 'correctAnswer', 'explanation', 'marks', 'tags'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        question[field] = req.body[field];
      }
    });

    // Handle status changes for shared questions
    if (question.scope === 'shared' && !permissions.isOwner) {
      // Non-owners create suggested edits
      question.status = 'suggested';
      question.suggestedBy = userId;
    }

    question.version += 1;
    await question.save();

    // Log activity
    await logActivity(
      userId,
      'question_updated',
      `Updated question: ${question.questionText.substring(0, 50)}...`,
      {
        questionId: question._id,
        scope: question.scope,
        sharedBankId: question.sharedBankId,
        version: question.version,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    const updatedQuestion = await Question.findById(id)
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('suggestedBy', 'name email')
      .populate('sharedBankId', 'name');

    res.json(updatedQuestion);

  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ message: 'Error updating question', error: error.message });
  }
});

// DELETE /api/questions/:id - Delete question
router.delete('/:id', authenticateToken, requireInstructor, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const question = await Question.findById(id).populate('sharedBankId');
    if (!question || !question.isActive) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check delete permissions
    let permissions = {};
    if (question.scope === 'shared') {
      permissions = question.sharedBankId.getUserPermissions(userId);
    }

    if (!question.canDelete(userId, userRole, permissions)) {
      return res.status(403).json({ message: 'No permission to delete this question' });
    }

    // Soft delete
    question.isActive = false;
    await question.save();

    // Update shared bank stats
    if (question.scope === 'shared') {
      await SharedBank.findById(question.sharedBankId).then(bank => bank.updateStats());
    }

    // Log activity
    await logActivity(
      userId,
      'question_deleted',
      `Deleted question: ${question.questionText.substring(0, 50)}...`,
      {
        questionId: question._id,
        scope: question.scope,
        sharedBankId: question.sharedBankId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.json({ message: 'Question deleted successfully' });

  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ message: 'Error deleting question', error: error.message });
  }
});

// POST /api/questions/:id/approve - Approve suggested question
router.post('/:id/approve', authenticateToken, requireInstructor, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const question = await Question.findById(id).populate('sharedBankId');
    if (!question || !question.isActive) {
      return res.status(404).json({ message: 'Question not found' });
    }

    if (question.scope !== 'shared') {
      return res.status(400).json({ message: 'Only shared questions can be approved' });
    }

    const permissions = question.sharedBankId.getUserPermissions(userId);
    if (!permissions.canApprove) {
      return res.status(403).json({ message: 'No permission to approve questions' });
    }

    question.status = 'approved';
    question.approvedBy = userId;
    await question.save();

    // Update shared bank stats
    await SharedBank.findById(question.sharedBankId).then(bank => bank.updateStats());

    // Log activity
    await logActivity(
      userId,
      'question_approved',
      `Approved question: ${question.questionText.substring(0, 50)}...`,
      {
        questionId: question._id,
        sharedBankId: question.sharedBankId,
        originalAuthor: question.createdBy,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    const approvedQuestion = await Question.findById(id)
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('sharedBankId', 'name');

    res.json(approvedQuestion);

  } catch (error) {
    console.error('Error approving question:', error);
    res.status(500).json({ message: 'Error approving question', error: error.message });
  }
});

// POST /api/questions/bulk-import - Bulk import questions from CSV/Excel
router.post('/bulk-import', authenticateToken, requireInstructor, upload.single('file'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { scope = 'private', sharedBankId } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    const supportedTypes = ['.csv', '.xlsx', '.xls'];
    
    if (!supportedTypes.includes(fileExtension)) {
      return res.status(400).json({ 
        message: 'Unsupported file type. Please upload CSV or Excel files only.' 
      });
    }

    // Check shared bank permissions if importing to shared bank
    if (scope === 'shared') {
      if (!sharedBankId) {
        return res.status(400).json({ message: 'sharedBankId required for shared question import' });
      }

      const sharedBank = await SharedBank.findById(sharedBankId);
      if (!sharedBank) {
        return res.status(404).json({ message: 'Shared bank not found' });
      }

      const permissions = sharedBank.getUserPermissions(userId);
      if (!permissions.canCreate) {
        return res.status(403).json({ message: 'No permission to import questions to this shared bank' });
      }
    }

    // Import questions
    const fileType = fileExtension.substring(1); // Remove the dot
    const importResult = await importQuestions(req.file.path, fileType, userId, scope, sharedBankId);

    // Save valid questions to database
    const savedQuestions = [];
    for (const questionData of importResult.questions) {
      try {
        const question = new Question(questionData);
        await question.save();
        savedQuestions.push(question);
      } catch (error) {
        importResult.errorDetails.push({
          error: `Database save error: ${error.message}`,
          data: questionData
        });
      }
    }

    // Update shared bank stats if applicable
    if (scope === 'shared' && sharedBankId) {
      await SharedBank.findById(sharedBankId).then(bank => bank.updateStats());
    }

    // Log activity
    await logActivity(
      userId,
      'question_imported',
      `Imported ${savedQuestions.length} questions from ${req.file.originalname}`,
      {
        fileName: req.file.originalname,
        totalRows: importResult.totalRows,
        successCount: savedQuestions.length,
        errorCount: importResult.errorDetails.length,
        scope,
        sharedBankId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.json({
      message: 'Import completed',
      summary: {
        totalRows: importResult.totalRows,
        imported: savedQuestions.length,
        errors: importResult.errorDetails.length
      },
      questions: savedQuestions,
      errors: importResult.errorDetails
    });

  } catch (error) {
    console.error('Error importing questions:', error);
    res.status(500).json({ message: 'Error importing questions', error: error.message });
  }
});

// GET /api/questions/export - Export questions to CSV/Excel
router.get('/export', authenticateToken, requireInstructor, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      format = 'csv', 
      scope = 'private', 
      sharedBankId,
      subject,
      difficulty,
      type,
      tags
    } = req.query;

    if (!['csv', 'xlsx'].includes(format)) {
      return res.status(400).json({ message: 'Format must be csv or xlsx' });
    }

    // Build query based on scope and filters
    let query = { isActive: true };

    if (scope === 'private') {
      query.createdBy = userId;
      query.scope = 'private';
    } else if (scope === 'shared' && sharedBankId) {
      const sharedBank = await SharedBank.findById(sharedBankId);
      if (!sharedBank) {
        return res.status(404).json({ message: 'Shared bank not found' });
      }

      const permissions = sharedBank.getUserPermissions(userId);
      if (!permissions.isOwner && !permissions.isCollaborator) {
        return res.status(403).json({ message: 'Access denied to this shared bank' });
      }

      query.sharedBankId = sharedBankId;
      query.scope = 'shared';
    }

    // Apply filters
    if (subject) query.subject = subject;
    if (difficulty) query.difficulty = difficulty;
    if (type) query.type = type;
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      query.tags = { $in: tagArray };
    }

    // Fetch questions
    const questions = await Question.find(query)
      .populate('createdBy', 'name email')
      .sort({ updatedAt: -1 });

    if (questions.length === 0) {
      return res.status(404).json({ message: 'No questions found matching the criteria' });
    }

    // Generate export file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `questions_${scope}_${timestamp}.${format}`;
    const filePath = path.join('uploads', fileName);

    let exportedFile;
    if (format === 'csv') {
      exportedFile = await exportQuestionsToCSV(questions, filePath);
    } else {
      exportedFile = await exportQuestionsToExcel(questions, filePath);
    }

    // Log activity
    await logActivity(
      userId,
      'question_exported',
      `Exported ${questions.length} questions to ${format.toUpperCase()}`,
      {
        fileName,
        questionCount: questions.length,
        format,
        scope,
        sharedBankId,
        filters: { subject, difficulty, type, tags },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    // Send file
    res.download(exportedFile, fileName, (err) => {
      if (err) {
        console.error('Error sending file:', err);
      }
      // Clean up file after sending
      setTimeout(() => {
        try {
          if (require('fs').existsSync(exportedFile)) {
            require('fs').unlinkSync(exportedFile);
          }
        } catch (cleanupError) {
          console.error('Error cleaning up export file:', cleanupError);
        }
      }, 5000);
    });

  } catch (error) {
    console.error('Error exporting questions:', error);
    res.status(500).json({ message: 'Error exporting questions', error: error.message });
  }
});

// GET /api/questions/template - Download import template
router.get('/template', authenticateToken, requireInstructor, async (req, res) => {
  try {
    const { format = 'csv' } = req.query;

    if (!['csv', 'xlsx'].includes(format)) {
      return res.status(400).json({ message: 'Format must be csv or xlsx' });
    }

    const fileName = `question_import_template.${format}`;
    const filePath = path.join('uploads', fileName);

    if (format === 'csv') {
      await generateCSVTemplate(filePath);
    } else {
      await generateExcelTemplate(filePath);
    }

    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Error sending template:', err);
      }
      // Clean up file after sending
      setTimeout(() => {
        try {
          if (require('fs').existsSync(filePath)) {
            require('fs').unlinkSync(filePath);
          }
        } catch (cleanupError) {
          console.error('Error cleaning up template file:', cleanupError);
        }
      }, 5000);
    });

  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ message: 'Error generating template', error: error.message });
  }
});

export default router;
