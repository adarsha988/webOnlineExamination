import express from 'express';
// @ts-ignore
import quizRoutes from './quiz.js';
// @ts-ignore
import testimonialRoutes from './testimonial.js';
// @ts-ignore
import contactRoutes from './contact.js';
// @ts-ignore
import collegeRoutes from './college.js';
// @ts-ignore
import statsRoutes from './stats.js';
// @ts-ignore
import usersRoutes from './users.js';
// @ts-ignore
import activitiesRoutes from './activities.js';
// @ts-ignore
import reportsRoutes from './reports.js';
// @ts-ignore
import exportRoutes from './export.js';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Public API Routes
router.use('/api/quiz', quizRoutes);
router.use('/api/testimonial', testimonialRoutes);
router.use('/api/contact', contactRoutes);
router.use('/api/college', collegeRoutes);

// Admin API Routes
router.use('/api/stats', statsRoutes);
router.use('/api/users', usersRoutes);
router.use('/api/activities', activitiesRoutes);
router.use('/api/recent-activities', activitiesRoutes); // Alias for activities
router.use('/api/reports', reportsRoutes);
router.use('/api/export', exportRoutes);

// 404 handler for API routes
router.use('/api/*', (req, res) => {
  res.status(404).json({ 
    message: 'API endpoint not found',
    path: req.originalUrl 
  });
});

export default router;
