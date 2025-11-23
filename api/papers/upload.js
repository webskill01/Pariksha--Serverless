import { connectDB } from '../_lib/db.js';
import { Paper, User } from '../_lib/models.js';
import { auth } from '../_lib/middleware.js';
import { upload, uploadToR2 } from '../_lib/upload.js';
import { generatePaperFilename } from '../_lib/utils.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await connectDB();

    // Apply auth middleware
    await new Promise((resolve, reject) => {
      auth(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Apply multer middleware
    await new Promise((resolve, reject) => {
      upload.single('file')(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const { title, subject, class: paperClass, semester, year, examType, tags } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    if (!title || !subject || !paperClass || !semester || !year || !examType) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    const userId = req.userId;
    const fileName = generatePaperFilename(title);
    const fileUrl = await uploadToR2(req.file.buffer, fileName, req.file.mimetype);

    const paper = await Paper.create({
      title: title.trim(),
      subject: subject.trim(),
      class: paperClass,
      semester,
      year,
      examType,
      fileName,
      fileUrl,
      uploadedBy: userId,
      tags: tags ? JSON.parse(tags) : [],
      status: 'pending'
    });

    await User.findByIdAndUpdate(userId, { $inc: { uploadCount: 1 } });

    res.status(201).json({
      success: true,
      message: 'Paper uploaded successfully! Waiting for admin approval',
      data: { paper }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Upload failed'
    });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
