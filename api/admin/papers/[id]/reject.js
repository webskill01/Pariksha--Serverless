import { connectDB } from '../../../_lib/db.js';
import { Paper } from '../../../_lib/models.js';
import { auth, adminAuth } from '../../../_lib/middleware.js';
import { validateObjectId } from '../../../_lib/utils.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PUT') {
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
      return res.status(404).json({ 
        success: false, 
        message: 'Paper not found' 
      });
    }

    res.json({
      success: true,
      message: 'Paper rejected successfully',
      data: { paper }
    });

  } catch (error) {
    console.error('Reject paper error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
