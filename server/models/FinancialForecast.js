import mongoose from 'mongoose';

const financialForecastSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  scenarioType: { 
    type: String, 
    enum: [
      'BASELINE', 
      'SALARY_REDUCTION', 
      'JOB_LOSS', 
      'EXPENSE_INCREASE', 
      'UNEXPECTED_EXPENSE', 
      'INVESTMENT_CHANGE', 
      'SALARY_INCREASE', 
      'CUSTOM'
    ], 
    default: 'BASELINE' 
  },
  scenarioInput: { type: mongoose.Schema.Types.Mixed, default: {} },
  forecastPeriod: { type: String, enum: ['1M', '3M', '6M', '1Y', '3Y', '5Y', 'ALL'], default: 'ALL' },
  estimatedIncome: { type: Number, default: 0 },
  estimatedExpenses: { type: Number, default: 0 },
  estimatedSavings: { type: Number, default: 0 },
  estimatedInvestmentValue: { type: Number, default: 0 },
  emergencyFundCoverage: { type: Number, default: 0 }, // in months
  goalImpact: {
    delayedGoalsCount: { type: Number, default: 0 },
    delayMonths: { type: Number, default: 0 },
    description: { type: String, default: '' }
  },
  riskLevel: { 
    type: String, 
    enum: ['LOW RISK', 'MODERATE RISK', 'HIGH RISK', 'CRITICAL ATTENTION'], 
    default: 'LOW RISK' 
  },
  financialTrend: {
    income: { type: String, default: 'Stable' },
    expenses: { type: String, default: 'Stable' },
    savings: { type: String, default: 'Stable' },
    investments: { type: String, default: 'Growing' },
    debt: { type: String, default: 'Stable' },
    emergencyFund: { type: String, default: 'Stable' },
    goalProgress: { type: String, default: 'On Track' },
    overallPosition: { type: String, default: 'Stable' }
  },
  assumptions: [{ type: String }],
  aiSummary: {
    summary: { type: String, default: '' },
    goingWell: [{ type: String }],
    concerning: [{ type: String }],
    mayHappen: [{ type: String }],
    actions: [{ type: String }]
  },
  createdAt: { type: Date, default: Date.now }
});

financialForecastSchema.index({ userId: 1, scenarioType: 1, createdAt: -1 });

export default mongoose.models.FinancialForecast || mongoose.model('FinancialForecast', financialForecastSchema);
