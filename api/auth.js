import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectDB } from './_lib/db.js';
import { User } from './_lib/models.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await connectDB();

    const path = req.url.split('?')[0];

    // ========== LOGIN ==========
    if (path.includes('/login')) {
      const { rollNumber, password } = req.body;

      if (!rollNumber) {
        return res.status(400).json({
          success: false,
          message: "Roll number is required"
        });
      }

      if (!password) {
        return res.status(400).json({
          success: false,
          message: "Password is required"
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long"
        });
      }

      const user = await User.findOne({ rollNumber: rollNumber.trim().toUpperCase() });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid roll number or password"
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Invalid roll number or password"
        });
      }

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

      return res.json({
        success: true,
        message: "Login successful",
        token,
        user: userResponse
      });
    }

    // ========== REGISTER ==========
    if (path.includes('/register')) {
      const { name, email, rollNumber, class: studentClass, semester, year, password } = req.body;

      if (!name || !email || !rollNumber || !studentClass || !semester || !year || !password) {
        return res.status(400).json({
          success: false,
          message: "All fields are required"
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long"
        });
      }

      const existingUser = await User.findOne({
        $or: [
          { email: email.trim().toLowerCase() },
          { rollNumber: rollNumber.trim().toUpperCase() }
        ]
      });

      if (existingUser) {
        const conflictField = existingUser.rollNumber === rollNumber.trim().toUpperCase() 
          ? 'roll number' 
          : 'email';
        return res.status(400).json({
          success: false,
          message: `Student already exists with this ${conflictField}`
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      
      const newUser = await User.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        rollNumber: rollNumber.trim().toUpperCase(),
        class: studentClass.trim(),
        year: year.trim(),
        semester: semester.trim(),
        password: hashedPassword
      });

      const userResponse = {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        rollNumber: newUser.rollNumber,
        class: newUser.class,
        year: newUser.year,
        semester: newUser.semester
      };

      return res.status(201).json({
        success: true,
        message: "Registration successful",
        user: userResponse
      });
    }

    return res.status(404).json({ success: false, message: 'Route not found' });

  } catch (error) {
    console.error('Auth error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field === 'email' ? 'Email' : 'Roll number'} already exists`
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Authentication failed"
    });
  }
}
