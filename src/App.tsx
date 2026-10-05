import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ActiveTab, IncomeCategory, ExpenseCategory, PaymentTransaction } from './types';
import { Dashboard } from './components/Dashboard';
import { PersonalFinance } from './components/PersonalFinance';
import { Investments } from './components/Investments';
import { Calculators } from './components/Calculators';
import { AiAdvisor } from './components/AiAdvisor';
import { NewsFeed } from './components/NewsFeed';
import { DailyMoneyCommandCenter } from './components/DailyMoneyCommandCenter';
import { EmiManager } from './components/EmiManager';
import { Reports } from './components/Reports';
import { PlatformIntegrations } from './components/PlatformIntegrations';
import { AdminPanel } from './components/AdminPanel';
import { SmartBillCenter } from './components/SmartBillCenter';
import { FutureFinanceSimulator } from './components/FutureFinanceSimulator';
import { AuthModal } from './components/AuthModal';
import { SmartFeaturesModal } from './components/SmartFeaturesModal';
import { PaymentGatewayModal } from './components/PaymentGatewayModal';
import { X, ArrowLeft } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ViewErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("View ErrorBoundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="card-surface rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-4 my-6">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto text-xl font-black border border-amber-200 dark:border-amber-800/60">
            ⚠️
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">View Recovered</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            {this.state.error?.message || "An unexpected rendering error occurred. Please click below to refresh the active tab view."}
          </p>
          <button 
            onClick={() => this.setState({ hasError: false })} 
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all"
          >
            Reload View
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export const App: React.FC = () => {
  const { addIncome, addExpense } = useApp();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Modals state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSmartFeaturesModal, setShowSmartFeaturesModal] = useState(false);
  const [showPaymentGatewayModal, setShowPaymentGatewayModal] = useState(false);
  const [paymentModalProps, setPaymentModalProps] = useState<{ amount?: number; purpose?: PaymentTransaction['purpose'] }>({});

  // Quick Add modal
  const [showQuickAddModal, setShowQuickAddModal] = useState<'income' | 'expense' | null>(null);
  const [quickAmount, setQuickAmount] = useState('');
  const [quickCategory, setQuickCategory] = useState('');
  const [quickNotes, setQuickNotes] = useState('');

  const handleOpenPayment = (amount?: number, purpose?: PaymentTransaction['purpose']) => {
    setPaymentModalProps({ amount, purpose });
    setShowPaymentGatewayModal(true);
  };

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(quickAmount);
    if (!amt || !quickCategory) return;

    if (showQuickAddModal === 'income') {
      addIncome({
        amount: amt,
        category: quickCategory as IncomeCategory,
        notes: quickNotes || 'Quick Add Income',
        date: new Date().toISOString().slice(0, 10)
      });
    } else {
      addExpense({
        amount: amt,
        category: quickCategory as ExpenseCategory,
        notes: quickNotes || 'Quick Add Expense',
        date: new Date().toISOString().slice(0, 10)
      });
    }

    setQuickAmount('');
    setQuickCategory('');
    setQuickNotes('');
    setShowQuickAddModal(null);
  };

  const handleExitToDashboard = () => {
    setActiveTab('dashboard');
  };

  const getPageTitle = (tab: ActiveTab) => {
    switch (tab) {
      case 'personal_finance':
      case 'finance': return 'Personal Finance & Cash Flow';
      case 'smart_bills': return 'Pay Bills & Recharge';
      case 'future_finance': return 'My Financial Future';
      case 'investments': return 'Investments & Markets';
      case 'platforms':
      case 'integrations': return 'Platform Integrations';
      case 'calculators': return 'Financial Calculators';
      case 'ai': return 'GROW AI Assistant';
      case 'news':
      case 'daily_command_center': return 'Daily Money Command Center';
      case 'market_news': return 'Market News';
      case 'loans': return 'Loans & EMI Schedule';
      case 'reports': return 'Reports & Analytics';
      case 'admin': return 'Admin Panel';
      default: return 'Financial Overview';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-500/20 selection:text-blue-900 dark:selection:text-blue-200">
      {/* Header */}
      <Header 
        onOpenAuth={() => setShowAuthModal(true)} 
        onOpenSmartFeatures={() => setShowSmartFeaturesModal(true)}
        onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)}
        isMobileMenuOpen={mobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1600px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 gap-4 lg:gap-6 pb-24 lg:pb-8">
        {/* Sidebar Navigation */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          mobileOpen={mobileMenuOpen}
          setMobileOpen={setMobileMenuOpen}
        />

        {/* Tab View Router */}
        <main className="flex-1 min-w-0">
          {/* Universal Exit Mark Header for all non-dashboard pages */}
          {activeTab !== 'dashboard' && (
            <div className="flex items-center justify-between mb-4 bg-white dark:bg-slate-850 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
              <button
                onClick={handleExitToDashboard}
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-colors cursor-pointer group"
                title="Return to Dashboard"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span>Back to Dashboard</span>
                <span className="hidden sm:inline text-slate-300 dark:text-slate-600">|</span>
                <span className="hidden sm:inline text-slate-500 dark:text-slate-400 font-normal">
                  {getPageTitle(activeTab)}
                </span>
              </button>

              <button
                onClick={handleExitToDashboard}
                className="p-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                title="Exit Page to Dashboard"
              >
                <span>Exit</span>
                <X className="w-4 h-4 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white" />
              </button>
            </div>
          )}

          <ViewErrorBoundary key={activeTab}>
            {activeTab === 'dashboard' && (
              <Dashboard 
                setActiveTab={setActiveTab} 
                onOpenAddModal={(type: 'income' | 'expense') => setShowQuickAddModal(type)}
                onOpenSmartFeatures={() => setShowSmartFeaturesModal(true)}
              />
            )}

            {(activeTab === 'personal_finance' || activeTab === 'finance') && (
              <PersonalFinance 
                onOpenAddModal={(type: 'income' | 'expense') => setShowQuickAddModal(type)} 
                onExit={handleExitToDashboard}
              />
            )}

            {activeTab === 'smart_bills' && (
              <SmartBillCenter onExit={handleExitToDashboard} />
            )}

            {activeTab === 'future_finance' && (
              <FutureFinanceSimulator onExit={handleExitToDashboard} />
            )}

            {activeTab === 'investments' && (
              <Investments 
                onOpenBuyGold={(amt: number) => handleOpenPayment(amt, 'Digital Gold Buy')} 
                onExit={handleExitToDashboard}
              />
            )}

            {(activeTab === 'platforms' || activeTab === 'integrations') && (
              <PlatformIntegrations 
                onOpenPayment={(amt?: number, purp?: PaymentTransaction['purpose']) => handleOpenPayment(amt, purp)} 
                onExit={handleExitToDashboard}
              />
            )}

            {activeTab === 'calculators' && (
              <Calculators onExit={handleExitToDashboard} />
            )}

            {activeTab === 'ai' && (
              <AiAdvisor onExit={handleExitToDashboard} />
            )}

            {(activeTab === 'news' || activeTab === 'daily_command_center') && (
              <DailyMoneyCommandCenter onExit={handleExitToDashboard} />
            )}

            {activeTab === 'market_news' && (
              <NewsFeed onExit={handleExitToDashboard} />
            )}

            {activeTab === 'loans' && (
              <EmiManager 
                onOpenPayment={(amt?: number, purp?: PaymentTransaction['purpose']) => handleOpenPayment(amt, purp)} 
                onExit={handleExitToDashboard}
              />
            )}

            {activeTab === 'reports' && (
              <Reports onExit={handleExitToDashboard} />
            )}

            {activeTab === 'admin' && (
              <AdminPanel onExit={handleExitToDashboard} />
            )}
          </ViewErrorBoundary>
        </main>
      </div>

      {/* Global Modals */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showSmartFeaturesModal && <SmartFeaturesModal onClose={() => setShowSmartFeaturesModal(false)} />}
      {showPaymentGatewayModal && (
        <PaymentGatewayModal 
          onClose={() => setShowPaymentGatewayModal(false)}
          defaultAmount={paymentModalProps.amount}
          defaultPurpose={paymentModalProps.purpose}
        />
      )}

      {/* Quick Add Income/Expense Modal with prominent Exit [X] Mark */}
      {showQuickAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-surface rounded-2xl p-6 border border-slate-200 dark:border-slate-800 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white capitalize flex items-center gap-2">
                <span className={showQuickAddModal === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}>
                  {showQuickAddModal === 'income' ? '+' : '-'}
                </span>
                Add Quick {showQuickAddModal}
              </h3>
              <button 
                onClick={() => setShowQuickAddModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Exit / Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Amount</label>
                <input 
                  type="number" 
                  placeholder="e.g. 5000"
                  value={quickAmount}
                  onChange={(e) => setQuickAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold text-base focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Category</label>
                <input 
                  type="text" 
                  placeholder={showQuickAddModal === 'income' ? 'Salary, Freelance, Rental' : 'Food, Rent, Fuel, Shopping'}
                  value={quickCategory}
                  onChange={(e) => setQuickCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">Notes (Optional)</label>
                <input 
                  type="text" 
                  placeholder="Details..."
                  value={quickNotes}
                  onChange={(e) => setQuickNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex space-x-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowQuickAddModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm transition-all cursor-pointer"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
