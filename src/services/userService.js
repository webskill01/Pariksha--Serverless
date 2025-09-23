// Frontend/src/services/userService.js - Dedicated user service
// Frontend/src/services/userService.js - Dedicated user service
import api from './api';
import { authService } from './authService';

export const userService = {
  // Get user dashboard data with filtering
  getDashboard: async (statusFilter = '') => {
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const response = await api.get('/users/me/dashboard', { params });
      
      console.log('Dashboard API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      
      // Handle authentication errors
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
      const response = await api.delete(`/users/me/paper/${paperId}`);
      return response.data;
    } catch (error) {
      console.error('Delete paper error:', error);
      throw error.response?.data || { success: false, message: 'Failed to delete paper' };
    }
  },

  // Update user profile (future feature)
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/users/me/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to update profile' };
    }
  }
};
