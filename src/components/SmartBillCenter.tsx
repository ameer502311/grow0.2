import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Zap, Droplet, Flame, Wifi, Smartphone, PhoneCall, Tv, Car, ShieldCheck, CreditCard,
  Search, CheckCircle2, AlertTriangle, Clock, Download, Printer, RefreshCw, FileText, ArrowUpRight, Lock, Check
} from 'lucide-react';
import { 
  fetchBillCategories, 
  fetchBillers, 
  fetchBillerMetadata, 
  requestBillDetails, 
  fetchRechargePlans, 
  createPaymentOrder, 
  verifyPayment, 
  fetchPaymentHistory, 
  fetchTransactionReceipt, 
  loadRazorpayCheckoutSdk 
} from '../services/billApi';
import { 
  BillerCategory, 
  BillerItem, 
  BillerMetadata, 
  BillRequestData, 
  RechargePlan, 
  BillTransactionRecord, 
  BillReceiptData 
} from '../types';
import { DynamicBillerForm } from './DynamicBillerForm';

export const SmartBillCenter: React.FC = () => {
  const { currencySymbol } = useApp();

  // Navigation & Category States
  const [categories, setCategories] = useState<BillerCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('electricity');
  
  // Biller & Dynamic Form States
  const [billers, setBillers] = useState<BillerItem[]>([]);
  const [selectedBillerId, setSelectedBillerId] = useState<string>('');
  const [billerMetadata, setBillerMetadata] = useState<BillerMetadata | null>(null);
  
  // Fetch / Plan / Manual Payment States
  const [billDetails, setBillDetails] = useState<BillRequestData | null>(null);
  const [rechargePlans, setRechargePlans] = useState<RechargePlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<RechargePlan | null>(null);
  const [customAmountInput, setCustomAmountInput] = useState<string>('');
  
  // Loading & Flow States
  const [loading, setLoading] = useState<boolean>(false);
  const [paymentProcessing, setPaymentProcessing] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'pay' | 'history'>('pay');
  const [customerParamsState, setCustomerParamsState] = useState<Record<string, string>>({});

  // History & Receipt States
  const [history, setHistory] = useState<BillTransactionRecord[]>([]);
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('');
  const [activeReceipt, setActiveReceipt] = useState<BillReceiptData | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  // Icon Mapper helper
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap': return <Zap className="w-5 h-5 text-amber-400" />;
      case 'Droplet': return <Droplet className="w-5 h-5 text-cyan-400" />;
      case 'Flame': return <Flame className="w-5 h-5 text-rose-400" />;
      case 'Wifi': return <Wifi className="w-5 h-5 text-indigo-400" />;
      case 'Smartphone': return <Smartphone className="w-5 h-5 text-emerald-400" />;
      case 'PhoneCall': return <PhoneCall className="w-5 h-5 text-teal-400" />;
      case 'Tv': return <Tv className="w-5 h-5 text-purple-400" />;
      case 'Car': return <Car className="w-5 h-5 text-blue-400" />;
      case 'ShieldCheck': return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
      case 'CreditCard': return <CreditCard className="w-5 h-5 text-amber-400" />;
      default: return <Zap className="w-5 h-5 text-amber-400" />;
    }
  };

  // Load initial Categories
  useEffect(() => {
    fetchBillCategories().then(data => {
      if (data.length > 0) {
        setCategories(data);
        setSelectedCategory(data[0].id);
      }
    });
  }, []);

  // Load Billers when Category changes
  useEffect(() => {
    if (!selectedCategory) return;
    setLoading(true);
    setBillDetails(null);
    setSelectedPlan(null);
    setBillerMetadata(null);

    fetchBillers(selectedCategory).then(bList => {
      setBillers(bList);
      if (bList.length > 0) {
        setSelectedBillerId(bList[0].id);
      } else {
        setSelectedBillerId('');
      }
      setLoading(false);
    });
  }, [selectedCategory]);

  // Load Biller Metadata when Biller changes
  useEffect(() => {
    if (!selectedBillerId) return;
    fetchBillerMetadata(selectedBillerId).then(meta => {
      setBillerMetadata(meta);
    });

    if (selectedCategory === 'mobile_recharge' || selectedCategory === 'dth') {
      fetchRechargePlans(selectedBillerId).then(plans => setRechargePlans(plans));
    } else {
      setRechargePlans([]);
    }
  }, [selectedBillerId, selectedCategory]);

  // Load Transaction History
  const refreshHistory = () => {
    fetchPaymentHistory({
      category: activeSubTab === 'history' ? undefined : undefined,
      paymentStatus: historyStatusFilter || undefined,
      search: historySearch || undefined
    }).then(res => setHistory(res));
  };

  useEffect(() => {
    if (activeSubTab === 'history') {
      refreshHistory();
    }
  }, [activeSubTab, historyStatusFilter, historySearch]);

  // Handle Biller Form Submit
  const handleBillerFormSubmit = async (formData: Record<string, string>) => {
    setCustomerParamsState(formData);
    setLoading(true);

    if (selectedCategory === 'mobile_recharge') {
      setLoading(false);
      return; // Uses recharge plan selector
    }

    const bill = await requestBillDetails(selectedBillerId, formData);
    setBillDetails(bill);
    setLoading(false);
  };

  // Initiate Razorpay Checkout Payment
  const handleInitiatePayment = async (amountToPay: number) => {
    if (!amountToPay || amountToPay <= 0) return;
    setPaymentProcessing(true);

    const sdkLoaded = await loadRazorpayCheckoutSdk();
    const custId = Object.values(customerParamsState)[0] || '1029384756';

    const orderData = await createPaymentOrder({
      amount: amountToPay,
      category: selectedCategory,
      billerId: selectedBillerId,
      billerName: billerMetadata?.billerName || selectedBillerId,
      customerIdentifier: custId,
      billRequestId: billDetails?.billRequestId
    });

    if (!orderData) {
      alert('Failed to initialize payment order. Please check backend connection.');
      setPaymentProcessing(false);
      return;
    }

    const { internalOrderId, providerOrderId, keyId, amount, transactionId } = orderData;

    // Trigger Razorpay Checkout
    const options = {
      key: keyId,
      amount: Math.round(amount * 100),
      currency: 'INR',
      name: 'Grow 0.2 Fintech Platform',
      description: `Bill Payment - ${billerMetadata?.billerName || selectedBillerId}`,
      image: 'https://cdn-icons-png.flaticon.com/512/10149/10149458.png',
      order_id: providerOrderId.startsWith('rzp_order_') && keyId.startsWith('rzp_test_mock') ? undefined : providerOrderId,
      handler: async function (response: any) {
        // Backend Verification
        const verifiedTx = await verifyPayment({
          internalOrderId,
          providerOrderId,
          providerPaymentId: response.razorpay_payment_id || `pay_mock_${Date.now()}`,
          signature: response.razorpay_signature || 'mock_signature',
          paymentMethod: 'UPI (Google Pay / PhonePe)',
          transactionId
        });

        setPaymentProcessing(false);

        if (verifiedTx) {
          alert(`🎉 Payment & Bill Submission Successful!\n\nInternal Order ID: ${verifiedTx.internalOrderId}\nPayment Status: ${verifiedTx.paymentStatus}\nBill Status: ${verifiedTx.billStatus}`);
          setBillDetails(null);
          setSelectedPlan(null);
          setActiveSubTab('history');
          refreshHistory();
        } else {
          alert('⚠️ Payment signature verification failed.');
        }
      },
      prefill: {
        name: 'Alex Vance',
        email: 'alex.vance@fintech.io',
        contact: '+91 98765 43210'
      },
      theme: {
        color: '#10b981'
      },
      modal: {
        ondismiss: function () {
          setPaymentProcessing(false);
        }
      }
    };

    if ((window as any).Razorpay && !keyId.startsWith('rzp_test_mock')) {
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } else {
      // Safe Development Fallback Handler for local testing
      setTimeout(async () => {
        const verifiedTx = await verifyPayment({
          internalOrderId,
          providerOrderId,
          providerPaymentId: `pay_mock_${Date.now()}`,
          signature: 'mock_signature',
          paymentMethod: 'UPI (Google Pay)',
          transactionId
        });

        setPaymentProcessing(false);

        if (verifiedTx) {
          alert(`✨ [TEST/MOCK PAYMENT SUCCESS]\n\nInternal Order ID: ${verifiedTx.internalOrderId}\nPayment Status: ${verifiedTx.paymentStatus}\nBill Status: ${verifiedTx.billStatus}`);
          setBillDetails(null);
          setSelectedPlan(null);
          setActiveSubTab('history');
          refreshHistory();
        }
      }, 1000);
    }
  };

  // View Receipt Modal
  const handleOpenReceipt = async (txId: string) => {
    const data = await fetchTransactionReceipt(txId);
    if (data) {
      setActiveReceipt(data);
      setShowReceiptModal(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Sub-tab Switcher */}
      <div className="glass-panel rounded-3xl p-6 bg-gradient-to-r from-slate-900 via-slate-900/90 to-teal-950/40 border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-teal-400 font-bold mb-1 uppercase tracking-wider">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Razorpay BBPS & Payment Gateway Integration</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Smart Bill Payment & Recharge Center
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Pay utility bills, mobile recharges, FASTag, and EMIs safely with backend signature verification.
          </p>
        </div>

        {/* Sub Tab Buttons */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold w-full md:w-auto">
          <button
            onClick={() => setActiveSubTab('pay')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeSubTab === 'pay' 
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Pay Bills & Recharge</span>
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeSubTab === 'history' 
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Payment History & Receipts</span>
          </button>
        </div>
      </div>

      {/* SUB TAB 1: PAY BILLS & RECHARGE */}
      {activeSubTab === 'pay' && (
        <div className="space-y-6">
          {/* Categories Grid */}
          <div className="glass-panel rounded-3xl p-5 bg-slate-900/60 border-slate-800 space-y-3">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Select Bill Category</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500/80 text-emerald-300 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                    }`}
                  >
                    {getCategoryIcon(cat.icon)}
                    <span className="text-[10px] font-bold leading-tight">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form & Bill Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Column */}
            <div className="lg:col-span-1 glass-panel rounded-3xl p-5 bg-slate-900/60 border-slate-800 space-y-4">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Provider & Customer Form
              </h2>

              {/* Biller Select */}
              <div className="space-y-1 text-xs">
                <label className="block text-slate-400 font-semibold">Select Service Provider</label>
                <select
                  value={selectedBillerId}
                  onChange={(e) => setSelectedBillerId(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  {billers.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Dynamic Customer Form */}
              {billerMetadata && billerMetadata.fields.length > 0 && (
                <DynamicBillerForm
                  fields={billerMetadata.fields}
                  onSubmit={handleBillerFormSubmit}
                  loading={loading}
                  submitButtonText={selectedCategory === 'mobile_recharge' ? 'View Recharge Plans' : 'Fetch Bill Details'}
                />
              )}
            </div>

            {/* Bill Details / Plan Selector Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Fetched Bill Card */}
              {billDetails && (
                <div className="glass-panel rounded-3xl p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border-emerald-500/40 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block">Official Bill Fetched</span>
                      <h3 className="text-lg font-extrabold text-white">{billDetails.customerName}</h3>
                      <span className="text-xs text-slate-400">Bill No: {billDetails.billNumber} | Period: {billDetails.billPeriod}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase block">Due Date</span>
                      <span className="text-xs font-bold text-rose-400">{billDetails.dueDate}</span>
                    </div>
                  </div>

                  {/* Amount Summary */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400">Total Payable Amount</span>
                      <p className="text-2xl font-black text-emerald-400">
                        {currencySymbol}{billDetails.totalAmount.toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleInitiatePayment(billDetails.totalAmount)}
                      disabled={paymentProcessing}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      <span>{paymentProcessing ? 'Opening Razorpay Checkout...' : 'Pay Now via Razorpay'}</span>
                    </button>
                  </div>

                  {billDetails.isMock && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span><strong>Development Mode:</strong> Local mock test bill generated for safe end-to-end checkout verification.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Recharge Plans Grid (for Mobile & DTH) */}
              {rechargePlans.length > 0 && (
                <div className="glass-panel rounded-3xl p-5 bg-slate-900/60 border-slate-800 space-y-4">
                  <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    Available Recharge Packs & Top-ups
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {rechargePlans.map((plan) => {
                      const isSel = selectedPlan?.id === plan.id;
                      return (
                        <div
                          key={plan.id}
                          onClick={() => setSelectedPlan(plan)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                            isSel 
                              ? 'bg-emerald-500/20 border-emerald-500 text-slate-100 shadow-md' 
                              : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white">{plan.name}</span>
                            <span className="text-sm font-black text-emerald-400">{currencySymbol}{plan.amount}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                            <span>Validity: {plan.validity}</span>
                            <span>Data: {plan.data}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInitiatePayment(plan.amount);
                            }}
                            disabled={paymentProcessing}
                            className="w-full mt-2 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Recharge {currencySymbol}{plan.amount}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Default Placeholder when no bill fetched yet */}
              {!billDetails && rechargePlans.length === 0 && (
                <div className="glass-panel rounded-3xl p-8 bg-slate-900/40 border-slate-800 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-emerald-400">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-200">No Bill Fetched Yet</h3>
                  <p className="text-slate-400 text-xs max-w-sm mx-auto">
                    Select your service provider on the left and enter your Account/Consumer ID to retrieve real-time bill details.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 2: PAYMENT HISTORY & RECEIPTS */}
      {activeSubTab === 'history' && (
        <div className="glass-panel rounded-3xl p-6 bg-slate-900/60 border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-400" />
              Grow 0.2 Bill Payment History & Official Receipts
            </h2>

            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search biller or ID..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <select
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value)}
                className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="SUCCESS">Payment SUCCESS</option>
                <option value="PENDING">Payment PENDING</option>
                <option value="FAILED">Payment FAILED</option>
              </select>

              <button
                onClick={refreshHistory}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                title="Refresh History"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Transaction Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="p-3">Order ID & Date</th>
                  <th className="p-3">Biller & Category</th>
                  <th className="p-3">Customer Identifier</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Payment Status</th>
                  <th className="p-3">Bill Status</th>
                  <th className="p-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {history.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/30 transition-all">
                    <td className="p-3">
                      <span className="font-bold text-white block">{tx.internalOrderId}</span>
                      <span className="text-[10px] text-slate-400">{tx.transactionDate.replace('T', ' ').slice(0, 16)}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-200 block">{tx.billerName}</span>
                      <span className="text-[10px] text-teal-400 font-bold uppercase">{tx.category}</span>
                    </td>
                    <td className="p-3 font-mono text-slate-300">{tx.maskedCustomerIdentifier}</td>
                    <td className="p-3 font-extrabold text-emerald-400">{currencySymbol}{tx.amount.toLocaleString()}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {tx.paymentStatus}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                        {tx.billStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleOpenReceipt(tx.id)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* OFFICIAL RECEIPT MODAL */}
      {showReceiptModal && activeReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-6 bg-slate-900 border-slate-800 space-y-5 max-w-md w-full">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block">{activeReceipt.appName}</span>
                <h3 className="text-base font-extrabold text-white">{activeReceipt.receiptTitle}</h3>
              </div>
              <button onClick={() => setShowReceiptModal(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between"><span className="text-slate-400">Order ID:</span><span className="text-white font-bold">{activeReceipt.internalOrderId}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Biller:</span><span className="text-slate-200">{activeReceipt.billerName}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Customer ID:</span><span className="text-slate-200">{activeReceipt.maskedCustomerIdentifier}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Date:</span><span className="text-slate-200">{activeReceipt.transactionDate.replace('T', ' ').slice(0, 16)}</span></div>
              <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-emerald-400"><span className="text-slate-300">Total Paid:</span><span>{currencySymbol}{activeReceipt.totalAmount}</span></div>
              <div className="flex justify-between text-[11px]"><span className="text-slate-400">Payment Status:</span><span className="text-emerald-400 font-bold">{activeReceipt.paymentStatus}</span></div>
              <div className="flex justify-between text-[11px]"><span className="text-slate-400">Bill Status:</span><span className="text-teal-400 font-bold">{activeReceipt.billStatus}</span></div>
            </div>

            <p className="text-[10px] text-slate-500 text-center">{activeReceipt.disclaimer}</p>

            <div className="flex justify-end space-x-2 pt-2">
              <button onClick={() => window.print()} className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-200 flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
              <button onClick={() => setShowReceiptModal(false)} className="px-4 py-2 rounded-xl bg-emerald-600 font-bold text-xs text-slate-950">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
