import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../api/axios';

// Async thunks for attempt operations
export const startAttempt = createAsyncThunk(
  'attempt/startAttempt',
  async (examId, { rejectWithValue }) => {
    try {
      const response = await apiRequest('POST', '/api/attempts', { examId });
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to start attempt');
    }
  }
);

export const saveAnswer = createAsyncThunk(
  'attempt/saveAnswer',
  async ({ attemptId, questionId, answer }, { rejectWithValue }) => {
    try {
      await apiRequest('PUT', `/api/attempts/${attemptId}`, {
        questionId,
        answer,
      });
      return { questionId, answer };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to save answer');
    }
  }
);

export const submitAttempt = createAsyncThunk(
  'attempt/submitAttempt',
  async (attemptId, { rejectWithValue }) => {
    try {
      const response = await apiRequest('POST', `/api/attempts/${attemptId}/submit`);
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to submit attempt');
    }
  }
);

export const fetchResults = createAsyncThunk(
  'attempt/fetchResults',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiRequest('GET', '/api/results/me');
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch results');
    }
  }
);

export const fetchResultById = createAsyncThunk(
  'attempt/fetchResultById',
  async (attemptId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/results/${attemptId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch result');
    }
  }
);

const initialState = {
  currentAttempt: null,
  answers: {},
  timeRemaining: null,
  isSubmitted: false,
  results: [],
  currentResult: null,
  isLoading: false,
  error: null,
};

const attemptSlice = createSlice({
  name: 'attempt',
  initialState,
  reducers: {
    updateAnswer: (state, action) => {
      const { questionId, answer } = action.payload;
      state.answers[questionId] = answer;
    },
    updateTimeRemaining: (state, action) => {
      state.timeRemaining = action.payload;
    },
    markQuestionForReview: (state, action) => {
      const { questionId } = action.payload;
      if (!state.markedQuestions) {
        state.markedQuestions = [];
      }
      if (!state.markedQuestions.includes(questionId)) {
        state.markedQuestions.push(questionId);
      }
    },
    unmarkQuestionForReview: (state, action) => {
      const { questionId } = action.payload;
      if (state.markedQuestions) {
        state.markedQuestions = state.markedQuestions.filter(id => id !== questionId);
      }
    },
    clearCurrentAttempt: (state) => {
      state.currentAttempt = null;
      state.answers = {};
      state.timeRemaining = null;
      state.isSubmitted = false;
      state.markedQuestions = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Start Attempt
      .addCase(startAttempt.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(startAttempt.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentAttempt = action.payload;
        state.timeRemaining = action.payload.timeRemaining;
        state.answers = action.payload.answers || {};
        state.isSubmitted = false;
      })
      .addCase(startAttempt.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Save Answer
      .addCase(saveAnswer.fulfilled, (state, action) => {
        const { questionId, answer } = action.payload;
        state.answers[questionId] = answer;
      })
      .addCase(saveAnswer.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Submit Attempt
      .addCase(submitAttempt.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(submitAttempt.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSubmitted = true;
        state.currentResult = action.payload;
      })
      .addCase(submitAttempt.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Results
      .addCase(fetchResults.fulfilled, (state, action) => {
        state.results = action.payload;
      })
      // Fetch Result by ID
      .addCase(fetchResultById.fulfilled, (state, action) => {
        state.currentResult = action.payload;
      });
  },
});

export const {
  updateAnswer,
  updateTimeRemaining,
  markQuestionForReview,
  unmarkQuestionForReview,
  clearCurrentAttempt,
  clearError,
} = attemptSlice.actions;

export default attemptSlice.reducer;
