import { create } from 'zustand';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';
const TOKEN_KEY = 'sdd_token';

// Create axios instance with interceptor for auth token
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add request interceptor to include token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors and network errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors (no response from server)
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        error.message = 'Request timeout. Please check if the backend server is running.';
      } else if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        error.message = 'Network Error: Cannot connect to backend server. Please ensure the backend is running on http://localhost:8000';
      }
      // Don't redirect on network errors, just reject with better message
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401) {
      // Token expired or invalid, logout user
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  // Initialize auth state from localStorage
  init: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      set({ token, isAuthenticated: true });
      // Try to fetch user info
      get().getCurrentUser();
    } else {
      set({ isLoading: false });
    }
  },

  // Login
  login: async (email, password) => {
    try {
      const response = await api.post('/api/v1/auth/login-json', {
        email,
        password,
      });
      
      const { access_token, user } = response.data;
      localStorage.setItem(TOKEN_KEY, access_token);
      
      set({
        token: access_token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      let message = 'Login failed';
      
      if (error.response) {
        message = error.response.data?.detail || error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        message = 'Cannot connect to server. Please check if the backend is running.';
      } else {
        message = error.message || 'Login failed';
      }
      
      return { success: false, error: message };
    }
  },

  // Signup
  signup: async (email, fullName, password) => {
    try {
      const response = await api.post('/api/v1/auth/signup', {
        email,
        full_name: fullName,
        password,
      });
      
      // After signup, automatically login
      return await get().login(email, password);
    } catch (error) {
      console.error('Signup error:', error);
      let message = 'Signup failed';
      
      if (error.response) {
        // Server responded with error
        message = error.response.data?.detail || error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request made but no response (backend might be down)
        message = 'Cannot connect to server. Please check if the backend is running.';
      } else {
        // Something else happened
        message = error.message || 'Signup failed';
      }
      
      return { success: false, error: message };
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/api/v1/auth/me');
      set({ user: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      // Token might be invalid, logout
      get().logout();
      return null;
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  // Check if user is admin
  isAdmin: () => {
    const { user } = get();
    return user?.role === 'admin';
  },

  // Update user data
  setUser: (userData) => {
    set({ user: userData });
  },
}));

export default useAuthStore;
export { api };

