import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectDB } from '../_lib/db.js';
import { User } from '../_lib/models.js';

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

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: "Login failed due to server error",
      error: error.message
    });
  }
}
