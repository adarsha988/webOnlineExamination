import csv from 'csv-parser';
import XLSX from 'xlsx';
import fs from 'fs';
import { createObjectCsvWriter } from 'csv-writer';

// CSV/Excel import utility
export const importQuestions = async (filePath, fileType, createdBy, scope = 'private', sharedBankId = null) => {
  const results = [];
  const errors = [];

  try {
    let data = [];

    if (fileType === 'csv') {
      // Parse CSV file
      data = await new Promise((resolve, reject) => {
        const rows = [];
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (row) => rows.push(row))
          .on('end', () => resolve(rows))
          .on('error', reject);
      });
    } else if (fileType === 'xlsx' || fileType === 'xls') {
      // Parse Excel file
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet);
    } else {
      throw new Error('Unsupported file type. Only CSV and Excel files are supported.');
    }

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 1;

      try {
        // Validate required fields
        const requiredFields = ['subject', 'type', 'questionText'];
        const missingFields = requiredFields.filter(field => !row[field] || row[field].toString().trim() === '');
        
        if (missingFields.length > 0) {
          errors.push({
            row: rowNumber,
            error: `Missing required fields: ${missingFields.join(', ')}`,
            data: row
          });
          continue;
        }

        // Validate question type
        const validTypes = ['mcq', 'truefalse', 'short', 'long'];
        if (!validTypes.includes(row.type.toLowerCase())) {
          errors.push({
            row: rowNumber,
            error: `Invalid question type: ${row.type}. Must be one of: ${validTypes.join(', ')}`,
            data: row
          });
          continue;
        }

        // Validate difficulty
        const validDifficulties = ['easy', 'medium', 'hard'];
        const difficulty = row.difficulty ? row.difficulty.toLowerCase() : 'medium';
        if (!validDifficulties.includes(difficulty)) {
          errors.push({
            row: rowNumber,
            error: `Invalid difficulty: ${row.difficulty}. Must be one of: ${validDifficulties.join(', ')}`,
            data: row
          });
          continue;
        }

        // Process options for MCQ and True/False
        let options = [];
        let correctAnswer = row.correctAnswer;

        if (row.type.toLowerCase() === 'mcq') {
          // Parse options from columns or comma-separated string
          if (row.options) {
            options = row.options.split(',').map(opt => opt.trim()).filter(opt => opt);
          } else {
            // Try to get options from option1, option2, etc. columns
            const optionColumns = ['option1', 'option2', 'option3', 'option4', 'option5'];
            options = optionColumns
              .map(col => row[col])
              .filter(opt => opt && opt.toString().trim())
              .map(opt => opt.toString().trim());
          }

          if (options.length < 2) {
            errors.push({
              row: rowNumber,
              error: 'MCQ questions must have at least 2 options',
              data: row
            });
            continue;
          }

          // Validate correct answer is one of the options
          if (correctAnswer && !options.includes(correctAnswer.toString().trim())) {
            errors.push({
              row: rowNumber,
              error: 'Correct answer must be one of the provided options',
              data: row
            });
            continue;
          }
        } else if (row.type.toLowerCase() === 'truefalse') {
          options = ['True', 'False'];
          if (correctAnswer && !['True', 'False', 'true', 'false'].includes(correctAnswer.toString())) {
            errors.push({
              row: rowNumber,
              error: 'True/False questions must have True or False as correct answer',
              data: row
            });
            continue;
          }
          correctAnswer = correctAnswer ? (correctAnswer.toString().toLowerCase() === 'true' ? 'True' : 'False') : null;
        }

        // Process tags
        let tags = [];
        if (row.tags) {
          tags = row.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        }

        // Create question object
        const questionData = {
          createdBy,
          scope,
          subject: row.subject.toString().trim(),
          difficulty,
          type: row.type.toLowerCase(),
          questionText: row.questionText.toString().trim(),
          explanation: row.explanation ? row.explanation.toString().trim() : '',
          marks: row.marks ? parseFloat(row.marks) : 1,
          tags,
          options: options.length > 0 ? options : undefined,
          correctAnswer,
          status: scope === 'shared' ? 'suggested' : 'approved'
        };

        if (scope === 'shared' && sharedBankId) {
          questionData.sharedBankId = sharedBankId;
        }

        // Validate marks
        if (isNaN(questionData.marks) || questionData.marks < 0) {
          questionData.marks = 1;
        }

        results.push(questionData);

      } catch (error) {
        errors.push({
          row: rowNumber,
          error: `Processing error: ${error.message}`,
          data: row
        });
      }
    }

    // Clean up uploaded file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return {
      success: true,
      totalRows: data.length,
      validQuestions: results.length,
      errors: errors.length,
      questions: results,
      errorDetails: errors
    };

  } catch (error) {
    // Clean up uploaded file on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    throw new Error(`Import failed: ${error.message}`);
  }
};

// CSV export utility
export const exportQuestionsToCSV = async (questions, filePath) => {
  try {
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'subject', title: 'Subject' },
        { id: 'difficulty', title: 'Difficulty' },
        { id: 'type', title: 'Type' },
        { id: 'questionText', title: 'Question Text' },
        { id: 'option1', title: 'Option 1' },
        { id: 'option2', title: 'Option 2' },
        { id: 'option3', title: 'Option 3' },
        { id: 'option4', title: 'Option 4' },
        { id: 'option5', title: 'Option 5' },
        { id: 'correctAnswer', title: 'Correct Answer' },
        { id: 'explanation', title: 'Explanation' },
        { id: 'marks', title: 'Marks' },
        { id: 'tags', title: 'Tags' },
        { id: 'status', title: 'Status' },
        { id: 'createdBy', title: 'Created By' },
        { id: 'createdAt', title: 'Created At' }
      ]
    });

    const csvData = questions.map(question => {
      const row = {
        subject: question.subject,
        difficulty: question.difficulty,
        type: question.type,
        questionText: question.questionText,
        correctAnswer: Array.isArray(question.correctAnswer) 
          ? question.correctAnswer.join('; ') 
          : question.correctAnswer || '',
        explanation: question.explanation || '',
        marks: question.marks,
        tags: question.tags ? question.tags.join(', ') : '',
        status: question.status,
        createdBy: question.createdBy?.name || question.createdBy,
        createdAt: question.createdAt ? new Date(question.createdAt).toISOString() : ''
      };

      // Add options as separate columns
      if (question.options && question.options.length > 0) {
        question.options.forEach((option, index) => {
          if (index < 5) { // Limit to 5 options
            row[`option${index + 1}`] = option;
          }
        });
      }

      return row;
    });

    await csvWriter.writeRecords(csvData);
    return filePath;

  } catch (error) {
    throw new Error(`CSV export failed: ${error.message}`);
  }
};

// Excel export utility
export const exportQuestionsToExcel = async (questions, filePath) => {
  try {
    const worksheetData = questions.map(question => {
      const row = {
        'Subject': question.subject,
        'Difficulty': question.difficulty,
        'Type': question.type,
        'Question Text': question.questionText,
        'Correct Answer': Array.isArray(question.correctAnswer) 
          ? question.correctAnswer.join('; ') 
          : question.correctAnswer || '',
        'Explanation': question.explanation || '',
        'Marks': question.marks,
        'Tags': question.tags ? question.tags.join(', ') : '',
        'Status': question.status,
        'Created By': question.createdBy?.name || question.createdBy,
        'Created At': question.createdAt ? new Date(question.createdAt).toISOString() : ''
      };

      // Add options as separate columns
      if (question.options && question.options.length > 0) {
        question.options.forEach((option, index) => {
          if (index < 5) { // Limit to 5 options
            row[`Option ${index + 1}`] = option;
          }
        });
      }

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions');

    // Auto-size columns
    const colWidths = [];
    const headers = Object.keys(worksheetData[0] || {});
    headers.forEach((header, index) => {
      const maxLength = Math.max(
        header.length,
        ...worksheetData.map(row => (row[header] || '').toString().length)
      );
      colWidths[index] = { width: Math.min(maxLength + 2, 50) };
    });
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, filePath);
    return filePath;

  } catch (error) {
    throw new Error(`Excel export failed: ${error.message}`);
  }
};

// Template generation utilities
export const generateCSVTemplate = (filePath) => {
  const templateData = [
    {
      subject: 'Mathematics',
      difficulty: 'medium',
      type: 'mcq',
      questionText: 'What is 2 + 2?',
      option1: '3',
      option2: '4',
      option3: '5',
      option4: '6',
      correctAnswer: '4',
      explanation: 'Basic addition: 2 + 2 = 4',
      marks: '1',
      tags: 'arithmetic, basic'
    },
    {
      subject: 'Science',
      difficulty: 'easy',
      type: 'truefalse',
      questionText: 'Water boils at 100°C at sea level.',
      correctAnswer: 'True',
      explanation: 'Water boils at 100°C (212°F) at standard atmospheric pressure.',
      marks: '1',
      tags: 'physics, temperature'
    },
    {
      subject: 'English',
      difficulty: 'hard',
      type: 'short',
      questionText: 'Define the term "metaphor" and provide an example.',
      correctAnswer: 'A metaphor is a figure of speech that compares two unlike things without using "like" or "as". Example: "Time is money."',
      explanation: 'Metaphors create implicit comparisons to enhance understanding.',
      marks: '2',
      tags: 'literature, figures of speech'
    }
  ];

  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: 'subject', title: 'subject' },
      { id: 'difficulty', title: 'difficulty' },
      { id: 'type', title: 'type' },
      { id: 'questionText', title: 'questionText' },
      { id: 'option1', title: 'option1' },
      { id: 'option2', title: 'option2' },
      { id: 'option3', title: 'option3' },
      { id: 'option4', title: 'option4' },
      { id: 'option5', title: 'option5' },
      { id: 'correctAnswer', title: 'correctAnswer' },
      { id: 'explanation', title: 'explanation' },
      { id: 'marks', title: 'marks' },
      { id: 'tags', title: 'tags' }
    ]
  });

  return csvWriter.writeRecords(templateData);
};

export const generateExcelTemplate = (filePath) => {
  const templateData = [
    {
      'subject': 'Mathematics',
      'difficulty': 'medium',
      'type': 'mcq',
      'questionText': 'What is 2 + 2?',
      'option1': '3',
      'option2': '4',
      'option3': '5',
      'option4': '6',
      'option5': '',
      'correctAnswer': '4',
      'explanation': 'Basic addition: 2 + 2 = 4',
      'marks': 1,
      'tags': 'arithmetic, basic'
    },
    {
      'subject': 'Science',
      'difficulty': 'easy',
      'type': 'truefalse',
      'questionText': 'Water boils at 100°C at sea level.',
      'option1': '',
      'option2': '',
      'option3': '',
      'option4': '',
      'option5': '',
      'correctAnswer': 'True',
      'explanation': 'Water boils at 100°C (212°F) at standard atmospheric pressure.',
      'marks': 1,
      'tags': 'physics, temperature'
    },
    {
      'subject': 'English',
      'difficulty': 'hard',
      'type': 'short',
      'questionText': 'Define the term "metaphor" and provide an example.',
      'option1': '',
      'option2': '',
      'option3': '',
      'option4': '',
      'option5': '',
      'correctAnswer': 'A metaphor is a figure of speech that compares two unlike things without using "like" or "as". Example: "Time is money."',
      'explanation': 'Metaphors create implicit comparisons to enhance understanding.',
      'marks': 2,
      'tags': 'literature, figures of speech'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Question Template');

  // Add instructions sheet
  const instructions = [
    ['Question Import Template Instructions'],
    [''],
    ['Required Fields:'],
    ['- subject: Subject name (e.g., Mathematics, Science, English)'],
    ['- difficulty: easy, medium, or hard'],
    ['- type: mcq, truefalse, short, or long'],
    ['- questionText: The question text'],
    [''],
    ['Optional Fields:'],
    ['- option1-option5: For MCQ questions (at least 2 required)'],
    ['- correctAnswer: Correct answer (required for MCQ and True/False)'],
    ['- explanation: Explanation of the answer'],
    ['- marks: Points for the question (default: 1)'],
    ['- tags: Comma-separated tags'],
    [''],
    ['Question Types:'],
    ['- mcq: Multiple choice (requires options and correctAnswer)'],
    ['- truefalse: True/False (correctAnswer should be True or False)'],
    ['- short: Short answer'],
    ['- long: Long answer/essay'],
    [''],
    ['Notes:'],
    ['- For MCQ: correctAnswer must match one of the options exactly'],
    ['- For True/False: options are automatically set to True/False'],
    ['- Tags should be comma-separated (e.g., "math, algebra, equations")'],
    ['- Leave option fields empty for non-MCQ questions']
  ];

  const instructionSheet = XLSX.utils.aoa_to_sheet(instructions);
  XLSX.utils.book_append_sheet(workbook, instructionSheet, 'Instructions');

  XLSX.writeFile(workbook, filePath);
  return filePath;
};
