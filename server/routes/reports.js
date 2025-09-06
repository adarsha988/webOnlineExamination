import express from 'express';
const router = express.Router();
import Report from '../models/report.model.js';
import User from '../models/user.model.js';
import Exam from '../models/exam.model.js';
import Activity from '../models/activity.model.js';

// GET /api/reports/usage - Usage analytics report
router.get('/usage', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    // User activity metrics
    const userMetrics = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
            }
          }
        }
      }
    ]);
    
    // Daily activity trends
    const activityTrends = await Activity.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);
    
    // Most active users
    const activeUsers = await Activity.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$user',
          activityCount: { $sum: 1 }
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
      {
        $unwind: '$user'
      },
      {
        $project: {
          name: '$user.name',
          email: '$user.email',
          role: '$user.role',
          activityCount: 1
        }
      },
      {
        $sort: { activityCount: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    const reportData = {
      userMetrics,
      activityTrends,
      activeUsers,
      dateRange: { start, end },
      generatedAt: new Date()
    };
    
    res.json(reportData);
  } catch (error) {
    console.error('Error generating usage analytics:', error);
    res.status(500).json({ message: 'Error generating usage analytics', error: error.message });
  }
});

// GET /api/reports/academic - Academic performance report
router.get('/academic', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Exam statistics
    const examStats = await Exam.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgDuration: { $avg: '$duration' },
          avgTotalMarks: { $avg: '$totalMarks' }
        }
      }
    ]);
    
    // Performance by subject
    const subjectPerformance = await Exam.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          'attempts.0': { $exists: true }
        }
      },
      {
        $unwind: '$attempts'
      },
      {
        $group: {
          _id: '$subject',
          totalAttempts: { $sum: 1 },
          avgScore: { $avg: '$attempts.score' },
          passRate: {
            $avg: {
              $cond: [
                { $gte: ['$attempts.score', '$passingMarks'] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { avgScore: -1 }
      }
    ]);
    
    // Top performing students
    const topStudents = await Exam.aggregate([
      {
        $match: {
          'attempts.0': { $exists: true }
        }
      },
      {
        $unwind: '$attempts'
      },
      {
        $group: {
          _id: '$attempts.student',
          totalExams: { $sum: 1 },
          avgScore: { $avg: '$attempts.score' },
          totalScore: { $sum: '$attempts.score' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'student'
        }
      },
      {
        $unwind: '$student'
      },
      {
        $project: {
          name: '$student.name',
          email: '$student.email',
          totalExams: 1,
          avgScore: { $round: ['$avgScore', 2] },
          totalScore: 1
        }
      },
      {
        $sort: { avgScore: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    const reportData = {
      examStats,
      subjectPerformance,
      topStudents,
      dateRange: { start, end },
      generatedAt: new Date()
    };
    
    res.json(reportData);
  } catch (error) {
    console.error('Error generating academic performance report:', error);
    res.status(500).json({ message: 'Error generating academic performance report', error: error.message });
  }
});

// POST /api/reports/generate - Generate a new report
router.post('/generate', async (req, res) => {
  try {
    const { type, startDate, endDate } = req.body;
    
    if (!type) {
      return res.status(400).json({ message: 'Report type is required' });
    }
    
    // Redirect to appropriate report endpoint based on type
    let reportData;
    
    if (type === 'usage') {
      // Call usage report logic
      const response = await fetch(`http://localhost:5000/api/reports/usage?startDate=${startDate}&endDate=${endDate}`);
      reportData = await response.json();
    } else if (type === 'academic') {
      // Call academic report logic
      const response = await fetch(`http://localhost:5000/api/reports/academic?startDate=${startDate}&endDate=${endDate}`);
      reportData = await response.json();
    } else if (type === 'security') {
      // Call security report logic
      const response = await fetch(`http://localhost:5000/api/reports/security?startDate=${startDate}&endDate=${endDate}`);
      reportData = await response.json();
    } else {
      return res.status(400).json({ message: 'Invalid report type. Use: usage, academic, or security' });
    }
    
    // Save the generated report
    const report = new Report({
      type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report - ${new Date().toLocaleDateString()}`,
      description: `Generated ${type} report for ${startDate || 'last 30 days'} to ${endDate || 'today'}`,
      data: reportData,
      generatedBy: req.user?.id || null, // Assuming user is available in req
      dateRange: {
        start: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: endDate ? new Date(endDate) : new Date()
      }
    });
    
    await report.save();
    
    res.status(201).json({ 
      message: 'Report generated successfully', 
      report: {
        id: report._id,
        type: report.type,
        title: report.title,
        createdAt: report.createdAt,
        data: reportData
      }
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
});

// GET /api/reports/security - Security audit report
router.get('/security', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Login activities
    const loginStats = await Activity.aggregate([
      {
        $match: {
          type: 'user_login',
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);
    
    // Failed login attempts (mock data for now)
    const failedLogins = Math.floor(Math.random() * 50) + 10;
    
    // Suspicious activities
    const suspiciousActivities = await Activity.find({
      type: { $in: ['user_deactivated', 'password_changed'] },
      createdAt: { $gte: start, $lte: end }
    })
    .populate('user', 'name email role')
    .sort({ createdAt: -1 })
    .limit(20);
    
    // User role changes
    const roleChanges = await Activity.find({
      type: 'role_changed',
      createdAt: { $gte: start, $lte: end }
    })
    .populate('user', 'name email role')
    .sort({ createdAt: -1 });
    
    // IP address analysis (mock data)
    const ipAnalysis = [
      { ip: '192.168.1.100', loginCount: 45, location: 'Local Network' },
      { ip: '203.112.45.67', loginCount: 12, location: 'Kathmandu, Nepal' },
      { ip: '103.45.78.90', loginCount: 8, location: 'Pokhara, Nepal' }
    ];
    
    const reportData = {
      loginStats,
      failedLogins,
      suspiciousActivities,
      roleChanges,
      ipAnalysis,
      securityScore: Math.floor(Math.random() * 20) + 80, // 80-100
      dateRange: { start, end },
      generatedAt: new Date()
    };
    
    res.json(reportData);
  } catch (error) {
    console.error('Error generating security audit report:', error);
    res.status(500).json({ message: 'Error generating security audit report', error: error.message });
  }
});

// POST /api/reports - Save a report
router.post('/', async (req, res) => {
  try {
    const { type, title, description, data, generatedBy, dateRange } = req.body;
    
    if (!type || !title || !data || !generatedBy) {
      return res.status(400).json({ message: 'Type, title, data, and generatedBy are required' });
    }
    
    const report = new Report({
      type,
      title,
      description,
      data,
      generatedBy,
      dateRange
    });
    
    await report.save();
    
    res.status(201).json({ message: 'Report saved successfully', report });
  } catch (error) {
    console.error('Error saving report:', error);
    res.status(500).json({ message: 'Error saving report', error: error.message });
  }
});

// GET /api/reports - Get all saved reports
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const query = {};
    
    if (type) query.type = type;
    
    const reports = await Report.find(query)
      .populate('generatedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Report.countDocuments(query);
    
    res.json({
      reports,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Error fetching reports', error: error.message });
  }
});

// GET /api/reports/:id/download - Download report in specified format
router.get('/:id/download', async (req, res) => {
  try {
    const { format = 'pdf' } = req.query;
    const report = await Report.findById(req.params.id)
      .populate('generatedBy', 'name email');
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Generate report content based on format
    let content, contentType, filename;
    
    if (format === 'pdf') {
      // Mock PDF generation - in production, use a library like puppeteer or jsPDF
      content = `PDF Report: ${report.title}\n\nGenerated: ${report.createdAt}\nType: ${report.type}\n\nData:\n${JSON.stringify(report.data, null, 2)}`;
      contentType = 'application/pdf';
      filename = `${report.title.replace(/\s+/g, '_')}.pdf`;
    } else if (format === 'csv') {
      // Mock CSV generation
      content = `Title,Type,Generated Date,Data\n"${report.title}","${report.type}","${report.createdAt}","${JSON.stringify(report.data).replace(/"/g, '""')}"`;
      contentType = 'text/csv';
      filename = `${report.title.replace(/\s+/g, '_')}.csv`;
    } else if (format === 'json') {
      content = JSON.stringify(report, null, 2);
      contentType = 'application/json';
      filename = `${report.title.replace(/\s+/g, '_')}.json`;
    } else {
      return res.status(400).json({ message: 'Unsupported format. Use pdf, csv, or json.' });
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
    
  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({ message: 'Error downloading report', error: error.message });
  }
});

export default router;
