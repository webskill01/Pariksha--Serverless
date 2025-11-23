import { connectDB } from './_lib/db.js';
import { Paper, User } from './_lib/models.js';

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

    const [totalPapers, totalUsers, totalDownloads] = await Promise.all([
      Paper.countDocuments({ status: 'approved' }).catch(() => 0),
      User.countDocuments().catch(() => 0),
      Paper.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: null, totalDownloads: { $sum: '$downloadCount' } } }
      ]).then(result => result[0]?.totalDownloads || 0).catch(() => 0)
    ]);

    res.json({
      success: true,
      data: { 
        totalPapers: totalPapers || 0, 
        totalUsers: totalUsers || 0, 
        totalDownloads: totalDownloads || 0 
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.json({
      success: true,
      data: { totalPapers: 0, totalUsers: 0, totalDownloads: 0 },
      fallback: true,
      note: 'Showing fallback data due to temporary database issue'
    });
  }
}
