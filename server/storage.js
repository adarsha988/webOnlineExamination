import { createUser, createExam, createQuestion, createAttempt } from "../shared/schema.js";

export class MemStorage {
  constructor() {
    this.users = new Map();
    this.exams = new Map();
    this.questions = new Map();
    this.attempts = new Map();
  }

  // Users
  async getUser(id) {
    return this.users.get(id);
  }

  async getUserByEmail(email) {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser) {
    const user = createUser(insertUser);
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id, userData) {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id) {
    return this.users.delete(id);
  }

  async getAllUsers() {
    return Array.from(this.users.values());
  }

  async getUsersByRole(role) {
    return Array.from(this.users.values()).filter(user => user.role === role);
  }

  // Exams
  async getExam(id) {
    return this.exams.get(id);
  }

  async createExam(insertExam) {
    const exam = createExam(insertExam);
    this.exams.set(exam.id, exam);
    return exam;
  }

  async updateExam(id, examData) {
    const exam = this.exams.get(id);
    if (!exam) return undefined;
    
    const updatedExam = { ...exam, ...examData };
    this.exams.set(id, updatedExam);
    return updatedExam;
  }

  async deleteExam(id) {
    return this.exams.delete(id);
  }

  async getExamsByInstructor(instructorId) {
    return Array.from(this.exams.values()).filter(exam => exam.instructorId === instructorId);
  }

  async getExamsForStudent(studentId) {
    return Array.from(this.exams.values()).filter(exam => 
      exam.assignedStudents?.includes(studentId) && exam.status === 'active'
    );
  }

  async getAllExams() {
    return Array.from(this.exams.values());
  }

  // Questions
  async getQuestion(id) {
    return this.questions.get(id);
  }

  async createQuestion(insertQuestion) {
    const question = createQuestion(insertQuestion);
    this.questions.set(question.id, question);
    return question;
  }

  async updateQuestion(id, questionData) {
    const question = this.questions.get(id);
    if (!question) return undefined;
    
    const updatedQuestion = { ...question, ...questionData };
    this.questions.set(id, updatedQuestion);
    return updatedQuestion;
  }

  async deleteQuestion(id) {
    return this.questions.delete(id);
  }

  async getQuestionsByExam(examId) {
    return Array.from(this.questions.values())
      .filter(question => question.examId === examId)
      .sort((a, b) => a.order - b.order);
  }

  // Attempts
  async getAttempt(id) {
    return this.attempts.get(id);
  }

  async createAttempt(insertAttempt) {
    const attempt = createAttempt(insertAttempt);
    this.attempts.set(attempt.id, attempt);
    return attempt;
  }

  async updateAttempt(id, attemptData) {
    const attempt = this.attempts.get(id);
    if (!attempt) return undefined;
    
    const updatedAttempt = { ...attempt, ...attemptData };
    this.attempts.set(id, updatedAttempt);
    return updatedAttempt;
  }

  async getAttemptsByStudent(studentId) {
    return Array.from(this.attempts.values())
      .filter(attempt => attempt.studentId === studentId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }

  async getAttemptsByExam(examId) {
    return Array.from(this.attempts.values()).filter(attempt => attempt.examId === examId);
  }

  async getAttemptByStudentAndExam(studentId, examId) {
    return Array.from(this.attempts.values()).find(
      attempt => attempt.studentId === studentId && attempt.examId === examId
    );
  }
}

export const storage = new MemStorage();
