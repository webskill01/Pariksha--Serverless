import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const app = express();
// Enhanced middleware for better JSON parsing
app.use(express.json({ 
  limit: '50mb',
  type: ['application/json', 'text/plain']
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '50mb',
  type: 'application/x-www-form-urlencoded'
}));

// Add middleware to log and fix content-type issues
app.use((req, res, next) => {
  console.log('Request details:', {
    method: req.method,
    url: req.url,
    contentType: req.headers['content-type'],
    bodyKeys: Object.keys(req.body || {}),
    hasBody: !!req.body
  });

  // Fix missing content-type for JSON requests
  if (req.url.includes('/auth/') && !req.headers['content-type']) {
    req.headers['content-type'] = 'application/json';
  }

  next();
});

// CORS Configuration - FIRST
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://pariksha-serverless.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
// RAW BODY PARSING - CRITICAL FIX
app.use(express.raw({ type: 'application/json', limit: '50mb' }));
app.use((req, res, next) => {
  if (req.body && req.body.length > 0) {
    try {
      const bodyStr = req.body.toString('utf8');
      req.body = JSON.parse(bodyStr);
    } catch (e) {
      console.error('JSON parsing error:', e);
    }
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  if (req.url.includes('/auth/')) {
    console.log('Auth request:', {
      method: req.method,
      url: req.url,
      contentType: req.headers['content-type'],
      bodyType: typeof req.body,
      bodyKeys: typeof req.body === 'object' ? Object.keys(req.body || {}) : 'not-object',
      bodyLength: req.body ? JSON.stringify(req.body).length : 0,
      rawBody: req.body
    });
  }
  next();
});

// Enhanced Database connection for serverless
let cachedDb = null;
let connectionPromise = null;

const connectDB = async () => {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI environment variable is not set');
  }

  console.log('Establishing MongoDB connection...');

  connectionPromise = mongoose.connect(process.env.MONGO_URI, {
    bufferCommands: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 15000,
    maxIdleTimeMS: 30000,
    retryWrites: true,
    retryReads: true,
  });

  try {
    cachedDb = await connectionPromise;
    console.log('✅ MongoDB connected successfully');
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB error:', err);
      cachedDb = null;
      connectionPromise = null;
    });

    return cachedDb;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    cachedDb = null;
    connectionPromise = null;
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

// R2 Configuration with lazy initialization
let r2Client = null;
const getR2Client = () => {
  if (!r2Client && process.env.R2_ENDPOINT) {
    r2Client = new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
      },
      forcePathStyle: true,
      signatureVersion: "v4",
    });
  }
  return r2Client;
};

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
    const client = getR2Client();
    if (!client) {
      throw new Error('R2 client not configured - missing environment variables');
    }

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: fileName,
      Body: fileBuffer,
      ContentType: mimeType,
    });
    
    await client.send(command);
    return `${process.env.R2_PUBLIC_URL}/${fileName}`;
  } catch (error) {
    console.error("R2 upload error:", error);
    throw new Error("Failed to upload file to cloud storage");
  }
};

const deleteFromR2 = async (fileName) => {
  try {
    const client = getR2Client();
    if (!client) return false;

    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: fileName
    });

    await client.send(command);
    console.log(`Successfully deleted file: ${fileName}`);
    return true;
  } catch (error) {
    console.error(`R2 delete error for ${fileName}:`, error);
    return false;
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
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Enhanced Auth middleware with better error handling
const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ 
      success: false, 
      message: "Authentication required" 
    });
  }

  const token = authHeader.split(" ")[1];
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

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
      success: false,
      message: "Invalid or expired token" 
    });
  }
};

// Optional auth middleware (for download route)
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user) {
        req.userId = decoded.userId;
        req.user = user;
      }
    } catch (err) {
      // Continue without auth if token is invalid
    }
  }
  next();
};

// Admin auth middleware
const adminAuth = async (req, res, next) => {
  const adminEmails = ["nitinemailss@gmail.com"];
  
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "User authentication required"
    });
  }

  if (!adminEmails.includes(req.user.email)) {
    return res.status(403).json({
      success: false,
      message: "Access Denied - Admin Privileges Required"
    });
  }

  next();
};

// Enhanced database connection middleware
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection middleware error:', error);
    
    const errorMessage = error.message || 'Database connection failed';
    const isAtlasError = errorMessage.includes('MongoDB Atlas cluster');
    
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: isAtlasError ? 
        'Database temporarily unavailable. Please check your connection and try again.' : 
        errorMessage,
      code: isAtlasError ? 'DB_CONNECTION_ERROR' : 'UNKNOWN_DB_ERROR',
      ...(process.env.NODE_ENV === 'development' && { 
        fullError: error.message,
        stack: error.stack 
      })
    });
  }
});

// ROUTES

// Health check with comprehensive status
app.get('/api', asyncHandler(async (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStates = {
    0: 'disconnected',
    1: 'connected', 
    2: 'connecting',
    3: 'disconnecting'
  };

  res.json({ 
    message: 'Pariksha API is running on Vercel!', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStates[dbStatus] || 'unknown',
      state: dbStatus
    },
    config: {
      mongoUri: process.env.MONGO_URI ? 'Set' : 'Not Set',
      jwtSecret: process.env.JWT_SECRET ? 'Set' : 'Not Set',
      r2Configured: !!(process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY_ID)
    }
  });
}));

// Home stats with comprehensive error handling
app.get('/api/stats', asyncHandler(async (req, res) => {
  try {
    // Ensure connection before queries
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    const [totalPapers, totalUsers, totalDownloads] = await Promise.all([
      Paper.countDocuments({ status: 'approved' }).catch(() => 0),
      User.countDocuments().catch(() => 0),
      Paper.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: null, totalDownloads: { $sum: '$downloadCount' } } }
      ]).then(result => result[0]?.totalDownloads || 0).catch(() => 0)
    ]);

    res.json({
      success: true,
      data: { 
        totalPapers: totalPapers || 0, 
        totalUsers: totalUsers || 0, 
        totalDownloads: totalDownloads || 0 
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    
    // Return fallback data for graceful degradation
    res.json({
      success: true,
      data: { 
        totalPapers: 0, 
        totalUsers: 0, 
        totalDownloads: 0 
      },
      fallback: true,
      note: 'Showing fallback data due to temporary database issue'
    });
  }
}));

// Recent papers endpoint
app.get('/api/recent', asyncHandler(async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    const recentPapers = await Paper.find({ status: 'approved' })
      .populate('uploadedBy', 'name rollNumber')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: { papers: recentPapers || [] }
    });
  } catch (error) {
    console.error('Error fetching recent papers:', error);
    res.json({
      success: true,
      data: { papers: [] },
      fallback: true
    });
  }
}));

// Auth routes
// REGISTER ROUTE
app.post('/api/auth/register', asyncHandler(async (req, res) => {
  console.log('=== REGISTER REQUEST ===');
  console.log('Body:', req.body);

  const { name, email, rollNumber, class: studentClass, semester, year, password } = req.body || {};

  // Validation
  if (!name || !email || !rollNumber || !studentClass || !semester || !year || !password) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
      missing: {
        name: !name,
        email: !email,
        rollNumber: !rollNumber,
        class: !studentClass,
        semester: !semester,
        year: !year,
        password: !password
      }
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters long"
    });
  }

  try {
    // Check for existing user
    const existingUser = await User.findOne({
      $or: [
        { email: email.trim().toLowerCase() },
        { rollNumber: rollNumber.trim().toUpperCase() }
      ]
    });

    if (existingUser) {
      const conflictField = existingUser.email === email.trim().toLowerCase() ? 'email' : 'rollNumber';
      return res.status(400).json({
        success: false,
        message: `Student already exists with this ${conflictField}`,
        field: conflictField
      });
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const newUser = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      rollNumber: rollNumber.trim().toUpperCase(),
      class: studentClass.trim(),
      year: year.trim(),
      semester: semester.trim(),
      password: hashedPassword
    });

    await newUser.save();

    const userResponse = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      rollNumber: newUser.rollNumber,
      class: newUser.class,
      year: newUser.year,
      semester: newUser.semester
    };

    console.log('✅ Registration successful:', newUser.rollNumber);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      user: userResponse
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field === 'email' ? 'Email' : 'Roll number'} already exists`,
        field: field
      });
    }

    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message
    });
  }
}));


// FIXED LOGIN ROUTE
app.post('/api/auth/login', asyncHandler(async (req, res) => {
  console.log('=== LOGIN REQUEST ===');
  console.log('Headers:', req.headers);
  console.log('Body type:', typeof req.body);
  console.log('Body content:', req.body);
  console.log('Body keys:', Object.keys(req.body || {}));

  // Handle both rollNumber and email login
  const { rollNumber, email, password } = req.body || {};

  // Check if request body exists and has data
  if (!req.body || (typeof req.body === 'object' && Object.keys(req.body).length === 0)) {
    console.log('❌ Empty request body detected');
    return res.status(400).json({
      success: false,
      message: "Request body is missing or empty",
      debug: {
        bodyType: typeof req.body,
        bodyKeys: Object.keys(req.body || {}),
        contentType: req.headers['content-type']
      }
    });
  }

  // Determine login field (rollNumber has priority)
  const loginField = rollNumber || email;
  const loginType = rollNumber ? 'rollNumber' : 'email';

  if (!loginField) {
    console.log('❌ No login field provided');
    return res.status(400).json({
      success: false,
      message: "Roll number or email is required",
      field: "rollNumber",
      received: { rollNumber, email, hasPassword: !!password }
    });
  }

  if (!password) {
    console.log('❌ No password provided');
    return res.status(400).json({
      success: false,
      message: "Password is required",
      field: "password",
      received: { loginField: loginField, hasPassword: false }
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters long",
      field: "password"
    });
  }

  try {
    // Find user by rollNumber or email
    let user;
    const searchField = loginField.trim();
    
    if (loginType === 'rollNumber') {
      user = await User.findOne({ rollNumber: searchField.toUpperCase() });
      console.log('🔍 Searching by rollNumber:', searchField.toUpperCase());
    } else {
      user = await User.findOne({ email: searchField.toLowerCase() });
      console.log('🔍 Searching by email:', searchField.toLowerCase());
    }

    if (!user) {
      console.log('❌ User not found');
      return res.status(400).json({
        success: false,
        message: `Invalid ${loginType} or password`,
        debug: "User not found"
      });
    }

    console.log('✅ User found:', user.rollNumber);

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password');
      return res.status(400).json({
        success: false,
        message: `Invalid ${loginType} or password`,
        debug: "Password mismatch"
      });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      rollNumber: user.rollNumber,
      class: user.class,
      year: user.year,
      semester: user.semester
    };

    console.log('✅ Login successful:', user.rollNumber);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: "Login failed due to server error",
      error: error.message
    });
  }
}));


// Paper routes with enhanced error handling
app.get('/api/papers/filters', asyncHandler(async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    const { search, subject, class: className, semester, examType, year, sortBy } = req.query;
    let query = { status: 'approved' };

    // Build search query
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { subject: searchRegex },
        { tags: { $in: [searchRegex] } }
      ];
    }

    // Apply filters
    if (subject && subject.trim()) query.subject = { $regex: subject.trim(), $options: 'i' };
    if (className && className.trim()) query.class = { $regex: className.trim(), $options: 'i' };
    if (semester && semester.trim()) query.semester = semester.trim();
    if (examType && examType.trim()) query.examType = examType.trim();
    if (year && year.trim()) query.year = year.trim();

    // Sorting
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
      fallback: true,
      error: 'Temporary error fetching papers'
    });
  }
}));

app.get('/api/papers/filter-options', asyncHandler(async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

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
        examTypes: examTypes.filter(Boolean).sort(),
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
}));

app.get('/api/papers/:id', validateObjectId, asyncHandler(async (req, res) => {
  const paper = await Paper.findById(req.params.id).populate(
    "uploadedBy",
    "name rollNumber class semester"
  );

  if (!paper || paper.status !== "approved") {
    return res.status(404).json({ 
      success: false, 
      message: "Paper not found or not available" 
    });
  }

  res.json({ success: true, data: paper });
}));

app.post('/api/papers/:id/download', validateObjectId, optionalAuth, asyncHandler(async (req, res) => {
  const paper = await Paper.findById(req.params.id);

  if (!paper) {
    return res.status(404).json({ 
      success: false, 
      message: "Paper not found" 
    });
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
    return res.status(404).json({ 
      success: false, 
      message: "File not available" 
    });
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
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    const papers = await Paper.find({ status: "approved" })
      .populate("uploadedBy", "name rollNumber")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      count: papers?.length || 0,
      data: { papers: papers || [] }
    });
  } catch (error) {
    console.error('Papers error:', error);
    res.json({
      success: true,
      count: 0,
      data: { papers: [] },
      fallback: true
    });
  }
}));

// Upload route with enhanced validation
app.post('/api/papers/upload', auth, upload.single('file'), asyncHandler(async (req, res) => {
  const { title, subject, class: paperClass, semester, year, examType, tags } = req.body;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded"
    });
  }

  if (!title || !subject || !paperClass || !semester || !year || !examType) {
    return res.status(400).json({
      success: false,
      message: "All required fields must be provided"
    });
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

  res.status(201).json({
    success: true,
    message: "Paper uploaded successfully! Waiting for admin approval",
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

  const stats = {
    total: myPapers.length,
    pending: myPapers.filter(p => p.status === "pending").length,
    approved: myPapers.filter(p => p.status === "approved").length,
    rejected: myPapers.filter(p => p.status === "rejected").length,
    totalDownloads: myPapers.reduce((sum, p) => sum + p.downloadCount, 0)
  };

  res.json({
    success: true,
    data: { stats, papers: myPapers }
  });
}));

app.delete('/api/users/me/paper/:id', auth, validateObjectId, asyncHandler(async (req, res) => {
  const paper = await Paper.findById(req.params.id);

  if (!paper || paper.uploadedBy.toString() !== req.userId) {
    return res.status(404).json({ 
      success: false, 
      message: "Paper not found or access denied" 
    });
  }

  // Delete file from R2 if exists
  if (paper.fileName) {
    await deleteFromR2(paper.fileName);
  }

  await Paper.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: "Paper deleted successfully"
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
      papers: { 
        total: totalPapers, 
        pending: pendingPapers, 
        approved: approvedPapers, 
        rejected: rejectedPapers 
      },
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
  if (status) filters.status = status;

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
    return res.status(404).json({ 
      success: false, 
      message: 'Paper not found' 
    });
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
}));

app.delete('/api/admin/papers/:id', auth, adminAuth, validateObjectId, asyncHandler(async (req, res) => {
  const paper = await Paper.findById(req.params.id);
  
  if (!paper) {
    return res.status(404).json({ 
      success: false, 
      message: 'Paper not found' 
    });
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

// Admin download paper for preview
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
      message: 'File not available'
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
      downloadCount: paper.downloadCount
    }
  });
}));

// Enhanced error handling middleware
app.use((error, req, res, next) => {
  console.error('API Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(error.errors).map(err => err.message)
    });
  }

  if (error.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate entry error',
      field: Object.keys(error.keyPattern)[0]
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  if (error.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: error.message || 'File upload error'
    });
  }

  res.status(500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      details: error 
    })
  });
});

// 404 handler - must be last
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /api',
      'GET /api/stats',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/papers',
      'GET /api/papers/filters'
    ]
  });
});

export default app;
