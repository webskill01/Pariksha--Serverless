// src/services/adminService.js - Fixed endpoints
import api from './api';
import { toast } from 'react-toastify';

export const adminService = {
  // Get admin dashboard stats
  getAdminStats: async () => {
    try {
      const response = await api.get('/admin/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch admin stats' };
    }
  },

  // Get all papers for admin (with filtering)
  getAllPapers: async (filters = {}) => {
    try {
      const response = await api.get('/admin/papers', { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch papers' };
    }
  },

  // Get pending papers only - FIXED ENDPOINT
  getPendingPapers: async () => {
    try {
      const response = await api.get('/admin/pending'); // Fixed: removed '-papers'
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch pending papers' };
    }
  },

  // Preview paper (get paper details for admin)
  previewPaper: async (paperId) => {
    try {
      const response = await api.get(`/admin/papers/${paperId}/preview`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to preview paper' };
    }
  },

  // Admin download paper (for review before approval) - FIXED ENDPOINT
  downloadPaperForPreview: async (paperId) => {
    try {
      const response = await api.post(`/admin/papers/${paperId}/preview`); // Fixed: preview.js handles POST
      
      if (response.data?.success && response.data?.data?.fileUrl) {
        const { fileUrl, fileName, paperStatus, adminDownload } = response.data.data;
        
        // Create download link
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if (adminDownload && paperStatus !== 'approved') {
          toast.info('Admin preview download - not counted in statistics');
        } else {
          toast.success('Paper downloaded successfully!');
        }
        
        return response.data;
      } else {
        throw new Error('No download URL received');
      }
    } catch (error) {
      console.error('Admin download error:', error);
      toast.error('Failed to download paper for preview');
      throw error.response?.data || { message: 'Failed to download paper' };
    }
  },

  // Approve paper
  approvePaper: async (paperId) => {
    try {
      const response = await api.put(`/admin/papers/${paperId}/approve`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to approve paper' };
    }
  },

  // Reject paper with reason
  rejectPaper: async (paperId, reason) => {
    try {
      const response = await api.put(`/admin/papers/${paperId}/reject`, { reason });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to reject paper' };
    }
  },

  // Delete paper permanently
  deletePaper: async (paperId) => {
    try {
      const response = await api.delete(`/admin/papers/${paperId}`); // This calls index.js DELETE method
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete paper' };
    }
  }
};
