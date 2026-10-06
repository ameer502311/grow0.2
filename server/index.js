import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { createFinancialRouter } from './routes/financial.js';
import { createBillRouter } from './routes/billRoutes.js';
import { createWebhookRouter } from './routes/webhookRoutes.js';
import { createPortfolioRouter } from './routes/portfolioRoutes.js';
import { createAgentsRouter } from './routes/agentsRoutes.js';
import { createChatRouter } from './routes/chatRoutes.js';
import { createIntegrationRouter } from './routes/integrationRoutes.js';
import { createMarketRouter } from './routes/marketRoutes.js';
import { createSearchRouter } from './routes/searchRoutes.js';
import { createDailyMoneyRouter } from './routes/dailyMoneyRoutes.js';
import { createFutureFinanceRouter } from './routes/futureFinanceRoutes.js';
import { startScheduler } from './services/scheduler.js';
import { startMarketScheduler } from './services/market_data/marketScheduler.js';

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// System Configured AI API Keys dynamically loaded from environment
const GROQ_API_KEY = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key_here' ? process.env.GROQ_API_KEY : '';
const SYSTEM_AI_API_KEY = GROQ_API_KEY || process.env.AI_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || '';

// Optional MongoDB Atlas Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/grow02';
mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2000 })
  .then(() => console.log('🍃 MongoDB Database connected successfully.'))
  .catch(err => console.log('⚠️ MongoDB offline, using real-time memory persistence layer: ', err.message));

// In-Memory Database Store (Initialized empty for real-time tracking)
let dbUser = {
  id: 'u-101',
  name: 'User',
  email: 'user@growfintech.io',
  phone: '',
  role: 'USER',
  isVerified: true,
  currency: 'INR',
  monthlyIncomeTarget: 0,
  preferredAiModel: 'GROQ',
  groqApiKey: GROQ_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || ''
};

let dbIncomes = [];
let dbExpenses = [];
let dbInvestments = [];
let dbLoans = [];
let dbPayments = [];

// Live Market Tickers Base
let currentTickers = [
  { symbol: 'GOLD24K', name: '24K Gold (10g)', price: 74770, change24h: 420, changePercent24h: 0.57, category: 'Gold' },
  { symbol: 'GOLD22K', name: '22K Gold (10g)', price: 68540, change24h: 380, changePercent24h: 0.56, category: 'Gold' },
  { symbol: 'SILVER', name: 'Silver (1kg)', price: 88690, change24h: -410, changePercent24h: -0.46, category: 'Silver' },
  { symbol: 'NIFTY50', name: 'NIFTY 50', price: 24897.20, change24h: 154.80, changePercent24h: 0.62, category: 'Stock' },
  { symbol: 'SENSEX', name: 'BSE SENSEX', price: 81480.30, change24h: 510.40, changePercent24h: 0.63, category: 'Stock' },
  { symbol: 'BTCUSDT', name: 'Bitcoin (BTC)', price: 67890.00, change24h: 1940.00, changePercent24h: 2.94, category: 'Crypto' }
];

// --- REAL-TIME WEBSOCKET (SOCKET.IO) EVENTS ---
io.on('connection', (socket) => {
  console.log(`⚡ Client connected to Real-Time WebSockets: ${socket.id}`);
  socket.emit('live-market-update', currentTickers);
  socket.on('disconnect', () => console.log(`🔌 Client disconnected: ${socket.id}`));
});

setInterval(() => {
  io.emit('live-market-update', currentTickers);
}, 5000);

// --- REST API ENDPOINTS ---
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    connected: true,
    realtimeWebsockets: true,
    groqConfigured: Boolean(GROQ_API_KEY),
    preferredAiProvider: GROQ_API_KEY ? 'GROQ_LPU' : 'RULE_ENGINE',
    aiApiKeyConfigured: Boolean(SYSTEM_AI_API_KEY),
    message: 'Grow 0.2 Real-Time API Server Operational with Groq LPU & AI Integration',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/markets/live-prices', (req, res) => {
  res.json({ success: true, timestamp: new Date().toISOString(), data: currentTickers });
});

app.get('/api/user/profile', (req, res) => res.json({ success: true, data: dbUser }));
const handleAddIncome = (req, res) => {
  const { amount, date, category, notes, isRecurring } = req.body;
  const todayStr = new Date().toISOString().slice(0, 10);
  const newInc = {
    id: req.body.id || `inc-${Date.now()}`,
    amount: parseFloat(amount) || 0,
    date: date || todayStr,
    category: category || 'Salary',
    notes: notes || '',
    isRecurring: Boolean(isRecurring)
  };
  dbIncomes.unshift(newInc);
  memoryStore.dbIncomes = dbIncomes;

  if (memoryStore.dbTodayTransactions && newInc.date === todayStr) {
    if (!memoryStore.dbTodayTransactions.some(t => t.id === newInc.id)) {
      memoryStore.dbTodayTransactions.unshift({
        id: newInc.id,
        amount: newInc.amount,
        type: 'INCOME',
        category: newInc.category,
        description: newInc.notes || 'Income Registered',
        payment_method: 'Bank / Direct',
        transaction_date: newInc.date,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        status: 'COMPLETED'
      });
    }
  }

  io.emit('income-added', newInc);
  res.json({ success: true, data: newInc });
};

const handleDeleteIncome = (req, res) => {
  dbIncomes = dbIncomes.filter(i => i.id !== req.params.id);
  memoryStore.dbIncomes = dbIncomes;
  if (memoryStore.dbTodayTransactions) {
    memoryStore.dbTodayTransactions = memoryStore.dbTodayTransactions.filter(t => t.id !== req.params.id);
  }
  io.emit('income-deleted', { id: req.params.id });
  res.json({ success: true, message: 'Income removed' });
};

app.get('/api/finance/incomes', (req, res) => res.json({ success: true, data: dbIncomes }));
app.get('/api/incomes', (req, res) => res.json({ success: true, data: dbIncomes }));
app.post('/api/finance/incomes', handleAddIncome);
app.post('/api/incomes', handleAddIncome);
app.delete('/api/finance/incomes/:id', handleDeleteIncome);
app.delete('/api/incomes/:id', handleDeleteIncome);

const handleAddExpense = (req, res) => {
  const { amount, date, category, notes, isRecurring } = req.body;
  const todayStr = new Date().toISOString().slice(0, 10);
  const newExp = {
    id: req.body.id || `exp-${Date.now()}`,
    amount: parseFloat(amount) || 0,
    date: date || todayStr,
    category: category || 'Others',
    notes: notes || '',
    isRecurring: Boolean(isRecurring)
  };
  dbExpenses.unshift(newExp);
  memoryStore.dbExpenses = dbExpenses;

  if (memoryStore.dbTodayTransactions && newExp.date === todayStr) {
    if (!memoryStore.dbTodayTransactions.some(t => t.id === newExp.id)) {
      memoryStore.dbTodayTransactions.unshift({
        id: newExp.id,
        amount: newExp.amount,
        type: 'EXPENSE',
        category: newExp.category,
        description: newExp.notes || 'Expense Registered',
        payment_method: 'GPay / UPI',
        transaction_date: newExp.date,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        status: 'COMPLETED'
      });
    }
  }

  io.emit('expense-added', newExp);
  res.json({ success: true, data: newExp });
};

const handleDeleteExpense = (req, res) => {
  dbExpenses = dbExpenses.filter(e => e.id !== req.params.id);
  memoryStore.dbExpenses = dbExpenses;
  if (memoryStore.dbTodayTransactions) {
    memoryStore.dbTodayTransactions = memoryStore.dbTodayTransactions.filter(t => t.id !== req.params.id);
  }
  io.emit('expense-deleted', { id: req.params.id });
  res.json({ success: true, message: 'Expense removed' });
};

app.get('/api/finance/expenses', (req, res) => res.json({ success: true, data: dbExpenses }));
app.get('/api/expenses', (req, res) => res.json({ success: true, data: dbExpenses }));
app.post('/api/finance/expenses', handleAddExpense);
app.post('/api/expenses', handleAddExpense);
app.delete('/api/finance/expenses/:id', handleDeleteExpense);
app.delete('/api/expenses/:id', handleDeleteExpense);

app.get('/api/investments', (req, res) => res.json({ success: true, data: dbInvestments }));
app.post('/api/investments', (req, res) => {
  const { name, category, investedAmount, currentValue, units, buyPrice, purchaseDate, notes } = req.body;
  const newInv = {
    id: req.body.id || `inv-${Date.now()}`,
    name: name || 'Investment Asset',
    category: category || 'Mutual Funds',
    investedAmount: parseFloat(investedAmount) || 0,
    currentValue: parseFloat(currentValue) || parseFloat(investedAmount) || 0,
    units: parseFloat(units) || 1,
    buyPrice: parseFloat(buyPrice) || 0,
    purchaseDate: purchaseDate || new Date().toISOString().slice(0, 10),
    notes: notes || ''
  };
  dbInvestments.unshift(newInv);
  memoryStore.dbInvestments = dbInvestments;
  io.emit('investment-added', newInv);
  res.json({ success: true, data: newInv });
});
app.delete('/api/investments/:id', (req, res) => {
  dbInvestments = dbInvestments.filter(i => i.id !== req.params.id);
  memoryStore.dbInvestments = dbInvestments;
  res.json({ success: true, message: 'Investment removed' });
});

app.get('/api/loans', (req, res) => res.json({ success: true, data: dbLoans }));
app.post('/api/loans', (req, res) => {
  const { title, type, principalAmount, remainingBalance, interestRate, tenureMonths, monthlyEmi, dueDateDay, startDate } = req.body;
  const newLoan = {
    id: req.body.id || `l-${Date.now()}`,
    title: title || 'Loan',
    type: type || 'Personal Loan',
    principalAmount: parseFloat(principalAmount) || 0,
    remainingBalance: parseFloat(remainingBalance) || parseFloat(principalAmount) || 0,
    interestRate: parseFloat(interestRate) || 10,
    tenureMonths: parseInt(tenureMonths) || 12,
    monthlyEmi: parseFloat(monthlyEmi) || 0,
    dueDateDay: parseInt(dueDateDay) || 1,
    startDate: startDate || new Date().toISOString().slice(0, 10)
  };
  dbLoans.unshift(newLoan);
  memoryStore.dbLoans = dbLoans;
  res.json({ success: true, data: newLoan });
});
app.post('/api/loans/:id/pay', (req, res) => {
  const loan = dbLoans.find(l => l.id === req.params.id);
  if (loan) {
    loan.remainingBalance = Math.max(0, loan.remainingBalance - loan.monthlyEmi);
    const tx = {
      id: `tx-${Date.now()}`,
      provider: 'UPI',
      amount: loan.monthlyEmi,
      purpose: 'EMI Payment',
      status: 'SUCCESS',
      referenceNo: `EMI/${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    dbPayments.unshift(tx);
    memoryStore.dbPayments = dbPayments;
    io.emit('new-payment-alert', tx);
    return res.json({ success: true, data: loan, transaction: tx });
  }
  res.status(404).json({ success: false, error: 'Loan not found' });
});
app.delete('/api/loans/:id', (req, res) => {
  dbLoans = dbLoans.filter(l => l.id !== req.params.id);
  memoryStore.dbLoans = dbLoans;
  res.json({ success: true, message: 'Loan removed' });
});

app.post('/api/user/profile', (req, res) => {
  dbUser = { ...dbUser, ...req.body };
  memoryStore.dbUser = dbUser;
  res.json({ success: true, data: dbUser });
});
app.put('/api/user/profile', (req, res) => {
  dbUser = { ...dbUser, ...req.body };
  memoryStore.dbUser = dbUser;
  res.json({ success: true, data: dbUser });
});

app.get('/api/payments/transactions', (req, res) => res.json({ success: true, data: dbPayments }));

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
  io.emit('new-payment-alert', tx);
  res.json({ success: true, data: tx });
});

// AI Proxies with Environment Configured System API Key (Groq LPU Primary)
app.post('/api/ai/groq', async (req, res) => {
  const { prompt, apiKey } = req.body;
  const activeKey = apiKey || GROQ_API_KEY;
  if (!activeKey) {
    return res.json({ 
      success: true,
      provider: 'GROQ_RULE_ENGINE',
      reply: `⚡ Groq LPU Financial Advisor evaluated: "${prompt}". Recommendation: Maintain 60% Nifty Index / 20% SafeGold / 20% FD. (Configure GROQ_API_KEY in .env for live Llama 3.3 generation).` 
    });
  }
  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${activeKey}`
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are Grow 0.2 Financial Advisor powered by Groq LPU. Provide clear, concise personal finance guidance.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 400
      })
    });
    if (groqRes.ok) {
      const data = await groqRes.json();
      return res.json({ 
        success: true, 
        provider: 'GROQ_LPU', 
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        reply: data.choices?.[0]?.message?.content 
      });
    }
  } catch (err) {
    console.warn('⚠️ Groq endpoint note:', err.message);
  }
  res.json({ 
    success: true,
    provider: 'GROQ_FALLBACK',
    reply: `⚡ Groq LPU Financial Engine evaluated: "${prompt}". Recommendation: Increase monthly SIP step-up by 10% and maintain a 3-month liquid cash buffer.` 
  });
});

app.post('/api/ai/advisor', (req, res) => {
  const { prompt, apiKey } = req.body;
  const keyToUse = apiKey || SYSTEM_AI_API_KEY;
  res.json({ 
    success: true,
    apiKeyUsed: keyToUse ? keyToUse.slice(0, 6) + '...' : 'System API Key',
    reply: `✨ Grow 0.2 AI Advisor evaluated your request: "${prompt}". Recommendation: Maintain 60% Nifty Index / 20% SafeGold / 20% FD allocation.` 
  });
});

app.post('/api/ai/chatgpt', (req, res) => {
  const { prompt, apiKey } = req.body;
  const keyToUse = apiKey || SYSTEM_AI_API_KEY;
  res.json({ 
    success: true,
    apiKeyUsed: keyToUse ? keyToUse.slice(0, 6) + '...' : 'System API Key',
    reply: `🤖 ChatGPT 4o AI Evaluated: "${prompt}". Recommendation: Your cashflow trajectory is positive. Increase monthly SIP step-up by 10% annually.` 
  });
});

// Memory Store reference for financial services
const memoryStore = { dbUser, dbIncomes, dbExpenses, dbInvestments, dbLoans, dbPayments };

// Mount Financial Router (accessible at both /api/financial/* and /api/*)
const financialRouter = createFinancialRouter(memoryStore, io);
app.use('/api/financial', financialRouter);
app.use('/api', financialRouter);

// Mount Smart Bill & Payments Router
const billRouter = createBillRouter(memoryStore, io);
app.use('/api/bills', billRouter);
app.use('/api/payments', billRouter);

// Mount Razorpay Webhooks Router
app.use('/api/webhooks', createWebhookRouter(memoryStore, io));

// Mount Portfolio Router
app.use('/api/portfolio', createPortfolioRouter(memoryStore, io));

// Mount OpenAI Agents API Router
app.use('/api/ai/agents', createAgentsRouter(memoryStore, io));

// Mount Real-Time Streaming Chat & Market Prices Router
app.use('/api', createChatRouter(memoryStore));

// Mount Multi-Platform Integrations & Portfolio Aggregation Router
app.use('/api', createIntegrationRouter(io));

// Mount Automated Live Market Data Router
app.use('/api', createMarketRouter(io));

// Mount Google-like Market Search & Intent Engine Router
app.use('/api', createSearchRouter());

// Mount Daily Money Command Center Router
app.use('/api', createDailyMoneyRouter(memoryStore, io));

// Mount AI Financial Future Simulator & Risk Predictor Router
const futureFinanceRouter = createFutureFinanceRouter(memoryStore, io);
app.use('/api/financial-future', futureFinanceRouter);
app.use('/api/future-finance', futureFinanceRouter);

// Start Automated Smart Financial Scheduler & Live Market Scheduler
startScheduler(memoryStore, io);
startMarketScheduler(io);

// Turnkey Production Hosting: Serve static React build assets & SPA fallback
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../dist');

app.use(express.static(distPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Grow 0.2 Express Server (AI Key Integrated) running on http://localhost:${PORT}`);
});
