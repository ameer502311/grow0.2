import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Briefcase, 
  DollarSign, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  X, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  HeartHandshake, 
  PiggyBank, 
  Layers, 
  Info,
  Clock,
  Compass
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  FutureFinanceBaseline, 
  FutureFinanceSimulationResult, 
  FutureFinanceScenarioType,
  ForecastPeriodData 
} from '../types';
import { 
  fetchFutureFinanceOverview, 
  runFutureFinanceSimulation 
} from '../services/futureFinanceApi';

interface FutureFinanceSimulatorProps {
  onExit?: () => void;
}

export const FutureFinanceSimulator: React.FC<FutureFinanceSimulatorProps> = ({ onExit }) => {
  const { currencySymbol } = useApp();

  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [baseline, setBaseline] = useState<FutureFinanceBaseline | null>(null);
  const [simulation, setSimulation] = useState<FutureFinanceSimulationResult | null>(null);

  // Active scenario selection
  const [activeScenario, setActiveScenario] = useState<FutureFinanceScenarioType>('BASELINE');
  const [salaryReductionPct, setSalaryReductionPct] = useState<number>(20);
  const [expenseIncreasePct, setExpenseIncreasePct] = useState<number>(20);
  const [unexpectedExpenseAmt, setUnexpectedExpenseAmt] = useState<number>(50000);
  const [customSipAmt, setCustomSipAmt] = useState<number>(15000);
  const [salaryHikePct, setSalaryHikePct] = useState<number>(15);

  // Progressive disclosure controls (keep main page neat & simple)
  const [showMoreScenarios, setShowMoreScenarios] = useState(false);
  const [showDetailedOutlook, setShowDetailedOutlook] = useState(false);

  // Initial load
  useEffect(() => {
    loadBaseline();
  }, []);

  const loadBaseline = async () => {
    setLoading(true);
    const data = await fetchFutureFinanceOverview();
    if (data) {
      setBaseline(data);
      setCustomSipAmt(data.investments.monthlySipContribution || 15000);
      const res = await runFutureFinanceSimulation('BASELINE', {});
      if (res) {
        setSimulation(res.simulation);
      }
    }
    setLoading(false);
  };

  const handleSelectScenario = async (scenarioType: FutureFinanceScenarioType, customParams?: Record<string, any>) => {
    setSimulating(true);
    setActiveScenario(scenarioType);

    let params: Record<string, any> = {};
    if (scenarioType === 'SALARY_REDUCTION') {
      params = { percentage: customParams?.percentage ?? salaryReductionPct };
    } else if (scenarioType === 'JOB_LOSS') {
      params = {};
    } else if (scenarioType === 'EXPENSE_INCREASE') {
      params = { percentage: customParams?.percentage ?? expenseIncreasePct };
    } else if (scenarioType === 'UNEXPECTED_EXPENSE') {
      params = { amount: customParams?.amount ?? unexpectedExpenseAmt };
    } else if (scenarioType === 'INVESTMENT_CHANGE') {
      params = { newSip: customParams?.newSip ?? customSipAmt };
    } else if (scenarioType === 'SALARY_INCREASE') {
      params = { percentage: customParams?.percentage ?? salaryHikePct };
    }

    const res = await runFutureFinanceSimulation(scenarioType, params);
    if (res) {
      setSimulation(res.simulation);
    }
    setSimulating(false);
  };

  if (loading || !baseline) {
    return (
      <div className="card-surface rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center mx-auto animate-spin">
          <Compass className="w-5 h-5" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Loading your financial picture...</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Gathering your current savings, expenses, and investments.
        </p>
      </div>
    );
  }

  // Active metrics
  const isScenarioActive = activeScenario !== 'BASELINE' && simulation;
  const currentCoverageMonths = isScenarioActive 
    ? simulation.metrics.emergencyCoverageMonths 
    : baseline.savings.emergencyFundCoverageMonths;

  const currentRiskLevel = isScenarioActive ? simulation.risk.level : baseline.riskLevel;

  // Single Simple Overall Status Message
  const getOverallStatus = () => {
    if (currentRiskLevel === 'LOW RISK') {
      return {
        dot: '🟢',
        text: 'Your financial position is improving',
        bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
      };
    } else if (currentRiskLevel === 'MODERATE RISK') {
      return {
        dot: '🟡',
        text: 'Your financial position needs attention',
        bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
      };
    } else {
      return {
        dot: '🔴',
        text: 'Your financial position is at risk',
        bg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
      };
    }
  };

  const overallStatus = getOverallStatus();

  // Forecast data for 1Y, 3Y, 5Y
  const forecasts = simulation?.forecasts || [];
  const forecast1Y = forecasts.find(f => f.periodKey === '1Y') || forecasts[3];
  const forecast3Y = forecasts.find(f => f.periodKey === '3Y') || forecasts[4];
  const forecast5Y = forecasts.find(f => f.periodKey === '5Y') || forecasts[5];

  // Essential monthly commitments
  const essentialMonthlyExpenses = baseline.expenses.essentialExpenses + baseline.debt.totalMonthlyEmi;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* ================================================== */}
      {/* 1. PAGE TITLE & SUBTITLE                           */}
      {/* ================================================== */}
      <div className="bg-white dark:bg-slate-850 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              My Financial Future
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium max-w-2xl">
              See how your money may change in the future and prepare for unexpected situations.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {isScenarioActive && (
              <button
                onClick={() => handleSelectScenario('BASELINE')}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Reset to current financial plan"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Reset to Today</span>
              </button>
            )}

            {onExit && (
              <button
                onClick={onExit}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Return to Dashboard"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Exit</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* 2. TOP SUMMARY (ONLY 4 IMPORTANT CARDS)            */}
      {/* ================================================== */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Savings */}
          <div className="card-surface rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Savings
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              ₹{baseline.savings.availableEmergencySavings.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
              Available liquid funds
            </span>
          </div>

          {/* Card 2: Investments */}
          <div className="card-surface rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Investments
            </span>
            <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
              ₹{baseline.investments.totalInvestmentValue.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
              Mutual funds, stocks & gold
            </span>
          </div>

          {/* Card 3: Monthly Savings */}
          <div className="card-surface rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Monthly Savings
            </span>
            <div className={`text-xl sm:text-2xl font-black mt-1 ${
              baseline.savings.monthlySavings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            }`}>
              ₹{baseline.savings.monthlySavings.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
              Saved every month
            </span>
          </div>

          {/* Card 4: Emergency Fund */}
          <div className="card-surface rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Emergency Fund
            </span>
            <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
              {baseline.savings.emergencyFundCoverageMonths} months
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
              Of essential expenses
            </span>
          </div>
        </div>

        {/* Single simple overall status banner */}
        <div className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs sm:text-sm font-bold shadow-xs ${overallStatus.bg}`}>
          <span className="text-base">{overallStatus.dot}</span>
          <span>{overallStatus.text}</span>
        </div>
      </div>

      {/* ================================================== */}
      {/* 3. CAN I HANDLE AN EMERGENCY?                      */}
      {/* ================================================== */}
      <div className="card-surface rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Can I Handle an Emergency?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 font-medium">
            You can currently cover about <strong className="text-slate-900 dark:text-white font-extrabold">{currentCoverageMonths} months</strong> of essential expenses.
          </p>
        </div>

        {/* Clean Progress Bar (0 to 6 months) */}
        <div className="space-y-1.5 pt-1">
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                currentCoverageMonths >= 6 
                  ? 'bg-emerald-500' 
                  : currentCoverageMonths >= 3 
                    ? 'bg-amber-500' 
                    : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, (currentCoverageMonths / 6) * 100))}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-slate-400 pt-0.5">
            <span>0 months</span>
            <span className="text-slate-700 dark:text-slate-300 font-bold">
              Current: {currentCoverageMonths} months
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              Recommended: 6 months
            </span>
          </div>
        </div>

        {/* Short explanation */}
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Building your emergency savings toward 6 months can give you more financial safety.
        </p>
      </div>

      {/* ================================================== */}
      {/* 4. WHAT IF SOMETHING HAPPENS?                      */}
      {/* ================================================== */}
      <div className="card-surface rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            What If Something Happens?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Choose a situation to see how it could affect your money.
          </p>
        </div>

        {/* 4 Main Scenario Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Card 1: I Lose My Job */}
          <div className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
            activeScenario === 'JOB_LOSS'
              ? 'border-red-500 bg-red-50/50 dark:bg-red-950/30 ring-1 ring-red-500/50'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">💼</span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">I Lose My Job</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                See how long my savings may support me.
              </p>
            </div>

            <button
              onClick={() => handleSelectScenario('JOB_LOSS')}
              disabled={simulating}
              className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeScenario === 'JOB_LOSS'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {activeScenario === 'JOB_LOSS' ? 'Active Scenario' : 'Check'}
            </button>
          </div>

          {/* Card 2: My Salary Goes Down */}
          <div className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
            activeScenario === 'SALARY_REDUCTION'
              ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 ring-1 ring-amber-500/50'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">📉</span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">My Salary Goes Down</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                See how lower income may affect my savings.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSelectScenario('SALARY_REDUCTION', { percentage: salaryReductionPct })}
                disabled={simulating}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeScenario === 'SALARY_REDUCTION'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {activeScenario === 'SALARY_REDUCTION' ? `Active (-${salaryReductionPct}%)` : 'Check'}
              </button>
              
              {/* Quick % selector */}
              {[10, 20, 30].map(pct => (
                <button
                  key={pct}
                  onClick={() => {
                    setSalaryReductionPct(pct);
                    handleSelectScenario('SALARY_REDUCTION', { percentage: pct });
                  }}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    salaryReductionPct === pct && activeScenario === 'SALARY_REDUCTION'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  -{pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Card 3: My Expenses Go Up */}
          <div className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
            activeScenario === 'EXPENSE_INCREASE'
              ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 ring-1 ring-amber-500/50'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">💸</span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">My Expenses Go Up</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                See what happens if my monthly expenses increase.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSelectScenario('EXPENSE_INCREASE', { percentage: expenseIncreasePct })}
                disabled={simulating}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeScenario === 'EXPENSE_INCREASE'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {activeScenario === 'EXPENSE_INCREASE' ? `Active (+${expenseIncreasePct}%)` : 'Check'}
              </button>

              {[10, 20, 30].map(pct => (
                <button
                  key={pct}
                  onClick={() => {
                    setExpenseIncreasePct(pct);
                    handleSelectScenario('EXPENSE_INCREASE', { percentage: pct });
                  }}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    expenseIncreasePct === pct && activeScenario === 'EXPENSE_INCREASE'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  +{pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Card 4: I Have a Big Unexpected Expense */}
          <div className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
            activeScenario === 'UNEXPECTED_EXPENSE'
              ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 ring-1 ring-purple-500/50'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏥</span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">I Have a Big Unexpected Expense</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                See how an emergency expense may affect my finances.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSelectScenario('UNEXPECTED_EXPENSE', { amount: unexpectedExpenseAmt })}
                disabled={simulating}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeScenario === 'UNEXPECTED_EXPENSE'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {activeScenario === 'UNEXPECTED_EXPENSE' ? `Active (₹${(unexpectedExpenseAmt / 1000)}k)` : 'Check'}
              </button>

              {[25000, 50000, 100000].map(amt => (
                <button
                  key={amt}
                  onClick={() => {
                    setUnexpectedExpenseAmt(amt);
                    handleSelectScenario('UNEXPECTED_EXPENSE', { amount: amt });
                  }}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    unexpectedExpenseAmt === amt && activeScenario === 'UNEXPECTED_EXPENSE'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  ₹{(amt / 1000)}k
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Expandable "More Scenarios" section (kept neat & out of the way) */}
        <div>
          <button
            onClick={() => setShowMoreScenarios(!showMoreScenarios)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            <span>{showMoreScenarios ? 'Hide advanced scenarios' : 'More Scenarios (Salary Increase, Adjust SIP)'}</span>
            {showMoreScenarios ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showMoreScenarios && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              {/* More Scenario 1: Salary Increase */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">📈 Salary Increase (+{salaryHikePct}%)</span>
                <p className="text-[11px] text-slate-500">See AI-recommended allocation for extra income.</p>
                <button
                  onClick={() => handleSelectScenario('SALARY_INCREASE', { percentage: salaryHikePct })}
                  className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                >
                  Check +{salaryHikePct}% Raise
                </button>
              </div>

              {/* More Scenario 2: Adjust Monthly SIP */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">🎯 Adjust Monthly SIP (₹{(customSipAmt / 1000)}k/mo)</span>
                <p className="text-[11px] text-slate-500">See how investing more or less impacts the future.</p>
                <button
                  onClick={() => handleSelectScenario('INVESTMENT_CHANGE', { newSip: customSipAmt })}
                  className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                >
                  Check Investment Change
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ================================================== */}
        {/* 6. JOB LOSS RESULT / ACTIVE SCENARIO RESULT        */}
        {/* ================================================== */}
        {isScenarioActive && simulation && (
          <div className="pt-2 space-y-4">
            {activeScenario === 'JOB_LOSS' ? (
              /* Specific Job Loss Result Card as required by section 6 */
              <div className="p-5 sm:p-6 rounded-2xl bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-800 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-red-700 dark:text-red-300 uppercase tracking-wider">
                    IF YOU LOSE YOUR JOB
                  </span>
                  <button
                    onClick={() => handleSelectScenario('BASELINE')}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                <div>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    Your savings may support essential expenses for:
                  </p>
                  <div className="text-3xl sm:text-4xl font-black text-red-600 dark:text-red-400 mt-1 tracking-tight">
                    {simulation.metrics.emergencyCoverageMonths} MONTHS
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/60">
                    <span className="text-slate-500">Emergency savings:</span>
                    <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                      ₹{simulation.metrics.emergencySavings.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/60">
                    <span className="text-slate-500">Essential monthly expenses:</span>
                    <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                      ₹{essentialMonthlyExpenses.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/60">
                    <span className="text-slate-500">Estimated support:</span>
                    <div className="font-bold text-red-600 dark:text-red-400 text-sm mt-0.5">
                      ~{simulation.metrics.emergencyCoverageMonths} months
                    </div>
                  </div>
                </div>

                {/* What should you do? */}
                <div className="pt-2 space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    What should you do?
                  </h4>
                  <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 list-disc list-inside font-medium">
                    <li>Reduce non-essential spending</li>
                    <li>Protect emergency savings</li>
                    <li>Prioritize rent, food, EMI and essential bills</li>
                    <li>Pause unnecessary investments if needed</li>
                  </ul>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-red-200/60 dark:border-red-800/60">
                  Estimate based on your current financial data and selected assumptions.
                </p>
              </div>
            ) : (
              /* Other Scenarios Result Card */
              <div className="p-5 sm:p-6 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                    SCENARIO RESULT: {activeScenario.replace(/_/g, ' ')}
                  </span>
                  <button
                    onClick={() => handleSelectScenario('BASELINE')}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                <div>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    {simulation.keyMetric.label}:
                  </p>
                  <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
                    {simulation.keyMetric.value}
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {simulation.description}
                </p>
              </div>
            )}

            {/* ================================================== */}
            {/* 10. CURRENT VS WHAT-IF (SIMPLE "BEFORE VS AFTER")  */}
            {/* ================================================== */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Before vs After
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  {activeScenario.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                {/* Monthly Income */}
                <div className="p-3 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 text-[11px] block">Monthly Income</span>
                  <div className="text-slate-400 text-xs mt-0.5">Today: ₹{baseline.income.totalMonthlyIncome.toLocaleString()}</div>
                  <div className="font-extrabold text-slate-900 dark:text-white text-sm mt-0.5">
                    After: ₹{simulation.metrics.monthlyIncome.toLocaleString()}
                  </div>
                </div>

                {/* Expenses */}
                <div className="p-3 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 text-[11px] block">Expenses</span>
                  <div className="text-slate-400 text-xs mt-0.5">Today: ₹{baseline.expenses.totalMonthlyExpenses.toLocaleString()}</div>
                  <div className="font-extrabold text-slate-900 dark:text-white text-sm mt-0.5">
                    After: ₹{simulation.metrics.monthlyExpenses.toLocaleString()}
                  </div>
                </div>

                {/* Monthly Savings */}
                <div className="p-3 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 text-[11px] block">Monthly Savings</span>
                  <div className="text-slate-400 text-xs mt-0.5">Today: ₹{baseline.savings.monthlySavings.toLocaleString()}</div>
                  <div className={`font-extrabold text-sm mt-0.5 ${
                    simulation.metrics.monthlySavings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    After: ₹{simulation.metrics.monthlySavings.toLocaleString()}
                  </div>
                </div>

                {/* Savings */}
                <div className="p-3 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 text-[11px] block">Emergency Savings</span>
                  <div className="text-slate-400 text-xs mt-0.5">Today: ₹{baseline.savings.availableEmergencySavings.toLocaleString()}</div>
                  <div className="font-extrabold text-slate-900 dark:text-white text-sm mt-0.5">
                    After: ₹{simulation.metrics.emergencySavings.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* What changed? */}
              <div className="pt-1 text-xs text-slate-700 dark:text-slate-300 font-medium">
                <span className="font-bold text-slate-900 dark:text-white">What changed? </span>
                {simulation.metrics.monthlySavings < baseline.savings.monthlySavings ? (
                  <span>
                    Your monthly savings may decrease by{' '}
                    <strong className="text-red-600 dark:text-red-400 font-bold">
                      ₹{Math.abs(baseline.savings.monthlySavings - simulation.metrics.monthlySavings).toLocaleString()}
                    </strong>.
                  </span>
                ) : simulation.metrics.monthlySavings > baseline.savings.monthlySavings ? (
                  <span>
                    Your monthly savings may increase by{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                      +₹{(simulation.metrics.monthlySavings - baseline.savings.monthlySavings).toLocaleString()}
                    </strong>.
                  </span>
                ) : (
                  <span>Your monthly cash flow remains unchanged in this scenario.</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================================================== */}
      {/* 5. MY FINANCIAL PROTECTION                         */}
      {/* ================================================== */}
      <div className="card-surface rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            My Financial Protection
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Understand the role of your cash savings vs long-term investments.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Savings */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">SAVINGS</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">Liquid Cash</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              ₹{baseline.savings.availableEmergencySavings.toLocaleString()}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 pt-1">
              Useful for emergencies and short-term needs.
            </p>
          </div>

          {/* Card 2: Investments */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">INVESTMENTS</span>
              <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">Growth Assets</span>
            </div>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
              ₹{baseline.investments.totalInvestmentValue.toLocaleString()}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 pt-1">
              Designed for long-term growth. Value may increase or decrease.
            </p>
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* 6. MY FUTURE OUTLOOK                               */}
      {/* ================================================== */}
      <div className="card-surface rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              My Future Outlook
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Estimated financial projection based on current data.
            </p>
          </div>

          <button
            onClick={() => setShowDetailedOutlook(!showDetailedOutlook)}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer self-start sm:self-center"
          >
            <span>{showDetailedOutlook ? 'Hide Details' : 'View Details'}</span>
            {showDetailedOutlook ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* 3 Simple Cards: 1 Year, 3 Years, 5 Years */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* 1 Year */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">1 YEAR</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">● On Track</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
              ₹{(forecast1Y?.netSavingsAdded ? baseline.savings.availableEmergencySavings + Math.max(0, forecast1Y.netSavingsAdded) : baseline.savings.availableEmergencySavings).toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500 block">
              Estimated savings
            </span>
          </div>

          {/* 3 Years */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">3 YEARS</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">● Good</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">
              ₹{((forecast3Y?.estimatedInvestmentValue || 0) + baseline.savings.availableEmergencySavings).toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500 block">
              Estimated savings + investments
            </span>
          </div>

          {/* 5 Years */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">5 YEARS</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">● Positive</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              ₹{((forecast5Y?.estimatedInvestmentValue || 0) + baseline.savings.availableEmergencySavings).toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500 block">
              Estimated savings + investments
            </span>
          </div>
        </div>

        {/* Expandable Technical Details (Kept hidden unless user clicks View Details) */}
        {showDetailedOutlook && (
          <div className="mt-3 p-4 rounded-xl bg-slate-100/70 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-3 animate-fadeIn text-xs">
            <div className="font-bold text-slate-900 dark:text-white">
              Detailed Period Forecasts (Conservative 10% p.a. estimate)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {forecasts.map(f => (
                <div key={f.periodKey} className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-slate-900 dark:text-white">{f.periodKey}</div>
                  <div className="text-[11px] text-purple-600 dark:text-purple-400 mt-0.5">
                    ₹{(f.estimatedInvestmentValue / 100000).toFixed(1)}L
                  </div>
                  <div className="text-[10px] text-slate-400">Debt: ₹{(f.remainingDebt / 100000).toFixed(1)}L</div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 italic">
              Estimated based on your current financial data and selected assumptions. Not guaranteed.
            </p>
          </div>
        )}
      </div>

      {/* ================================================== */}
      {/* 7. IS MY FINANCIAL LIFE IMPROVING?                 */}
      {/* ================================================== */}
      <div className="card-surface rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Is My Financial Life Improving?
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Your direction based on recent habits.
          </p>
        </div>

        {/* Clean Checklist of 5 Indicators */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800 border-y border-slate-100 dark:border-slate-800 text-xs sm:text-sm">
          <div className="py-2.5 flex items-center justify-between">
            <span className="font-medium text-slate-700 dark:text-slate-300">Income</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span>🟢</span> <span>Increasing</span>
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="font-medium text-slate-700 dark:text-slate-300">Savings</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span>🟢</span> <span>Increasing</span>
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="font-medium text-slate-700 dark:text-slate-300">Expenses</span>
            <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <span>🟡</span> <span>Increasing</span>
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="font-medium text-slate-700 dark:text-slate-300">Investments</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span>🟢</span> <span>Growing</span>
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="font-medium text-slate-700 dark:text-slate-300">Debt</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span>🟢</span> <span>Decreasing</span>
            </span>
          </div>
        </div>

        {/* Overall Status + 1-line explanation */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Overall:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
              <span>🟢</span> <span>Improving</span>
            </span>
          </div>

          <p className="text-slate-600 dark:text-slate-400 text-xs">
            "Your savings and investments are growing, but your expenses are also increasing."
          </p>
        </div>
      </div>

      {/* ================================================== */}
      {/* 8. GROW AI ADVICE (ONLY 3 SHORT SECTIONS)          */}
      {/* ================================================== */}
      <div className="card-surface rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>GROW AI Advice</span>
          </h2>
          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md">
            AI Assistant
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
          {/* Section 1: What's Going Well? */}
          <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300 text-xs">
              <span>👍</span>
              <span>What's Going Well?</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              Your savings and long-term investments are steadily increasing.
            </p>
          </div>

          {/* Section 2: What Should You Watch? */}
          <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300 text-xs">
              <span>⚠️</span>
              <span>What Should You Watch?</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              Your living expenses have grown recently. Keep an eye on dining and non-essential shopping.
            </p>
          </div>

          {/* Section 3: What Should You Do? */}
          <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-blue-800 dark:text-blue-300 text-xs">
              <span>💡</span>
              <span>What Should You Do?</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              Build your emergency savings toward 6 months of essential expenses for higher security.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
