// Deterministic Rule Engine for Financial Advice

export function evaluateRules(analytics, snapshot = {}) {
  const recommendations = [];
  const { 
    savingsRate = 0, 
    debtRatio = 0, 
    emergencyFundMonths = 0, 
    categoryBreakdown = {}, 
    totalExpenses = 0,
    financialHealthScore = 0
  } = analytics;

  // RULE 1, 2, 3: Savings Rate Evaluation
  if (savingsRate < 10) {
    recommendations.push({
      title: 'Low Savings Rate Alert',
      message: `Your current savings rate is ${savingsRate}%. Consider reviewing non-essential discretionary expenses to improve monthly cashflow.`,
      category: 'SAVINGS',
      priority: 'HIGH',
      source: 'RULE_ENGINE'
    });
  } else if (savingsRate >= 10 && savingsRate < 20) {
    recommendations.push({
      title: 'Moderate Savings Progress',
      message: `You are building savings at ${savingsRate}%. Consider gradually increasing your monthly savings target as income permits.`,
      category: 'SAVINGS',
      priority: 'MEDIUM',
      source: 'RULE_ENGINE'
    });
  } else {
    recommendations.push({
      title: 'Healthy Savings Rate',
      message: `Great discipline! You maintained a healthy ${savingsRate}% savings rate. Keep allocating surplus funds to high-yield investments.`,
      category: 'POSITIVE_HABIT',
      priority: 'LOW',
      source: 'RULE_ENGINE'
    });
  }

  // RULE 4: High Shopping Spending
  const shoppingExp = categoryBreakdown['Shopping'] || 0;
  if (totalExpenses > 0 && (shoppingExp / totalExpenses) > 0.15) {
    recommendations.push({
      title: 'Shopping Expense Notice',
      message: `Shopping represents ${( (shoppingExp / totalExpenses) * 100 ).toFixed(1)}% (₹${shoppingExp.toLocaleString()}) of your monthly expenses. Setting a budget cap could save extra cash.`,
      category: 'EXPENSE',
      priority: 'MEDIUM',
      source: 'RULE_ENGINE'
    });
  }

  // RULE 5: High Food Spending
  const foodExp = categoryBreakdown['Food'] || 0;
  if (totalExpenses > 0 && (foodExp / totalExpenses) > 0.20) {
    recommendations.push({
      title: 'Food & Gourmet Dining Budget',
      message: `Food expenses represent ${( (foodExp / totalExpenses) * 100 ).toFixed(1)}% (₹${foodExp.toLocaleString()}) of your spending. Review dining out frequencies for potential savings.`,
      category: 'EXPENSE',
      priority: 'MEDIUM',
      source: 'RULE_ENGINE'
    });
  }

  // RULE 6: Debt Ratio Check
  if (debtRatio > 35) {
    recommendations.push({
      title: 'High Debt Servicing Ratio',
      message: `Debt obligations take up ${debtRatio}% of your monthly income. Consider prioritizing high-interest debt pre-payment to reduce interest load.`,
      category: 'DEBT',
      priority: 'HIGH',
      source: 'RULE_ENGINE'
    });
  } else if (debtRatio > 0 && debtRatio <= 35) {
    recommendations.push({
      title: 'Manageable Debt Ratio',
      message: `Your debt servicing ratio of ${debtRatio}% is within safe limits. Continue timely EMI payments.`,
      category: 'DEBT',
      priority: 'LOW',
      source: 'RULE_ENGINE'
    });
  }

  // RULE 7: Emergency Fund Buffer
  if (emergencyFundMonths < 3.0) {
    recommendations.push({
      title: 'Emergency Fund Buffer Recommendation',
      message: `Your estimated emergency buffer is approximately ${emergencyFundMonths} months of essential expenses. Gradually building toward a 3 to 6-month buffer is recommended.`,
      category: 'EMERGENCY_FUND',
      priority: 'HIGH',
      source: 'RULE_ENGINE'
    });
  } else {
    recommendations.push({
      title: 'Strong Liquidity Reserve',
      message: `You have an emergency reserve covering ~${emergencyFundMonths} months of essential expenses. Your short-term stability is solid.`,
      category: 'POSITIVE_HABIT',
      priority: 'LOW',
      source: 'RULE_ENGINE'
    });
  }

  // RULE 8: Overall Health Insight
  if (financialHealthScore >= 75) {
    recommendations.push({
      title: 'Excellent Financial Health',
      message: `Overall Financial Health Score is ${financialHealthScore}/100. Explore long-term wealth growth strategies in index funds and SafeGold.`,
      category: 'FINANCIAL_HEALTH',
      priority: 'LOW',
      source: 'RULE_ENGINE'
    });
  }

  return recommendations;
}
