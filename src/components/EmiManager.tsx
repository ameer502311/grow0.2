import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CreditCard, Calendar, CheckCircle2, AlertCircle, Plus, ShieldCheck } from 'lucide-react';
import { LoanItem, PaymentTransaction } from '../types';

export interface EmiManagerProps {
  onOpenPayment?: (amount?: number, purpose?: PaymentTransaction['purpose']) => void;
}

export const EmiManager: React.FC<EmiManagerProps> = ({ onOpenPayment }) => {
  const { loans, payEmi, addLoan, currencySymbol } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);

  const [loanTitle, setLoanTitle] = useState('');
  const [loanType, setLoanType] = useState<LoanItem['type']>('Personal Loan');
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('10.5');
  const [tenure, setTenure] = useState('36');
  const [emi, setEmi] = useState('');

  const totalEmiMonthly = loans.reduce((acc, curr) => acc + curr.monthlyEmi, 0);
  const totalOutstanding = loans.reduce((acc, curr) => acc + curr.remainingBalance, 0);

  const handleAddLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanTitle || !principal || !emi) return;

    addLoan({
      title: loanTitle,
      type: loanType,
      principalAmount: Number(principal),
      remainingBalance: Number(principal),
      interestRate: Number(rate),
      tenureMonths: Number(tenure),
      monthlyEmi: Number(emi),
      dueDateDay: 5,
      startDate: new Date().toISOString().slice(0, 10)
    });

    setLoanTitle('');
    setPrincipal('');
    setEmi('');
    setShowAddModal(false);
  };

  const handlePayEmiClick = (loan: LoanItem) => {
    if (onOpenPayment) {
      onOpenPayment(loan.monthlyEmi, 'EMI Payment');
    } else {
      payEmi(loan.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel rounded-3xl p-5 bg-slate-900/60 border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-rose-400" /> EMI & Loan Debt Manager
          </h1>
          <p className="text-xs text-slate-400">Track active Home, Car, Personal loans & Credit Cards, due dates and EMI schedules.</p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Loan / EMI
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-panel rounded-2xl p-5 bg-slate-900/60 border-slate-800">
          <span className="text-xs text-slate-400 font-semibold">Total Monthly EMI Obligations</span>
          <p className="text-2xl font-black text-rose-400 mt-1">{currencySymbol}{totalEmiMonthly.toLocaleString()}</p>
        </div>

        <div className="glass-panel rounded-2xl p-5 bg-slate-900/60 border-slate-800">
          <span className="text-xs text-slate-400 font-semibold">Total Remaining Principal Balance</span>
          <p className="text-2xl font-black text-white mt-1">{currencySymbol}{totalOutstanding.toLocaleString()}</p>
        </div>
      </div>

      {/* Loans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loans.map((loan) => {
          const paidPct = Math.min(100, Math.round(((loan.principalAmount - loan.remainingBalance) / loan.principalAmount) * 100));

          return (
            <div key={loan.id} className="glass-panel glass-card-hover rounded-3xl p-5 bg-slate-900/60 border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {loan.type}
                  </span>
                  <h3 className="font-extrabold text-base text-white mt-1">{loan.title}</h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Due Day</span>
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {loan.dueDateDay}th Monthly
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Monthly EMI</span>
                  <span className="font-bold text-rose-400">{currencySymbol}{loan.monthlyEmi.toLocaleString()}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Remaining Balance</span>
                  <span className="font-bold text-slate-100">{currencySymbol}{loan.remainingBalance.toLocaleString()}</span>
                </div>
              </div>

              {/* Loan Progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Paid: {paidPct}%</span>
                  <span>Rate: {loan.interestRate}% P.A.</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full" style={{ width: `${paidPct}%` }} />
                </div>
              </div>

              <button 
                onClick={() => handlePayEmiClick(loan)}
                disabled={loan.remainingBalance === 0}
                className="w-full py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all disabled:opacity-40"
              >
                {loan.remainingBalance === 0 ? '✓ Fully Paid Off' : 'Pay Monthly EMI Now'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Loan Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-6 bg-slate-900 border-slate-800 max-w-md w-full space-y-4">
            <h2 className="text-lg font-bold text-white">Add Loan / Debt Obligation</h2>
            <form onSubmit={handleAddLoan} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Loan Title</label>
                <input type="text" placeholder="e.g. Home Loan, HDFC Credit Card" value={loanTitle} onChange={(e) => setLoanTitle(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200" required />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Principal Amount ({currencySymbol})</label>
                <input type="number" placeholder="500000" value={principal} onChange={(e) => setPrincipal(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200" required />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Monthly EMI ({currencySymbol})</label>
                <input type="number" placeholder="12500" value={emi} onChange={(e) => setEmi(e.target.value)} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200" required />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-rose-500 text-white font-bold">Add Loan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
