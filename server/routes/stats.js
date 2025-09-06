import express from 'express';
const router = express.Router();
import User from '../models/user.model.js';
import Exam from '../models/exam.model.js';
import Activity from '../models/activity.model.js';

// GET /api/stats/users - Total users count
router.get('/users', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const inactiveUsers = await User.countDocuments({ status: 'inactive' });
    
    res.json({
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
      growth: Math.floor(Math.random() * 15) + 5 // Mock growth percentage
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Error fetching user statistics', error: error.message });
  }
});

// GET /api/stats/students - Students count
router.get('/students', async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const activeStudents = await User.countDocuments({ role: 'student', status: 'active' });
    
    res.json({
      total: totalStudents,
      active: activeStudents,
      growth: Math.floor(Math.random() * 12) + 3
    });
  } catch (error) {
    console.error('Error fetching student stats:', error);
    res.status(500).json({ message: 'Error fetching student statistics', error: error.message });
  }
});

// GET /api/stats/instructors - Instructors count
router.get('/instructors', async (req, res) => {
  try {
    const totalInstructors = await User.countDocuments({ role: 'instructor' });
    const activeInstructors = await User.countDocuments({ role: 'instructor', status: 'active' });
    
    res.json({
      total: totalInstructors,
      active: activeInstructors,
      growth: Math.floor(Math.random() * 8) + 2
    });
  } catch (error) {
    console.error('Error fetching instructor stats:', error);
    res.status(500).json({ message: 'Error fetching instructor statistics', error: error.message });
  }
});

// GET /api/stats/exams - Exams count
router.get('/exams', async (req, res) => {
  try {
    const totalExams = await Exam.countDocuments();
    const publishedExams = await Exam.countDocuments({ status: 'published' });
    const draftExams = await Exam.countDocuments({ status: 'draft' });
    
    res.json({
      total: totalExams,
      published: publishedExams,
      draft: draftExams,
      growth: Math.floor(Math.random() * 20) + 5
    });
  } catch (error) {
    console.error('Error fetching exam stats:', error);
    res.status(500).json({ message: 'Error fetching exam statistics', error: error.message });
  }
});

// GET /api/stats/active-today - Users active today
router.get('/active-today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const activeToday = await Activity.distinct('user', {
      createdAt: { $gte: today, $lt: tomorrow }
    });
    
    const loginActivities = await Activity.countDocuments({
      type: 'user_login',
      createdAt: { $gte: today, $lt: tomorrow }
    });
    
    res.json({
      activeUsers: activeToday.length,
      totalLogins: loginActivities,
      peakHour: Math.floor(Math.random() * 12) + 9, // Mock peak hour (9-21)
      avgSessionTime: Math.floor(Math.random() * 45) + 15 // Mock avg session time in minutes
    });
  } catch (error) {
    console.error('Error fetching active today stats:', error);
    res.status(500).json({ message: 'Error fetching active today statistics', error: error.message });
  }
});

// GET /api/stats/system-load - System load analytics
router.get('/system-load', async (req, res) => {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentActivities = await Activity.countDocuments({
      createdAt: { $gte: last24Hours }
    });
    
    // Mock system metrics
    const systemLoad = {
      cpuUsage: Math.floor(Math.random() * 30) + 20, // 20-50%
      memoryUsage: Math.floor(Math.random() * 40) + 30, // 30-70%
      diskUsage: Math.floor(Math.random() * 20) + 40, // 40-60%
      networkTraffic: Math.floor(Math.random() * 100) + 50, // 50-150 MB/s
      activeConnections: Math.floor(Math.random() * 500) + 100,
      recentActivities: recentActivities,
      uptime: '15 days, 7 hours', // Mock uptime
      responseTime: Math.floor(Math.random() * 50) + 100 // 100-150ms
    };
    
    res.json(systemLoad);
  } catch (error) {
    console.error('Error fetching system load stats:', error);
    res.status(500).json({ message: 'Error fetching system load statistics', error: error.message });
  }
});

// GET /api/stats/overview - Dashboard overview
router.get('/overview', async (req, res) => {
  try {
    const [users, students, instructors, exams] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'instructor' }),
      Exam.countDocuments()
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activeToday = await Activity.countDocuments({
      type: 'user_login',
      createdAt: { $gte: today }
    });

    const activeUsers = await User.countDocuments({ isActive: true });

    // Mock system load data
    const systemLoad = {
      cpu: Math.floor(Math.random() * 30) + 30, // 30-60%
      memory: Math.floor(Math.random() * 40) + 40, // 40-80%
      requests: Math.floor(Math.random() * 100) + 80, // 80-180 req/min
      uptime: '99.9%'
    };

    res.json({
      totalUsers: users,
      totalStudents: students,
      totalInstructors: instructors,
      totalExams: exams,
      activeToday,
      activeUsers,
      systemLoad,
      systemHealth: 'Good'
    });
  } catch (error) {
    console.error('Error fetching overview stats:', error);
    res.status(500).json({ message: 'Error fetching overview statistics', error: error.message });
  }
});

export default router;
