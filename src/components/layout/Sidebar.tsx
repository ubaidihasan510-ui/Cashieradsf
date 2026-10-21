import React from 'react';
import {
  LayoutDashboard,
  ArrowDownLeft,
  ArrowUpRight,
  Layers,
  ReceiptText,
  BarChart3,
  Sliders,
  Settings,
  ShieldCheck,
  PiggyBank,
  ChevronLeft,
  ChevronRight,
  Menu,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { formatCurrency } from '../../utils/currency.ts';

export type NavItemKey =
  | 'dashboard'
  | 'income'
  | 'expenses'
  | 'funds'
  | 'transactions'
  | 'reports'
  | 'rules'
  | 'settings';

interface SidebarProps {
  activeNav: NavItemKey;
  onSelectNav: (key: NavItemKey) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeNav,
  onSelectNav,
  isMobileOpen,
  setIsMobileOpen,
  isCollapsed,
  setIsCollapsed,
}) => {
  const { filteredSummary, settings } = useFinance();

  const navItems: { key: NavItemKey; label: string; icon: React.FC<{ className?: string }> }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'income', label: 'Income', icon: ArrowDownLeft },
    { key: 'expenses', label: 'Expenses', icon: ArrowUpRight },
    { key: 'funds', label: 'My Funds', icon: Layers },
    { key: 'transactions', label: 'Transactions', icon: ReceiptText },
    { key: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { key: 'rules', label: 'Allocation Rules', icon: Sliders },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 md:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen bg-white border-r border-slate-200 transition-all duration-300 flex flex-col justify-between ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-20' : 'md:w-64'} w-64`}
      >
        {/* Top: Brand Wordmark */}
        <div>
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
            <div
              onClick={() => {
                onSelectNav('dashboard');
                setIsMobileOpen(false);
              }}
              className="flex items-center gap-2.5 cursor-pointer overflow-hidden"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs">
                FF
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden">
                  <span className="font-bold text-base text-slate-900 tracking-tight block truncate">
                    FundFlow
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase block">
                    Smart Allocator
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    onSelectNav(item.key);
                    setIsMobileOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  title={item.label}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Total Balance Indicator & User info */}
        <div className="p-4 border-t border-slate-100">
          {!isCollapsed ? (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/60 mb-3 space-y-1">
              <span className="text-[11px] text-slate-500 font-medium block">
                Total Available Funds
              </span>
              <span className="text-base font-bold font-mono tabular-nums text-slate-900 block truncate">
                {formatCurrency(filteredSummary.totalAvailableBalance, settings.currency)}
              </span>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Savings Rate:</span>
                <span className="font-mono tabular-nums font-semibold text-emerald-600">
                  {filteredSummary.netSavingsRate}%
                </span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-2">
              <div
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-mono font-bold"
                title={`Available: ${formatCurrency(
                  filteredSummary.totalAvailableBalance,
                  settings.currency
                )}`}
              >
                {settings.currency === 'BDT' ? '৳' : '$'}
              </div>
            </div>
          )}

          {/* User profile row */}
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                {settings.userName.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <span className="text-xs font-semibold text-slate-800 block truncate">
                  {settings.userName}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {settings.currency} Profile
                </span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                {settings.userName.charAt(0) || 'U'}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
