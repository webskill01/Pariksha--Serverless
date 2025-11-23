import { connectDB } from '../_lib/db.js';
import { Paper, User } from '../_lib/models.js';
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

    const [totalUsers, totalPapers, pendingPapers, approvedPapers, rejectedPapers] = await Promise.all([
      User.countDocuments(),
      Paper.countDocuments(),
      Paper.countDocuments({ status: 'pending' }),
      Paper.countDocuments({ status: 'approved' }),
      Paper.countDocuments({ status: 'rejected' })
    ]);

    const totalDownloads = await Paper.aggregate([
      { $group: { _id: null, total: { $sum: '$downloadCount' } } }
    ]).then(result => result[0]?.total || 0);

    res.json({
      success: true,
      data: {
        users: totalUsers,
        papers: { 
          total: totalPapers, 
          pending: pendingPapers, 
          approved: approvedPapers, 
          rejected: rejectedPapers 
        },
        downloads: totalDownloads
      }
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
