// src/services/authService.js - Cleaned up version
import api from './api';

export const authService = {
  // Register new user
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

  // Login with roll number and password
  login: async (credentials) => {
    try {
      console.log('Attempting login with:', {
        rollNumber: credentials.rollNumber,
        hasPassword: !!credentials.password
      });

      // Validate frontend data
      if (!credentials.rollNumber || !credentials.password) {
        throw new Error('Roll number and password are required');
      }

      if (credentials.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      const response = await api.post('/auth/login', {
        rollNumber: credentials.rollNumber.trim(),
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

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('storage'));
    window.location.href = '/auth/login';
  },

  // Get current user
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },

  // Get token
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Check if authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  // Check if admin
  isAdmin: () => {
    const user = authService.getCurrentUser();
    const adminEmails = ["nitinemailss@gmail.com"];
    return user && adminEmails.includes(user.email);
  }

  // Removed getDashboard and deleteMyPaper - use userService instead
};
