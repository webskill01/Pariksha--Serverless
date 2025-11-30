// src/services/userService.js
import api from './api';
import { authService } from './authService';

export const userService = {
  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get('/user/profile');
      return response.data;
    } catch (error) {
      console.error('Profile fetch error:', error);
      
      if (error.response?.status === 401) {
        authService.logout();
        throw { success: false, message: 'Session expired. Please login again.' };
      }
      
      throw error.response?.data || { success: false, message: 'Failed to fetch profile' };
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/user/profile', profileData);
      
      // Update localStorage with new user data
      if (response.data?.success && response.data?.data) {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = {
          ...currentUser,
          ...response.data.data
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('storage')); // Trigger update
      }
      
      return response.data;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error.response?.data || { success: false, message: 'Failed to update profile' };
    }
  },

  // Get user dashboard data
  getDashboard: async (statusFilter = '') => {
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const response = await api.get('/user/dashboard', { params });
      return response.data;
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      
      if (error.response?.status === 401) {
        authService.logout();
        throw { success: false, message: 'Session expired. Please login again.' };
      }
      
      throw error.response?.data || { success: false, message: 'Failed to fetch dashboard data' };
    }
  },

  // Delete user's own paper
  deleteMyPaper: async (paperId) => {
    try {
      const response = await api.delete(`/user/paper/${paperId}`);
      return response.data;
    } catch (error) {
      console.error('Delete paper error:', error);
      throw error.response?.data || { success: false, message: 'Failed to delete paper' };
    }
  }
};
