import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/user.model.js';
import Exam from '../models/exam.model.js';
import Question from '../models/question.model.js';
import StudentExam from '../models/studentExam.model.js';
import Notification from '../models/notification.model.js';

const studentSeedData = async () => {
  try {
    console.log('🌱 Starting student data seeding...');

    // Check if students already exist
    const existingStudents = await User.find({ role: 'student' });
    if (existingStudents.length >= 3) {
      console.log('⏭️  Students already exist');
      return;
    }

    // Create student users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const students = [
      {
        name: 'Alice Sharma',
        email: 'alice@student.com',
        password: hashedPassword,
        role: 'student',
        status: 'active',
        phone: '+977-9841234567',
        address: 'Kathmandu, Nepal'
      },
      {
        name: 'Bikash Thapa',
        email: 'bikash@student.com',
        password: hashedPassword,
        role: 'student',
        status: 'active',
        phone: '+977-9841234568',
        address: 'Pokhara, Nepal'
      },
      {
        name: 'Sita Gurung',
        email: 'sita@student.com',
        password: hashedPassword,
        role: 'student',
        status: 'active',
        phone: '+977-9841234569',
        address: 'Chitwan, Nepal'
      }
    ];

    const createdStudents = await User.insertMany(students);
    console.log(`✅ Created ${createdStudents.length} students`);

    // Ensure we have an instructor
    let instructor = await User.findOne({ role: 'instructor' });
    if (!instructor) {
      instructor = await User.create({
        name: 'Dr. Ram Prasad',
        email: 'instructor@test.com',
        password: hashedPassword,
        role: 'instructor',
        status: 'active'
      });
      console.log('✅ Created instructor user');
    }

    // Create sample questions for different subjects
    const mathQuestions = [
      {
        createdBy: instructor._id,
        scope: 'private',
        subject: 'Mathematics',
        difficulty: 'easy',
        type: 'mcq',
        questionText: 'What is 2 + 2?',
        options: ['3', '4', '5', '6'],
        correctAnswer: '4',
        explanation: 'Basic addition: 2 + 2 = 4',
        marks: 1,
        tags: ['arithmetic', 'basic'],
        status: 'approved'
      },
      {
        createdBy: instructor._id,
        scope: 'private',
        subject: 'Mathematics',
        difficulty: 'medium',
        type: 'mcq',
        questionText: 'What is the square root of 64?',
        options: ['6', '7', '8', '9'],
        correctAnswer: '8',
        explanation: '√64 = 8 because 8² = 64',
        marks: 2,
        tags: ['algebra', 'roots'],
        status: 'approved'
      },
      {
        createdBy: instructor._id,
        scope: 'private',
        subject: 'Mathematics',
        difficulty: 'hard',
        type: 'short',
        questionText: 'Solve for x: 2x + 5 = 13',
        correctAnswer: '4',
        explanation: '2x = 13 - 5 = 8, so x = 4',
        marks: 3,
        tags: ['algebra', 'equations'],
        status: 'approved'
      },
      {
        createdBy: instructor._id,
        scope: 'private',
        subject: 'Mathematics',
        difficulty: 'medium',
        type: 'truefalse',
        questionText: 'The sum of angles in a triangle is 180 degrees.',
        correctAnswer: 'True',
        explanation: 'This is a fundamental property of triangles in Euclidean geometry.',
        marks: 1,
        tags: ['geometry', 'triangles'],
        status: 'approved'
      },
      {
        createdBy: instructor._id,
        scope: 'private',
        subject: 'Mathematics',
        difficulty: 'easy',
        type: 'mcq',
        questionText: 'What is 15% of 200?',
        options: ['25', '30', '35', '40'],
        correctAnswer: '30',
        explanation: '15% of 200 = 0.15 × 200 = 30',
        marks: 2,
        tags: ['percentage', 'arithmetic'],
        status: 'approved'
      }
    ];

    const computerQuestions = [
      {
        createdBy: instructor._id,
        scope: 'private',
        subject: 'Computer Science',
        difficulty: 'easy',
        type: 'mcq',
        questionText: 'What does CPU stand for?',
        options: ['Central Processing Unit', 'Computer Processing Unit', 'Central Program Unit', 'Computer Program Unit'],
        correctAnswer: 'Central Processing Unit',
        explanation: 'CPU stands for Central Processing Unit, the main processor of a computer.',
        marks: 1,
        tags: ['hardware', 'basics'],
        status: 'approved'
      },
      {
        createdBy: instructor._id,
        scope: 'private',
        subject: 'Computer Science',
        difficulty: 'medium',
        type: 'mcq',
        questionText: 'Which of the following is a programming language?',
        options: ['HTML', 'CSS', 'JavaScript', 'All of the above'],
        correctAnswer: 'JavaScript',
        explanation: 'While HTML and CSS are markup and styling languages, JavaScript is a programming language.',
        marks: 2,
        tags: ['programming', 'languages'],
        status: 'approved'
      },
      {
        createdBy: instructor._id,
        scope: 'private',
        subject: 'Computer Science',
        difficulty: 'hard',
        type: 'short',
        questionText: 'What is the time complexity of binary search?',
        correctAnswer: 'O(log n)',
        explanation: 'Binary search has O(log n) time complexity as it divides the search space in half each iteration.',
        marks: 3,
        tags: ['algorithms', 'complexity'],
        status: 'approved'
      },
      {
        createdBy: instructor._id,
        scope: 'private',
        subject: 'Computer Science',
        difficulty: 'medium',
        type: 'truefalse',
        questionText: 'HTTP is a stateless protocol.',
        correctAnswer: 'True',
        explanation: 'HTTP is indeed stateless - each request is independent and contains no information about previous requests.',
        marks: 2,
        tags: ['networking', 'protocols'],
        status: 'approved'
      },
      {
        createdBy: instructor._id,
        scope: 'private',
        subject: 'Computer Science',
        difficulty: 'easy',
        type: 'mcq',
        questionText: 'What does RAM stand for?',
        options: ['Random Access Memory', 'Read Access Memory', 'Rapid Access Memory', 'Real Access Memory'],
        correctAnswer: 'Random Access Memory',
        explanation: 'RAM stands for Random Access Memory, which provides temporary storage for data and programs.',
        marks: 1,
        tags: ['hardware', 'memory'],
        status: 'approved'
      }
    ];

    // Create questions
    const allQuestions = [...mathQuestions, ...computerQuestions];
    const createdQuestions = await Question.insertMany(allQuestions);
    console.log(`✅ Created ${createdQuestions.length} questions`);

    // Create exams
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const pastDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const pastEndDate = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);

    const mathQuestionIds = createdQuestions.filter(q => q.subject === 'Mathematics').map(q => q._id);
    const computerQuestionIds = createdQuestions.filter(q => q.subject === 'Computer Science').map(q => q._id);

    const exams = [
      {
        title: 'Math Basics Assessment',
        description: 'Basic mathematics assessment covering arithmetic, algebra, and geometry',
        subject: 'Mathematics',
        duration: 45, // minutes
        totalMarks: 9,
        passingMarks: 4,
        questions: mathQuestionIds,
        createdBy: instructor._id,
        instructorId: instructor._id,
        status: 'published',
        scheduledDate: tomorrow,
        endDate: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000), // 2 hours window
        settings: {
          allowRetake: false,
          showResults: true,
          randomizeQuestions: false
        }
      },
      {
        title: 'Computer Fundamentals',
        description: 'Fundamental concepts in computer science and programming',
        subject: 'Computer Science',
        duration: 60, // minutes
        totalMarks: 9,
        passingMarks: 4,
        questions: computerQuestionIds,
        createdBy: instructor._id,
        instructorId: instructor._id,
        status: 'published',
        scheduledDate: pastDate,
        endDate: pastEndDate,
        settings: {
          allowRetake: false,
          showResults: true,
          randomizeQuestions: false
        }
      }
    ];

    const createdExams = await Exam.insertMany(exams);
    console.log(`✅ Created ${createdExams.length} exams`);

    // Assign students to exams
    const mathExam = createdExams.find(e => e.subject === 'Mathematics');
    const computerExam = createdExams.find(e => e.subject === 'Computer Science');

    // Assign Alice and Bikash to Math exam (upcoming)
    mathExam.attempts = [
      { student: createdStudents[0]._id }, // Alice
      { student: createdStudents[1]._id }  // Bikash
    ];
    await mathExam.save();

    // Assign Sita to Computer exam (completed) and create student exam record
    computerExam.attempts = [
      { student: createdStudents[2]._id } // Sita
    ];
    await computerExam.save();

    // Create completed student exam for Sita
    const sitaAnswers = computerQuestionIds.map((questionId, index) => {
      const question = createdQuestions.find(q => q._id.toString() === questionId.toString());
      let answer;
      let isCorrect = false;
      let marksObtained = 0;

      // Simulate realistic answers with some correct and some incorrect
      switch (question.type) {
        case 'mcq':
          if (index % 2 === 0) { // 50% correct rate
            answer = question.correctAnswer;
            isCorrect = true;
            marksObtained = question.marks;
          } else {
            answer = question.options[0]; // Wrong answer
          }
          break;
        case 'truefalse':
          answer = question.correctAnswer;
          isCorrect = true;
          marksObtained = question.marks;
          break;
        case 'short':
          if (index % 3 === 0) { // 33% correct rate for short answers
            answer = question.correctAnswer;
            isCorrect = true;
            marksObtained = question.marks;
          } else {
            answer = 'Wrong answer';
          }
          break;
      }

      return {
        questionId,
        answer,
        isCorrect,
        marksObtained,
        timeSpent: Math.floor(Math.random() * 120) + 30 // 30-150 seconds
      };
    });

    const totalScore = sitaAnswers.reduce((sum, ans) => sum + ans.marksObtained, 0);
    const percentage = Math.round((totalScore / computerExam.totalMarks) * 100);

    const sitaExam = new StudentExam({
      examId: computerExam._id,
      studentId: createdStudents[2]._id, // Sita
      answers: sitaAnswers,
      status: 'submitted',
      score: totalScore,
      percentage,
      grade: percentage >= 80 ? 'A' : percentage >= 60 ? 'B' : percentage >= 40 ? 'C' : 'F',
      startedAt: new Date(pastDate.getTime() + 30 * 60 * 1000), // 30 minutes after exam start
      submittedAt: new Date(pastDate.getTime() + 75 * 60 * 1000), // 45 minutes later
      gradedAt: new Date(pastDate.getTime() + 2 * 60 * 60 * 1000) // 2 hours later
    });

    await sitaExam.save();
    console.log('✅ Created completed student exam for Sita');

    // Create notifications for all students
    const notifications = [];

    // Notifications for Alice and Bikash (Math exam assigned)
    for (const student of [createdStudents[0], createdStudents[1]]) {
      notifications.push({
        type: 'exam',
        title: 'New Exam Assigned',
        message: `You have been assigned to take "${mathExam.title}". The exam is scheduled for ${mathExam.scheduledDate.toLocaleDateString()}.`,
        link: `/student/exam/${mathExam._id}`,
        userId: student._id,
        priority: 'high'
      });

      notifications.push({
        type: 'system',
        title: 'Welcome to Online Examination System',
        message: 'Welcome to our online examination platform. You can view your exams, take tests, and track your progress from your dashboard.',
        link: '/student/dashboard',
        userId: student._id,
        priority: 'medium'
      });
    }

    // Notifications for Sita (result published)
    notifications.push({
      type: 'exam',
      title: 'Exam Result Published',
      message: `Your result for "${computerExam.title}" has been published. You scored ${totalScore}/${computerExam.totalMarks} (${percentage}%).`,
      link: `/student/exam/${computerExam._id}/result`,
      userId: createdStudents[2]._id,
      priority: 'high'
    });

    notifications.push({
      type: 'system',
      title: 'Study Tips Available',
      message: 'Check out our study tips and resources to improve your exam performance. Visit the help section for more information.',
      link: '/student/help',
      userId: createdStudents[2]._id,
      priority: 'low'
    });

    // System notifications for all students
    for (const student of createdStudents) {
      notifications.push({
        type: 'system',
        title: 'Platform Maintenance',
        message: 'Scheduled maintenance will occur this weekend from 2 AM to 4 AM. Please plan your exam schedules accordingly.',
        userId: student._id,
        priority: 'medium'
      });
    }

    await Notification.insertMany(notifications);
    console.log(`✅ Created ${notifications.length} notifications`);

    // Create some additional historical data for better analytics
    const additionalHistoricalExams = [];
    const historicalDates = [
      new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
      new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    ];

    for (let i = 0; i < historicalDates.length; i++) {
      const examDate = historicalDates[i];
      const endDate = new Date(examDate.getTime() + 2 * 60 * 60 * 1000);
      
      const historicalExam = new Exam({
        title: `Practice Test ${i + 1}`,
        description: `Practice examination ${i + 1}`,
        subject: i % 2 === 0 ? 'Mathematics' : 'Computer Science',
        duration: 30,
        totalMarks: 10,
        passingMarks: 4,
        questions: i % 2 === 0 ? mathQuestionIds.slice(0, 3) : computerQuestionIds.slice(0, 3),
        createdBy: instructor._id,
        instructorId: instructor._id,
        status: 'completed',
        scheduledDate: examDate,
        endDate: endDate,
        settings: {
          allowRetake: false,
          showResults: true,
          randomizeQuestions: false
        }
      });

      await historicalExam.save();
      additionalHistoricalExams.push(historicalExam);

      // Create student exam records for each student
      for (const student of createdStudents) {
        const score = Math.floor(Math.random() * 6) + 4; // Score between 4-10
        const percentage = Math.round((score / 10) * 100);
        
        const studentExam = new StudentExam({
          examId: historicalExam._id,
          studentId: student._id,
          answers: historicalExam.questions.map(qId => ({
            questionId: qId,
            answer: 'Sample answer',
            isCorrect: Math.random() > 0.3, // 70% correct rate
            marksObtained: Math.random() > 0.3 ? 1 : 0,
            timeSpent: Math.floor(Math.random() * 60) + 30
          })),
          status: 'submitted',
          score,
          percentage,
          grade: percentage >= 80 ? 'A' : percentage >= 60 ? 'B' : percentage >= 40 ? 'C' : 'F',
          startedAt: new Date(examDate.getTime() + 10 * 60 * 1000),
          submittedAt: new Date(examDate.getTime() + 25 * 60 * 1000),
          gradedAt: new Date(examDate.getTime() + 60 * 60 * 1000)
        });

        await studentExam.save();
      }
    }

    console.log(`✅ Created ${additionalHistoricalExams.length} historical exams with student records`);
    console.log('🎉 Student data seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding student data:', error);
    throw error;
  }
};

export default studentSeedData;
