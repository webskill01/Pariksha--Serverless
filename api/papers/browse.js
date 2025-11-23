import { connectDB } from '../_lib/db.js';
import { Paper } from '../_lib/models.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await connectDB();

    const papers = await Paper.find({ status: 'approved' })
      .populate('uploadedBy', 'name rollNumber')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      count: papers?.length || 0,
      data: { papers: papers || [] }
    });
  } catch (error) {
    console.error('Papers error:', error);
    res.json({
      success: true,
      count: 0,
      data: { papers: [] },
      fallback: true
    });
  }
}
