import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../api/axios';

// Async thunks for exam operations
export const fetchExams = createAsyncThunk(
  'exam/fetchExams',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiRequest('GET', '/api/exams');
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch exams');
    }
  }
);

export const fetchExamById = createAsyncThunk(
  'exam/fetchExamById',
  async (examId, { rejectWithValue }) => {
    try {
      const response = await apiRequest('GET', `/api/exams/${examId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch exam');
    }
  }
);

export const createExam = createAsyncThunk(
  'exam/createExam',
  async (examData, { rejectWithValue }) => {
    try {
      const response = await apiRequest('POST', '/api/exams', examData);
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create exam');
    }
  }
);

export const updateExam = createAsyncThunk(
  'exam/updateExam',
  async ({ examId, examData }, { rejectWithValue }) => {
    try {
      const response = await apiRequest('PUT', `/api/exams/${examId}`, examData);
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update exam');
    }
  }
);

export const deleteExam = createAsyncThunk(
  'exam/deleteExam',
  async (examId, { rejectWithValue }) => {
    try {
      await apiRequest('DELETE', `/api/exams/${examId}`);
      return examId;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete exam');
    }
  }
);

export const fetchExamQuestions = createAsyncThunk(
  'exam/fetchExamQuestions',
  async (examId, { rejectWithValue }) => {
    try {
      const response = await apiRequest('GET', `/api/exams/${examId}/questions`);
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch questions');
    }
  }
);

export const addQuestion = createAsyncThunk(
  'exam/addQuestion',
  async ({ examId, questionData }, { rejectWithValue }) => {
    try {
      const response = await apiRequest('POST', `/api/exams/${examId}/questions`, questionData);
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to add question');
    }
  }
);

export const assignExam = createAsyncThunk(
  'exam/assignExam',
  async ({ examId, studentIds }, { rejectWithValue }) => {
    try {
      const response = await apiRequest('POST', `/api/exams/${examId}/assign`, { studentIds });
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to assign exam');
    }
  }
);

const initialState = {
  exams: [],
  currentExam: null,
  questions: [],
  isLoading: false,
  error: null,
};

const examSlice = createSlice({
  name: 'exam',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentExam: (state) => {
      state.currentExam = null;
      state.questions = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Exams
      .addCase(fetchExams.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchExams.fulfilled, (state, action) => {
        state.isLoading = false;
        // Handle both array and object responses from API
        state.exams = Array.isArray(action.payload) ? action.payload : (action.payload.exams || []);
      })
      .addCase(fetchExams.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Exam by ID
      .addCase(fetchExamById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchExamById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentExam = action.payload;
      })
      .addCase(fetchExamById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create Exam
      .addCase(createExam.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createExam.fulfilled, (state, action) => {
        state.isLoading = false;
        state.exams.push(action.payload);
      })
      .addCase(createExam.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Exam
      .addCase(updateExam.fulfilled, (state, action) => {
        const index = state.exams.findIndex(exam => exam.id === action.payload.id);
        if (index !== -1) {
          state.exams[index] = action.payload;
        }
        if (state.currentExam?.id === action.payload.id) {
          state.currentExam = action.payload;
        }
      })
      // Delete Exam
      .addCase(deleteExam.fulfilled, (state, action) => {
        state.exams = state.exams.filter(exam => exam.id !== action.payload);
      })
      // Fetch Questions
      .addCase(fetchExamQuestions.fulfilled, (state, action) => {
        state.questions = action.payload;
      })
      // Add Question
      .addCase(addQuestion.fulfilled, (state, action) => {
        state.questions.push(action.payload);
      });
  },
});

export const { clearError, clearCurrentExam } = examSlice.actions;
export default examSlice.reducer;
