import express from 'express';
import mongoose from 'mongoose';
import Exam from '../models/exam.model.js';
import StudentExam from '../models/studentExam.model.js';
import Question from '../models/question.model.js';
import User from '../models/user.model.js';
import Notification from '../models/notification.model.js';

const router = express.Router();

// Get student's upcoming exams
router.get('/student/:studentId/exams/upcoming', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Find user by email or ID to get the correct ObjectId
    const user = await User.findOne({
      $or: [
        { email: studentId },
        { _id: mongoose.Types.ObjectId.isValid(studentId) ? studentId : null }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    const upcomingExams = await Exam.find({
      status: 'upcoming',
      assignedStudents: user._id
    })
    .populate('instructor', 'name email')
    .populate('questions')
    .sort({ startDate: 1 });

    // Check if student has records for these exams
    const examIds = upcomingExams.map(exam => exam._id);
    const studentExams = await StudentExam.find({
      student: user._id,
      exam: { $in: examIds }
    });

    const studentExamMap = {};
    studentExams.forEach(se => {
      studentExamMap[se.exam.toString()] = se;
    });

    const enrichedExams = upcomingExams.map(exam => ({
      ...exam.toObject(),
      studentStatus: studentExamMap[exam._id.toString()]?.status || 'not_started',
      canStart: !studentExamMap[exam._id.toString()] || 
                studentExamMap[exam._id.toString()].status === 'not_started'
    }));

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
    
    // Find user by email or ID to get the correct ObjectId
    const user = await User.findOne({
      $or: [
        { email: studentId },
        { _id: mongoose.Types.ObjectId.isValid(studentId) ? studentId : null }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    const ongoingExams = await Exam.find({
      status: 'ongoing',
      assignedStudents: user._id
    })
    .populate('instructor', 'name email')
    .populate('questions')
    .sort({ startDate: 1 });

    // Get student exam records for ongoing exams
    const examIds = ongoingExams.map(exam => exam._id);
    const studentExams = await StudentExam.find({
      student: user._id,
      exam: { $in: examIds },
      status: 'in_progress'
    });

    const studentExamMap = {};
    studentExams.forEach(se => {
      studentExamMap[se.exam.toString()] = se;
    });

    const enrichedExams = ongoingExams.map(exam => ({
      ...exam.toObject(),
      studentStatus: studentExamMap[exam._id.toString()]?.status || 'not_started',
      progress: studentExamMap[exam._id.toString()]?.answers?.length || 0,
      totalQuestions: exam.questions.length,
      canResume: studentExamMap[exam._id.toString()]?.status === 'in_progress'
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

// Get student's completed exams
router.get('/student/:studentId/exams/completed', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Find user by email or ID to get the correct ObjectId
    const user = await User.findOne({
      $or: [
        { email: studentId },
        { _id: mongoose.Types.ObjectId.isValid(studentId) ? studentId : null }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    const completedExams = await StudentExam.find({
      student: user._id,
      status: 'completed'
    })
    .populate({
      path: 'exam',
      populate: {
        path: 'instructor',
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
      message: 'Failed to fetch upcoming exams',
      error: error.message
    });
  }
});


// Get student notifications (updated route)
router.get('/student/:studentId/notifications', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // Find user by email or ID to get the correct ObjectId
    const user = await User.findOne({
      $or: [
        { email: studentId },
        { _id: mongoose.Types.ObjectId.isValid(studentId) ? studentId : null }
      ]
    });

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
    
    // Find user by email or ID to get the correct ObjectId
    const user = await User.findOne({
      $or: [
        { email: studentId },
        { _id: mongoose.Types.ObjectId.isValid(studentId) ? studentId : null }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    if (unreadOnly === 'true') {
      query.isRead = false;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      ...query,
      isRead: false
    });
    
    // Add timeAgo to each notification
    const getTimeAgo = (date) => {
      const now = new Date();
      const diff = now - date;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      
      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      return date.toLocaleDateString();
    };
    
    const notificationsWithTime = notifications.map(notification => ({
      ...notification,
      timeAgo: getTimeAgo(notification.createdAt)
    }));
    
    res.json({
      success: true,
      data: notificationsWithTime,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: notificationsWithTime.length,
        totalRecords: total
      },
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching student notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// Delete notification
router.delete('/student/:studentId/notifications/:notificationId', async (req, res) => {
  try {
    const { studentId, notificationId } = req.params;
    
    // Find and delete the notification
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      $or: [
        { user: studentId }, // User-specific notifications
        { user: null }       // Global notifications (can be deleted by any user)
      ]
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or not authorized to delete'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
});

// Mark notification as read
router.patch('/student/:studentId/notifications/:notificationId/read', async (req, res) => {
  try {
    const { studentId, notificationId } = req.params;
    
    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        $or: [
          { user: studentId },
          { user: null }
        ]
      },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

// Start an exam
router.post('/exams/:examId/start', async (req, res) => {
  try {
    const { examId } = req.params;
    const { studentId, sessionData } = req.body;

    // Validate exam exists and is published
    const exam = await Exam.findById(examId).populate('questions');
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    if (exam.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Exam is not available'
      });
    }

    // Check if exam is scheduled and within time window
    const now = new Date();
    if (exam.scheduledDate && exam.scheduledDate > now) {
      return res.status(400).json({
        success: false,
        message: 'Exam has not started yet'
      });
    }

    if (exam.endDate && exam.endDate < now) {
      return res.status(400).json({
        success: false,
        message: 'Exam has ended'
      });
    }

    // Check if student is assigned to this exam
    const isAssigned = exam.attempts?.some(attempt => 
      attempt.student.toString() === studentId
    ) || exam.assignedTo?.includes(studentId);

    if (!isAssigned) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this exam'
      });
    }

    // Check if student has already started this exam
    let studentExam = await StudentExam.findOne({
      examId,
      studentId
    });

    if (studentExam) {
      if (studentExam.status === 'submitted' || studentExam.status === 'auto_submitted') {
        return res.status(400).json({
          success: false,
          message: 'You have already completed this exam'
        });
      }
      
      if (studentExam.status === 'in_progress') {
        // Calculate remaining time
        const timeElapsed = Math.floor((now - studentExam.startedAt) / 1000);
        const timeRemaining = Math.max(0, (exam.duration * 60) - timeElapsed);
        
        if (timeRemaining <= 0) {
          // Auto-submit if time is up
          studentExam.status = 'auto_submitted';
          studentExam.submittedAt = new Date();
          await studentExam.calculateScore();
          
          return res.status(400).json({
            success: false,
            message: 'Exam time has expired'
          });
        }
        
        studentExam.timeRemaining = timeRemaining;
        await studentExam.save();
        
        return res.json({
          success: true,
          message: 'Resuming exam',
          data: studentExam
        });
      }
    } else {
      // Create new student exam session
      studentExam = new StudentExam({
        examId,
        studentId,
        answers: exam.questions.map(q => ({
          questionId: q._id,
          answer: null
        })),
        sessionData,
        timeRemaining: exam.duration * 60 // Convert minutes to seconds
      });
    }

    // Start the exam
    studentExam.status = 'in_progress';
    studentExam.startedAt = new Date();
    await studentExam.save();

    // Populate exam details for response
    await studentExam.populate('examId');

    res.json({
      success: true,
      message: 'Exam started successfully',
      data: studentExam
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

// Save answer for a question
router.patch('/exams/:examId/answer', async (req, res) => {
  try {
    const { examId } = req.params;
    const { studentId, questionId, answer, timeSpent } = req.body;

    const studentExam = await StudentExam.findOne({
      examId,
      studentId,
      status: 'in_progress'
    });

    if (!studentExam) {
      return res.status(404).json({
        success: false,
        message: 'Active exam session not found'
      });
    }

    // Check if exam time hasn't expired
    const exam = await Exam.findById(examId);
    const now = new Date();
    const timeElapsed = Math.floor((now - studentExam.startedAt) / 1000);
    const timeRemaining = Math.max(0, (exam.duration * 60) - timeElapsed);

    if (timeRemaining <= 0) {
      // Auto-submit if time is up
      studentExam.status = 'auto_submitted';
      studentExam.submittedAt = new Date();
      await studentExam.calculateScore();
      
      return res.status(400).json({
        success: false,
        message: 'Exam time has expired. Your exam has been auto-submitted.'
      });
    }

    // Find and update the answer
    const answerIndex = studentExam.answers.findIndex(
      a => a.questionId.toString() === questionId
    );

    if (answerIndex !== -1) {
      studentExam.answers[answerIndex].answer = answer;
      if (timeSpent) {
        studentExam.answers[answerIndex].timeSpent = timeSpent;
      }
    } else {
      studentExam.answers.push({
        questionId,
        answer,
        timeSpent: timeSpent || 0
      });
    }

    studentExam.timeRemaining = timeRemaining;
    studentExam.lastSavedAt = new Date();
    await studentExam.save();

    res.json({
      success: true,
      message: 'Answer saved successfully',
      data: {
        timeRemaining,
        lastSavedAt: studentExam.lastSavedAt
      }
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
router.post('/exams/:examId/submit', async (req, res) => {
  try {
    const { examId } = req.params;
    const { studentId, finalAnswers } = req.body;

    const studentExam = await StudentExam.findOne({
      examId,
      studentId,
      status: 'in_progress'
    });

    if (!studentExam) {
      return res.status(404).json({
        success: false,
        message: 'Active exam session not found'
      });
    }

    // Update final answers if provided
    if (finalAnswers && Array.isArray(finalAnswers)) {
      finalAnswers.forEach(({ questionId, answer, timeSpent }) => {
        const answerIndex = studentExam.answers.findIndex(
          a => a.questionId.toString() === questionId
        );
        
        if (answerIndex !== -1) {
          studentExam.answers[answerIndex].answer = answer;
          if (timeSpent) {
            studentExam.answers[answerIndex].timeSpent = timeSpent;
          }
        }
      });
    }

    // Submit the exam
    studentExam.status = 'submitted';
    studentExam.submittedAt = new Date();
    
    // Calculate score
    await studentExam.calculateScore();

    // Create notification for result
    await Notification.create({
      type: 'exam',
      title: 'Exam Submitted',
      message: `You have successfully submitted the exam "${studentExam.examId.title}". Results will be available once graded.`,
      link: `/student/exams/${examId}/result`,
      userId: studentId
    });

    res.json({
      success: true,
      message: 'Exam submitted successfully',
      data: {
        score: studentExam.score,
        percentage: studentExam.percentage,
        grade: studentExam.grade,
        submittedAt: studentExam.submittedAt
      }
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

// Get exam result
router.get('/exams/:examId/result', async (req, res) => {
  try {
    const { examId } = req.params;
    const { studentId } = req.query;

    const studentExam = await StudentExam.findOne({
      examId,
      studentId,
      status: { $in: ['submitted', 'auto_submitted'] }
    })
    .populate('examId', 'title subject totalMarks passingMarks settings')
    .populate('answers.questionId', 'questionText type options correctAnswer explanation marks');

    if (!studentExam) {
      return res.status(404).json({
        success: false,
        message: 'Exam result not found'
      });
    }

    // Check if results are published
    const exam = studentExam.examId;
    if (!exam.settings?.showResults) {
      return res.status(403).json({
        success: false,
        message: 'Results are not yet published'
      });
    }

    res.json({
      success: true,
      data: studentExam
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

// Get exam session details (for taking exam)
router.get('/exams/:examId/session', async (req, res) => {
  try {
    const { examId } = req.params;
    const { studentId } = req.query;

    const studentExam = await StudentExam.findOne({
      examId,
      studentId,
      status: 'in_progress'
    })
    .populate({
      path: 'examId',
      populate: {
        path: 'questions',
        select: 'questionText type options marks difficulty'
      }
    });

    if (!studentExam) {
      return res.status(404).json({
        success: false,
        message: 'Active exam session not found'
      });
    }

    // Calculate remaining time
    const now = new Date();
    const timeElapsed = Math.floor((now - studentExam.startedAt) / 1000);
    const timeRemaining = Math.max(0, (studentExam.examId.duration * 60) - timeElapsed);

    if (timeRemaining <= 0) {
      // Auto-submit if time is up
      studentExam.status = 'auto_submitted';
      studentExam.submittedAt = new Date();
      await studentExam.calculateScore();
      
      return res.status(400).json({
        success: false,
        message: 'Exam time has expired'
      });
    }

    studentExam.timeRemaining = timeRemaining;
    await studentExam.save();

    res.json({
      success: true,
      data: {
        ...studentExam.toObject(),
        timeRemaining
      }
    });
  } catch (error) {
    console.error('Error fetching exam session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exam session',
      error: error.message
    });
  }
});

// Report violation
router.post('/exams/:examId/violation', async (req, res) => {
  try {
    const { examId } = req.params;
    const { studentId, type, details } = req.body;

    const studentExam = await StudentExam.findOne({
      examId,
      studentId,
      status: 'in_progress'
    });

    if (!studentExam) {
      return res.status(404).json({
        success: false,
        message: 'Active exam session not found'
      });
    }

    await studentExam.addViolation(type, details);

    res.json({
      success: true,
      message: 'Violation recorded'
    });
  } catch (error) {
    console.error('Error recording violation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record violation',
      error: error.message
    });
  }
});

export default router;
