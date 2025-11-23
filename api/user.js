import { connectDB } from './_lib/db.js';
import { Paper } from './_lib/models.js';
import { auth } from './_lib/middleware.js';
import { deleteFromR2 } from './_lib/upload.js';
import { validateObjectId } from './_lib/utils.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();

    // Apply authentication
    await new Promise((resolve, reject) => {
      auth(req, res, (err) => err ? reject(err) : resolve());
    });

    const path = req.url.split('?')[0];

    // ========== GET USER DASHBOARD ==========
    if (path === '/api/user/dashboard' && req.method === 'GET') {
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

      return res.json({
        success: true,
        data: { stats, papers: myPapers }
      });
    }

    // ========== DELETE USER'S PAPER ==========
    if (path.match(/^\/api\/user\/paper\/[a-f0-9]{24}$/) && req.method === 'DELETE') {
      const id = path.split('/').pop();

      if (!validateObjectId(id)) {
        return res.status(400).json({ success: false, message: 'Invalid paper ID format' });
      }

      const paper = await Paper.findById(id);

      if (!paper || paper.uploadedBy.toString() !== req.userId) {
        return res.status(404).json({ 
          success: false, 
          message: 'Paper not found or access denied' 
        });
      }

      if (paper.fileName) {
        await deleteFromR2(paper.fileName);
      }

      await Paper.findByIdAndDelete(id);

      return res.json({
        success: true,
        message: 'Paper deleted successfully'
      });
    }

    return res.status(404).json({ success: false, message: 'Route not found' });

  } catch (error) {
    console.error('User operation error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
