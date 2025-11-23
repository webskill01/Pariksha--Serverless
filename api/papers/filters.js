import { connectDB } from '../_lib/db.js';
import { Paper } from '../_lib/models.js';

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

    res.json({
      success: true,
      data: { papers: papers || [], total: papers?.length || 0 }
    });
  } catch (error) {
    console.error('Papers filter error:', error);
    res.json({
      success: true,
      data: { papers: [], total: 0 },
      fallback: true
    });
  }
}
