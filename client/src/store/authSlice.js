import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '../api/axios';

// Async thunks for auth operations
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      console.log('🔐 LOGIN ATTEMPT:', { email, password: '***' });
      const response = await apiRequest('POST', '/api/auth/login', { email, password });
      console.log('📡 LOGIN RESPONSE STATUS:', response.status);
      
      const data = await response.json();
      console.log('📦 LOGIN RESPONSE DATA:', data);
      
      const { user, token } = data;
      localStorage.setItem('token', token);
      console.log('✅ LOGIN SUCCESS - User:', user, 'Token stored:', !!token);
      return { user, token };
    } catch (error) {
      console.error('❌ LOGIN ERROR:', error);
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ email, password, name, role = 'student' }, { rejectWithValue }) => {
    try {
      const response = await apiRequest('POST', '/api/auth/register', { email, password, name, role });
      const data = await response.json();
      const { user, token } = data;
      localStorage.setItem('token', token);
      return { user, token };
    } catch (error) {
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // Silent rejection - no error message for missing token on initial load
        return rejectWithValue(null);
      }
      
      const response = await apiRequest('GET', '/api/auth/me');
      const data = await response.json();
      return { user: data, token };
    } catch (error) {
      localStorage.removeItem('token');
      return rejectWithValue('Authentication failed');
    }
  }
);

// Logout async thunk - calls server and clears local storage (prevents double execution)
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue, getState }) => {
    const state = getState();
    
    // Prevent double execution if already logging out
    if (state.auth.isLoading) {
      console.log('🔄 LOGOUT ALREADY IN PROGRESS - Skipping duplicate request');
      return { success: true };
    }
    
    console.log('🚪 LOGOUT INITIATED - Starting logout process');
    
    try {
      console.log('📡 CALLING SERVER LOGOUT - Making API request to /api/auth/logout');
      
      // Call server logout endpoint
      const response = await apiRequest('POST', '/api/auth/logout');
      console.log('✅ SERVER LOGOUT SUCCESS - Response:', response.status);
      
      // Clear token from localStorage regardless of server response
      const tokenBefore = localStorage.getItem('token');
      localStorage.removeItem('token');
      const tokenAfter = localStorage.getItem('token');
      
      console.log('🧹 TOKEN CLEANUP - Before:', !!tokenBefore, 'After:', !!tokenAfter);
      console.log('🎉 LOGOUT COMPLETE - Success');
      
      return { success: true };
    } catch (error) {
      console.error('❌ SERVER LOGOUT FAILED - Error details:', error);
      console.error('📋 ERROR STACK:', error.stack);
      
      // Even if server call fails, clear local storage for UX
      const tokenBefore = localStorage.getItem('token');
      localStorage.removeItem('token');
      const tokenAfter = localStorage.getItem('token');
      
      console.log('🧹 FALLBACK TOKEN CLEANUP - Before:', !!tokenBefore, 'After:', !!tokenAfter);
      console.warn('⚠️ LOGOUT PARTIAL SUCCESS - Server failed but local cleanup done');
      
      return { success: true };
    }
  }
);

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  error: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        console.log('⏳ LOGIN PENDING - Setting loading state');
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        console.log('🎉 LOGIN FULFILLED - Redux state update:', action.payload);
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
        console.log('📊 NEW AUTH STATE:', { 
          isAuthenticated: state.isAuthenticated, 
          user: state.user,
          hasToken: !!state.token 
        });
      })
      .addCase(loginUser.rejected, (state, action) => {
        console.log('💥 LOGIN REJECTED:', action.payload);
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.isLoading = false;
        // Only set error if it's not a silent rejection (null payload)
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      // Logout
      .addCase(logoutUser.pending, (state) => {
        console.log('⏳ LOGOUT PENDING - Redux state: loading started, current loading:', state.isLoading);
        state.isLoading = true;
        console.log('📊 LOGOUT PENDING STATE - isLoading now:', state.isLoading);
      })
      .addCase(logoutUser.fulfilled, (state) => {
        console.log('🎯 LOGOUT FULFILLED - Redux state: clearing user data');
        console.log('📊 BEFORE CLEAR - user:', !!state.user, 'token:', !!state.token, 'isAuth:', state.isAuthenticated);
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        console.log('📊 AFTER CLEAR - user:', !!state.user, 'token:', !!state.token, 'isAuth:', state.isAuthenticated);
      })
      .addCase(logoutUser.rejected, (state, action) => {
        console.log('💥 LOGOUT REJECTED - Error:', action.payload);
        state.isLoading = false;
        state.error = action.payload;
        console.log('📊 LOGOUT REJECTED STATE - isLoading:', state.isLoading, 'error:', state.error);
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
