import { connectDB } from '../../_lib/db.js';
import { Paper } from '../../_lib/models.js';
import { auth } from '../../_lib/middleware.js';
import { deleteFromR2 } from '../../_lib/upload.js';
import { validateObjectId } from '../../_lib/utils.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
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

    const { id } = req.query;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid paper ID format'
      });
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

    res.json({
      success: true,
      message: 'Paper deleted successfully'
    });

  } catch (error) {
    console.error('Delete paper error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
