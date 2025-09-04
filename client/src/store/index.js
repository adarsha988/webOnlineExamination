import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import examReducer from './examSlice';
import attemptReducer from './attemptSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    exam: examReducer,
    attempt: attemptReducer,
  },
});

export default store;
