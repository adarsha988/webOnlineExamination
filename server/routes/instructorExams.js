import express from 'express';
import Exam from '../models/exam.model.js';
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

// GET /api/exams/instructor/:id/recent - Get recent exams for instructor
router.get('/instructor/:id/recent', authenticateToken, requireInstructor, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 5 } = req.query;
    const requestingUserId = req.user.userId;
    const requestingUserRole = req.user.role;

    // Check permissions - instructors can only view their own exams, admins can view any
    if (requestingUserRole !== 'admin' && requestingUserId !== id) {
      return res.status(403).json({ message: 'Access denied. Can only view your own exams.' });
    }

    // Find user by email (since UUID doesn't match ObjectId)
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const recentExams = await Exam.find({ 
      instructorId: user._id,
      status: { $in: ['completed', 'published', 'draft'] }
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .populate('createdBy', 'name email')
    .lean();

    // Format exams for frontend
    const formattedExams = recentExams.map(exam => ({
      id: exam._id,
      title: exam.title,
      subject: exam.subject,
      description: exam.description,
      totalMarks: exam.totalMarks,
      duration: exam.duration,
      status: exam.status,
      scheduledDate: exam.scheduledDate,
      endDate: exam.endDate,
      createdAt: exam.createdAt,
      updatedAt: exam.updatedAt,
      questionsCount: exam.questions?.length || 0,
      attemptsCount: exam.attempts?.length || 0,
      averageScore: exam.attempts?.length > 0 
        ? Math.round(exam.attempts.reduce((sum, attempt) => sum + attempt.score, 0) / exam.attempts.length)
        : 0
    }));

    res.json({
      success: true,
      exams: formattedExams,
      total: formattedExams.length
    });

  } catch (error) {
    console.error('Error fetching recent exams:', error);
    res.status(500).json({ message: 'Error fetching recent exams', error: error.message });
  }
});

// GET /api/exams/instructor/:id - Get all exams for instructor with pagination
router.get('/instructor/:id', authenticateToken, requireInstructor, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, status, subject, search } = req.query;
    const requestingUserId = req.user.userId;
    const requestingUserRole = req.user.role;

    // Check permissions
    if (requestingUserRole !== 'admin' && requestingUserId !== id) {
      return res.status(403).json({ message: 'Access denied. Can only view your own exams.' });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Find user by email (since UUID doesn't match ObjectId)
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Build query
    let query = { instructorId: user._id };
    
    if (status) {
      query.status = status;
    }
    
    if (subject) {
      query.subject = { $regex: subject, $options: 'i' };
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const [exams, total] = await Promise.all([
      Exam.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('createdBy', 'name email')
        .lean(),
      Exam.countDocuments(query)
    ]);

    const formattedExams = exams.map(exam => ({
      id: exam._id,
      title: exam.title,
      subject: exam.subject,
      description: exam.description,
      totalMarks: exam.totalMarks,
      duration: exam.duration,
      status: exam.status,
      scheduledDate: exam.scheduledDate,
      endDate: exam.endDate,
      createdAt: exam.createdAt,
      updatedAt: exam.updatedAt,
      questionsCount: exam.questions?.length || 0,
      attemptsCount: exam.attempts?.length || 0,
      averageScore: exam.attempts?.length > 0 
        ? Math.round(exam.attempts.reduce((sum, attempt) => sum + attempt.score, 0) / exam.attempts.length)
        : 0
    }));

    res.json({
      success: true,
      exams: formattedExams,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      }
    });

  } catch (error) {
    console.error('Error fetching instructor exams:', error);
    res.status(500).json({ message: 'Error fetching instructor exams', error: error.message });
  }
});

// POST /api/exams - Create new exam
router.post('/', authenticateToken, requireInstructor, async (req, res) => {
  try {
    // Find user by email (since UUID doesn't match ObjectId)
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const {
      title,
      description,
      subject,
      duration,
      totalMarks,
      passingMarks,
      scheduledDate,
      endDate,
      questions = [],
      settings = {}
    } = req.body;

    // Validation
    if (!title || !subject || !duration || !totalMarks || !passingMarks) {
      return res.status(400).json({ 
        message: 'Title, subject, duration, total marks, and passing marks are required' 
      });
    }

    if (totalMarks <= 0 || passingMarks < 0 || passingMarks > totalMarks) {
      return res.status(400).json({ 
        message: 'Invalid marks configuration' 
      });
    }

    if (duration <= 0) {
      return res.status(400).json({ 
        message: 'Duration must be greater than 0' 
      });
    }

    // Create exam
    const exam = new Exam({
      title: title.trim(),
      description: description?.trim(),
      subject: subject.trim(),
      duration,
      totalMarks,
      passingMarks,
      questions,
      createdBy: user._id,
      instructorId: user._id,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      settings: {
        allowRetake: settings.allowRetake || false,
        showResults: settings.showResults !== false, // default true
        randomizeQuestions: settings.randomizeQuestions || false
      },
      status: 'draft'
    });

    await exam.save();

    // Populate and return
    const populatedExam = await Exam.findById(exam._id)
      .populate('createdBy', 'name email')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Exam created successfully',
      exam: {
        id: populatedExam._id,
        title: populatedExam.title,
        subject: populatedExam.subject,
        description: populatedExam.description,
        totalMarks: populatedExam.totalMarks,
        duration: populatedExam.duration,
        status: populatedExam.status,
        scheduledDate: populatedExam.scheduledDate,
        endDate: populatedExam.endDate,
        createdAt: populatedExam.createdAt,
        questionsCount: populatedExam.questions?.length || 0
      }
    });

  } catch (error) {
    console.error('Error creating exam:', error);
    res.status(500).json({ message: 'Error creating exam', error: error.message });
  }
});

// GET /api/exams/:id - Get single exam details
router.get('/:id', authenticateToken, requireInstructor, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const exam = await Exam.findById(id)
      .populate('createdBy', 'name email')
      .populate('questions')
      .lean();

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Check permissions
    if (userRole !== 'admin' && exam.instructorId.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied. Not your exam.' });
    }

    res.json({
      success: true,
      exam: {
        id: exam._id,
        title: exam.title,
        subject: exam.subject,
        description: exam.description,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        duration: exam.duration,
        status: exam.status,
        scheduledDate: exam.scheduledDate,
        endDate: exam.endDate,
        questions: exam.questions,
        settings: exam.settings,
        createdAt: exam.createdAt,
        updatedAt: exam.updatedAt,
        attemptsCount: exam.attempts?.length || 0,
        averageScore: exam.attempts?.length > 0 
          ? Math.round(exam.attempts.reduce((sum, attempt) => sum + attempt.score, 0) / exam.attempts.length)
          : 0
      }
    });

  } catch (error) {
    console.error('Error fetching exam:', error);
    res.status(500).json({ message: 'Error fetching exam', error: error.message });
  }
});

// PUT /api/exams/:id - Update exam
router.put('/:id', authenticateToken, requireInstructor, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Check permissions
    if (userRole !== 'admin' && exam.instructorId.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied. Not your exam.' });
    }

    // Update fields
    const updateFields = {};
    const allowedFields = [
      'title', 'description', 'subject', 'duration', 'totalMarks', 
      'passingMarks', 'scheduledDate', 'endDate', 'questions', 'settings', 'status'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateFields[field] = req.body[field];
      }
    });

    const updatedExam = await Exam.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Exam updated successfully',
      exam: {
        id: updatedExam._id,
        title: updatedExam.title,
        subject: updatedExam.subject,
        description: updatedExam.description,
        totalMarks: updatedExam.totalMarks,
        duration: updatedExam.duration,
        status: updatedExam.status,
        scheduledDate: updatedExam.scheduledDate,
        endDate: updatedExam.endDate,
        createdAt: updatedExam.createdAt,
        updatedAt: updatedExam.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating exam:', error);
    res.status(500).json({ message: 'Error updating exam', error: error.message });
  }
});

// DELETE /api/exams/:id - Delete exam
router.delete('/:id', authenticateToken, requireInstructor, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Check permissions
    if (userRole !== 'admin' && exam.instructorId.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied. Not your exam.' });
    }

    // Don't allow deletion of published or completed exams with attempts
    if (['published', 'completed'].includes(exam.status) && exam.attempts.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete exam with student attempts. Archive it instead.' 
      });
    }

    await Exam.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Exam deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting exam:', error);
    res.status(500).json({ message: 'Error deleting exam', error: error.message });
  }
});

// GET /api/exams/instructor/:id/stats - Get dashboard stats for instructor
router.get('/instructor/:id/stats', authenticateToken, requireInstructor, async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user.userId;
    const requestingUserRole = req.user.role;

    // Check permissions
    if (requestingUserRole !== 'admin' && requestingUserId !== id) {
      return res.status(403).json({ message: 'Access denied. Can only view your own stats.' });
    }

    // Find user by email (since UUID doesn't match ObjectId)
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get exam statistics
    const totalExams = await Exam.countDocuments({ instructorId: user._id });
    const publishedExams = await Exam.countDocuments({ instructorId: user._id, status: 'published' });
    const draftExams = await Exam.countDocuments({ instructorId: user._id, status: 'draft' });
    const completedExams = await Exam.countDocuments({ instructorId: user._id, status: 'completed' });

    // Get total attempts across all exams
    const examsWithAttempts = await Exam.find({ instructorId: user._id }, 'attempts').lean();
    const totalAttempts = examsWithAttempts.reduce((sum, exam) => sum + (exam.attempts?.length || 0), 0);

    // Calculate average score
    let totalScore = 0;
    let scoreCount = 0;
    examsWithAttempts.forEach(exam => {
      if (exam.attempts && exam.attempts.length > 0) {
        exam.attempts.forEach(attempt => {
          if (attempt.score !== undefined) {
            totalScore += attempt.score;
            scoreCount++;
          }
        });
      }
    });
    const averageScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

    res.json({
      success: true,
      stats: {
        totalExams,
        publishedExams,
        draftExams,
        completedExams,
        totalAttempts,
        averageScore
      }
    });

  } catch (error) {
    console.error('Error fetching instructor stats:', error);
    res.status(500).json({ message: 'Error fetching instructor stats', error: error.message });
  }
});

export default router;
