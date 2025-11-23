import { connectDB } from '../_lib/db.js';
import { Paper } from '../_lib/models.js';
import { auth } from '../_lib/middleware.js';

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

    const { status } = req.query;
    const filter = { uploadedBy: req.userId };
    if (status) filter.status = status;

    const myPapers = await Paper.find(filter)
      .populate('uploadedBy', 'name class semester rollNumber')
      .sort({ createdAt: -1 });

    const stats = {
      total: myPapers.length,
      pending: myPapers.filter(p => p.status === 'pending').length,
      approved: myPapers.filter(p => p.status === 'approved').length,
      rejected: myPapers.filter(p => p.status === 'rejected').length,
      totalDownloads: myPapers.reduce((sum, p) => sum + p.downloadCount, 0)
    };

    res.json({
      success: true,
      data: { stats, papers: myPapers }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
