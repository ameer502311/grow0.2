import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  TrendingUp, TrendingDown, DollarSign, Plus, Eye, RefreshCw, 
  ArrowUpRight, ArrowDownRight, Layers, Coins, Globe, PieChart, ShieldCheck
} from 'lucide-react';
import { AssetCategory } from '../types';

export const Investments: React.FC = () => {
  const { 
    currencySymbol, investments, tickers, addInvestment 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'portfolio' | 'gold' | 'stocks' | 'crypto' | 'forex'>('portfolio');
  const [chartPeriod, setChartPeriod] = useState<'7D' | '30D' | '1Y'>('7D');

  // Forex converter state
  const [fxFrom, setFxFrom] = useState('USD');
  const [fxTo, setFxTo] = useState('INR');
  const [fxAmount, setFxAmount] = useState('100');

  // New investment modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [invName, setInvName] = useState('');
  const [invCategory, setInvCategory] = useState<AssetCategory>('Stocks');
  const [invInvested, setInvInvested] = useState('');
  const [invCurrent, setInvCurrent] = useState('');

  const totalInvested = investments.reduce((acc, curr) => acc + curr.investedAmount, 0);
  const totalCurrent = investments.reduce((acc, curr) => acc + curr.currentValue, 0);
  const totalProfit = totalCurrent - totalInvested;
  const roiPercent = totalInvested > 0 ? ((totalProfit / totalInvested) * 100).toFixed(1) : '0.0';

  const goldTicker = tickers.find(t => t.symbol === 'GOLD24K');
  const silverTicker = tickers.find(t => t.symbol === 'SILVER');

  const handleAddInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invName || !invInvested || !invCurrent) return;
    addInvestment({
      name: invName,
      category: invCategory,
      investedAmount: Number(invInvested),
      currentValue: Number(invCurrent),
      purchaseDate: new Date().toISOString().slice(0, 10)
    });
    setInvName('');
    setInvInvested('');
    setInvCurrent('');
    setShowAddModal(false);
  };

  // Convert FX Rate calculation
  const getFxConverted = () => {
    const amt = parseFloat(fxAmount) || 0;
    if (fxFrom === 'USD' && fxTo === 'INR') return (amt * 83.72).toFixed(2);
    if (fxFrom === 'INR' && fxTo === 'USD') return (amt / 83.72).toFixed(2);
    if (fxFrom === 'EUR' && fxTo === 'INR') return (amt * 91.20).toFixed(2);
    return (amt * 1.08).toFixed(2);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel rounded-3xl p-5 bg-slate-900/60 border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-white">Investment & Live Markets Ecosystem</h1>
          <p className="text-xs text-slate-400">Track 22K/24K Gold, Stocks, Crypto, Mutual Funds, Forex, and monitor total P&L ROI.</p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Asset to Portfolio
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('portfolio')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${activeTab === 'portfolio' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'}`}
        >
          My Portfolio ({investments.length})
        </button>
        <button 
          onClick={() => setActiveTab('gold')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${activeTab === 'gold' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Gold & Silver Market
        </button>
        <button 
          onClick={() => setActiveTab('stocks')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${activeTab === 'stocks' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Stock Market Indices
        </button>
        <button 
          onClick={() => setActiveTab('crypto')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${activeTab === 'crypto' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Cryptocurrency
        </button>
        <button 
          onClick={() => setActiveTab('forex')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${activeTab === 'forex' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Currency Exchange & Converter
        </button>
      </div>

      {/* PORTFOLIO TAB */}
      {activeTab === 'portfolio' && (
        <div className="space-y-6">
          {/* Portfolio Metric Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="glass-panel rounded-2xl p-4 bg-slate-900/60 border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold">Total Invested</span>
              <p className="text-xl font-extrabold text-slate-100 mt-1">{currencySymbol}{totalInvested.toLocaleString()}</p>
            </div>
            <div className="glass-panel rounded-2xl p-4 bg-slate-900/60 border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold">Current Portfolio Value</span>
              <p className="text-xl font-extrabold text-emerald-400 mt-1">{currencySymbol}{totalCurrent.toLocaleString()}</p>
            </div>
            <div className="glass-panel rounded-2xl p-4 bg-slate-900/60 border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold">Total Profit / Loss</span>
              <p className={`text-xl font-extrabold mt-1 ${totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalProfit >= 0 ? '+' : ''}{currencySymbol}{totalProfit.toLocaleString()}
              </p>
            </div>
            <div className="glass-panel rounded-2xl p-4 bg-slate-900/60 border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold">Overall Growth ROI</span>
              <p className="text-xl font-extrabold text-cyan-400 mt-1">+{roiPercent}%</p>
            </div>
          </div>

          {/* Holdings Table */}
          <div className="glass-panel rounded-3xl overflow-hidden border-slate-800">
            <div className="p-4 border-b border-slate-800 font-bold text-xs text-slate-200">
              Asset Allocation & Holding Breakdown
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Asset Name</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4 text-right">Invested</th>
                    <th className="py-3.5 px-4 text-right">Current Value</th>
                    <th className="py-3.5 px-4 text-right">P&L</th>
                    <th className="py-3.5 px-4 text-right">ROI %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {investments.map((inv) => {
                    const profit = inv.currentValue - inv.investedAmount;
                    const roi = ((profit / inv.investedAmount) * 100).toFixed(1);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">{inv.name}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            {inv.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-400">{currencySymbol}{inv.investedAmount.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-100">{currencySymbol}{inv.currentValue.toLocaleString()}</td>
                        <td className={`py-3.5 px-4 text-right font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {profit >= 0 ? '+' : ''}{currencySymbol}{profit.toLocaleString()}
                        </td>
                        <td className={`py-3.5 px-4 text-right font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {profit >= 0 ? '+' : ''}{roi}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* GOLD TAB */}
      {activeTab === 'gold' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel rounded-3xl p-5 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border-slate-800">
              <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">24K Gold Price (10g)</span>
              <p className="text-2xl font-black text-white mt-1">₹{goldTicker?.price.toLocaleString()}</p>
              <span className="text-emerald-400 text-xs font-bold mt-1 block">+₹380 (0.51%) Today</span>
            </div>

            <div className="glass-panel rounded-3xl p-5 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border-slate-800">
              <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">22K Gold Price (10g)</span>
              <p className="text-2xl font-black text-white mt-1">₹68,060</p>
              <span className="text-emerald-400 text-xs font-bold mt-1 block">+₹350 (0.52%) Today</span>
            </div>

            <div className="glass-panel rounded-3xl p-5 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border-slate-800">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Silver Live Price (1kg)</span>
              <p className="text-2xl font-black text-white mt-1">₹{silverTicker?.price.toLocaleString()}</p>
              <span className="text-rose-400 text-xs font-bold mt-1 block">-₹420 (-0.47%) Today</span>
            </div>
          </div>

          {/* Historical Price Chart Simulation */}
          <div className="glass-panel rounded-3xl p-6 bg-slate-900/60 border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-200">Historical Bullion Price Trend</h3>
              <div className="flex space-x-1">
                {(['7D', '30D', '1Y'] as const).map(p => (
                  <button 
                    key={p} 
                    onClick={() => setChartPeriod(p)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${chartPeriod === p ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-48 flex items-end justify-between space-x-2 pt-6 px-4 bg-slate-950/60 rounded-2xl border border-slate-800">
              {goldTicker?.history7d.map((val, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] text-slate-400">₹{(val / 1000).toFixed(1)}k</span>
                  <div 
                    className="w-full bg-gradient-to-t from-amber-500/30 to-amber-400 rounded-t-md hover:opacity-90 transition-all"
                    style={{ height: `${((val - 70000) / 5000) * 100}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STOCKS TAB */}
      {activeTab === 'stocks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tickers.filter(t => t.category === 'Stock').map((stock) => (
            <div key={stock.symbol} className="glass-panel rounded-3xl p-5 bg-slate-900/60 border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-white">{stock.name}</h3>
                <span className="text-[11px] text-slate-400 font-mono">{stock.symbol}</span>
                <p className="text-xl font-bold text-slate-100 mt-2">{currencySymbol}{stock.price.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <span className={`text-sm font-extrabold flex items-center gap-1 ${stock.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {stock.change24h >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {stock.change24h >= 0 ? '+' : ''}{stock.changePercent24h}%
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">24h Vol: High</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CRYPTO TAB */}
      {activeTab === 'crypto' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tickers.filter(t => t.category === 'Crypto').map((crypto) => (
            <div key={crypto.symbol} className="glass-panel rounded-3xl p-5 bg-slate-900/60 border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-white">{crypto.name}</h3>
                <p className="text-xl font-bold text-slate-100 mt-2">${crypto.price.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-extrabold text-emerald-400 flex items-center gap-1">
                  <ArrowUpRight className="w-4 h-4" /> +{crypto.changePercent24h}%
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Market Cap: Tier 1</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FOREX CONVERTER TAB */}
      {activeTab === 'forex' && (
        <div className="glass-panel rounded-3xl p-6 bg-slate-900/60 border-slate-800 max-w-lg space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-400" /> Live Currency Converter
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Amount</label>
              <input 
                type="number"
                value={fxAmount}
                onChange={(e) => setFxAmount(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 mb-1">From</label>
                <select 
                  value={fxFrom}
                  onChange={(e) => setFxFrom(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                >
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">To</label>
                <select 
                  value={fxTo}
                  onChange={(e) => setFxTo(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center">
              <span className="text-[11px] text-emerald-400 uppercase tracking-wider block font-bold">Converted Total</span>
              <p className="text-2xl font-black text-white mt-1">{fxTo === 'INR' ? '₹' : '$'}{getFxConverted()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-6 bg-slate-900 border-slate-800 max-w-md w-full space-y-4">
            <h2 className="text-lg font-bold text-white">Add Asset to Portfolio</h2>
            <form onSubmit={handleAddInvestment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Asset Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Reliance Stock, Sovereign Gold, BTC" 
                  value={invName} 
                  onChange={(e) => setInvName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Category</label>
                <select 
                  value={invCategory}
                  onChange={(e) => setInvCategory(e.target.value as AssetCategory)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                >
                  <option value="Gold">Gold</option>
                  <option value="Stocks">Stocks</option>
                  <option value="Mutual Funds">Mutual Funds</option>
                  <option value="Crypto">Crypto</option>
                  <option value="FD">FD</option>
                  <option value="RD">RD</option>
                  <option value="Real Estate">Real Estate</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Invested Amount ({currencySymbol})</label>
                <input 
                  type="number" 
                  placeholder="50000" 
                  value={invInvested} 
                  onChange={(e) => setInvInvested(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Current Value ({currencySymbol})</label>
                <input 
                  type="number" 
                  placeholder="65000" 
                  value={invCurrent} 
                  onChange={(e) => setInvCurrent(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold"
                >
                  Add Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
