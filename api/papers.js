import { connectDB } from './_lib/db.js';
import { Paper, User } from './_lib/models.js';
import { auth, optionalAuth } from './_lib/middleware.js';
import { upload, uploadToR2 } from './_lib/upload.js';
import { validateObjectId, generatePaperFilename } from './_lib/utils.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();
    const path = req.url.split('?')[0];

    // ========== GET ALL PAPERS (BROWSE) ==========
    if ((path === '/api/papers' || path === '/api/papers/browse') && req.method === 'GET') {
      const papers = await Paper.find({ status: 'approved' })
        .populate('uploadedBy', 'name rollNumber')
        .sort({ createdAt: -1 })
        .limit(50);

      return res.json({
        success: true,
        count: papers.length,
        data: { papers }
      });
    }

    // ========== FILTER PAPERS ==========
    if (path === '/api/papers/filters' && req.method === 'GET') {
      const { search, subject, class: className, semester, examType, year, sortBy } = req.query;
      let query = { status: 'approved' };

      if (search && search.trim()) {
        const searchRegex = new RegExp(search.trim(), 'i');
        query.$or = [
          { title: searchRegex },
          { subject: searchRegex },
          { tags: { $in: [searchRegex] } }
        ];
      }

      if (subject && subject.trim()) query.subject = { $regex: subject.trim(), $options: 'i' };
      if (className && className.trim()) query.class = { $regex: className.trim(), $options: 'i' };
      if (semester && semester.trim()) query.semester = semester.trim();
      if (examType && examType.trim()) query.examType = examType.trim();
      if (year && year.trim()) query.year = year.trim();

      let sortQuery = { createdAt: -1 };
      switch (sortBy) {
        case 'newest': sortQuery = { createdAt: -1 }; break;
        case 'popular': sortQuery = { downloadCount: -1, createdAt: -1 }; break;
        case 'title': sortQuery = { title: 1 }; break;
        default: sortQuery = { createdAt: -1 };
      }

      const papers = await Paper.find(query)
        .populate('uploadedBy', 'name rollNumber')
        .sort(sortQuery)
        .limit(100);

      return res.json({
        success: true,
        data: { papers, total: papers.length }
      });
    }

    // ========== FILTER OPTIONS ==========
    if (path === '/api/papers/filter-options' && req.method === 'GET') {
      const [subjects, classes, semesters, examTypes, years] = await Promise.all([
        Paper.distinct('subject', { status: 'approved' }).catch(() => []),
        Paper.distinct('class', { status: 'approved' }).catch(() => []),
        Paper.distinct('semester', { status: 'approved' }).catch(() => []),
        Paper.distinct('examType', { status: 'approved' }).catch(() => ['Mst-1', 'Mst-2', 'Final']),
        Paper.distinct('year', { status: 'approved' }).catch(() => [])
      ]);

      return res.json({
        success: true,
        data: {
          subjects: subjects.filter(Boolean).sort(),
          classes: classes.filter(Boolean).sort(),
          semesters: semesters.filter(Boolean).sort(),
          examTypes: examTypes.filter(Boolean).sort() || ['Mst-1', 'Mst-2', 'Final'],
          years: years.filter(Boolean).sort().reverse()
        }
      });
    }

    // ========== GET PAPER BY ID ==========
    if (path.match(/^\/api\/papers\/[a-f0-9]{24}$/) && req.method === 'GET') {
      const id = path.split('/').pop();
      
      if (!validateObjectId(id)) {
        return res.status(400).json({ success: false, message: 'Invalid paper ID format' });
      }

      const paper = await Paper.findById(id).populate('uploadedBy', 'name rollNumber class semester');

      if (!paper || paper.status !== 'approved') {
        return res.status(404).json({ success: false, message: 'Paper not found or not available' });
      }

      return res.json({ 
        success: true, 
        data: {
          ...paper.toObject(),
          previewUrl: paper.fileUrl,
          canPreview: true
        }
      });
    }

    // ========== DOWNLOAD PAPER ==========
    if (path.match(/^\/api\/papers\/[a-f0-9]{24}\/download$/) && req.method === 'POST') {
      await new Promise((resolve) => optionalAuth(req, res, () => resolve()));

      const id = path.split('/')[3];
      
      if (!validateObjectId(id)) {
        return res.status(400).json({ success: false, message: 'Invalid paper ID format' });
      }

      const paper = await Paper.findById(id);

      if (!paper) {
        return res.status(404).json({ success: false, message: 'Paper not found' });
      }

      const isAdmin = req.user && ['nitinemailss@gmail.com'].includes(req.user.email);

      if (paper.status !== 'approved' && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Paper not available for download' });
      }

      if (!paper.fileUrl) {
        return res.status(404).json({ success: false, message: 'File not available' });
      }

      let updatedPaper = paper;
      if (paper.status === 'approved') {
        updatedPaper = await Paper.findByIdAndUpdate(
          id,
          { $inc: { downloadCount: 1 } },
          { new: true }
        );
      }

      return res.json({
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
    }

    // ========== UPLOAD PAPER ==========
    if (path === '/api/papers/upload' && req.method === 'POST') {
      await new Promise((resolve, reject) => {
        auth(req, res, (err) => err ? reject(err) : resolve());
      });

      await new Promise((resolve, reject) => {
        upload.single('file')(req, res, (err) => err ? reject(err) : resolve());
      });

      const { title, subject, class: paperClass, semester, year, examType, tags } = req.body;

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      if (!title || !subject || !paperClass || !semester || !year || !examType) {
        return res.status(400).json({ success: false, message: 'All required fields must be provided' });
      }

      const userId = req.userId;
      const fileName = generatePaperFilename(title);
      const fileUrl = await uploadToR2(req.file.buffer, fileName, req.file.mimetype);

      const paper = await Paper.create({
        title: title.trim(),
        subject: subject.trim(),
        class: paperClass,
        semester,
        year,
        examType,
        fileName,
        fileUrl,
        uploadedBy: userId,
        tags: tags ? JSON.parse(tags) : [],
        status: 'pending'
      });

      await User.findByIdAndUpdate(userId, { $inc: { uploadCount: 1 } });

      return res.status(201).json({
        success: true,
        message: 'Paper uploaded successfully! Waiting for admin approval',
        data: { paper }
      });
    }

    return res.status(404).json({ success: false, message: 'Route not found' });

  } catch (error) {
    console.error('Papers error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
