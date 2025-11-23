export default function handler(req, res) {
  res.status(200).json({ 
    message: 'Hello from Vercel Serverless!',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
}
