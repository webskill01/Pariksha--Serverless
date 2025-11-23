import { connectDB } from './_lib/db.js';
import { Paper, User } from './_lib/models.js';
import { auth, adminAuth } from './_lib/middleware.js';
import { deleteFromR2 } from './_lib/upload.js';
import { validateObjectId } from './_lib/utils.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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

    // Apply admin authorization
    await new Promise((resolve, reject) => {
      adminAuth(req, res, (err) => err ? reject(err) : resolve());
    });

    const path = req.url.split('?')[0];

    // ========== GET ADMIN STATS ==========
    if (path === '/api/admin/stats' && req.method === 'GET') {
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

      return res.json({
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
    }

    // ========== GET ALL PAPERS (ADMIN) ==========
    if (path === '/api/admin/papers' && req.method === 'GET') {
      const { status } = req.query;
      const filters = {};
      if (status) filters.status = status;

      const papers = await Paper.find(filters)
        .populate('uploadedBy', 'name email rollNumber class semester')
        .sort({ createdAt: -1 });

      return res.json({
        success: true,
        count: papers.length,
        data: { papers }
      });
    }

    // ========== GET PENDING PAPERS ==========
    if (path === '/api/admin/pending' && req.method === 'GET') {
      const pendingPapers = await Paper.find({ status: 'pending' })
        .populate('uploadedBy', 'name email rollNumber class semester')
        .sort({ createdAt: -1 });

      return res.json({
        success: true,
        count: pendingPapers.length,
        data: { papers: pendingPapers }
      });
    }

    // ========== APPROVE PAPER ==========
    if (path.match(/^\/api\/admin\/papers\/[a-f0-9]{24}\/approve$/) && req.method === 'PUT') {
      const id = path.split('/')[4];

      if (!validateObjectId(id)) {
        return res.status(400).json({ success: false, message: 'Invalid paper ID format' });
      }

      const paper = await Paper.findByIdAndUpdate(
        id,
        { status: 'approved', rejectionReason: null },
        { new: true }
      ).populate('uploadedBy', 'name email rollNumber');

      if (!paper) {
        return res.status(404).json({ success: false, message: 'Paper not found' });
      }

      return res.json({
        success: true,
        message: 'Paper approved successfully',
        data: { paper }
      });
    }

    // ========== REJECT PAPER ==========
    if (path.match(/^\/api\/admin\/papers\/[a-f0-9]{24}\/reject$/) && req.method === 'PUT') {
      const id = path.split('/')[4];

      if (!validateObjectId(id)) {
        return res.status(400).json({ success: false, message: 'Invalid paper ID format' });
      }

      const { reason } = req.body;
      
      const paper = await Paper.findByIdAndUpdate(
        id,
        { 
          status: 'rejected', 
          rejectionReason: reason?.trim() || 'No reason provided' 
        },
        { new: true }
      ).populate('uploadedBy', 'name email rollNumber');

      if (!paper) {
        return res.status(404).json({ success: false, message: 'Paper not found' });
      }

      return res.json({
        success: true,
        message: 'Paper rejected successfully',
        data: { paper }
      });
    }

    // ========== DELETE PAPER (ADMIN) ==========
    if (path.match(/^\/api\/admin\/papers\/[a-f0-9]{24}$/) && req.method === 'DELETE') {
      const id = path.split('/')[4];

      if (!validateObjectId(id)) {
        return res.status(400).json({ success: false, message: 'Invalid paper ID format' });
      }

      const paper = await Paper.findById(id);
      
      if (!paper) {
        return res.status(404).json({ success: false, message: 'Paper not found' });
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

    // ========== PREVIEW PAPER (ADMIN) ==========
    if (path.match(/^\/api\/admin\/papers\/[a-f0-9]{24}\/preview$/) && (req.method === 'GET' || req.method === 'POST')) {
      const id = path.split('/')[4];

      if (!validateObjectId(id)) {
        return res.status(400).json({ success: false, message: 'Invalid paper ID format' });
      }

      const paper = await Paper.findById(id)
        .populate('uploadedBy', 'name email rollNumber class semester');

      if (!paper) {
        return res.status(404).json({ success: false, message: 'Paper not found' });
      }

      if (!paper.fileUrl) {
        return res.status(404).json({ success: false, message: 'File not available' });
      }

      if (req.method === 'GET') {
        return res.json({
          success: true,
          data: {
            paper,
            canDownload: true,
            downloadUrl: paper.fileUrl,
            previewUrl: paper.fileUrl,
            adminPreview: true
          }
        });
      }

      if (req.method === 'POST') {
        return res.json({
          success: true,
          message: 'Admin download access granted',
          data: {
            fileUrl: paper.fileUrl,
            fileName: `${paper.title}.pdf`,
            paperStatus: paper.status,
            adminDownload: true,
            downloadCount: paper.downloadCount
          }
        });
      }
    }

    return res.status(404).json({ success: false, message: 'Route not found' });

  } catch (error) {
    console.error('Admin operation error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
