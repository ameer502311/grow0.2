import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bell, Sun, Moon, ShieldCheck, UserCheck, Search, DollarSign, Sparkles, ChevronDown, CheckCircle2, X, Server, QrCode, Smartphone
} from 'lucide-react';
import { CurrencyCode } from '../types';
import { checkBackendHealth } from '../services/api';
import { UpiScannerAndTransferModal } from './UpiScannerAndTransferModal';

interface HeaderProps {
  onOpenAuth: () => void;
  onOpenSmartFeatures: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuth, onOpenSmartFeatures }) => {
  const { user, setUser, theme, toggleTheme, currency, setCurrency, currencySymbol, notifications, dismissNotification, investments, incomes, expenses } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showUpiScannerModal, setShowUpiScannerModal] = useState(false);
  const [backendConnected, setBackendConnected] = useState(true);

  useEffect(() => {
    checkBackendHealth().then(res => setBackendConnected(res.connected));
  }, []);

  const totalInvested = investments.reduce((acc, curr) => acc + curr.currentValue, 0);
  const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const netWorth = totalInvested + (totalIncome - totalExpense);

  const toggleRole = () => {
    setUser(prev => ({
      ...prev,
      role: prev.role === 'USER' ? 'ADMIN' : 'USER'
    }));
  };

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md px-4 lg:px-8 py-3.5 flex items-center justify-between">
      {/* Brand & Net Worth Snapshot */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 font-black text-xl text-slate-950">
            G
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1">
              Grow <span className="gradient-text-green">0.2</span>
            </span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-emerald-400 block -mt-1">
              AI Wealth Platform
            </span>
          </div>
        </div>

        {/* Live Net Worth Header Badge */}
        <div className="hidden md:flex items-center px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
          <span className="text-slate-400 mr-2">Net Worth:</span>
          <span className="font-bold text-emerald-400 text-sm">
            {currencySymbol}{netWorth.toLocaleString()}
          </span>
        </div>

        {/* Backend Connected Live Indicator */}
        <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-semibold text-emerald-400">
          <Server className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Backend Connected (Port 5000)</span>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* UPI QR & Mobile Pay Launcher */}
        <button 
          onClick={() => setShowUpiScannerModal(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 text-slate-950 text-xs font-black transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
        >
          <QrCode className="w-4 h-4" />
          <span className="hidden sm:inline">Scan QR & Mobile Pay</span>
        </button>

        {/* Currency Switcher */}
        <div className="relative">
          <select 
            value={currency} 
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-200 font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>

        {/* Smart AI Quick Launcher */}
        <button 
          onClick={onOpenSmartFeatures}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span className="hidden sm:inline">Voice & Scan</span>
        </button>

        {/* Dark/Light Mode Toggle */}
        <button 
          onClick={toggleTheme} 
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
          title="Toggle Dark/Light Mode"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>

        {/* Notifications Drawer Toggle */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center animate-bounce">
                {notifications.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-panel rounded-2xl p-4 shadow-2xl z-50 bg-slate-900/95 border-slate-800 text-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-semibold text-slate-200">Alerts & Reminders</span>
                <span className="text-[10px] text-slate-400">{notifications.length} Active</span>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-slate-500">No new notifications</div>
                ) : (
                  notifications.map((note, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-start justify-between gap-2">
                      <span className="text-slate-300 leading-relaxed">{note}</span>
                      <button 
                        onClick={() => dismissNotification(idx)}
                        className="text-slate-500 hover:text-slate-300 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Role Switcher & Profile Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2 pl-2 pr-1.5 py-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
              {user.name.charAt(0)}
            </div>
            <span className="hidden sm:inline text-xs font-semibold text-slate-200">{user.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 glass-panel rounded-2xl p-3 shadow-2xl z-50 bg-slate-900 border-slate-800 text-xs space-y-2">
              <div className="px-3 py-2 bg-slate-800/50 rounded-xl">
                <p className="font-semibold text-slate-200">{user.name}</p>
                <p className="text-[11px] text-slate-400">{user.email}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                  Role: {user.role}
                </span>
              </div>

              <button 
                onClick={toggleRole}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-300 flex items-center justify-between"
              >
                <span>Switch Role Mode</span>
                {user.role === 'ADMIN' ? <ShieldCheck className="w-4 h-4 text-purple-400" /> : <UserCheck className="w-4 h-4 text-emerald-400" />}
              </button>

              <button 
                onClick={() => { setShowProfileMenu(false); onOpenAuth(); }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-300"
              >
                Authentication & Settings
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Standalone UPI Scanner & Mobile Transfer Modal */}
      {showUpiScannerModal && (
        <UpiScannerAndTransferModal onClose={() => setShowUpiScannerModal(false)} />
      )}
    </header>
  );
};
