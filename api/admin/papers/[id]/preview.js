import { connectDB } from '../../../_lib/db.js';
import { Paper } from '../../../_lib/models.js';
import { auth, adminAuth } from '../../../_lib/middleware.js';
import { validateObjectId } from '../../../_lib/utils.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
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

    const { id } = req.query;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid paper ID format'
      });
    }

    const paper = await Paper.findById(id)
      .populate('uploadedBy', 'name email rollNumber class semester');

    if (!paper) {
      return res.status(404).json({
        success: false,
        message: 'Paper not found'
      });
    }

    if (!paper.fileUrl) {
      return res.status(404).json({
        success: false,
        message: 'File not available'
      });
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

  } catch (error) {
    console.error('Admin preview error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
