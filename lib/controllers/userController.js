import { Paper } from '../models/Paper.js';
import { asyncHandler } from '../utils/fileUtils.js';

export const getMyDashboard = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { uploadedBy: req.userId };
  if (status) filter.status = status;

  const myPapers = await Paper.find(filter)
    .populate('uploadedBy', 'name class semester rollNumber')
    .sort({ createdAt: -1 });

  const total = myPapers.length;
  const pending = myPapers.filter(p => p.status === "pending").length;
  const approved = myPapers.filter(p => p.status === "approved").length;
  const rejected = myPapers.filter(p => p.status === "rejected").length;
  const totalDownloads = myPapers.reduce((sum, p) => sum + p.downloadCount, 0);

  res.json({
    success: true,
    data: {
      stats: { total, pending, approved, rejected, totalDownloads },
      papers: myPapers
    }
  });
});

export const deleteMyPaper = asyncHandler(async (req, res) => {
  const paper = await Paper.findById(req.params.id);

  if (!paper || paper.uploadedBy.toString() !== req.userId) {
    return res.status(404).json({ success: false, message: "Paper not found" });
  }

  await Paper.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: "Paper deleted successfully"
  });
});
