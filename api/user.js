import { connectDB } from './_lib/db.js';
import { Paper, User } from './_lib/models.js';
import { auth } from './_lib/middleware.js';
import { deleteFromR2 } from './_lib/upload.js';
import { validateObjectId } from './_lib/utils.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
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

    // ========== GET USER PROFILE ==========
    if (path === '/api/user/profile' && req.method === 'GET') {
      const user = await User.findById(req.userId).select('-password');
      
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      return res.json({
        success: true,
        data: user
      });
    }

    // ========== UPDATE USER PROFILE ==========
    if (path === '/api/user/profile' && req.method === 'PUT') {
      console.log('🔄 Profile update request received');
      
      // Parse body for both Express and Vercel
      if (!req.body || Object.keys(req.body || {}).length === 0) {
        const buffers = [];
        for await (const chunk of req) {
          buffers.push(chunk);
        }
        const data = Buffer.concat(buffers).toString();
        req.body = JSON.parse(data);
      }

      console.log('📦 Request body:', req.body);
      console.log('👤 User ID:', req.userId);

      const { name, rollNumber, class: userClass, semester, year } = req.body;

      // Validate required fields
      if (!name || !rollNumber || !userClass || !semester || !year) {
        return res.status(400).json({ 
          success: false, 
          message: 'All fields are required' 
        });
      }

      // Fetch current user
      const currentUser = await User.findById(req.userId);
      if (!currentUser) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      console.log('📝 Current user:', currentUser.rollNumber);
      console.log('📝 New roll number:', rollNumber);

      // Check if rollNumber is being changed and if it's already taken
      if (rollNumber.toUpperCase() !== currentUser.rollNumber.toUpperCase()) {
        const existingUser = await User.findOne({ 
          rollNumber: rollNumber.trim().toUpperCase(),
          _id: { $ne: req.userId }
        });

        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Roll number already exists'
          });
        }
      }

      // Update user
      const updatedUser = await User.findByIdAndUpdate(
        req.userId,
        {
          name: name.trim(),
          rollNumber: rollNumber.trim().toUpperCase(),
          class: userClass.trim(),
          semester: semester.trim(),
          year: year.trim(),
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      ).select('-password');

      if (!updatedUser) {
        return res.status(404).json({ success: false, message: 'Failed to update user' });
      }

      console.log('✅ User updated successfully:', updatedUser);

      // Return updated user data
      const userResponse = {
        id: updatedUser._id,
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        rollNumber: updatedUser.rollNumber,
        class: updatedUser.class,
        semester: updatedUser.semester,
        year: updatedUser.year,
        uploadCount: updatedUser.uploadCount,
        createdAt: updatedUser.createdAt
      };

      return res.json({
        success: true,
        message: 'Profile updated successfully',
        data: userResponse
      });
    }

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
    console.error('❌ User operation error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
