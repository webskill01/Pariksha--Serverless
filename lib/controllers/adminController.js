import { User } from '../models/User.js';
import { Paper } from '../models/Paper.js';
import { deleteFromR2 } from '../config/r2.js';
import { asyncHandler } from '../utils/fileUtils.js';

export const previewPaper = asyncHandler(async (req, res) => {
  const paper = await Paper.findById(req.params.id)
    .populate('uploadedBy', 'name email rollNumber class semester');

  if (!paper) {
    return res.status(404).json({
      success: false,
      message: 'Paper not found'
    });
  }

  // Admin can see all paper details including file info
  res.json({
    success: true,
    data: {
      paper,
      canDownload: true, // Admin can always download
      downloadUrl: paper.fileUrl,
      adminPreview: true
    }
  });
});

// NEW: Admin-only download function
export const downloadPaperAdmin = asyncHandler(async (req, res) => {
  const paper = await Paper.findById(req.params.id);

  if (!paper) {
    return res.status(404).json({
      success: false,
      message: 'Paper not found'
    });
  }

  if (!paper.fileUrl) {
    return res.status(404).json({
      success: false,
      message: 'File URL not found'
    });
  }

  // Don't increment download count for admin previews
  res.json({
    success: true,
    message: 'Admin download access granted',
    data: {
      fileUrl: paper.fileUrl,
      fileName: `${paper.title}.pdf`,
      paperStatus: paper.status,
      adminDownload: true,
      downloadCount: paper.downloadCount // Current count, not incremented
    }
  });
});

export const getPendingPapers = asyncHandler(async (req, res) => {
  const pendingPapers = await Paper.find({ status: "pending" })
    .populate("uploadedBy", "name email rollNumber class semester")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: pendingPapers.length,
    data: { papers: pendingPapers },
  });
});

export const getAllPapersAdmin = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filters = {};
  if (status) { filters.status = status; }

  const papers = await Paper.find(filters)
    .populate("uploadedBy", "name email rollNumber class semester")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: papers.length,
    data: { papers }
  });
});

export const approvePaper = asyncHandler(async (req, res) => {
  const paper = await Paper.findByIdAndUpdate(
    req.params.id,
    { status: 'approved', rejectionReason: null },
    { new: true }
  ).populate('uploadedBy', 'name email rollNumber');

  if (!paper) {
    return res.status(404).json({ success: false, message: 'Paper not found' });
  }

  res.json({
    success: true,
    message: 'Paper approved successfully',
    data: { paper }
  });
});

export const rejectPaper = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  
  const paper = await Paper.findByIdAndUpdate(
    req.params.id,
    { status: 'rejected', rejectionReason: reason || 'No reason provided' },
    { new: true }
  ).populate('uploadedBy', 'name email rollNumber');

  if (!paper) {
    return res.status(404).json({ success: false, message: 'Paper not found' });
  }

  res.json({
    success: true,
    message: 'Paper rejected successfully',
    data: { paper }
  });
});

export const deletePaper = asyncHandler(async (req, res) => {
  const paper = await Paper.findById(req.params.id);
  
  if (!paper) {
    return res.status(404).json({ success: false, message: 'Paper not found' });
  }

  // Delete from R2 if file exists
  if (paper.fileName) {
    await deleteFromR2(paper.fileName);
  }

  await Paper.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Paper deleted successfully'
  });
});

export const getAdminStats = asyncHandler(async (req, res) => {
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

  res.json({
    success: true,
    data: {
      users: totalUsers,
      papers: { total: totalPapers, pending: pendingPapers, approved: approvedPapers, rejected: rejectedPapers },
      downloads: totalDownloads
    }
  });
});
