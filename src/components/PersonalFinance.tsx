import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Plus, Search, Download, Trash2, Target, 
  PiggyBank, ArrowUpRight, AlertTriangle, Calendar, Wallet, CreditCard, TrendingUp, CheckCircle2
} from 'lucide-react';
import { IncomeCategory, ExpenseCategory } from '../types';

interface PersonalFinanceProps {
  onOpenAddModal: (type: 'income' | 'expense') => void;
}

export const PersonalFinance: React.FC<PersonalFinanceProps> = ({ onOpenAddModal }) => {
  const { 
    currencySymbol, incomes = [], expenses = [], budgets = [], savingsGoals = [], 
    deleteIncome, deleteExpense, updateBudget, addSavingsGoal, depositSavingsGoal 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'expenses' | 'incomes' | 'budgets' | 'goals'>('expenses');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Goals modal state
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState<any>('Vacation');
  const [newGoalDate, setNewGoalDate] = useState('2027-12-31');

  // Deposit modal state
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  // Total Calculations
  const totalIncomes = (incomes || []).reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalExpenses = (expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
  const netSavings = totalIncomes - totalExpenses;
  const savingsRatePct = totalIncomes > 0 ? Math.round((netSavings / totalIncomes) * 100) : 0;

  // Filtered Expenses with safe property checks
  const filteredExpenses = (expenses || []).filter(e => {
    if (!e) return false;
    const notes = e.notes || '';
    const category = e.category || 'Other';
    const matchesSearch = notes.toLowerCase().includes((searchQuery || '').toLowerCase()) || 
                          category.toLowerCase().includes((searchQuery || '').toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Export CSV Handler
  const exportTransactionsCSV = () => {
    const headers = ['Type', 'Category', 'Amount', 'Date', 'Notes'];
    const rows = [
      ...(incomes || []).map(i => ['Income', i.category || 'Other', i.amount || 0, i.date || '', i.notes || '']),
      ...(expenses || []).map(e => ['Expense', e.category || 'Other', e.amount || 0, e.date || '', e.notes || ''])
    ];
    
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Grow0.2_Transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle || !newGoalTarget) return;
    addSavingsGoal({
      title: newGoalTitle,
      targetAmount: Number(newGoalTarget),
      targetDate: newGoalDate,
      category: newGoalCategory
    });
    setNewGoalTitle('');
    setNewGoalTarget('');
    setShowGoalModal(false);
  };

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (depositGoalId && depositAmount) {
      depositSavingsGoal(depositGoalId, Number(depositAmount));
      setDepositGoalId(null);
      setDepositAmount('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 card-surface rounded-2xl p-5 sm:p-6">
        <div>
          <div className="flex items-center space-x-2 text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">
            <Wallet className="w-4 h-4" />
            <span>Cash Flow & Financial Planning</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Personal Finance & Savings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track income growth, monitor day-to-day expenses, and manage your long-term wealth milestones.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button 
            onClick={() => onOpenAddModal('expense')}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
          <button 
            onClick={() => onOpenAddModal('income')}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Income
          </button>
        </div>
      </div>

      {/* Top 3 Overview Cards (Section 8: Income = neutral/blue, Expenses = neutral/blue, Savings = Green) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Income Card */}
        <div className="card-surface rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Total Monthly Income</span>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              +{currencySymbol}{totalIncomes.toLocaleString()}
            </p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
              <ArrowUpRight className="w-3 h-3" /> {(incomes || []).length} active streams
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Expenses Card (Neutral/Blue, not alarmist red) */}
        <div className="card-surface rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Total Monthly Expenses</span>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {currencySymbol}{totalExpenses.toLocaleString()}
            </p>
            <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
              {(expenses || []).length} logged expenses
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        {/* Net Savings Card (Growth Green) */}
        <div className="card-surface rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Monthly Net Savings</span>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              +{currencySymbol}{netSavings.toLocaleString()}
            </p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" /> {savingsRatePct}% savings rate
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <PiggyBank className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'expenses' 
              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          Where My Money Goes ({(expenses || []).length})
        </button>
        <button 
          onClick={() => setActiveTab('incomes')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'incomes' 
              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          Income Sources ({(incomes || []).length})
        </button>
        <button 
          onClick={() => setActiveTab('budgets')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'budgets' 
              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          Budget Planner ({(budgets || []).length})
        </button>
        <button 
          onClick={() => setActiveTab('goals')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'goals' 
              ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          Savings Goals & Milestones ({(savingsGoals || []).length})
        </button>
      </div>

      {/* EXPENSES TAB ("Where My Money Goes" - Section 10) */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 card-surface p-3.5 rounded-2xl">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input 
                type="text"
                placeholder="Search notes or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-600"
              >
                <option value="ALL">All Categories</option>
                <option value="Food">Food</option>
                <option value="Shopping">Shopping</option>
                <option value="Travel">Travel</option>
                <option value="Fuel">Fuel</option>
                <option value="Medical">Medical</option>
                <option value="Utilities">Utilities</option>
                <option value="EMI">EMI</option>
                <option value="Rent">Rent</option>
              </select>

              <button 
                onClick={exportTransactionsCSV}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
            </div>
          </div>

          <div className="card-surface rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase font-semibold text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        {exp.category || 'Expense'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{exp.notes || '—'}</td>
                      <td className="py-3 px-4 text-slate-500">{exp.date || ''}</td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-slate-100">
                        {currencySymbol}{(exp.amount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button 
                          onClick={() => deleteExpense(exp.id)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* INCOMES TAB */}
      {activeTab === 'incomes' && (
        <div className="card-surface rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase font-semibold text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Income Stream</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {(incomes || []).map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {inc.category || 'Income'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{inc.notes || '—'}</td>
                    <td className="py-3 px-4 text-slate-500">{inc.date || ''}</td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      +{currencySymbol}{(inc.amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button 
                        onClick={() => deleteIncome(inc.id)}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                        title="Delete Income"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BUDGET PLANNER TAB (Section 3 & 4: Amber for approaching limit, Red ONLY for exceeded budget) */}
      {activeTab === 'budgets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(budgets || []).map((b) => {
            const limit = b.limitAmount || 1;
            const spent = b.spentAmount || 0;
            const usagePct = Math.min(100, Math.round((spent / limit) * 100));
            const isExceeded = spent > limit;
            const isWarning = usagePct >= 80 && !isExceeded;

            return (
              <div key={b.id} className="card-surface rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{b.category || 'Budget'}</h3>
                    <p className="text-[11px] text-slate-500">{b.period || 'Monthly'} Budget</p>
                  </div>
                  {isExceeded && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
                      <AlertTriangle className="w-3 h-3" /> Exceeded Budget
                    </span>
                  )}
                  {isWarning && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                      <AlertTriangle className="w-3 h-3" /> Approaching Limit ({usagePct}%)
                    </span>
                  )}
                  {!isExceeded && !isWarning && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                      On Track
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Spent: <strong className="text-slate-900 dark:text-slate-100">{currencySymbol}{spent.toLocaleString()}</strong></span>
                  <span className="text-slate-500">Limit: <strong className="text-slate-900 dark:text-slate-100">{currencySymbol}{limit.toLocaleString()}</strong></span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      isExceeded ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${usagePct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SAVINGS GOALS TAB (PURPLE IDENTITY - Section 5 & 19) */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button 
              onClick={() => setShowGoalModal(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Savings Goal
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(savingsGoals || []).map((g) => {
              const target = g.targetAmount || 1;
              const current = g.currentAmount || 0;
              const progressPct = Math.min(100, Math.round((current / target) * 100));
              const remaining = Math.max(0, target - current);
              const isCompleted = current >= target;

              return (
                <div key={g.id} className="card-surface rounded-2xl p-5 border-purple-100 dark:border-purple-900/50 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
                        {g.category || 'Goal'}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {g.targetDate || ''}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{g.title || 'Goal'}</h3>
                    
                    <div className="mt-3 space-y-1 text-xs">
                      <div className="flex justify-between text-slate-500">
                        <span>Saved: <strong className="text-slate-900 dark:text-slate-100">{currencySymbol}{current.toLocaleString()}</strong></span>
                        <span>Target: <strong className="text-slate-900 dark:text-slate-100">{currencySymbol}{target.toLocaleString()}</strong></span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                        <span>Progress: <strong className="text-purple-600 dark:text-purple-400">{progressPct}%</strong></span>
                        <span>{isCompleted ? 'Goal Achieved!' : `Remaining: ${currencySymbol}${remaining.toLocaleString()}`}</span>
                      </div>
                    </div>

                    {/* Subtle Purple Progress Bar (Green if Completed) */}
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-3">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-purple-600'}`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  <button 
                    onClick={() => setDepositGoalId(g.id)}
                    className="w-full py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-semibold transition-colors mt-4 cursor-pointer"
                  >
                    + Deposit Funds
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Goal Creation Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-surface rounded-2xl p-6 border border-slate-200 dark:border-slate-800 max-w-md w-full space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Create New Savings Goal</h2>
            <form onSubmit={handleCreateGoal} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Goal Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Emergency Fund, House Down Payment" 
                  value={newGoalTitle} 
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Target Amount ({currencySymbol})</label>
                <input 
                  type="number" 
                  placeholder="50000" 
                  value={newGoalTarget} 
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Category</label>
                <select 
                  value={newGoalCategory} 
                  onChange={(e) => setNewGoalCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600"
                >
                  <option value="Emergency Fund">Emergency Fund</option>
                  <option value="Vacation">Vacation</option>
                  <option value="Vehicle">Vehicle</option>
                  <option value="Home">Home</option>
                  <option value="Education">Education</option>
                  <option value="Retirement">Retirement</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Target Completion Date</label>
                <input 
                  type="date" 
                  value={newGoalDate} 
                  onChange={(e) => setNewGoalDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowGoalModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-sm"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {depositGoalId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-surface rounded-2xl p-6 border border-slate-200 dark:border-slate-800 max-w-sm w-full space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Deposit Funds to Goal</h2>
            <form onSubmit={handleDeposit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Deposit Amount ({currencySymbol})</label>
                <input 
                  type="number" 
                  placeholder="5000" 
                  value={depositAmount} 
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setDepositGoalId(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-sm"
                >
                  Confirm Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
