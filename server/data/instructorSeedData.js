import mongoose from 'mongoose';
import Exam from '../models/exam.model.js';
import Question from '../models/question.model.js';
import User from '../models/user.model.js';
import SharedBank from '../models/sharedBank.model.js';

export const seedInstructorData = async () => {
  try {
    console.log('🌱 Starting instructor data seeding...');

    // Get existing users
    const instructors = await User.find({ role: 'instructor' }).limit(3);
    const students = await User.find({ role: 'student' }).limit(10);
    
    if (instructors.length === 0) {
      console.log('⚠️  No instructors found, creating sample instructors...');
      const sampleInstructors = [
        {
          name: 'Dr. John Smith',
          email: 'instructor@example.com',
          password: '$2b$10$rQJ8kHWZ9Y0KQqQqQqQqQuQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQ', // password123
          role: 'instructor',
          departmentId: 'CS001'
        },
        {
          name: 'Prof. Jane Doe',
          email: 'inst@example.com',
          password: '$2b$10$rQJ8kHWZ9Y0KQqQqQqQqQuQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQ', // password123
          role: 'instructor',
          departmentId: 'CS002'
        }
      ];
      
      for (const instructorData of sampleInstructors) {
        const existingInstructor = await User.findOne({ email: instructorData.email });
        if (!existingInstructor) {
          const instructor = new User(instructorData);
          await instructor.save();
          instructors.push(instructor);
          console.log(`✅ Created instructor: ${instructorData.email}`);
        }
      }
    }

    // Ensure inst@example.com exists
    let targetInstructor = await User.findOne({ email: 'inst@example.com' });
    if (!targetInstructor) {
      console.log('⚠️  Creating missing instructor: inst@example.com');
      targetInstructor = new User({
        name: 'Prof. Jane Doe',
        email: 'inst@example.com',
        password: '$2b$10$rQJ8kHWZ9Y0KQqQqQqQqQuQqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQ', // password123
        role: 'instructor',
        departmentId: 'CS002'
      });
      await targetInstructor.save();
      console.log('✅ Created instructor: inst@example.com');
    }

    const instructor = targetInstructor || instructors[0];

    // Check if exams already exist
    const existingExams = await Exam.countDocuments({ instructorId: instructor._id });
    if (existingExams === 0) {
      console.log('📚 Creating sample exams...');
      
      const sampleExams = [
        {
          title: 'Data Structures Midterm',
          description: 'Comprehensive test on arrays, linked lists, and trees',
          subject: 'Computer Science',
          duration: 120,
          totalMarks: 100,
          passingMarks: 60,
          createdBy: instructor._id,
          instructorId: instructor._id,
          status: 'completed',
          scheduledDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
          endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
          attempts: students.slice(0, 5).map(student => ({
            student: student._id,
            score: Math.floor(Math.random() * 40) + 60, // 60-100
            startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            endTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
            answers: []
          }))
        },
        {
          title: 'Algorithm Analysis Quiz',
          description: 'Quick assessment on time complexity and sorting algorithms',
          subject: 'Computer Science',
          duration: 60,
          totalMarks: 50,
          passingMarks: 30,
          createdBy: instructor._id,
          instructorId: instructor._id,
          status: 'completed',
          scheduledDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          endDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000),
          attempts: students.slice(0, 8).map(student => ({
            student: student._id,
            score: Math.floor(Math.random() * 30) + 20, // 20-50
            startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            endTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000),
            answers: []
          }))
        },
        {
          title: 'Database Design Final',
          description: 'Final examination covering normalization, SQL, and database optimization',
          subject: 'Database Systems',
          duration: 180,
          totalMarks: 150,
          passingMarks: 90,
          createdBy: instructor._id,
          instructorId: instructor._id,
          status: 'published',
          scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
          attempts: []
        },
        {
          title: 'Web Development Project Review',
          description: 'Assessment of final web development projects',
          subject: 'Web Development',
          duration: 90,
          totalMarks: 80,
          passingMarks: 48,
          createdBy: instructor._id,
          instructorId: instructor._id,
          status: 'published',
          scheduledDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 1.5 * 60 * 60 * 1000),
          attempts: []
        },
        {
          title: 'Software Engineering Principles',
          description: 'Test on SDLC, design patterns, and best practices',
          subject: 'Software Engineering',
          duration: 100,
          totalMarks: 75,
          passingMarks: 45,
          createdBy: instructor._id,
          instructorId: instructor._id,
          status: 'draft',
          scheduledDate: null,
          endDate: null,
          attempts: []
        }
      ];

      await Exam.insertMany(sampleExams);
      console.log('✅ Sample exams created successfully');
    } else {
      console.log('⏭️  Exams already exist');
    }

    // Check if questions already exist for this instructor
    const existingQuestions = await Question.countDocuments({ createdBy: instructor._id });
    if (existingQuestions === 0) {
      console.log('❓ Creating sample questions...');
      
      const sampleQuestions = [
        {
          createdBy: instructor._id,
          scope: 'private',
          subject: 'Computer Science',
          difficulty: 'medium',
          type: 'mcq',
          questionText: 'What is the time complexity of binary search in a sorted array?',
          options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
          correctAnswer: 'O(log n)',
          explanation: 'Binary search divides the search space in half with each comparison.',
          tags: ['algorithms', 'complexity', 'search'],
          status: 'approved',
          marks: 5
        },
        {
          createdBy: instructor._id,
          scope: 'private',
          subject: 'Computer Science',
          difficulty: 'easy',
          type: 'truefalse',
          questionText: 'Arrays in most programming languages are zero-indexed.',
          correctAnswer: 'true',
          explanation: 'Most programming languages use zero-based indexing for arrays.',
          tags: ['arrays', 'indexing'],
          status: 'approved',
          marks: 2
        },
        {
          createdBy: instructor._id,
          scope: 'private',
          subject: 'Database Systems',
          difficulty: 'hard',
          type: 'short',
          questionText: 'Explain the difference between INNER JOIN and LEFT JOIN in SQL.',
          correctAnswer: 'INNER JOIN returns only matching records from both tables, while LEFT JOIN returns all records from the left table and matching records from the right table.',
          explanation: 'Understanding JOIN types is crucial for database queries.',
          tags: ['sql', 'joins', 'database'],
          status: 'approved',
          marks: 10
        },
        {
          createdBy: instructor._id,
          scope: 'private',
          subject: 'Web Development',
          difficulty: 'medium',
          type: 'mcq',
          questionText: 'Which HTTP method is used to update existing data?',
          options: ['GET', 'POST', 'PUT', 'DELETE'],
          correctAnswer: 'PUT',
          explanation: 'PUT is used for updating existing resources in RESTful APIs.',
          tags: ['http', 'rest', 'api'],
          status: 'approved',
          marks: 3
        },
        {
          createdBy: instructor._id,
          scope: 'private',
          subject: 'Software Engineering',
          difficulty: 'hard',
          type: 'long',
          questionText: 'Describe the Model-View-Controller (MVC) architectural pattern and its benefits.',
          correctAnswer: 'MVC separates application logic into three components: Model (data), View (presentation), and Controller (logic). Benefits include separation of concerns, easier testing, and better maintainability.',
          explanation: 'MVC is a fundamental architectural pattern in software development.',
          tags: ['mvc', 'architecture', 'design-patterns'],
          status: 'approved',
          marks: 15
        },
        {
          createdBy: instructor._id,
          scope: 'private',
          subject: 'Computer Science',
          difficulty: 'easy',
          type: 'mcq',
          questionText: 'What does CPU stand for?',
          options: ['Central Processing Unit', 'Computer Processing Unit', 'Central Program Unit', 'Computer Program Unit'],
          correctAnswer: 'Central Processing Unit',
          explanation: 'CPU is the primary component that executes instructions.',
          tags: ['hardware', 'basics'],
          status: 'approved',
          marks: 2
        },
        {
          createdBy: instructor._id,
          scope: 'private',
          subject: 'Database Systems',
          difficulty: 'medium',
          type: 'short',
          questionText: 'What is database normalization and why is it important?',
          correctAnswer: 'Database normalization is the process of organizing data to reduce redundancy and improve data integrity.',
          explanation: 'Normalization helps eliminate data anomalies and ensures consistency.',
          tags: ['normalization', 'database-design'],
          status: 'approved',
          marks: 8
        },
        {
          createdBy: instructor._id,
          scope: 'private',
          subject: 'Web Development',
          difficulty: 'easy',
          type: 'truefalse',
          questionText: 'HTML stands for HyperText Markup Language.',
          correctAnswer: 'true',
          explanation: 'HTML is the standard markup language for web pages.',
          tags: ['html', 'web', 'basics'],
          status: 'approved',
          marks: 1
        },
        {
          createdBy: instructor._id,
          scope: 'private',
          subject: 'Computer Science',
          difficulty: 'hard',
          type: 'mcq',
          questionText: 'Which data structure is best for implementing a priority queue?',
          options: ['Array', 'Linked List', 'Binary Heap', 'Hash Table'],
          correctAnswer: 'Binary Heap',
          explanation: 'Binary heaps provide efficient insertion and extraction of priority elements.',
          tags: ['data-structures', 'priority-queue', 'heap'],
          status: 'approved',
          marks: 7
        },
        {
          createdBy: instructor._id,
          scope: 'private',
          subject: 'Software Engineering',
          difficulty: 'medium',
          type: 'short',
          questionText: 'What is the purpose of version control systems like Git?',
          correctAnswer: 'Version control systems track changes to code, enable collaboration, and maintain project history.',
          explanation: 'Git helps developers manage code changes and collaborate effectively.',
          tags: ['git', 'version-control', 'collaboration'],
          status: 'approved',
          marks: 6
        }
      ];

      await Question.insertMany(sampleQuestions);
      console.log('✅ Sample questions created successfully');
    } else {
      console.log('⏭️  Questions already exist');
    }

    // Create shared bank and shared questions
    let sharedBank = await SharedBank.findOne({ name: 'Computer Science Shared Bank' });
    if (!sharedBank) {
      console.log('🤝 Creating shared question bank...');
      
      sharedBank = new SharedBank({
        name: 'Computer Science Shared Bank',
        description: 'Collaborative question bank for Computer Science department',
        departmentId: 'CS001',
        subject: 'Computer Science',
        owners: [instructor._id],
        collaborators: [],
        settings: {
          requireApproval: true,
          allowSuggestions: true,
          autoApproveOwners: true,
          visibility: 'department'
        },
        stats: {
          totalQuestions: 0,
          approvedQuestions: 0,
          pendingQuestions: 0,
          totalCollaborators: 0
        }
      });
      
      await sharedBank.save();
      console.log('✅ Shared bank created successfully');
    }

    // Check if shared questions exist
    const existingSharedQuestions = await Question.countDocuments({ 
      scope: 'shared', 
      sharedBankId: sharedBank._id 
    });
    
    if (existingSharedQuestions === 0) {
      console.log('🌐 Creating shared questions...');
      
      const sharedQuestions = [
        {
          createdBy: instructor._id,
          scope: 'shared',
          sharedBankId: sharedBank._id,
          subject: 'Computer Science',
          difficulty: 'medium',
          type: 'mcq',
          questionText: 'What is the worst-case time complexity of QuickSort?',
          options: ['O(n log n)', 'O(n²)', 'O(n)', 'O(log n)'],
          correctAnswer: 'O(n²)',
          explanation: 'QuickSort has O(n²) worst-case when pivot is always the smallest or largest element.',
          tags: ['algorithms', 'sorting', 'complexity'],
          status: 'approved',
          marks: 5
        },
        {
          createdBy: instructor._id,
          scope: 'shared',
          sharedBankId: sharedBank._id,
          subject: 'Computer Science',
          difficulty: 'easy',
          type: 'truefalse',
          questionText: 'A stack follows Last In First Out (LIFO) principle.',
          correctAnswer: 'true',
          explanation: 'Stacks are LIFO data structures where the last element added is the first to be removed.',
          tags: ['data-structures', 'stack', 'lifo'],
          status: 'approved',
          marks: 2
        },
        {
          createdBy: instructor._id,
          scope: 'shared',
          sharedBankId: sharedBank._id,
          subject: 'Computer Science',
          difficulty: 'hard',
          type: 'short',
          questionText: 'Explain the concept of dynamic programming and provide an example.',
          correctAnswer: 'Dynamic programming solves complex problems by breaking them into simpler subproblems and storing results. Example: Fibonacci sequence calculation.',
          explanation: 'DP optimizes recursive solutions by avoiding redundant calculations.',
          tags: ['dynamic-programming', 'optimization', 'algorithms'],
          status: 'approved',
          marks: 12
        },
        {
          createdBy: instructor._id,
          scope: 'shared',
          sharedBankId: sharedBank._id,
          subject: 'Computer Science',
          difficulty: 'medium',
          type: 'mcq',
          questionText: 'Which of the following is NOT a characteristic of Object-Oriented Programming?',
          options: ['Encapsulation', 'Inheritance', 'Polymorphism', 'Compilation'],
          correctAnswer: 'Compilation',
          explanation: 'Compilation is a process, not an OOP characteristic. The main OOP principles are encapsulation, inheritance, and polymorphism.',
          tags: ['oop', 'programming-paradigms'],
          status: 'approved',
          marks: 4
        },
        {
          createdBy: instructor._id,
          scope: 'shared',
          sharedBankId: sharedBank._id,
          subject: 'Computer Science',
          difficulty: 'easy',
          type: 'mcq',
          questionText: 'What does RAM stand for?',
          options: ['Random Access Memory', 'Read Access Memory', 'Rapid Access Memory', 'Real Access Memory'],
          correctAnswer: 'Random Access Memory',
          explanation: 'RAM allows data to be accessed randomly, not sequentially.',
          tags: ['hardware', 'memory', 'basics'],
          status: 'approved',
          marks: 2
        }
      ];

      await Question.insertMany(sharedQuestions);
      
      // Update shared bank stats
      await SharedBank.findByIdAndUpdate(sharedBank._id, {
        'stats.totalQuestions': sharedQuestions.length,
        'stats.approvedQuestions': sharedQuestions.length,
        'stats.pendingQuestions': 0
      });
      
      console.log('✅ Shared questions created successfully');
    } else {
      console.log('⏭️  Shared questions already exist');
    }

    console.log('🎉 Instructor data seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding instructor data:', error);
    throw error;
  }
};
