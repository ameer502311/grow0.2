import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Zap, Droplet, Flame, Wifi, Smartphone, PhoneCall, Tv, Car, ShieldCheck, CreditCard,
  Search, CheckCircle2, AlertTriangle, Clock, Printer, RefreshCw, FileText, Lock, X
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

interface SmartBillCenterProps {
  onExit?: () => void;
}

export const SmartBillCenter: React.FC<SmartBillCenterProps> = ({ onExit }) => {
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
      case 'Zap': return <Zap className="w-5 h-5 text-amber-500" />;
      case 'Droplet': return <Droplet className="w-5 h-5 text-blue-500" />;
      case 'Flame': return <Flame className="w-5 h-5 text-orange-500" />;
      case 'Wifi': return <Wifi className="w-5 h-5 text-blue-600" />;
      case 'Smartphone': return <Smartphone className="w-5 h-5 text-emerald-600" />;
      case 'PhoneCall': return <PhoneCall className="w-5 h-5 text-teal-600" />;
      case 'Tv': return <Tv className="w-5 h-5 text-purple-600" />;
      case 'Car': return <Car className="w-5 h-5 text-blue-600" />;
      case 'ShieldCheck': return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
      case 'CreditCard': return <CreditCard className="w-5 h-5 text-slate-700 dark:text-slate-300" />;
      default: return <Zap className="w-5 h-5 text-blue-600" />;
    }
  };

  // Status Presentation Helpers (Section 14 & 15)
  const getPaymentStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'SUCCESS') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Payment Successful
        </span>
      );
    }
    if (s === 'FAILED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
          Payment Failed
        </span>
      );
    }
    if (s === 'CANCELLED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
          Payment Cancelled
        </span>
      );
    }
    if (s === 'REFUNDED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
          Payment Refunded
        </span>
      );
    }
    // CREATED / PENDING / PROCESSING
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
        Payment {s === 'CREATED' ? 'Created' : s === 'PROCESSING' ? 'Processing' : 'Pending'}
      </span>
    );
  };

  const getBillStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'PAID' || s === 'PROCESSED' || s === 'SUCCESS') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Bill Paid
        </span>
      );
    }
    if (s === 'FAILED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
          Bill Failed
        </span>
      );
    }
    // SUBMITTED / PROCESSING / PENDING
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
        Bill Processing
      </span>
    );
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
      return;
    }

    const bill = await requestBillDetails(selectedBillerId, formData);
    setBillDetails(bill);
    setLoading(false);
  };

  // Initiate Razorpay Checkout Payment
  const handleInitiatePayment = async (amountToPay: number) => {
    if (!amountToPay || amountToPay <= 0) return;
    setPaymentProcessing(true);

    await loadRazorpayCheckoutSdk();
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
      alert('Unable to initialize payment order. Please check backend connection.');
      setPaymentProcessing(false);
      return;
    }

    const { internalOrderId, providerOrderId, keyId, amount, transactionId } = orderData;

    const options = {
      key: keyId,
      amount: Math.round(amount * 100),
      currency: 'INR',
      name: 'GROW 0.2',
      description: `Bill Payment - ${billerMetadata?.billerName || selectedBillerId}`,
      image: 'https://cdn-icons-png.flaticon.com/512/10149/10149458.png',
      order_id: providerOrderId.startsWith('rzp_order_') && keyId.startsWith('rzp_test_mock') ? undefined : providerOrderId,
      handler: async function (response: any) {
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
          alert(`Payment Successful!\n\nOrder ID: ${verifiedTx.internalOrderId}\nPayment Status: ${verifiedTx.paymentStatus}\nBill Status: ${verifiedTx.billStatus}`);
          setBillDetails(null);
          setSelectedPlan(null);
          setActiveSubTab('history');
          refreshHistory();
        } else {
          alert('Payment signature verification failed.');
        }
      },
      prefill: {
        name: 'Alex Vance',
        email: 'alex.vance@fintech.io',
        contact: '+91 98765 43210'
      },
      theme: {
        color: '#2563EB' // Trust Blue primary
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
          alert(`[TEST PAYMENT SUCCESSFUL]\n\nOrder ID: ${verifiedTx.internalOrderId}\nPayment Status: ${verifiedTx.paymentStatus}\nBill Status: ${verifiedTx.billStatus}`);
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
      <div className="card-surface rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Secure Utility Payments & Recharges</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Pay Bills & Recharge
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Pay utility bills, mobile plans, FASTag, and EMIs safely with verified provider receipts.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Sub Tab Buttons */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl text-xs font-semibold w-full md:w-auto border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveSubTab('pay')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeSubTab === 'pay' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Pay Bills & Recharge</span>
            </button>
            <button
              onClick={() => setActiveSubTab('history')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeSubTab === 'history' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Payment History</span>
            </button>
          </div>

          {onExit && (
            <button
              onClick={onExit}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              title="Exit to Dashboard"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* SUB TAB 1: PAY BILLS & RECHARGE */}
      {activeSubTab === 'pay' && (
        <div className="space-y-6">
          {/* Categories Grid */}
          <div className="card-surface rounded-2xl p-5 space-y-3">
            <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Select Bill Category
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 text-blue-700 dark:text-blue-300 font-semibold shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    {getCategoryIcon(cat.icon)}
                    <span className="text-[10px] font-medium leading-tight">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form & Bill Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Column */}
            <div className="lg:col-span-1 card-surface rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Service Provider & Account
              </h2>

              {/* Biller Select */}
              <div className="space-y-1 text-xs">
                <label className="block text-slate-700 dark:text-slate-300 font-medium">Select Service Provider</label>
                <select
                  value={selectedBillerId}
                  onChange={(e) => setSelectedBillerId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
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
                <div className="card-surface rounded-2xl p-6 border-blue-200 dark:border-blue-900 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Official Bill Fetched</span>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{billDetails.customerName}</h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400">Bill No: {billDetails.billNumber} | Period: {billDetails.billPeriod}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase block">Due Date</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                        {billDetails.dueDate}
                      </span>
                    </div>
                  </div>

                  {/* Amount Summary */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">Total Payable Amount</span>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {currencySymbol}{billDetails.totalAmount.toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleInitiatePayment(billDetails.totalAmount)}
                      disabled={paymentProcessing}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      <span>{paymentProcessing ? 'Opening Payment Gateway...' : 'Pay Bill Now'}</span>
                    </button>
                  </div>

                  {billDetails.isMock && (
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                      <span><strong>Development Mode:</strong> Test bill for end-to-end checkout verification.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Recharge Plans Grid (for Mobile & DTH) */}
              {rechargePlans.length > 0 && (
                <div className="card-surface rounded-2xl p-5 space-y-4">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    Available Recharge Plans
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {rechargePlans.map((plan) => {
                      const isSel = selectedPlan?.id === plan.id;
                      return (
                        <div
                          key={plan.id}
                          onClick={() => setSelectedPlan(plan)}
                          className={`p-4 rounded-xl border transition-colors cursor-pointer space-y-2 ${
                            isSel 
                              ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-600 text-slate-900 dark:text-slate-100 shadow-sm' 
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">{plan.name}</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{currencySymbol}{plan.amount}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                            <span>Validity: {plan.validity}</span>
                            <span>Data: {plan.data}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInitiatePayment(plan.amount);
                            }}
                            disabled={paymentProcessing}
                            className="w-full mt-2 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
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
                <div className="card-surface rounded-2xl p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center mx-auto">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Ready to Fetch Bill</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm mx-auto">
                    Select your service provider on the left and enter your Account or Consumer ID to view your official bill details.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 2: PAYMENT HISTORY & RECEIPTS */}
      {activeSubTab === 'history' && (
        <div className="card-surface rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Bill Payment Records & Receipts
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Detailed transaction records with separate payment status and bill delivery confirmations.
              </p>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search biller or ID..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                />
              </div>

              <select
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value)}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="SUCCESS">Payment SUCCESS</option>
                <option value="PENDING">Payment PENDING</option>
                <option value="FAILED">Payment FAILED</option>
              </select>

              <button
                onClick={refreshHistory}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs transition-colors"
                title="Refresh History"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Transaction Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase font-semibold text-[10px] border-b border-slate-200 dark:border-slate-800">
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
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {history.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850 transition-colors">
                    <td className="p-3">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 block">{tx.internalOrderId}</span>
                      <span className="text-[10px] text-slate-500">{tx.transactionDate.replace('T', ' ').slice(0, 16)}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-medium text-slate-900 dark:text-slate-100 block">{tx.billerName}</span>
                      <span className="text-[10px] text-slate-500 uppercase">{tx.category}</span>
                    </td>
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{tx.maskedCustomerIdentifier}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{currencySymbol}{tx.amount.toLocaleString()}</td>
                    <td className="p-3">
                      {getPaymentStatusBadge(tx.paymentStatus)}
                    </td>
                    <td className="p-3">
                      {getBillStatusBadge(tx.billStatus)}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleOpenReceipt(tx.id)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-surface rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">{activeReceipt.appName}</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{activeReceipt.receiptTitle}</h3>
              </div>
              <button onClick={() => setShowReceiptModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between"><span className="text-slate-500">Order ID:</span><span className="text-slate-900 dark:text-slate-100 font-bold">{activeReceipt.internalOrderId}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Biller:</span><span className="text-slate-800 dark:text-slate-200">{activeReceipt.billerName}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Customer ID:</span><span className="text-slate-800 dark:text-slate-200">{activeReceipt.maskedCustomerIdentifier}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Date:</span><span className="text-slate-800 dark:text-slate-200">{activeReceipt.transactionDate.replace('T', ' ').slice(0, 16)}</span></div>
              <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between font-bold text-slate-900 dark:text-slate-100"><span className="text-slate-600 dark:text-slate-400">Total Paid:</span><span>{currencySymbol}{activeReceipt.totalAmount}</span></div>
              <div className="flex justify-between text-[11px]"><span className="text-slate-500">Payment Status:</span><span>{getPaymentStatusBadge(activeReceipt.paymentStatus)}</span></div>
              <div className="flex justify-between text-[11px]"><span className="text-slate-500">Bill Status:</span><span>{getBillStatusBadge(activeReceipt.billStatus)}</span></div>
            </div>

            <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center">{activeReceipt.disclaimer}</p>

            <div className="flex justify-end space-x-2 pt-2">
              <button onClick={() => window.print()} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors">
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
              <button onClick={() => setShowReceiptModal(false)} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold text-xs text-white shadow-sm transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
