import React from 'react';
import { 
  LayoutDashboard, Wallet, TrendingUp, Calculator, Sparkles, 
  Newspaper, CreditCard, PieChart, ShieldAlert, Globe, Zap, Bot,
  Menu, X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ActiveTab } from '../types';

export type { ActiveTab };

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab,
  mobileOpen = false,
  setMobileOpen
}) => {
  const { user } = useApp();

  const navItems: { id: ActiveTab; label: string; icon: any; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'personal_finance', label: 'Personal Finance', icon: Wallet },
    { id: 'smart_bills', label: 'Bills & Recharge', icon: Zap, badge: 'BBPS' },
    { id: 'investments', label: 'Investments & Markets', icon: TrendingUp },
    { id: 'platforms', label: 'Platforms & GPay/Paytm', icon: Globe, badge: 'Groww' },
    { id: 'calculators', label: 'Calculators', icon: Calculator },
    { id: 'ai', label: 'AI Advisor & Health', icon: Sparkles, badge: 'GPT-4o' },
    { id: 'daily_command_center', label: 'Daily Command Center', icon: Zap, badge: 'Daily' },
    { id: 'market_news', label: 'Market News', icon: Newspaper },
    { id: 'loans', label: 'Loans & EMI', icon: CreditCard },
    { id: 'reports', label: 'Reports & Analytics', icon: PieChart },
  ];

  if (user.role === 'ADMIN') {
    navItems.push({ id: 'admin', label: 'Admin Portal', icon: ShieldAlert, badge: 'Admin' });
  }

  const handleSelectTab = (id: ActiveTab) => {
    setActiveTab(id);
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  const isTabActive = (id: ActiveTab) => {
    return activeTab === id || 
      (id === 'personal_finance' && activeTab === 'finance') || 
      (id === 'platforms' && activeTab === 'integrations');
  };

  // Quick Mobile Bottom Bar Items
  const mobileQuickItems: { id: ActiveTab; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'personal_finance', label: 'Finance', icon: Wallet },
    { id: 'smart_bills', label: 'Bills', icon: Zap },
    { id: 'investments', label: 'Invest', icon: TrendingUp },
    { id: 'ai', label: 'AI Advisor', icon: Sparkles },
  ];

  return (
    <>
      {/* 1. DESKTOP PERMANENT SIDEBAR (>= 1024px) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 shrink-0 glass-panel rounded-3xl border border-slate-800/70 bg-slate-950/70 p-4 justify-between sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto space-y-4 shadow-xl">
        <div className="space-y-1.5 w-full">
          <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            Navigation Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isTabActive(item.id);
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-500/5'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 text-xs shrink-0">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Grow 0.2 Pro</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Multi-platform wealth management & real-time analytics.
          </p>
        </div>
      </aside>

      {/* 2. MOBILE & TABLET SLIDE-OUT DRAWER (< 1024px) */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            onClick={() => setMobileOpen && setMobileOpen(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity animate-in fade-in"
          />

          {/* Drawer Content */}
          <div className="relative w-72 max-w-[85vw] h-full bg-slate-900 border-r border-slate-800 p-5 flex flex-col justify-between overflow-y-auto shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-sm">
                    G
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">Grow 0.2</h3>
                    <p className="text-[10px] text-emerald-400 uppercase font-semibold">AI Wealth Platform</p>
                  </div>
                </div>
                <button 
                  onClick={() => setMobileOpen && setMobileOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                  title="Close Navigation"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isTabActive(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        active
                          ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400">
              <p className="font-semibold text-slate-300">Signed in as {user.name}</p>
              <p className="text-[10px] text-slate-500">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. MOBILE BOTTOM NAVIGATION DOCK (< 1024px) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 px-2 py-1 flex items-center justify-around shadow-2xl safe-area-bottom">
        {mobileQuickItems.map((item) => {
          const Icon = item.icon;
          const active = isTabActive(item.id);
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                active 
                  ? 'text-emerald-400 font-bold scale-105' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span className="text-[10px] mt-0.5 leading-tight">{item.label}</span>
            </button>
          );
        })}

        {/* More Tabs Menu Button */}
        <button
          onClick={() => setMobileOpen && setMobileOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-400 hover:text-slate-200 transition-all"
        >
          <Menu className="w-4 h-4 text-slate-400" />
          <span className="text-[10px] mt-0.5 leading-tight">More</span>
        </button>
      </nav>
    </>
  );
};
