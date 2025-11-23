import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  class: { type: String, required: true },
  semester: { type: String, required: true },
  year: { type: String, required: true },
  rollNumber: { type: String, required: true, unique: true, uppercase: true },
  uploadCount: { type: Number, default: 0 }
}, { timestamps: true });

const paperSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  subject: { type: String, required: true, trim: true },
  class: { type: String, required: true },
  semester: { type: String, required: true },
  year: { type: String, required: true },
  examType: { type: String, required: true, enum: ["Mst-1", "Mst-2", "Final"] },
  fileName: String,
  fileUrl: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  downloadCount: { type: Number, default: 0 },
  rejectionReason: { type: String, default: null },
  tags: [{ type: String, lowercase: true }]
}, { timestamps: true });

paperSchema.index({ class: 1, semester: 1, subject: 1 });

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Paper = mongoose.models.Paper || mongoose.model('Paper', paperSchema);
