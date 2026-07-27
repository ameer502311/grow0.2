import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Calculator as CalcIcon, TrendingUp, PiggyBank, DollarSign, 
  Sparkles, Layers, ShieldCheck, RefreshCw
} from 'lucide-react';
import { calculateSIP, calculateFD, calculateEMI, calculateRetirement, calculateInflation, calculateCAGR } from '../utils/calculators';

type CalcType = 'sip' | 'fd' | 'emi' | 'cagr' | 'retirement' | 'inflation';

export const Calculators: React.FC = () => {
  const { currencySymbol } = useApp();
  const [activeCalc, setActiveCalc] = useState<CalcType>('sip');

  // SIP State
  const [sipMonthly, setSipMonthly] = useState<number>(10000);
  const [sipRate, setSipRate] = useState<number>(12);
  const [sipYears, setSipYears] = useState<number>(10);

  // FD State
  const [fdPrincipal, setFdPrincipal] = useState<number>(100000);
  const [fdRate, setFdRate] = useState<number>(7.5);
  const [fdYears, setFdYears] = useState<number>(5);

  // EMI State
  const [emiPrincipal, setEmiPrincipal] = useState<number>(500000);
  const [emiRate, setEmiRate] = useState<number>(9.5);
  const [emiYears, setEmiYears] = useState<number>(3);

  // CAGR State
  const [cagrBuy, setCagrBuy] = useState<number>(50000);
  const [cagrSell, setCagrSell] = useState<number>(120000);
  const [cagrYears, setCagrYears] = useState<number>(4);

  // Retirement State
  const [retAgeCurr, setRetAgeCurr] = useState<number>(28);
  const [retAgeTarget, setRetAgeTarget] = useState<number>(60);
  const [retExpense, setRetExpense] = useState<number>(40000);

  // Inflation State
  const [infCost, setInfCost] = useState<number>(500000);
  const [infRate, setInfRate] = useState<number>(6);
  const [infYears, setInfYears] = useState<number>(15);

  const sipRes = calculateSIP(sipMonthly, sipRate, sipYears);
  const fdRes = calculateFD(fdPrincipal, fdRate, fdYears);
  const emiRes = calculateEMI(emiPrincipal, emiRate, emiYears);
  const cagrVal = calculateCAGR(cagrBuy, cagrSell, cagrYears);
  const retRes = calculateRetirement(retAgeCurr, retAgeTarget, retExpense, 6, 12);
  const infFutureCost = calculateInflation(infCost, infRate, infYears);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass-panel rounded-3xl p-5 bg-slate-900/60 border-slate-800">
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
          <CalcIcon className="w-5 h-5 text-emerald-400" /> Smart Financial Calculators Suite
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">Calculate investment wealth compounding, SIP returns, loan EMIs, retirement corpus & inflation impact.</p>
      </div>

      {/* Calculator Type Selector */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button 
          onClick={() => setActiveCalc('sip')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${activeCalc === 'sip' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'}`}
        >
          SIP & Mutual Fund Calculator
        </button>
        <button 
          onClick={() => setActiveCalc('fd')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${activeCalc === 'fd' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'}`}
        >
          FD & RD Maturity Calculator
        </button>
        <button 
          onClick={() => setActiveCalc('emi')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${activeCalc === 'emi' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Loan EMI Calculator
        </button>
        <button 
          onClick={() => setActiveCalc('cagr')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${activeCalc === 'cagr' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Stock Profit & CAGR
        </button>
        <button 
          onClick={() => setActiveCalc('retirement')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${activeCalc === 'retirement' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Retirement Corpus Planner
        </button>
        <button 
          onClick={() => setActiveCalc('inflation')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${activeCalc === 'inflation' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Inflation Impact Calculator
        </button>
      </div>

      {/* SIP CALCULATOR */}
      {activeCalc === 'sip' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel rounded-3xl p-6 bg-slate-900/60 border-slate-800 space-y-4 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span>Monthly Investment ({currencySymbol})</span>
                <span className="text-emerald-400 font-bold">{currencySymbol}{sipMonthly.toLocaleString()}</span>
              </div>
              <input 
                type="range" min="500" max="100000" step="500" value={sipMonthly}
                onChange={(e) => setSipMonthly(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span>Expected Return Rate (%)</span>
                <span className="text-emerald-400 font-bold">{sipRate}%</span>
              </div>
              <input 
                type="range" min="1" max="25" step="0.5" value={sipRate}
                onChange={(e) => setSipRate(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span>Time Period (Years)</span>
                <span className="text-emerald-400 font-bold">{sipYears} Yr</span>
              </div>
              <input 
                type="range" min="1" max="30" step="1" value={sipYears}
                onChange={(e) => setSipYears(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6 bg-gradient-to-br from-slate-900 to-emerald-950/40 border-slate-800 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider block">SIP Projection</span>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Total Invested:</span>
                  <span className="font-bold text-slate-200">{currencySymbol}{sipRes.totalInvestment.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Estimated Returns:</span>
                  <span className="font-bold text-emerald-400">+{currencySymbol}{sipRes.estimatedReturns.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between text-base">
                  <span className="font-bold text-white">Future Portfolio Value:</span>
                  <span className="font-black text-emerald-400">{currencySymbol}{sipRes.totalValue.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300">
              💡 Stepping up your monthly SIP by 10% each year can increase total future returns by over 65%!
            </div>
          </div>
        </div>
      )}

      {/* EMI CALCULATOR */}
      {activeCalc === 'emi' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel rounded-3xl p-6 bg-slate-900/60 border-slate-800 space-y-4 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span>Loan Principal Amount ({currencySymbol})</span>
                <span className="text-rose-400 font-bold">{currencySymbol}{emiPrincipal.toLocaleString()}</span>
              </div>
              <input 
                type="range" min="10000" max="10000000" step="50000" value={emiPrincipal}
                onChange={(e) => setEmiPrincipal(Number(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span>Annual Interest Rate (%)</span>
                <span className="text-rose-400 font-bold">{emiRate}%</span>
              </div>
              <input 
                type="range" min="5" max="24" step="0.25" value={emiRate}
                onChange={(e) => setEmiRate(Number(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span>Loan Tenure (Years)</span>
                <span className="text-rose-400 font-bold">{emiYears} Yr</span>
              </div>
              <input 
                type="range" min="1" max="30" step="1" value={emiYears}
                onChange={(e) => setEmiYears(Number(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6 bg-gradient-to-br from-slate-900 to-rose-950/40 border-slate-800 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-[11px] text-rose-400 font-bold uppercase tracking-wider block">EMI Calculation Result</span>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Monthly EMI:</span>
                  <span className="font-extrabold text-white text-lg">{currencySymbol}{emiRes.monthlyEmi.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Total Interest Payable:</span>
                  <span className="font-bold text-rose-400">{currencySymbol}{emiRes.totalInterest.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between text-sm">
                  <span className="font-bold text-slate-300">Total Amount Paid:</span>
                  <span className="font-bold text-white">{currencySymbol}{emiRes.totalPayment.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CAGR CALCULATOR */}
      {activeCalc === 'cagr' && (
        <div className="glass-panel rounded-3xl p-6 bg-slate-900/60 border-slate-800 max-w-lg space-y-4 text-xs">
          <h2 className="text-sm font-bold text-white">CAGR Stock & Mutual Fund Growth Calculator</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Buy / Initial Price ({currencySymbol})</label>
              <input type="number" value={cagrBuy} onChange={(e) => setCagrBuy(Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200" />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Sell / Current Price ({currencySymbol})</label>
              <input type="number" value={cagrSell} onChange={(e) => setCagrSell(Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200" />
            </div>
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Investment Horizon (Years)</label>
            <input type="number" value={cagrYears} onChange={(e) => setCagrYears(Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200" />
          </div>
          <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-center">
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">Compounded Annual Growth Rate</span>
            <p className="text-3xl font-black text-cyan-400 mt-1">{cagrVal}% CAGR</p>
          </div>
        </div>
      )}

      {/* INFLATION CALCULATOR */}
      {activeCalc === 'inflation' && (
        <div className="glass-panel rounded-3xl p-6 bg-slate-900/60 border-slate-800 max-w-lg space-y-4 text-xs">
          <h2 className="text-sm font-bold text-white">Future Cost Inflation Impact Calculator</h2>
          <div>
            <label className="block text-slate-400 mb-1">Current Expense / Item Cost ({currencySymbol})</label>
            <input type="number" value={infCost} onChange={(e) => setInfCost(Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200" />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Expected Inflation Rate (%)</label>
            <input type="number" value={infRate} onChange={(e) => setInfRate(Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200" />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Years in Future</label>
            <input type="number" value={infYears} onChange={(e) => setInfYears(Number(e.target.value))} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200" />
          </div>
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-center">
            <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">Future Cost in {infYears} Years</span>
            <p className="text-3xl font-black text-indigo-400 mt-1">{currencySymbol}{infFutureCost.toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
};
