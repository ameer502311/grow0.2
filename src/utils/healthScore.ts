import { FinancialHealth, IncomeItem, ExpenseItem, InvestmentAsset, LoanItem, BudgetGoal } from '../types';

export function computeFinancialHealth(
  incomes: IncomeItem[],
  expenses: ExpenseItem[],
  investments: InvestmentAsset[],
  loans: LoanItem[],
  budgets: BudgetGoal[]
): FinancialHealth {
  const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0) || 1;
  const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalInvested = investments.reduce((acc, curr) => acc + curr.currentValue, 0);
  const totalEmi = loans.reduce((acc, curr) => acc + curr.monthlyEmi, 0);

  // 1. Savings Ratio (30% weight)
  const savings = Math.max(0, totalIncome - totalExpense);
  const savingsRatio = Math.min(100, Math.round((savings / totalIncome) * 100));
  let savingsPoints = Math.min(30, (savingsRatio / 30) * 30); // 30% savings gets max points

  // 2. Debt Ratio (20% weight) - Lower is better
  const debtRatio = Math.min(100, Math.round((totalEmi / totalIncome) * 100));
  let debtPoints = 20;
  if (debtRatio > 40) debtPoints = 5;
  else if (debtRatio > 25) debtPoints = 12;
  else if (debtRatio > 10) debtPoints = 17;

  // 3. Investment Ratio (20% weight)
  const investmentRatio = Math.min(100, Math.round((totalInvested / (totalIncome * 12)) * 100));
  let investmentPoints = Math.min(20, (investmentRatio / 50) * 20);

  // 4. Emergency Fund Months (15% weight)
  const emergencyAsset = investments.find(i => i.name.toLowerCase().includes('emergency') || i.category === 'FD');
  const emergencyFundVal = emergencyAsset ? emergencyAsset.currentValue : savings * 2;
  const emergencyFundMonths = parseFloat((emergencyFundVal / (totalExpense || 1)).toFixed(1));
  let emergencyPoints = Math.min(15, (emergencyFundMonths / 6) * 15); // 6 months gets max

  // 5. Budget Discipline (15% weight)
  let overBudgetCount = 0;
  budgets.forEach(b => {
    if (b.spentAmount > b.limitAmount) overBudgetCount++;
  });
  const budgetDiscipline = Math.max(0, 100 - overBudgetCount * 25);
  let budgetPoints = (budgetDiscipline / 100) * 15;

  const totalScore = Math.min(100, Math.round(savingsPoints + debtPoints + investmentPoints + emergencyPoints + budgetPoints));

  let rating: FinancialHealth['rating'] = 'Poor';
  if (totalScore >= 80) rating = 'Excellent';
  else if (totalScore >= 65) rating = 'Good';
  else if (totalScore >= 50) rating = 'Average';

  const recommendations: string[] = [];
  if (savingsRatio < 20) {
    recommendations.push("Increase your monthly savings rate to at least 20% of net income.");
  }
  if (debtRatio > 35) {
    recommendations.push("Your EMI burden is high (>35%). Consider prepaying high-interest personal or credit card loans.");
  }
  if (emergencyFundMonths < 6) {
    recommendations.push(`Build up your Emergency Fund. Current buffer is ${emergencyFundMonths} months (target: 6 months).`);
  }
  if (investmentRatio < 30) {
    recommendations.push("Step up monthly SIP investments in Mutual Funds or Index Funds to beat inflation.");
  }
  if (overBudgetCount > 0) {
    recommendations.push(`You breached ${overBudgetCount} budget limits this month. Review non-essential dining out and shopping.`);
  }

  return {
    score: totalScore,
    rating,
    savingsRatio,
    debtRatio,
    investmentRatio,
    emergencyFundMonths,
    budgetDiscipline,
    billPaymentHistory: 98,
    recommendations
  };
}
