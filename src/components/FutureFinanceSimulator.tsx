import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Briefcase, 
  DollarSign, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  HelpCircle, 
  X, 
  RefreshCw, 
  Percent, 
  Sliders, 
  Target, 
  Zap, 
  Activity, 
  Clock, 
  Layers, 
  Info,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  FutureFinanceBaseline, 
  FutureFinanceSimulationResult, 
  FutureFinanceScenarioType,
  ForecastPeriodData,
  RiskLevelType
} from '../types';
import { 
  fetchFutureFinanceOverview, 
  runFutureFinanceSimulation, 
  saveFutureFinanceScenario 
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

  // Timeline view period and toggle
  const [selectedPeriod, setSelectedPeriod] = useState<'1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y'>('1Y');
  const [showWhatIfInTimeline, setShowWhatIfInTimeline] = useState<boolean>(true);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

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
      // Run baseline simulation by default
      const res = await runFutureFinanceSimulation('BASELINE', {});
      if (res) {
        setSimulation(res.simulation);
      }
    }
    setLoading(false);
  };

  const executeSimulation = async (scenarioType: FutureFinanceScenarioType, customParams?: Record<string, any>) => {
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

  const handleSaveSimulation = async () => {
    if (!simulation) return;
    const success = await saveFutureFinanceScenario({
      scenarioType: simulation.scenarioType,
      scenarioInput: simulation.params,
      simulationData: simulation
    });
    if (success) {
      setSaveSuccessNotice('Simulation snapshot saved successfully.');
      setTimeout(() => setSaveSuccessNotice(null), 3000);
    }
  };

  if (loading || !baseline) {
    return (
      <div className="card-surface rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center mx-auto animate-spin">
          <Activity className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Analyzing Financial Trajectory...</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Gathering income streams, essential expenses, active loans, and liquid emergency reserves to build your future simulation.
        </p>
      </div>
    );
  }

  // Active metrics to display (if simulation is active, show simulation metrics; otherwise baseline)
  const isSimulationActive = activeScenario !== 'BASELINE' && simulation;
  const currentRisk = simulation ? simulation.risk : {
    level: baseline.riskLevel,
    score: baseline.riskScore,
    color: baseline.riskLevel === 'LOW RISK' ? '#10B981' : baseline.riskLevel === 'MODERATE RISK' ? '#F59E0B' : '#EF4444',
    description: baseline.riskSummary
  };
  const currentTrends = simulation ? simulation.trends : baseline.financialTrends;
  const currentMetrics = simulation ? simulation.metrics : {
    monthlyIncome: baseline.income.totalMonthlyIncome,
    monthlyExpenses: baseline.expenses.totalMonthlyExpenses,
    monthlySavings: baseline.savings.monthlySavings,
    savingsRate: baseline.savings.savingsRate,
    emergencySavings: baseline.savings.availableEmergencySavings,
    emergencyCoverageMonths: baseline.savings.emergencyFundCoverageMonths,
    debtToIncomeRatio: baseline.debt.debtToIncomeRatio,
    monthlySip: baseline.investments.monthlySipContribution,
    cashBurnRate: 0,
    surplusAllocation: null
  };

  // Find active period data from forecasts
  const activeForecasts = simulation?.forecasts || [];
  const selectedPeriodData = activeForecasts.find(f => f.periodKey === selectedPeriod) || activeForecasts[3] || null;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner with Psychology Brand Blue & Exit Marks */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 sm:p-8 text-white shadow-lg border border-blue-600/30">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-blue-50 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Predictive Financial AI</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-Time Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              AI Financial Future Simulator
            </h1>
            <p className="text-sm sm:text-base text-blue-100 max-w-2xl font-medium">
              Understand your future financial stability before making important decisions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isSimulationActive && (
              <button
                onClick={() => executeSimulation('BASELINE')}
                className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white text-xs font-bold transition-all flex items-center gap-2 border border-white/20 cursor-pointer shadow-sm"
                title="Reset simulation to actual financial baseline"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset to Normal</span>
              </button>
            )}

            {onExit && (
              <button
                onClick={onExit}
                className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all flex items-center gap-2 border border-white/30 cursor-pointer shadow-sm"
                title="Exit to Dashboard"
              >
                <X className="w-4 h-4" />
                <span>Exit</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Summary Pill Bar inside Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/15">
          <div>
            <div className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider">Current Monthly Inflow</div>
            <div className="text-lg sm:text-xl font-bold tracking-tight">
              ₹{baseline.income.totalMonthlyIncome.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider">Monthly Essential Burn</div>
            <div className="text-lg sm:text-xl font-bold tracking-tight">
              ₹{(baseline.expenses.essentialExpenses + baseline.debt.totalMonthlyEmi).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider">Emergency Runway</div>
            <div className="text-lg sm:text-xl font-bold tracking-tight text-emerald-300">
              {baseline.savings.emergencyFundCoverageMonths} Months
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider">Current Risk Level</div>
            <div className="text-lg sm:text-xl font-bold tracking-tight text-amber-200">
              {baseline.riskLevel}
            </div>
          </div>
        </div>
      </div>

      {saveSuccessNotice && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{saveSuccessNotice}</span>
        </div>
      )}

      {/* 2. Interactive "What If?" Financial Simulator Controls */}
      <div className="card-surface rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                <Sliders className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">What If? Financial Simulator</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select a real-world scenario to simulate its impact on your savings, runway, investments, and risk.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Active Scenario:</span>
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200 dark:border-blue-800/60">
              {activeScenario === 'BASELINE' ? 'Normal Plan' : activeScenario.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* 6 Scenario Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {/* Scenario 1: Salary Reduction */}
          <div 
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              activeScenario === 'SALARY_REDUCTION' 
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-500/50' 
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40'
            }`}
            onClick={() => executeSimulation('SALARY_REDUCTION', { percentage: salaryReductionPct })}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
                  <TrendingDown className="w-4 h-4" />
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">Salary Reduction</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">"What if my salary decreases?"</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
              Simulate a pay cut or transition to lower compensation.
            </p>

            <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {[10, 20, 30].map(pct => (
                <button
                  key={pct}
                  onClick={() => {
                    setSalaryReductionPct(pct);
                    executeSimulation('SALARY_REDUCTION', { percentage: pct });
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    salaryReductionPct === pct && activeScenario === 'SALARY_REDUCTION'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  -{pct}%
                </button>
              ))}
              <span className="text-[11px] text-slate-500">(-₹{Math.round(baseline.income.primarySalary * (salaryReductionPct / 100)).toLocaleString()}/mo)</span>
            </div>
          </div>

          {/* Scenario 2: Job Loss */}
          <div 
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              activeScenario === 'JOB_LOSS' 
                ? 'border-red-500 bg-red-50/40 dark:bg-red-950/20 ring-1 ring-red-500/50' 
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40'
            }`}
            onClick={() => executeSimulation('JOB_LOSS')}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                  <ShieldAlert className="w-4 h-4" />
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">Temporary Job Loss</span>
              </div>
              <span className="text-[11px] font-semibold text-red-600 dark:text-red-400">Emergency Test</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
              Primary salary drops to ₹0. Tests how many months your liquid reserves support essential living & loan EMIs.
            </p>

            <div className="mt-3 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="text-red-600 dark:text-red-400 font-bold">Simulate Survival Runway</span>
              <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
                Run Simulation <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Scenario 3: Expense Increase */}
          <div 
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              activeScenario === 'EXPENSE_INCREASE' 
                ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 ring-1 ring-amber-500/50' 
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40'
            }`}
            onClick={() => executeSimulation('EXPENSE_INCREASE', { percentage: expenseIncreasePct })}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
                  <TrendingUp className="w-4 h-4" />
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">Expense Inflation</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">Living Costs</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
              Simulate inflation in rent, food, utilities, and daily living expenses.
            </p>

            <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {[10, 20, 30].map(pct => (
                <button
                  key={pct}
                  onClick={() => {
                    setExpenseIncreasePct(pct);
                    executeSimulation('EXPENSE_INCREASE', { percentage: pct });
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    expenseIncreasePct === pct && activeScenario === 'EXPENSE_INCREASE'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  +{pct}%
                </button>
              ))}
              <span className="text-[11px] text-slate-500">(+₹{Math.round(baseline.expenses.totalMonthlyExpenses * (expenseIncreasePct / 100)).toLocaleString()}/mo)</span>
            </div>
          </div>

          {/* Scenario 4: Unexpected Expense */}
          <div 
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              activeScenario === 'UNEXPECTED_EXPENSE' 
                ? 'border-purple-500 bg-purple-50/40 dark:bg-purple-950/20 ring-1 ring-purple-500/50' 
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40'
            }`}
            onClick={() => executeSimulation('UNEXPECTED_EXPENSE', { amount: unexpectedExpenseAmt })}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
                  <AlertTriangle className="w-4 h-4" />
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">Unexpected Expense</span>
              </div>
              <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">Lump Sum Shock</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
              Test the shock of a sudden medical bill, vehicle repair, or appliance replacement.
            </p>

            <div className="mt-3 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              {[25000, 50000, 100000].map(amt => (
                <button
                  key={amt}
                  onClick={() => {
                    setUnexpectedExpenseAmt(amt);
                    executeSimulation('UNEXPECTED_EXPENSE', { amount: amt });
                  }}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    unexpectedExpenseAmt === amt && activeScenario === 'UNEXPECTED_EXPENSE'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  ₹{(amt / 1000)}k
                </button>
              ))}
            </div>
          </div>

          {/* Scenario 5: Investment Contribution Change */}
          <div 
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              activeScenario === 'INVESTMENT_CHANGE' 
                ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 ring-1 ring-indigo-500/50' 
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40'
            }`}
            onClick={() => executeSimulation('INVESTMENT_CHANGE', { newSip: customSipAmt })}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                  <TrendingUp className="w-4 h-4" />
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">Adjust Monthly SIP</span>
              </div>
              <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">Wealth Horizon</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
              Simulate increasing or decreasing your monthly mutual fund or index SIP contributions.
            </p>

            <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {[8000, 15000, 25000].map(amt => (
                <button
                  key={amt}
                  onClick={() => {
                    setCustomSipAmt(amt);
                    executeSimulation('INVESTMENT_CHANGE', { newSip: amt });
                  }}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    customSipAmt === amt && activeScenario === 'INVESTMENT_CHANGE'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  ₹{(amt / 1000)}k/mo
                </button>
              ))}
            </div>
          </div>

          {/* Scenario 6: Salary Increase & Smart Surplus Allocation */}
          <div 
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              activeScenario === 'SALARY_INCREASE' 
                ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 ring-1 ring-emerald-500/50' 
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40'
            }`}
            onClick={() => executeSimulation('SALARY_INCREASE', { percentage: salaryHikePct })}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">Salary Increase</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Growth Plan</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
              Simulate a promotion or salary hike with AI-recommended surplus allocation.
            </p>

            <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {[5, 10, 20].map(pct => (
                <button
                  key={pct}
                  onClick={() => {
                    setSalaryHikePct(pct);
                    executeSimulation('SALARY_INCREASE', { percentage: pct });
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    salaryHikePct === pct && activeScenario === 'SALARY_INCREASE'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  +{pct}%
                </button>
              ))}
              <span className="text-[11px] text-slate-500">(+₹{Math.round(baseline.income.primarySalary * (salaryHikePct / 100)).toLocaleString()}/mo)</span>
            </div>
          </div>
        </div>

        {/* If Surplus Allocation is active (Salary Increase), show recommended distribution breakdown */}
        {simulation?.metrics?.surplusAllocation && (
          <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>AI Recommended Allocation of Additional Surplus (+₹{simulation.metrics.surplusAllocation.monthlyHikeAmount.toLocaleString()}/mo)</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">50/30/20 Wealth Blueprint</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60">
                <div className="text-slate-500 text-[11px]">Emergency Vault (30%)</div>
                <div className="font-bold text-emerald-600 mt-0.5">₹{simulation.metrics.surplusAllocation.emergencyReserve.toLocaleString()}/mo</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60">
                <div className="text-slate-500 text-[11px]">Long-Term SIPs (40%)</div>
                <div className="font-bold text-blue-600 mt-0.5">₹{simulation.metrics.surplusAllocation.wealthInvestments.toLocaleString()}/mo</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60">
                <div className="text-slate-500 text-[11px]">Goal Acceleration (20%)</div>
                <div className="font-bold text-purple-600 mt-0.5">₹{simulation.metrics.surplusAllocation.goalAcceleration.toLocaleString()}/mo</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60">
                <div className="text-slate-500 text-[11px]">Lifestyle Upgrade (10%)</div>
                <div className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">₹{simulation.metrics.surplusAllocation.lifestyleDiscretionary.toLocaleString()}/mo</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Financial Safety Net & Risk Prediction */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Safety Net (Survival Analysis) */}
        <div className="card-surface rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Financial Safety Net</h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">Survival Analysis</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Emergency Fund Coverage</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 flex items-baseline gap-2">
                  <span>{currentMetrics.emergencyCoverageMonths} Months</span>
                  <span className="text-xs font-normal text-slate-500">of essential living expenses</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-semibold text-slate-500">Liquid Reserve</span>
                <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  ₹{currentMetrics.emergencySavings.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Coverage Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    currentMetrics.emergencyCoverageMonths >= 6 
                      ? 'bg-emerald-500' 
                      : currentMetrics.emergencyCoverageMonths >= 3 
                        ? 'bg-amber-500' 
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, (currentMetrics.emergencyCoverageMonths / 6) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                <span>0 Months</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">3 Mo (Minimum)</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">6 Mo (Target Benchmark)</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 italic pt-1">
              "Your current emergency savings could cover approximately <strong className="text-slate-900 dark:text-white">{currentMetrics.emergencyCoverageMonths} months</strong> of essential expenses under the selected assumptions."
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-slate-500 text-[11px]">Monthly Essential Burn</div>
              <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                ₹{(baseline.expenses.essentialExpenses + baseline.debt.totalMonthlyEmi).toLocaleString()}/mo
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Rent, Food, Healthcare & EMIs</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-slate-500 text-[11px]">Monthly Discretionary</div>
              <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                ₹{baseline.expenses.nonEssentialExpenses.toLocaleString()}/mo
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Can be trimmed in emergencies</div>
            </div>
          </div>
        </div>

        {/* Financial Risk Prediction & Trends */}
        <div className="card-surface rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                <Activity className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Financial Risk Prediction</h3>
            </div>
            
            {/* Risk Badge */}
            <div className={`px-3 py-1 rounded-full text-xs font-black tracking-wide border uppercase ${
              currentRisk.level === 'LOW RISK' 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                : currentRisk.level === 'MODERATE RISK'
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                  : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800 animate-pulse'
            }`}>
              {currentRisk.level}
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {currentRisk.description}
          </p>

          {/* Financial Trend Indicators Matrix */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
              <span>Financial Trend Matrix</span>
              <span className={`text-xs font-extrabold ${
                currentTrends.overallPosition === 'Improving' ? 'text-emerald-600' :
                currentTrends.overallPosition === 'Stable' ? 'text-blue-600' :
                'text-red-600'
              }`}>
                Position: {currentTrends.overallPosition}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-slate-500">Income</span>
                <span className="font-bold text-emerald-600">↑ {currentTrends.income}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-slate-500">Savings</span>
                <span className={`font-bold ${currentTrends.savings === 'Improving' ? 'text-emerald-600' : currentTrends.savings === 'Declining' ? 'text-red-500' : 'text-blue-600'}`}>
                  {currentTrends.savings === 'Declining' ? '↓' : '↑'} {currentTrends.savings}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-slate-500">Expenses</span>
                <span className={`font-bold ${currentTrends.expenses === 'At Risk' ? 'text-red-500' : 'text-amber-600'}`}>
                  {currentTrends.expenses}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-slate-500">Investments</span>
                <span className="font-bold text-purple-600">↑ {currentTrends.investments}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-slate-500">Debt & EMI</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">→ {currentTrends.debt}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-slate-500">Emergency</span>
                <span className={`font-bold ${currentTrends.emergencyFund === 'At Risk' ? 'text-red-500' : 'text-emerald-600'}`}>
                  {currentTrends.emergencyFund}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Future Financial Timeline & Interactive Multi-Period Forecast */}
      <div className="card-surface rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
                <Calendar className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Future Financial Timeline & Forecast</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Explore how your savings, portfolio growth, and loan amortizations unfold across periods.
            </p>
          </div>

          {/* Period Selector Tabs: 1M | 3M | 6M | 1Y | 3Y | 5Y */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {(['1M', '3M', '6M', '1Y', '3Y', '5Y'] as const).map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedPeriod === period
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Period High-Level Forecast Card */}
        {selectedPeriodData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Expected Inflow</span>
              <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
                ₹{selectedPeriodData.expectedIncome.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Across {selectedPeriodData.label}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Expected Outflow</span>
              <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
                ₹{selectedPeriodData.expectedExpenses.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Living + Loan EMIs</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Estimated Portfolio</span>
              <div className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                ₹{selectedPeriodData.estimatedInvestmentValue.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Compound Growth (10% p.a.)</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Remaining Debt</span>
              <div className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                ₹{selectedPeriodData.remainingDebt.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Paid down via EMIs</div>
            </div>
          </div>
        )}

        {/* Visual Timeline Stepper (NOW -> 3M -> 6M -> 1Y -> 3Y -> 5Y) */}
        <div className="space-y-3 pt-2">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Milestone Progression Map</div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {activeForecasts.map(f => (
              <div
                key={f.periodKey}
                onClick={() => setSelectedPeriod(f.periodKey)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  selectedPeriod === f.periodKey
                    ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 ring-1 ring-blue-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-extrabold text-slate-900 dark:text-white">{f.periodKey}</span>
                  <span className={`text-[10px] font-bold ${f.netSavingsAdded >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {f.netSavingsAdded >= 0 ? '+' : ''}₹{Math.round(f.netSavingsAdded / 1000)}k
                  </span>
                </div>
                <div className="text-xs font-bold text-purple-600 dark:text-purple-400 mt-1.5 truncate">
                  ₹{(f.estimatedInvestmentValue / 100000).toFixed(1)}L Port.
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Stability: {f.stabilityScore}/100
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Clear Disclaimer and Stated Assumptions */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-slate-700 dark:text-slate-300">Estimated Forecast & Safety Notice</div>
            <p>
              Calculated using conservative models: 10% annualized return assumption on diversified portfolios, regular EMI amortizations, and steady essential obligations. 
              <strong> Not a guarantee of future market returns or employment status.</strong> Actual results may vary based on market conditions.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Comparison View: "Current Plan vs What-If Plan" */}
      {simulation && simulation.comparison && (
        <div className="card-surface rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                <Layers className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Current Plan vs What-If Plan</h3>
            </div>
            
            <button
              onClick={handleSaveSimulation}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Save Scenario</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Financial Metric</th>
                  <th className="py-3 px-4">Current Plan (Baseline)</th>
                  <th className="py-3 px-4">What-If Plan ({activeScenario.replace(/_/g, ' ')})</th>
                  <th className="py-3 px-4 text-right">Impact / Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {simulation.comparison.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {item.metric}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {item.currentPlan}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {item.whatIfPlan}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-flex items-center gap-1 font-bold ${
                        item.status === 'positive' 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : item.status === 'warning' 
                            ? 'text-amber-600 dark:text-amber-400' 
                            : 'text-red-600 dark:text-red-400'
                      }`}>
                        {item.status === 'positive' ? '✓' : item.status === 'warning' ? '⚠️' : '↓'}
                        {typeof item.delta === 'number' && item.delta !== 0 ? (
                          <span>
                            {item.delta > 0 ? '+' : ''}{item.delta > 100 ? `₹${item.delta.toLocaleString()}` : `${item.delta} Mo`}
                          </span>
                        ) : (
                          <span>{item.status.toUpperCase()}</span>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. AI Future Insights & Personalized Action Plan */}
      {simulation?.aiExplanation && (
        <div className="card-surface rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">AI Financial Future Explanation</h3>
            </div>
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-900/60">
              GROW AI Advisor
            </span>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
            💡 {simulation.aiExplanation.summary}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* What is going well? */}
            <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>What is going well?</span>
              </div>
              <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 list-disc list-inside">
                {simulation.aiExplanation.goingWell.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </div>

            {/* What is concerning? */}
            <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>What is concerning?</span>
              </div>
              <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 list-disc list-inside">
                {simulation.aiExplanation.concerning.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </div>

            {/* What may happen? */}
            <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-purple-800 dark:text-purple-300">
                <Activity className="w-4 h-4 text-purple-600" />
                <span>What may happen?</span>
              </div>
              <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 list-disc list-inside">
                {simulation.aiExplanation.mayHappen.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </div>

            {/* What can the user do? */}
            <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-blue-800 dark:text-blue-300">
                <Target className="w-4 h-4 text-blue-600" />
                <span>Recommended Action Plan</span>
              </div>
              <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 list-disc list-inside">
                {simulation.aiExplanation.actions.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
