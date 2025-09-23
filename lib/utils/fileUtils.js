import mongoose from 'mongoose';

// Clean paper title for filename use
export const sanitizeFilename = (title, maxLength = 80) => {
  if (!title || typeof title !== 'string') {
    return 'untitled-paper';
  }
  
  return title
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .trim()
    .toLowerCase()
    .substring(0, maxLength)
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    || 'untitled-paper';
};

// Generate unique filename with title + timestamp
export const generatePaperFilename = (paperTitle) => {
  const cleanTitle = sanitizeFilename(paperTitle, 60); // Leave room for timestamp
  const timestamp = Date.now();
  return `papers/${cleanTitle}_${timestamp}.pdf`;
};

// Async handler wrapper
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Validate MongoDB ObjectId
export const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  
  // Check if the id is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid paper ID format'
    });
  }
  
  next();
};
