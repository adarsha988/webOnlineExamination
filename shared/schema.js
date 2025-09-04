import { randomUUID } from "crypto";

// User schema and types
export const createUser = (userData) => ({
  id: randomUUID(),
  email: userData.email,
  password: userData.password,
  name: userData.name,
  role: userData.role || "student",
  createdAt: new Date(),
});

// Exam schema and types
export const createExam = (examData) => ({
  id: randomUUID(),
  title: examData.title,
  subject: examData.subject,
  description: examData.description || null,
  duration: examData.duration, // in minutes
  totalMarks: examData.totalMarks,
  status: examData.status || "draft", // draft, active, completed
  instructorId: examData.instructorId,
  assignedStudents: examData.assignedStudents || [], // array of student IDs
  scheduledDate: examData.scheduledDate || null,
  createdAt: new Date(),
});

// Question schema and types
export const createQuestion = (questionData) => ({
  id: randomUUID(),
  examId: questionData.examId,
  type: questionData.type, // multiple_choice, true_false, short_answer
  text: questionData.text,
  description: questionData.description || null,
  options: questionData.options || [], // for multiple choice
  correctAnswer: questionData.correctAnswer || null,
  sampleAnswers: questionData.sampleAnswers || [], // for AI grading
  points: questionData.points || 1,
  order: questionData.order,
});

// Attempt schema and types
export const createAttempt = (attemptData) => ({
  id: randomUUID(),
  examId: attemptData.examId,
  studentId: attemptData.studentId,
  answers: attemptData.answers || {}, // questionId -> answer mapping
  markedQuestions: attemptData.markedQuestions || [],
  startedAt: new Date(),
  submittedAt: attemptData.submittedAt || null,
  timeRemaining: attemptData.timeRemaining || null, // in seconds
  score: attemptData.score || null,
  grade: attemptData.grade || null,
  feedback: attemptData.feedback || null, // per-question feedback
});

// Validation functions
export const validateUser = (userData) => {
  const errors = {};
  
  if (!userData.email || !userData.email.includes('@')) {
    errors.email = 'Valid email is required';
  }
  
  if (!userData.password || userData.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }
  
  if (!userData.name || userData.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }
  
  if (userData.role && !['student', 'instructor', 'admin'].includes(userData.role)) {
    errors.role = 'Invalid role specified';
  }
  
  return { errors, isValid: Object.keys(errors).length === 0 };
};

export const validateExam = (examData) => {
  const errors = {};
  
  if (!examData.title || examData.title.trim().length < 3) {
    errors.title = 'Title must be at least 3 characters';
  }
  
  if (!examData.subject || examData.subject.trim().length < 2) {
    errors.subject = 'Subject is required';
  }
  
  if (!examData.duration || examData.duration < 5 || examData.duration > 480) {
    errors.duration = 'Duration must be between 5 and 480 minutes';
  }
  
  if (!examData.totalMarks || examData.totalMarks < 1) {
    errors.totalMarks = 'Total marks must be at least 1';
  }
  
  if (!examData.instructorId) {
    errors.instructorId = 'Instructor ID is required';
  }
  
  return { errors, isValid: Object.keys(errors).length === 0 };
};

export const validateQuestion = (questionData) => {
  const errors = {};
  
  if (!questionData.examId) {
    errors.examId = 'Exam ID is required';
  }
  
  if (!questionData.type || !['multiple_choice', 'true_false', 'short_answer'].includes(questionData.type)) {
    errors.type = 'Valid question type is required';
  }
  
  if (!questionData.text || questionData.text.trim().length < 10) {
    errors.text = 'Question text must be at least 10 characters';
  }
  
  if (questionData.type === 'multiple_choice') {
    if (!questionData.options || questionData.options.length < 2) {
      errors.options = 'At least 2 options are required for multiple choice';
    }
    if (!questionData.correctAnswer) {
      errors.correctAnswer = 'Correct answer is required for multiple choice';
    }
  }
  
  if (questionData.type === 'true_false') {
    if (!questionData.correctAnswer || !['true', 'false'].includes(questionData.correctAnswer)) {
      errors.correctAnswer = 'Correct answer must be true or false';
    }
  }
  
  if (!questionData.points || questionData.points < 1) {
    errors.points = 'Points must be at least 1';
  }
  
  return { errors, isValid: Object.keys(errors).length === 0 };
};
