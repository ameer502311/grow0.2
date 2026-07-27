import mongoose from 'mongoose';

const incomeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  date: { type: Date, required: true },
  notes: { type: String }
});

const expenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  date: { type: Date, required: true },
  notes: { type: String },
  receiptUrl: { type: String }
});

const budgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  limitAmount: { type: Number, required: true },
  period: { type: String, default: 'Monthly' }
});

export const Income = mongoose.model('Income', incomeSchema);
export const Expense = mongoose.model('Expense', expenseSchema);
export const Budget = mongoose.model('Budget', budgetSchema);
