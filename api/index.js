import mongoose from 'mongoose';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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
    environment: process.env.NODE_ENV || 'production',
    database: {
      status: dbStates[dbStatus] || 'unknown',
      state: dbStatus
    },
    config: {
      mongoUri: process.env.MONGO_URI ? '✓ Set' : '✗ Not Set',
      jwtSecret: process.env.JWT_SECRET ? '✓ Set' : '✗ Not Set',
      r2Configured: !!(process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY_ID) ? '✓ Configured' : '✗ Not Configured'
    },
    version: '2.0.0',
    serverless: true
  });
}
