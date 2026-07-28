import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Optional MongoDB Atlas Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/grow02';
mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2000 })
  .then(() => console.log('🍃 MongoDB Database connected successfully.'))
  .catch(err => console.log('⚠️ MongoDB offline, using real-time memory persistence layer: ', err.message));

// In-Memory Database Store
let dbUser = {
  id: 'u-101',
  name: 'Alex Vance',
  email: 'alex.vance@fintech.io',
  phone: '+91 98765 43210',
  role: 'USER',
  isVerified: true,
  currency: 'INR',
  monthlyIncomeTarget: 185000,
  preferredAiModel: 'CHATGPT'
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
  { id: 'exp-5', amount: 18500, date: '2026-07-15', category: 'EMI', notes: 'Car Loan Monthly Payment' }
];

let dbInvestments = [
  { id: 'inv-1', name: 'SafeGold 24K 99.9% Pure', category: 'Gold', investedAmount: 180000, currentValue: 224000, purchaseDate: '2024-03-10' },
  { id: 'inv-2', name: 'Groww Nifty 50 Index Fund SIP', category: 'Mutual Funds', investedAmount: 340000, currentValue: 432000, purchaseDate: '2023-01-15' },
  { id: 'inv-3', name: 'TCS & Reliance Equity (Zerodha)', category: 'Stocks', investedAmount: 210000, currentValue: 258000, purchaseDate: '2023-11-20' },
  { id: 'inv-4', name: 'Bitcoin (0.12 BTC)', category: 'Crypto', investedAmount: 380000, currentValue: 672000, purchaseDate: '2023-06-05' }
];

let dbLoans = [
  { id: 'l-1', title: 'Hyundai Creta EV Loan', type: 'Car Loan', principalAmount: 1200000, remainingBalance: 780000, interestRate: 8.75, tenureMonths: 60, monthlyEmi: 18500, dueDateDay: 10, startDate: '2024-01-10' },
  { id: 'l-2', title: 'HDFC Infinia Credit Card Balance', type: 'Credit Card', principalAmount: 45000, remainingBalance: 12500, interestRate: 14.5, tenureMonths: 12, monthlyEmi: 4200, dueDateDay: 22, startDate: '2026-05-01' }
];

let dbPayments = [
  { id: 'tx-101', provider: 'GPay', amount: 5000, purpose: 'Digital Gold Buy', status: 'SUCCESS', referenceNo: 'UPI/6192840192', timestamp: '2026-07-27 16:30' }
];

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
  
  // Emit initial state immediately on connect
  socket.emit('live-market-update', currentTickers);

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Broadcast Real-Time Market Feed Every 5 Seconds over WebSockets
setInterval(() => {
  io.emit('live-market-update', currentTickers);
}, 5000);

// --- REST API ENDPOINTS ---
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    connected: true,
    realtimeWebsockets: true,
    message: 'Grow 0.2 Real-Time API Server Operational',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/markets/live-prices', (req, res) => {
  res.json({ success: true, timestamp: new Date().toISOString(), data: currentTickers });
});

app.get('/api/user/profile', (req, res) => res.json({ success: true, data: dbUser }));
app.get('/api/finance/incomes', (req, res) => res.json({ success: true, data: dbIncomes }));
app.get('/api/finance/expenses', (req, res) => res.json({ success: true, data: dbExpenses }));
app.get('/api/investments', (req, res) => res.json({ success: true, data: dbInvestments }));
app.get('/api/loans', (req, res) => res.json({ success: true, data: dbLoans }));
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
  
  // Emit real-time WebSocket payment notification to all connected clients!
  io.emit('new-payment-alert', tx);

  res.json({ success: true, data: tx });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Grow 0.2 Real-Time Express + WebSocket Server listening on http://localhost:${PORT}`);
});
