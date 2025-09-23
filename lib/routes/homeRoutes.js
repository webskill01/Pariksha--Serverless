import express from 'express';
import { Paper } from '../models/Paper.js';
import { User } from '../models/User.js';

const router = express.Router();

// GET /api/stats - Homepage statistics
router.get('/stats', async (req, res) => {
  try {
    // Calculate homepage statistics
    const [totalPapers, totalUsers, totalDownloads] = await Promise.all([
      // Count total approved papers
      Paper.countDocuments({ status: 'approved' }),
      // Count total users
      User.countDocuments(),
      // Sum all download counts from approved papers
      Paper.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: null, totalDownloads: { $sum: '$downloadCount' } } }
      ]).then(result => result[0]?.totalDownloads || 0)
    ]);

    res.json({
      success: true,
      data: {
        totalPapers,
        totalUsers,
        totalDownloads
      }
    });
  } catch (error) {
    console.error('Error fetching home stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

// GET /api/recent - Recent approved papers
router.get('/recent', async (req, res) => {
  try {
    const recentPapers = await Paper.find({ status: 'approved' })
      .populate('uploadedBy', 'name rollNumber')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: { papers: recentPapers }
    });
  } catch (error) {
    console.error('Error fetching recent papers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent papers',
      error: error.message
    });
  }
});

export default router;
