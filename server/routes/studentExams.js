import express from 'express';
import mongoose from 'mongoose';
import Exam from '../models/exam.model.js';
import StudentExam from '../models/studentExam.model.js';
import Question from '../models/question.model.js';
import User from '../models/user.model.js';
import Notification from '../models/notification.model.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Helper function to find user by email or ID
const findUserByIdentifier = async (identifier) => {
  try {
    // First try to find by email
    let user = await User.findOne({ email: identifier });
    if (user) return user;
    
    // If not found and identifier looks like ObjectId, try by _id
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      user = await User.findById(identifier);
      if (user) return user;
    }
    
    // If not found and identifier looks like UUID, try by profile.userId or any UUID field
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(identifier)) {
      // Try to find by various possible UUID fields
      user = await User.findOne({
        $or: [
          { 'profile.userId': identifier },
          { 'profile.uuid': identifier },
          { 'uuid': identifier },
          { 'userId': identifier }
        ]
      });
      if (user) return user;
    }
    
    return null;
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
};

// Get student's upcoming exams
router.get('/student/:studentId/exams/upcoming', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const user = await findUserByIdentifier(studentId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Return all published exams for students to see
    const upcomingExams = await Exam.find({
      status: 'published'
    })
    .populate('instructorId', 'name email')
    .sort({ scheduledDate: 1 });

    console.log('📚 DEBUG: Found published exams:', upcomingExams.length);
    upcomingExams.forEach(exam => {
      console.log(`  - ${exam.title} (${exam.status})`);
    });

    // Check if student has records for these exams
    const examIds = upcomingExams.map(exam => exam._id);
    const studentExams = await StudentExam.find({
      studentId: user._id,
      examId: { $in: examIds }
    });

    console.log('📋 DEBUG: Found student exam records:', studentExams.length);

    const studentExamMap = {};
    studentExams.forEach(se => {
      studentExamMap[se.examId.toString()] = se;
    });

    const enrichedExams = upcomingExams.map(exam => ({
      ...exam.toObject(),
      studentStatus: studentExamMap[exam._id.toString()]?.status || 'not_started',
      canStart: !studentExamMap[exam._id.toString()] || 
                studentExamMap[exam._id.toString()].status === 'not_started'
    }));

    console.log('✅ DEBUG: Returning enriched exams:', enrichedExams.length);

    res.json({
      success: true,
      data: enrichedExams
    });
  } catch (error) {
    console.error('Error fetching upcoming exams:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming exams',
      error: error.message
    });
  }
});

// Get student's ongoing exams
router.get('/student/:studentId/exams/ongoing', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const user = await findUserByIdentifier(studentId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get student exam records for ongoing exams (in_progress status)
    const ongoingStudentExams = await StudentExam.find({
      studentId: user._id,
      status: 'in_progress'
    })
    .populate({
      path: 'examId',
      populate: {
        path: 'instructorId',
        select: 'name email'
      }
    })
    .sort({ startedAt: -1 });

    // Filter only exams that are actually ongoing
    const enrichedExams = ongoingStudentExams.filter(studentExam => 
      studentExam.examId && studentExam.examId.status === 'ongoing'
    ).map(studentExam => ({
      ...studentExam.toObject(),
      timeRemaining: studentExam.timeRemaining || (studentExam.examId.duration * 60),
      canContinue: true
    }));

    res.json({
      success: true,
      data: enrichedExams
    });
  } catch (error) {
    console.error('Error fetching ongoing exams:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ongoing exams',
      error: error.message
    });
  }
});

// Get exam session for student (for exam taking interface)
router.get('/student/:studentId/exam/:examId/session', async (req, res) => {
  try {
    const { studentId, examId } = req.params;
    
    const user = await findUserByIdentifier(studentId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Find the student's exam session
    const studentExam = await StudentExam.findOne({
      studentId: user._id,
      examId: examId
    })
    .populate({
      path: 'examId',
      populate: [
        {
          path: 'instructorId',
          select: 'name email'
        },
        {
          path: 'questions'
        }
      ]
    });

    if (!studentExam) {
      return res.status(404).json({
        success: false,
        message: 'Exam session not found. Please start the exam first.'
      });
    }

    // Check if exam is accessible
    if (studentExam.status === 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Exam has already been submitted'
      });
    }

    // Calculate time remaining
    const now = new Date();
    const startTime = new Date(studentExam.startedAt);
    const examDuration = studentExam.examId.duration * 60 * 1000; // Convert minutes to milliseconds
    const elapsedTime = now - startTime;
    const timeRemaining = Math.max(0, Math.floor((examDuration - elapsedTime) / 1000)); // Convert to seconds

    // Auto-submit if time is up
    if (timeRemaining <= 0 && studentExam.status !== 'auto_submitted') {
      studentExam.status = 'auto_submitted';
      studentExam.submittedAt = now;
      await studentExam.save();
      
      return res.status(400).json({
        success: false,
        message: 'Exam time has expired and has been auto-submitted'
      });
    }

    res.json({
      success: true,
      data: {
        ...studentExam.toObject(),
        timeRemaining,
        lastSavedAt: studentExam.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching exam session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exam session'
    });
  }
});

// Get student's completed exams
router.get('/student/:studentId/exams/completed', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const user = await findUserByIdentifier(studentId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    const completedExams = await StudentExam.find({
      studentId: user._id,
      status: 'submitted'
    })
    .populate({
      path: 'examId',
      populate: {
        path: 'instructorId',
        select: 'name email'
      }
    })
    .sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: completedExams
    });
  } catch (error) {
    console.error('Error fetching completed exams:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch completed exams',
      error: error.message
    });
  }
});

// Get student notifications
router.get('/student/:studentId/notifications', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const user = await findUserByIdentifier(studentId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    const notifications = await Notification.find({
      recipient: user._id
    })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Notification.countDocuments({
      recipient: user._id
    });

    const unreadCount = await Notification.countDocuments({
      recipient: user._id,
      read: false
    });

    res.json({
      success: true,
      data: notifications,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: notifications.length,
        totalRecords: total
      },
      unreadCount: unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// Start exam
router.post('/student/:studentId/exam/:examId/start', async (req, res) => {
  try {
    const { studentId, examId } = req.params;
    
    const user = await findUserByIdentifier(studentId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if exam exists and is available
    const exam = await Exam.findById(examId).populate('questions');
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Allow any student to take any published exam - no assignment restrictions

    // Check if exam is in correct status (allow published exams)
    if (exam.status !== 'ongoing' && exam.status !== 'upcoming' && exam.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Exam is not available for taking'
      });
    }

    // Check if student already has an exam record
    let studentExam = await StudentExam.findOne({
      studentId: user._id,
      examId: examId
    });

    if (studentExam && (studentExam.status === 'submitted' || studentExam.status === 'completed')) {
      return res.status(400).json({
        success: false,
        message: 'You have already completed this exam'
      });
    }

    // Create or update student exam record
    if (!studentExam) {
      studentExam = new StudentExam({
        studentId: user._id,
        examId: examId,
        status: 'in_progress',
        startedAt: new Date(),
        timeRemaining: exam.duration * 60, // Convert minutes to seconds
        answers: []
      });
    } else {
      studentExam.status = 'in_progress';
      studentExam.startedAt = new Date();
    }

    await studentExam.save();

    res.json({
      success: true,
      message: 'Exam started successfully',
      studentExam: studentExam,
      exam: exam
    });
  } catch (error) {
    console.error('Error starting exam:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start exam',
      error: error.message
    });
  }
});

// Save answer
router.post('/student/:studentId/exam/:examId/answer', async (req, res) => {
  try {
    const { studentId, examId } = req.params;
    const { questionId, answer, timeSpent } = req.body;
    
    const user = await findUserByIdentifier(studentId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const studentExam = await StudentExam.findOne({
      studentId: user._id,
      examId: examId,
      status: 'in_progress'
    });

    if (!studentExam) {
      return res.status(404).json({
        success: false,
        message: 'Active exam session not found'
      });
    }

    // Find existing answer or create new one
    const existingAnswerIndex = studentExam.answers.findIndex(
      a => a.question.toString() === questionId
    );

    const answerData = {
      question: questionId,
      answer: answer,
      timeSpent: timeSpent || 0,
      answeredAt: new Date()
    };

    if (existingAnswerIndex >= 0) {
      studentExam.answers[existingAnswerIndex] = answerData;
    } else {
      studentExam.answers.push(answerData);
    }

    await studentExam.save();

    res.json({
      success: true,
      message: 'Answer saved successfully'
    });
  } catch (error) {
    console.error('Error saving answer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save answer',
      error: error.message
    });
  }
});

// Submit exam
router.post('/student/:studentId/exam/:examId/submit', async (req, res) => {
  try {
    const { studentId, examId } = req.params;
    
    const user = await findUserByIdentifier(studentId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const studentExam = await StudentExam.findOne({
      studentId: user._id,
      examId: examId,
      status: 'in_progress'
    }).populate('examId');

    if (!studentExam) {
      return res.status(404).json({
        success: false,
        message: 'Active exam session not found'
      });
    }

    // Calculate score
    const exam = studentExam.examId;
    const questions = await Question.find({ _id: { $in: exam.questions } });
    
    let totalScore = 0;
    let maxScore = 0;

    questions.forEach(question => {
      maxScore += question.marks || 1;
      const studentAnswer = studentExam.answers.find(
        a => a.question.toString() === question._id.toString()
      );
      
      if (studentAnswer && studentAnswer.answer === question.correctAnswer) {
        totalScore += question.marks || 1;
      }
    });

    // Update student exam record
    studentExam.status = 'submitted';
    studentExam.submittedAt = new Date();
    studentExam.score = totalScore;
    studentExam.maxScore = maxScore;
    studentExam.percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    await studentExam.save();

    res.json({
      success: true,
      message: 'Exam submitted successfully',
      score: totalScore,
      maxScore: maxScore,
      percentage: studentExam.percentage
    });
  } catch (error) {
    console.error('Error submitting exam:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit exam',
      error: error.message
    });
  }
});

// Report violation
router.post('/student/:studentId/exam/:examId/violation', async (req, res) => {
  try {
    const { studentId, examId } = req.params;
    const { type, description, severity = 'medium' } = req.body;
    
    const user = await findUserByIdentifier(studentId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const studentExam = await StudentExam.findOne({
      studentId: user._id,
      examId: examId,
      status: 'in_progress'
    });

    if (!studentExam) {
      return res.status(404).json({
        success: false,
        message: 'Active exam session not found'
      });
    }

    // Add violation to student exam
    studentExam.violations.push({
      type,
      description,
      severity,
      timestamp: new Date()
    });

    await studentExam.save();

    res.json({
      success: true,
      message: 'Violation reported successfully'
    });
  } catch (error) {
    console.error('Error reporting violation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to report violation',
      error: error.message
    });
  }
});

// Get exam result for student
router.get('/student/:studentId/exam/:examId/result', authenticateToken, async (req, res) => {
  try {
    const { studentId, examId } = req.params;
    
    // Find the student exam attempt
    const studentExam = await StudentExam.findOne({
      studentId: studentId,
      examId: examId,
      status: { $in: ['submitted', 'auto_submitted'] }
    })
    .populate('examId', 'title subject duration totalMarks passingMarks showResults allowReview')
    .populate('studentId', 'name email');

    if (!studentExam) {
      return res.status(404).json({
        success: false,
        message: 'Exam result not found'
      });
    }

    const exam = studentExam.examId;
    
    // Check if results should be shown based on exam settings AND instructor approval
    if (!exam.showResults || !studentExam.isApproved) {
      return res.json({
        success: true,
        data: {
          exam: {
            title: exam.title,
            subject: exam.subject,
            totalMarks: exam.totalMarks,
            passingMarks: exam.passingMarks
          },
          student: {
            name: studentExam.studentId.name,
            email: studentExam.studentId.email
          },
          showResults: false,
          message: studentExam.isApproved ? 
            "Keep Trying! Your results will be available once reviewed by your instructor." :
            "Your exam has been submitted successfully. Results will be available after instructor review.",
          submittedAt: studentExam.submittedAt,
          timeTaken: studentExam.timeTaken,
          status: studentExam.isApproved ? 'approved' : 'pending_review'
        }
      });
    }

    // If results should be shown and approved, return full result data
    const result = {
      exam: {
        title: exam.title,
        subject: exam.subject,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        showResults: exam.showResults,
        allowReview: exam.allowReview
      },
      student: {
        name: studentExam.studentId.name,
        email: studentExam.studentId.email
      },
      score: studentExam.score,
      percentage: studentExam.percentage,
      grade: studentExam.grade,
      passed: studentExam.percentage >= exam.passingMarks,
      answers: studentExam.answers,
      timeTaken: studentExam.timeTaken,
      submittedAt: studentExam.submittedAt,
      feedback: studentExam.feedback,
      showResults: true,
      isApproved: studentExam.isApproved,
      gradedAt: studentExam.gradedAt
    };

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching exam result:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exam result',
      error: error.message
    });
  }
});

// Utility function to get time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}
 
// Get student's exams with status query parameter (for frontend compatibility)
router.get('/student/:studentId/exams', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;
    
    const user = await findUserByIdentifier(studentId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    let query = {};
    
    // Build query based on status
    switch (status) {
      case 'upcoming':
        query.status = 'upcoming';
        break;
      case 'ongoing':
        query.status = 'ongoing';
        break;
      case 'completed':
        query.status = 'completed';
        break;
      default:
        // If no status specified, return all exams
        break;
    }
    
    const skip = (page - 1) * limit;
    
    const exams = await Exam.find(query)
      .populate('instructorId', 'name email')
      .populate('questions')
      .sort({ scheduledDate: status === 'completed' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get student exam records for completed exams
    let examResults = [];
    if (status === 'completed') {
      const studentExamIds = exams.map(exam => exam._id);
      examResults = await StudentExam.find({
        studentId: user._id,
        examId: { $in: studentExamIds }
      });
    }
    
    // Format response based on status
    const formattedExams = exams.map(exam => {
      const examObj = exam.toObject();
      
      if (status === 'completed') {
        const studentResult = examResults.find(result => 
          result.examId.toString() === exam._id.toString()
        );
        
        if (studentResult) {
          examObj.studentResult = {
            score: studentResult.score,
            totalQuestions: studentResult.totalQuestions,
            percentage: studentResult.percentage,
            submittedAt: studentResult.submittedAt,
            timeTaken: studentResult.timeTaken
          };
        }
      }
      
      return examObj;
    });
    
    const totalCount = await Exam.countDocuments(query);
    
    res.json({
      success: true,
      data: formattedExams,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasMore: skip + exams.length < totalCount
      }
    });
    
  } catch (error) {
    console.error('Error fetching student exams:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exams'
    });
  }
});

export default router;
