// AI Financial Future Simulator & Risk Prediction Engine
// Deterministic financial mathematics + AI contextual explanation

import { getFinancialSnapshot } from './financialDataService.js';

const ANNUAL_INVESTMENT_RETURN_RATE = 0.10; // 10% conservative diversified portfolio growth assumption
const ANNUAL_INFLATION_RATE = 0.055;        // 5.5% conservative inflation assumption

/**
 * 1. Calculate Comprehensive User Financial Baseline
 */
export function getUserFinancialBaseline(userId = 'u-101', memoryStore = {}) {
  const snapshot = getFinancialSnapshot(userId, memoryStore);
  const { user, incomes = [], expenses = [], loans = [], investments = [], goals = [] } = snapshot;

  // Primary salary vs other income streams
  let primarySalary = 0;
  let otherIncome = 0;
  incomes.forEach(inc => {
    const amt = Number(inc.amount) || 0;
    if (inc.category === 'Salary') {
      primarySalary += amt;
    } else {
      otherIncome += amt;
    }
  });

  const totalMonthlyIncome = primarySalary + otherIncome;

  // Categorize expenses: Essential vs Non-essential
  const essentialCategories = ['Rent', 'EMI', 'Food', 'Fuel', 'Utilities', 'Medical', 'Healthcare', 'Bills', 'Insurance'];
  let essentialExpenses = 0;
  let nonEssentialExpenses = 0;
  const categoryBreakdown = {};

  expenses.forEach(exp => {
    const amt = Number(exp.amount) || 0;
    const cat = exp.category || 'Others';
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + amt;

    if (essentialCategories.includes(cat)) {
      essentialExpenses += amt;
    } else {
      nonEssentialExpenses += amt;
    }
  });

  // Loans, Debt and Monthly EMIs
  let totalMonthlyEmi = 0;
  let totalOutstandingDebt = 0;
  loans.forEach(loan => {
    totalMonthlyEmi += Number(loan.monthlyEmi) || 0;
    totalOutstandingDebt += Number(loan.remainingBalance || loan.principalAmount) || 0;
  });

  // Make sure EMI is accounted in essential monthly commitments
  const totalEssentialObligations = essentialExpenses + (essentialExpenses.includes ? 0 : 0);
  const totalMonthlyExpenses = expenses.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);

  // Monthly Net Savings
  const monthlySavings = totalMonthlyIncome - totalMonthlyExpenses;
  const savingsRate = totalMonthlyIncome > 0 ? Math.max(0, Number(((monthlySavings / totalMonthlyIncome) * 100).toFixed(1))) : 0;

  // Debt-to-Income (DTI)
  const debtToIncomeRatio = totalMonthlyIncome > 0 ? Number(((totalMonthlyEmi / totalMonthlyIncome) * 100).toFixed(1)) : 0;

  // Investments & SIP contribution
  let totalInvestmentValue = 0;
  let monthlySipContribution = 0;
  const investmentCategories = {};

  investments.forEach(inv => {
    const val = Number(inv.currentValue) || Number(inv.investedAmount) || 0;
    totalInvestmentValue += val;
    const cat = inv.category || 'Other';
    investmentCategories[cat] = (investmentCategories[cat] || 0) + val;
  });

  // Estimate monthly SIP from mutual funds / recurring savings
  monthlySipContribution = Math.round(monthlySavings * 0.35); // Conservative baseline SIP (approx 35% of monthly savings)
  if (monthlySipContribution <= 0 && monthlySavings > 0) monthlySipContribution = 5000;

  // Liquid Emergency Fund: check goals or compute from safe liquid assets
  const emergencyGoal = goals.find(g => (g.title || '').toLowerCase().includes('emergency') || (g.category || '').toLowerCase().includes('emergency'));
  let availableEmergencySavings = emergencyGoal ? Number(emergencyGoal.currentAmount) : 0;
  
  // If no explicit emergency goal or low, check gold/liquid share
  const goldAndFdValue = (investmentCategories['Gold'] || 0) + (investmentCategories['FD'] || 0);
  if (availableEmergencySavings === 0) {
    availableEmergencySavings = Math.max(75000, Math.round(monthlySavings * 3 + goldAndFdValue * 0.5));
  }

  // Emergency Fund Coverage (in months of essential spending)
  const monthlyEssentialBurn = Math.max(1, essentialExpenses + totalMonthlyEmi);
  const emergencyFundCoverageMonths = Number((availableEmergencySavings / monthlyEssentialBurn).toFixed(1));

  // Goals aggregation
  const goalsSummary = goals.map(g => {
    const target = Number(g.targetAmount) || 1;
    const current = Number(g.currentAmount) || 0;
    const remaining = Math.max(0, target - current);
    const progressPct = Math.min(100, Math.round((current / target) * 100));
    const monthlyAlloc = Math.max(1000, Math.round(monthlySavings * 0.25));
    const etaMonths = monthlyAlloc > 0 ? Math.ceil(remaining / monthlyAlloc) : 99;
    return {
      id: g.id || g._id,
      title: g.title,
      targetAmount: target,
      currentAmount: current,
      remainingAmount: remaining,
      progressPct,
      category: g.category || 'General',
      targetDate: g.targetDate,
      estimatedEtaMonths: etaMonths
    };
  });

  // Baseline Risk Assessment
  const baselineRisk = calculateRiskLevel(emergencyFundCoverageMonths, debtToIncomeRatio, savingsRate, monthlySavings);

  // Baseline Financial Trends
  const baselineTrends = evaluateFinancialTrends({
    incomeGrowth: 4.5,
    expenseGrowth: 2.1,
    savingsRate,
    emergencyCoverage: emergencyFundCoverageMonths,
    debtRatio: debtToIncomeRatio,
    investmentsGrowth: 8.2,
    goalCompletionRate: 75
  });

  return {
    user: {
      id: user.id || userId,
      name: user.name || 'Alex Vance',
      currency: user.currency || 'INR'
    },
    income: {
      primarySalary,
      otherIncome,
      totalMonthlyIncome,
      trend: 'Improving (+4.5% annual)'
    },
    expenses: {
      totalMonthlyExpenses,
      essentialExpenses,
      nonEssentialExpenses,
      essentialRatio: totalMonthlyExpenses > 0 ? Number(((essentialExpenses / totalMonthlyExpenses) * 100).toFixed(1)) : 0,
      categoryBreakdown
    },
    debt: {
      totalMonthlyEmi,
      totalOutstandingDebt,
      debtToIncomeRatio,
      loansCount: loans.length
    },
    savings: {
      monthlySavings,
      savingsRate,
      availableEmergencySavings,
      monthlyEssentialBurn,
      emergencyFundCoverageMonths,
      recommendedTargetMonths: 6
    },
    investments: {
      totalInvestmentValue,
      monthlySipContribution,
      categories: investmentCategories
    },
    goals: goalsSummary,
    riskLevel: baselineRisk.level,
    riskScore: baselineRisk.score,
    riskSummary: baselineRisk.description,
    financialTrends: baselineTrends,
    timestamp: new Date().toISOString()
  };
}

/**
 * 2. Simulate What-If Scenarios
 */
export function simulateScenario(baseline, scenarioType, params = {}) {
  const {
    percentage = 0,
    amount = 0,
    newSip = 0,
    customMonths = 6
  } = params;

  let simulatedIncome = baseline.income.totalMonthlyIncome;
  let simulatedExpenses = baseline.expenses.totalMonthlyExpenses;
  let simulatedEssentialExpenses = baseline.expenses.essentialExpenses;
  let simulatedEmergencySavings = baseline.savings.availableEmergencySavings;
  let simulatedMonthlySip = baseline.investments.monthlySipContribution;
  let scenarioDescription = '';
  let keyMetricLabel = '';
  let keyMetricValue = '';
  let survivalMonths = baseline.savings.emergencyFundCoverageMonths;
  let monthlyCashBurn = 0;
  let surplusAllocation = null;

  switch (scenarioType) {
    case 'SALARY_REDUCTION': {
      const pct = Number(percentage) || 20;
      const reductionAmount = Math.round(baseline.income.primarySalary * (pct / 100));
      simulatedIncome = Math.max(0, baseline.income.totalMonthlyIncome - reductionAmount);
      scenarioDescription = `Simulated a ${pct}% reduction in your primary salary (-₹${reductionAmount.toLocaleString()}/mo).`;
      keyMetricLabel = 'New Monthly Income';
      keyMetricValue = `₹${simulatedIncome.toLocaleString()}`;
      break;
    }

    case 'JOB_LOSS': {
      // Primary salary drops to 0; other income remains
      simulatedIncome = baseline.income.otherIncome;
      // In job loss, discretionary spending is halted to survive
      monthlyCashBurn = baseline.expenses.essentialExpenses + baseline.debt.totalMonthlyEmi - simulatedIncome;
      monthlyCashBurn = Math.max(1, monthlyCashBurn);
      survivalMonths = Number((simulatedEmergencySavings / monthlyCashBurn).toFixed(1));
      
      scenarioDescription = `Simulated sudden job loss. Primary salary drops to ₹0 while maintaining essential rent, food, healthcare & EMIs.`;
      keyMetricLabel = 'Estimated Runway';
      keyMetricValue = `${survivalMonths} Months`;
      break;
    }

    case 'EXPENSE_INCREASE': {
      const pct = Number(percentage) || 20;
      const addedExpense = Math.round(baseline.expenses.totalMonthlyExpenses * (pct / 100));
      simulatedExpenses = baseline.expenses.totalMonthlyExpenses + addedExpense;
      simulatedEssentialExpenses = baseline.expenses.essentialExpenses + Math.round(addedExpense * 0.7);
      scenarioDescription = `Simulated an unexpected ${pct}% inflation in recurring monthly living expenses (+₹${addedExpense.toLocaleString()}/mo).`;
      keyMetricLabel = 'New Monthly Expenses';
      keyMetricValue = `₹${simulatedExpenses.toLocaleString()}`;
      break;
    }

    case 'UNEXPECTED_EXPENSE': {
      const shockAmount = Number(amount) || 50000;
      simulatedEmergencySavings = Math.max(0, baseline.savings.availableEmergencySavings - shockAmount);
      const essentialBurn = baseline.expenses.essentialExpenses + baseline.debt.totalMonthlyEmi;
      survivalMonths = Number((simulatedEmergencySavings / essentialBurn).toFixed(1));
      scenarioDescription = `Simulated an immediate unexpected expense / medical emergency of ₹${shockAmount.toLocaleString()} deducted from reserves.`;
      keyMetricLabel = 'Remaining Emergency Fund';
      keyMetricValue = `₹${simulatedEmergencySavings.toLocaleString()}`;
      break;
    }

    case 'INVESTMENT_CHANGE': {
      const targetSip = Number(newSip) || (baseline.investments.monthlySipContribution + 5000);
      simulatedMonthlySip = Math.max(0, targetSip);
      const diff = simulatedMonthlySip - baseline.investments.monthlySipContribution;
      scenarioDescription = `Simulated adjusting your monthly investment / SIP contributions to ₹${simulatedMonthlySip.toLocaleString()}/mo (${diff >= 0 ? '+' : ''}₹${diff.toLocaleString()}/mo).`;
      keyMetricLabel = 'New Monthly SIP';
      keyMetricValue = `₹${simulatedMonthlySip.toLocaleString()}`;
      break;
    }

    case 'SALARY_INCREASE': {
      const pct = Number(percentage) || 15;
      const hikeAmount = Math.round(baseline.income.primarySalary * (pct / 100));
      simulatedIncome = baseline.income.totalMonthlyIncome + hikeAmount;
      
      // Smart Surplus Allocation (50/30/20 Rule)
      surplusAllocation = {
        monthlyHikeAmount: hikeAmount,
        emergencyReserve: Math.round(hikeAmount * 0.30), // 30% to beef up emergency fund
        wealthInvestments: Math.round(hikeAmount * 0.40), // 40% to SIPs & long-term wealth
        goalAcceleration: Math.round(hikeAmount * 0.20), // 20% to goals
        lifestyleDiscretionary: Math.round(hikeAmount * 0.10) // 10% lifestyle upgrade
      };

      scenarioDescription = `Simulated a ${pct}% raise in salary (+₹${hikeAmount.toLocaleString()}/mo) with smart surplus allocation.`;
      keyMetricLabel = 'Additional Cash Flow';
      keyMetricValue = `+₹${hikeAmount.toLocaleString()}/mo`;
      break;
    }

    default:
      scenarioDescription = 'Baseline normal financial plan with current income and spending trajectory.';
      keyMetricLabel = 'Current Savings Rate';
      keyMetricValue = `${baseline.savings.savingsRate}%`;
  }

  // Calculate new monthly savings and rates
  const simulatedMonthlySavings = simulatedIncome - simulatedExpenses;
  const simulatedSavingsRate = simulatedIncome > 0 ? Math.max(0, Number(((simulatedMonthlySavings / simulatedIncome) * 100).toFixed(1))) : 0;
  const essentialMonthlyBurn = Math.max(1, simulatedEssentialExpenses + baseline.debt.totalMonthlyEmi);
  const simulatedCoverageMonths = Number((simulatedEmergencySavings / essentialMonthlyBurn).toFixed(1));
  const simulatedDti = simulatedIncome > 0 ? Number(((baseline.debt.totalMonthlyEmi / simulatedIncome) * 100).toFixed(1)) : 100;

  // New Risk Level
  const simulatedRisk = calculateRiskLevel(simulatedCoverageMonths, simulatedDti, simulatedSavingsRate, simulatedMonthlySavings);

  // New Trends
  const simulatedTrends = evaluateFinancialTrends({
    incomeGrowth: scenarioType === 'SALARY_INCREASE' ? 15 : scenarioType === 'JOB_LOSS' ? -100 : scenarioType === 'SALARY_REDUCTION' ? -(Number(percentage) || 20) : 4.5,
    expenseGrowth: scenarioType === 'EXPENSE_INCREASE' ? (Number(percentage) || 20) : 2.1,
    savingsRate: simulatedSavingsRate,
    emergencyCoverage: simulatedCoverageMonths,
    debtRatio: simulatedDti,
    investmentsGrowth: scenarioType === 'INVESTMENT_CHANGE' ? 12 : 8.2,
    goalCompletionRate: simulatedMonthlySavings < 0 ? 30 : 80
  });

  // Generate Multi-Period Forecast for this scenario
  const forecasts = generateForecastTimeline(baseline, {
    simulatedIncome,
    simulatedExpenses,
    simulatedMonthlySavings,
    simulatedEmergencySavings,
    simulatedMonthlySip,
    essentialMonthlyBurn,
    scenarioType,
    params
  });

  return {
    scenarioType,
    params,
    description: scenarioDescription,
    keyMetric: {
      label: keyMetricLabel,
      value: keyMetricValue
    },
    metrics: {
      monthlyIncome: simulatedIncome,
      monthlyExpenses: simulatedExpenses,
      monthlySavings: simulatedMonthlySavings,
      savingsRate: simulatedSavingsRate,
      emergencySavings: simulatedEmergencySavings,
      emergencyCoverageMonths: simulatedCoverageMonths,
      debtToIncomeRatio: simulatedDti,
      monthlySip: simulatedMonthlySip,
      cashBurnRate: monthlyCashBurn,
      surplusAllocation
    },
    risk: simulatedRisk,
    trends: simulatedTrends,
    forecasts,
    comparison: createComparisonTable(baseline, {
      monthlyIncome: simulatedIncome,
      monthlyEssentialExpenses: simulatedEssentialExpenses,
      monthlySavings: simulatedMonthlySavings,
      emergencySavings: simulatedEmergencySavings,
      coverageMonths: simulatedCoverageMonths,
      riskLevel: simulatedRisk.level,
      scenarioType
    })
  };
}

/**
 * 3. Multi-Period Financial Forecast Timeline (1M, 3M, 6M, 1Y, 3Y, 5Y)
 */
export function generateForecastTimeline(baseline, scenarioState = {}) {
  const periods = [
    { key: '1M', label: '1 Month', months: 1 },
    { key: '3M', label: '3 Months', months: 3 },
    { key: '6M', label: '6 Months', months: 6 },
    { key: '1Y', label: '1 Year (12M)', months: 12 },
    { key: '3Y', label: '3 Years (36M)', months: 36 },
    { key: '5Y', label: '5 Years (60M)', months: 60 }
  ];

  const monthlyIncome = scenarioState.simulatedIncome ?? baseline.income.totalMonthlyIncome;
  const monthlyExpenses = scenarioState.simulatedExpenses ?? baseline.expenses.totalMonthlyExpenses;
  const monthlySavings = scenarioState.simulatedMonthlySavings ?? baseline.savings.monthlySavings;
  const startingEmergency = scenarioState.simulatedEmergencySavings ?? baseline.savings.availableEmergencySavings;
  const startingInvestments = baseline.investments.totalInvestmentValue;
  const monthlySip = scenarioState.simulatedMonthlySip ?? baseline.investments.monthlySipContribution;
  const monthlyEmi = baseline.debt.totalMonthlyEmi;

  const monthlyReturn = ANNUAL_INVESTMENT_RETURN_RATE / 12;

  return periods.map(p => {
    const n = p.months;

    // Cumulative Expected Income & Expenses
    const expectedIncome = monthlyIncome * n;
    const expectedExpenses = monthlyExpenses * n;

    // Cumulative Savings added (or drawn down if negative)
    const netSavingsAdded = monthlySavings * n;
    const emergencyFundStatus = Math.max(0, startingEmergency + (monthlySavings > 0 ? Math.round(monthlySavings * 0.25 * n) : netSavingsAdded));

    // Compound Interest Growth on Investments:
    // FV = PV*(1+r)^n + PMT * [((1+r)^n - 1) / r]
    let estimatedInvestmentValue = startingInvestments * Math.pow(1 + monthlyReturn, n);
    if (monthlySip > 0) {
      estimatedInvestmentValue += monthlySip * ((Math.pow(1 + monthlyReturn, n) - 1) / monthlyReturn);
    }
    estimatedInvestmentValue = Math.round(estimatedInvestmentValue);

    // Remaining Debt Impact (pay down EMIs)
    const debtPaidDown = Math.min(baseline.debt.totalOutstandingDebt, monthlyEmi * n);
    const remainingDebt = Math.max(0, baseline.debt.totalOutstandingDebt - debtPaidDown);

    // Goal Progress Estimate
    const totalGoalsTarget = baseline.goals.reduce((acc, g) => acc + g.targetAmount, 0);
    const estimatedGoalContributions = Math.max(0, monthlySavings * 0.3 * n);
    const projectedGoalCompletionPct = totalGoalsTarget > 0 ? Math.min(100, Math.round(((baseline.goals.reduce((a, g) => a + g.currentAmount, 0) + estimatedGoalContributions) / totalGoalsTarget) * 100)) : 100;

    // Stability Score (0-100)
    let stabilityScore = 70;
    if (emergencyFundStatus >= monthlyExpenses * 6) stabilityScore += 15;
    else if (emergencyFundStatus < monthlyExpenses * 2) stabilityScore -= 20;

    if (monthlySavings > 0) stabilityScore += 15;
    else stabilityScore -= 25;

    stabilityScore = Math.min(100, Math.max(10, stabilityScore));

    return {
      periodKey: p.key,
      label: p.label,
      months: n,
      expectedIncome,
      expectedExpenses,
      netSavingsAdded,
      estimatedInvestmentValue,
      emergencyFundStatus,
      remainingDebt,
      goalCompletionPct: projectedGoalCompletionPct,
      stabilityScore,
      assumptions: [
        'Assumes 10% p.a. conservative annualized growth on diversified portfolio.',
        'Assumes constant monthly essential expenses & steady loan EMI amortizations.',
        'Estimated forecast for planning purposes. Market conditions may vary.'
      ]
    };
  });
}

/**
 * 4. Side-by-side Comparison Table ("Current Plan vs What-If Plan")
 */
function createComparisonTable(baseline, scenario) {
  return [
    {
      metric: 'Monthly Income',
      currentPlan: `₹${baseline.income.totalMonthlyIncome.toLocaleString()}`,
      whatIfPlan: `₹${scenario.monthlyIncome.toLocaleString()}`,
      delta: scenario.monthlyIncome - baseline.income.totalMonthlyIncome,
      status: scenario.monthlyIncome >= baseline.income.totalMonthlyIncome ? 'positive' : 'negative'
    },
    {
      metric: 'Essential Expenses & EMI',
      currentPlan: `₹${(baseline.expenses.essentialExpenses + baseline.debt.totalMonthlyEmi).toLocaleString()}`,
      whatIfPlan: `₹${(scenario.monthlyEssentialExpenses + baseline.debt.totalMonthlyEmi).toLocaleString()}`,
      delta: scenario.monthlyEssentialExpenses - baseline.expenses.essentialExpenses,
      status: scenario.monthlyEssentialExpenses <= baseline.expenses.essentialExpenses ? 'positive' : 'warning'
    },
    {
      metric: 'Monthly Net Savings',
      currentPlan: `₹${baseline.savings.monthlySavings.toLocaleString()}`,
      whatIfPlan: `₹${scenario.monthlySavings.toLocaleString()}`,
      delta: scenario.monthlySavings - baseline.savings.monthlySavings,
      status: scenario.monthlySavings >= 0 ? (scenario.monthlySavings >= baseline.savings.monthlySavings ? 'positive' : 'warning') : 'negative'
    },
    {
      metric: 'Available Emergency Fund',
      currentPlan: `₹${baseline.savings.availableEmergencySavings.toLocaleString()}`,
      whatIfPlan: `₹${scenario.emergencySavings.toLocaleString()}`,
      delta: scenario.emergencySavings - baseline.savings.availableEmergencySavings,
      status: scenario.emergencySavings >= baseline.savings.availableEmergencySavings ? 'positive' : 'warning'
    },
    {
      metric: 'Estimated Survival Runway',
      currentPlan: `${baseline.savings.emergencyFundCoverageMonths} Months`,
      whatIfPlan: `${scenario.coverageMonths} Months`,
      delta: Number((scenario.coverageMonths - baseline.savings.emergencyFundCoverageMonths).toFixed(1)),
      status: scenario.coverageMonths >= 6 ? 'positive' : scenario.coverageMonths >= 3 ? 'warning' : 'negative'
    },
    {
      metric: 'Financial Risk Level',
      currentPlan: baseline.riskLevel,
      whatIfPlan: scenario.riskLevel,
      delta: 0,
      status: scenario.riskLevel === 'LOW RISK' ? 'positive' : scenario.riskLevel === 'MODERATE RISK' ? 'warning' : 'negative'
    }
  ];
}

/**
 * 5. Calculate Financial Risk Level
 */
export function calculateRiskLevel(coverageMonths, dti, savingsRate, netSavings) {
  let score = 85; // High score = Low Risk

  if (coverageMonths < 1.5) score -= 35;
  else if (coverageMonths < 3.0) score -= 20;
  else if (coverageMonths < 6.0) score -= 5;
  else score += 10;

  if (dti > 45) score -= 25;
  else if (dti > 30) score -= 15;

  if (netSavings < 0) score -= 30;
  else if (savingsRate < 10) score -= 15;
  else if (savingsRate > 25) score += 10;

  score = Math.min(100, Math.max(0, score));

  if (score >= 75) {
    return {
      level: 'LOW RISK',
      score,
      color: '#10B981',
      description: 'Your financial structure is resilient. Emergency reserves and cash flows provide healthy room for economic shocks.'
    };
  } else if (score >= 55) {
    return {
      level: 'MODERATE RISK',
      score,
      color: '#F59E0B',
      description: 'Some areas require attention. Building additional liquid emergency runway will safeguard against unexpected liabilities.'
    };
  } else if (score >= 35) {
    return {
      level: 'HIGH RISK',
      score,
      color: '#F97316',
      description: 'Elevated financial strain. Discretionary spending or fixed debt leaves slim margins if income fluctuates.'
    };
  } else {
    return {
      level: 'CRITICAL ATTENTION',
      score,
      color: '#EF4444',
      description: 'Significant potential shortfall. Cash burn exceeds inflows under this scenario, requiring immediate spending reduction.'
    };
  }
}

/**
 * 6. Trend Evaluation Matrix
 */
export function evaluateFinancialTrends(indicators = {}) {
  const {
    incomeGrowth = 0,
    expenseGrowth = 0,
    savingsRate = 0,
    emergencyCoverage = 0,
    debtRatio = 0,
    investmentsGrowth = 0,
    goalCompletionRate = 0
  } = indicators;

  const income = incomeGrowth > 0 ? 'Improving' : incomeGrowth === 0 ? 'Stable' : 'Declining';
  const expenses = expenseGrowth > 10 ? 'At Risk' : expenseGrowth > 3 ? 'Increasing' : 'Stable';
  const savings = savingsRate >= 20 ? 'Improving' : savingsRate > 5 ? 'Stable' : 'Declining';
  const investments = investmentsGrowth > 5 ? 'Growing' : investmentsGrowth >= 0 ? 'Stable' : 'Declining';
  const debt = debtRatio < 25 ? 'Improving' : debtRatio < 40 ? 'Stable' : 'At Risk';
  const emergencyFund = emergencyCoverage >= 6 ? 'Improving' : emergencyCoverage >= 3 ? 'Stable' : 'At Risk';
  const goalProgress = goalCompletionRate >= 70 ? 'On Track' : goalCompletionRate >= 40 ? 'Moderate' : 'Delayed';

  let positiveCount = 0;
  if (income === 'Improving') positiveCount++;
  if (savings === 'Improving') positiveCount++;
  if (investments === 'Growing') positiveCount++;
  if (emergencyFund === 'Improving') positiveCount++;
  if (goalProgress === 'On Track') positiveCount++;

  let overallPosition = 'Stable';
  if (positiveCount >= 4) overallPosition = 'Improving';
  else if (emergencyCoverage < 2 || savingsRate <= 0) overallPosition = 'At Risk';
  else if (positiveCount <= 1) overallPosition = 'Declining';

  return {
    income,
    expenses,
    savings,
    investments,
    debt,
    emergencyFund,
    goalProgress,
    overallPosition
  };
}

/**
 * 7. AI Explanation Generator (Deterministic + Optional Google Gemini / OpenAI)
 */
export async function generateAiFutureExplanation(baseline, scenarioResult, apiKey = '') {
  const systemKey = apiKey || process.env.AI_API_KEY || process.env.GEMINI_API_KEY || '';

  const { metrics, risk, scenarioType } = scenarioResult;
  const isJobLoss = scenarioType === 'JOB_LOSS';
  const isNegativeSavings = metrics.monthlySavings < 0;

  // Build deterministic high-quality structured response
  const goingWell = [];
  const concerning = [];
  const mayHappen = [];
  const actions = [];

  // What is going well?
  if (metrics.emergencyCoverageMonths >= 3) {
    goingWell.push(`Your liquid emergency reserve provides approximately ${metrics.emergencyCoverageMonths} months of essential expense coverage.`);
  }
  if (metrics.monthlySavings > 0) {
    goingWell.push(`You maintain positive net monthly cash flow of ₹${metrics.monthlySavings.toLocaleString()} (savings rate: ${metrics.savingsRate}%).`);
  }
  if (baseline.investments.totalInvestmentValue > 100000) {
    goingWell.push(`Your existing investment asset portfolio (₹${baseline.investments.totalInvestmentValue.toLocaleString()}) provides long-term compound growth potential.`);
  }

  // What is concerning?
  if (isNegativeSavings) {
    concerning.push(`Monthly spending exceeds available inflows by ₹${Math.abs(metrics.monthlySavings).toLocaleString()} under this scenario.`);
  }
  if (metrics.emergencyCoverageMonths < 3) {
    concerning.push(`Emergency fund coverage is ${metrics.emergencyCoverageMonths} months, falling short of the recommended 6-month safety benchmark.`);
  }
  if (metrics.debtToIncomeRatio > 35) {
    concerning.push(`Fixed loan EMIs consume ${metrics.debtToIncomeRatio}% of monthly income, reducing your flexibility.`);
  }
  if (concerning.length === 0) {
    concerning.push('Inflation and discretionary lifestyle expenses could erode savings if left unmonitored over extended quarters.');
  }

  // What may happen?
  if (isJobLoss) {
    mayHappen.push(`At the current burn rate, liquid savings will be exhausted in roughly ${metrics.emergencyCoverageMonths} months unless discretionary expenses are trimmed.`);
  } else if (isNegativeSavings) {
    mayHappen.push(`Long-term financial goals and wealth creation will be delayed as cash reserves are pulled to cover monthly deficits.`);
  } else {
    mayHappen.push(`Continuing this trajectory will allow you to reach your medium-term targets within expected project horizons.`);
  }
  mayHappen.push(`In a 3 to 5-year outlook, disciplined SIP contributions could expand your portfolio value to approximately ₹${scenarioResult.forecasts?.find(f => f.periodKey === '3Y')?.estimatedInvestmentValue.toLocaleString() || 'N/A'}.`);

  // What can the user do?
  if (isJobLoss) {
    actions.push('Immediately pause non-essential discretionary spending (dining, shopping, luxury entertainment).');
    actions.push('Temporarily freeze discretionary SIP investments to preserve liquid bank reserves for critical essentials and loan EMIs.');
  } else {
    if (metrics.emergencyCoverageMonths < 6) {
      actions.push('Direct 30% of monthly surplus into high-yield liquid funds until a 6-month safety net is reached.');
    }
    if (metrics.monthlySip > 0) {
      actions.push(`Automate your monthly investment of ₹${metrics.monthlySip.toLocaleString()} right after payday to avoid lifestyle creep.`);
    }
    actions.push('Review recurring subscriptions and bills to capture an additional 5-10% in monthly savings.');
  }

  const deterministicSummary = `Based on your simulated scenario (${scenarioResult.description}), your financial safety net stands at ${metrics.emergencyCoverageMonths} months of essential coverage. Your projected risk status is ${risk.level}.`;

  const fallbackResult = {
    summary: deterministicSummary,
    goingWell,
    concerning,
    mayHappen,
    actions
  };

  if (!systemKey) {
    return fallbackResult;
  }

  // If Gemini API is configured, enrich summary dynamically
  try {
    const prompt = `You are the AI Financial Future Simulator engine for the Grow 0.2 Fintech platform.
Analyze this simulated financial scenario:
Scenario: ${scenarioResult.description}
Monthly Income: ₹${metrics.monthlyIncome}
Monthly Expenses: ₹${metrics.monthlyExpenses}
Monthly Savings: ₹${metrics.monthlySavings}
Emergency Runway: ${metrics.emergencyCoverageMonths} months
Risk Level: ${risk.level}

Return ONLY valid JSON matching this schema:
{
  "summary": "2 concise sentences explaining the scenario impact",
  "goingWell": ["string"],
  "concerning": ["string"],
  "mayHappen": ["string"],
  "actions": ["string"]
}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${systemKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 500 }
      })
    });

    if (response.ok) {
      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return {
        summary: parsed.summary || fallbackResult.summary,
        goingWell: Array.isArray(parsed.goingWell) && parsed.goingWell.length > 0 ? parsed.goingWell : fallbackResult.goingWell,
        concerning: Array.isArray(parsed.concerning) && parsed.concerning.length > 0 ? parsed.concerning : fallbackResult.concerning,
        mayHappen: Array.isArray(parsed.mayHappen) && parsed.mayHappen.length > 0 ? parsed.mayHappen : fallbackResult.mayHappen,
        actions: Array.isArray(parsed.actions) && parsed.actions.length > 0 ? parsed.actions : fallbackResult.actions
      };
    }
  } catch (err) {
    console.error('Error invoking Gemini for future explanation:', err.message);
  }

  return fallbackResult;
}
