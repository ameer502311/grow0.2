import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
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
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { SmartFeaturesModal } from './components/SmartFeaturesModal';
import { PlatformIntegrations } from './components/PlatformIntegrations';
import { PaymentGatewayModal } from './components/PaymentGatewayModal';

const AppContent: React.FC = () => {
  const { addIncome, addExpense, currencySymbol } = useApp();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  
  // Modals state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSmartModal, setShowSmartModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [addEntryModal, setAddEntryModal] = useState<'income' | 'expense' | null>(null);

  // Modal Form State
  const [entryAmount, setEntryAmount] = useState('');
  const [entryCategory, setEntryCategory] = useState<any>('Food');
  const [entryNotes, setEntryNotes] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));

  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryAmount) return;

    if (addEntryModal === 'income') {
      addIncome({
        amount: Number(entryAmount),
        date: entryDate,
        category: entryCategory || 'Salary',
        notes: entryNotes
      });
    } else {
      addExpense({
        amount: Number(entryAmount),
        date: entryDate,
        category: entryCategory || 'Food',
        notes: entryNotes
      });
    }

    setEntryAmount('');
    setEntryNotes('');
    setAddEntryModal(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <Header 
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenSmartFeatures={() => setShowSmartModal(true)}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1600px] w-full mx-auto p-4 lg:p-6 gap-6">
        {/* Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Viewport Content Area */}
        <main className="flex-1 min-w-0">
          {activeTab === 'dashboard' && (
            <Dashboard 
              setActiveTab={setActiveTab}
              onOpenAddModal={(type) => setAddEntryModal(type)}
              onOpenSmartFeatures={() => setShowSmartModal(true)}
            />
          )}

          {activeTab === 'finance' && (
            <PersonalFinance 
              onOpenAddModal={(type) => setAddEntryModal(type)}
            />
          )}

          {activeTab === 'investments' && <Investments />}
          {activeTab === 'integrations' && <PlatformIntegrations />}
          {activeTab === 'calculators' && <Calculators />}
          {activeTab === 'ai' && <AiAdvisor />}
          {activeTab === 'news' && <NewsFeed />}
          {activeTab === 'loans' && <EmiManager />}
          {activeTab === 'reports' && <Reports />}
          {activeTab === 'admin' && <AdminPanel />}
        </main>
      </div>

      {/* Auth Modal */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      {/* Voice & OCR Smart Features Modal */}
      {showSmartModal && <SmartFeaturesModal onClose={() => setShowSmartModal(false)} />}

      {/* Standalone Payment Gateway Launcher Modal */}
      {showPaymentModal && <PaymentGatewayModal onClose={() => setShowPaymentModal(false)} />}

      {/* Quick Add Income / Expense Modal */}
      {addEntryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-6 bg-slate-900 border-slate-800 max-w-md w-full space-y-4">
            <h2 className="text-lg font-bold text-white capitalize">Add {addEntryModal}</h2>
            <form onSubmit={handleCreateEntry} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Amount ({currencySymbol})</label>
                <input 
                  type="number"
                  placeholder="2500"
                  value={entryAmount}
                  onChange={(e) => setEntryAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Category</label>
                {addEntryModal === 'income' ? (
                  <select 
                    value={entryCategory} 
                    onChange={(e) => setEntryCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                  >
                    <option value="Salary">Salary</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Business">Business</option>
                    <option value="Rental">Rental</option>
                    <option value="Bonus">Bonus</option>
                    <option value="Other Income">Other Income</option>
                  </select>
                ) : (
                  <select 
                    value={entryCategory} 
                    onChange={(e) => setEntryCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                  >
                    <option value="Food">Food</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Travel">Travel</option>
                    <option value="Fuel">Fuel</option>
                    <option value="Medical">Medical</option>
                    <option value="Utilities">Utilities</option>
                    <option value="EMI">EMI</option>
                    <option value="Rent">Rent</option>
                    <option value="Entertainment">Entertainment</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Date</label>
                <input 
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Notes / Description</label>
                <input 
                  type="text"
                  placeholder="e.g. Grocery items or Project payment"
                  value={entryNotes}
                  onChange={(e) => setEntryNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setAddEntryModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={`px-4 py-2 rounded-xl text-white font-bold ${addEntryModal === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                >
                  Save {addEntryModal}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
