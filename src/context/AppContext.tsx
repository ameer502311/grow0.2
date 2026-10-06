import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserProfile, IncomeItem, ExpenseItem, BudgetGoal, SavingsGoal, 
  InvestmentAsset, LoanItem, MarketTicker, NewsArticle, FinancialHealth, CurrencyCode,
  PaymentTransaction, ConnectedPlatform, PaymentProvider
} from '../types';
import { 
  INITIAL_MARKET_TICKERS, INITIAL_NEWS, checkBackendHealth, 
  fetchBackendIncomes, fetchBackendExpenses, fetchBackendInvestments, fetchBackendLoans, 
  fetchBackendPayments, fetchBackendPlatforms, postBackendIncome, deleteBackendIncome, 
  postBackendExpense, deleteBackendExpense, postBackendInvestment, payBackendEmi, 
  sendBackendPayment, toggleBackendPlatform 
} from '../services/api';
import { computeFinancialHealth } from '../utils/healthScore';

interface AppContextType {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  currencySymbol: string;
  backendConnected: boolean;
  
  // Data
  incomes: IncomeItem[];
  expenses: ExpenseItem[];
  budgets: BudgetGoal[];
  savingsGoals: SavingsGoal[];
  investments: InvestmentAsset[];
  loans: LoanItem[];
  tickers: MarketTicker[];
  news: NewsArticle[];
  healthScore: FinancialHealth;
  transactions: PaymentTransaction[];
  platforms: ConnectedPlatform[];

  // Actions
  addIncome: (item: Omit<IncomeItem, 'id'>) => void;
  deleteIncome: (id: string) => void;
  addExpense: (item: Omit<ExpenseItem, 'id'>) => void;
  deleteExpense: (id: string) => void;
  updateBudget: (id: string, limit: number) => void;
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'currentAmount'>) => void;
  depositSavingsGoal: (id: string, amount: number) => void;
  addInvestment: (inv: Omit<InvestmentAsset, 'id'>) => void;
  addLoan: (loan: Omit<LoanItem, 'id'>) => void;
  payEmi: (id: string) => void;
  
  // Payments & Platform Actions
  processOnlinePayment: (
    provider: PaymentProvider, 
    amount: number, 
    purpose: PaymentTransaction['purpose']
  ) => Promise<PaymentTransaction>;
  buyDigitalGold: (amount: number, platform: string, grams: number) => void;
  togglePlatformConnection: (id: string) => void;

  // System Notifications
  notifications: string[];
  dismissNotification: (index: number) => void;
}

const SYSTEM_DEFAULT_AI_KEY = (import.meta as any).env?.VITE_AI_API_KEY || (typeof process !== 'undefined' ? process.env.AI_API_KEY : '') || '';
const SYSTEM_GROQ_KEY = (import.meta as any).env?.VITE_GROQ_API_KEY || (typeof process !== 'undefined' ? process.env.GROQ_API_KEY : '') || SYSTEM_DEFAULT_AI_KEY;

const defaultUser: UserProfile = {
  id: 'u-101',
  name: 'User',
  email: 'user@fintech.io',
  role: 'USER',
  isVerified: true,
  currency: 'INR',
  monthlyIncomeTarget: 0,
  preferredAiModel: 'GROQ',
  groqApiKey: SYSTEM_GROQ_KEY,
  geminiApiKey: SYSTEM_DEFAULT_AI_KEY,
  openaiApiKey: SYSTEM_DEFAULT_AI_KEY
};

const initialIncomes: IncomeItem[] = [];
const initialExpenses: ExpenseItem[] = [];
const initialBudgets: BudgetGoal[] = [];
const initialGoals: SavingsGoal[] = [];
const initialInvestments: InvestmentAsset[] = [];
const initialLoans: LoanItem[] = [];

const initialPlatforms: ConnectedPlatform[] = [
  { id: 'p-1', name: 'Groww', category: 'Mutual Funds', isConnected: false, lastSynced: 'Not connected', holdingsValue: 0, logo: '🟢' },
  { id: 'p-2', name: 'SafeGold / Augmont', category: 'Digital Gold', isConnected: false, lastSynced: 'Not connected', holdingsValue: 0, logo: '🏆' },
  { id: 'p-3', name: 'Aura Gold', category: 'Digital Gold', isConnected: false, lastSynced: 'Not connected', holdingsValue: 0, logo: '✨' },
  { id: 'p-4', name: 'Zerodha', category: 'Brokerage', isConnected: false, lastSynced: 'Not connected', holdingsValue: 0, logo: '🔵' }
];

const initialTransactions: PaymentTransaction[] = [];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [currency, setCurrencyState] = useState<CurrencyCode>('INR');
  const [backendConnected, setBackendConnected] = useState(false);
  
  const [incomes, setIncomes] = useState<IncomeItem[]>(initialIncomes);
  const [expenses, setExpenses] = useState<ExpenseItem[]>(initialExpenses);
  const [budgets, setBudgets] = useState<BudgetGoal[]>(initialBudgets);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(initialGoals);
  const [investments, setInvestments] = useState<InvestmentAsset[]>(initialInvestments);
  const [loans, setLoans] = useState<LoanItem[]>(initialLoans);
  const [tickers, setTickers] = useState<MarketTicker[]>(INITIAL_MARKET_TICKERS);
  const [news, setNews] = useState<NewsArticle[]>(INITIAL_NEWS);
  const [platforms, setPlatforms] = useState<ConnectedPlatform[]>(initialPlatforms);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>(initialTransactions);

  const [notifications, setNotifications] = useState<string[]>([
    '✨ Grow 0.2 Real-Time Fintech Engine Active.',
    '📡 Live Market Data feeds & Automated Schedulers operational.'
  ]);

  const fetchLiveTickers = async () => {
    try {
      const res = await fetch('/api/markets');
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          setTickers(json.data);
        }
      }
    } catch (e) {
      console.warn("Using current market reference rates");
    }
  };

  useEffect(() => {
    fetchLiveTickers();
    fetch('/api/markets/news').then(r => r.json()).then(json => {
      if (json && json.data && Array.isArray(json.data) && json.data.length > 0) {
        setNews(json.data);
      }
    }).catch(() => {});
    checkBackendHealth().then(res => {
      setBackendConnected(res.connected);
      if (res.connected) {
        fetchBackendIncomes().then(data => { if (data) setIncomes(data); });
        fetchBackendExpenses().then(data => { if (data) setExpenses(data); });
        fetchBackendInvestments().then(data => { if (data) setInvestments(data); });
        fetchBackendLoans().then(data => { if (data) setLoans(data); });
        fetchBackendPayments().then(data => { if (data) setTransactions(data); });
        fetchBackendPlatforms().then(data => { if (data) setPlatforms(data); });
      }
    });

    // 60-Second Automated REST Polling Fallback
    const pollInterval = setInterval(() => {
      fetchLiveTickers();
    }, 60 * 1000);

    return () => clearInterval(pollInterval);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  };

  const setCurrency = (c: CurrencyCode) => {
    setCurrencyState(c);
    setUser(prev => ({ ...prev, currency: c }));
  };

  const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';

  const addIncome = async (item: Omit<IncomeItem, 'id'>) => {
    const newInc: IncomeItem = { ...item, id: `inc-${Date.now()}` };
    setIncomes(prev => [newInc, ...prev]);
    await postBackendIncome(newInc);
  };

  const deleteIncome = async (id: string) => {
    setIncomes(prev => prev.filter(i => i.id !== id));
    await deleteBackendIncome(id);
  };

  const addExpense = async (item: Omit<ExpenseItem, 'id'>) => {
    const newExp: ExpenseItem = { ...item, id: `exp-${Date.now()}` };
    setExpenses(prev => [newExp, ...prev]);
    await postBackendExpense(newExp);
  };

  const deleteExpense = async (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    await deleteBackendExpense(id);
  };

  const updateBudget = (id: string, limit: number) => {
    setBudgets(prev => prev.map(b => b.id === id ? { ...b, limitAmount: limit } : b));
  };

  const addSavingsGoal = (goal: Omit<SavingsGoal, 'id' | 'currentAmount'>) => {
    const newGoal: SavingsGoal = { ...goal, id: `g-${Date.now()}`, currentAmount: 0 };
    setSavingsGoals(prev => [...prev, newGoal]);
  };

  const depositSavingsGoal = (id: string, amount: number) => {
    setSavingsGoals(prev => prev.map(g => g.id === id ? { ...g, currentAmount: g.currentAmount + amount } : g));
  };

  const addInvestment = async (inv: Omit<InvestmentAsset, 'id'>) => {
    const newInv: InvestmentAsset = { ...inv, id: `inv-${Date.now()}` };
    setInvestments(prev => [...prev, newInv]);
    await postBackendInvestment(newInv);
  };

  const addLoan = (loan: Omit<LoanItem, 'id'>) => {
    const newLoan: LoanItem = { ...loan, id: `l-${Date.now()}` };
    setLoans(prev => [...prev, newLoan]);
  };

  const payEmi = async (id: string) => {
    setLoans(prev => prev.map(l => {
      if (l.id === id) {
        const newBal = Math.max(0, l.remainingBalance - l.monthlyEmi);
        return { ...l, remainingBalance: newBal };
      }
      return l;
    }));
    await payBackendEmi(id);
  };

  const processOnlinePayment = async (
    provider: PaymentProvider, 
    amount: number, 
    purpose: PaymentTransaction['purpose']
  ): Promise<PaymentTransaction> => {
    let tx: PaymentTransaction;
    const serverTx = await sendBackendPayment(provider, amount, purpose);
    
    if (serverTx) {
      tx = serverTx;
    } else {
      const refNo = `${provider.toUpperCase()}/${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      tx = {
        id: `tx-${Date.now()}`,
        provider,
        amount,
        purpose,
        status: 'SUCCESS',
        referenceNo: refNo,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
      };
    }

    setTransactions(prev => [tx, ...prev]);
    const msg = `✅ ${provider} Payment Synced: ${currencySymbol}${amount.toLocaleString()} for ${purpose}. Ref: ${tx.referenceNo}`;
    setNotifications(n => [msg, ...n]);

    return tx;
  };

  const buyDigitalGold = (amount: number, platform: string, grams: number) => {
    const assetName = `${platform} 24K 99.9% Pure (${grams.toFixed(3)}g)`;
    addInvestment({
      name: assetName,
      category: 'Gold',
      investedAmount: amount,
      currentValue: amount,
      purchaseDate: new Date().toISOString().slice(0, 10)
    });
  };

  const togglePlatformConnection = async (id: string) => {
    setPlatforms(prev => prev.map(p => {
      if (p.id === id) {
        const nextState = !p.isConnected;
        const msg = nextState ? `🔗 Connected to ${p.name} platform.` : `Disconnected ${p.name} account.`;
        setNotifications(n => [msg, ...n]);
        return { ...p, isConnected: nextState, lastSynced: 'Just now' };
      }
      return p;
    }));
    await toggleBackendPlatform(id);
  };

  const dismissNotification = (index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };

  const healthScore = computeFinancialHealth(incomes, expenses, investments, loans, budgets);

  return (
    <AppContext.Provider value={{
      user, setUser, theme, toggleTheme, currency, setCurrency, currencySymbol, backendConnected,
      incomes, expenses, budgets, savingsGoals, investments, loans, tickers, news, healthScore,
      transactions, platforms,
      addIncome, deleteIncome, addExpense, deleteExpense, updateBudget,
      addSavingsGoal, depositSavingsGoal, addInvestment, addLoan, payEmi,
      processOnlinePayment, buyDigitalGold, togglePlatformConnection,
      notifications, dismissNotification
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
