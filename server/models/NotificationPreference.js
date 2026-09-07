import mongoose from 'mongoose';

const notificationPreferenceSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  frequency: { type: String, enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'IMPORTANT_ONLY'], default: 'DAILY' },
  savingsAlerts: { type: Boolean, default: true },
  expenseAlerts: { type: Boolean, default: true },
  goalAlerts: { type: Boolean, default: true },
  healthAlerts: { type: Boolean, default: true },
  educationAlerts: { type: Boolean, default: true },
  positiveInsights: { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.NotificationPreference || mongoose.model('NotificationPreference', notificationPreferenceSchema);
