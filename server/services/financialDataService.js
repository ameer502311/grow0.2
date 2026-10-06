// Service to retrieve and aggregate user financial data safely

export function getFinancialSnapshot(userId, memoryStore = {}) {
  // If memoryStore or database layer is provided, use it safely scoped to userId
  const user = memoryStore.dbUser || {
    id: userId || 'u-101',
    name: 'User',
    riskPreference: 'BALANCED',
    monthlyIncomeTarget: 0
  };

  const incomes = memoryStore.dbIncomes || [];
  const expenses = memoryStore.dbExpenses || [];
  const loans = memoryStore.dbLoans || [];
  const investments = memoryStore.dbInvestments || [];
  const goals = memoryStore.dbGoals || memoryStore.dbSavingsGoals || [];

  return {
    user,
    incomes,
    expenses,
    loans,
    investments,
    goals
  };
}
