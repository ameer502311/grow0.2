import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Globe, CheckCircle2, ShieldCheck, RefreshCw, Plus, ArrowUpRight, 
  Coins, Sparkles, Layers, Zap, ShoppingBag
} from 'lucide-react';
import { PaymentGatewayModal } from './PaymentGatewayModal';

export const PlatformIntegrations: React.FC = () => {
  const { 
    platforms, togglePlatformConnection, buyDigitalGold, tickers, currencySymbol, transactions 
  } = useApp();

  const [goldAmount, setGoldAmount] = useState('1000');
  const [selectedGoldPlatform, setSelectedGoldPlatform] = useState('SafeGold / Augmont');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [deliveryRequested, setDeliveryRequested] = useState(false);

  const gold24k = tickers.find(t => t.symbol === 'GOLD24K');
  const goldPricePerGram = gold24k ? gold24k.price / 10 : 7425;
  const currentGrams = (parseFloat(goldAmount || '0') / goldPricePerGram);

  const handleBuyGoldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    const buyAmt = parseFloat(goldAmount);
    buyDigitalGold(buyAmt, selectedGoldPlatform, currentGrams);
  };

  const handleRequestPhysicalDelivery = () => {
    setDeliveryRequested(true);
    setTimeout(() => setDeliveryRequested(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel rounded-3xl p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 mb-1 uppercase tracking-wider">
            <Globe className="w-4 h-4" /> Connected Platform Ecosystem
          </div>
          <h1 className="text-xl font-extrabold text-white">Fintech Platform & Digital Gold Integrations</h1>
          <p className="text-xs text-slate-400">Connect Groww, SafeGold, Augmont, Aura Gold, Zerodha & INDmoney accounts for automated portfolio sync & 24K digital gold buying.</p>
        </div>
      </div>

      {/* Connected Platforms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {platforms.map((p) => (
          <div key={p.id} className="glass-panel glass-card-hover rounded-3xl p-5 bg-slate-900/60 border-slate-800 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{p.logo}</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${p.isConnected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
                  {p.isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-white">{p.name}</h3>
              <span className="text-[10px] text-slate-400 font-semibold block">{p.category}</span>
              
              <div className="mt-3 text-xs">
                <span className="text-[10px] text-slate-500 block">Synced Holdings:</span>
                <span className="font-bold text-emerald-400">{currencySymbol}{p.holdingsValue.toLocaleString()}</span>
              </div>
            </div>

            <button 
              onClick={() => togglePlatformConnection(p.id)}
              className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${p.isConnected ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'}`}
            >
              {p.isConnected ? 'Sync / Disconnect' : 'Connect Account'}
            </button>
          </div>
        ))}
      </div>

      {/* Digital Gold Direct Vault Buying & Aura Gold Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Instant 24K Digital Gold Buyer */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border-amber-500/30 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider block">24K 99.9% Pure Digital Gold</span>
              <h2 className="text-base font-extrabold text-white">Buy & Store Digital Gold starting at ₹10</h2>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1">
              <Coins className="w-4 h-4 text-amber-400" /> ₹{goldPricePerGram.toFixed(1)} / gram
            </span>
          </div>

          <form onSubmit={handleBuyGoldSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Select Provider Platform</label>
              <select 
                value={selectedGoldPlatform}
                onChange={(e) => setSelectedGoldPlatform(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-bold"
              >
                <option value="SafeGold / Augmont">SafeGold (Augmont Vault)</option>
                <option value="Aura Gold">Aura Gold Digital</option>
                <option value="Groww Gold">Groww Digital Gold</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Investment Amount ({currencySymbol})</label>
              <input 
                type="number"
                value={goldAmount}
                onChange={(e) => setGoldAmount(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold text-sm focus:outline-none focus:border-amber-500"
                min="10"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Calculated Gold Grams</label>
              <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-400 font-extrabold text-sm">
                ~ {currentGrams.toFixed(4)} Grams
              </div>
            </div>

            <div className="md:col-span-3 pt-2">
              <button 
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 fill-current" /> Pay {currencySymbol}{parseFloat(goldAmount || '0').toLocaleString()} via GPay / Paytm / PhonePe
              </button>
            </div>
          </form>

          {/* Quick preset chips */}
          <div className="flex items-center space-x-2 pt-1 text-xs">
            <span className="text-slate-400 font-semibold">Quick Amounts:</span>
            {['100', '500', '1000', '5000', '10000'].map(amt => (
              <button 
                key={amt}
                type="button"
                onClick={() => setGoldAmount(amt)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold border border-slate-700"
              >
                ₹{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Insured Physical Delivery Vault Card */}
        <div className="glass-panel rounded-3xl p-5 bg-slate-900/60 border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm text-white">Physical Gold Coin Delivery</h3>
            </div>

            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Convert your accumulated SafeGold / Aura Gold vault balance into 24K 999.9 pure tamper-proof gold coins delivered directly to your doorstep with 100% insurance.
            </p>
          </div>

          <div className="space-y-3">
            {deliveryRequested && (
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold text-center">
                ✓ Delivery Order Dispatched! Tracking details sent to email.
              </div>
            )}

            <button 
              onClick={handleRequestPhysicalDelivery}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all border border-slate-700"
            >
              Request Doorstep Delivery (0.5g - 100g)
            </button>
          </div>
        </div>
      </div>

      {/* Recent Online Payment Transactions Log */}
      <div className="glass-panel rounded-3xl overflow-hidden border-slate-800">
        <div className="p-4 border-b border-slate-800 font-bold text-xs text-slate-200">
          Recent Payment Transactions (GPay, Paytm, PhonePe, UPI)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Provider</th>
                <th className="py-3.5 px-4">Purpose</th>
                <th className="py-3.5 px-4">Reference No</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-900/40 transition-colors font-mono text-[11px]">
                  <td className="py-3.5 px-4 font-bold text-emerald-400">{tx.provider}</td>
                  <td className="py-3.5 px-4 text-slate-200 font-sans">{tx.purpose}</td>
                  <td className="py-3.5 px-4 text-slate-400">{tx.referenceNo}</td>
                  <td className="py-3.5 px-4 text-slate-400">{tx.timestamp}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-white font-sans">{currencySymbol}{tx.amount.toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Gateway Launcher Modal */}
      {showPaymentModal && (
        <PaymentGatewayModal 
          onClose={() => setShowPaymentModal(false)}
          defaultAmount={parseFloat(goldAmount || '1000')}
          defaultPurpose="Digital Gold Buy"
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};
