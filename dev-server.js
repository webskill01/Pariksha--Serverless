import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load .env.development for dev server
dotenv.config({ path: '.env.development' });

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// Dynamic import for API routes
const loadRoutes = async () => {
  try {
    // Health check
    const indexHandler = await import('./api/index.js');
    app.get('/api', indexHandler.default);

    // Stats and recent
    const statsHandler = await import('./api/stats.js');
    app.get('/api/stats', statsHandler.default);

    const recentHandler = await import('./api/recent.js');
    app.get('/api/recent', recentHandler.default);

    // Auth routes
    const authHandler = await import('./api/auth.js');
    app.post('/api/auth/login', authHandler.default);
    app.post('/api/auth/register', authHandler.default);

    // Papers routes
    const papersHandler = await import('./api/papers.js');
    app.all('/api/papers*', papersHandler.default);

    // User routes
    const userHandler = await import('./api/user.js');
    app.all('/api/user*', userHandler.default);

    // Admin routes
    const adminHandler = await import('./api/admin.js');
    app.all('/api/admin*', adminHandler.default);

    console.log('✅ All API routes loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load routes:', error);
    process.exit(1);
  }
};

// Load routes and start server
await loadRoutes();

app.listen(PORT, () => {
  console.log(`\n🚀 API Development Server`);
  console.log(`📍 Running on: http://localhost:${PORT}`);
  console.log(`🗄️  MongoDB: ${process.env.MONGO_URI ? 'MongoDB Atlas' : 'Not configured'}`);
  console.log(`\n✨ Ready to accept requests!\n`);
});
