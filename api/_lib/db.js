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

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI environment variable is not set');
  }

  console.log('🔄 Establishing MongoDB connection...');

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
