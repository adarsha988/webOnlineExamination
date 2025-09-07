import express from 'express';
import mongoose from 'mongoose';
import StudentExam from '../models/studentExam.model.js';
import Exam from '../models/exam.model.js';
import User from '../models/user.model.js';

const router = express.Router();

// Get student analytics overview
router.get('/analytics/student/:studentId/overview', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { limit = 5 } = req.query;

    // Get completed exams
    const completedExams = await StudentExam.find({
      student: studentId,
      status: 'completed',
      score: { $ne: null }
    })
    .populate('exam', 'title subject totalMarks passingMarks')
    .sort({ submittedAt: -1 })
    .limit(parseInt(limit));

    if (completedExams.length === 0) {
      return res.json({
        success: true,
        data: {
          averageScore: 0,
          bestScore: 0,
          passRate: 0,
          examsAttempted: 0,
          recentExams: []
        }
      });
    }

    // Calculate metrics
    const scores = completedExams.map(exam => exam.percentage || 0);
    const averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    const bestScore = Math.max(...scores);
    
    // Calculate pass rate (assuming 40% as default pass mark)
    const passedExams = completedExams.filter(exam => {
      const passMark = exam.exam?.passingMarks || (exam.exam?.totalMarks * 0.4) || 40;
      const passPercentage = exam.exam?.totalMarks ? (passMark / exam.exam.totalMarks) * 100 : 40;
      return (exam.percentage || 0) >= passPercentage;
    });
    
    const passRate = Math.round((passedExams.length / completedExams.length) * 100);

    // Get total exams attempted
    const totalExamsAttempted = await StudentExam.countDocuments({
      student: studentId,
      status: 'completed'
    });

    res.json({
      success: true,
      data: {
        averageScore,
        bestScore,
        passRate,
        examsAttempted: totalExamsAttempted,
        recentExams: completedExams.slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Error fetching student overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student overview',
      error: error.message
    });
  }
});

// Get scores over time
router.get('/analytics/student/:studentId/scores-over-time', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { months = 6 } = req.query;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    const scoresOverTime = await StudentExam.aggregate([
      {
        $match: {
          student: new mongoose.Types.ObjectId(studentId),
          status: 'completed',
          submittedAt: { $gte: startDate },
          score: { $ne: null }
        }
      },
      {
        $lookup: {
          from: 'exams',
          localField: 'exam',
          foreignField: '_id',
          as: 'examData'
        }
      },
      {
        $unwind: '$examData'
      },
      {
        $project: {
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$submittedAt'
            }
          },
          score: '$score',
          percentage: '$percentage',
          examTitle: '$examData.title',
          subject: '$examData.subject',
          submittedAt: '$submittedAt'
        }
      },
      {
        $sort: { submittedAt: 1 }
      }
    ]);

    res.json({
      success: true,
      data: scoresOverTime
    });
  } catch (error) {
    console.error('Error fetching scores over time:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scores over time',
      error: error.message
    });
  }
});

// Get subject breakdown
router.get('/analytics/student/:studentId/subject-breakdown', async (req, res) => {
  try {
    const { studentId } = req.params;

    const subjectBreakdown = await StudentExam.aggregate([
      {
        $match: {
          student: new mongoose.Types.ObjectId(studentId),
          status: 'completed',
          score: { $ne: null }
        }
      },
      {
        $lookup: {
          from: 'exams',
          localField: 'exam',
          foreignField: '_id',
          as: 'examData'
        }
      },
      {
        $unwind: '$examData'
      },
      {
        $group: {
          _id: '$examData.subject',
          averageScore: { $avg: '$percentage' },
          totalExams: { $sum: 1 },
          bestScore: { $max: '$percentage' },
          worstScore: { $min: '$percentage' },
          totalMarks: { $sum: '$score' },
          possibleMarks: { $sum: '$examData.totalMarks' }
        }
      },
      {
        $project: {
          subject: '$_id',
          averageScore: { $round: ['$averageScore', 1] },
          totalExams: 1,
          bestScore: { $round: ['$bestScore', 1] },
          worstScore: { $round: ['$worstScore', 1] },
          overallPercentage: {
            $round: [
              { $multiply: [{ $divide: ['$totalMarks', '$possibleMarks'] }, 100] },
              1
            ]
          }
        }
      },
      {
        $sort: { averageScore: -1 }
      }
    ]);

    res.json({
      success: true,
      data: subjectBreakdown
    });
  } catch (error) {
    console.error('Error fetching subject breakdown:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subject breakdown',
      error: error.message
    });
  }
});

// Get comparative analysis for specific exam
router.get('/analytics/student/:studentId/comparative/:examId', async (req, res) => {
  try {
    const { studentId, examId } = req.params;

    // Get student's performance
    const studentPerformance = await StudentExam.findOne({
      studentId,
      examId,
      status: { $in: ['submitted', 'auto_submitted'] }
    }).populate('examId', 'title subject totalMarks');

    if (!studentPerformance) {
      return res.status(404).json({
        success: false,
        message: 'Student performance not found for this exam'
      });
    }

    // Get class statistics
    const classStats = await StudentExam.aggregate([
      {
        $match: {
          examId: new mongoose.Types.ObjectId(examId),
          status: { $in: ['submitted', 'auto_submitted'] },
          score: { $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          averageScore: { $avg: '$percentage' },
          highestScore: { $max: '$percentage' },
          lowestScore: { $min: '$percentage' },
          totalStudents: { $sum: 1 },
          scores: { $push: '$percentage' }
        }
      }
    ]);

    if (classStats.length === 0) {
      return res.json({
        success: true,
        data: {
          studentScore: studentPerformance.percentage,
          classAverage: 0,
          percentile: 100,
          rank: 1,
          totalStudents: 1,
          exam: studentPerformance.examId
        }
      });
    }

    const stats = classStats[0];
    const studentScore = studentPerformance.percentage || 0;
    
    // Calculate percentile
    const scoresBelow = stats.scores.filter(score => score < studentScore).length;
    const percentile = Math.round((scoresBelow / stats.totalStudents) * 100);
    
    // Calculate rank
    const sortedScores = [...stats.scores].sort((a, b) => b - a);
    const rank = sortedScores.findIndex(score => score <= studentScore) + 1;

    res.json({
      success: true,
      data: {
        studentScore,
        classAverage: Math.round(stats.averageScore * 10) / 10,
        highestScore: stats.highestScore,
        lowestScore: stats.lowestScore,
        percentile,
        rank,
        totalStudents: stats.totalStudents,
        exam: studentPerformance.examId
      }
    });
  } catch (error) {
    console.error('Error fetching comparative analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comparative analysis',
      error: error.message
    });
  }
});

// Get difficulty analysis
router.get('/analytics/student/:studentId/difficulty-analysis', async (req, res) => {
  try {
    const { studentId } = req.params;

    const difficultyAnalysis = await StudentExam.aggregate([
      {
        $match: {
          studentId: new mongoose.Types.ObjectId(studentId),
          status: { $in: ['submitted', 'auto_submitted'] }
        }
      },
      {
        $unwind: '$answers'
      },
      {
        $lookup: {
          from: 'questions',
          localField: 'answers.questionId',
          foreignField: '_id',
          as: 'question'
        }
      },
      {
        $unwind: '$question'
      },
      {
        $match: {
          'answers.isCorrect': { $ne: null }
        }
      },
      {
        $group: {
          _id: '$question.difficulty',
          totalQuestions: { $sum: 1 },
          correctAnswers: {
            $sum: { $cond: ['$answers.isCorrect', 1, 0] }
          },
          totalMarks: { $sum: '$answers.marksObtained' },
          possibleMarks: { $sum: '$question.marks' }
        }
      },
      {
        $project: {
          difficulty: '$_id',
          totalQuestions: 1,
          correctAnswers: 1,
          accuracy: {
            $round: [
              { $multiply: [{ $divide: ['$correctAnswers', '$totalQuestions'] }, 100] },
              1
            ]
          },
          scorePercentage: {
            $round: [
              { $multiply: [{ $divide: ['$totalMarks', '$possibleMarks'] }, 100] },
              1
            ]
          }
        }
      },
      {
        $sort: { difficulty: 1 }
      }
    ]);

    res.json({
      success: true,
      data: difficultyAnalysis
    });
  } catch (error) {
    console.error('Error fetching difficulty analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch difficulty analysis',
      error: error.message
    });
  }
});

// Export analytics as CSV
router.get('/analytics/student/:studentId/export', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { format = 'csv' } = req.query;

    // Get comprehensive student data
    const studentData = await StudentExam.find({
      studentId,
      status: { $in: ['submitted', 'auto_submitted'] }
    })
    .populate('examId', 'title subject duration totalMarks passingMarks scheduledDate')
    .sort({ submittedAt: -1 });

    if (format === 'csv') {
      // Generate CSV
      const csvHeader = 'Exam Title,Subject,Date Taken,Duration (min),Score,Total Marks,Percentage,Grade,Status\n';
      const csvRows = studentData.map(exam => {
        const examInfo = exam.examId;
        return [
          `"${examInfo.title}"`,
          `"${examInfo.subject}"`,
          exam.submittedAt.toISOString().split('T')[0],
          examInfo.duration,
          exam.score || 0,
          examInfo.totalMarks,
          exam.percentage || 0,
          exam.grade || 'N/A',
          exam.status
        ].join(',');
      }).join('\n');

      const csvContent = csvHeader + csvRows;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=student-analytics.csv');
      res.send(csvContent);
    } else {
      // Return JSON format
      res.json({
        success: true,
        data: studentData,
        exportedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export analytics',
      error: error.message
    });
  }
});

// Get performance trends
router.get('/analytics/student/:studentId/trends', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { period = 'month' } = req.query;

    let groupBy;
    let dateFormat;
    
    switch (period) {
      case 'week':
        groupBy = { $week: '$submittedAt' };
        dateFormat = '%Y-W%U';
        break;
      case 'month':
        groupBy = { $month: '$submittedAt' };
        dateFormat = '%Y-%m';
        break;
      case 'year':
        groupBy = { $year: '$submittedAt' };
        dateFormat = '%Y';
        break;
      default:
        groupBy = { $month: '$submittedAt' };
        dateFormat = '%Y-%m';
    }

    const trends = await StudentExam.aggregate([
      {
        $match: {
          studentId: new mongoose.Types.ObjectId(studentId),
          status: { $in: ['submitted', 'auto_submitted'] },
          score: { $ne: null }
        }
      },
      {
        $group: {
          _id: {
            period: groupBy,
            year: { $year: '$submittedAt' }
          },
          averageScore: { $avg: '$percentage' },
          totalExams: { $sum: 1 },
          bestScore: { $max: '$percentage' },
          worstScore: { $min: '$percentage' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.period': 1 }
      }
    ]);

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Error fetching performance trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance trends',
      error: error.message
    });
  }
});

export default router;
