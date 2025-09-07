import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/user.model.js';
import Department from '../models/department.model.js';
import Exam from '../models/exam.model.js';
import Question from '../models/question.model.js';
import StudentExam from '../models/studentExam.model.js';
import Notification from '../models/notification.model.js';
import Activity from '../models/activity.model.js';
import SharedBank from '../models/sharedBank.model.js';

export async function seedComprehensiveData() {
  try {
    console.log('🌱 Starting comprehensive data seeding...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      Exam.deleteMany({}),
      Question.deleteMany({}),
      StudentExam.deleteMany({}),
      Notification.deleteMany({}),
      Activity.deleteMany({}),
      SharedBank.deleteMany({})
    ]);

    console.log('🗑️ Cleared existing data');

    // 1. Create Departments
    const departments = await Department.insertMany([
      {
        name: 'Computer Science',
        code: 'CS',
        description: 'Department of Computer Science and Engineering',
        subjects: [
          { name: 'Data Structures', code: 'CS201', credits: 4, semester: 3 },
          { name: 'Algorithms', code: 'CS301', credits: 4, semester: 5 },
          { name: 'Database Systems', code: 'CS302', credits: 3, semester: 5 },
          { name: 'Web Development', code: 'CS401', credits: 3, semester: 7 }
        ],
        establishedYear: 1995,
        contactInfo: {
          email: 'cs@university.edu',
          phone: '+1-555-0101',
          office: 'Building A, Floor 3'
        }
      },
      {
        name: 'Mathematics',
        code: 'MATH',
        description: 'Department of Mathematics',
        subjects: [
          { name: 'Calculus I', code: 'MATH101', credits: 4, semester: 1 },
          { name: 'Linear Algebra', code: 'MATH201', credits: 3, semester: 3 },
          { name: 'Statistics', code: 'MATH301', credits: 3, semester: 5 }
        ],
        establishedYear: 1980,
        contactInfo: {
          email: 'math@university.edu',
          phone: '+1-555-0102',
          office: 'Building B, Floor 2'
        }
      },
      {
        name: 'Physics',
        code: 'PHY',
        description: 'Department of Physics',
        subjects: [
          { name: 'Classical Mechanics', code: 'PHY101', credits: 4, semester: 1 },
          { name: 'Quantum Physics', code: 'PHY301', credits: 4, semester: 5 }
        ],
        establishedYear: 1975,
        contactInfo: {
          email: 'physics@university.edu',
          phone: '+1-555-0103',
          office: 'Building C, Floor 1'
        }
      }
    ]);

    console.log('🏢 Created departments');

    // 2. Create Users with proper password hashing
    const saltRounds = 10;
    const defaultPassword = await bcrypt.hash('password123', saltRounds);

    // Create Admin
    const admin = await User.create({
      name: 'Alice',
      email: 'alice@admin.com',
      password: defaultPassword,
      role: 'admin',
      status: 'active',
      profile: {
        phone: '+1-555-0001',
        address: 'Admin Office, Main Building'
      }
    });

    // Create Instructors
    const instructors = await User.insertMany([
      {
        name: 'Dr. John',
        email: 'john@university.edu',
        password: defaultPassword,
        role: 'instructor',
        status: 'active',
        profile: {
          phone: '+1-555-0201',
          address: 'Math Department, Room 201',
          specialization: 'Mathematics',
          experience: 12
        }
      },
      {
        name: 'Dr. Sarah',
        email: 'sarah@university.edu',
        password: defaultPassword,
        role: 'instructor',
        status: 'active',
        profile: {
          phone: '+1-555-0202',
          address: 'CS Department, Room 301',
          specialization: 'Computer Science',
          experience: 8
        }
      }
    ]);

    // Create Students
    const students = await User.insertMany([
      {
        name: 'Bob',
        email: 'bob@student.edu',
        password: defaultPassword,
        role: 'student',
        status: 'active',
        profile: {
          phone: '+1-555-1001',
          studentId: 'STU2021001',
          semester: 6,
          gpa: 3.2
        }
      },
      {
        name: 'Emma',
        email: 'emma@student.edu',
        password: defaultPassword,
        role: 'student',
        status: 'active',
        profile: {
          phone: '+1-555-1002',
          studentId: 'STU2021002',
          semester: 6,
          gpa: 3.5
        }
      },
      {
        name: 'Liam',
        email: 'liam@student.edu',
        password: defaultPassword,
        role: 'student',
        status: 'active',
        profile: {
          phone: '+1-555-1003',
          studentId: 'STU2021003',
          semester: 4,
          gpa: 3.8
        }
      },
      {
        name: 'Sophia',
        email: 'sophia@student.edu',
        password: defaultPassword,
        role: 'student',
        status: 'active',
        profile: {
          phone: '+1-555-1004',
          studentId: 'STU2021004',
          semester: 4,
          gpa: 2.9
        }
      },
      {
        name: 'Noah',
        email: 'noah@student.edu',
        password: defaultPassword,
        role: 'student',
        status: 'active',
        profile: {
          phone: '+1-555-1005',
          studentId: 'STU2021005',
          semester: 6,
          gpa: 3.1
        }
      }
    ]);

    console.log('👥 Created users');

    // 3. Update Departments with users
    await Department.findByIdAndUpdate(departments[0]._id, {
      headOfDepartment: instructors[0]._id,
      instructors: [instructors[0]._id],
      students: [students[0]._id, students[1]._id, students[4]._id]
    });

    await Department.findByIdAndUpdate(departments[1]._id, {
      headOfDepartment: instructors[1]._id,
      instructors: [instructors[1]._id],
      students: [students[2]._id]
    });

    await Department.findByIdAndUpdate(departments[2]._id, {
      headOfDepartment: instructors[1]._id,
      instructors: [instructors[1]._id],
      students: [students[3]._id]
    });

    // 4. Create Questions (20 total: 10 shared, 10 instructor-owned)
    const questions = await Question.insertMany([
      // Shared Questions (10)
      {
        questionText: 'What is 12 × 8?',
        type: 'mcq',
        options: ['94', '95', '96', '97'],
        correctAnswer: '96',
        marks: 2,
        difficulty: 'easy',
        subject: 'Mathematics',
        scope: 'shared',
        createdBy: instructors[0]._id,
        tags: ['arithmetic', 'multiplication']
      },
      {
        questionText: 'Which data structure uses FIFO?',
        type: 'mcq',
        options: ['Stack', 'Queue', 'Array', 'Tree'],
        correctAnswer: 'Queue',
        marks: 2,
        difficulty: 'easy',
        subject: 'Computer Science',
        scope: 'shared',
        createdBy: instructors[1]._id,
        tags: ['data-structures', 'queue']
      },
      {
        questionText: 'What is 15 + 27?',
        type: 'mcq',
        options: ['41', '42', '43', '44'],
        correctAnswer: '42',
        marks: 1,
        difficulty: 'easy',
        subject: 'Mathematics',
        scope: 'shared',
        createdBy: instructors[0]._id,
        tags: ['arithmetic', 'addition']
      },
      {
        questionText: 'What does HTML stand for?',
        type: 'mcq',
        options: ['HyperText Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlink and Text Markup Language'],
        correctAnswer: 'HyperText Markup Language',
        marks: 2,
        difficulty: 'easy',
        subject: 'Computer Science',
        scope: 'shared',
        createdBy: instructors[1]._id,
        tags: ['web', 'html']
      },
      {
        questionText: 'What is the square root of 64?',
        type: 'mcq',
        options: ['6', '7', '8', '9'],
        correctAnswer: '8',
        marks: 2,
        difficulty: 'easy',
        subject: 'Mathematics',
        scope: 'shared',
        createdBy: instructors[0]._id,
        tags: ['algebra', 'square-root']
      },
      {
        questionText: 'Which programming language is known for web development?',
        type: 'mcq',
        options: ['C++', 'Java', 'JavaScript', 'Python'],
        correctAnswer: 'JavaScript',
        marks: 2,
        difficulty: 'easy',
        subject: 'Computer Science',
        scope: 'shared',
        createdBy: instructors[1]._id,
        tags: ['programming', 'web']
      },
      {
        questionText: 'What is 9 × 7?',
        type: 'mcq',
        options: ['61', '62', '63', '64'],
        correctAnswer: '63',
        marks: 2,
        difficulty: 'easy',
        subject: 'Mathematics',
        scope: 'shared',
        createdBy: instructors[0]._id,
        tags: ['arithmetic', 'multiplication']
      },
      {
        questionText: 'What does CSS stand for?',
        type: 'mcq',
        options: ['Computer Style Sheets', 'Cascading Style Sheets', 'Creative Style Sheets', 'Colorful Style Sheets'],
        correctAnswer: 'Cascading Style Sheets',
        marks: 2,
        difficulty: 'easy',
        subject: 'Computer Science',
        scope: 'shared',
        createdBy: instructors[1]._id,
        tags: ['web', 'css']
      },
      {
        questionText: 'What is 100 ÷ 4?',
        type: 'mcq',
        options: ['23', '24', '25', '26'],
        correctAnswer: '25',
        marks: 2,
        difficulty: 'easy',
        subject: 'Mathematics',
        scope: 'shared',
        createdBy: instructors[0]._id,
        tags: ['arithmetic', 'division']
      },
      {
        questionText: 'Which of these is a programming loop?',
        type: 'mcq',
        options: ['for', 'if', 'class', 'import'],
        correctAnswer: 'for',
        marks: 2,
        difficulty: 'easy',
        subject: 'Computer Science',
        scope: 'shared',
        createdBy: instructors[1]._id,
        tags: ['programming', 'loops']
      },
      // Dr. John's Math Questions (5)
      {
        questionText: 'What is the area of a triangle with base 10 and height 6?',
        type: 'mcq',
        options: ['28', '30', '32', '34'],
        correctAnswer: '30',
        marks: 3,
        difficulty: 'medium',
        subject: 'Mathematics',
        scope: 'private',
        createdBy: instructors[0]._id,
        tags: ['geometry', 'area']
      },
      {
        questionText: 'Solve for x: 2x + 5 = 15',
        type: 'mcq',
        options: ['3', '4', '5', '6'],
        correctAnswer: '5',
        marks: 3,
        difficulty: 'medium',
        subject: 'Mathematics',
        scope: 'private',
        createdBy: instructors[0]._id,
        tags: ['algebra', 'equations']
      },
      {
        questionText: 'What is the perimeter of a rectangle with length 8 and width 5?',
        type: 'mcq',
        options: ['24', '26', '28', '30'],
        correctAnswer: '26',
        marks: 2,
        difficulty: 'medium',
        subject: 'Mathematics',
        scope: 'private',
        createdBy: instructors[0]._id,
        tags: ['geometry', 'perimeter']
      },
      {
        questionText: 'What is 3² + 4²?',
        type: 'mcq',
        options: ['23', '24', '25', '26'],
        correctAnswer: '25',
        marks: 2,
        difficulty: 'medium',
        subject: 'Mathematics',
        scope: 'private',
        createdBy: instructors[0]._id,
        tags: ['algebra', 'exponents']
      },
      {
        questionText: 'If a circle has radius 3, what is its area? (Use π ≈ 3.14)',
        type: 'mcq',
        options: ['28.26', '28.27', '28.28', '28.29'],
        correctAnswer: '28.26',
        marks: 3,
        difficulty: 'medium',
        subject: 'Mathematics',
        scope: 'private',
        createdBy: instructors[0]._id,
        tags: ['geometry', 'circle', 'area']
      },
      // Dr. Sarah's CS Questions (5)
      {
        questionText: 'What is the time complexity of binary search?',
        type: 'mcq',
        options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
        correctAnswer: 'O(log n)',
        marks: 3,
        difficulty: 'medium',
        subject: 'Computer Science',
        scope: 'private',
        createdBy: instructors[1]._id,
        tags: ['algorithms', 'complexity']
      },
      {
        questionText: 'Which data structure uses LIFO principle?',
        type: 'mcq',
        options: ['Queue', 'Stack', 'Array', 'Tree'],
        correctAnswer: 'Stack',
        marks: 2,
        difficulty: 'easy',
        subject: 'Computer Science',
        scope: 'private',
        createdBy: instructors[1]._id,
        tags: ['data-structures', 'stack']
      },
      {
        questionText: 'What does SQL stand for?',
        type: 'mcq',
        options: ['Structured Query Language', 'Simple Query Language', 'Standard Query Language', 'System Query Language'],
        correctAnswer: 'Structured Query Language',
        marks: 2,
        difficulty: 'easy',
        subject: 'Computer Science',
        scope: 'private',
        createdBy: instructors[1]._id,
        tags: ['database', 'sql']
      },
      {
        questionText: 'Which sorting algorithm has O(n log n) average time complexity?',
        type: 'mcq',
        options: ['Bubble Sort', 'Selection Sort', 'Merge Sort', 'Insertion Sort'],
        correctAnswer: 'Merge Sort',
        marks: 3,
        difficulty: 'hard',
        subject: 'Computer Science',
        scope: 'private',
        createdBy: instructors[1]._id,
        tags: ['algorithms', 'sorting']
      },
      {
        questionText: 'What is the main purpose of a constructor in OOP?',
        type: 'mcq',
        options: ['To destroy objects', 'To initialize objects', 'To copy objects', 'To compare objects'],
        correctAnswer: 'To initialize objects',
        marks: 2,
        difficulty: 'medium',
        subject: 'Computer Science',
        scope: 'private',
        createdBy: instructors[1]._id,
        tags: ['oop', 'constructor']
      }
    ]);

    console.log('❓ Created questions');

    // 5. Create Shared Banks
    const sharedBanks = await SharedBank.insertMany([
      {
        name: 'Computer Science Fundamentals',
        description: 'Basic CS concepts and data structures',
        subject: 'Computer Science',
        owners: [instructors[0]._id],
        collaborators: [],
        questions: questions.filter(q => q.subject === 'Data Structures' && q.scope === 'shared').map(q => q._id),
        isPublic: true,
        settings: {
          allowContributions: true,
          requireApproval: true,
          allowDownload: true
        }
      },
      {
        name: 'Mathematics Core',
        description: 'Essential mathematics questions',
        subject: 'Mathematics',
        owners: [instructors[1]._id],
        collaborators: [],
        questions: questions.filter(q => q.subject === 'Linear Algebra' && q.scope === 'shared').map(q => q._id),
        isPublic: true,
        settings: {
          allowContributions: true,
          requireApproval: false,
          allowDownload: true
        }
      }
    ]);

    console.log('🏦 Created shared banks');

    // 6. Create Exams (4 specific exams as requested)
    const currentDate = new Date();
    const futureDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    const pastDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const ongoingDate = new Date(currentDate.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago (ongoing)

    const exams = await Exam.insertMany([
      // Exam 1 (Completed): "Algebra Basics Test" (Math, Dr. John)
      {
        title: 'Algebra Basics Test',
        subject: 'Mathematics',
        description: 'Basic algebra concepts and problem solving',
        duration: 90,
        totalMarks: 100,
        passingMarks: 60,
        questions: questions.filter(q => q.subject === 'Mathematics' && q.scope === 'shared').slice(0, 5).map(q => q._id),
        createdBy: admin._id,
        instructorId: instructors[0]._id, // Dr. John
        status: 'published',
        scheduledDate: pastDate,
        endDate: new Date(pastDate.getTime() + 2 * 60 * 60 * 1000),
        attempts: students.map(student => ({
          student: student._id,
          maxAttempts: 1,
          attemptsUsed: 1
        })),
        settings: {
          shuffleQuestions: true,
          showResults: true,
          allowReview: true,
          proctoring: { enabled: false, lockdown: false, recordScreen: false }
        }
      },
      // Exam 2 (Completed): "Intro to Programming" (CS, Dr. Sarah)
      {
        title: 'Intro to Programming',
        subject: 'Computer Science',
        description: 'Introduction to programming concepts and basics',
        duration: 120,
        totalMarks: 100,
        passingMarks: 60,
        questions: questions.filter(q => q.subject === 'Computer Science' && q.scope === 'shared').slice(0, 5).map(q => q._id),
        createdBy: admin._id,
        instructorId: instructors[1]._id, // Dr. Sarah
        status: 'published',
        scheduledDate: pastDate,
        endDate: new Date(pastDate.getTime() + 2 * 60 * 60 * 1000),
        attempts: students.map(student => ({
          student: student._id,
          maxAttempts: 1,
          attemptsUsed: 1
        })),
        settings: {
          shuffleQuestions: true,
          showResults: true,
          allowReview: true,
          proctoring: { enabled: false, lockdown: false, recordScreen: false }
        }
      },
      // Exam 3 (Ongoing): "Geometry Quiz" (Math, Dr. John)
      {
        title: 'Geometry Quiz',
        subject: 'Mathematics',
        description: 'Geometry concepts and calculations',
        duration: 60,
        totalMarks: 50,
        passingMarks: 30,
        questions: questions.filter(q => q.subject === 'Mathematics' && q.scope === 'private').slice(0, 3).map(q => q._id),
        createdBy: admin._id,
        instructorId: instructors[0]._id, // Dr. John
        status: 'published',
        scheduledDate: ongoingDate,
        endDate: new Date(ongoingDate.getTime() + 3 * 60 * 60 * 1000),
        attempts: students.map(student => ({
          student: student._id,
          maxAttempts: 1,
          attemptsUsed: 0
        })),
        settings: {
          shuffleQuestions: false,
          showResults: false,
          allowReview: false,
          proctoring: { enabled: true, lockdown: false, recordScreen: false }
        }
      },
      // Exam 4 (Upcoming): "Data Structures Test" (CS, Dr. Sarah)
      {
        title: 'Data Structures Test',
        subject: 'Computer Science',
        description: 'Advanced data structures and algorithms',
        duration: 150,
        totalMarks: 100,
        passingMarks: 60,
        questions: questions.filter(q => q.subject === 'Computer Science' && q.scope === 'private').slice(0, 5).map(q => q._id),
        createdBy: admin._id,
        instructorId: instructors[1]._id, // Dr. Sarah
        status: 'published',
        scheduledDate: futureDate,
        endDate: new Date(futureDate.getTime() + 3 * 60 * 60 * 1000),
        attempts: students.map(student => ({
          student: student._id,
          maxAttempts: 1,
          attemptsUsed: 0
        })),
        settings: {
          shuffleQuestions: true,
          showResults: false,
          allowReview: false,
          proctoring: { enabled: true, lockdown: true, recordScreen: true }
        }
      }
    ]);

    console.log('📝 Created exams');

    // 7. Create Student Exam Records with exact scores as specified
    const studentExams = await StudentExam.insertMany([
      // Exam 1 (Algebra Basics) - Completed scores
      // Bob: 80/100
      {
        examId: exams[0]._id,
        studentId: students[0]._id, // Bob
        answers: questions.filter(q => q.subject === 'Mathematics' && q.scope === 'shared').slice(0, 5).map((q, i) => ({
          questionId: q._id,
          answer: q.correctAnswer,
          isCorrect: i < 4, // 4 out of 5 correct = 80%
          marksObtained: i < 4 ? q.marks : 0,
          timeSpent: 30 + i * 5
        })),
        status: 'submitted',
        score: 80,
        percentage: 80,
        grade: 'B+',
        startedAt: new Date(pastDate.getTime() + 30 * 60 * 1000),
        submittedAt: new Date(pastDate.getTime() + 90 * 60 * 1000),
        gradedAt: new Date(pastDate.getTime() + 120 * 60 * 1000)
      },
      // Emma: 65/100
      {
        examId: exams[0]._id,
        studentId: students[1]._id, // Emma
        answers: questions.filter(q => q.subject === 'Mathematics' && q.scope === 'shared').slice(0, 5).map((q, i) => ({
          questionId: q._id,
          answer: i < 3 ? q.correctAnswer : 'wrong answer',
          isCorrect: i < 3, // 3 out of 5 correct = 60%, but give 65%
          marksObtained: i < 3 ? q.marks : (i === 3 ? 1 : 0), // partial credit on 4th
          timeSpent: 25 + i * 7
        })),
        status: 'submitted',
        score: 65,
        percentage: 65,
        grade: 'B-',
        startedAt: new Date(pastDate.getTime() + 45 * 60 * 1000),
        submittedAt: new Date(pastDate.getTime() + 105 * 60 * 1000),
        gradedAt: new Date(pastDate.getTime() + 125 * 60 * 1000)
      },
      // Liam: 90/100
      {
        examId: exams[0]._id,
        studentId: students[2]._id, // Liam
        answers: questions.filter(q => q.subject === 'Mathematics' && q.scope === 'shared').slice(0, 5).map((q, i) => ({
          questionId: q._id,
          answer: q.correctAnswer,
          isCorrect: i < 5, // All correct but lose 10% somewhere
          marksObtained: i < 4 ? q.marks : (q.marks - 1), // lose 1 mark on last question
          timeSpent: 20 + i * 4
        })),
        status: 'submitted',
        score: 90,
        percentage: 90,
        grade: 'A-',
        startedAt: new Date(pastDate.getTime() + 15 * 60 * 1000),
        submittedAt: new Date(pastDate.getTime() + 75 * 60 * 1000),
        gradedAt: new Date(pastDate.getTime() + 110 * 60 * 1000)
      },
      // Sophia: 50/100
      {
        examId: exams[0]._id,
        studentId: students[3]._id, // Sophia
        answers: questions.filter(q => q.subject === 'Mathematics' && q.scope === 'shared').slice(0, 5).map((q, i) => ({
          questionId: q._id,
          answer: i < 2 ? q.correctAnswer : 'wrong answer',
          isCorrect: i < 2, // 2 out of 5 correct = 40%, but give 50%
          marksObtained: i < 2 ? q.marks : (i === 2 ? 1 : 0), // partial credit
          timeSpent: 40 + i * 10
        })),
        status: 'submitted',
        score: 50,
        percentage: 50,
        grade: 'D',
        startedAt: new Date(pastDate.getTime() + 60 * 60 * 1000),
        submittedAt: new Date(pastDate.getTime() + 130 * 60 * 1000),
        gradedAt: new Date(pastDate.getTime() + 150 * 60 * 1000)
      },
      // Noah: 70/100
      {
        examId: exams[0]._id,
        studentId: students[4]._id, // Noah
        answers: questions.filter(q => q.subject === 'Mathematics' && q.scope === 'shared').slice(0, 5).map((q, i) => ({
          questionId: q._id,
          answer: i < 3 ? q.correctAnswer : 'wrong answer',
          isCorrect: i < 3, // 3 out of 5 correct
          marksObtained: i < 3 ? q.marks : (i === 3 ? 1 : 0), // some partial credit
          timeSpent: 35 + i * 6
        })),
        status: 'submitted',
        score: 70,
        percentage: 70,
        grade: 'B',
        startedAt: new Date(pastDate.getTime() + 20 * 60 * 1000),
        submittedAt: new Date(pastDate.getTime() + 85 * 60 * 1000),
        gradedAt: new Date(pastDate.getTime() + 115 * 60 * 1000)
      },

      // Exam 2 (Programming) - Completed scores
      // Bob: 75/100
      {
        examId: exams[1]._id,
        studentId: students[0]._id, // Bob
        answers: questions.filter(q => q.subject === 'Computer Science' && q.scope === 'shared').slice(0, 5).map((q, i) => ({
          questionId: q._id,
          answer: i < 4 ? q.correctAnswer : 'wrong answer',
          isCorrect: i < 4, // 4 out of 5 correct but 75%
          marksObtained: i < 3 ? q.marks : (i === 3 ? 1 : 0),
          timeSpent: 45 + i * 8
        })),
        status: 'submitted',
        score: 75,
        percentage: 75,
        grade: 'B',
        startedAt: new Date(pastDate.getTime() + 2 * 60 * 60 * 1000),
        submittedAt: new Date(pastDate.getTime() + 4 * 60 * 60 * 1000),
        gradedAt: new Date(pastDate.getTime() + 5 * 60 * 60 * 1000)
      },
      // Emma: 85/100
      {
        examId: exams[1]._id,
        studentId: students[1]._id, // Emma
        answers: questions.filter(q => q.subject === 'Computer Science' && q.scope === 'shared').slice(0, 5).map((q, i) => ({
          questionId: q._id,
          answer: q.correctAnswer,
          isCorrect: i < 5, // All correct but lose some points
          marksObtained: i < 4 ? q.marks : (q.marks - 1),
          timeSpent: 30 + i * 6
        })),
        status: 'submitted',
        score: 85,
        percentage: 85,
        grade: 'A-',
        startedAt: new Date(pastDate.getTime() + 2.5 * 60 * 60 * 1000),
        submittedAt: new Date(pastDate.getTime() + 4.5 * 60 * 60 * 1000),
        gradedAt: new Date(pastDate.getTime() + 5.5 * 60 * 60 * 1000)
      },
      // Liam: 60/100
      {
        examId: exams[1]._id,
        studentId: students[2]._id, // Liam
        answers: questions.filter(q => q.subject === 'Computer Science' && q.scope === 'shared').slice(0, 5).map((q, i) => ({
          questionId: q._id,
          answer: i < 3 ? q.correctAnswer : 'wrong answer',
          isCorrect: i < 3, // 3 out of 5 correct = 60%
          marksObtained: i < 3 ? q.marks : 0,
          timeSpent: 50 + i * 10
        })),
        status: 'submitted',
        score: 60,
        percentage: 60,
        grade: 'C+',
        startedAt: new Date(pastDate.getTime() + 3 * 60 * 60 * 1000),
        submittedAt: new Date(pastDate.getTime() + 5 * 60 * 60 * 1000),
        gradedAt: new Date(pastDate.getTime() + 6 * 60 * 60 * 1000)
      },
      // Sophia: 95/100
      {
        examId: exams[1]._id,
        studentId: students[3]._id, // Sophia
        answers: questions.filter(q => q.subject === 'Computer Science' && q.scope === 'shared').slice(0, 5).map((q, i) => ({
          questionId: q._id,
          answer: q.correctAnswer,
          isCorrect: true, // All correct, lose only 5%
          marksObtained: i < 4 ? q.marks : (q.marks - 1),
          timeSpent: 25 + i * 5
        })),
        status: 'submitted',
        score: 95,
        percentage: 95,
        grade: 'A+',
        startedAt: new Date(pastDate.getTime() + 2.2 * 60 * 60 * 1000),
        submittedAt: new Date(pastDate.getTime() + 4 * 60 * 60 * 1000),
        gradedAt: new Date(pastDate.getTime() + 5.2 * 60 * 60 * 1000)
      },
      // Noah: 55/100
      {
        examId: exams[1]._id,
        studentId: students[4]._id, // Noah
        answers: questions.filter(q => q.subject === 'Computer Science' && q.scope === 'shared').slice(0, 5).map((q, i) => ({
          questionId: q._id,
          answer: i < 3 ? q.correctAnswer : 'wrong answer',
          isCorrect: i < 3, // 3 out of 5 but lower score
          marksObtained: i < 2 ? q.marks : (i === 2 ? 1 : 0),
          timeSpent: 55 + i * 12
        })),
        status: 'submitted',
        score: 55,
        percentage: 55,
        grade: 'D+',
        startedAt: new Date(pastDate.getTime() + 3.5 * 60 * 60 * 1000),
        submittedAt: new Date(pastDate.getTime() + 5.5 * 60 * 60 * 1000),
        gradedAt: new Date(pastDate.getTime() + 6.5 * 60 * 60 * 1000)
      },

      // Exam 3 (Geometry Quiz) - Ongoing with 2-3 saved answers per student
      ...students.map(student => ({
        examId: exams[2]._id,
        studentId: student._id,
        answers: questions.filter(q => q.subject === 'Mathematics' && q.scope === 'private').slice(0, 2).map((q, i) => ({
          questionId: q._id,
          answer: i === 0 ? q.correctAnswer : '', // First answered, second blank
          isCorrect: i === 0,
          marksObtained: i === 0 ? q.marks : 0,
          timeSpent: 15 + i * 5
        })),
        status: 'in_progress',
        score: null,
        percentage: null,
        startedAt: new Date(ongoingDate.getTime() + 30 * 60 * 1000),
        submittedAt: null,
        gradedAt: null
      }))
    ]);

    console.log('📊 Created student exam records');

    // 8. Create Notifications (as specified)
    const notifications = await Notification.insertMany([
      // Admin → All: "System maintenance scheduled for Sunday."
      {
        type: 'system',
        title: 'System Maintenance Scheduled',
        message: 'System maintenance scheduled for Sunday.',
        priority: 'medium',
        link: '/dashboard'
      },
      // Instructor → Students: "New exam created: Data Structures Test."
      {
        type: 'exam',
        title: 'New Exam Created',
        message: 'New exam created: Data Structures Test.',
        priority: 'high',
        link: `/student/exam/${exams[3]._id}`
      },
      // System → Students: "Your Algebra Test results are now available."
      {
        type: 'exam',
        title: 'Algebra Test Results Available',
        message: 'Your Algebra Test results are now available.',
        userId: students[0]._id, // Bob
        priority: 'medium',
        link: `/student/exam/${exams[0]._id}/result`
      },
      {
        type: 'exam',
        title: 'Algebra Test Results Available',
        message: 'Your Algebra Test results are now available.',
        userId: students[1]._id, // Emma
        priority: 'medium',
        link: `/student/exam/${exams[0]._id}/result`
      },
      {
        type: 'exam',
        title: 'Algebra Test Results Available',
        message: 'Your Algebra Test results are now available.',
        userId: students[2]._id, // Liam
        priority: 'medium',
        link: `/student/exam/${exams[0]._id}/result`
      },
      {
        type: 'exam',
        title: 'Algebra Test Results Available',
        message: 'Your Algebra Test results are now available.',
        userId: students[3]._id, // Sophia
        priority: 'medium',
        link: `/student/exam/${exams[0]._id}/result`
      },
      {
        type: 'exam',
        title: 'Algebra Test Results Available',
        message: 'Your Algebra Test results are now available.',
        userId: students[4]._id, // Noah
        priority: 'medium',
        link: `/student/exam/${exams[0]._id}/result`
      }
    ]);

    console.log('🔔 Created notifications');

    // 9. Create Activity Records
    const activities = await Activity.insertMany([
      {
        user: students[0]._id,
        type: 'exam_taken',
        description: 'Completed Data Structures Midterm',
        metadata: {
          examId: exams[0]._id,
          examTitle: 'Data Structures Midterm',
          score: 4,
          percentage: 80
        }
      },
      {
        user: students[1]._id,
        type: 'exam_taken',
        description: 'Completed Data Structures Midterm',
        metadata: {
          examId: exams[0]._id,
          examTitle: 'Data Structures Midterm',
          score: 2,
          percentage: 40
        }
      },
      {
        user: instructors[0]._id,
        type: 'exam_created',
        description: 'Created Web Development Quiz',
        metadata: {
          examId: exams[1]._id,
          examTitle: 'Web Development Quiz'
        }
      },
      {
        user: admin._id,
        type: 'user_created',
        description: 'Created new student account',
        metadata: {
          targetUserId: students[0]._id,
          targetUserName: students[0].name,
          targetUserRole: 'student'
        }
      },
      {
        user: instructors[0]._id,
        type: 'question_created',
        description: 'Added new question to Data Structures bank',
        metadata: {
          questionId: questions[0]._id,
          subject: 'Data Structures'
        }
      }
    ]);

    console.log('📈 Created activity records');

    // 10. Update statistics and relationships
    console.log('🔄 Updating relationships and statistics...');

    // Mark some notifications as read
    await Notification.updateMany(
      { recipientId: students[0]._id },
      { isRead: true, readAt: new Date() }
    );

    console.log('✅ Comprehensive seed data created successfully!');
    console.log(`
📊 Summary:
- 👥 Users: ${1 + instructors.length + students.length} (1 admin, ${instructors.length} instructors, ${students.length} students)
- 🏢 Departments: ${departments.length}
- ❓ Questions: ${questions.length}
- 🏦 Shared Banks: ${sharedBanks.length}
- 📝 Exams: ${exams.length}
- 📊 Student Exam Records: ${studentExams.length}
- 🔔 Notifications: ${notifications.length}
- 📈 Activities: ${activities.length}
    `);

    return {
      users: { admin, instructors, students },
      departments,
      questions,
      sharedBanks,
      exams,
      studentExams,
      notifications,
      activities
    };

  } catch (error) {
    console.error('❌ Error seeding comprehensive data:', error);
    throw error;
  }
}
