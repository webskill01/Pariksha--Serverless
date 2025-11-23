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

    const [subjects, classes, semesters, examTypes, years] = await Promise.all([
      Paper.distinct('subject', { status: 'approved' }).catch(() => []),
      Paper.distinct('class', { status: 'approved' }).catch(() => []),
      Paper.distinct('semester', { status: 'approved' }).catch(() => []),
      Paper.distinct('examType', { status: 'approved' }).catch(() => ['Mst-1', 'Mst-2', 'Final']),
      Paper.distinct('year', { status: 'approved' }).catch(() => [])
    ]);

    res.json({
      success: true,
      data: {
        subjects: subjects.filter(Boolean).sort(),
        classes: classes.filter(Boolean).sort(),
        semesters: semesters.filter(Boolean).sort(),
        examTypes: examTypes.filter(Boolean).sort() || ['Mst-1', 'Mst-2', 'Final'],
        years: years.filter(Boolean).sort().reverse()
      }
    });
  } catch (error) {
    console.error('Filter options error:', error);
    res.json({
      success: true,
      data: {
        subjects: [],
        classes: [],
        semesters: [],
        examTypes: ['Mst-1', 'Mst-2', 'Final'],
        years: []
      },
      fallback: true
    });
  }
}
