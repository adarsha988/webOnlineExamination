import { createServer } from "http";
import jwt from 'jsonwebtoken';
import { storage } from "./storage.js";
import { authenticateToken, authorizeRole } from "./middleware/auth.js";
import { gradeShortAnswers } from "./services/aiGrading.js";
import { validateUser, validateExam, validateQuestion } from "../shared/schema.js";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function registerRoutes(app) {
  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, name, role = 'student' } = req.body;
      
      // Validate input
      const validation = validateUser({ email, password, name, role });
      if (!validation.isValid) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: validation.errors 
        });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Create user (Note: In production, hash the password with bcrypt)
      const user = await storage.createUser({ email, password, name, role });
      
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
      if (!user || user.password !== password) {
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

  // Exam routes
  app.get('/api/exams', authenticateToken, async (req, res) => {
    try {
      const { role, userId } = req.user;
      let exams;

      if (role === 'admin') {
        exams = await storage.getAllExams();
      } else if (role === 'instructor') {
        exams = await storage.getExamsByInstructor(userId);
      } else {
        exams = await storage.getExamsForStudent(userId);
      }

      // Add question count to exams
      const examsWithCounts = await Promise.all(
        exams.map(async (exam) => {
          const questions = await storage.getQuestionsByExam(exam.id);
          return { ...exam, totalQuestions: questions.length };
        })
      );

      res.json(examsWithCounts);
    } catch (error) {
      console.error('Get exams error:', error);
      res.status(500).json({ message: 'Failed to fetch exams' });
    }
  });

  app.get('/api/exams/:id', authenticateToken, async (req, res) => {
    try {
      const exam = await storage.getExam(req.params.id);
      if (!exam) {
        return res.status(404).json({ message: 'Exam not found' });
      }

      const { role, userId } = req.user;
      
      // Check permissions
      if (role === 'student' && !exam.assignedStudents?.includes(userId)) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      if (role === 'instructor' && exam.instructorId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Add question count
      const questions = await storage.getQuestionsByExam(exam.id);
      res.json({ ...exam, totalQuestions: questions.length });
    } catch (error) {
      console.error('Get exam error:', error);
      res.status(500).json({ message: 'Failed to fetch exam' });
    }
  });

  app.post('/api/exams', authenticateToken, authorizeRole(['instructor', 'admin']), async (req, res) => {
    try {
      const examData = {
        ...req.body,
        instructorId: req.user.userId
      };
      
      const validation = validateExam(examData);
      if (!validation.isValid) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: validation.errors
        });
      }
      
      const exam = await storage.createExam(examData);
      res.status(201).json(exam);
    } catch (error) {
      console.error('Create exam error:', error);
      res.status(500).json({ message: 'Failed to create exam' });
    }
  });

  app.put('/api/exams/:id', authenticateToken, authorizeRole(['instructor', 'admin']), async (req, res) => {
    try {
      const exam = await storage.getExam(req.params.id);
      if (!exam) {
        return res.status(404).json({ message: 'Exam not found' });
      }

      const { role, userId } = req.user;
      if (role === 'instructor' && exam.instructorId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const updatedExam = await storage.updateExam(req.params.id, req.body);
      res.json(updatedExam);
    } catch (error) {
      console.error('Update exam error:', error);
      res.status(500).json({ message: 'Failed to update exam' });
    }
  });

  app.delete('/api/exams/:id', authenticateToken, authorizeRole(['instructor', 'admin']), async (req, res) => {
    try {
      const exam = await storage.getExam(req.params.id);
      if (!exam) {
        return res.status(404).json({ message: 'Exam not found' });
      }

      const { role, userId } = req.user;
      if (role === 'instructor' && exam.instructorId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      await storage.deleteExam(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Delete exam error:', error);
      res.status(500).json({ message: 'Failed to delete exam' });
    }
  });

  // Question routes
  app.get('/api/exams/:id/questions', authenticateToken, async (req, res) => {
    try {
      const exam = await storage.getExam(req.params.id);
      if (!exam) {
        return res.status(404).json({ message: 'Exam not found' });
      }

      const questions = await storage.getQuestionsByExam(req.params.id);
      res.json(questions);
    } catch (error) {
      console.error('Get questions error:', error);
      res.status(500).json({ message: 'Failed to fetch questions' });
    }
  });

  app.post('/api/exams/:id/questions', authenticateToken, authorizeRole(['instructor', 'admin']), async (req, res) => {
    try {
      const exam = await storage.getExam(req.params.id);
      if (!exam) {
        return res.status(404).json({ message: 'Exam not found' });
      }

      const { role, userId } = req.user;
      if (role === 'instructor' && exam.instructorId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const questionData = {
        ...req.body,
        examId: req.params.id
      };

      const validation = validateQuestion(questionData);
      if (!validation.isValid) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      const question = await storage.createQuestion(questionData);
      res.status(201).json(question);
    } catch (error) {
      console.error('Create question error:', error);
      res.status(500).json({ message: 'Failed to create question' });
    }
  });

  // Exam assignment
  app.post('/api/exams/:id/assign', authenticateToken, authorizeRole(['instructor', 'admin']), async (req, res) => {
    try {
      const exam = await storage.getExam(req.params.id);
      if (!exam) {
        return res.status(404).json({ message: 'Exam not found' });
      }

      const { studentIds } = req.body;
      if (!Array.isArray(studentIds)) {
        return res.status(400).json({ message: 'studentIds must be an array' });
      }

      const updatedExam = await storage.updateExam(req.params.id, {
        assignedStudents: [...(exam.assignedStudents || []), ...studentIds]
      });

      res.json(updatedExam);
    } catch (error) {
      console.error('Assign exam error:', error);
      res.status(500).json({ message: 'Failed to assign exam' });
    }
  });

  // Attempt routes
  app.post('/api/attempts', authenticateToken, authorizeRole(['student']), async (req, res) => {
    try {
      const { examId } = req.body;
      const { userId } = req.user;

      // Check if student is assigned to this exam
      const exam = await storage.getExam(examId);
      if (!exam || !exam.assignedStudents?.includes(userId)) {
        return res.status(403).json({ message: 'Access denied to this exam' });
      }

      // Check if attempt already exists
      const existingAttempt = await storage.getAttemptByStudentAndExam(userId, examId);
      if (existingAttempt) {
        // Return existing attempt if not submitted
        if (!existingAttempt.submittedAt) {
          const timeElapsed = Math.floor((Date.now() - new Date(existingAttempt.startedAt).getTime()) / 1000);
          const timeRemaining = Math.max(0, (exam.duration * 60) - timeElapsed);
          
          const updatedAttempt = await storage.updateAttempt(existingAttempt.id, { timeRemaining });
          return res.json(updatedAttempt);
        } else {
          return res.status(400).json({ message: 'Exam already completed' });
        }
      }

      // Create new attempt
      const attempt = await storage.createAttempt({
        examId,
        studentId: userId
      });

      // Set initial time remaining
      const timeRemaining = exam.duration * 60; // Convert minutes to seconds
      const updatedAttempt = await storage.updateAttempt(attempt.id, { timeRemaining });

      res.status(201).json(updatedAttempt);
    } catch (error) {
      console.error('Start attempt error:', error);
      res.status(500).json({ message: 'Failed to start attempt' });
    }
  });

  app.put('/api/attempts/:id', authenticateToken, authorizeRole(['student']), async (req, res) => {
    try {
      const { questionId, answer } = req.body;
      const attempt = await storage.getAttempt(req.params.id);
      
      if (!attempt || attempt.studentId !== req.user.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      if (attempt.submittedAt) {
        return res.status(400).json({ message: 'Exam already submitted' });
      }

      // Update answer in attempt
      const updatedAnswers = { ...attempt.answers, [questionId]: answer };
      const updatedAttempt = await storage.updateAttempt(req.params.id, {
        answers: updatedAnswers
      });

      res.json(updatedAttempt);
    } catch (error) {
      console.error('Save answer error:', error);
      res.status(500).json({ message: 'Failed to save answer' });
    }
  });

  app.post('/api/attempts/:id/submit', authenticateToken, authorizeRole(['student']), async (req, res) => {
    try {
      const attempt = await storage.getAttempt(req.params.id);
      
      if (!attempt || attempt.studentId !== req.user.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      if (attempt.submittedAt) {
        return res.status(400).json({ message: 'Exam already submitted' });
      }

      // Get exam and questions for grading
      const exam = await storage.getExam(attempt.examId);
      const questions = await storage.getQuestionsByExam(attempt.examId);

      // Grade the attempt
      let totalScore = 0;
      let maxScore = 0;
      const feedback = {};

      for (const question of questions) {
        maxScore += question.points;
        const userAnswer = attempt.answers[question.id];
        
        if (!userAnswer) {
          feedback[question.id] = {
            score: 0,
            explanation: 'No answer provided'
          };
          continue;
        }

        let questionScore = 0;
        let explanation = '';

        if (question.type === 'multiple_choice' || question.type === 'true_false') {
          if (userAnswer.toLowerCase() === question.correctAnswer?.toLowerCase()) {
            questionScore = question.points;
            explanation = 'Correct answer';
          } else {
            explanation = `Incorrect. Correct answer: ${question.correctAnswer}`;
          }
        } else if (question.type === 'short_answer') {
          // Use AI grading for short answers
          const aiResults = await gradeShortAnswers([{
            qId: question.id,
            value: userAnswer,
            sampleAnswers: question.sampleAnswers || [],
            marks: question.points
          }]);
          
          const aiResult = aiResults.find(r => r.qId === question.id);
          if (aiResult) {
            questionScore = aiResult.score;
            explanation = aiResult.explanation;
          }
        }

        totalScore += questionScore;
        feedback[question.id] = { score: questionScore, explanation };
      }

      // Calculate percentage and grade
      const percentage = Math.round((totalScore / maxScore) * 100);
      let grade = 'F';
      if (percentage >= 90) grade = 'A';
      else if (percentage >= 80) grade = 'B';
      else if (percentage >= 70) grade = 'C';
      else if (percentage >= 60) grade = 'D';

      // Update attempt with results
      const submittedAttempt = await storage.updateAttempt(req.params.id, {
        submittedAt: new Date(),
        score: percentage,
        grade,
        feedback
      });

      res.json(submittedAttempt);
    } catch (error) {
      console.error('Submit attempt error:', error);
      res.status(500).json({ message: 'Failed to submit attempt' });
    }
  });

  // Results routes
  app.get('/api/results/me', authenticateToken, authorizeRole(['student']), async (req, res) => {
    try {
      const attempts = await storage.getAttemptsByStudent(req.user.userId);
      
      // Enhance with exam details
      const results = [];
      for (const attempt of attempts) {
        if (attempt.submittedAt) {
          const exam = await storage.getExam(attempt.examId);
          results.push({
            id: attempt.id,
            examId: attempt.examId,
            examTitle: exam?.title,
            subject: exam?.subject,
            score: attempt.score,
            grade: attempt.grade,
            completedAt: attempt.submittedAt,
            feedback: attempt.feedback
          });
        }
      }

      res.json(results);
    } catch (error) {
      console.error('Get results error:', error);
      res.status(500).json({ message: 'Failed to fetch results' });
    }
  });

  app.get('/api/results/:id', authenticateToken, async (req, res) => {
    try {
      const attempt = await storage.getAttempt(req.params.id);
      if (!attempt) {
        return res.status(404).json({ message: 'Result not found' });
      }

      const { role, userId } = req.user;
      
      // Check permissions
      if (role === 'student' && attempt.studentId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const exam = await storage.getExam(attempt.examId);
      const questions = await storage.getQuestionsByExam(attempt.examId);

      res.json({
        ...attempt,
        exam,
        questions
      });
    } catch (error) {
      console.error('Get result error:', error);
      res.status(500).json({ message: 'Failed to fetch result' });
    }
  });

  // Admin routes
  app.get('/api/admin/reports', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const exams = await storage.getAllExams();
      
      const stats = {
        totalUsers: users.length,
        students: users.filter(u => u.role === 'student').length,
        instructors: users.filter(u => u.role === 'instructor').length,
        admins: users.filter(u => u.role === 'admin').length,
        totalExams: exams.length,
        activeExams: exams.filter(e => e.status === 'active').length,
        draftExams: exams.filter(e => e.status === 'draft').length,
      };

      res.json(stats);
    } catch (error) {
      console.error('Get admin reports error:', error);
      res.status(500).json({ message: 'Failed to fetch reports' });
    }
  });

  app.get('/api/admin/users', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // AI Grading endpoint
  app.post('/api/ai/grade', authenticateToken, async (req, res) => {
    try {
      const { items } = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ message: 'Items must be an array' });
      }

      const results = await gradeShortAnswers(items);
      res.json(results);
    } catch (error) {
      console.error('AI grading error:', error);
      res.status(500).json({ message: 'Failed to grade answers' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
