import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  user_id: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['INCOME', 'EXPENSE'], required: true },
  category: { type: String, required: true, index: true },
  description: { type: String, required: true },
  payment_method: { type: String, default: 'GPay / UPI' },
  transaction_date: { type: String, required: true, index: true }, // YYYY-MM-DD
  time: { type: String, default: '12:00 PM' },
  status: { type: String, default: 'COMPLETED' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const BudgetSchema = new mongoose.Schema({
  user_id: { type: String, required: true, index: true },
  monthly_income: { type: Number, required: true },
  fixed_expenses: { type: Number, default: 0 },
  planned_investments: { type: Number, default: 0 },
  savings_target: { type: Number, default: 0 },
  upcoming_payments: { type: Number, default: 0 },
  month: { type: String, required: true }, // YYYY-MM
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const BillReminderSchema = new mongoose.Schema({
  user_id: { type: String, required: true, index: true },
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  due_date: { type: String, required: true, index: true }, // YYYY-MM-DD
  category: { type: String, required: true, index: true },
  recurring_frequency: { type: String, default: 'MONTHLY' },
  payment_status: { type: String, enum: ['DUE_TODAY', 'DUE_TOMORROW', 'DUE_THIS_WEEK', 'OVERDUE', 'PAID', 'SCHEDULED'], default: 'DUE_THIS_WEEK', index: true },
  reminder_status: { type: String, default: 'ACTIVE' },
  notes: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const SubscriptionSchema = new mongoose.Schema({
  user_id: { type: String, required: true, index: true },
  name: { type: String, required: true },
  cost: { type: Number, required: true },
  billing_frequency: { type: String, enum: ['MONTHLY', 'YEARLY'], default: 'MONTHLY' },
  next_billing_date: { type: String, required: true },
  payment_method: { type: String, default: 'Auto-Debit' },
  category: { type: String, default: 'Entertainment' },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const SavingsGoalSchema = new mongoose.Schema({
  user_id: { type: String, required: true, index: true },
  name: { type: String, required: true },
  target_amount: { type: Number, required: true },
  current_saved: { type: Number, default: 0 },
  target_date: { type: String, required: true },
  monthly_contribution: { type: Number, default: 0 },
  priority: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' },
  category: { type: String, default: 'General' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const LendingRecordSchema = new mongoose.Schema({
  user_id: { type: String, required: true, index: true },
  type: { type: String, enum: ['LENT', 'BORROWED'], required: true },
  person_name: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  due_date: { type: String, default: '' },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['PENDING', 'PARTIAL', 'SETTLED'], default: 'PENDING', index: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export const TransactionModel = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
export const BudgetModel = mongoose.models.Budget || mongoose.model('Budget', BudgetSchema);
export const BillReminderModel = mongoose.models.BillReminder || mongoose.model('BillReminder', BillReminderSchema);
export const SubscriptionModel = mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);
export const SavingsGoalModel = mongoose.models.SavingsGoal || mongoose.model('SavingsGoal', SavingsGoalSchema);
export const LendingRecordModel = mongoose.models.LendingRecord || mongoose.model('LendingRecord', LendingRecordSchema);
