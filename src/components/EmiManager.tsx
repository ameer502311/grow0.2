import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CreditCard, Calendar, CheckCircle2, Plus, ShieldCheck } from 'lucide-react';
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
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 card-surface rounded-2xl p-5 sm:p-6">
        <div>
          <div className="flex items-center space-x-2 text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">
            <CreditCard className="w-4 h-4" />
            <span>Loan & Debt Management</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Loans & EMI Schedule
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Calm, clear tracking of active loan commitments, due dates, and repayment progress without anxiety.
          </p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Loan / EMI
        </button>
      </div>

      {/* Overview Cards (Neutral / Blue Base - Section 20) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card-surface rounded-2xl p-5">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Monthly EMI Obligations</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {currencySymbol}{totalEmiMonthly.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">Scheduled across {loans.length} active facilities</span>
        </div>

        <div className="card-surface rounded-2xl p-5">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Remaining Principal Balance</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {currencySymbol}{totalOutstanding.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">Amortizing repayment schedule</span>
        </div>
      </div>

      {/* Loans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loans.map((loan) => {
          const paidPct = Math.min(100, Math.round(((loan.principalAmount - loan.remainingBalance) / loan.principalAmount) * 100));
          const isCompleted = loan.remainingBalance === 0;

          return (
            <div key={loan.id} className="card-surface rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
                    {loan.type}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mt-1">{loan.title}</h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Upcoming Due Date</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                    <Calendar className="w-3 h-3" /> {loan.dueDateDay}th Monthly
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Monthly EMI</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{currencySymbol}{loan.monthlyEmi.toLocaleString()}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Remaining Balance</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{currencySymbol}{loan.remainingBalance.toLocaleString()}</span>
                </div>
              </div>

              {/* Loan Repayment Progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Paid: <strong className={isCompleted ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-300'}>{paidPct}%</strong></span>
                  <span>Interest: {loan.interestRate}% P.A.</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-blue-600'}`} 
                    style={{ width: `${paidPct}%` }} 
                  />
                </div>
              </div>

              {isCompleted ? (
                <div className="w-full py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Loan Fully Repaid</span>
                </div>
              ) : (
                <button 
                  onClick={() => handlePayEmiClick(loan)}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  Pay Monthly EMI Now
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Loan Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-surface rounded-2xl p-6 border border-slate-200 dark:border-slate-800 max-w-md w-full space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Add Loan Facility</h2>
            <form onSubmit={handleAddLoan} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Loan Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. HDFC Home Loan, Car Loan" 
                  value={loanTitle} 
                  onChange={(e) => setLoanTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Loan Type</label>
                <select 
                  value={loanType} 
                  onChange={(e) => setLoanType(e.target.value as LoanItem['type'])}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                >
                  <option value="Home Loan">Home Loan</option>
                  <option value="Car Loan">Car Loan</option>
                  <option value="Personal Loan">Personal Loan</option>
                  <option value="Education Loan">Education Loan</option>
                  <option value="Credit Card">Credit Card</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Principal ({currencySymbol})</label>
                  <input 
                    type="number" 
                    placeholder="500000" 
                    value={principal} 
                    onChange={(e) => setPrincipal(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Interest Rate %</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={rate} 
                    onChange={(e) => setRate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Tenure (Months)</label>
                  <input 
                    type="number" 
                    value={tenure} 
                    onChange={(e) => setTenure(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Monthly EMI ({currencySymbol})</label>
                  <input 
                    type="number" 
                    placeholder="15000" 
                    value={emi} 
                    onChange={(e) => setEmi(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm"
                >
                  Save Loan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
