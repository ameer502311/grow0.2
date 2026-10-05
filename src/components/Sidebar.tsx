import React from 'react';
import { 
  LayoutDashboard, Wallet, TrendingUp, Calculator, Sparkles, 
  Newspaper, CreditCard, PieChart, ShieldAlert, Globe, Zap, Bot,
  Menu, X, Compass
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
    { id: 'future_finance', label: 'Future Finance', icon: Compass, badge: 'AI Sim' },
    { id: 'investments', label: 'Investments & Markets', icon: TrendingUp },
    { id: 'platforms', label: 'Connected Platforms', icon: Globe, badge: 'Verified' },
    { id: 'calculators', label: 'Calculators', icon: Calculator },
    { id: 'ai', label: 'GROW AI Assistant', icon: Sparkles, badge: 'AI' },
    { id: 'daily_command_center', label: 'Daily Command Center', icon: Zap },
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

  // Quick Mobile Bottom Bar Items (Psychology Trust & Flow)
  const mobileQuickItems: { id: ActiveTab; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'personal_finance', label: 'Finance', icon: Wallet },
    { id: 'smart_bills', label: 'Bills', icon: Zap },
    { id: 'investments', label: 'Invest', icon: TrendingUp },
    { id: 'ai', label: 'Assistant', icon: Sparkles },
  ];

  return (
    <>
      {/* 1. DESKTOP PERMANENT SIDEBAR (>= 1024px) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl justify-between sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto space-y-4 shadow-fintech-subtle transition-colors">
        <div className="space-y-1 w-full">
          <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
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
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-l-4 border-blue-600 dark:border-blue-500 font-bold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <span className={`ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                    active
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Informative Security & Compliance Card */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs shrink-0">
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-bold mb-1">
            <Sparkles className="w-4 h-4" />
            <span>GROW AI Security</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
            256-bit bank encryption and verified BBPS payment gateways active.
          </p>
        </div>
      </aside>

      {/* 2. MOBILE & TABLET SLIDE-OUT DRAWER (< 1024px) */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            onClick={() => setMobileOpen && setMobileOpen(false)}
            className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity animate-in fade-in"
          />

          {/* Drawer Content */}
          <div className="relative w-72 max-w-[85vw] h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between overflow-y-auto shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm">
                    G
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Grow 0.2</h3>
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-semibold">AI Wealth Platform</p>
                  </div>
                </div>
                <button 
                  onClick={() => setMobileOpen && setMobileOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
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
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-l-4 border-blue-600 dark:border-blue-500 font-bold'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
              <p className="font-semibold text-slate-800 dark:text-slate-200">{user.name}</p>
              <p className="text-[10px] text-slate-400">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. MOBILE BOTTOM NAVIGATION DOCK (< 1024px) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1 flex items-center justify-around shadow-lg safe-area-bottom">
        {mobileQuickItems.map((item) => {
          const Icon = item.icon;
          const active = isTabActive(item.id);
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                active 
                  ? 'text-blue-600 dark:text-blue-400 font-bold' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
              <span className="text-[10px] mt-0.5 leading-tight">{item.label}</span>
            </button>
          );
        })}

        {/* More Tabs Menu Button */}
        <button
          onClick={() => setMobileOpen && setMobileOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all"
        >
          <Menu className="w-4 h-4 text-slate-400" />
          <span className="text-[10px] mt-0.5 leading-tight">More</span>
        </button>
      </nav>
    </>
  );
};
