import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
  isVerified: { type: Boolean, default: false },
  currency: { type: String, default: 'INR' },
  geminiApiKey: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', userSchema);
export default User;
