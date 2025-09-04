import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("student"), // student, instructor, admin
  createdAt: timestamp("created_at").defaultNow(),
});

export const exams = pgTable("exams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  description: text("description"),
  duration: integer("duration").notNull(), // in minutes
  totalMarks: integer("total_marks").notNull(),
  status: text("status").notNull().default("draft"), // draft, active, completed
  instructorId: varchar("instructor_id").notNull(),
  assignedStudents: text("assigned_students").array(), // array of student IDs
  scheduledDate: timestamp("scheduled_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  examId: varchar("exam_id").notNull(),
  type: text("type").notNull(), // multiple_choice, true_false, short_answer
  text: text("text").notNull(),
  description: text("description"),
  options: text("options").array(), // for multiple choice
  correctAnswer: text("correct_answer"),
  sampleAnswers: text("sample_answers").array(), // for AI grading
  points: integer("points").notNull().default(1),
  order: integer("order").notNull(),
});

export const attempts = pgTable("attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  examId: varchar("exam_id").notNull(),
  studentId: varchar("student_id").notNull(),
  answers: jsonb("answers").notNull().default({}), // questionId -> answer mapping
  markedQuestions: text("marked_questions").array().default([]),
  startedAt: timestamp("started_at").defaultNow(),
  submittedAt: timestamp("submitted_at"),
  timeRemaining: integer("time_remaining"), // in seconds
  score: integer("score"),
  grade: text("grade"),
  feedback: jsonb("feedback"), // per-question feedback
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  name: true,
  role: true,
});

export const insertExamSchema = createInsertSchema(exams).pick({
  title: true,
  subject: true,
  description: true,
  duration: true,
  totalMarks: true,
  instructorId: true,
  scheduledDate: true,
});

export const insertQuestionSchema = createInsertSchema(questions).pick({
  examId: true,
  type: true,
  text: true,
  description: true,
  options: true,
  correctAnswer: true,
  sampleAnswers: true,
  points: true,
  order: true,
});

export const insertAttemptSchema = createInsertSchema(attempts).pick({
  examId: true,
  studentId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertExam = z.infer<typeof insertExamSchema>;
export type Exam = typeof exams.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertAttempt = z.infer<typeof insertAttemptSchema>;
export type Attempt = typeof attempts.$inferSelect;
