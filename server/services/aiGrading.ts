// AI Grading Service for Online Examination System
// Supports both mock grading for demo and real OpenAI integration

interface GradingItem {
  qId: string;
  value: string;
  sampleAnswers: string[];
  marks: number;
}

interface GradingResult {
  qId: string;
  score: number;
  explanation: string;
}

// Mock grading function for demo purposes
function mockGradeShortAnswers(items: GradingItem[]): GradingResult[] {
  return items.map(item => {
    const { qId, value, sampleAnswers, marks } = item;
    
    if (!value || value.trim() === '') {
      return {
        qId,
        score: 0,
        explanation: 'No answer provided'
      };
    }

    // Simple case-insensitive substring matching against sample answers
    const userAnswer = value.toLowerCase().trim();
    let bestMatch = 0;
    let explanation = 'Answer does not match expected responses';

    for (const sampleAnswer of sampleAnswers) {
      if (!sampleAnswer) continue;
      
      const sample = sampleAnswer.toLowerCase().trim();
      
      // Exact match
      if (userAnswer === sample) {
        bestMatch = 1;
        explanation = 'Correct answer - exact match';
        break;
      }
      
      // Partial match - check if user answer contains key terms
      const sampleWords = sample.split(/\s+/).filter(word => word.length > 2);
      const userWords = userAnswer.split(/\s+/);
      const matchCount = sampleWords.filter(word => 
        userWords.some(userWord => userWord.includes(word) || word.includes(userWord))
      ).length;
      
      const matchRatio = matchCount / sampleWords.length;
      
      if (matchRatio > bestMatch) {
        bestMatch = matchRatio;
        if (matchRatio >= 0.8) {
          explanation = 'Correct answer - good match';
        } else if (matchRatio >= 0.5) {
          explanation = 'Partially correct - some key concepts identified';
        } else {
          explanation = 'Limited match - consider reviewing the material';
        }
      }
    }

    // Calculate score based on match quality
    let score = Math.round(bestMatch * marks);
    
    // Add some randomization for demo purposes (±10% variance)
    if (score > 0 && score < marks) {
      const variance = Math.random() * 0.2 - 0.1; // -10% to +10%
      score = Math.max(0, Math.min(marks, Math.round(score * (1 + variance))));
    }

    return {
      qId,
      score,
      explanation
    };
  });
}

// Real OpenAI grading function
async function openaiGradeShortAnswers(items: GradingItem[]): Promise<GradingResult[]> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    console.warn('OPENAI_API_KEY not found, falling back to mock grading');
    return mockGradeShortAnswers(items);
  }

  try {
    // Dynamic import for OpenAI (since it's ES modules)
    const { default: OpenAI } = await import('openai');
    
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    // Prepare the prompt for batch grading
    const gradingPrompt = `You are a concise grader for academic examinations. Grade each student answer by comparing it to the provided sample answers.

Return a JSON array with this exact format for each item:
[
  {
    "qId": "question_id",
    "score": number_between_0_and_max_marks,
    "explanation": "brief_explanation_under_50_words"
  }
]

Grading criteria:
- Full marks: Answer demonstrates complete understanding and matches sample answers
- Partial marks: Answer shows some understanding but may be incomplete or slightly incorrect
- Zero marks: Answer is incorrect, irrelevant, or empty

Items to grade:
${JSON.stringify(items, null, 2)}`;

    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert academic grader. Provide accurate, fair grading with constructive feedback. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: gradingPrompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // Lower temperature for more consistent grading
      max_tokens: 2000
    });

    const result = JSON.parse(response.choices[0].message.content || '[]');
    
    // Ensure the result is an array and validate structure
    const gradedItems = Array.isArray(result) ? result : result.grades || result.results || [];
    
    // Validate and sanitize the results
    return items.map(item => {
      const aiResult = gradedItems.find((r: any) => r.qId === item.qId);
      
      if (!aiResult) {
        console.warn(`No AI result found for question ${item.qId}, using fallback`);
        return mockGradeShortAnswers([item])[0];
      }

      // Ensure score is within valid range
      const score = Math.max(0, Math.min(item.marks, Math.round(aiResult.score || 0)));
      
      return {
        qId: item.qId,
        score,
        explanation: aiResult.explanation || 'Graded by AI'
      };
    });

  } catch (error: any) {
    console.error('OpenAI grading failed, falling back to mock grading:', error.message);
    return mockGradeShortAnswers(items);
  }
}

// Main grading function - switch between mock and real AI
export async function gradeShortAnswers(items: GradingItem[]): Promise<GradingResult[]> {
  // Check if we should use real AI grading
  const useRealAI = process.env.OPENAI_API_KEY && process.env.USE_AI_GRADING !== 'false';
  
  if (useRealAI) {
    console.log('Using OpenAI for grading short answers');
    return await openaiGradeShortAnswers(items);
  } else {
    console.log('Using mock grader for short answers');
    return mockGradeShortAnswers(items);
  }
}

// Export individual functions for testing
export { mockGradeShortAnswers, openaiGradeShortAnswers };

/*
Usage Examples:

// Mock grading example:
const mockItems = [
  {
    qId: 'q1',
    value: 'Water is H2O',
    sampleAnswers: ['H2O', 'Hydrogen and Oxygen', 'Two hydrogen atoms and one oxygen atom'],
    marks: 5
  }
];

// Real AI grading requires OPENAI_API_KEY environment variable
const results = await gradeShortAnswers(mockItems);
console.log(results);
// Output: [{ qId: 'q1', score: 5, explanation: 'Correct answer - exact match' }]
*/
