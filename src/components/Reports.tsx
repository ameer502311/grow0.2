import React from 'react';
import { useApp } from '../context/AppContext';
import { PieChart, BarChart2, TrendingUp, DollarSign, Download, Filter } from 'lucide-react';

export const Reports: React.FC = () => {
  const { expenses, incomes, investments, currencySymbol } = useApp();

  // Aggregate Category Expense Totals
  const categoryTotals: { [cat: string]: number } = {};
  expenses.forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const totalExpenseSum = expenses.reduce((a, c) => a + c.amount, 0) || 1;
  const categoriesList = Object.keys(categoryTotals);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass-panel rounded-3xl p-5 bg-slate-900/60 border-slate-800">
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
          <PieChart className="w-5 h-5 text-emerald-400" /> Reports & Financial Analytics
        </h1>
        <p className="text-xs text-slate-400">Deep visual analytics on expense breakdown, income streams, cash flows, and investment ROI.</p>
      </div>

      {/* Grid Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Expense Breakdown Chart */}
        <div className="glass-panel rounded-3xl p-6 bg-slate-900/60 border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-slate-200">Category Expense Distribution</h2>

          <div className="space-y-3">
            {categoriesList.map((cat) => {
              const amount = categoryTotals[cat];
              const pct = Math.round((amount / totalExpenseSum) * 100);

              return (
                <div key={cat} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-300">{cat}</span>
                    <span className="text-slate-400">{currencySymbol}{amount.toLocaleString()} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cash Flow Visualizer */}
        <div className="glass-panel rounded-3xl p-6 bg-slate-900/60 border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-slate-200">Income vs Expense Cash Flow Comparison</h2>

          <div className="h-56 flex items-end justify-around p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-emerald-400">{currencySymbol}{incomes.reduce((a,c)=>a+c.amount,0).toLocaleString()}</span>
              <div className="w-16 bg-emerald-500 rounded-t-xl" style={{ height: '140px' }} />
              <span className="text-[11px] text-slate-400 font-semibold">Total Income</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-rose-400">{currencySymbol}{expenses.reduce((a,c)=>a+c.amount,0).toLocaleString()}</span>
              <div className="w-16 bg-rose-500 rounded-t-xl" style={{ height: '90px' }} />
              <span className="text-[11px] text-slate-400 font-semibold">Total Expenses</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-amber-400">{currencySymbol}{(incomes.reduce((a,c)=>a+c.amount,0) - expenses.reduce((a,c)=>a+c.amount,0)).toLocaleString()}</span>
              <div className="w-16 bg-amber-400 rounded-t-xl" style={{ height: '110px' }} />
              <span className="text-[11px] text-slate-400 font-semibold">Net Surplus</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
