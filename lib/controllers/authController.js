import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/fileUtils.js';

export const registerUser = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    rollNumber,
    class: studentClass,
    semester,
    year,
    password,
  } = req.body;

  const existingUser = await User.findOne({
    $or: [{ email }, { rollNumber }],
  });

  if (existingUser) {
    return res.status(400).json({
      message: "Student Already Exist With this Email or Roll number",
    });
  }

  // Hash Password
  const hashedPassword = await bcrypt.hash(password, 12);

  // New user
  const newUser = new User({
    name,
    email,
    rollNumber,
    class: studentClass,
    year,
    semester,
    password: hashedPassword,
  });

  await newUser.save();

  const userResponse = {
    id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    rollNumber: newUser.rollNumber,
    class: newUser.class,
    year: newUser.year,
    semester: newUser.semester,
  };

  res.status(201).json({
    message: "User Registered Successfully",
    user: userResponse,
  });
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: "Invalid Email or Password" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ message: "Invalid Email or Password" });
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  const userResponse = {
    id: user._id,
    name: user.name,
    email: user.email,
    rollNumber: user.rollNumber,
    class: user.class,
    year: user.year,
    semester: user.semester,
  };

  res.json({
    message: "Login Successful",
    token,
    user: userResponse,
  });
});
