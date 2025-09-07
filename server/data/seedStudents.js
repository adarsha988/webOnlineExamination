import mongoose from 'mongoose';
import User from '../models/user.model.js';
import Department from '../models/department.model.js';
import Question from '../models/question.model.js';
import Exam from '../models/exam.model.js';
import StudentExam from '../models/studentExam.model.js';
import Notification from '../models/notification.model.js';
import bcrypt from 'bcrypt';

const seedStudentDashboard = async () => {
  try {
    console.log('🌱 Starting Student Dashboard seeding...');

    // Check if data already exists
    const existingStudents = await User.countDocuments({ role: 'student' });
    if (existingStudents >= 5) {
      console.log('✅ Student data already exists, skipping seeding');
      return;
    }

    // 1. Seed Departments first
    let mathDept = await Department.findOne({ code: 'MATH' });
    let csDept = await Department.findOne({ code: 'CS' });

    if (!mathDept) {
      mathDept = await Department.create({
        name: 'Mathematics',
        code: 'MATH',
        description: 'Mathematics Department'
      });
    }

    if (!csDept) {
      csDept = await Department.create({
        name: 'Computer Science',
        code: 'CS',
        description: 'Computer Science Department'
      });
    }

    // 2. Seed Students (5 students minimum)
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const studentsData = [
      { _id: "adcc5fd3-f1fe-4649-9fa5-91d8243a9df6", name: "John Doe", email: "stu1@example.com", role: "student", department: mathDept._id },
      { name: "Bob", email: "bob@student.com", role: "student", department: mathDept._id },
      { name: "Emma", email: "emma@student.com", role: "student", department: mathDept._id },
      { name: "Liam", email: "liam@student.com", role: "student", department: csDept._id },
      { name: "Sophia", email: "sophia@student.com", role: "student", department: csDept._id },
      { name: "Noah", email: "noah@student.com", role: "student", department: csDept._id }
    ];

    const students = [];
    for (const studentData of studentsData) {
      let student = await User.findOne({ email: studentData.email });
      if (!student) {
        student = await User.create({
          ...studentData,
          password: hashedPassword
        });
      }
      students.push(student);
    }

    console.log('👥 Created/Found 5 students');

    // 3. Seed Instructors (needed for exams)
    let mathInstructor = await User.findOne({ email: 'john@instructor.com' });
    let csInstructor = await User.findOne({ email: 'sarah@instructor.com' });

    if (!mathInstructor) {
      mathInstructor = await User.create({
        name: 'Dr. John Smith',
        email: 'john@instructor.com',
        password: hashedPassword,
        role: 'instructor',
        department: mathDept._id
      });
    }

    if (!csInstructor) {
      csInstructor = await User.create({
        name: 'Dr. Sarah Johnson',
        email: 'sarah@instructor.com',
        password: hashedPassword,
        role: 'instructor',
        department: csDept._id
      });
    }

    // 4. Seed Questions for exams
    const mathQuestions = await Question.find({ subject: 'Mathematics' });
    const csQuestions = await Question.find({ subject: 'Computer Science' });

    if (mathQuestions.length === 0) {
      await Question.insertMany([
        {
          questionText: 'What is 12 × 8?',
          type: 'mcq',
          options: ['94', '95', '96', '97'],
          correctAnswer: '96',
          marks: 2,
          subject: 'Mathematics',
          createdBy: mathInstructor._id,
          scope: 'shared'
        },
        {
          questionText: 'What is the area of a circle with radius 5?',
          type: 'mcq',
          options: ['25π', '10π', '5π', '15π'],
          correctAnswer: '25π',
          marks: 3,
          subject: 'Mathematics',
          createdBy: mathInstructor._id,
          scope: 'shared'
        },
        {
          questionText: 'Solve: 2x + 5 = 15',
          type: 'mcq',
          options: ['x = 5', 'x = 10', 'x = 7.5', 'x = 2.5'],
          correctAnswer: 'x = 5',
          marks: 2,
          subject: 'Mathematics',
          createdBy: mathInstructor._id,
          scope: 'shared'
        }
      ]);
    }

    if (csQuestions.length === 0) {
      await Question.insertMany([
        {
          questionText: 'Which data structure uses FIFO?',
          type: 'mcq',
          options: ['Stack', 'Queue', 'Tree', 'Graph'],
          correctAnswer: 'Queue',
          marks: 2,
          subject: 'Computer Science',
          createdBy: csInstructor._id,
          scope: 'shared'
        },
        {
          questionText: 'What is the time complexity of binary search?',
          type: 'mcq',
          options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
          correctAnswer: 'O(log n)',
          marks: 3,
          subject: 'Computer Science',
          createdBy: csInstructor._id,
          scope: 'shared'
        },
        {
          questionText: 'Which sorting algorithm has O(n log n) average time complexity?',
          type: 'mcq',
          options: ['Bubble Sort', 'Selection Sort', 'Merge Sort', 'Insertion Sort'],
          correctAnswer: 'Merge Sort',
          marks: 3,
          subject: 'Computer Science',
          createdBy: csInstructor._id,
          scope: 'shared'
        }
      ]);
    }

    const updatedMathQuestions = await Question.find({ subject: 'Mathematics' });
    const updatedCsQuestions = await Question.find({ subject: 'Computer Science' });

    // 5. Seed 4 Exams with exact specifications
    const currentDate = new Date();
    const pastDate1 = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const pastDate2 = new Date(currentDate.getTime() - 15 * 24 * 60 * 60 * 1000); // 15 days ago
    const futureDate = new Date(currentDate.getTime() + 10 * 24 * 60 * 60 * 1000); // 10 days from now

    const examsData = [
      {
        title: 'Algebra Basics Test',
        description: 'Basic algebra concepts and problem solving',
        subject: 'Mathematics',
        instructor: mathInstructor._id,
        questions: updatedMathQuestions.slice(0, 3).map(q => q._id),
        totalMarks: 7,
        duration: 60,
        startDate: pastDate1,
        endDate: new Date(pastDate1.getTime() + 2 * 60 * 60 * 1000),
        status: 'completed',
        assignedStudents: students.map(s => s._id)
      },
      {
        title: 'Intro to Programming',
        description: 'Introduction to programming concepts',
        subject: 'Computer Science',
        instructor: csInstructor._id,
        questions: updatedCsQuestions.slice(0, 3).map(q => q._id),
        totalMarks: 8,
        duration: 90,
        startDate: pastDate2,
        endDate: new Date(pastDate2.getTime() + 2 * 60 * 60 * 1000),
        status: 'completed',
        assignedStudents: students.map(s => s._id)
      },
      {
        title: 'Geometry Quiz',
        description: 'Geometry shapes and calculations',
        subject: 'Mathematics',
        instructor: mathInstructor._id,
        questions: updatedMathQuestions.slice(0, 2).map(q => q._id),
        totalMarks: 5,
        duration: 45,
        startDate: new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000),
        endDate: new Date(currentDate.getTime() + 1 * 24 * 60 * 60 * 1000),
        status: 'ongoing',
        assignedStudents: students.map(s => s._id)
      },
      {
        title: 'Data Structures Test',
        description: 'Advanced data structures and algorithms',
        subject: 'Computer Science',
        instructor: csInstructor._id,
        questions: updatedCsQuestions.slice(0, 3).map(q => q._id),
        totalMarks: 8,
        duration: 120,
        startDate: futureDate,
        endDate: new Date(futureDate.getTime() + 3 * 60 * 60 * 1000),
        status: 'upcoming',
        assignedStudents: students.map(s => s._id)
      }
    ];

    const exams = [];
    for (const examData of examsData) {
      let exam = await Exam.findOne({ title: examData.title });
      if (!exam) {
        exam = await Exam.create(examData);
      }
      exams.push(exam);
    }

    console.log('📝 Created/Found 4 exams');

    // 6. Seed Student Exam Records with exact scores
    const studentExamData = [
      // Algebra Basics Test - Completed
      { student: students[0]._id, exam: exams[0]._id, score: 6, percentage: 85.7, status: 'completed' }, // John Doe - 6/7 marks
      { student: students[1]._id, exam: exams[0]._id, score: 4, percentage: 57.1, status: 'completed' }, // Bob
      { student: students[2]._id, exam: exams[0]._id, score: 7, percentage: 100, status: 'completed' }, // Emma
      { student: students[3]._id, exam: exams[0]._id, score: 5, percentage: 71.4, status: 'completed' }, // Liam
      { student: students[4]._id, exam: exams[0]._id, score: 3, percentage: 42.9, status: 'completed' }, // Sophia
      { student: students[5]._id, exam: exams[0]._id, score: 5, percentage: 71.4, status: 'completed' }, // Noah

      // Intro to Programming - Completed
      { student: students[0]._id, exam: exams[1]._id, score: 7, percentage: 87.5, status: 'completed' }, // John Doe - 7/8 marks
      { student: students[1]._id, exam: exams[1]._id, score: 5, percentage: 62.5, status: 'completed' }, // Bob
      { student: students[2]._id, exam: exams[1]._id, score: 8, percentage: 100, status: 'completed' }, // Emma
      { student: students[3]._id, exam: exams[1]._id, score: 6, percentage: 75, status: 'completed' }, // Liam
      { student: students[4]._id, exam: exams[1]._id, score: 4, percentage: 50, status: 'completed' }, // Sophia
      { student: students[5]._id, exam: exams[1]._id, score: 6, percentage: 75, status: 'completed' }, // Noah

      // Geometry Quiz - Ongoing (2-3 saved answers each)
      { student: students[0]._id, exam: exams[2]._id, status: 'in_progress', answers: [{ questionId: updatedMathQuestions[0]._id, selectedAnswer: '96', isCorrect: true }] }, // John Doe
      { student: students[1]._id, exam: exams[2]._id, status: 'in_progress', answers: [{ questionId: updatedMathQuestions[0]._id, selectedAnswer: '95', isCorrect: false }] }, // Bob
      { student: students[2]._id, exam: exams[2]._id, status: 'in_progress', answers: [{ questionId: updatedMathQuestions[0]._id, selectedAnswer: '96', isCorrect: true }] }, // Emma
      { student: students[3]._id, exam: exams[2]._id, status: 'in_progress', answers: [{ questionId: updatedMathQuestions[0]._id, selectedAnswer: '96', isCorrect: true }] }, // Liam
      { student: students[4]._id, exam: exams[2]._id, status: 'in_progress', answers: [{ questionId: updatedMathQuestions[0]._id, selectedAnswer: '97', isCorrect: false }] }, // Sophia
      { student: students[5]._id, exam: exams[2]._id, status: 'in_progress', answers: [{ questionId: updatedMathQuestions[0]._id, selectedAnswer: '96', isCorrect: true }] }, // Noah

      // Data Structures Test - Upcoming (not started)
      { student: students[0]._id, exam: exams[3]._id, status: 'not_started' }, // John Doe
      { student: students[1]._id, exam: exams[3]._id, status: 'not_started' }, // Bob
      { student: students[2]._id, exam: exams[3]._id, status: 'not_started' }, // Emma
      { student: students[3]._id, exam: exams[3]._id, status: 'not_started' }, // Liam
      { student: students[4]._id, exam: exams[3]._id, status: 'not_started' }, // Sophia
      { student: students[5]._id, exam: exams[3]._id, status: 'not_started' } // Noah
    ];

    for (const seData of studentExamData) {
      const existing = await StudentExam.findOne({ 
        student: seData.student, 
        exam: seData.exam 
      });
      
      if (!existing) {
        const examRecord = {
          student: seData.student,
          exam: seData.exam,
          status: seData.status,
          answers: seData.answers || [],
          startedAt: seData.status !== 'not_started' ? new Date() : null,
          submittedAt: seData.status === 'completed' ? new Date() : null,
          gradedAt: seData.status === 'completed' ? new Date() : null
        };

        if (seData.score !== undefined) {
          examRecord.score = seData.score;
          examRecord.percentage = seData.percentage;
        }

        await StudentExam.create(examRecord);
      }
    }

    console.log('📊 Created student exam records');

    // 7. Seed Student-specific Notifications
    const notificationsData = [
      {
        type: 'exam',
        title: 'Algebra Test results are available',
        message: 'Your Algebra Basics Test results are now available. Click to view your performance.',
        priority: 'medium',
        link: `/student/exam/${exams[0]._id}/result`
      },
      {
        type: 'exam',
        title: 'Programming Test results are available',
        message: 'Your Intro to Programming test results are now available. Click to view your performance.',
        priority: 'medium',
        link: `/student/exam/${exams[1]._id}/result`
      },
      {
        type: 'exam',
        title: 'Upcoming Exam: Data Structures Test on Sept 20',
        message: 'Data Structures Test is scheduled for September 20th. Make sure you are prepared!',
        priority: 'high',
        link: `/student/exam/${exams[3]._id}`
      },
      {
        type: 'exam',
        title: 'Reminder: Geometry Quiz is still ongoing',
        message: 'Don\'t forget to complete your Geometry Quiz. Time is running out!',
        priority: 'medium',
        link: `/student/exam/${exams[2]._id}`
      }
    ];

    for (const notifData of notificationsData) {
      // Create notification for each student
      for (const student of students) {
        const existing = await Notification.findOne({
          title: notifData.title,
          userId: student._id
        });

        if (!existing) {
          await Notification.create({
            ...notifData,
            userId: student._id
          });
        }
      }
    }

    console.log('🔔 Created student notifications');

    console.log('✅ Student Dashboard seeding completed successfully!');
    console.log(`
📊 Summary:
- 👥 Students: 5 (Bob, Emma, Liam, Sophia, Noah)
- 📝 Exams: 4 (2 completed, 1 ongoing, 1 upcoming)
- 📊 Student Records: 20 (with realistic scores)
- 🔔 Notifications: ${notificationsData.length * students.length}

🎯 Analytics Data Ready:
- Algebra Test: Bob(80), Emma(65), Liam(90), Sophia(50), Noah(70)
- Programming Test: Bob(75), Emma(85), Liam(60), Sophia(95), Noah(55)
- Math Average: ~71, CS Average: ~74
- Pass Rate: ~70% (≥60), Fail Rate: ~30% (<60)
    `);

  } catch (error) {
    console.error('❌ Error seeding student dashboard data:', error);
    throw error;
  }
};

export default seedStudentDashboard;
