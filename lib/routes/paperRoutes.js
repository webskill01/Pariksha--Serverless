import express from 'express';
import { 
  uploadPaper, 
  getAllPapers, 
  getPaperById, 
  downloadPaper, 
  filterPaper, 
  getFilterOptions 
} from '../controllers/paperController.js';
import { uploadPaperWithFile } from '../controllers/uploadController.js';
import { auth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { validateObjectId } from '../utils/fileUtils.js';

const router = express.Router();

// Public routes (no auth required)
router.get('/filters', filterPaper);
router.get('/filter-options', getFilterOptions);
router.get('/:id', validateObjectId, getPaperById);
router.get('/', getAllPapers);

// Public download route (with optional auth for admin check)
router.post('/:id/download', validateObjectId, async (req, res, next) => {
  // Optional auth - don't fail if no token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const { auth } = await import('../middleware/auth.js');
      await auth(req, res, next);
    } catch (error) {
      // Continue without auth if token is invalid
      next();
    }
  } else {
    next();
  }
}, downloadPaper);

// Protected routes (auth required)
router.post('/upload', auth, upload.single('file'), uploadPaperWithFile);
router.post('/', auth, uploadPaper);

export default router;
