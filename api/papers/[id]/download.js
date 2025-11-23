import { connectDB } from '../../_lib/db.js';
import { Paper } from '../../_lib/models.js';
import { optionalAuth } from '../../_lib/middleware.js';
import { validateObjectId } from '../../_lib/utils.js';

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

    // Apply optional auth
    await new Promise((resolve) => {
      optionalAuth(req, res, () => resolve());
    });

    const { id } = req.query;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid paper ID format'
      });
    }

    const paper = await Paper.findById(id);

    if (!paper) {
      return res.status(404).json({ 
        success: false, 
        message: 'Paper not found' 
      });
    }

    const isAdmin = req.user && ['nitinemailss@gmail.com'].includes(req.user.email);

    if (paper.status !== 'approved' && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Paper not available for download'
      });
    }

    if (!paper.fileUrl) {
      return res.status(404).json({ 
        success: false, 
        message: 'File not available' 
      });
    }

    let updatedPaper = paper;
    if (paper.status === 'approved') {
      updatedPaper = await Paper.findByIdAndUpdate(
        id,
        { $inc: { downloadCount: 1 } },
        { new: true }
      );
    }

    res.json({
      success: true,
      message: isAdmin && paper.status !== 'approved' 
        ? 'Admin preview access granted' 
        : 'Download URL generated',
      data: {
        fileUrl: paper.fileUrl,
        fileName: `${paper.title}.pdf`,
        downloadCount: updatedPaper.downloadCount,
        isAdminPreview: isAdmin && paper.status !== 'approved'
      }
    });

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
