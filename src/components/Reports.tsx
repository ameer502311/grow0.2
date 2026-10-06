import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  PieChart, BarChart2, TrendingUp, DollarSign, Download, Filter, X, 
  Sparkles, ShieldAlert, CheckCircle2, AlertCircle, RefreshCw, Layers, ArrowUpRight
} from 'lucide-react';
import { fetchFuturePredictionsApi } from '../services/api';

interface ReportsProps {
  onExit?: () => void;
}

export const Reports: React.FC<ReportsProps> = ({ onExit }) => {
  const { expenses, incomes, investments, loans, savingsGoals, currencySymbol } = useApp();

  // Aggregate Category Expense Totals
  const categoryTotals: { [cat: string]: number } = {};
  expenses.forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const totalExpenseSum = expenses.reduce((a, c) => a + c.amount, 0) || 1;
  const totalIncomeSum = incomes.reduce((a, c) => a + c.amount, 0);
  const totalInvestmentsSum = investments ? investments.reduce((a, c) => a + (c.investedAmount || 0), 0) : 0;
  const totalDebtSum = loans ? loans.reduce((a, c) => a + (c.remainingBalance || c.principalAmount || 0), 0) : 0;
  const monthlyEmiSum = loans ? loans.reduce((a, c) => a + (c.monthlyEmi || 0), 0) : 0;

  const categoriesList = Object.keys(categoryTotals);

  // Future Prediction State
  const [projectionsData, setProjectionsData] = useState<any>(null);
  const [predictionLoading, setPredictionLoading] = useState<boolean>(false);

  const loadFuturePredictions = async () => {
    setPredictionLoading(true);
    try {
      const snapshot = {
        monthlyIncome: totalIncomeSum || 85000,
        monthlyExpenses: totalExpenseSum > 1 ? totalExpenseSum : 42000,
        currentInvestments: totalInvestmentsSum || 150000,
        currentSavings: Math.max(0, totalIncomeSum - totalExpenseSum),
        totalDebt: totalDebtSum,
        monthlyEmi: monthlyEmiSum,
        goals: (savingsGoals || []).map(g => ({
          name: g.title,
          targetAmount: g.targetAmount,
          currentAmount: g.currentAmount
        }))
      };
      const res = await fetchFuturePredictionsApi(snapshot);
      if (res && res.success) {
        setProjectionsData(res);
      }
    } finally {
      setPredictionLoading(false);
    }
  };

  useEffect(() => {
    loadFuturePredictions();
  }, [incomes.length, expenses.length]);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="card-surface rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Reports & Financial Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Deep visual analytics on expense breakdown, cash flows, and deterministic future wealth projections.</p>
        </div>

        {onExit && (
          <button 
            onClick={onExit}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            title="Exit to Dashboard"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Grid Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Expense Breakdown Chart */}
        <div className="glass-panel rounded-3xl p-6 bg-slate-900/60 border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-slate-200">Category Expense Distribution</h2>

          <div className="space-y-3">
            {categoriesList.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No expense records found. Add expenses to generate category breakdown.</p>
            ) : (
              categoriesList.map((cat) => {
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
              })
            )}
          </div>
        </div>

        {/* Cash Flow Visualizer */}
        <div className="glass-panel rounded-3xl p-6 bg-slate-900/60 border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-slate-200">Income vs Expense Cash Flow Comparison</h2>

          <div className="h-56 flex items-end justify-around p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-emerald-400">{currencySymbol}{totalIncomeSum.toLocaleString()}</span>
              <div className="w-16 bg-emerald-500 rounded-t-xl" style={{ height: `${Math.min(150, Math.max(20, (totalIncomeSum / (totalIncomeSum || 1)) * 140))}px` }} />
              <span className="text-[11px] text-slate-400 font-semibold">Total Income</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-rose-400">{currencySymbol}{totalExpenseSum.toLocaleString()}</span>
              <div className="w-16 bg-rose-500 rounded-t-xl" style={{ height: `${Math.min(150, Math.max(20, (totalExpenseSum / (totalIncomeSum || totalExpenseSum || 1)) * 140))}px` }} />
              <span className="text-[11px] text-slate-400 font-semibold">Total Expenses</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-amber-400">{currencySymbol}{Math.max(0, totalIncomeSum - totalExpenseSum).toLocaleString()}</span>
              <div className="w-16 bg-amber-400 rounded-t-xl" style={{ height: `${Math.min(150, Math.max(20, (Math.max(0, totalIncomeSum - totalExpenseSum) / (totalIncomeSum || 1)) * 140))}px` }} />
              <span className="text-[11px] text-slate-400 font-semibold">Net Surplus</span>
            </div>
          </div>
        </div>
      </div>

      {/* FUTURE FINANCIAL PREDICTION & WEALTH PROJECTIONS SECTION */}
      <div className="glass-panel rounded-3xl p-6 bg-slate-900/60 border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" /> Future Financial Projections (Deterministic Compound Engine)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Deterministic mathematical models project your wealth trajectory across 1, 3, and 5-year horizons with Groq AI synthesis.
            </p>
          </div>

          <button 
            onClick={loadFuturePredictions}
            disabled={predictionLoading}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-2 self-start sm:self-center transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${predictionLoading ? 'animate-spin' : ''}`} /> Recalculate
          </button>
        </div>

        {projectionsData && (
          <div className="space-y-6">
            {/* Core Deterministic Metric Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 font-medium block">Monthly Surplus</span>
                <p className="text-lg font-black text-emerald-400 mt-1">
                  {currencySymbol}{projectionsData.metrics.monthlySurplus.toLocaleString()}
                </p>
                <span className="text-[10px] text-slate-500 font-semibold">Unallocated Cashflow</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 font-medium block">Savings Rate</span>
                <p className="text-lg font-black text-blue-400 mt-1">
                  {projectionsData.metrics.savingsRate}%
                </p>
                <span className="text-[10px] text-slate-500 font-semibold">Of Monthly Inflow</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 font-medium block">Liquid Portfolio</span>
                <p className="text-lg font-black text-amber-400 mt-1">
                  {currencySymbol}{projectionsData.metrics.currentLiquidAssets.toLocaleString()}
                </p>
                <span className="text-[10px] text-slate-500 font-semibold">Invested + Bank Reserves</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 font-medium block">Debt Freedom</span>
                <p className="text-lg font-black text-purple-400 mt-1">
                  {projectionsData.metrics.monthsToDebtFree > 0 ? `${projectionsData.metrics.monthsToDebtFree} Months` : 'Debt Free'}
                </p>
                <span className="text-[10px] text-slate-500 font-semibold">At Current Monthly EMI</span>
              </div>
            </div>

            {/* Projection Cards across 1, 3, and 5 Years */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {['oneYear', 'threeYear', 'fiveYear'].map((key) => {
                const proj = projectionsData.projections[key];
                if (!proj) return null;

                return (
                  <div key={key} className="p-5 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">{proj.label}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {proj.months} MO
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Conservative (6.5% p.a.)</span>
                        <span className="font-bold text-slate-200">{currencySymbol}{proj.conservative.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                        <span className="text-slate-300 font-semibold">Balanced (10% p.a.)</span>
                        <span className="font-bold text-emerald-400">{currencySymbol}{proj.moderate.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-slate-400">Aggressive (13% p.a.)</span>
                        <span className="font-bold text-cyan-400">{currencySymbol}{proj.aggressive.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between">
                      <span>Total Invested:</span>
                      <span className="font-semibold text-slate-400">{currencySymbol}{proj.totalContributed.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Groq AI Analysis & Synthesis Box */}
            {projectionsData.ai_analysis && (
              <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-400" /> AI Growth Assessment & Advisory
                  </span>
                  <span className="text-[10px] text-indigo-400 font-semibold">
                    {projectionsData.ai_analysis.provider || 'Groq Cloud LPU'} ({projectionsData.ai_analysis.model || 'Llama 3.3'})
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {projectionsData.ai_analysis.explanation}
                </p>
                <div className="pt-2 text-[10px] text-slate-500">
                  ⚠️ {projectionsData.disclaimer}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
