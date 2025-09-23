// Frontend/src/services/authService.js - Enhanced with better debugging
import api from './api';

export const authService = {
  // Enhanced login with detailed logging
  login: async (credentials) => {
    try {
      console.log('Attempting login with:', {
        email: credentials.email,
        hasPassword: !!credentials.password,
        passwordLength: credentials.password?.length
      });

      // Validate frontend data before sending
      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
      }

      if (credentials.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      const response = await api.post('/auth/login', {
        email: credentials.email.trim(),
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

  // Enhanced register with validation
  register: async (userData) => {
    try {
      console.log('Attempting registration with:', {
        ...userData,
        password: '[HIDDEN]'
      });

      // Frontend validation
      const errors = [];
      
      if (!userData.name || userData.name.trim().length < 2) {
        errors.push('Name must be at least 2 characters long');
      }
      
      if (!userData.email || !userData.email.includes('@')) {
        errors.push('Please enter a valid email address');
      }
      
      if (!userData.rollNumber || userData.rollNumber.trim().length === 0) {
        errors.push('Roll number is required');
      }
      
      if (!userData.password || userData.password.length < 6) {
        errors.push('Password must be at least 6 characters long');
      }
      
      if (errors.length > 0) {
        throw { success: false, message: errors.join(', ') };
      }

      const response = await api.post('/auth/register', userData);
      console.log('Registration response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error.response?.data || { success: false, message: 'Registration failed' };
    }
  },

  // Rest of your existing methods...
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
