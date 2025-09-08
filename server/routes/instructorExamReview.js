import express from 'express';
import mongoose from 'mongoose';
import StudentExam from '../models/studentExam.model.js';
import Exam from '../models/exam.model.js';
import User from '../models/user.model.js';
import { authenticateToken, requireInstructor } from '../middleware/auth.js';
import nodemailer from 'nodemailer';

const router = express.Router();

// Get exam submissions for instructor review
router.get('/instructor/exam/:examId/submissions', authenticateToken, requireInstructor, async (req, res) => {
  try {
    const { examId } = req.params;
    const instructorId = req.user.userId || req.user.id || req.user._id;

    // Verify exam belongs to instructor
    const exam = await Exam.findById(examId)
      .populate('questions')
      .populate('instructorId', 'name email');
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    if (exam.instructorId._id.toString() !== instructorId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This exam does not belong to you.'
      });
    }

    // Get all student submissions for this exam
    const submissions = await StudentExam.find({
      examId: examId,
      status: { $in: ['submitted', 'auto_submitted'] }
    })
    .populate('studentId', 'name email')
    .sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: {
        exam,
        submissions
      }
    });

  } catch (error) {
    console.error('Error fetching exam submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exam submissions',
      error: error.message
    });
  }
});

// Approve exam result and send to student
router.post('/instructor/exam/approve-result', authenticateToken, requireInstructor, async (req, res) => {
  try {
    const { submissionId, totalScore, percentage, feedback, sendEmail } = req.body;
    const instructorId = req.user.userId || req.user.id || req.user._id;

    // Find the submission
    const submission = await StudentExam.findById(submissionId)
      .populate('examId')
      .populate('studentId', 'name email');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Verify instructor owns this exam
    if (submission.examId.instructorId.toString() !== instructorId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update submission with instructor's grading
    submission.score = totalScore;
    submission.percentage = percentage;
    submission.feedback = feedback;
    submission.isApproved = true;
    submission.gradedAt = new Date();
    submission.gradedBy = instructorId;

    // Calculate grade based on percentage
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 85) grade = 'A';
    else if (percentage >= 80) grade = 'B+';
    else if (percentage >= 75) grade = 'B';
    else if (percentage >= 70) grade = 'C+';
    else if (percentage >= 65) grade = 'C';
    else if (percentage >= 60) grade = 'D';

    submission.grade = grade;
    await submission.save();

    // Send email notification if requested
    if (sendEmail) {
      try {
        await sendResultEmail(submission);
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.json({
      success: true,
      message: 'Result approved and processed successfully',
      data: submission
    });

  } catch (error) {
    console.error('Error approving exam result:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve exam result',
      error: error.message
    });
  }
});

// Email configuration and sending function
async function sendResultEmail(submission) {
  // Create email transporter (configure with your email service)
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'your-email@gmail.com',
      pass: process.env.SMTP_PASS || 'your-app-password'
    }
  });

  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Exam Result Available</h2>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Exam: ${submission.examId.title}</h3>
        <p><strong>Subject:</strong> ${submission.examId.subject}</p>
        <p><strong>Your Score:</strong> ${submission.score}/${submission.examId.totalMarks}</p>
        <p><strong>Percentage:</strong> ${submission.percentage}%</p>
        <p><strong>Grade:</strong> ${submission.grade}</p>
        <p><strong>Status:</strong> ${submission.percentage >= submission.examId.passingMarks ? 'Passed' : 'Failed'}</p>
      </div>
      
      ${submission.feedback ? `
        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #1976d2;">Instructor Feedback:</h4>
          <p style="margin-bottom: 0;">${submission.feedback}</p>
        </div>
      ` : ''}
      
      <p>You can view your detailed results by logging into the examination system.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
        <p>This is an automated message from the Online Examination System.</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: process.env.SMTP_USER || 'noreply@examSystem.com',
    to: submission.studentId.email,
    subject: `Exam Result: ${submission.examId.title}`,
    html: emailContent
  };

  await transporter.sendMail(mailOptions);
}

// Get pending submissions count for instructor dashboard
router.get('/instructor/pending-reviews', authenticateToken, requireInstructor, async (req, res) => {
  try {
    const instructorId = req.user.userId || req.user.id || req.user._id;

    // Get all exams by this instructor
    const instructorExams = await Exam.find({ instructorId }).select('_id');
    const examIds = instructorExams.map(exam => exam._id);

    // Count pending submissions
    const pendingCount = await StudentExam.countDocuments({
      examId: { $in: examIds },
      status: { $in: ['submitted', 'auto_submitted'] },
      isApproved: { $ne: true }
    });

    res.json({
      success: true,
      data: { pendingReviews: pendingCount }
    });

  } catch (error) {
    console.error('Error fetching pending reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending reviews'
    });
  }
});

export default router;
