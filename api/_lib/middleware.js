// api/_lib/middleware.js
import jwt from 'jsonwebtoken';
import { User } from './models.js';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Remove asyncHandler - handle errors in each route instead

export const auth = async (req, res, next) => {
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
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "User not found" 
      });
    }
    
    req.userId = decoded.userId;
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ 
      success: false,
      message: "Invalid or expired token" 
    });
  }
};

export const adminAuth = async (req, res, next) => {
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

export const optionalAuth = async (req, res, next) => {
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
      // Continue without auth
    }
  }
  next();
};
