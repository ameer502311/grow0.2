import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { PersonalFinance } from './components/PersonalFinance';
import { Investments } from './components/Investments';
import { Calculators } from './components/Calculators';
import { AiAdvisor } from './components/AiAdvisor';
import { NewsFeed } from './components/NewsFeed';
import { EmiManager } from './components/EmiManager';
import { Reports } from './components/Reports';
import { PlatformIntegrations } from './components/PlatformIntegrations';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { SmartFeaturesModal } from './components/SmartFeaturesModal';
import { PaymentGatewayModal } from './components/PaymentGatewayModal';

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
        <div className="glass-panel rounded-3xl p-8 bg-slate-900/80 border-slate-800 text-center space-y-4 my-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-xl font-black">
            ⚠️
          </div>
          <h2 className="text-lg font-bold text-white">View Recovered</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {this.state.error?.message || "An unexpected rendering error occurred. Please click below to refresh the active tab view."}
          </p>
          <button 
            onClick={() => this.setState({ hasError: false })} 
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all"
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
  const { user, addIncome, addExpense } = useApp();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  
  // Modals state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSmartFeaturesModal, setShowSmartFeaturesModal] = useState(false);
  const [showPaymentGatewayModal, setShowPaymentGatewayModal] = useState(false);
  const [paymentModalProps, setPaymentModalProps] = useState<{ amount?: number; purpose?: any }>({});

  // Quick Add modal
  const [showQuickAddModal, setShowQuickAddModal] = useState<'income' | 'expense' | null>(null);
  const [quickAmount, setQuickAmount] = useState('');
  const [quickCategory, setQuickCategory] = useState('');
  const [quickNotes, setQuickNotes] = useState('');

  const handleOpenPayment = (amount?: number, purpose?: any) => {
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
        category: quickCategory,
        notes: quickNotes || 'Quick Add Income',
        date: new Date().toISOString().slice(0, 10)
      });
    } else {
      addExpense({
        amount: amt,
        category: quickCategory,
        notes: quickNotes || 'Quick Add Expense',
        date: new Date().toISOString().slice(0, 10)
      });
    }

    setQuickAmount('');
    setQuickCategory('');
    setQuickNotes('');
    setShowQuickAddModal(null);
  };

  return (
    <div className="min-h-screen bg-money-banking text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Header */}
      <Header 
        onOpenAuth={() => setShowAuthModal(true)} 
        onOpenSmartFeatures={() => setShowSmartFeaturesModal(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Sidebar Navigation */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Tab View Router */}
        <main className="flex-1 min-w-0">
          <ViewErrorBoundary key={activeTab}>
            {activeTab === 'dashboard' && (
              <Dashboard 
                setActiveTab={setActiveTab} 
                onOpenAddModal={(type) => setShowQuickAddModal(type)}
                onOpenSmartFeatures={() => setShowSmartFeaturesModal(true)}
              />
            )}

            {activeTab === 'personal_finance' && (
              <PersonalFinance onOpenAddModal={(type) => setShowQuickAddModal(type)} />
            )}

            {activeTab === 'investments' && (
              <Investments onOpenBuyGold={(amt) => handleOpenPayment(amt, 'Digital Gold Buy')} />
            )}

            {activeTab === 'platforms' && (
              <PlatformIntegrations onOpenPayment={(amt, purp) => handleOpenPayment(amt, purp)} />
            )}

            {activeTab === 'calculators' && <Calculators />}

            {activeTab === 'ai' && <AiAdvisor />}

            {activeTab === 'news' && <NewsFeed />}

            {activeTab === 'loans' && (
              <EmiManager onOpenPayment={(amt, purp) => handleOpenPayment(amt, purp)} />
            )}

            {activeTab === 'reports' && <Reports />}

            {activeTab === 'admin' && <AdminPanel />}
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

      {/* Quick Add Income/Expense Modal */}
      {showQuickAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-6 bg-slate-900 border-slate-800 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white capitalize">
              Add Quick {showQuickAddModal}
            </h3>
            <form onSubmit={handleQuickAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Amount</label>
                <input 
                  type="number" 
                  placeholder="e.g. 5000"
                  value={quickAmount}
                  onChange={(e) => setQuickAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold text-base focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Category</label>
                <input 
                  type="text" 
                  placeholder={showQuickAddModal === 'income' ? 'Salary, Freelance, Rental' : 'Food, Rent, Fuel, Shopping'}
                  value={quickCategory}
                  onChange={(e) => setQuickCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Notes (Optional)</label>
                <input 
                  type="text" 
                  placeholder="Details..."
                  value={quickNotes}
                  onChange={(e) => setQuickNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex space-x-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowQuickAddModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold shadow-lg shadow-amber-500/20"
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
