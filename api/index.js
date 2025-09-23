import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const app = express();

// CORS Configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://pariksha-serverless.vercel.app',
    process.env.FRONTEND_URL
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database connection with caching for serverless
let cachedDb = null;
const connectDB = async () => {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }
  
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI environment variable is not set');
  }
  
  try {
    const db = await mongoose.connect(process.env.MONGO_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    cachedDb = db;
    console.log('Connected to MongoDB Atlas');
    return db;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

// Models (inline to avoid import issues)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  class: { type: String, required: true },
  semester: { type: String, required: true },
  year: { type: String, required: true },
  rollNumber: { type: String, required: true, unique: true, uppercase: true },
  uploadCount: { type: Number, default: 0 }
}, { timestamps: true });

const paperSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  subject: { type: String, required: true, trim: true },
  class: { type: String, required: true },
  semester: { type: String, required: true },
  year: { type: String, required: true },
  examType: { type: String, required: true, enum: ["Mst-1", "Mst-2", "Final"] },
  fileName: String,
  fileUrl: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  downloadCount: { type: Number, default: 0 },
  rejectionReason: { type: String, default: null },
  tags: [{ type: String, lowercase: true }]
}, { timestamps: true });

paperSchema.index({ class: 1, semester: 1, subject: 1 });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Paper = mongoose.models.Paper || mongoose.model('Paper', paperSchema);

// R2 Configuration
const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  },
  forcePathStyle: true,
  signatureVersion: "v4",
});

// Utility functions
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid paper ID format'
    });
  }
  next();
};

const sanitizeFilename = (title, maxLength = 80) => {
  if (!title || typeof title !== 'string') return 'untitled-paper';
  
  return title
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_')
    .trim()
    .toLowerCase()
    .substring(0, maxLength)
    .replace(/^_+|_+$/g, '') || 'untitled-paper';
};

const generatePaperFilename = (paperTitle) => {
  const cleanTitle = sanitizeFilename(paperTitle, 60);
  const timestamp = Date.now();
  return `papers/${cleanTitle}_${timestamp}.pdf`;
};

const uploadToR2 = async (fileBuffer, fileName, mimeType) => {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: fileName,
      Body: fileBuffer,
      ContentType: mimeType,
    });
    
    await r2Client.send(command);
    return `${process.env.R2_PUBLIC_URL}/${fileName}`;
  } catch (error) {
    console.error("R2 upload error:", error);
    throw new Error("Failed to upload file to cloud storage");
  }
};

// Multer configuration for serverless
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") cb(null, true);
  else cb(new Error("Only PDF files allowed!"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Auth middleware
const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ 
      success: false, 
      message: "You Are Not Logged In" 
    });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "User not found" 
      });
    }
    
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ 
      message: "Invalid Token or Expired Token" 
    });
  }
};

// Admin auth middleware
const adminAuth = async (req, res, next) => {
  const adminEmails = ["nitinemailss@gmail.com"];
  
  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Admin Not Found"
    });
  }

  if (!adminEmails.includes(user.email)) {
    return res.status(403).json({
      success: false,
      message: "Access Denied, Admin Privileges Required"
    });
  }

  req.user = user;
  next();
};

// Database connection middleware
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// ROUTES

// Health check
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Pariksha API is running on Vercel!', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Home stats
app.get('/api/stats', asyncHandler(async (req, res) => {
  const [totalPapers, totalUsers, totalDownloads] = await Promise.all([
    Paper.countDocuments({ status: 'approved' }),
    User.countDocuments(),
    Paper.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, totalDownloads: { $sum: '$downloadCount' } } }
    ]).then(result => result[0]?.totalDownloads || 0)
  ]);

  res.json({
    success: true,
    data: { totalPapers, totalUsers, totalDownloads }
  });
}));

// Auth routes
app.post('/api/auth/register', asyncHandler(async (req, res) => {
  const { name, email, rollNumber, class: studentClass, semester, year, password } = req.body;

  const existingUser = await User.findOne({ $or: [{ email }, { rollNumber }] });
  if (existingUser) {
    return res.status(400).json({
      message: "Student Already Exist With this Email or Roll number"
    });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  
  const newUser = new User({
    name, email, rollNumber, class: studentClass, year, semester,
    password: hashedPassword
  });

  await newUser.save();

  const userResponse = {
    id: newUser._id, name: newUser.name, email: newUser.email,
    rollNumber: newUser.rollNumber, class: newUser.class,
    year: newUser.year, semester: newUser.semester
  };

  res.status(201).json({
    message: "User Registered Successfully",
    user: userResponse
  });
}));

app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(400).json({ message: "Invalid Email or Password" });
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
  
  const userResponse = {
    id: user._id, name: user.name, email: user.email,
    rollNumber: user.rollNumber, class: user.class,
    year: user.year, semester: user.semester
  };

  res.json({
    message: "Login Successful",
    token,
    user: userResponse
  });
}));

// Paper routes
app.get('/api/papers/filters', asyncHandler(async (req, res) => {
  const { search, subject, class: className, semester, examType, year, sortBy } = req.query;
  let query = { status: 'approved' };

  if (search && search.trim()) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { subject: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  if (subject && subject.trim()) query.subject = { $regex: subject, $options: 'i' };
  if (className && className.trim()) query.class = { $regex: className, $options: 'i' };
  if (semester && semester.trim()) query.semester = semester;
  if (examType && examType.trim()) query.examType = examType;
  if (year && year.trim()) query.year = year;

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
    data: { papers: papers, total: papers.length }
  });
}));

app.get('/api/papers/filter-options', asyncHandler(async (req, res) => {
  try {
    const [subjects, classes, semesters, examTypes, years] = await Promise.all([
      Paper.distinct('subject', { status: 'approved' }),
      Paper.distinct('class', { status: 'approved' }),
      Paper.distinct('semester', { status: 'approved' }),
      Paper.distinct('examType', { status: 'approved' }),
      Paper.distinct('year', { status: 'approved' })
    ]);

    res.json({
      success: true,
      data: {
        subjects: subjects.filter(Boolean).sort(),
        classes: classes.filter(Boolean).sort(),
        semesters: semesters.filter(Boolean).sort(),
        examTypes: examTypes.filter(Boolean).sort(),
        years: years.filter(Boolean).sort().reverse()
      }
    });
  } catch (error) {
    console.error('Filter options error:', error);
    // Return fallback data
    res.json({
      success: true,
      data: {
        subjects: [],
        classes: [],
        semesters: [],
        examTypes: ['Mst-1', 'Mst-2', 'Final'],
        years: []
      }
    });
  }
}));

app.get('/api/papers/:id', validateObjectId, asyncHandler(async (req, res) => {
  const paper = await Paper.findById(req.params.id).populate(
    "uploadedBy",
    "name rollNumber class semester"
  );

  if (!paper || paper.status !== "approved") {
    return res.status(404).json({ success: false, message: "Paper Not Found" });
  }

  res.json({ success: true, data: paper });
}));

app.post('/api/papers/:id/download', validateObjectId, asyncHandler(async (req, res) => {
  const paper = await Paper.findById(req.params.id);

  if (!paper) {
    return res.status(404).json({ success: false, message: "Paper not found" });
  }

  // Check if user is admin
  const isAdmin = req.user && ['nitinemailss@gmail.com'].includes(req.user.email);

  if (paper.status !== "approved" && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Paper not available for download"
    });
  }

  if (!paper.fileUrl) {
    return res.status(404).json({ success: false, message: "File URL not found" });
  }

  // Only increment download count for approved papers (not admin previews)
  let updatedPaper = paper;
  if (paper.status === "approved") {
    updatedPaper = await Paper.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloadCount: 1 } },
      { new: true }
    );
  }

  res.json({
    success: true,
    message: isAdmin && paper.status !== "approved" 
      ? "Admin preview access granted" 
      : "Download URL generated",
    data: {
      fileUrl: paper.fileUrl,
      fileName: `${paper.title}.pdf`,
      downloadCount: updatedPaper.downloadCount,
      isAdminPreview: isAdmin && paper.status !== "approved"
    }
  });
}));

app.get('/api/papers', asyncHandler(async (req, res) => {
  const papers = await Paper.find({ status: "approved" })
    .populate("uploadedBy", "name rollNumber")
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({
    success: true,
    count: papers.length,
    data: { papers }
  });
}));

// Upload route
app.post('/api/papers/upload', auth, upload.single('file'), asyncHandler(async (req, res) => {
  const { title, subject, class: paperClass, semester, year, examType, tags } = req.body;

  if (!req.file) throw new Error("No file uploaded.");
  if (!title || !subject || !paperClass || !semester || !year || !examType) {
    throw new Error("Missing required fields.");
  }

  const userId = req.userId;
  const fileName = generatePaperFilename(title);
  const fileUrl = await uploadToR2(req.file.buffer, fileName, req.file.mimetype);

  const paper = await Paper.create({
    title, subject, class: paperClass, semester, year, examType,
    fileName, fileUrl, uploadedBy: userId,
    tags: tags ? JSON.parse(tags) : []
  });

  await User.findByIdAndUpdate(userId, { $inc: { uploadCount: 1 } });

  res.status(201).json({
    success: true,
    message: "Upload Successful! Waiting For Approval",
    data: { paper }
  });
}));

// User routes
app.get('/api/users/me/dashboard', auth, asyncHandler(async (req, res) => {
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
}));

// Admin routes
app.get('/api/admin/stats', auth, adminAuth, asyncHandler(async (req, res) => {
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
}));

app.get('/api/admin/pending-papers', auth, adminAuth, asyncHandler(async (req, res) => {
  const pendingPapers = await Paper.find({ status: "pending" })
    .populate("uploadedBy", "name email rollNumber class semester")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: pendingPapers.length,
    data: { papers: pendingPapers }
  });
}));

app.get('/api/admin/papers', auth, adminAuth, asyncHandler(async (req, res) => {
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
}));

app.put('/api/admin/papers/:id/approve', auth, adminAuth, validateObjectId, asyncHandler(async (req, res) => {
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
}));

app.put('/api/admin/papers/:id/reject', auth, adminAuth, validateObjectId, asyncHandler(async (req, res) => {
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
}));

// Admin preview paper
app.get('/api/admin/papers/:id/preview', auth, adminAuth, validateObjectId, asyncHandler(async (req, res) => {
  const paper = await Paper.findById(req.params.id)
    .populate('uploadedBy', 'name email rollNumber class semester');

  if (!paper) {
    return res.status(404).json({
      success: false,
      message: 'Paper not found'
    });
  }

  res.json({
    success: true,
    data: {
      paper,
      canDownload: true,
      downloadUrl: paper.fileUrl,
      adminPreview: true
    }
  });
}));

// Admin download paper
app.post('/api/admin/papers/:id/download', auth, adminAuth, validateObjectId, asyncHandler(async (req, res) => {
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

  res.json({
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
}));

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  res.status(500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

export default app;
