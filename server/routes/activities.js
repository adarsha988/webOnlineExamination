import express from 'express';
const router = express.Router();
import Activity from '../models/activity.model.js';
import User from '../models/user.model.js';

// GET /api/recent-activities - Get recent activities with pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, type, userId } = req.query;
    const query = {};
    
    if (type) query.type = type;
    if (userId) query.user = userId;
    
    const activities = await Activity.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Activity.countDocuments(query);
    
    res.json({
      activities,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ message: 'Error fetching activities', error: error.message });
  }
});

// GET /api/activities/:id - Get activity by ID
router.get('/:id', async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('user', 'name email role profileImage');
    
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    
    res.json(activity);
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ message: 'Error fetching activity', error: error.message });
  }
});

// POST /api/activities - Create new activity (for system logging)
router.post('/', async (req, res) => {
  try {
    const { user, type, description, metadata, ipAddress, userAgent } = req.body;
    
    if (!user || !type || !description) {
      return res.status(400).json({ message: 'User, type, and description are required' });
    }
    
    const activity = new Activity({
      user,
      type,
      description,
      metadata: metadata || {},
      ipAddress,
      userAgent
    });
    
    await activity.save();
    
    const populatedActivity = await Activity.findById(activity._id)
      .populate('user', 'name email role');
    
    res.status(201).json({ message: 'Activity logged successfully', activity: populatedActivity });
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ message: 'Error creating activity', error: error.message });
  }
});

// GET /api/activities/user/:userId - Get activities for specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.params.userId;
    
    const activities = await Activity.find({ user: userId })
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Activity.countDocuments({ user: userId });
    
    res.json({
      activities,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching user activities:', error);
    res.status(500).json({ message: 'Error fetching user activities', error: error.message });
  }
});

// GET /api/activities/stats - Get activity statistics
router.get('/stats', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const activityStats = await Activity.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    const dailyStats = await Activity.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
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
    
    res.json({
      activityTypes: activityStats,
      dailyActivity: dailyStats,
      totalActivities: await Activity.countDocuments({ createdAt: { $gte: startDate } })
    });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({ message: 'Error fetching activity statistics', error: error.message });
  }
});

export default router;
