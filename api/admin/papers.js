import { connectDB } from '../_lib/db.js';
import { Paper } from '../_lib/models.js';
import { auth, adminAuth } from '../_lib/middleware.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await connectDB();

    await new Promise((resolve, reject) => {
      auth(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      adminAuth(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const { status } = req.query;
    const filters = {};
    if (status) filters.status = status;

    const papers = await Paper.find(filters)
      .populate('uploadedBy', 'name email rollNumber class semester')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: papers.length,
      data: { papers }
    });

  } catch (error) {
    console.error('Admin papers error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
