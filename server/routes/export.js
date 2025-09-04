import express from 'express';
const router = express.Router();
import User from '../models/user.model.js';
import Exam from '../models/exam.model.js';
import Activity from '../models/activity.model.js';
import Report from '../models/report.model.js';

// Helper function to convert data to CSV format
const convertToCSV = (data, headers) => {
  if (!data || data.length === 0) return '';
  
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
};

// GET /api/export?format=csv|json - Export all system data
router.get('/', async (req, res) => {
  try {
    const { format = 'json', type = 'all' } = req.query;
    
    let exportData = {};
    
    // Export users data
    if (type === 'all' || type === 'users') {
      const users = await User.find({}).select('-password').lean();
      exportData.users = users;
    }
    
    // Export exams data
    if (type === 'all' || type === 'exams') {
      const exams = await Exam.find({})
        .populate('createdBy', 'name email')
        .lean();
      exportData.exams = exams;
    }
    
    // Export activities data
    if (type === 'all' || type === 'activities') {
      const activities = await Activity.find({})
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .limit(1000) // Limit to prevent huge exports
        .lean();
      exportData.activities = activities;
    }
    
    // Export reports data
    if (type === 'all' || type === 'reports') {
      const reports = await Report.find({})
        .populate('generatedBy', 'name email')
        .lean();
      exportData.reports = reports;
    }
    
    if (format === 'csv') {
      let csvContent = '';
      
      if (exportData.users) {
        csvContent += 'USERS\n';
        const userHeaders = ['_id', 'name', 'email', 'role', 'status', 'createdAt', 'lastLogin'];
        csvContent += convertToCSV(exportData.users, userHeaders);
        csvContent += '\n\n';
      }
      
      if (exportData.exams) {
        csvContent += 'EXAMS\n';
        const examHeaders = ['_id', 'title', 'subject', 'duration', 'totalMarks', 'status', 'createdAt'];
        csvContent += convertToCSV(exportData.exams, examHeaders);
        csvContent += '\n\n';
      }
      
      if (exportData.activities) {
        csvContent += 'ACTIVITIES\n';
        const activityHeaders = ['_id', 'type', 'description', 'createdAt'];
        const flatActivities = exportData.activities.map(activity => ({
          _id: activity._id,
          type: activity.type,
          description: activity.description,
          createdAt: activity.createdAt,
          userName: activity.user?.name || 'Unknown'
        }));
        csvContent += convertToCSV(flatActivities, [...activityHeaders, 'userName']);
      }
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="system_export_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } else {
      // JSON format
      exportData.exportInfo = {
        generatedAt: new Date(),
        totalRecords: {
          users: exportData.users?.length || 0,
          exams: exportData.exams?.length || 0,
          activities: exportData.activities?.length || 0,
          reports: exportData.reports?.length || 0
        }
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="system_export_${new Date().toISOString().split('T')[0]}.json"`);
      res.json(exportData);
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ message: 'Error exporting data', error: error.message });
  }
});

// GET /api/export/users - Export only users data
router.get('/users', async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    const users = await User.find({}).select('-password').lean();
    
    if (format === 'csv') {
      const headers = ['_id', 'name', 'email', 'role', 'status', 'phone', 'createdAt', 'lastLogin'];
      const csvContent = convertToCSV(users, headers);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="users_export_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } else {
      res.json({
        users,
        total: users.length,
        exportedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Error exporting users:', error);
    res.status(500).json({ message: 'Error exporting users', error: error.message });
  }
});

// GET /api/export/exams - Export only exams data
router.get('/exams', async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    const exams = await Exam.find({})
      .populate('createdBy', 'name email')
      .lean();
    
    if (format === 'csv') {
      const flatExams = exams.map(exam => ({
        _id: exam._id,
        title: exam.title,
        subject: exam.subject,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        status: exam.status,
        createdBy: exam.createdBy?.name || 'Unknown',
        createdAt: exam.createdAt,
        totalAttempts: exam.attempts?.length || 0
      }));
      
      const headers = ['_id', 'title', 'subject', 'duration', 'totalMarks', 'passingMarks', 'status', 'createdBy', 'createdAt', 'totalAttempts'];
      const csvContent = convertToCSV(flatExams, headers);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="exams_export_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } else {
      res.json({
        exams,
        total: exams.length,
        exportedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Error exporting exams:', error);
    res.status(500).json({ message: 'Error exporting exams', error: error.message });
  }
});

export default router;
