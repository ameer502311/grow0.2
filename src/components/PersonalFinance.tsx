import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Plus, Search, Filter, Download, Trash2, Edit3, Target, 
  PiggyBank, ArrowUpRight, ArrowDownRight, AlertTriangle, CheckCircle, Calendar, DollarSign
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
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel rounded-3xl p-5 bg-slate-900/60 border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-white">Personal Finance Center</h1>
          <p className="text-xs text-slate-400">Manage income streams, track category expenses, set budgets & savings milestones.</p>
        </div>

        <div className="flex items-center space-x-2">
          <button 
            onClick={() => onOpenAddModal('expense')}
            className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
          <button 
            onClick={() => onOpenAddModal('income')}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Income
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${activeTab === 'expenses' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Expense Tracking ({(expenses || []).length})
        </button>
        <button 
          onClick={() => setActiveTab('incomes')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${activeTab === 'incomes' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Income Management ({(incomes || []).length})
        </button>
        <button 
          onClick={() => setActiveTab('budgets')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${activeTab === 'budgets' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Budget Planner ({(budgets || []).length})
        </button>
        <button 
          onClick={() => setActiveTab('goals')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${activeTab === 'goals' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Savings Goals ({(savingsGoals || []).length})
        </button>
      </div>

      {/* EXPENSES TAB */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input 
                type="text"
                placeholder="Search notes or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
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
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
            </div>
          </div>

          <div className="glass-panel rounded-3xl overflow-hidden border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Notes</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-200 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-400" />
                        {exp.category || 'Expense'}
                      </td>
                      <td className="py-3 px-4 text-slate-300">{exp.notes || '—'}</td>
                      <td className="py-3 px-4 text-slate-400">{exp.date || ''}</td>
                      <td className="py-3 px-4 text-right font-bold text-rose-400">
                        -{currencySymbol}{(exp.amount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button 
                          onClick={() => deleteExpense(exp.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
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
        <div className="glass-panel rounded-3xl overflow-hidden border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Income Stream</th>
                  <th className="py-3.5 px-4">Notes</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(incomes || []).map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      {inc.category || 'Income'}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{inc.notes || '—'}</td>
                    <td className="py-3 px-4 text-slate-400">{inc.date || ''}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400">
                      +{currencySymbol}{(inc.amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button 
                        onClick={() => deleteIncome(inc.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
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

      {/* BUDGET PLANNER TAB */}
      {activeTab === 'budgets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(budgets || []).map((b) => {
            const limit = b.limitAmount || 1;
            const spent = b.spentAmount || 0;
            const usagePct = Math.min(100, Math.round((spent / limit) * 100));
            const isExceeded = spent > limit;
            const isWarning = usagePct >= 80 && !isExceeded;

            return (
              <div key={b.id} className="glass-panel rounded-3xl p-5 bg-slate-900/60 border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-100">{b.category || 'Budget'}</h3>
                    <p className="text-[11px] text-slate-400">{b.period || 'Monthly'} Target</p>
                  </div>
                  {isExceeded && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> 100% Exceeded
                    </span>
                  )}
                  {isWarning && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> 80% Used
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-400">Spent: <span className="text-slate-200">{currencySymbol}{spent.toLocaleString()}</span></span>
                  <span className="text-slate-400">Limit: <span className="text-emerald-400">{currencySymbol}{limit.toLocaleString()}</span></span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden p-0.5 border border-slate-800">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${isExceeded ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-gradient-to-r from-emerald-500 to-teal-400'}`}
                    style={{ width: `${usagePct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SAVINGS GOALS TAB */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button 
              onClick={() => setShowGoalModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
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

              return (
                <div key={g.id} className="glass-panel glass-card-hover rounded-3xl p-5 bg-slate-900/60 border-slate-800 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {g.category || 'Goal'}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {g.targetDate || ''}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-white">{g.title || 'Goal'}</h3>
                    
                    <div className="mt-3 space-y-1 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Saved: <strong className="text-emerald-400">{currencySymbol}{current.toLocaleString()}</strong></span>
                        <span>Target: <strong className="text-slate-200">{currencySymbol}{target.toLocaleString()}</strong></span>
                      </div>
                      <p className="text-[11px] text-slate-400">Remaining: {currencySymbol}{remaining.toLocaleString()}</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden mt-3 border border-slate-800">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  <button 
                    onClick={() => setDepositGoalId(g.id)}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all mt-4"
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-6 bg-slate-900 border-slate-800 max-w-md w-full space-y-4">
            <h2 className="text-lg font-bold text-white">Create New Savings Goal</h2>
            <form onSubmit={handleCreateGoal} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Goal Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Electric Bike, House Deposit" 
                  value={newGoalTitle} 
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Target Amount ({currencySymbol})</label>
                <input 
                  type="number" 
                  placeholder="250000" 
                  value={newGoalTarget} 
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Target Completion Date</label>
                <input 
                  type="date" 
                  value={newGoalDate} 
                  onChange={(e) => setNewGoalDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowGoalModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {depositGoalId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-6 bg-slate-900 border-slate-800 max-w-sm w-full space-y-4">
            <h2 className="text-base font-bold text-white">Deposit Savings</h2>
            <form onSubmit={handleDeposit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Deposit Amount ({currencySymbol})</label>
                <input 
                  type="number" 
                  placeholder="5000" 
                  value={depositAmount} 
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setDepositGoalId(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold"
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
