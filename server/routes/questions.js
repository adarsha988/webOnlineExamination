import express from 'express';
import Question from '../models/question.model.js';
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
      subject,
      difficulty,
      type,
      status,
      search,
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    const userId = req.user.userId;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query - only private questions
    let query = { 
      isActive: true,
      createdBy: userId,
      scope: 'private'
    };
    if (subject) query.subject = subject;
    if (difficulty) query.difficulty = difficulty;
    if (type) query.type = type;
    if (status) query.status = status;

    let questions;
    let total;

    // Handle search
    if (search) {
      questions = await Question.searchQuestions(search, query)
        .populate('createdBy', 'name email')
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
        .populate('createdBy', 'name email')
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
    const userId = req.user.userId;

    const question = await Question.findById(id)
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('suggestedBy', 'name email');

    if (!question || !question.isActive) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Only allow access to private questions owned by the user
    if (question.scope !== 'private' || question.createdBy._id.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
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
    const userId = req.user.userId;
    const {
      subject,
      difficulty,
      type,
      questionText,
      options,
      correctAnswer,
      explanation,
      tags,
      marks = 1,
      timeLimit,
      attachments
    } = req.body;

    // Validate required fields
    if (!subject || !type || !questionText) {
      return res.status(400).json({ 
        message: 'Missing required fields: subject, type, questionText' 
      });
    }

    // Only allow creating private questions

    // Create question
    const questionData = {
      createdBy: userId,
      scope: 'private',
      subject,
      difficulty,
      type,
      questionText,
      options,
      correctAnswer,
      explanation,
      tags: tags || [],
      marks,
      timeLimit,
      attachments: attachments || [],
      status: 'approved', // Private questions are auto-approved
      approvedBy: userId,
      approvedAt: new Date()
    };

    const question = new Question(questionData);
    await question.save();


    // Log activity
    await logActivity(
      userId,
      'question_created',
      `Created private question: ${questionText.substring(0, 50)}...`,
      {
        questionId: question._id,
        scope: 'private',
        subject,
        type,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    const populatedQuestion = await Question.findById(question._id)
      .populate('createdBy', 'name email');

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
    const userId = req.user.userId;
    const userRole = req.user.role;

    const question = await Question.findById(id);
    if (!question || !question.isActive) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Only allow editing private questions owned by the user
    if (question.scope !== 'private' || question.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Permission denied' });
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
        version: question.version,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    const updatedQuestion = await Question.findById(id)
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('suggestedBy', 'name email');

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
    const userId = req.user.userId;
    const userRole = req.user.role;

    const question = await Question.findById(id);
    if (!question || !question.isActive) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Only allow deleting private questions owned by the user
    if (question.scope !== 'private' || question.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    // Soft delete
    question.isActive = false;
    question.deletedAt = new Date();
    await question.save();

    // Log activity
    await logActivity(
      userId,
      'question_deleted',
      `Deleted question: ${question.questionText.substring(0, 50)}...`,
      {
        questionId: question._id,
        scope: question.scope,
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


// POST /api/questions/bulk-import - Bulk import questions from CSV/Excel
router.post('/bulk-import', authenticateToken, requireInstructor, upload.single('file'), async (req, res) => {
  try {
    const userId = req.user.userId;
    // Only allow private scope for imports

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

    // Import questions as private only
    const fileType = fileExtension.substring(1); // Remove the dot
    const importResult = await importQuestions(req.file.path, fileType, userId, 'private');

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
        scope: 'private',
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
    const userId = req.user.userId;
    const { 
      format = 'csv', 
      subject,
      difficulty,
      type,
      tags,
      status
    } = req.query;

    // Build query for private questions only
    let query = { 
      isActive: true,
      createdBy: userId,
      scope: 'private'
    };

    // Apply additional filters
    if (subject) query.subject = subject;
    if (difficulty) query.difficulty = difficulty;
    if (type) query.type = type;
    if (status) query.status = status;
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      query.tags = { $in: tagArray };
    }

    const questions = await Question.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    if (questions.length === 0) {
      return res.status(404).json({ message: 'No questions found to export' });
    }

    let exportData;
    let filename;
    let contentType;

    if (format === 'excel') {
      exportData = await exportQuestionsToExcel(questions);
      filename = `questions_export_${Date.now()}.xlsx`;
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else {
      exportData = await exportQuestionsToCSV(questions);
      filename = `questions_export_${Date.now()}.csv`;
      contentType = 'text/csv';
    }

    // Log activity
    await logActivity(
      userId,
      'questions_exported',
      `Exported ${questions.length} questions to ${format.toUpperCase()}`,
      {
        questionCount: questions.length,
        format,
        scope: 'private',
        filters: { subject, difficulty, type, tags },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportData);

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
