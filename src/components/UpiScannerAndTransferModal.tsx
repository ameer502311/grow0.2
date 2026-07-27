import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  QrCode, Smartphone, Send, ScanLine, X, CheckCircle2, ArrowRight, ShieldCheck, UserCheck, Copy, Check
} from 'lucide-react';
import { PaymentProvider } from '../types';

interface UpiScannerAndTransferModalProps {
  onClose: () => void;
}

export const UpiScannerAndTransferModal: React.FC<UpiScannerAndTransferModalProps> = ({ onClose }) => {
  const { processOnlinePayment, currencySymbol } = useApp();
  const [activeTab, setActiveTab] = useState<'qr_scan' | 'phone_transfer' | 'my_qr'>('qr_scan');

  // Phone Transfer State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [payeeName, setPayeeName] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [selectedApp, setSelectedApp] = useState<PaymentProvider>('GPay');

  // QR Scanner Simulation State
  const [scannedUpiId, setScannedUpiId] = useState('');
  const [scannedMerchant, setScannedMerchant] = useState('');
  const [scanAmount, setScanAmount] = useState('500');
  const [isScanning, setIsScanning] = useState(false);

  // Status
  const [paymentSuccess, setPaymentSuccess] = useState<any>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const sampleContacts = [
    { name: 'Rohan Sharma', phone: '+91 98765 43210', upi: 'rohansharma@okicici' },
    { name: 'Priya Patel', phone: '+91 91234 56789', upi: 'priyapatel@paytm' },
    { name: 'Karan Verma', phone: '+91 99887 76655', upi: 'karanverma@ybl' },
    { name: 'Deepa Gupta', phone: '+91 95544 33221', upi: 'deepagupta@gpay' }
  ];

  const handleSimulateQrScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScannedUpiId('starbucks.coffee@icici');
      setScannedMerchant('Starbucks India Private Limited');
      setScanAmount('480');
    }, 1800);
  };

  const handleExecutePhoneTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transferAmount);
    if (!amt || (!phoneNumber && !payeeName)) return;

    const purposeText = `Send Money to ${payeeName || phoneNumber}`;
    const tx = await processOnlinePayment(selectedApp, amt, purposeText as any);
    setPaymentSuccess(tx);
  };

  const handleExecuteScanPayment = async () => {
    const amt = parseFloat(scanAmount);
    if (!amt || !scannedUpiId) return;

    const tx = await processOnlinePayment('UPI_QR', amt, `QR Pay to ${scannedMerchant}` as any);
    setPaymentSuccess(tx);
  };

  const handleCopyUpiId = () => {
    navigator.clipboard.writeText('alex.vance@grow02');
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md p-4 sm:p-6 overflow-y-auto flex items-center justify-center min-h-screen">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[85vh] overflow-y-auto my-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-extrabold text-white">UPI QR Scanner & Phone Pay</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button 
            onClick={() => { setActiveTab('qr_scan'); setPaymentSuccess(null); }}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === 'qr_scan' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400'}`}
          >
            <ScanLine className="w-4 h-4" /> Scan QR
          </button>

          <button 
            onClick={() => { setActiveTab('phone_transfer'); setPaymentSuccess(null); }}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === 'phone_transfer' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400'}`}
          >
            <Smartphone className="w-4 h-4" /> Pay Mobile
          </button>

          <button 
            onClick={() => { setActiveTab('my_qr'); setPaymentSuccess(null); }}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === 'my_qr' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400'}`}
          >
            <QrCode className="w-4 h-4" /> My QR
          </button>
        </div>

        {/* PAYMENT SUCCESS SCREEN */}
        {paymentSuccess ? (
          <div className="py-4 text-center space-y-4">
            <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto animate-bounce" />
            <div>
              <h3 className="text-lg font-black text-white">Payment Sent Successfully!</h3>
              <p className="text-xs text-slate-400 mt-1">Ref No: <span className="font-mono text-emerald-400 font-bold">{paymentSuccess.referenceNo}</span></p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-left space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>Paid via:</span>
                <span className="font-bold text-white">{paymentSuccess.provider}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Amount:</span>
                <span className="font-bold text-emerald-400">{currencySymbol}{paymentSuccess.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Details:</span>
                <span className="font-semibold text-slate-200">{paymentSuccess.purpose}</span>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20"
            >
              Done & Return
            </button>
          </div>
        ) : (
          <>
            {/* SCAN ANY QR CODE TAB */}
            {activeTab === 'qr_scan' && (
              <div className="space-y-4 text-xs">
                {!scannedUpiId ? (
                  <div className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 text-center bg-slate-950/60 flex flex-col items-center justify-center space-y-3">
                    <div className="w-28 h-28 relative flex items-center justify-center border-2 border-emerald-500/80 rounded-2xl overflow-hidden bg-slate-900 shadow-inner">
                      <QrCode className="w-20 h-20 text-emerald-400/70" />
                      {isScanning && <div className="absolute inset-x-0 h-1 bg-emerald-400 top-0 animate-bounce" />}
                    </div>

                    <div>
                      <p className="font-bold text-slate-200 text-xs">Point Camera at GPay / Paytm / PhonePe / BharatPe QR</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Supports all standard NPCI UPI QR codes</p>
                    </div>

                    <button 
                      onClick={handleSimulateQrScan}
                      disabled={isScanning}
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                    >
                      {isScanning ? 'Scanning QR Code...' : 'Simulate Camera QR Scan'}
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                        ✓
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{scannedMerchant}</h4>
                        <p className="text-[11px] text-slate-400 font-mono">UPI VPA: {scannedUpiId}</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Enter Payment Amount ({currencySymbol})</label>
                      <input 
                        type="number" 
                        value={scanAmount}
                        onChange={(e) => setScanAmount(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-extrabold text-base focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <button 
                      onClick={handleExecuteScanPayment}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Pay {currencySymbol}{parseFloat(scanAmount || '0').toLocaleString()} to {scannedMerchant}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* PAY TO MOBILE NUMBER TAB */}
            {activeTab === 'phone_transfer' && (
              <form onSubmit={handleExecutePhoneTransfer} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1.5 font-semibold">Quick Recent Contacts</label>
                  <div className="grid grid-cols-2 gap-2">
                    {sampleContacts.map((c) => (
                      <button
                        key={c.phone}
                        type="button"
                        onClick={() => { setPhoneNumber(c.phone); setPayeeName(c.name); }}
                        className={`p-2 rounded-xl border text-left transition-all ${phoneNumber === c.phone ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900'}`}
                      >
                        <p className="font-bold text-slate-200">{c.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{c.phone}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Enter Mobile Phone Number</label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="+91 98765 43210 or Name" 
                      value={phoneNumber} 
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Transfer Amount ({currencySymbol})</label>
                  <input 
                    type="number" 
                    placeholder="1000" 
                    value={transferAmount} 
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-extrabold text-base focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Send via App Intent</label>
                  <div className="flex space-x-2">
                    {(['GPay', 'Paytm', 'PhonePe'] as const).map(app => (
                      <button 
                        key={app}
                        type="button"
                        onClick={() => setSelectedApp(app)}
                        className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${selectedApp === app ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                      >
                        {app}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Money via {selectedApp}</span>
                </button>
              </form>
            )}

            {/* MY RECEIVE QR TAB */}
            {activeTab === 'my_qr' && (
              <div className="space-y-4 text-center py-2 text-xs">
                <div className="p-4 rounded-3xl bg-slate-950 border border-slate-800 space-y-3 max-w-xs mx-auto">
                  <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest block">Grow 0.2 Universal UPI QR</span>
                  
                  <div className="w-40 h-40 bg-white p-3 rounded-2xl mx-auto flex items-center justify-center shadow-xl">
                    <QrCode className="w-32 h-32 text-slate-950" />
                  </div>

                  <p className="font-bold text-white text-sm">Alex Vance</p>
                  <div className="flex items-center justify-center space-x-2 bg-slate-900 py-1.5 px-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300">
                    <span>alex.vance@grow02</span>
                    <button 
                      type="button" 
                      onClick={handleCopyUpiId}
                      className="text-emerald-400 hover:text-emerald-300"
                    >
                      {copiedUpi ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <p className="text-slate-400 text-[11px]">Accept payments from GPay, Paytm, PhonePe, BHIM & any Bank app directly to your account.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
