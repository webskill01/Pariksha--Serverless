// Frontend/src/services/authService.js - Fixed for Roll Number + Password
import api from './api';

export const authService = {
  // Fixed login for Roll Number + Password
  login: async (credentials) => {
    try {
      console.log('Attempting login with:', {
        rollNumber: credentials.rollNumber,
        hasPassword: !!credentials.password,
        passwordLength: credentials.password?.length
      });

      // Validate frontend data before sending
      if (!credentials.rollNumber || !credentials.password) {
        throw new Error('Roll number and password are required');
      }

      if (credentials.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      const response = await api.post('/auth/login', {
        rollNumber: credentials.rollNumber.trim().toUpperCase(),
        password: credentials.password
      });

      console.log('Login response:', response.data);

      if (response.data && response.data.success) {
        const { token, user } = response.data;
        
        if (token && user) {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          window.dispatchEvent(new Event('storage'));
          return response.data;
        } else {
          throw new Error('Invalid response format from server');
        }
      } else {
        throw new Error(response.data?.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error details:', error);
      
      if (error.response?.data) {
        throw error.response.data;
      } else if (error.message) {
        throw { success: false, message: error.message };
      } else {
        throw { success: false, message: 'Login failed. Please try again.' };
      }
    }
  },

  // Register remains the same as it uses all fields
  register: async (userData) => {
    try {
      console.log('Attempting registration with:', {
        ...userData,
        password: '[HIDDEN]'
      });

      const response = await api.post('/auth/register', userData);
      console.log('Registration response:', response.data);
      
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

  getToken: () => {
    return localStorage.getItem('token');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};
