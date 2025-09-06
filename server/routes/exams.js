import express from 'express';
const router = express.Router();
import Exam from '../models/exam.model.js';
import Question from '../models/question.model.js';
import Activity from '../models/activity.model.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.ts';

// GET /api/exams - Get all exams with pagination and filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const pipeline = [];
    const matchStage = {};

    // Filter by status
    if (status && status !== 'all') {
      matchStage.status = status;
    }

    // Search by title, subject, or instructor
    if (search) {
      matchStage.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Add id field and sort
    pipeline.push({ $addFields: { id: '$_id' } });
    pipeline.push({ $sort: { createdAt: -1 } });

    // Get total count
    const totalPipeline = [...pipeline, { $count: 'total' }];
    const totalResult = await Exam.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    // Add pagination
    pipeline.push({ $skip: (page - 1) * limit });
    pipeline.push({ $limit: parseInt(limit) });

    const exams = await Exam.aggregate(pipeline);

    res.json({
      exams,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ message: 'Error fetching exams', error: error.message });
  }
});

// GET /api/exams/instructor/:instructorId - Get exams by instructor
router.get('/instructor/:instructorId', authenticateToken, async (req, res) => {
  try {
    const { instructorId } = req.params;
    const { page = 1, limit = 10, status, search } = req.query;
    
    const matchStage = { 
      instructorId: instructorId,
      status: { $ne: 'inactive' } // Exclude soft-deleted exams
    };

    // Filter by status
    if (status && status !== 'all') {
      matchStage.status = status;
    }

    // Search by title or subject
    if (search) {
      matchStage.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const pipeline = [
      { $match: matchStage },
      { $addFields: { id: '$_id' } },
      { $sort: { createdAt: -1 } }
    ];

    // Get total count
    const totalPipeline = [...pipeline, { $count: 'total' }];
    const totalResult = await Exam.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    // Add pagination
    pipeline.push({ $skip: (page - 1) * parseInt(limit) });
    pipeline.push({ $limit: parseInt(limit) });

    const exams = await Exam.aggregate(pipeline);

    res.json({
      exams,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Error fetching instructor exams:', error);
    res.status(500).json({ message: 'Error fetching instructor exams', error: error.message });
  }
});

// GET /api/exams/:id - Get exam by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('questions')
      .populate('instructorId', 'name email');
    
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    res.json(exam);
  } catch (error) {
    console.error('Error fetching exam:', error);
    res.status(500).json({ message: 'Error fetching exam', error: error.message });
  }
});

// POST /api/exams - Create new exam
router.post('/', authenticateToken, authorizeRole(['admin', 'instructor']), async (req, res) => {
  try {
    const examData = {
      ...req.body,
      instructorId: req.user.id,
      createdBy: req.user.id
    };
    
    const exam = new Exam(examData);
    await exam.save();
    
    // Log activity
    await Activity.create({
      userId: req.user.id,
      action: 'exam_created',
      details: `Created exam: ${exam.title}`,
      metadata: { examId: exam._id }
    });
    
    res.status(201).json(exam);
  } catch (error) {
    console.error('Error creating exam:', error);
    res.status(400).json({ message: 'Error creating exam', error: error.message });
  }
});

// PUT /api/exams/:id - Update exam
router.put('/:id', authenticateToken, authorizeRole(['admin', 'instructor']), async (req, res) => {
  try {
    const existingExam = await Exam.findById(req.params.id);
    if (!existingExam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    
    // Check if user owns this exam
    if (existingExam.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. You can only edit your own exams.' });
    }
    
    // Prevent editing published exams with submissions
    if (existingExam.status === 'published' && existingExam.attempts.length > 0) {
      return res.status(400).json({ message: 'Cannot edit published exam with student submissions' });
    }
    
    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    // Log activity
    await Activity.create({
      userId: req.user.id,
      action: 'exam_updated',
      details: `Updated exam: ${exam.title}`,
      metadata: { examId: exam._id }
    });
    
    res.json(exam);
  } catch (error) {
    console.error('Error updating exam:', error);
    res.status(400).json({ message: 'Error updating exam', error: error.message });
  }
});

// DELETE /api/exams/:id - Soft delete exam
router.delete('/:id', authenticateToken, authorizeRole(['admin', 'instructor']), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    
    // Check if user owns this exam
    if (exam.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. You can only delete your own exams.' });
    }
    
    // Prevent deleting published/completed exams with submissions
    if ((exam.status === 'published' || exam.status === 'completed') && exam.attempts.length > 0) {
      return res.status(400).json({ message: 'Cannot delete exam with student submissions' });
    }
    
    // Soft delete - update status to inactive
    exam.status = 'inactive';
    await exam.save();
    
    // Log activity
    await Activity.create({
      userId: req.user.id,
      action: 'exam_deleted',
      details: `Deleted exam: ${exam.title}`,
      metadata: { examId: exam._id }
    });
    
    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Error deleting exam:', error);
    res.status(500).json({ message: 'Error deleting exam', error: error.message });
  }
});

// PATCH /api/exams/:id/publish - Publish exam
router.patch('/:id/publish', authenticateToken, authorizeRole(['admin', 'instructor']), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    
    // Check if user owns this exam
    if (exam.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. You can only publish your own exams.' });
    }
    
    // Validate exam before publishing
    if (!exam.questions || exam.questions.length === 0) {
      return res.status(400).json({ message: 'Cannot publish exam without questions' });
    }
    
    if (!exam.scheduledDate) {
      return res.status(400).json({ message: 'Cannot publish exam without scheduled date' });
    }
    
    // Check for overlapping schedules (optional validation)
    const overlappingExam = await Exam.findOne({
      instructorId: exam.instructorId,
      status: 'published',
      scheduledDate: {
        $gte: new Date(exam.scheduledDate.getTime() - exam.duration * 60000),
        $lte: new Date(exam.scheduledDate.getTime() + exam.duration * 60000)
      },
      _id: { $ne: exam._id }
    });
    
    if (overlappingExam) {
      return res.status(400).json({ message: 'Exam schedule overlaps with another published exam' });
    }
    
    exam.status = 'published';
    await exam.save();
    
    // Log activity
    await Activity.create({
      userId: req.user.id,
      action: 'exam_published',
      details: `Published exam: ${exam.title}`,
      metadata: { examId: exam._id }
    });
    
    res.json({ message: 'Exam published successfully', exam });
  } catch (error) {
    console.error('Error publishing exam:', error);
    res.status(500).json({ message: 'Error publishing exam', error: error.message });
  }
});

export default router;
