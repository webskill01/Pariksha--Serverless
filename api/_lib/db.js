// api/_lib/db.js
import mongoose from 'mongoose';

let cachedDb = null;
let connectionPromise = null;

export const connectDB = async () => {
  // Return cached connection if available
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  // Return pending connection promise if exists
  if (connectionPromise) {
    return connectionPromise;
  }

  // Detect environment
  const isVercel = process.env.VERCEL === '1';
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = !isVercel && !isProduction;

  // Choose MongoDB URI based on environment
  let mongoUri;
  let envLabel;

  if (isDevelopment && process.env.MONGO_URI_LOCAL) {
    // Local development with local MongoDB
    mongoUri = process.env.MONGO_URI_LOCAL;
    envLabel = 'Local MongoDB (Compass)';
  } else if (process.env.MONGO_URI) {
    // Production or fallback to Atlas
    mongoUri = process.env.MONGO_URI;
    envLabel = isProduction ? 'MongoDB Atlas (Production)' : 'MongoDB Atlas (Dev Fallback)';
  } else {
    throw new Error('No MongoDB URI configured. Set MONGO_URI_LOCAL for local dev or MONGO_URI for production.');
  }

  console.log(`🔄 Connecting to ${envLabel}...`);

  connectionPromise = mongoose.connect(mongoUri, {
    bufferCommands: false,
    maxPoolSize: isDevelopment ? 5 : 10,
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 15000,
    maxIdleTimeMS: 30000,
    retryWrites: true,
    retryReads: true,
  });

  try {
    cachedDb = await connectionPromise;
    console.log(`✅ Connected to ${envLabel}`);
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB error:', err);
      cachedDb = null;
      connectionPromise = null;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
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
