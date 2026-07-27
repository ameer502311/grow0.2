export type UserRole = 'USER' | 'ADMIN';
export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';
export type AiModelProvider = 'GEMINI' | 'CHATGPT';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  isVerified: boolean;
  currency: CurrencyCode;
  monthlyIncomeTarget?: number;
  geminiApiKey?: string;
  openaiApiKey?: string;
  preferredAiModel: AiModelProvider;
}

export type IncomeCategory = 'Salary' | 'Business' | 'Freelance' | 'Rental' | 'Bonus' | 'Other Income';

export interface IncomeItem {
  id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: IncomeCategory;
  notes?: string;
  isRecurring?: boolean;
}

export type ExpenseCategory = 
  | 'Food' 
  | 'Shopping' 
  | 'Travel' 
  | 'Fuel' 
  | 'Medical' 
  | 'Education' 
  | 'Entertainment' 
  | 'Utilities' 
  | 'EMI' 
  | 'Rent' 
  | 'Insurance' 
  | 'Others';

export interface ExpenseItem {
  id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  notes?: string;
  isRecurring?: boolean;
  receiptUrl?: string;
}

export interface BudgetGoal {
  id: string;
  category: ExpenseCategory | 'Total Monthly';
  limitAmount: number;
  period: 'Monthly' | 'Weekly';
  spentAmount: number;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: 'Vacation' | 'Bike' | 'Car' | 'House' | 'Education' | 'Emergency Fund' | 'Custom';
  notes?: string;
}

export type AssetCategory = 
  | 'Gold' 
  | 'Stocks' 
  | 'Mutual Funds' 
  | 'Crypto' 
  | 'PPF' 
  | 'NPS' 
  | 'FD' 
  | 'RD' 
  | 'Real Estate' 
  | 'Bonds';

export interface InvestmentAsset {
  id: string;
  name: string;
  category: AssetCategory;
  investedAmount: number;
  currentValue: number;
  units?: number;
  buyPrice?: number;
  purchaseDate: string;
  notes?: string;
}

export interface MarketTicker {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  category: 'Gold' | 'Silver' | 'Stock' | 'Crypto' | 'Forex';
  history7d: number[];
}

export interface LoanItem {
  id: string;
  title: string;
  type: 'Home Loan' | 'Car Loan' | 'Education Loan' | 'Personal Loan' | 'Credit Card';
  principalAmount: number;
  remainingBalance: number;
  interestRate: number;
  tenureMonths: number;
  monthlyEmi: number;
  dueDateDay: number;
  startDate: string;
}

export interface FinancialHealth {
  score: number;
  rating: 'Excellent' | 'Good' | 'Average' | 'Poor';
  savingsRatio: number;
  debtRatio: number;
  investmentRatio: number;
  emergencyFundMonths: number;
  budgetDiscipline: number;
  billPaymentHistory: number;
  recommendations: string[];
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  category: 'Stock Market' | 'Gold' | 'Crypto' | 'Business' | 'RBI Updates' | 'Government Schemes' | 'Tax News' | 'Investment Tips';
  source: string;
  url: string;
  publishedAt: string;
  imageUrl?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  ipAddress: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

export type PaymentProvider = 'GPay' | 'Paytm' | 'PhonePe' | 'UPI_QR' | 'Card' | 'NetBanking';

export interface PaymentTransaction {
  id: string;
  provider: PaymentProvider;
  amount: number;
  purpose: 'Digital Gold Buy' | 'Mutual Fund SIP' | 'Goal Deposit' | 'EMI Payment' | 'Wallet Topup';
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  referenceNo: string;
  timestamp: string;
}

export interface ConnectedPlatform {
  id: string;
  name: 'Groww' | 'SafeGold / Augmont' | 'Aura Gold' | 'Zerodha' | 'INDmoney';
  category: 'Digital Gold' | 'Mutual Funds' | 'Brokerage' | 'Wealth Manager';
  isConnected: boolean;
  lastSynced: string;
  holdingsValue: number;
  logo: string;
}
