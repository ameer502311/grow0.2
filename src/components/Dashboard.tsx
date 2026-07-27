import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  TrendingUp, TrendingDown, Wallet, DollarSign, PiggyBank, 
  Sparkles, ArrowUpRight, ArrowDownRight, PlusCircle, Mic, ScanLine, Calculator, Target, ShieldCheck, QrCode
} from 'lucide-react';
import { ActiveTab } from './Sidebar';

interface DashboardProps {
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddModal: (type: 'income' | 'expense') => void;
  onOpenSmartFeatures: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  setActiveTab, 
  onOpenAddModal, 
  onOpenSmartFeatures 
}) => {
  const { 
    currencySymbol, incomes, expenses, budgets, investments, tickers, healthScore 
  } = useApp();

  const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalSavings = Math.max(0, totalIncome - totalExpense);

  const mainBudget = budgets.find(b => b.category === 'Total Monthly');
  const budgetRemaining = mainBudget ? Math.max(0, mainBudget.limitAmount - totalExpense) : 0;

  // Investment values by category
  const goldVal = investments.filter(i => i.category === 'Gold').reduce((a, c) => a + c.currentValue, 0);
  const mfVal = investments.filter(i => i.category === 'Mutual Funds').reduce((a, c) => a + c.currentValue, 0);
  const stockVal = investments.filter(i => i.category === 'Stocks').reduce((a, c) => a + c.currentValue, 0);
  const cryptoVal = investments.filter(i => i.category === 'Crypto').reduce((a, c) => a + c.currentValue, 0);
  const fdVal = investments.filter(i => i.category === 'FD' || i.category === 'RD').reduce((a, c) => a + c.currentValue, 0);
  const totalPortfolio = investments.reduce((a, c) => a + c.currentValue, 0);

  const netWorth = totalPortfolio + totalSavings;

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Quick Actions */}
      <div className="glass-panel rounded-3xl p-6 bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/30 border-slate-800 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-emerald-400 font-bold mb-1 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>AI Wealth Command Center</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Financial Dashboard
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Track net worth, monitor live assets, calculate returns, and get Gemini AI advice.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          <button 
            onClick={() => onOpenAddModal('expense')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
          <button 
            onClick={() => onOpenAddModal('income')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Income</span>
          </button>
          <button 
            onClick={onOpenSmartFeatures}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all cursor-pointer"
          >
            <Mic className="w-4 h-4" />
            <span>Voice & OCR</span>
          </button>
          <button 
            onClick={() => setActiveTab('calculators')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all cursor-pointer"
          >
            <Calculator className="w-4 h-4" />
            <span>Calculators</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Net Worth Card */}
        <div className="glass-panel glass-card-hover rounded-2xl p-4 bg-slate-900/60 border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Net Worth</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-extrabold text-emerald-400">
            {currencySymbol}{netWorth.toLocaleString()}
          </p>
          <span className="text-[10px] text-emerald-400/80 font-medium mt-1 flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" /> +14.2% Growth YTD
          </span>
        </div>

        {/* Total Income */}
        <div className="glass-panel glass-card-hover rounded-2xl p-4 bg-slate-900/60 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total Income</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-extrabold text-slate-100">
            {currencySymbol}{totalIncome.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">Monthly target: {currencySymbol}185k</span>
        </div>

        {/* Total Expense */}
        <div className="glass-panel glass-card-hover rounded-2xl p-4 bg-slate-900/60 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total Expenses</span>
            <ArrowDownRight className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-xl font-extrabold text-rose-400">
            {currencySymbol}{totalExpense.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">{expenses.length} transactions</span>
        </div>

        {/* Total Savings */}
        <div className="glass-panel glass-card-hover rounded-2xl p-4 bg-slate-900/60 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total Savings</span>
            <PiggyBank className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-extrabold text-amber-400">
            {currencySymbol}{totalSavings.toLocaleString()}
          </p>
          <span className="text-[10px] text-amber-400/80 font-medium mt-1 block">
            {totalIncome > 0 ? Math.round((totalSavings / totalIncome) * 100) : 0}% Savings Rate
          </span>
        </div>

        {/* Budget Remaining */}
        <div className="glass-panel glass-card-hover rounded-2xl p-4 bg-slate-900/60 border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Budget Left</span>
            <Target className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-xl font-extrabold text-cyan-400">
            {currencySymbol}{budgetRemaining.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">Cap: {currencySymbol}{mainBudget?.limitAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* Live Market Sparkline Ticker Bar */}
      <div className="glass-panel rounded-2xl p-4 bg-slate-900/80 border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Live Market Feed (Gold, Stocks, Crypto, Forex)
          </span>
          <button 
            onClick={() => setActiveTab('investments')}
            className="text-[11px] font-medium text-emerald-400 hover:underline"
          >
            View All Markets →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {tickers.slice(0, 4).map((ticker) => {
            const isPositive = ticker.change24h >= 0;
            return (
              <div key={ticker.symbol} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400">{ticker.name}</p>
                  <p className="text-sm font-extrabold text-slate-100 mt-0.5">
                    {ticker.category === 'Forex' ? '₹' : currencySymbol}{ticker.price.toLocaleString()}
                  </p>
                </div>
                <div className={`text-right text-[11px] font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  <span>{isPositive ? '+' : ''}{ticker.changePercent24h}%</span>
                  <span className="block text-[9px] font-normal text-slate-500">{ticker.category}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Portfolio Breakdown & AI Advisor Highlight Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Investment Portfolio Summary */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-5 bg-slate-900/60 border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-200">Investment Summary Portfolio</h2>
              <p className="text-[11px] text-slate-400">Total Holdings Value: <span className="text-emerald-400 font-bold">{currencySymbol}{totalPortfolio.toLocaleString()}</span></p>
            </div>
            <button 
              onClick={() => setActiveTab('investments')}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-all border border-emerald-500/30 cursor-pointer"
            >
              Manage Portfolio
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-amber-400 font-bold uppercase">Gold Value</span>
              <p className="text-base font-extrabold text-slate-100 mt-1">{currencySymbol}{goldVal.toLocaleString()}</p>
              <span className="text-[10px] text-slate-400">24K / Sovereign Bonds</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-cyan-400 font-bold uppercase">Mutual Funds</span>
              <p className="text-base font-extrabold text-slate-100 mt-1">{currencySymbol}{mfVal.toLocaleString()}</p>
              <span className="text-[10px] text-slate-400">Equity Index SIPs</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-purple-400 font-bold uppercase">Direct Stocks</span>
              <p className="text-base font-extrabold text-slate-100 mt-1">{currencySymbol}{stockVal.toLocaleString()}</p>
              <span className="text-[10px] text-slate-400">Bluechip Equity</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-emerald-400 font-bold uppercase">Crypto Assets</span>
              <p className="text-base font-extrabold text-slate-100 mt-1">{currencySymbol}{cryptoVal.toLocaleString()}</p>
              <span className="text-[10px] text-slate-400">Bitcoin & Ethereum</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-indigo-400 font-bold uppercase">FD & RD</span>
              <p className="text-base font-extrabold text-slate-100 mt-1">{currencySymbol}{fdVal.toLocaleString()}</p>
              <span className="text-[10px] text-slate-400">Guaranteed Return</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30">
              <span className="text-[10px] text-emerald-400 font-bold uppercase">Unrealized Profit</span>
              <p className="text-base font-extrabold text-emerald-400 mt-1">+{currencySymbol}244,000</p>
              <span className="text-[10px] text-emerald-300/80 font-semibold">+22.4% ROI</span>
            </div>
          </div>
        </div>

        {/* AI Financial Health Score & Quick Insight Widget */}
        <div className="glass-panel rounded-3xl p-5 bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/30 border-slate-800 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Financial Health Score
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {healthScore.rating}
            </span>
          </div>

          <div className="flex items-center justify-center space-x-4 my-2">
            <div className="relative w-24 h-24 flex items-center justify-center rounded-full bg-slate-950 border-4 border-emerald-500/80 shadow-xl shadow-emerald-500/20">
              <span className="text-2xl font-black text-white">{healthScore.score}</span>
              <span className="text-[9px] text-slate-400 absolute bottom-3">/ 100</span>
            </div>

            <div className="text-xs space-y-1 text-slate-300">
              <p className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Savings: {healthScore.savingsRatio}%</p>
              <p className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Debt Ratio: {healthScore.debtRatio}%</p>
              <p className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Emergency: {healthScore.emergencyFundMonths} mo</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs">
            <p className="text-slate-300 leading-relaxed font-medium">
              "{healthScore.recommendations[0] || 'Keep maintaining high savings rate and step up SIPs annually.'}"
            </p>
          </div>

          <button 
            onClick={() => setActiveTab('ai')}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 hover:opacity-90 transition-all text-center cursor-pointer"
          >
            Ask AI Financial Advisor →
          </button>
        </div>
      </div>
    </div>
  );
};
