import type { Express } from "express";
import { createServer, type Server } from "http";
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { storage } from "./storage";
import { authenticateToken, authorizeRole } from "./middleware/auth.js";
import { gradeShortAnswers } from "./services/aiGrading.js";
import { insertUserSchema, insertExamSchema, insertQuestionSchema } from "@shared/schema";
// @ts-ignore
import quizRoutes from "./routes/quiz.js";
// @ts-ignore
import testimonialRoutes from "./routes/testimonial.js";
// @ts-ignore
import contactRoutes from "./routes/contact.js";
// @ts-ignore
import collegeRoutes from "./routes/college.js";
// @ts-ignore
import statsRoutes from "./routes/stats.js";
// @ts-ignore
import usersRoutes from "./routes/users.js";
// @ts-ignore
import activitiesRoutes from "./routes/activities.js";
// @ts-ignore
import reportsRoutes from "./routes/reports.js";
// @ts-ignore
import exportRoutes from "./routes/export.js";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export function registerRoutes(app: Express): Server {
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Public API Routes
  app.use('/api/quiz', quizRoutes);
  app.use('/api/testimonial', testimonialRoutes);
  app.use('/api/contact', contactRoutes);
  app.use('/api/college', collegeRoutes);

  // Admin API Routes
  app.use('/api/stats', statsRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/activities', activitiesRoutes);
  app.use('/api/recent-activities', activitiesRoutes); // Alias for activities
  app.use('/api/reports', reportsRoutes);
  app.use('/api/export', exportRoutes);

  // Authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, name, role = 'student' } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash the password with bcrypt
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Create user with hashed password
      const user = await storage.createUser({ email, password: hashedPassword, name, role });
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Registration failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Compare password with bcrypt
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Failed to get user' });
    }
  });

  // 404 handler for API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({ 
      message: 'API endpoint not found',
      path: req.originalUrl 
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
