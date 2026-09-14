import React, { useState, useEffect } from 'react';
import { 
  Wallet, DollarSign, ArrowUpRight, ArrowDownRight, RefreshCw, Bell, 
  Plus, Mic, Upload, Search, CheckCircle, Clock, AlertTriangle, 
  Sparkles, Calendar, ShieldCheck, PieChart, TrendingUp, CreditCard, 
  ChevronRight, HeartPulse, Lock, Zap, MessageSquare, Send, Share2, Trash2, Edit3, Calculator
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const DailyMoneyCommandCenter: React.FC = () => {
  const { user } = useApp();
  const getTodayStr = () => new Date().toISOString().slice(0, 10);

  // State Management
  const [todayData, setTodayData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lists & Actions State
  const [transactions, setTransactions] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [lending, setLending] = useState<any[]>([]);
  const [aiActions, setAiActions] = useState<any[]>([]);

  // Modals & Inputs
  const [showAddTxModal, setShowAddTxModal] = useState<'INCOME' | 'EXPENSE' | null>(null);
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('Food');
  const [txDescription, setTxDescription] = useState('');
  const [txPaymentMethod, setTxPaymentMethod] = useState('GPay / UPI');

  // Voice Input Modal
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [parsedDraft, setParsedDraft] = useState<any>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [billFilter, setBillFilter] = useState<'ALL' | 'DUE' | 'PAID'>('ALL');

  // AI Assistant Chat
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiChatHistory, setAiChatHistory] = useState<{ sender: 'user' | 'ai'; text: string }[]>([
    { sender: 'ai', text: 'Hello Alex! I am your AI Daily Money Assistant. Ask me anything about your safe daily spend, upcoming bills, or portfolio goals.' }
  ]);
  const [aiLoading, setAiLoading] = useState(false);

  // Notifications Drawer
  const [showNotifications, setShowNotifications] = useState(false);

  // WhatsApp / Share Modal
  const [shareTextModal, setShareTextModal] = useState<string | null>(null);

  // Time Greeting Calculation
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Fetch All Backend Data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [todayRes, txRes, billRes, subRes, goalRes, lendRes, aiActRes] = await Promise.all([
        fetch('http://localhost:5000/api/money/today').then(res => res.json()).catch(() => null),
        fetch('http://localhost:5000/api/transactions/today').then(res => res.json()).catch(() => null),
        fetch('http://localhost:5000/api/bills').then(res => res.json()).catch(() => null),
        fetch('http://localhost:5000/api/subscriptions').then(res => res.json()).catch(() => null),
        fetch('http://localhost:5000/api/savings-goals').then(res => res.json()).catch(() => null),
        fetch('http://localhost:5000/api/lending').then(res => res.json()).catch(() => null),
        fetch('http://localhost:5000/api/ai/daily-actions').then(res => res.json()).catch(() => null)
      ]);

      if (todayRes?.success) setTodayData(todayRes.data);
      if (txRes?.success) setTransactions(txRes.data);
      if (billRes?.success) setBills(billRes.data);
      if (subRes?.success) setSubscriptions(subRes.data);
      if (goalRes?.success) setGoals(goalRes.data);
      if (lendRes?.success) setLending(lendRes.data);
      if (aiActRes?.success) setAiActions(aiActRes.data);
    } catch (err: any) {
      console.error('Error loading Daily Money data:', err);
      setError('Data unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handlers
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(txAmount);
    if (!amt || isNaN(amt)) return;

    try {
      const res = await fetch('http://localhost:5000/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          type: showAddTxModal,
          category: txCategory,
          description: txDescription || `${showAddTxModal} Entry`,
          payment_method: txPaymentMethod
        })
      }).then(r => r.json());

      if (res.success) {
        setShowAddTxModal(null);
        setTxAmount('');
        setTxDescription('');
        fetchData();
      }
    } catch (err) {
      alert('Failed to add transaction');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await fetch(`http://localhost:5000/api/transactions/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      alert('Error deleting transaction');
    }
  };

  // Voice Parser Helper
  const handleParseVoiceText = () => {
    const text = voiceText.toLowerCase();
    const match = text.match(/(\d+)/);
    const amt = match ? parseInt(match[0], 10) : 250;
    
    let cat = 'Food';
    if (text.includes('travel') || text.includes('cab') || text.includes('metro') || text.includes('uber')) cat = 'Travel';
    else if (text.includes('bill') || text.includes('electricity') || text.includes('recharge')) cat = 'Bills';
    else if (text.includes('shop') || text.includes('clothes') || text.includes('amazon')) cat = 'Shopping';

    setParsedDraft({
      amount: amt,
      type: 'EXPENSE',
      category: cat,
      description: voiceText || 'Voice Expense Entry',
      payment_method: 'GPay / UPI'
    });
  };

  const handleConfirmVoiceDraft = async () => {
    if (!parsedDraft) return;
    try {
      await fetch('http://localhost:5000/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedDraft)
      });
      setShowVoiceModal(false);
      setVoiceText('');
      setParsedDraft(null);
      fetchData();
    } catch (err) {
      alert('Failed to save voice expense');
    }
  };

  const handleBillStatusToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'PAID' ? 'DUE_THIS_WEEK' : 'PAID';
    await fetch(`http://localhost:5000/api/bills/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_status: newStatus })
    });
    fetchData();
  };

  const handleAskAI = async (prompt?: string) => {
    const query = prompt || aiQuestion;
    if (!query.trim()) return;

    setAiChatHistory(prev => [...prev, { sender: 'user', text: query }]);
    setAiQuestion('');
    setAiLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query })
      }).then(r => r.json());

      if (res.success) {
        setAiChatHistory(prev => [...prev, { sender: 'ai', text: res.answer }]);
      }
    } catch (err) {
      setAiChatHistory(prev => [...prev, { sender: 'ai', text: 'Sorry, I am currently unable to process this query.' }]);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER */}
      <div className="glass-panel rounded-3xl p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 mb-1 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>{getGreeting()}, {todayData?.user_name || user?.name || 'Alex Vance'}</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Daily Money Command Center</h1>
          <p className="text-xs text-slate-400 mt-1">Everything important about your money today—in one clear dashboard.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-300 flex items-center space-x-2">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>{todayData?.date_formatted || 'Monday, 14 Sept 2026'}</span>
            <Clock className="w-3.5 h-3.5 text-cyan-400 ml-2" />
            <span>{todayData?.time_formatted || '09:30 PM'}</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Health Score: 89/100</span>
          </div>

          <button 
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            title="Refresh Money Dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4 text-cyan-400" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          </button>
        </div>
      </div>

      {/* Notifications Drawer */}
      {showNotifications && (
        <div className="glass-panel rounded-2xl p-4 bg-slate-900 border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-extrabold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" /> Daily Financial Alerts
            </h3>
            <button onClick={() => setShowNotifications(false)} className="text-xs text-slate-400 hover:text-white">Close</button>
          </div>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
              ⚡ TNEB Electricity Bill (₹850) is due today.
            </div>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
              📈 Groww Nifty 50 Index SIP of ₹15,000 scheduled for 18 Sept.
            </div>
          </div>
        </div>
      )}

      {/* 2. TODAY'S MONEY SUMMARY (8 PREMIUM CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Available Balance */}
        <div className="glass-panel rounded-2xl p-4 bg-slate-900/80 border-slate-800 space-y-2 hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Available Balance</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-black text-white font-mono">
            {todayData ? `₹${todayData.available_balance.toLocaleString()}` : <span className="text-rose-400 text-xs">Data unavailable</span>}
          </p>
          <p className="text-[10px] text-slate-400">Bank accounts & linked wallet balance</p>
        </div>

        {/* Card 2: Today's Income */}
        <div className="glass-panel rounded-2xl p-4 bg-slate-900/80 border-slate-800 space-y-2 hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Today's Income</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-black text-emerald-400 font-mono">
            {todayData ? `+₹${todayData.today_income.toLocaleString()}` : <span className="text-rose-400 text-xs">Data unavailable</span>}
          </p>
          <p className="text-[10px] text-emerald-400/80">Credits received today</p>
        </div>

        {/* Card 3: Today's Spending */}
        <div className="glass-panel rounded-2xl p-4 bg-slate-900/80 border-slate-800 space-y-2 hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Today's Spending</span>
            <ArrowDownRight className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-xl font-black text-rose-400 font-mono">
            {todayData ? `-₹${todayData.today_spending.toLocaleString()}` : <span className="text-rose-400 text-xs">Data unavailable</span>}
          </p>
          <p className="text-[10px] text-rose-400/80">Total debits & expenses today</p>
        </div>

        {/* Card 4: Today's Remaining Budget */}
        <div className="glass-panel rounded-2xl p-4 bg-slate-900/80 border-slate-800 space-y-2 hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Today's Safe Remaining</span>
            <DollarSign className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-xl font-black text-cyan-400 font-mono">
            {todayData ? `₹${todayData.today_remaining_budget.toLocaleString()}` : <span className="text-rose-400 text-xs">Data unavailable</span>}
          </p>
          <p className="text-[10px] text-slate-400">From ₹1,000 daily safe limit</p>
        </div>

        {/* Card 5: Monthly Savings */}
        <div className="glass-panel rounded-2xl p-4 bg-slate-900/80 border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Monthly Savings</span>
            <ShieldCheck className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-xl font-black text-teal-400 font-mono">
            {todayData ? `₹${todayData.monthly_savings.toLocaleString()}` : <span className="text-rose-400 text-xs">Data unavailable</span>}
          </p>
          <p className="text-[10px] text-slate-400">62.2% Monthly savings rate</p>
        </div>

        {/* Card 6: Total Investments */}
        <div className="glass-panel rounded-2xl p-4 bg-slate-900/80 border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Investments</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-black text-amber-400 font-mono">
            {todayData ? `₹${todayData.total_investments.toLocaleString()}` : <span className="text-rose-400 text-xs">Data unavailable</span>}
          </p>
          <p className="text-[10px] text-amber-400/80">Gold, Mutual Funds, Equity & Crypto</p>
        </div>

        {/* Card 7: Total Net Worth */}
        <div className="glass-panel rounded-2xl p-4 bg-slate-900/80 border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Net Worth</span>
            <PieChart className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-xl font-black text-white font-mono">
            {todayData ? `₹${todayData.total_net_worth.toLocaleString()}` : <span className="text-rose-400 text-xs">Data unavailable</span>}
          </p>
          <p className="text-[10px] text-slate-400">Assets minus liabilities</p>
        </div>

        {/* Card 8: Upcoming Payments */}
        <div className="glass-panel rounded-2xl p-4 bg-slate-900/80 border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Upcoming Payments</span>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-xl font-black text-rose-400 font-mono">
            {todayData ? `₹${todayData.upcoming_payments_amount.toLocaleString()}` : <span className="text-rose-400 text-xs">Data unavailable</span>}
          </p>
          <p className="text-[10px] text-slate-400">{todayData?.upcoming_payments_count || 0} Bills & EMIs scheduled</p>
        </div>
      </div>

      {/* 3. AI DAILY MONEY ACTIONS (WHAT SHOULD I DO TODAY?) */}
      <div className="glass-panel rounded-3xl p-5 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/50 border-indigo-500/30 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-black text-indigo-400 uppercase tracking-wider">AI Daily Assistant Recommendation</h2>
              <h3 className="text-sm font-bold text-white">WHAT SHOULD I DO TODAY?</h3>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/40">
            Real-Time Analysis Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {aiActions.map((action) => (
            <div key={action.id} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                    action.priority === 'HIGH' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
                    action.priority === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                    'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  }`}>
                    {action.priority} Priority
                  </span>
                  {action.amount && (
                    <span className="text-xs font-bold text-white font-mono">₹{action.amount.toLocaleString()}</span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-slate-100">{action.title}</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{action.explanation}</p>
              </div>

              <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs">
                <span className="text-[10px] text-indigo-400 font-semibold">{action.recommended_action}</span>
                <button 
                  onClick={() => alert(`Action executed: ${action.title}`)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] transition-all"
                >
                  Act Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. DAILY SPENDING TIMELINE & SAFE-SPENDING CALCULATOR GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Spending Timeline */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-5 bg-slate-900/80 border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" /> TODAY'S SPENDING TIMELINE
              </h3>
              <p className="text-[11px] text-slate-400">Live transaction history for today ({getTodayStr()})</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={() => setShowAddTxModal('EXPENSE')}
                className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add Expense
              </button>

              <button 
                onClick={() => setShowAddTxModal('INCOME')}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add Income
              </button>

              <button 
                onClick={() => setShowVoiceModal(true)}
                className="p-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-all"
                title="Voice Expense Entry"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Transactions Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search today's transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Timeline List */}
          <div className="space-y-3">
            {transactions.filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase())).map((tx) => (
              <div key={tx.id} className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-all">
                <div className="flex items-center space-x-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                    tx.type === 'INCOME' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {tx.type === 'INCOME' ? '+' : '-'}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-bold text-slate-100">{tx.description}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[9px] bg-slate-800 text-slate-400 font-semibold">{tx.category}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{tx.time} • {tx.payment_method}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={`text-sm font-black font-mono ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-slate-100'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                  </span>
                  <button 
                    onClick={() => handleDeleteTransaction(tx.id)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {transactions.length === 0 && (
              <div className="text-center py-6 text-xs text-slate-500">
                No transactions recorded for today yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Daily Safe-Spending Calculator */}
        <div className="glass-panel rounded-3xl p-5 bg-slate-900/80 border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-cyan-400" /> SAFE-SPENDING CALCULATOR
              </h3>
              <p className="text-[11px] text-slate-400">Smart budget formula for remaining days</p>
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-slate-950 to-cyan-950/30 border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Today's Safe Limit:</span>
                <span className="font-mono font-black text-cyan-400 text-base">₹{todayData?.safe_daily_limit?.toLocaleString() || 1000}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Today's Actual Spending:</span>
                <span className="font-mono font-bold text-rose-400">₹{todayData?.today_spending?.toLocaleString() || 0}</span>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-300 font-bold">Remaining Budget Today:</span>
                <span className="font-mono font-black text-emerald-400 text-sm">₹{todayData?.today_remaining_budget?.toLocaleString() || 0}</span>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Monthly Net Income:</span>
                <span className="font-mono text-slate-200">₹1,85,000</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Fixed Monthly Expenses:</span>
                <span className="font-mono text-slate-200">-₹48,500</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Monthly Savings Target:</span>
                <span className="font-mono text-slate-200">-₹30,000</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Upcoming Bills Scheduled:</span>
                <span className="font-mono text-slate-200">-₹20,549</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-400 leading-relaxed">
            💡 <strong className="text-slate-200">Calculation Formula:</strong> (Monthly Income - Fixed Expenses - Savings Target - Upcoming Bills) / Remaining Days ({todayData?.remaining_days || 16} days).
          </div>
        </div>
      </div>

      {/* 5. UPCOMING BILLS & EMI */}
      <div className="glass-panel rounded-3xl p-5 bg-slate-900/80 border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> UPCOMING PAYMENTS & BILL REMINDERS
            </h3>
            <p className="text-[11px] text-slate-400">Utility bills, subscriptions, credit card & loan EMIs</p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => alert('Add new bill payment trigger')}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add Bill Payment
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {bills.map((bill) => (
            <div key={bill.id} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-extrabold uppercase text-amber-400">{bill.category}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    bill.payment_status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {bill.payment_status}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white">{bill.name}</h4>
                <p className="text-lg font-black text-white font-mono mt-1">₹{bill.amount.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400 mt-1">Due Date: <strong className="text-slate-200">{bill.due_date}</strong></p>
              </div>

              <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
                <button 
                  onClick={() => handleBillStatusToggle(bill.id, bill.payment_status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    bill.payment_status === 'PAID' ? 'bg-slate-800 text-slate-400' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  }`}
                >
                  {bill.payment_status === 'PAID' ? 'Mark Unpaid' : 'Mark as Paid'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. SUBSCRIPTION MANAGER & SAVINGS GOALS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscriptions */}
        <div className="glass-panel rounded-3xl p-5 bg-slate-900/80 border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-400" /> SUBSCRIPTION MANAGER
              </h3>
              <p className="text-[11px] text-slate-400">Recurring apps, streaming & services</p>
            </div>
            <span className="text-xs font-bold text-indigo-400 font-mono">
              ₹{subscriptions.reduce((s, item) => s + item.cost, 0).toLocaleString()}/mo
            </span>
          </div>

          <div className="space-y-2.5">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">{sub.name}</h4>
                  <p className="text-[10px] text-slate-400">Next billing: {sub.next_billing_date} • {sub.payment_method}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-white font-mono">₹{sub.cost}/{sub.billing_frequency === 'YEARLY' ? 'yr' : 'mo'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Savings Goals */}
        <div className="glass-panel rounded-3xl p-5 bg-slate-900/80 border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> MY SAVINGS GOALS
              </h3>
              <p className="text-[11px] text-slate-400">Vaults & big target milestones</p>
            </div>
          </div>

          <div className="space-y-3">
            {goals.map((g) => {
              const remaining = Math.max(0, g.target_amount - g.current_saved);
              const pct = Math.min(100, Math.round((g.current_saved / g.target_amount) * 100));

              return (
                <div key={g.id} className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <h4 className="font-bold text-white">{g.name}</h4>
                    <span className="font-mono text-emerald-400 font-bold">{pct}%</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${pct}%` }} />
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Saved: ₹{g.current_saved.toLocaleString()}</span>
                    <span>Target: ₹{g.target_amount.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 7. LEND AND BORROW TRACKER */}
      <div className="glass-panel rounded-3xl p-5 bg-slate-900/80 border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-cyan-400" /> LEND & BORROW TRACKER
            </h3>
            <p className="text-[11px] text-slate-400">Track money lent to friends or borrowed</p>
          </div>

          <button 
            onClick={() => alert('Add lending/borrowing record')}
            className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add Record
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lending.map((item) => (
            <div key={item.id} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                  item.type === 'LENT' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {item.type === 'LENT' ? 'Money Lent (Receivable)' : 'Money Borrowed (Payable)'}
                </span>
                <h4 className="text-xs font-bold text-white mt-1">{item.person_name}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">{item.notes} • Due: {item.due_date || 'N/A'}</p>
              </div>

              <div className="text-right space-y-1">
                <p className="text-sm font-black font-mono text-white">₹{item.amount.toLocaleString()}</p>
                <button 
                  onClick={() => setShareTextModal(`Hi ${item.person_name}, gentle reminder regarding payment of ₹${item.amount.toLocaleString()} for ${item.notes}. Thank you!`)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-[10px] font-bold flex items-center gap-1"
                >
                  <Share2 className="w-3 h-3" /> Share Reminder
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Share Reminder Modal */}
      {shareTextModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-6 bg-slate-900 border-slate-800 max-w-md w-full space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Share2 className="w-4 h-4 text-cyan-400" /> Share Manual Reminder
            </h3>
            <p className="text-xs text-slate-400">Copy or share text directly with your contact:</p>
            <textarea 
              readOnly 
              value={shareTextModal}
              className="w-full h-24 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono"
            />
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShareTextModal(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300">Close</button>
              <button 
                onClick={() => { navigator.clipboard.writeText(shareTextModal); alert('Reminder text copied to clipboard!'); setShareTextModal(null); }}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
              >
                Copy Text
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. FINANCIAL HEALTH SCORE & EDUCATIONAL DISCLAIMER */}
      <div className="glass-panel rounded-3xl p-5 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border-emerald-500/30 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-emerald-400" /> EDUCATIONAL FINANCIAL HEALTH SCORE
            </h3>
            <p className="text-[11px] text-slate-400">Comprehensive analysis based on budget control, savings & investments</p>
          </div>
          <span className="text-xl font-black font-mono text-emerald-400">89 / 100</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Savings Rate</span>
            <span className="font-bold text-emerald-400">62.2% (Excellent)</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Budget Control</span>
            <span className="font-bold text-cyan-400">Safe Daily Limit OK</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Emergency Fund</span>
            <span className="font-bold text-teal-400">71.6% Completed</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Debt-to-Income</span>
            <span className="font-bold text-amber-400">12.3% Low Risk</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Bill Consistency</span>
            <span className="font-bold text-indigo-400">100% On Time</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[10px] text-slate-400 leading-relaxed">
          <strong>Educational Disclaimer:</strong> This is an educational money-management score. It is not a credit score, financial guarantee, or investment recommendation.
        </div>
      </div>

      {/* 9. AI MONEY ASSISTANT (PERMANENT BOTTOM CHAT SECTION) */}
      <div className="glass-panel rounded-3xl p-5 bg-slate-900/90 border-slate-800 space-y-4 shadow-2xl">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <MessageSquare className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-sm font-bold text-white">AI DAILY MONEY ASSISTANT</h3>
            <p className="text-[11px] text-slate-400">Ask real-time questions about your budget, bills, or savings</p>
          </div>
        </div>

        {/* Chat History */}
        <div className="space-y-3 max-h-60 overflow-y-auto p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
          {aiChatHistory.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xl p-3 rounded-2xl ${
                msg.sender === 'user' ? 'bg-indigo-600 text-white font-medium' : 'bg-slate-900 text-slate-200 border border-slate-800'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {aiLoading && <div className="text-xs text-indigo-400 animate-pulse">AI is calculating response...</div>}
        </div>

        {/* Quick Question Chips */}
        <div className="flex flex-wrap gap-2 text-[10px]">
          {[
            'What can I spend today?',
            'Where did my money go?',
            'Which bill is due next?',
            'How much do people owe me?',
            'What is my total investment?'
          ].map((chip, idx) => (
            <button 
              key={idx} 
              onClick={() => handleAskAI(chip)}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Ask: What should I do with my money today?"
            value={aiQuestion}
            onChange={(e) => setAiQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
            className="flex-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
          />
          <button 
            onClick={() => handleAskAI()}
            className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 transition-all"
          >
            <Send className="w-3.5 h-3.5" /> Ask AI
          </button>
        </div>
      </div>

      {/* ADD TRANSACTION MODAL */}
      {showAddTxModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-6 bg-slate-900 border-slate-800 max-w-md w-full space-y-4">
            <h3 className="text-sm font-bold text-white">Add {showAddTxModal === 'INCOME' ? 'Income' : 'Expense'}</h3>
            <form onSubmit={handleAddTransaction} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Amount (₹)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 500"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Category</label>
                <select 
                  value={txCategory} 
                  onChange={(e) => setTxCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                >
                  <option value="Food">Food</option>
                  <option value="Travel">Travel</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Bills">Bills</option>
                  <option value="Recharge">Recharge</option>
                  <option value="Health">Health</option>
                  <option value="Education">Education</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Investment">Investment</option>
                  <option value="Salary">Salary</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description</label>
                <input 
                  type="text" 
                  placeholder="e.g. Lunch at Bistro"
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowAddTxModal(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold">Save Transaction</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VOICE EXPENSE MODAL */}
      {showVoiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-6 bg-slate-900 border-slate-800 max-w-md w-full space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Mic className="w-4 h-4 text-indigo-400" /> Voice-Style Expense Converter
            </h3>
            <p className="text-xs text-slate-400">Speak or type voice command e.g. "I spent 250 rupees for lunch"</p>

            <input 
              type="text" 
              placeholder='e.g. "I spent 250 rupees for lunch"'
              value={voiceText}
              onChange={(e) => setVoiceText(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
            />

            <button 
              type="button" 
              onClick={handleParseVoiceText}
              className="w-full py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
            >
              Parse Voice Command
            </button>

            {parsedDraft && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <h4 className="font-bold text-indigo-400">Parsed Draft Transaction:</h4>
                <p className="text-slate-300">Amount: <strong className="text-white font-mono">₹{parsedDraft.amount}</strong></p>
                <p className="text-slate-300">Category: <strong className="text-white">{parsedDraft.category}</strong></p>
                <p className="text-slate-300">Description: <strong className="text-white">{parsedDraft.description}</strong></p>
                
                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setParsedDraft(null)} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300">Discard</button>
                  <button type="button" onClick={handleConfirmVoiceDraft} className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold">Confirm & Save</button>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button type="button" onClick={() => setShowVoiceModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
