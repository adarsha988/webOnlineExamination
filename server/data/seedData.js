import { storage } from '../storage.js';
import bcrypt from 'bcrypt';

// Seed data for demo purposes
const seedUsers = [
  {
    email: 'admin@example.com',
    password: 'admin123',
    name: 'System Administrator',
    role: 'admin'
  },
  {
    email: 'inst@example.com',
    password: 'inst123',
    name: 'Dr. Michael Chen',
    role: 'instructor'
  },
  {
    email: 'stu1@example.com',
    password: 'stu123',
    name: 'John Doe',
    role: 'student'
  },
  {
    email: 'stu2@example.com',
    password: 'stu123',
    name: 'Sarah Johnson',
    role: 'student'
  }
];

// Sample exam data
const createSampleExam = async (instructorId, studentIds) => {
  // Create exam
  const exam = await storage.createExam({
    title: 'Mathematics Final Exam',
    subject: 'Advanced Calculus',
    description: 'Comprehensive final exam covering integration, differentiation, and series.',
    duration: 120, // 2 hours
    totalMarks: 100,
    instructorId: instructorId,
    scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
  });

  // Update exam to be active and assign students
  await storage.updateExam(exam.id, {
    status: 'active',
    assignedStudents: studentIds
  });

  // Add sample questions
  const questions = [
    {
      examId: exam.id,
      type: 'multiple_choice',
      text: 'What is the derivative of f(x) = 3x² + 2x - 1?',
      description: 'Apply the power rule to find the derivative.',
      options: ['6x + 2', '3x + 2', '6x² + 2x', '9x + 2'],
      correctAnswer: '6x + 2',
      points: 5,
      order: 1
    },
    {
      examId: exam.id,
      type: 'true_false',
      text: 'The integral of a constant function is always zero.',
      description: 'Consider the fundamental theorem of calculus.',
      correctAnswer: 'false',
      points: 3,
      order: 2
    },
    {
      examId: exam.id,
      type: 'short_answer',
      text: 'Solve the definite integral: ∫₀² (3x² + 2x - 1) dx',
      description: 'Show your work step by step and provide the exact numerical answer.',
      sampleAnswers: [
        '(x³ + x² - x) evaluated from 0 to 2 = 8 + 4 - 2 = 10',
        '10',
        'ten',
        '(8 + 4 - 2) - (0) = 10'
      ],
      points: 8,
      order: 3
    },
    {
      examId: exam.id,
      type: 'multiple_choice',
      text: 'Which of the following represents the chain rule?',
      description: 'Select the correct mathematical expression.',
      options: [
        '(f ∘ g)\'(x) = f\'(g(x)) · g\'(x)',
        '(f ∘ g)\'(x) = f\'(x) · g\'(x)',
        '(f ∘ g)\'(x) = f(g\'(x))',
        '(f ∘ g)\'(x) = f\'(x) + g\'(x)'
      ],
      correctAnswer: '(f ∘ g)\'(x) = f\'(g(x)) · g\'(x)',
      points: 4,
      order: 4
    },
    {
      examId: exam.id,
      type: 'short_answer',
      text: 'Explain the geometric interpretation of the derivative at a point.',
      description: 'Provide a clear explanation in 2-3 sentences.',
      sampleAnswers: [
        'The derivative at a point represents the slope of the tangent line to the curve at that point',
        'It gives the instantaneous rate of change of the function at that specific point',
        'Geometrically, it is the slope of the line that just touches the curve at one point'
      ],
      points: 6,
      order: 5
    }
  ];

  for (const questionData of questions) {
    await storage.createQuestion(questionData);
  }

  return { exam, questions };
};

// Create sample attempt and result for demo
const createSampleResult = async (examId, studentId, questions) => {
  const attempt = await storage.createAttempt({
    examId: examId,
    studentId: studentId
  });

  // Simulate completed attempt with answers
  const answers = {};
  const feedback = {};
  let totalScore = 0;
  
  // Create realistic answers for each question
  questions.forEach((question, index) => {
    let answer, score, explanation;
    
    switch (question.type) {
      case 'multiple_choice':
        if (index === 0) { // First MCQ - correct
          answer = question.correctAnswer;
          score = question.points;
          explanation = 'Correct! Well done applying the power rule.';
        } else { // Second MCQ - incorrect
          answer = question.options?.find(opt => opt !== question.correctAnswer) || 'Wrong answer';
          score = 0;
          explanation = `Incorrect. The correct answer is: ${question.correctAnswer}`;
        }
        break;
        
      case 'true_false':
        answer = question.correctAnswer;
        score = question.points;
        explanation = 'Correct! The integral of a constant is the constant times x plus C.';
        break;
        
      case 'short_answer':
        if (question.text.includes('integral')) {
          answer = 'The integral equals (x³ + x² - x) evaluated from 0 to 2 = 8 + 4 - 2 = 10';
          score = Math.floor(question.points * 0.9); // 90% score
          explanation = 'Excellent work! Correct setup and calculation.';
        } else {
          answer = 'The derivative represents the slope of the tangent line at a point on the curve';
          score = Math.floor(question.points * 0.8); // 80% score  
          explanation = 'Good explanation of the geometric interpretation. Could be more detailed.';
        }
        break;
    }
    
    answers[question.id] = answer;
    feedback[question.id] = { score, explanation };
    totalScore += score;
  });

  const maxScore = questions.reduce((sum, q) => sum + q.points, 0);
  const percentage = Math.round((totalScore / maxScore) * 100);
  
  let grade = 'F';
  if (percentage >= 90) grade = 'A';
  else if (percentage >= 80) grade = 'B';
  else if (percentage >= 70) grade = 'C';
  else if (percentage >= 60) grade = 'D';

  await storage.updateAttempt(attempt.id, {
    answers: answers,
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    score: percentage,
    grade: grade,
    feedback: feedback
  });

  return attempt;
};

// Main seed function
export async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Create users
    console.log('Creating users...');
    const createdUsers = [];
    for (const userData of seedUsers) {
      const existingUser = await storage.getUserByEmail(userData.email);
      if (!existingUser) {
        // Hash the password before creating user
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
        const userWithHashedPassword = { ...userData, password: hashedPassword };
        
        const user = await storage.createUser(userWithHashedPassword);
        createdUsers.push(user);
        console.log(`✅ Created user: ${user.name} (${user.role})`);
      } else {
        createdUsers.push(existingUser);
        console.log(`⏭️  User already exists: ${existingUser.name} (${existingUser.role})`);
      }
    }

    // Find users by role
    const instructor = createdUsers.find(u => u.role === 'instructor');
    const students = createdUsers.filter(u => u.role === 'student');

    if (!instructor || students.length === 0) {
      console.log('❌ Missing instructor or students, skipping exam creation');
      return;
    }

    // Create sample exam
    console.log('Creating sample exam...');
    const studentIds = students.map(s => s.id);
    const { exam, questions } = await createSampleExam(instructor.id, studentIds);
    console.log(`✅ Created exam: ${exam.title} with ${questions.length} questions`);

    // Create sample results for first student
    console.log('Creating sample result...');
    const sampleResult = await createSampleResult(exam.id, students[0].id, questions);
    console.log(`✅ Created sample result for ${students[0].name}`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Demo Accounts:');
    console.log('Admin: admin@example.com / admin123');
    console.log('Instructor: inst@example.com / inst123'); 
    console.log('Student 1: stu1@example.com / stu123');
    console.log('Student 2: stu2@example.com / stu123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Auto-seed on first startup
export async function autoSeed() {
  try {
    const users = await storage.getAllUsers();
    if (users.length === 0) {
      console.log('🔍 No users found, running auto-seed...');
      await seedDatabase();
    } else {
      console.log('📊 Database already has data, skipping auto-seed');
    }
  } catch (error) {
    console.error('❌ Auto-seed failed:', error);
  }
}
