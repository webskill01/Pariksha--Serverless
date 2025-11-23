import { connectDB } from './_lib/db.js';
import { Paper } from './_lib/models.js';

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

    const recentPapers = await Paper.find({ status: 'approved' })
      .populate('uploadedBy', 'name rollNumber')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: { papers: recentPapers || [] }
    });
  } catch (error) {
    console.error('Error fetching recent papers:', error);
    res.json({
      success: true,
      data: { papers: [] },
      fallback: true
    });
  }
}
