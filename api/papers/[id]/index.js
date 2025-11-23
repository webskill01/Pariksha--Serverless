import { connectDB } from '../../_lib/db.js';
import { Paper } from '../../_lib/models.js';
import { validateObjectId } from '../../_lib/utils.js';

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

    const { id } = req.query;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid paper ID format'
      });
    }

    const paper = await Paper.findById(id).populate(
      'uploadedBy',
      'name rollNumber class semester'
    );

    if (!paper || paper.status !== 'approved') {
      return res.status(404).json({ 
        success: false, 
        message: 'Paper not found or not available' 
      });
    }

    res.json({ 
      success: true, 
      data: {
        ...paper.toObject(),
        previewUrl: paper.fileUrl,
        canPreview: true
      }
    });

  } catch (error) {
    console.error('Paper detail error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
