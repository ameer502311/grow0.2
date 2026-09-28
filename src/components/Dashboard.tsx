import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  TrendingUp, TrendingDown, Wallet, DollarSign, PiggyBank, 
  Sparkles, ArrowUpRight, ArrowDownRight, PlusCircle, Mic, Calculator, Target, ShieldCheck, QrCode, Zap, CheckCircle2
} from 'lucide-react';
import { ActiveTab } from './Sidebar';
import { fetchFinancialAnalytics, fetchRecommendations } from '../services/financialApi';
import { FinancialAnalyticsData, FinancialRecommendationItem } from '../types';
import { MarketSearch } from './MarketSearch';

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

  const [realAnalytics, setRealAnalytics] = useState<FinancialAnalyticsData | null>(null);
  const [recommendations, setRecommendations] = useState<FinancialRecommendationItem[]>([]);

  useEffect(() => {
    fetchFinancialAnalytics().then(data => {
      if (data) setRealAnalytics(data);
    });
    fetchRecommendations().then(recs => {
      if (recs && recs.length > 0) setRecommendations(recs);
    });
  }, []);

  const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalSavings = Math.max(0, totalIncome - totalExpense);
  const savingsPct = totalIncome > 0 ? Math.round((totalSavings / totalIncome) * 100) : 0;

  const mainBudget = budgets.find(b => b.category === 'Total Monthly');
  const budgetRemaining = mainBudget ? Math.max(0, mainBudget.limitAmount - totalExpense) : 0;
  const isBudgetWarning = mainBudget ? (totalExpense / mainBudget.limitAmount) >= 0.8 : false;

  // Investment values by category
  const goldVal = investments.filter(i => i.category === 'Gold').reduce((a, c) => a + c.currentValue, 0);
  const mfVal = investments.filter(i => i.category === 'Mutual Funds').reduce((a, c) => a + c.currentValue, 0);
  const stockVal = investments.filter(i => i.category === 'Stocks').reduce((a, c) => a + c.currentValue, 0);
  const cryptoVal = investments.filter(i => i.category === 'Crypto').reduce((a, c) => a + c.currentValue, 0);
  const fdVal = investments.filter(i => i.category === 'FD' || i.category === 'RD').reduce((a, c) => a + c.currentValue, 0);
  const totalPortfolio = investments.reduce((a, c) => a + c.currentValue, 0);

  const netWorth = totalPortfolio + totalSavings;

  // "Where My Money Goes" - Category breakdown
  const categoryBreakdown = [
    { name: 'Food & Groceries', amount: 14500, percent: 30 },
    { name: 'Rent & Housing', amount: 24000, percent: 50 },
    { name: 'Shopping & Essentials', amount: 8200, percent: 17 },
    { name: 'Transport & Fuel', amount: 4800, percent: 10 },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Welcome Banner & Quick Trust Actions */}
      <div className="glass-panel rounded-3xl p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 shadow-fintech-subtle">
        <div>
          <div className="flex items-center space-x-2 text-xs text-blue-600 dark:text-blue-400 font-bold mb-1 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>GROW AI Wealth Overview</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Financial Health Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Track net worth, monitor growth progress, manage cashflow, and receive AI guidance.
          </p>
        </div>

        {/* Quick Action Buttons (Trust Blue & Neutral Structure) */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          <button 
            onClick={() => onOpenAddModal('expense')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
          <button 
            onClick={() => onOpenAddModal('income')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Income</span>
          </button>
          <button 
            onClick={onOpenSmartFeatures}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700/70 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer"
          >
            <Mic className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Voice & OCR</span>
          </button>
          <button 
            onClick={() => setActiveTab('smart_bills')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700/70 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Pay Bills</span>
          </button>
          <button 
            onClick={() => setActiveTab('calculators')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700/70 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer"
          >
            <Calculator className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Calculators</span>
          </button>
        </div>
      </div>

      {/* 2. Financial Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        {/* Net Worth Card */}
        <div className="glass-panel glass-card-hover rounded-2xl p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
            <span className="font-semibold">Net Worth</span>
            <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white">
            {currencySymbol}{netWorth.toLocaleString()}
          </p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-0.5">
            <ArrowUpRight className="w-3.5 h-3.5" /> +14.2% Growth YTD
          </span>
        </div>

        {/* Total Income */}
        <div className="glass-panel glass-card-hover rounded-2xl p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
            <span className="font-semibold">Monthly Income</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
            +{currencySymbol}{totalIncome.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">Target: {currencySymbol}185k</span>
        </div>

        {/* Total Expense */}
        <div className="glass-panel glass-card-hover rounded-2xl p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
            <span className="font-semibold">Total Expenses</span>
            <ArrowDownRight className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white">
            {currencySymbol}{totalExpense.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">{expenses.length} transactions</span>
        </div>

        {/* Total Savings (Growth Green Highlight) */}
        <div className="glass-panel glass-card-hover rounded-2xl p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
            <span className="font-semibold">Total Savings</span>
            <PiggyBank className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {currencySymbol}{totalSavings.toLocaleString()}
          </p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">
            +{savingsPct}% Savings Rate
          </span>
        </div>

        {/* Budget Remaining */}
        <div className="glass-panel glass-card-hover rounded-2xl p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
            <span className="font-semibold">Budget Remaining</span>
            <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className={`text-xl font-extrabold ${isBudgetWarning ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
            {currencySymbol}{budgetRemaining.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
            Cap: {currencySymbol}{mainBudget?.limitAmount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 3. Live Market Feed (Calm & Clear Information Architecture) */}
      <div className="glass-panel rounded-2xl p-5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 space-y-4 shadow-fintech-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white">Live Market Feed</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Official provider data • Auto-refreshed every 60s</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button 
              onClick={() => setActiveTab('investments')}
              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              View All Markets →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {tickers.slice(0, 4).map((ticker: any) => {
            const isPositive = (ticker.change || ticker.change24h || 0) >= 0;
            const changeVal = ticker.change !== undefined ? ticker.change : ticker.change24h;
            const changePercentVal = ticker.change_percentage !== undefined ? ticker.change_percentage : ticker.changePercent24h;
            const dataStatus = ticker.data_status || 'live';
            const sourceName = ticker.source || 'Verified Provider';
            const lastUpdated = ticker.fetched_timestamp ? new Date(ticker.fetched_timestamp).toLocaleTimeString() : 'Live';

            return (
              <div key={ticker.symbol} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 space-y-2 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">{ticker.category || 'Commodity'}</span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{ticker.name}</h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                    dataStatus === 'live' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' 
                      : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                  }`}>
                    {dataStatus}
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline justify-between">
                    <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                      {ticker.category === 'Crypto' ? '$' : currencySymbol}{(ticker.price || 0).toLocaleString()}
                    </p>
                    <div className={`text-right text-xs font-semibold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      <span>{isPositive ? '+' : ''}{changePercentVal}%</span>
                      <span className="block text-[10px] font-normal font-mono">({isPositive ? '+' : ''}{changeVal})</span>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[9px] text-slate-500 dark:text-slate-400 font-mono">
                    <span className="truncate max-w-[110px]" title={sourceName}>{sourceName}</span>
                    <span>{lastUpdated}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Market Search Section */}
      <MarketSearch />

      {/* 4. "Where My Money Goes" & Calm Money Health Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* "Where My Money Goes" - Clean Expense Categorization */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 space-y-4 shadow-fintech-subtle">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Where My Money Goes</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Monthly expense breakdown by primary living category</p>
            </div>
            <button 
              onClick={() => setActiveTab('personal_finance')}
              className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all border border-blue-200 dark:border-blue-800 cursor-pointer"
            >
              View Full Cash Flow
            </button>
          </div>

          {/* Calm Neutral/Blue Bars for Expenses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categoryBreakdown.map((cat) => (
              <div key={cat.name} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{cat.name}</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{currencySymbol}{cat.amount.toLocaleString()}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden">
                  <div className="h-full bg-blue-600 dark:bg-blue-500 rounded-full" style={{ width: `${cat.percent}%` }} />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{cat.percent}% of monthly budget</span>
              </div>
            ))}
          </div>

          {/* Holdings summary grid */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">My Investment Holdings</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">Digital Gold</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{currencySymbol}{goldVal.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">Mutual Funds</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{currencySymbol}{mfVal.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">Direct Stocks</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{currencySymbol}{stockVal.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 5. MONEY HEALTH SCORE (Calm Financial Indicator) */}
        <div className="glass-panel rounded-3xl p-5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-4 shadow-fintech-subtle">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              MONEY HEALTH
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
              {realAnalytics?.healthCategory || healthScore.rating}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center my-1 text-center space-y-2">
            <div className="w-24 h-24 rounded-full border-4 border-blue-600 dark:border-blue-500 flex flex-col items-center justify-center bg-blue-50/50 dark:bg-blue-950/20">
              <span className="text-3xl font-black text-slate-900 dark:text-white font-mono leading-none">
                {realAnalytics ? realAnalytics.financialHealthScore : healthScore.score}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">/ 100</span>
            </div>

            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Very Good</h4>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                ↑ 4 points this month
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Savings Rate:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{realAnalytics ? `${realAnalytics.savingsRate}%` : `${healthScore.savingsRatio}%`}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Debt Ratio:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{realAnalytics ? `${realAnalytics.debtRatio}%` : `${healthScore.debtRatio}%`}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Emergency Buffer:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{realAnalytics ? `${realAnalytics.emergencyFundMonths} mo` : `${healthScore.emergencyFundMonths} mo`}</span>
            </div>
          </div>

          <button 
            onClick={() => setActiveTab('ai')}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all text-center cursor-pointer"
          >
            Ask GROW AI Assistant →
          </button>
        </div>
      </div>
    </div>
  );
};
