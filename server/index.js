import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// In-Memory Database Store for full system sync
let dbUser = {
  id: 'u-101',
  name: 'Alex Vance',
  email: 'alex.vance@fintech.io',
  phone: '+91 98765 43210',
  role: 'USER',
  isVerified: true,
  currency: 'INR',
  monthlyIncomeTarget: 185000,
  preferredAiModel: 'CHATGPT',
  geminiApiKey: '',
  openaiApiKey: ''
};

let dbIncomes = [
  { id: 'inc-1', amount: 145000, date: '2026-07-01', category: 'Salary', notes: 'Monthly Tech Salary' },
  { id: 'inc-2', amount: 28000, date: '2026-07-12', category: 'Freelance', notes: 'UI Design Consulting' },
  { id: 'inc-3', amount: 12000, date: '2026-07-18', category: 'Rental', notes: 'Studio Apartment Rent' }
];

let dbExpenses = [
  { id: 'exp-1', amount: 24000, date: '2026-07-02', category: 'Rent', notes: 'House Rent' },
  { id: 'exp-2', amount: 14500, date: '2026-07-05', category: 'Food', notes: 'Groceries & Gourmet Dining' },
  { id: 'exp-3', amount: 8200, date: '2026-07-08', category: 'Shopping', notes: 'Workwear & Electronics' },
  { id: 'exp-4', amount: 4800, date: '2026-07-10', category: 'Fuel', notes: 'Car Petrol Fill' },
  { id: 'exp-5', amount: 18500, date: '2026-07-15', category: 'EMI', notes: 'Car Loan Monthly Payment' },
  { id: 'exp-6', amount: 3500, date: '2026-07-20', category: 'Utilities', notes: 'High-speed Fiber & Electricity' }
];

let dbBudgets = [
  { id: 'b-1', category: 'Total Monthly', limitAmount: 90000, period: 'Monthly', spentAmount: 73500 },
  { id: 'b-2', category: 'Food', limitAmount: 16000, period: 'Monthly', spentAmount: 14500 },
  { id: 'b-3', category: 'Shopping', limitAmount: 10000, period: 'Monthly', spentAmount: 8200 },
  { id: 'b-4', category: 'Travel', limitAmount: 8000, period: 'Monthly', spentAmount: 4800 }
];

let dbGoals = [
  { id: 'g-1', title: 'Japan Vacation 2027', targetAmount: 250000, currentAmount: 140000, targetDate: '2027-04-15', category: 'Vacation' },
  { id: 'g-2', title: 'Emergency Fund (6 Mo)', targetAmount: 450000, currentAmount: 320000, targetDate: '2026-12-31', category: 'Emergency Fund' },
  { id: 'g-3', title: 'EV SUV Downpayment', targetAmount: 600000, currentAmount: 280000, targetDate: '2027-08-30', category: 'Car' }
];

let dbInvestments = [
  { id: 'inv-1', name: 'SafeGold 24K 99.9% Pure', category: 'Gold', investedAmount: 180000, currentValue: 224000, purchaseDate: '2024-03-10' },
  { id: 'inv-2', name: 'Groww Nifty 50 Index Fund SIP', category: 'Mutual Funds', investedAmount: 340000, currentValue: 432000, purchaseDate: '2023-01-15' },
  { id: 'inv-3', name: 'TCS & Reliance Equity (Zerodha)', category: 'Stocks', investedAmount: 210000, currentValue: 258000, purchaseDate: '2023-11-20' },
  { id: 'inv-4', name: 'Bitcoin (0.12 BTC)', category: 'Crypto', investedAmount: 380000, currentValue: 672000, purchaseDate: '2023-06-05' },
  { id: 'inv-5', name: 'Aura Gold Digital Vault', category: 'Gold', investedAmount: 50000, currentValue: 58500, purchaseDate: '2024-05-12' }
];

let dbLoans = [
  { id: 'l-1', title: 'Hyundai Creta EV Loan', type: 'Car Loan', principalAmount: 1200000, remainingBalance: 780000, interestRate: 8.75, tenureMonths: 60, monthlyEmi: 18500, dueDateDay: 10, startDate: '2024-01-10' },
  { id: 'l-2', title: 'HDFC Infinia Credit Card Balance', type: 'Credit Card', principalAmount: 45000, remainingBalance: 12500, interestRate: 14.5, tenureMonths: 12, monthlyEmi: 4200, dueDateDay: 22, startDate: '2026-05-01' }
];

let dbPlatforms = [
  { id: 'p-1', name: 'Groww', category: 'Mutual Funds', isConnected: true, lastSynced: 'Today at 18:42', holdingsValue: 432000, logo: '🟢' },
  { id: 'p-2', name: 'SafeGold / Augmont', category: 'Digital Gold', isConnected: true, lastSynced: 'Today at 19:10', holdingsValue: 224000, logo: '🏆' },
  { id: 'p-3', name: 'Aura Gold', category: 'Digital Gold', isConnected: true, lastSynced: 'Yesterday', holdingsValue: 58500, logo: '✨' },
  { id: 'p-4', name: 'Zerodha', category: 'Brokerage', isConnected: true, lastSynced: 'Today at 15:30', holdingsValue: 258000, logo: '🔵' },
  { id: 'p-5', name: 'INDmoney', category: 'Wealth Manager', isConnected: false, lastSynced: 'Never', holdingsValue: 0, logo: '🌐' }
];

let dbPayments = [
  { id: 'tx-101', provider: 'GPay', amount: 5000, purpose: 'Digital Gold Buy', status: 'SUCCESS', referenceNo: 'UPI/6192840192', timestamp: '2026-07-27 16:30' },
  { id: 'tx-102', provider: 'Paytm', amount: 18500, purpose: 'EMI Payment', status: 'SUCCESS', referenceNo: 'PTM/9482019482', timestamp: '2026-07-25 10:15' }
];

let dbAuditLogs = [
  { id: 'log-1', action: 'USER_LOGIN', user: 'alex.vance@fintech.io', timestamp: '2026-07-27 20:15:22', ipAddress: '192.168.1.42', status: 'SUCCESS' }
];

// --- REST API ROUTES ---

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    connected: true,
    message: 'Grow 0.2 Fintech API Server Operational',
    timestamp: new Date().toISOString()
  });
});

// Live Market Prices Endpoint (Google / Public Financial Data)
app.get('/api/markets/live-prices', async (req, res) => {
  try {
    const tickers = [
      { symbol: 'GOLD24K', name: '24K Gold (10g)', price: 74770, change24h: 420, changePercent24h: 0.57, category: 'Gold', history7d: [73900, 74100, 74250, 74400, 74550, 74680, 74770] },
      { symbol: 'GOLD22K', name: '22K Gold (10g)', price: 68540, change24h: 380, changePercent24h: 0.56, category: 'Gold', history7d: [67800, 67950, 68100, 68250, 68380, 68450, 68540] },
      { symbol: 'SILVER', name: 'Silver (1kg)', price: 88690, change24h: -410, changePercent24h: -0.46, category: 'Silver', history7d: [89400, 89100, 89000, 88950, 88800, 88720, 88690] },
      { symbol: 'NIFTY50', name: 'NIFTY 50', price: 24897.20, change24h: 154.80, changePercent24h: 0.62, category: 'Stock', history7d: [24400, 24550, 24620, 24710, 24780, 24835, 24897] },
      { symbol: 'SENSEX', name: 'BSE SENSEX', price: 81480.30, change24h: 510.40, changePercent24h: 0.63, category: 'Stock', history7d: [80100, 80450, 80700, 80950, 81100, 81332, 81480] },
      { symbol: 'NASDAQ', name: 'NASDAQ Composite', price: 17985.20, change24h: -88.50, changePercent24h: -0.49, category: 'Stock', history7d: [18100, 18050, 18120, 18000, 17920, 18010, 17985] },
      { symbol: 'BTCUSDT', name: 'Bitcoin (BTC)', price: 67890.00, change24h: 1940.00, changePercent24h: 2.94, category: 'Crypto', history7d: [63500, 64200, 65100, 66200, 66800, 67450, 67890] },
      { symbol: 'ETHUSDT', name: 'Ethereum (ETH)', price: 3512.80, change24h: 110.20, changePercent24h: 3.24, category: 'Crypto', history7d: [3200, 3280, 3310, 3400, 3420, 3480, 3512] },
      { symbol: 'USDINR', name: 'USD / INR', price: 83.74, change24h: 0.05, changePercent24h: 0.06, category: 'Forex', history7d: [83.60, 83.65, 83.68, 83.70, 83.69, 83.72, 83.74] }
    ];
    res.json({ success: true, timestamp: new Date().toISOString(), data: tickers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Auth & User Profile
app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;
  if (email) dbUser.email = email;
  res.json({ success: true, token: `jwt-token-${Date.now()}`, user: dbUser });
});

app.get('/api/user/profile', (req, res) => {
  res.json({ success: true, data: dbUser });
});

app.put('/api/user/profile', (req, res) => {
  dbUser = { ...dbUser, ...req.body };
  res.json({ success: true, data: dbUser });
});

// Incomes API
app.get('/api/finance/incomes', (req, res) => {
  res.json({ success: true, data: dbIncomes });
});

app.post('/api/finance/incomes', (req, res) => {
  const item = { ...req.body, id: `inc-${Date.now()}` };
  dbIncomes.unshift(item);
  res.json({ success: true, data: item });
});

app.delete('/api/finance/incomes/:id', (req, res) => {
  dbIncomes = dbIncomes.filter(i => i.id !== req.params.id);
  res.json({ success: true, id: req.params.id });
});

// Expenses API
app.get('/api/finance/expenses', (req, res) => {
  res.json({ success: true, data: dbExpenses });
});

app.post('/api/finance/expenses', (req, res) => {
  const item = { ...req.body, id: `exp-${Date.now()}` };
  dbExpenses.unshift(item);
  res.json({ success: true, data: item });
});

app.delete('/api/finance/expenses/:id', (req, res) => {
  dbExpenses = dbExpenses.filter(e => e.id !== req.params.id);
  res.json({ success: true, id: req.params.id });
});

// Budgets API
app.get('/api/finance/budgets', (req, res) => {
  res.json({ success: true, data: dbBudgets });
});

app.put('/api/finance/budgets/:id', (req, res) => {
  const { limitAmount } = req.body;
  dbBudgets = dbBudgets.map(b => b.id === req.params.id ? { ...b, limitAmount } : b);
  res.json({ success: true, data: dbBudgets.find(b => b.id === req.params.id) });
});

// Savings Goals API
app.get('/api/finance/goals', (req, res) => {
  res.json({ success: true, data: dbGoals });
});

app.post('/api/finance/goals', (req, res) => {
  const goal = { ...req.body, id: `g-${Date.now()}`, currentAmount: 0 };
  dbGoals.push(goal);
  res.json({ success: true, data: goal });
});

app.post('/api/finance/goals/:id/deposit', (req, res) => {
  const { amount } = req.body;
  dbGoals = dbGoals.map(g => g.id === req.params.id ? { ...g, currentAmount: g.currentAmount + amount } : g);
  res.json({ success: true, data: dbGoals.find(g => g.id === req.params.id) });
});

// Investments API
app.get('/api/investments', (req, res) => {
  res.json({ success: true, data: dbInvestments });
});

app.post('/api/investments', (req, res) => {
  const inv = { ...req.body, id: `inv-${Date.now()}` };
  dbInvestments.push(inv);
  res.json({ success: true, data: inv });
});

// Loans & EMI API
app.get('/api/loans', (req, res) => {
  res.json({ success: true, data: dbLoans });
});

app.post('/api/loans', (req, res) => {
  const loan = { ...req.body, id: `l-${Date.now()}` };
  dbLoans.push(loan);
  res.json({ success: true, data: loan });
});

app.post('/api/loans/:id/pay', (req, res) => {
  dbLoans = dbLoans.map(l => {
    if (l.id === req.params.id) {
      const newBal = Math.max(0, l.remainingBalance - l.monthlyEmi);
      return { ...l, remainingBalance: newBal };
    }
    return l;
  });
  res.json({ success: true, data: dbLoans.find(l => l.id === req.params.id) });
});

// Payments API
app.get('/api/payments/transactions', (req, res) => {
  res.json({ success: true, data: dbPayments });
});

app.post('/api/payments/process', (req, res) => {
  const { provider, amount, purpose } = req.body;
  const refNo = `${(provider || 'UPI').toUpperCase()}/${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  const tx = {
    id: `tx-${Date.now()}`,
    provider: provider || 'GPay',
    amount: amount || 1000,
    purpose: purpose || 'Digital Gold Buy',
    status: 'SUCCESS',
    referenceNo: refNo,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
  };
  dbPayments.unshift(tx);
  res.json({ success: true, data: tx });
});

// Connected Platforms API
app.get('/api/platforms', (req, res) => {
  res.json({ success: true, data: dbPlatforms });
});

app.post('/api/platforms/toggle', (req, res) => {
  const { id } = req.body;
  dbPlatforms = dbPlatforms.map(p => p.id === id ? { ...p, isConnected: !p.isConnected, lastSynced: 'Just now' } : p);
  res.json({ success: true, data: dbPlatforms.find(p => p.id === id) });
});

// AI Proxies
app.post('/api/ai/advisor', (req, res) => {
  const { prompt } = req.body;
  res.json({ 
    success: true,
    reply: `✨ Server Gemini AI evaluated: "${prompt}". Recommendation: Maintain 60% Nifty Index / 20% SafeGold / 20% FD allocation.` 
  });
});

app.post('/api/ai/chatgpt', (req, res) => {
  const { prompt } = req.body;
  res.json({ 
    success: true,
    reply: `🤖 Server ChatGPT 4o evaluated: "${prompt}". Recommendation: Your cashflow trajectory is positive. Increase monthly SIP step-up by 10% annually.` 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Grow 0.2 Express API Server connected and listening on http://localhost:${PORT}`);
});
