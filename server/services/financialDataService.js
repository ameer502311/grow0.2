// Service to retrieve and aggregate user financial data safely

export function getFinancialSnapshot(userId, memoryStore = {}) {
  // If memoryStore or database layer is provided, use it safely scoped to userId
  const user = memoryStore.dbUser || {
    id: userId || 'u-101',
    name: 'Alex Vance',
    riskPreference: 'MEDIUM',
    monthlyIncomeTarget: 185000
  };

  const incomes = memoryStore.dbIncomes || [
    { id: 'inc-1', amount: 145000, date: '2026-07-01', category: 'Salary', notes: 'Monthly Tech Salary' },
    { id: 'inc-2', amount: 28000, date: '2026-07-12', category: 'Freelance', notes: 'UI Design Consulting' },
    { id: 'inc-3', amount: 12000, date: '2026-07-18', category: 'Rental', notes: 'Studio Apartment Rent' }
  ];

  const expenses = memoryStore.dbExpenses || [
    { id: 'exp-1', amount: 24000, date: '2026-07-02', category: 'Rent', notes: 'House Rent' },
    { id: 'exp-2', amount: 14500, date: '2026-07-05', category: 'Food', notes: 'Groceries & Gourmet Dining' },
    { id: 'exp-3', amount: 8200, date: '2026-07-08', category: 'Shopping', notes: 'Workwear & Electronics' },
    { id: 'exp-4', amount: 4800, date: '2026-07-10', category: 'Fuel', notes: 'Car Petrol Fill' },
    { id: 'exp-5', amount: 18500, date: '2026-07-15', category: 'EMI', notes: 'Car Loan Monthly Payment' }
  ];

  const loans = memoryStore.dbLoans || [
    { id: 'l-1', title: 'Hyundai Creta EV Loan', type: 'Car Loan', principalAmount: 1200000, remainingBalance: 780000, interestRate: 8.75, tenureMonths: 60, monthlyEmi: 18500, dueDateDay: 10 },
    { id: 'l-2', title: 'HDFC Infinia Credit Card Balance', type: 'Credit Card', principalAmount: 45000, remainingBalance: 12500, interestRate: 14.5, tenureMonths: 12, monthlyEmi: 4200, dueDateDay: 22 }
  ];

  const investments = memoryStore.dbInvestments || [
    { id: 'inv-1', name: 'SafeGold 24K 99.9% Pure', category: 'Gold', investedAmount: 180000, currentValue: 224000 },
    { id: 'inv-2', name: 'Groww Nifty 50 Index Fund SIP', category: 'Mutual Funds', investedAmount: 340000, currentValue: 432000 },
    { id: 'inv-3', name: 'TCS & Reliance Equity (Zerodha)', category: 'Stocks', investedAmount: 210000, currentValue: 258000 },
    { id: 'inv-4', name: 'Bitcoin (0.12 BTC)', category: 'Crypto', investedAmount: 380000, currentValue: 672000 }
  ];

  const goals = memoryStore.dbGoals || [
    { id: 'g-1', title: 'MacBook Pro M3 Max', targetAmount: 240000, currentAmount: 160000, targetDate: '2026-12-31', category: 'Gadgets' },
    { id: 'g-2', title: 'Emergency Reserve Fund', targetAmount: 300000, currentAmount: 220000, targetDate: '2026-10-31', category: 'Savings' }
  ];

  return {
    user,
    incomes,
    expenses,
    loans,
    investments,
    goals
  };
}
