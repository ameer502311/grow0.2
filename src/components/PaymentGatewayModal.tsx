import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, CheckCircle2, ShieldCheck, QrCode, Smartphone, CreditCard, Building2, Sparkles, ArrowRight
} from 'lucide-react';
import { PaymentProvider, PaymentTransaction } from '../types';

interface PaymentGatewayModalProps {
  onClose: () => void;
  defaultAmount?: number;
  defaultPurpose?: PaymentTransaction['purpose'];
  onSuccess?: (tx: PaymentTransaction) => void;
}

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({
  onClose,
  defaultAmount = 1000,
  defaultPurpose = 'Digital Gold Buy',
  onSuccess
}) => {
  const { processOnlinePayment, currencySymbol } = useApp();

  const [provider, setProvider] = useState<PaymentProvider>('GPay');
  const [amount, setAmount] = useState<string>(defaultAmount.toString());
  const [purpose, setPurpose] = useState<PaymentTransaction['purpose']>(defaultPurpose);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedTx, setCompletedTx] = useState<PaymentTransaction | null>(null);

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    const payAmt = parseFloat(amount);
    if (!payAmt || payAmt <= 0) return;

    setIsProcessing(true);

    setTimeout(async () => {
      const tx = await processOnlinePayment(provider, payAmt, purpose);
      setIsProcessing(false);
      setCompletedTx(tx);
      if (onSuccess) onSuccess(tx);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md p-4 sm:p-6 overflow-y-auto flex items-center justify-center min-h-screen">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[85vh] overflow-y-auto my-auto space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-extrabold text-white">Online Payment Gateway</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {completedTx ? (
          <div className="py-6 text-center space-y-4">
            <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto animate-bounce" />
            <div>
              <h3 className="text-lg font-black text-white">Payment Successful!</h3>
              <p className="text-xs text-slate-400 mt-1">Transaction Ref: <span className="font-mono text-emerald-400 font-bold">{completedTx.referenceNo}</span></p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-left space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>Paid via:</span>
                <span className="font-bold text-white">{completedTx.provider}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Amount Paid:</span>
                <span className="font-bold text-emerald-400">{currencySymbol}{completedTx.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Purpose:</span>
                <span className="font-semibold text-slate-200">{completedTx.purpose}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Timestamp:</span>
                <span className="font-mono text-slate-400">{completedTx.timestamp}</span>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/20"
            >
              Done & Return to Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handlePayNow} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Select Purpose</label>
              <select 
                value={purpose}
                onChange={(e) => setPurpose(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-semibold"
              >
                <option value="Digital Gold Buy">24K Digital Gold Buy (Augmont / SafeGold / Aura)</option>
                <option value="Mutual Fund SIP">Mutual Fund SIP (Groww Execution)</option>
                <option value="Goal Deposit">Savings Goal Deposit</option>
                <option value="EMI Payment">Loan / Credit Card EMI Payment</option>
                <option value="Wallet Topup">Grow 0.2 Wallet Top-up</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Payment Amount ({currencySymbol})</label>
              <input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold text-base focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-slate-400 mb-2 font-semibold">Choose Payment Platform</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setProvider('GPay')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all flex flex-col items-center justify-center gap-1 ${provider === 'GPay' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                >
                  <span className="text-base font-black text-blue-400">G Pay</span>
                  <span className="text-[10px]">Google Pay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider('Paytm')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all flex flex-col items-center justify-center gap-1 ${provider === 'Paytm' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                >
                  <span className="text-base font-black text-cyan-400">Paytm</span>
                  <span className="text-[10px]">UPI & Wallet</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider('PhonePe')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all flex flex-col items-center justify-center gap-1 ${provider === 'PhonePe' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                >
                  <span className="text-base font-black text-purple-400">PhonePe</span>
                  <span className="text-[10px]">UPI Direct</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider('UPI_QR')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all flex flex-col items-center justify-center gap-1 ${provider === 'UPI_QR' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                >
                  <QrCode className="w-5 h-5 text-amber-400" />
                  <span className="text-[10px]">Scan UPI QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider('Card')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all flex flex-col items-center justify-center gap-1 ${provider === 'Card' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                >
                  <CreditCard className="w-5 h-5 text-indigo-400" />
                  <span className="text-[10px]">Cards / Debit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider('NetBanking')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all flex flex-col items-center justify-center gap-1 ${provider === 'NetBanking' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                >
                  <Building2 className="w-5 h-5 text-slate-300" />
                  <span className="text-[10px]">NetBanking</span>
                </button>
              </div>
            </div>

            {/* UPI QR Display preview if selected */}
            {provider === 'UPI_QR' && (
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
                <div className="w-28 h-28 mx-auto bg-white p-2 rounded-xl flex items-center justify-center">
                  <QrCode className="w-24 h-24 text-slate-900" />
                </div>
                <p className="text-[11px] text-slate-400 font-mono">UPI ID: grow02.fintech@icici</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <span>Connecting to {provider} Gateway...</span>
              ) : (
                <>
                  <span>Proceed to Pay {currencySymbol}{parseFloat(amount || '0').toLocaleString()} via {provider}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
