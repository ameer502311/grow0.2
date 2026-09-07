import mongoose from 'mongoose';

const financialRecommendationSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  category: { 
    type: String, 
    enum: [
      'SAVINGS', 
      'EXPENSE', 
      'GOAL', 
      'INVESTMENT_EDUCATION', 
      'DEBT', 
      'EMERGENCY_FUND', 
      'FINANCIAL_HEALTH', 
      'POSITIVE_HABIT'
    ],
    default: 'SAVINGS' 
  },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
  source: { type: String, enum: ['RULE_ENGINE', 'AI', 'HYBRID'], default: 'RULE_ENGINE' },
  createdAt: { type: Date, default: Date.now },
  readAt: { type: Date, default: null },
  notificationSent: { type: Boolean, default: false },
  notificationSentAt: { type: Date, default: null }
});

financialRecommendationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.FinancialRecommendation || mongoose.model('FinancialRecommendation', financialRecommendationSchema);
