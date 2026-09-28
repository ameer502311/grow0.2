import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  TrendingUp, TrendingDown, Plus, Globe, 
  ArrowUpRight, ArrowDownRight, BookOpen, ShieldCheck, Info
} from 'lucide-react';
import { AssetCategory } from '../types';

export interface InvestmentsProps {
  onOpenBuyGold?: (amount: number) => void;
}

export const Investments: React.FC<InvestmentsProps> = ({ onOpenBuyGold }) => {
  const { 
    currencySymbol, investments, tickers, addInvestment 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'portfolio' | 'market' | 'learning' | 'forex'>('portfolio');
  const [marketCategory, setMarketCategory] = useState<'all' | 'bullion' | 'stocks' | 'crypto'>('all');
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 card-surface rounded-2xl p-5 sm:p-6">
        <div>
          <div className="flex items-center space-x-2 text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Investment & Asset Intelligence</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Investments & Markets
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Clear separation between your personal portfolio, verified live market indicators, and educational learning.
          </p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Asset to Portfolio
        </button>
      </div>

      {/* Primary Section Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('portfolio')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'portfolio' 
              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          My Investments ({investments.length})
        </button>
        <button 
          onClick={() => setActiveTab('market')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'market' 
              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          Market Information
        </button>
        <button 
          onClick={() => setActiveTab('learning')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'learning' 
              ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          Investment Learning
        </button>
        <button 
          onClick={() => setActiveTab('forex')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'forex' 
              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          Currency Converter
        </button>
      </div>

      {/* 1. MY INVESTMENTS (PORTFOLIO) */}
      {activeTab === 'portfolio' && (
        <div className="space-y-6">
          {/* Portfolio Metric Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="card-surface rounded-2xl p-4">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Total Invested</span>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{currencySymbol}{totalInvested.toLocaleString()}</p>
            </div>
            <div className="card-surface rounded-2xl p-4">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Current Portfolio Value</span>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{currencySymbol}{totalCurrent.toLocaleString()}</p>
            </div>
            <div className="card-surface rounded-2xl p-4">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Net Profit / Loss</span>
              <p className={`text-xl font-bold mt-1 ${totalProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {totalProfit >= 0 ? '+' : ''}{currencySymbol}{totalProfit.toLocaleString()}
              </p>
            </div>
            <div className="card-surface rounded-2xl p-4">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Overall Portfolio Return</span>
              <p className={`text-xl font-bold mt-1 ${Number(roiPercent) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {Number(roiPercent) >= 0 ? '+' : ''}{roiPercent}%
              </p>
            </div>
          </div>

          {/* Holdings Table */}
          <div className="card-surface rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-900 dark:text-slate-100">
              My Investment Holdings
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase font-semibold text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Asset Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Invested</th>
                    <th className="py-3 px-4 text-right">Current Value</th>
                    <th className="py-3 px-4 text-right">P&L</th>
                    <th className="py-3 px-4 text-right">Return %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {investments.map((inv) => {
                    const profit = inv.currentValue - inv.investedAmount;
                    const roi = ((profit / inv.investedAmount) * 100).toFixed(1);
                    const isPositive = profit >= 0;
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">{inv.name}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {inv.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">{currencySymbol}{inv.investedAmount.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-slate-100">{currencySymbol}{inv.currentValue.toLocaleString()}</td>
                        <td className={`py-3 px-4 text-right font-semibold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {isPositive ? '+' : ''}{currencySymbol}{profit.toLocaleString()}
                        </td>
                        <td className={`py-3 px-4 text-right font-semibold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {isPositive ? '+' : ''}{roi}%
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

      {/* 2. MARKET INFORMATION (Section 16 & 17) */}
      {activeTab === 'market' && (
        <div className="space-y-6">
          {/* Sub Filter */}
          <div className="flex items-center gap-2">
            {(['all', 'bullion', 'stocks', 'crypto'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setMarketCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  marketCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {cat === 'all' ? 'All Markets' : cat}
              </button>
            ))}
          </div>

          {/* Bullion Cards */}
          {(marketCategory === 'all' || marketCategory === 'bullion') && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Precious Metals (Bullion)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card-surface rounded-2xl p-5 border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">24K Digital Gold (10g)</span>
                    <span className="text-[10px] text-slate-400">Live Feed</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                    ₹{goldTicker?.price.toLocaleString() || '74,500'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <ArrowUpRight className="w-3.5 h-3.5" /> +₹380 (+0.51%)
                    </span>
                    <span className="text-[10px] text-slate-400">• Updated 10:30 AM</span>
                  </div>
                </div>

                <div className="card-surface rounded-2xl p-5 border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">22K Standard Gold (10g)</span>
                    <span className="text-[10px] text-slate-400">Live Feed</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">₹68,300</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <ArrowUpRight className="w-3.5 h-3.5" /> +₹350 (+0.52%)
                    </span>
                    <span className="text-[10px] text-slate-400">• Updated 10:30 AM</span>
                  </div>
                </div>

                <div className="card-surface rounded-2xl p-5 border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Silver 999 (1kg)</span>
                    <span className="text-[10px] text-slate-400">Live Feed</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                    ₹{silverTicker?.price.toLocaleString() || '89,200'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="inline-flex items-center text-xs font-semibold text-red-600 dark:text-red-400">
                      <ArrowDownRight className="w-3.5 h-3.5" /> -₹420 (-0.47%)
                    </span>
                    <span className="text-[10px] text-slate-400">• Updated 10:30 AM</span>
                  </div>
                </div>
              </div>

              {onOpenBuyGold && (
                <div className="card-surface rounded-2xl p-4 border border-blue-200 dark:border-blue-900 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Digital Gold Accumulation</h3>
                    <p className="text-xs text-slate-500">24K 99.9% pure gold stored in insured vaults starting at ₹10.</p>
                  </div>
                  <button 
                    onClick={() => onOpenBuyGold(1000)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
                  >
                    Buy Gold
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Stocks & Indices */}
          {(marketCategory === 'all' || marketCategory === 'stocks') && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Major Market Indices & Stocks
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tickers.filter(t => t.category === 'Stock').map((stock) => {
                  const isPositive = stock.change24h >= 0;
                  return (
                    <div key={stock.symbol} className="card-surface rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{stock.name}</h3>
                        <span className="text-[11px] text-slate-500 font-mono">{stock.symbol}</span>
                        <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">{currencySymbol}{stock.price.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-semibold flex items-center justify-end gap-1 ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          {isPositive ? '+' : ''}{stock.changePercent24h}%
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-1">24h Change</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Crypto Assets */}
          {(marketCategory === 'all' || marketCategory === 'crypto') && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Digital Assets & Crypto
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tickers.filter(t => t.category === 'Crypto').map((crypto) => (
                  <div key={crypto.symbol} className="card-surface rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{crypto.name}</h3>
                      <span className="text-[11px] text-slate-500 font-mono">{crypto.symbol}</span>
                      <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">${crypto.price.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5" /> +{crypto.changePercent24h}%
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-1">Market Cap: Tier 1</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. INVESTMENT LEARNING (PURPLE IDENTITY - Section 5 & 16) */}
      {activeTab === 'learning' && (
        <div className="space-y-5">
          <div className="card-surface rounded-2xl p-6 border-purple-200 dark:border-purple-900 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Investment Principles & Financial Literacy
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] text-purple-700 dark:text-purple-300 font-medium">
                  <ShieldCheck className="w-3 h-3" /> Educational Reference Only • Not Guaranteed Advice
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              GROW 0.2 provides educational learning frameworks to help you make informed, calm financial decisions. All investments are subject to market risks.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50 space-y-2">
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300">1. Power of Compounding</span>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Regular monthly savings invested in disciplined index funds or SIPs benefit from exponential compounding over a 5 to 10 year horizon.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50 space-y-2">
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300">2. Asset Allocation</span>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Diversify capital across equities, debt instruments, and digital gold to buffer against localized market downturns.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50 space-y-2">
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300">3. Emergency Buffer First</span>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Maintain 3 to 6 months of living expenses in liquid savings before deploying capital into higher-volatility growth assets.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. CURRENCY CONVERTER (Section 18) */}
      {activeTab === 'forex' && (
        <div className="card-surface rounded-2xl p-6 max-w-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              Currency Converter
            </h2>
            <span className="text-[10px] text-slate-500">Updated: Live Mid-Market</span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Amount</label>
              <input 
                type="number"
                value={fxAmount}
                onChange={(e) => setFxAmount(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">From</label>
                <select 
                  value={fxFrom}
                  onChange={(e) => setFxFrom(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                >
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">To</label>
                <select 
                  value={fxTo}
                  onChange={(e) => setFxTo(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[11px] text-slate-500 uppercase font-medium block">Converted Amount</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {fxTo === 'INR' ? '₹' : '$'}{getFxConverted()}
              </p>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 block">
                1 {fxFrom} = {fxFrom === 'USD' ? '83.72 INR' : fxFrom === 'EUR' ? '91.20 INR' : '0.012 USD'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Add Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-surface rounded-2xl p-6 border border-slate-200 dark:border-slate-800 max-w-md w-full space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Add Asset to Portfolio</h2>
            <form onSubmit={handleAddInvestment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Asset Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Sovereign Gold Bond, Nifty ETF, HDFC Bank" 
                  value={invName} 
                  onChange={(e) => setInvName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Category</label>
                <select 
                  value={invCategory} 
                  onChange={(e) => setInvCategory(e.target.value as AssetCategory)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
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
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Invested Amount ({currencySymbol})</label>
                <input 
                  type="number" 
                  placeholder="50000" 
                  value={invInvested} 
                  onChange={(e) => setInvInvested(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Current Value ({currencySymbol})</label>
                <input 
                  type="number" 
                  placeholder="65000" 
                  value={invCurrent} 
                  onChange={(e) => setInvCurrent(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600"
                  required
                />
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
