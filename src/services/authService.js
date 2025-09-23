// Frontend/src/services/authService.js - Fixed error handling
import api from './api';

export const authService = {
  login: async (credentials) => {
    try {
      console.log('🚀 Attempting login with:', {
        rollNumber: credentials.rollNumber,
        hasPassword: !!credentials.password,
        credentialsKeys: Object.keys(credentials)
      });

      // Validate before sending
      if (!credentials.rollNumber || !credentials.password) {
        throw new Error('Roll number and password are required');
      }

      const response = await api.post('/auth/login', {
        rollNumber: credentials.rollNumber.trim(),
        password: credentials.password
      });

      console.log('📡 Login response received:', {
        status: response.status,
        success: response.data?.success,
        hasToken: !!response.data?.token,
        hasUser: !!response.data?.user
      });

      // Check for successful response structure
      if (response.data && response.data.success === true) {
        const { token, user } = response.data;
        
        if (token && user) {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          window.dispatchEvent(new Event('storage'));
          console.log('✅ Login successful, user stored');
          return response.data;
        } else {
          console.error('❌ Missing token or user in response:', response.data);
          throw new Error('Login response missing required data');
        }
      } else {
        console.error('❌ Login failed:', response.data);
        throw new Error(response.data?.message || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      
      // Handle axios error responses
      if (error.response && error.response.data) {
        throw error.response.data;
      } 
      // Handle custom errors
      else if (error.message) {
        throw { success: false, message: error.message };
      } 
      // Handle unknown errors
      else {
        throw { success: false, message: 'Login failed. Please try again.' };
      }
    }
  },

  // ... rest of your methods remain the same
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error.response?.data || { success: false, message: 'Registration failed' };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('storage'));
    window.location.href = '/auth/login';
  },

  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },

  getToken: () => localStorage.getItem('token'),
  isAuthenticated: () => !!localStorage.getItem('token')
};
