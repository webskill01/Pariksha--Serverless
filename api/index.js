import express from 'express';
import cors from 'cors';
import { connectDB } from '../lib/config/database.js';

// Import route handlers (with .js extension for ES modules)
import authRoutes from '../lib/routes/authRoutes.js';
import paperRoutes from '../lib/routes/paperRoutes.js';
import adminRoutes from '../lib/routes/adminRoutes.js';
import userRoutes from '../lib/routes/userRoutes.js';
import homeRoutes from '../lib/routes/homeRoutes.js';

const app = express();

// CORS Configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://pariksha-gamma.vercel.app',
    process.env.FRONTEND_URL
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Connect to database on every request (with caching)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed'
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/papers', paperRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api', homeRoutes);

// Health check
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Pariksha API is running on Vercel!', 
    timestamp: new Date().toISOString() 
  });
});

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
