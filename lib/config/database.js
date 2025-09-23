import mongoose from 'mongoose';

let cachedDb = null;

export const connectDB = async () => {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
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
