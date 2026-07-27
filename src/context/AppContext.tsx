import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserProfile, IncomeItem, ExpenseItem, BudgetGoal, SavingsGoal, 
  InvestmentAsset, LoanItem, MarketTicker, NewsArticle, FinancialHealth, CurrencyCode,
  PaymentTransaction, ConnectedPlatform, PaymentProvider
} from '../types';
import { 
  INITIAL_MARKET_TICKERS, INITIAL_NEWS, checkBackendHealth, 
  fetchBackendIncomes, fetchBackendExpenses, fetchBackendInvestments, fetchBackendLoans, 
  fetchBackendPayments, fetchBackendPlatforms, postBackendIncome, postBackendExpense, 
  postBackendInvestment, payBackendEmi, sendBackendPayment, toggleBackendPlatform 
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

const defaultUser: UserProfile = {
  id: 'u-101',
  name: 'Alex Vance',
  email: 'alex.vance@fintech.io',
  role: 'USER',
  isVerified: true,
  currency: 'INR',
  monthlyIncomeTarget: 185000,
  preferredAiModel: 'CHATGPT',
  geminiApiKey: '',
  openaiApiKey: ''
};

const initialIncomes: IncomeItem[] = [
  { id: 'inc-1', amount: 145000, date: '2026-07-01', category: 'Salary', notes: 'Monthly Tech Salary' },
  { id: 'inc-2', amount: 28000, date: '2026-07-12', category: 'Freelance', notes: 'UI Design Consulting' },
  { id: 'inc-3', amount: 12000, date: '2026-07-18', category: 'Rental', notes: 'Studio Apartment Rent' }
];

const initialExpenses: ExpenseItem[] = [
  { id: 'exp-1', amount: 24000, date: '2026-07-02', category: 'Rent', notes: 'House Rent' },
  { id: 'exp-2', amount: 14500, date: '2026-07-05', category: 'Food', notes: 'Groceries & Gourmet Dining' },
  { id: 'exp-3', amount: 8200, date: '2026-07-08', category: 'Shopping', notes: 'Workwear & Electronics' },
  { id: 'exp-4', amount: 4800, date: '2026-07-10', category: 'Fuel', notes: 'Car Petrol Fill' },
  { id: 'exp-5', amount: 18500, date: '2026-07-15', category: 'EMI', notes: 'Car Loan Monthly Payment' }
];

const initialBudgets: BudgetGoal[] = [
  { id: 'b-1', category: 'Total Monthly', limitAmount: 90000, period: 'Monthly', spentAmount: 73500 },
  { id: 'b-2', category: 'Food', limitAmount: 16000, period: 'Monthly', spentAmount: 14500 },
  { id: 'b-3', category: 'Shopping', limitAmount: 10000, period: 'Monthly', spentAmount: 8200 },
  { id: 'b-4', category: 'Travel', limitAmount: 8000, period: 'Monthly', spentAmount: 4800 }
];

const initialGoals: SavingsGoal[] = [
  { id: 'g-1', title: 'Japan Vacation 2027', targetAmount: 250000, currentAmount: 140000, targetDate: '2027-04-15', category: 'Vacation' },
  { id: 'g-2', title: 'Emergency Fund (6 Mo)', targetAmount: 450000, currentAmount: 320000, targetDate: '2026-12-31', category: 'Emergency Fund' }
];

const initialInvestments: InvestmentAsset[] = [
  { id: 'inv-1', name: 'SafeGold 24K 99.9% Pure', category: 'Gold', investedAmount: 180000, currentValue: 224000, purchaseDate: '2024-03-10' },
  { id: 'inv-2', name: 'Groww Nifty 50 Index Fund SIP', category: 'Mutual Funds', investedAmount: 340000, currentValue: 432000, purchaseDate: '2023-01-15' },
  { id: 'inv-3', name: 'TCS & Reliance Equity (Zerodha)', category: 'Stocks', investedAmount: 210000, currentValue: 258000, purchaseDate: '2023-11-20' },
  { id: 'inv-4', name: 'Bitcoin (0.12 BTC)', category: 'Crypto', investedAmount: 380000, currentValue: 672000, purchaseDate: '2023-06-05' }
];

const initialLoans: LoanItem[] = [
  { id: 'l-1', title: 'Hyundai Creta EV Loan', type: 'Car Loan', principalAmount: 1200000, remainingBalance: 780000, interestRate: 8.75, tenureMonths: 60, monthlyEmi: 18500, dueDateDay: 10, startDate: '2024-01-10' },
  { id: 'l-2', title: 'HDFC Infinia Credit Card Balance', type: 'Credit Card', principalAmount: 45000, remainingBalance: 12500, interestRate: 14.5, tenureMonths: 12, monthlyEmi: 4200, dueDateDay: 22, startDate: '2026-05-01' }
];

const initialPlatforms: ConnectedPlatform[] = [
  { id: 'p-1', name: 'Groww', category: 'Mutual Funds', isConnected: true, lastSynced: 'Today at 18:42', holdingsValue: 432000, logo: '🟢' },
  { id: 'p-2', name: 'SafeGold / Augmont', category: 'Digital Gold', isConnected: true, lastSynced: 'Today at 19:10', holdingsValue: 224000, logo: '🏆' },
  { id: 'p-3', name: 'Aura Gold', category: 'Digital Gold', isConnected: true, lastSynced: 'Yesterday', holdingsValue: 58500, logo: '✨' },
  { id: 'p-4', name: 'Zerodha', category: 'Brokerage', isConnected: true, lastSynced: 'Today at 15:30', holdingsValue: 258000, logo: '🔵' }
];

const initialTransactions: PaymentTransaction[] = [
  { id: 'tx-101', provider: 'GPay', amount: 5000, purpose: 'Digital Gold Buy', status: 'SUCCESS', referenceNo: 'UPI/6192840192', timestamp: '2026-07-27 16:30' }
];

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
  const [news] = useState<NewsArticle[]>(INITIAL_NEWS);
  const [platforms, setPlatforms] = useState<ConnectedPlatform[]>(initialPlatforms);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>(initialTransactions);

  const [notifications, setNotifications] = useState<string[]>([
    '🌐 Express Server API connected to port 5000.',
    '💳 GPay Payment: ₹5,000 processed for 24K Digital Gold purchase.',
    '🔗 Groww Sync: Portfolio synchronized successfully (+₹12,400 returns).'
  ]);

  // Initial Sync with Express Backend API
  useEffect(() => {
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

  // Live Tickers
  useEffect(() => {
    const interval = setInterval(() => {
      setTickers(prev => prev.map(t => {
        const deltaPercent = (Math.random() - 0.48) * 0.4;
        const newPrice = Math.max(1, t.price * (1 + deltaPercent / 100));
        const newChange = t.change24h + (newPrice - t.price);
        return {
          ...t,
          price: parseFloat(newPrice.toFixed(t.price > 1000 ? 0 : 2)),
          change24h: parseFloat(newChange.toFixed(2)),
          changePercent24h: parseFloat((t.changePercent24h + deltaPercent * 0.1).toFixed(2))
        };
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const addIncome = async (item: Omit<IncomeItem, 'id'>) => {
    const newInc: IncomeItem = { ...item, id: `inc-${Date.now()}` };
    setIncomes(prev => [newInc, ...prev]);
    await postBackendIncome(newInc);
  };

  const deleteIncome = (id: string) => {
    setIncomes(prev => prev.filter(i => i.id !== id));
  };

  const addExpense = async (item: Omit<ExpenseItem, 'id'>) => {
    const newExp: ExpenseItem = { ...item, id: `exp-${Date.now()}` };
    setExpenses(prev => [newExp, ...prev]);
    await postBackendExpense(newExp);
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
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

  // Online Payment Processor & Server Sync
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
