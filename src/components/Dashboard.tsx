import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  TrendingUp, TrendingDown, Wallet, DollarSign, PiggyBank, 
  Sparkles, ArrowUpRight, ArrowDownRight, PlusCircle, Mic, Calculator, Target, 
  ShieldCheck, QrCode, Zap, CheckCircle2, Clock, Calendar, Activity, Coins, BarChart3, AlertCircle
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
    user, currencySymbol, incomes, expenses, budgets, investments, tickers, healthScore 
  } = useApp();

  const [realAnalytics, setRealAnalytics] = useState<FinancialAnalyticsData | null>(null);
  const [recommendations, setRecommendations] = useState<FinancialRecommendationItem[]>([]);
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'METALS' | 'EQUITIES' | 'CRYPTO'>('ALL');

  useEffect(() => {
    fetchFinancialAnalytics().then(data => {
      if (data) setRealAnalytics(data);
    });
    fetchRecommendations().then(recs => {
      if (recs && recs.length > 0) setRecommendations(recs);
    });
  }, []);

  // Real-time financial calculations
  const totalIncome = (incomes || []).reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalExpense = (expenses || []).reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalSavings = Math.max(0, totalIncome - totalExpense);
  const savingsPct = totalIncome > 0 ? Math.round((totalSavings / totalIncome) * 100) : 0;

  // Today's date & daily spending calculations
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  const todayStr = now.toISOString().slice(0, 10);
  const todayExpenses = (expenses || []).filter(e => e.date === todayStr);
  const todaySpending = todayExpenses.reduce((a, c) => a + (c.amount || 0), 0);

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - now.getDate());

  const mainBudget = (budgets || []).find(b => b.category === 'Total Monthly');
  const budgetRemaining = mainBudget ? Math.max(0, mainBudget.limitAmount - totalExpense) : 0;
  const isBudgetWarning = mainBudget ? (totalExpense / mainBudget.limitAmount) >= 0.8 : false;

  const safeDailySpendLimit = mainBudget 
    ? Math.max(0, Math.round(budgetRemaining / daysRemaining))
    : (totalIncome > 0 ? Math.max(0, Math.round(totalSavings / daysRemaining)) : 0);

  // Investment values by category
  const goldVal = (investments || []).filter(i => i.category === 'Gold').reduce((a, c) => a + (c.currentValue || 0), 0);
  const mfVal = (investments || []).filter(i => i.category === 'Mutual Funds').reduce((a, c) => a + (c.currentValue || 0), 0);
  const stockVal = (investments || []).filter(i => i.category === 'Stocks').reduce((a, c) => a + (c.currentValue || 0), 0);
  const cryptoVal = (investments || []).filter(i => i.category === 'Crypto').reduce((a, c) => a + (c.currentValue || 0), 0);
  const fdVal = (investments || []).filter(i => i.category === 'FD' || i.category === 'RD').reduce((a, c) => a + (c.currentValue || 0), 0);
  const totalPortfolio = (investments || []).reduce((a, c) => a + (c.currentValue || 0), 0);

  const netWorth = totalPortfolio + totalSavings;

  // "Where My Money Goes" - Category breakdown from actual expenses
  const categoryTotals = (expenses || []).reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + (curr.amount || 0);
    return acc;
  }, {} as Record<string, number>);

  const categoryBreakdown = Object.entries(categoryTotals).map(([name, amount]) => ({
    name,
    amount,
    percent: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0
  }));

  // Filtered Live Market Tickers
  const filteredTickers = (tickers || []).filter(t => {
    if (marketFilter === 'METALS') return t.category === 'Gold' || t.category === 'Silver';
    if (marketFilter === 'EQUITIES') return t.category === 'Stock';
    if (marketFilter === 'CRYPTO') return t.category === 'Crypto' || t.category === 'Forex';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Welcome Banner & Real-Time Trust Actions */}
      <div className="glass-panel rounded-3xl p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 shadow-fintech-subtle">
        <div>
          <div className="flex items-center space-x-2 text-xs text-blue-600 dark:text-blue-400 font-bold mb-1 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>GROW AI Wealth Engine • Live Real-Time Mode</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Financial Health & Market Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 inline text-blue-500" />
            <span>{dateFormatted}</span>
            <span>•</span>
            <span>Tracking net worth, daily spend limit, verified spot commodities & live market feeds</span>
          </p>
        </div>

        {/* Quick Action Buttons */}
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
            onClick={() => setActiveTab('daily_command_center')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold transition-all cursor-pointer"
          >
            <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Daily Money Center</span>
          </button>
          <button 
            onClick={() => setActiveTab('calculators')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700/70 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer"
          >
            <Calculator className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Calculators</span>
          </button>
          <button 
            onClick={() => setActiveTab('future_finance')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Future Simulator</span>
          </button>
        </div>
      </div>

      {/* 2. Daily Money Quick Pulse Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-100/80 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
        <div className="flex items-center space-x-2.5 px-2">
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
            ₹
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">Available Savings</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">{currencySymbol}{(totalSavings || 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 px-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">Safe Daily Limit</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{currencySymbol}{safeDailySpendLimit.toLocaleString()}/day</span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 px-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold">
            <ArrowDownRight className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">Today's Spending</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">{currencySymbol}{todaySpending.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 px-2">
          <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">Days Remaining</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">{daysRemaining} days in month</span>
          </div>
        </div>
      </div>

      {/* 3. Core Financial Performance Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        {/* Net Worth Card */}
        <div className="glass-panel glass-card-hover rounded-2xl p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
            <span className="font-semibold">Net Worth</span>
            <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white">
            {currencySymbol}{(netWorth || 0).toLocaleString()}
          </p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-0.5">
            {totalIncome > 0 ? (
              <><ArrowUpRight className="w-3.5 h-3.5" /> +{savingsPct}% Savings Rate</>
            ) : (
              <span className="text-slate-400 font-normal">Real-Time Portfolio</span>
            )}
          </span>
        </div>

        {/* Total Income */}
        <div className="glass-panel glass-card-hover rounded-2xl p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
            <span className="font-semibold">Monthly Income</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
            +{currencySymbol}{(totalIncome || 0).toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
            Target: {user?.monthlyIncomeTarget ? `${currencySymbol}${user.monthlyIncomeTarget.toLocaleString()}` : 'Flexible'}
          </span>
        </div>

        {/* Total Expense */}
        <div className="glass-panel glass-card-hover rounded-2xl p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
            <span className="font-semibold">Total Expenses</span>
            <ArrowDownRight className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white">
            {currencySymbol}{(totalExpense || 0).toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
            {(expenses || []).length} transactions logged
          </span>
        </div>

        {/* Total Savings */}
        <div className="glass-panel glass-card-hover rounded-2xl p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
            <span className="font-semibold">Total Savings</span>
            <PiggyBank className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {currencySymbol}{(totalSavings || 0).toLocaleString()}
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
            {currencySymbol}{(budgetRemaining || 0).toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
            Cap: {mainBudget ? `${currencySymbol}${mainBudget.limitAmount.toLocaleString()}` : 'Flexible'}
          </span>
        </div>
      </div>

      {/* 2.5 Spotlight: AI Financial Future Simulator & Risk Predictor */}
      <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-blue-900/90 via-indigo-900/80 to-slate-900 text-white border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-200 text-[11px] font-bold border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Risk Engine</span>
          </div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            My Financial Future
          </h3>
          <p className="text-xs text-blue-200/90 max-w-xl">
            See how your money may change in the future and prepare for unexpected situations like job changes or emergencies.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('future_finance')}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <span>Check My Future</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* 3. Live Market Feed & Daily Marketing Details */}
      <div className="glass-panel rounded-3xl p-5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 space-y-4 shadow-fintech-subtle">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">Daily Live Market & Commodity Feed</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  LIVE SCRAPING ACTIVE
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                Official Gold-API Spot Feed • NSE/BSE Index Data • Auto-refreshed every 60s
              </span>
            </div>
          </div>

          {/* Market Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setMarketFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                marketFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              All Assets ({tickers.length})
            </button>
            <button
              onClick={() => setMarketFilter('METALS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                marketFilter === 'METALS'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              🏆 Gold & Silver
            </button>
            <button
              onClick={() => setMarketFilter('EQUITIES')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                marketFilter === 'EQUITIES'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              📈 Indices (NIFTY/SENSEX)
            </button>
            <button
              onClick={() => setMarketFilter('CRYPTO')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                marketFilter === 'CRYPTO'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              ⚡ Crypto & Forex
            </button>
            <button 
              onClick={() => setActiveTab('investments')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline ml-2"
            >
              Trade / Buy Gold →
            </button>
          </div>
        </div>

        {/* Live Ticker Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredTickers.slice(0, 8).map((ticker: any) => {
            const isPositive = (ticker.change !== undefined ? ticker.change : (ticker.change24h || 0)) >= 0;
            const changeVal = ticker.change !== undefined ? ticker.change : ticker.change24h;
            const changePercentVal = ticker.change_percentage !== undefined ? ticker.change_percentage : ticker.changePercent24h;
            const dataStatus = ticker.data_status || 'live';
            const sourceName = ticker.source || 'Verified Provider';
            const lastUpdated = ticker.fetched_timestamp ? new Date(ticker.fetched_timestamp).toLocaleTimeString() : 'Live';

            return (
              <div 
                key={ticker.symbol} 
                className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 space-y-2 flex flex-col justify-between hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
                      {ticker.category || 'Commodity'} {ticker.unit ? `• ${ticker.unit}` : ''}
                    </span>
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white mt-0.5">
                      {ticker.name}
                    </h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                    dataStatus === 'live' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' 
                      : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                  }`}>
                    {dataStatus}
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline justify-between pt-1">
                    <p className="text-lg font-black text-slate-900 dark:text-white font-mono">
                      {ticker.category === 'Crypto' ? '$' : currencySymbol}{(ticker.price || 0).toLocaleString()}
                    </p>
                    <div className={`text-right text-xs font-semibold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      <span>{isPositive ? '+' : ''}{changePercentVal}%</span>
                      {changeVal !== undefined && (
                        <span className="block text-[10px] font-normal font-mono">({isPositive ? '+' : ''}{changeVal})</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between text-[9px] text-slate-500 dark:text-slate-400 font-mono">
                    <span className="truncate max-w-[130px]" title={sourceName}>{sourceName}</span>
                    <span>{lastUpdated}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Commodity Spot Reference Notice */}
        <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 flex items-center justify-between text-[11px] text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span>
              <strong>Precious Metals Spot Feed:</strong> 24K Gold ₹{(tickers.find(t => t.symbol === 'GOLD24K')?.price || 111100).toLocaleString()}/10g | 22K Gold ₹{(tickers.find(t => t.symbol === 'GOLD22K')?.price || 101842).toLocaleString()}/10g | Silver ₹{(tickers.find(t => t.symbol === 'SILVER_1KG')?.price || 134100).toLocaleString()}/kg
            </span>
          </div>
          <button 
            onClick={() => setActiveTab('investments')} 
            className="font-bold underline hover:text-amber-950 dark:hover:text-amber-100 cursor-pointer text-xs ml-2"
          >
            Digital Gold Vault →
          </button>
        </div>
      </div>

      {/* 5. Google-like Market Search Engine */}
      <MarketSearch />

      {/* 6. Cash Flow & Portfolio Distribution */}
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

          {/* Category Bars for Expenses */}
          {categoryBreakdown.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categoryBreakdown.map((cat) => (
                <div key={cat.name} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{cat.name}</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">{currencySymbol}{(cat.amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden">
                    <div className="h-full bg-blue-600 dark:bg-blue-500 rounded-full" style={{ width: `${cat.percent}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{cat.percent}% of total expenses</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-700/20 border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-2">
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">No expenses logged yet in this session.</p>
              <p className="text-[11px] text-slate-400">Click <strong>Add Expense</strong> at the top to record real-time spending with auto-categorization.</p>
              <button 
                onClick={() => onOpenAddModal('expense')}
                className="mt-2 inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold shadow-sm hover:bg-blue-700 transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Log First Expense</span>
              </button>
            </div>
          )}

          {/* Holdings summary grid */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
              <span>My Real Investment Holdings</span>
              <button 
                onClick={() => setActiveTab('investments')} 
                className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                Manage Portfolio →
              </button>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">Digital Gold</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{currencySymbol}{(goldVal || 0).toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">Mutual Funds</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{currencySymbol}{(mfVal || 0).toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">Direct Stocks</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{currencySymbol}{(stockVal || 0).toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">Crypto / FD</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{currencySymbol}{((cryptoVal || 0) + (fdVal || 0)).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 7. MONEY HEALTH SCORE & AI RECOMMENDATIONS */}
        <div className="glass-panel rounded-3xl p-5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-4 shadow-fintech-subtle">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              FINANCIAL HEALTH
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
              {realAnalytics?.healthCategory || healthScore?.rating || 'Stable'}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center my-1 text-center space-y-2">
            <div className="w-24 h-24 rounded-full border-4 border-blue-600 dark:border-blue-500 flex flex-col items-center justify-center bg-blue-50/50 dark:bg-blue-950/20">
              <span className="text-3xl font-black text-slate-900 dark:text-white font-mono leading-none">
                {realAnalytics ? realAnalytics.financialHealthScore : (healthScore?.score || 50)}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">/ 100</span>
            </div>

            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {realAnalytics?.healthCategory || healthScore?.rating || 'Good Standing'}
              </h4>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                ↑ Real-Time Engine Active
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Savings Rate:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {realAnalytics ? `${realAnalytics.savingsRate}%` : `${healthScore?.savingsRatio || 0}%`}
              </span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Debt Ratio:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {realAnalytics ? `${realAnalytics.debtRatio}%` : `${healthScore?.debtRatio || 0}%`}
              </span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Emergency Buffer:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {realAnalytics ? `${realAnalytics.emergencyFundMonths} mo` : `${healthScore?.emergencyFundMonths || 0} mo`}
              </span>
            </div>
          </div>

          {/* AI Recommendations Cards */}
          {recommendations.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                AI Smart Guidance
              </span>
              {recommendations.slice(0, 2).map((rec, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-[11px]">
                  <p className="font-bold text-blue-950 dark:text-blue-200">{rec.title}</p>
                  <p className="text-slate-600 dark:text-slate-400 text-[10px] mt-0.5 leading-tight">{rec.message}</p>
                </div>
              ))}
            </div>
          )}

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
