import express from 'express';
const router = express.Router();
import Quiz from '../models/quiz.model.js';

// GET /api/quiz - Fetch all quiz questions
router.get('/', async (req, res) => {
  try {
    const quizzes = await Quiz.find().sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching quiz questions', error: error.message });
  }
});

// POST /api/quiz - Add new quiz question
router.post('/', async (req, res) => {
  try {
    const { question, options, correctAnswer } = req.body;
    
    if (!question || !options || options.length < 2 || correctAnswer === undefined) {
      return res.status(400).json({ 
        message: 'Question, options (minimum 2), and correctAnswer are required' 
      });
    }

    if (correctAnswer < 0 || correctAnswer >= options.length) {
      return res.status(400).json({ 
        message: 'correctAnswer must be a valid index of options array' 
      });
    }

    const newQuiz = new Quiz({
      question,
      options,
      correctAnswer
    });

    const savedQuiz = await newQuiz.save();
    res.status(201).json(savedQuiz);
  } catch (error) {
    res.status(500).json({ message: 'Error creating quiz question', error: error.message });
  }
});

// GET /api/quiz/:id - Get specific quiz question
router.get('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz question not found' });
    }
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching quiz question', error: error.message });
  }
});

export default router;
