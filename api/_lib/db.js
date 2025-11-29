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

  // Check if MongoDB URI is configured
  if (!process.env.MONGO_URI) {
    throw new Error('❌ MONGO_URI environment variable is not set');
  }

  // Detect environment for logging
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
  const envLabel = isProduction ? '☁️ MongoDB Atlas (Production)' : '🔧 MongoDB Atlas (Development)';

  console.log(`🔄 Connecting to ${envLabel}...`);

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
