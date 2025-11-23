import mongoose from 'mongoose';

export const validateObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

export const sanitizeFilename = (title, maxLength = 80) => {
  if (!title || typeof title !== 'string') return 'untitled-paper';
  
  return title
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_')
    .trim()
    .toLowerCase()
    .substring(0, maxLength)
    .replace(/^_+|_+$/g, '') || 'untitled-paper';
};

export const generatePaperFilename = (paperTitle) => {
  const cleanTitle = sanitizeFilename(paperTitle, 60);
  const timestamp = Date.now();
  return `papers/${cleanTitle}_${timestamp}.pdf`;
};
