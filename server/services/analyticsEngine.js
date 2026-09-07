// Financial Analytics Engine

export function calculateAnalytics(snapshot) {
  const { incomes = [], expenses = [], loans = [], investments = [], goals = [] } = snapshot;

  // 1. Total Income
  const totalIncome = incomes.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);

  // 2. Total Expenses
  const totalExpenses = expenses.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);

  // 3. Monthly Savings
  const monthlySavings = Math.max(0, totalIncome - totalExpenses);

  // 4. Savings Rate
  const savingsRate = totalIncome > 0 ? Math.min(100, Math.max(0, (monthlySavings / totalIncome) * 100)) : 0;

  // 5. Expense Ratio
  const expenseRatio = totalIncome > 0 ? Math.min(100, Math.max(0, (totalExpenses / totalIncome) * 100)) : 0;

  // 6. Debt Payments & Debt Ratio
  const totalMonthlyEmi = loans.reduce((acc, item) => acc + (Number(item.monthlyEmi) || 0), 0);
  const debtRatio = totalIncome > 0 ? Math.min(100, Math.max(0, (totalMonthlyEmi / totalIncome) * 100)) : 0;

  // 7. Category Breakdown
  const categoryBreakdown = {};
  expenses.forEach(exp => {
    const cat = exp.category || 'Other';
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + (Number(exp.amount) || 0);
  });

  // 8. Essential Monthly Expenses & Emergency Fund Buffer
  const essentialCategories = ['Rent', 'EMI', 'Food', 'Fuel', 'Bills', 'Healthcare'];
  const essentialExpenses = expenses
    .filter(exp => essentialCategories.includes(exp.category))
    .reduce((acc, item) => acc + (Number(item.amount) || 0), 0) + totalMonthlyEmi;

  // Liquid savings from investments (Gold + Savings + Mutual Funds liquid share)
  const totalInvestmentsValue = investments.reduce((acc, item) => acc + (Number(item.currentValue) || 0), 0);
  const estimatedLiquidSavings = monthlySavings * 3 + (totalInvestmentsValue * 0.4);

  const emergencyFundMonths = essentialExpenses > 0
    ? Number((estimatedLiquidSavings / essentialExpenses).toFixed(1))
    : 0;

  // 9. Goal Progress Calculation
  let goalScoreTotal = 0;
  if (goals.length > 0) {
    const totalGoalCompletion = goals.reduce((acc, g) => {
      const progress = g.targetAmount > 0 ? Math.min(1, g.currentAmount / g.targetAmount) : 0;
      return acc + progress;
    }, 0);
    goalScoreTotal = (totalGoalCompletion / goals.length) * 15;
  } else {
    goalScoreTotal = 10; // Default baseline if no explicit goals
  }

  // 10. Financial Health Score Components (Total = 100)
  const savingsScore = Math.min(25, savingsRate * 0.8); // max 25
  const expenseScore = Math.max(0, 20 - Math.max(0, expenseRatio - 50) * 0.4); // max 20
  const debtScore = Math.max(0, 20 - debtRatio * 0.5); // max 20
  const emergencyScore = Math.min(20, emergencyFundMonths * 3.33); // max 20
  const goalScore = Math.min(15, goalScoreTotal); // max 15

  const rawScore = Math.round(savingsScore + expenseScore + debtScore + emergencyScore + goalScore);
  const financialHealthScore = Math.min(100, Math.max(0, rawScore));

  let healthCategory = 'Needs Attention';
  if (financialHealthScore > 85) healthCategory = 'Excellent';
  else if (financialHealthScore > 70) healthCategory = 'Very Good';
  else if (financialHealthScore > 50) healthCategory = 'Good';
  else if (financialHealthScore > 30) healthCategory = 'Improving';

  return {
    totalIncome,
    totalExpenses,
    monthlySavings,
    savingsRate: Number(savingsRate.toFixed(1)),
    expenseRatio: Number(expenseRatio.toFixed(1)),
    totalMonthlyEmi,
    debtRatio: Number(debtRatio.toFixed(1)),
    categoryBreakdown,
    essentialExpenses,
    emergencyFundMonths,
    financialHealthScore,
    healthCategory,
    calculatedAt: new Date().toISOString()
  };
}
