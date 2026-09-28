import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, CheckCircle2, ShieldCheck, QrCode, CreditCard, Building2, ExternalLink
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

  const launchUpiDeepLink = (appProvider: PaymentProvider, amt: number, purp: string) => {
    const vpa = 'grow02.fintech@icici';
    const payeeName = encodeURIComponent('GROW 0.2 Fintech');
    const note = encodeURIComponent(purp || 'Payment');

    let deepLink = `upi://pay?pa=${vpa}&pn=${payeeName}&am=${amt}&tn=${note}&cu=INR`;
    if (appProvider === 'GPay') {
      deepLink = `gpay://upi/pay?pa=${vpa}&pn=${payeeName}&am=${amt}&tn=${note}&cu=INR`;
    } else if (appProvider === 'Paytm') {
      deepLink = `paytmmp://pay?pa=${vpa}&pn=${payeeName}&am=${amt}&tn=${note}&cu=INR`;
    } else if (appProvider === 'PhonePe') {
      deepLink = `phonepe://pay?pa=${vpa}&pn=${payeeName}&am=${amt}&tn=${note}&cu=INR`;
    }

    try {
      window.location.href = deepLink;
    } catch (e) {
      console.warn("UPI deep link fallback:", e);
    }
  };

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    const payAmt = parseFloat(amount);
    if (!payAmt || payAmt <= 0) return;

    setIsProcessing(true);

    if (['GPay', 'Paytm', 'PhonePe', 'UPI_QR'].includes(provider)) {
      launchUpiDeepLink(provider, payAmt, purpose);
    }

    setTimeout(async () => {
      const tx = await processOnlinePayment(provider, payAmt, purpose);
      setIsProcessing(false);
      setCompletedTx(tx);
      if (onSuccess) onSuccess(tx);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto flex items-center justify-center min-h-screen">
      <div className="relative w-full max-w-md card-surface rounded-2xl p-5 sm:p-6 shadow-2xl max-h-[85vh] overflow-y-auto my-auto space-y-4 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Secure Payment Gateway</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {completedTx ? (
          <div className="py-5 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                Payment Successful
              </span>
              <p className="text-xs text-slate-500 mt-2">
                Reference: <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{completedTx.referenceNo}</span>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-left space-y-1.5">
              <div className="flex justify-between text-slate-500">
                <span>Method:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{completedTx.provider}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Amount Paid:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{currencySymbol}{completedTx.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Purpose:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{completedTx.purpose}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Timestamp:</span>
                <span className="font-mono text-slate-600 dark:text-slate-400">{completedTx.timestamp}</span>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
            >
              Done & Return
            </button>
          </div>
        ) : (
          <form onSubmit={handlePayNow} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Select Purpose</label>
              <select 
                value={purpose}
                onChange={(e) => setPurpose(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-blue-600"
              >
                <option value="Digital Gold Buy">24K Digital Gold Buy (Insured Vault)</option>
                <option value="Mutual Fund SIP">Mutual Fund Investment (SIP)</option>
                <option value="Goal Deposit">Savings Goal Deposit</option>
                <option value="EMI Payment">Loan / Credit Card EMI Payment</option>
                <option value="Wallet Topup">GROW 0.2 Wallet Top-up</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Payment Amount ({currencySymbol})</label>
              <input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold text-base focus:outline-none focus:border-blue-600"
                required
              />
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-2 font-medium">Choose Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setProvider('GPay')}
                  className={`p-2.5 rounded-xl border text-center transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    provider === 'GPay' 
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 text-blue-700 dark:text-blue-300 font-semibold shadow-sm' 
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <span className="text-sm font-bold text-blue-600">GPay</span>
                  <span className="text-[10px]">Google Pay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider('Paytm')}
                  className={`p-2.5 rounded-xl border text-center transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    provider === 'Paytm' 
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 text-blue-700 dark:text-blue-300 font-semibold shadow-sm' 
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <span className="text-sm font-bold text-blue-600">Paytm</span>
                  <span className="text-[10px]">UPI & Wallet</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider('PhonePe')}
                  className={`p-2.5 rounded-xl border text-center transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    provider === 'PhonePe' 
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 text-blue-700 dark:text-blue-300 font-semibold shadow-sm' 
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <span className="text-sm font-bold text-purple-600">PhonePe</span>
                  <span className="text-[10px]">UPI Direct</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider('UPI_QR')}
                  className={`p-2.5 rounded-xl border text-center transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    provider === 'UPI_QR' 
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 text-blue-700 dark:text-blue-300 font-semibold shadow-sm' 
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  <span className="text-[10px]">Scan UPI QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider('Card')}
                  className={`p-2.5 rounded-xl border text-center transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    provider === 'Card' 
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 text-blue-700 dark:text-blue-300 font-semibold shadow-sm' 
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  <span className="text-[10px]">Debit / Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider('NetBanking')}
                  className={`p-2.5 rounded-xl border text-center transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    provider === 'NetBanking' 
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 text-blue-700 dark:text-blue-300 font-semibold shadow-sm' 
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  <span className="text-[10px]">NetBanking</span>
                </button>
              </div>
            </div>

            {/* UPI QR Display preview if selected */}
            {provider === 'UPI_QR' && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                <div className="w-24 h-24 mx-auto bg-white p-2 rounded-xl flex items-center justify-center border border-slate-200">
                  <QrCode className="w-20 h-20 text-slate-900" />
                </div>
                <p className="text-[11px] text-slate-500 font-mono">UPI ID: grow02.fintech@icici</p>
              </div>
            )}

            {/* Primary Action Button: Trust Blue (Section 13) */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <span>Launching {provider} Payment...</span>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" />
                  <span>Open {provider} & Pay {currencySymbol}{parseFloat(amount || '0').toLocaleString()}</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
