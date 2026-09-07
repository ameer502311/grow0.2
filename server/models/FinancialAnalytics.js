import mongoose from 'mongoose';

const financialAnalyticsSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  analysisDate: { type: Date, default: Date.now },
  periodType: { type: String, enum: ['DAILY', 'WEEKLY', 'MONTHLY'], default: 'MONTHLY' },
  totalIncome: { type: Number, default: 0 },
  totalExpenses: { type: Number, default: 0 },
  monthlySavings: { type: Number, default: 0 },
  savingsRate: { type: Number, default: 0 },
  expenseRatio: { type: Number, default: 0 },
  debtRatio: { type: Number, default: 0 },
  emergencyFundMonths: { type: Number, default: 0 },
  financialHealthScore: { type: Number, default: 0 },
  categoryBreakdown: { type: Map, of: Number, default: {} },
  createdAt: { type: Date, default: Date.now }
});

financialAnalyticsSchema.index({ userId: 1, analysisDate: -1 });

export default mongoose.models.FinancialAnalytics || mongoose.model('FinancialAnalytics', financialAnalyticsSchema);
