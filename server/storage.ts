import { 
  type User, 
  type InsertUser, 
  type Exam, 
  type InsertExam,
  type Question,
  type InsertQuestion,
  type Attempt,
  type InsertAttempt
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;

  // Exams
  getExam(id: string): Promise<Exam | undefined>;
  createExam(exam: InsertExam): Promise<Exam>;
  updateExam(id: string, exam: Partial<Exam>): Promise<Exam | undefined>;
  deleteExam(id: string): Promise<boolean>;
  getExamsByInstructor(instructorId: string): Promise<Exam[]>;
  getExamsForStudent(studentId: string): Promise<Exam[]>;
  getAllExams(): Promise<Exam[]>;

  // Questions
  getQuestion(id: string): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: string, question: Partial<Question>): Promise<Question | undefined>;
  deleteQuestion(id: string): Promise<boolean>;
  getQuestionsByExam(examId: string): Promise<Question[]>;

  // Attempts
  getAttempt(id: string): Promise<Attempt | undefined>;
  createAttempt(attempt: InsertAttempt): Promise<Attempt>;
  updateAttempt(id: string, attempt: Partial<Attempt>): Promise<Attempt | undefined>;
  getAttemptsByStudent(studentId: string): Promise<Attempt[]>;
  getAttemptsByExam(examId: string): Promise<Attempt[]>;
  getAttemptByStudentAndExam(studentId: string, examId: string): Promise<Attempt | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private exams: Map<string, Exam>;
  private questions: Map<string, Question>;
  private attempts: Map<string, Attempt>;

  constructor() {
    this.users = new Map();
    this.exams = new Map();
    this.questions = new Map();
    this.attempts = new Map();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === role);
  }

  // Exams
  async getExam(id: string): Promise<Exam | undefined> {
    return this.exams.get(id);
  }

  async createExam(insertExam: InsertExam): Promise<Exam> {
    const id = randomUUID();
    const exam: Exam = {
      ...insertExam,
      id,
      status: 'draft',
      assignedStudents: [],
      createdAt: new Date(),
    };
    this.exams.set(id, exam);
    return exam;
  }

  async updateExam(id: string, examData: Partial<Exam>): Promise<Exam | undefined> {
    const exam = this.exams.get(id);
    if (!exam) return undefined;
    
    const updatedExam = { ...exam, ...examData };
    this.exams.set(id, updatedExam);
    return updatedExam;
  }

  async deleteExam(id: string): Promise<boolean> {
    return this.exams.delete(id);
  }

  async getExamsByInstructor(instructorId: string): Promise<Exam[]> {
    return Array.from(this.exams.values()).filter(exam => exam.instructorId === instructorId);
  }

  async getExamsForStudent(studentId: string): Promise<Exam[]> {
    return Array.from(this.exams.values()).filter(exam => 
      exam.assignedStudents?.includes(studentId) && exam.status === 'active'
    );
  }

  async getAllExams(): Promise<Exam[]> {
    return Array.from(this.exams.values());
  }

  // Questions
  async getQuestion(id: string): Promise<Question | undefined> {
    return this.questions.get(id);
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = randomUUID();
    const question: Question = {
      ...insertQuestion,
      id,
    };
    this.questions.set(id, question);
    return question;
  }

  async updateQuestion(id: string, questionData: Partial<Question>): Promise<Question | undefined> {
    const question = this.questions.get(id);
    if (!question) return undefined;
    
    const updatedQuestion = { ...question, ...questionData };
    this.questions.set(id, updatedQuestion);
    return updatedQuestion;
  }

  async deleteQuestion(id: string): Promise<boolean> {
    return this.questions.delete(id);
  }

  async getQuestionsByExam(examId: string): Promise<Question[]> {
    return Array.from(this.questions.values())
      .filter(question => question.examId === examId)
      .sort((a, b) => a.order - b.order);
  }

  // Attempts
  async getAttempt(id: string): Promise<Attempt | undefined> {
    return this.attempts.get(id);
  }

  async createAttempt(insertAttempt: InsertAttempt): Promise<Attempt> {
    const id = randomUUID();
    const attempt: Attempt = {
      ...insertAttempt,
      id,
      answers: {},
      markedQuestions: [],
      startedAt: new Date(),
      submittedAt: null,
      timeRemaining: null,
      score: null,
      grade: null,
      feedback: null,
    };
    this.attempts.set(id, attempt);
    return attempt;
  }

  async updateAttempt(id: string, attemptData: Partial<Attempt>): Promise<Attempt | undefined> {
    const attempt = this.attempts.get(id);
    if (!attempt) return undefined;
    
    const updatedAttempt = { ...attempt, ...attemptData };
    this.attempts.set(id, updatedAttempt);
    return updatedAttempt;
  }

  async getAttemptsByStudent(studentId: string): Promise<Attempt[]> {
    return Array.from(this.attempts.values())
      .filter(attempt => attempt.studentId === studentId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }

  async getAttemptsByExam(examId: string): Promise<Attempt[]> {
    return Array.from(this.attempts.values()).filter(attempt => attempt.examId === examId);
  }

  async getAttemptByStudentAndExam(studentId: string, examId: string): Promise<Attempt | undefined> {
    return Array.from(this.attempts.values()).find(
      attempt => attempt.studentId === studentId && attempt.examId === examId
    );
  }
}

export const storage = new MemStorage();
