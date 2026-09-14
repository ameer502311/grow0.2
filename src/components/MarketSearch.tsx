import React, { useState, useEffect } from 'react';
import { 
  Search, X, RefreshCw, Sparkles, MapPin, ShieldCheck, 
  ArrowUpRight, ArrowDownRight, Clock, ExternalLink, History, Zap, CheckCircle2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { performMarketSearchApi, fetchSearchHistoryApi, clearSearchHistoryApi } from '../services/api';

export const MarketSearch: React.FC = () => {
  const { currencySymbol } = useApp();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchHistory, setSearchHistory] = useState<any[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const suggestedQueries = [
    'Today gold price',
    'Today gold price in Chennai',
    '22K gold price',
    '24K gold price per 10 grams',
    'Today silver price',
    'NIFTY 50 today',
    'USD INR today',
    'Bitcoin price today',
    'My total investment',
    'My gold holdings'
  ];

  const handleSearchSubmit = async (searchQuery?: string) => {
    const textToSearch = searchQuery !== undefined ? searchQuery : query;
    if (!textToSearch || !textToSearch.trim()) return;

    setQuery(textToSearch);
    setLoading(true);
    setSearchResult(null);

    try {
      const data = await performMarketSearchApi(textToSearch);
      if (data && data.success) {
        setSearchResult(data.data);
      }
    } catch (err: any) {
      console.warn('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const loadHistory = async () => {
    const data = await fetchSearchHistoryApi();
    if (data && data.data) setSearchHistory(data.data);
    setShowHistoryModal(true);
  };

  const handleClearHistory = async () => {
    await clearSearchHistoryApi();
    setSearchHistory([]);
  };

  // Perform initial default search on load
  useEffect(() => {
    handleSearchSubmit('Today gold price in Chennai');
  }, []);

  return (
    <div className="space-y-4">
      {/* Search Bar Container */}
      <div className="glass-panel rounded-3xl p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <Search className="w-4 h-4" /> Google-Like Market Search Engine
          </div>
          <button
            onClick={loadHistory}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-all font-semibold"
          >
            <History className="w-3.5 h-3.5" /> Recent Searches
          </button>
        </div>

        {/* Search Input Box */}
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search today gold price, silver price, NIFTY 50, USD INR, or your investment..."
            className="w-full pl-12 pr-28 py-3.5 rounded-2xl bg-slate-950/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:border-amber-400 transition-all shadow-inner"
          />
          <div className="absolute right-3 flex items-center space-x-2">
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => handleSearchSubmit()}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />} Search
            </button>
          </div>
        </div>

        {/* Suggested Searches Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-slate-500 font-semibold shrink-0 text-[11px]">Suggestions:</span>
          {suggestedQueries.map((sq, idx) => (
            <button
              key={idx}
              onClick={() => handleSearchSubmit(sq)}
              className="px-3 py-1 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-800 font-medium whitespace-nowrap transition-all text-[11px]"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Google-like Answer Card Result */}
      {searchResult && searchResult.data && (
        <div className="glass-panel rounded-3xl p-6 bg-slate-900/90 border border-slate-800 space-y-4 shadow-2xl transition-all">
          {/* Answer Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
            <div>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Verified Google-Style Answer Card
              </span>
              <h2 className="text-xl font-black text-white mt-0.5">{searchResult.title}</h2>
              {searchResult.subtitle && (
                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" /> {searchResult.subtitle}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                searchResult.data.dataStatus === 'live' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}>
                {searchResult.data.dataStatus || 'Live'}
              </span>
              <button
                onClick={() => handleSearchSubmit()}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-all"
                title="Refresh Answer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Location Disclaimer if applicable */}
          {searchResult.locationDisclaimer && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
              ℹ️ {searchResult.locationDisclaimer}
            </div>
          )}

          {/* 1. GOLD PRICE ANSWER CARD LAYOUT */}
          {searchResult.intent === 'gold_price' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 22K Gold Card */}
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">22K Standard Gold</span>
                    <span className="text-[10px] text-slate-400 font-mono">91.6% Pure</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Per Gram (1g):</span>
                      <span className="font-extrabold text-white text-sm">₹{searchResult.data.gold22k.perGram.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Per Sovereign (8g):</span>
                      <span className="font-extrabold text-amber-300 text-sm">₹{searchResult.data.gold22k.per8Gram.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Per 10 Grams (10g):</span>
                      <span className="font-black text-amber-400 text-base">₹{searchResult.data.gold22k.per10Gram.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* 24K Gold Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-950 to-slate-950 border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-yellow-300 uppercase tracking-wider">24K Pure Bullion Gold</span>
                    <span className="text-[10px] text-yellow-400 font-mono">99.9% Pure</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Per Gram (1g):</span>
                      <span className="font-extrabold text-white text-sm">₹{searchResult.data.gold24k.perGram.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Per Sovereign (8g):</span>
                      <span className="font-extrabold text-yellow-300 text-sm">₹{searchResult.data.gold24k.per8Gram.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Per 10 Grams (10g):</span>
                      <span className="font-black text-yellow-400 text-base">₹{searchResult.data.gold24k.per10Gram.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Daily Change Bar */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">Daily Market Change:</span>
                <span className={`font-black text-sm flex items-center gap-1 ${
                  searchResult.data.dailyChangePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {searchResult.data.dailyChangePercent >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {searchResult.data.dailyChangePercent >= 0 ? '+' : ''}{searchResult.data.dailyChangePercent}% (₹{searchResult.data.dailyChange})
                </span>
              </div>
            </div>
          )}

          {/* 2. SILVER PRICE ANSWER CARD LAYOUT */}
          {searchResult.intent === 'silver_price' && (
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-slate-200 uppercase">Pure Fine Silver Rates</span>
                <span className="text-[10px] text-slate-400">99.9% Pure</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Per Gram (1g)</span>
                  <span className="text-base font-extrabold text-white">₹{searchResult.data.silver.perGram}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Per 10 Grams (10g)</span>
                  <span className="text-base font-extrabold text-slate-200">₹{searchResult.data.silver.per10Gram}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Per Kilogram (1kg)</span>
                  <span className="text-base font-black text-cyan-300">₹{searchResult.data.silver.perKg.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* 3. STOCK / FOREX / CRYPTO CARD LAYOUT */}
          {(searchResult.intent === 'stock_price' || searchResult.intent === 'forex_price' || searchResult.intent === 'crypto_price') && (
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-slate-400 text-xs block font-semibold">Current Trading Rate</span>
                  <span className="text-2xl font-black text-white font-mono">
                    {searchResult.data.currency === 'USD' ? '$' : currencySymbol}{(searchResult.data.price || 0).toLocaleString()}
                  </span>
                </div>

                <div className={`text-right font-black text-base ${
                  searchResult.data.dailyChangePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  <span>{searchResult.data.dailyChangePercent >= 0 ? '+' : ''}{searchResult.data.dailyChangePercent}%</span>
                  <span className="block text-xs font-normal text-slate-400">({searchResult.data.dailyChange})</span>
                </div>
              </div>
            </div>
          )}

          {/* 4. PORTFOLIO ANSWER CARD LAYOUT */}
          {(searchResult.intent === 'portfolio_summary' || searchResult.intent === 'holding_search' || searchResult.intent === 'profit_loss' || searchResult.intent === 'platform_summary') && (
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase block">Total Invested</span>
                  <span className="text-base font-extrabold text-white">{currencySymbol}{searchResult.data.totalInvested.toLocaleString()}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase block">Current Valuation</span>
                  <span className="text-base font-extrabold text-emerald-400">{currencySymbol}{searchResult.data.totalCurrentValue.toLocaleString()}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase block">Net Profit / Loss</span>
                  <span className={`text-base font-extrabold ${searchResult.data.totalProfitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {searchResult.data.totalProfitLoss >= 0 ? '+' : ''}{currencySymbol}{searchResult.data.totalProfitLoss.toLocaleString()} ({searchResult.data.totalProfitLossPercent}%)
                  </span>
                </div>
              </div>

              {searchResult.data.platformBreakdown && searchResult.data.platformBreakdown.length > 0 && (
                <div className="space-y-2 text-xs pt-2 border-t border-slate-900">
                  <span className="font-bold text-slate-300">Connected Platforms Breakdown:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {searchResult.data.platformBreakdown.map((pb: any) => (
                      <div key={pb.platformId} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{pb.platform}</span>
                        <span className="font-bold text-emerald-400">{currencySymbol}{pb.currentValue.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Metadata */}
          <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 gap-2 font-mono">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Source: {searchResult.data.source || 'Verified Market Provider'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Updated: {searchResult.data.fetchedTimestamp ? new Date(searchResult.data.fetchedTimestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Searches Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-6 bg-slate-900 border border-slate-800 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Recent Market Searches</h3>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="p-1 text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto text-xs pr-1">
              {searchHistory.length === 0 ? (
                <div className="p-4 text-center text-slate-500">No search history recorded yet.</div>
              ) : (
                searchHistory.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setShowHistoryModal(false);
                      handleSearchSubmit(item.query);
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left text-slate-200 font-medium flex items-center justify-between"
                  >
                    <span>{item.query}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{new Date(item.searchedAt).toLocaleTimeString()}</span>
                  </button>
                ))
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <button
                onClick={handleClearHistory}
                className="text-xs text-rose-400 font-bold hover:underline"
              >
                Clear History
              </button>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
