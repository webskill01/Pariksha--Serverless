import express from 'express';
import {
  getPendingPapers,
  getAllPapersAdmin,
  approvePaper,
  rejectPaper,
  deletePaper,
  getAdminStats,
  previewPaper,  // New function for admin preview
  downloadPaperAdmin  // New admin-only download
} from '../controllers/adminController.js';
import { auth } from '../middleware/auth.js';
import { adminAuth } from '../middleware/adminAuth.js';
import { validateObjectId } from '../utils/fileUtils.js';

const router = express.Router();

// Apply auth middleware chain
router.use(auth); // Check if user is logged in
router.use(adminAuth); // Check if user is admin

// Admin routes
router.get('/stats', getAdminStats);
router.get('/pending-papers', getPendingPapers);
router.get('/papers', getAllPapersAdmin);

// Admin preview and download routes (NEW)
router.get('/papers/:id/preview', validateObjectId, previewPaper);
router.post('/papers/:id/download', validateObjectId, downloadPaperAdmin);

// Admin actions
router.put('/papers/:id/approve', validateObjectId, approvePaper);
router.put('/papers/:id/reject', validateObjectId, rejectPaper);
router.delete('/papers/:id', validateObjectId, deletePaper);

export default router;
