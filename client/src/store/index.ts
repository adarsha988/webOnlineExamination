import { configureStore } from '@reduxjs/toolkit';
// @ts-ignore
import authReducer from './authSlice';
// @ts-ignore
import examReducer from './examSlice';
// @ts-ignore
import attemptReducer from './attemptSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    exam: examReducer,
    attempt: attemptReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
