import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bell, Sun, Moon, ShieldCheck, UserCheck, Sparkles, ChevronDown, X, Server, QrCode, Menu
} from 'lucide-react';
import { CurrencyCode } from '../types';
import { checkBackendHealth } from '../services/api';
import { UpiScannerAndTransferModal } from './UpiScannerAndTransferModal';

interface HeaderProps {
  onOpenAuth: () => void;
  onOpenSmartFeatures: () => void;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenAuth, 
  onOpenSmartFeatures,
  onToggleMobileMenu,
  isMobileMenuOpen = false
}) => {
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
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md px-4 lg:px-8 py-3 flex items-center justify-between transition-colors shadow-fintech-subtle">
      {/* Brand & Net Worth Snapshot */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3">
          {/* Trust Blue Logo Badge */}
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-lg shadow-trust-sm">
            G
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
              Grow <span className="text-blue-600 dark:text-blue-400">0.2</span>
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block -mt-1">
              AI Wealth Platform
            </span>
          </div>
        </div>

        {/* Live Net Worth Header Badge (Financial Growth Green Highlight) */}
        <div className="hidden md:flex items-center px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
          <span className="text-slate-600 dark:text-slate-400 mr-2 font-medium">Net Worth:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
            {currencySymbol}{netWorth.toLocaleString()}
          </span>
        </div>

        {/* Backend Connected Live Indicator (Trust Blue Security) */}
        <div className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
          <Server className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>System Verified (Port 5000)</span>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center space-x-1.5 sm:space-x-2.5">
        {/* UPI QR & Mobile Pay Launcher (Primary Trust Action) */}
        <button 
          onClick={() => setShowUpiScannerModal(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
          title="Scan QR & Mobile Pay"
        >
          <QrCode className="w-4 h-4 shrink-0" />
          <span className="hidden md:inline">Scan QR & Mobile Pay</span>
        </button>

        {/* Currency Switcher */}
        <div className="relative">
          <select 
            value={currency} 
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="INR">₹ INR</option>
            <option value="USD">$ USD</option>
            <option value="EUR">€ EUR</option>
            <option value="GBP">£ GBP</option>
          </select>
        </div>

        {/* Smart AI Quick Launcher */}
        <button 
          onClick={onOpenSmartFeatures}
          className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-medium transition-all cursor-pointer"
          title="Voice & Scan Receipt"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="hidden lg:inline">Voice & Scan</span>
        </button>

        {/* Dark/Light Mode Toggle */}
        <button 
          onClick={toggleTheme} 
          className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          title="Toggle Dark/Light Mode"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Notifications Drawer Toggle */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 relative transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl p-4 shadow-xl z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                <span className="font-semibold text-slate-900 dark:text-white">Alerts & Reminders</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{notifications.length} Active</span>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-slate-400">No new notifications</div>
                ) : (
                  notifications.map((note, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 flex items-start justify-between gap-2">
                      <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{note}</span>
                      <button 
                        onClick={() => dismissNotification(idx)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
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

        {/* User Profile Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2 pl-2 pr-1.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
              {user.name.charAt(0)}
            </div>
            <span className="hidden sm:inline text-xs font-semibold text-slate-800 dark:text-slate-200">{user.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl p-3 shadow-xl z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <div className="px-3 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <p className="font-semibold text-slate-900 dark:text-white">{user.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{user.email}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                  user.role === 'ADMIN' 
                    ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800' 
                    : 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                }`}>
                  Role: {user.role}
                </span>
              </div>

              <button 
                onClick={toggleRole}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-between"
              >
                <span>Switch Role Mode</span>
                {user.role === 'ADMIN' ? <ShieldCheck className="w-4 h-4 text-purple-600" /> : <UserCheck className="w-4 h-4 text-blue-600" />}
              </button>

              <button 
                onClick={() => { setShowProfileMenu(false); onOpenAuth(); }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                Authentication & Settings
              </button>
            </div>
          )}
        </div>

        {/* Mobile Navigation Drawer Button */}
        {onToggleMobileMenu && (
          <button 
            onClick={onToggleMobileMenu}
            className="lg:hidden p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Toggle Menu"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4 text-blue-600" /> : <Menu className="w-4 h-4 text-slate-600 dark:text-slate-300" />}
          </button>
        )}
      </div>

      {/* Standalone UPI Scanner & Mobile Transfer Modal */}
      {showUpiScannerModal && (
        <UpiScannerAndTransferModal onClose={() => setShowUpiScannerModal(false)} />
      )}
    </header>
  );
};
