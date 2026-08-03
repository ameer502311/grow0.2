import React from 'react';
import { 
  LayoutDashboard, Wallet, TrendingUp, Calculator, Sparkles, 
  Newspaper, CreditCard, PieChart, ShieldAlert, Globe, Zap
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ActiveTab } from '../types';

export type { ActiveTab };

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useApp();

  const navItems: { id: ActiveTab; label: string; icon: any; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'personal_finance', label: 'Personal Finance', icon: Wallet },
    { id: 'investments', label: 'Investments & Markets', icon: TrendingUp },
    { id: 'platforms', label: 'Platforms & GPay/Paytm', icon: Globe, badge: 'GPay/Groww' },
    { id: 'calculators', label: 'Calculators', icon: Calculator },
    { id: 'ai', label: 'AI Advisor & Health', icon: Sparkles, badge: 'AI 0-100' },
    { id: 'news', label: 'Financial News', icon: Newspaper },
    { id: 'loans', label: 'Loans & EMI', icon: CreditCard },
    { id: 'reports', label: 'Reports & Analytics', icon: PieChart },
  ];

  if (user.role === 'ADMIN') {
    navItems.push({ id: 'admin', label: 'Admin Portal', icon: ShieldAlert, badge: 'Admin' });
  }

  return (
    <aside className="w-full lg:w-64 glass-panel border-r border-slate-800/60 bg-slate-950/60 p-4 flex flex-row lg:flex-col justify-between overflow-x-auto lg:overflow-y-auto">
      <div className="space-y-1.5 w-full flex lg:flex-col flex-row gap-2 lg:gap-1.5">
        <div className="hidden lg:block px-3 py-2 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
          Navigation Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || (item.id === 'personal_finance' && activeTab === 'finance') || (item.id === 'platforms' && activeTab === 'integrations');
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-500/5'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
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

      <div className="hidden lg:block p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 text-xs">
        <div className="flex items-center space-x-2 text-emerald-400 font-bold mb-1">
          <Sparkles className="w-4 h-4" />
          <span>Grow 0.2 Pro</span>
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          GPay, Paytm, Groww, SafeGold & Aura Gold integrations active.
        </p>
      </div>
    </aside>
  );
};
