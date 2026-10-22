import React from 'react';
import {
  Calendar,
  Smartphone,
  Maximize2,
  ChevronDown,
  Bell,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { DateFilterRange } from '../../types/finance.ts';
import { NavItemKey } from './Sidebar.tsx';

import { isSupabaseConfigured } from '../../lib/supabase.ts';

interface MobileTopBarProps {
  activeNav: NavItemKey;
  onOpenDateFilter: () => void;
  phoneFrameMode: boolean;
  onTogglePhoneFrame: () => void;
  onNavigateToSettings: () => void;
}

export const MobileTopBar: React.FC<MobileTopBarProps> = ({
  activeNav,
  onOpenDateFilter,
  phoneFrameMode,
  onTogglePhoneFrame,
  onNavigateToSettings,
}) => {
  const { settings, dateFilter, setDateFilter } = useFinance();
  const isCloudConnected = isSupabaseConfigured();

  const navTitles: Record<NavItemKey, string> = {
    dashboard: 'Home',
    funds: 'Funds',
    income: 'Income',
    expenses: 'Expenses',
    transactions: 'Ledger',
    reports: 'Analytics',
    rules: 'Rules',
    settings: 'Settings',
  };

  const rangeLabels: Record<DateFilterRange, string> = {
    today: 'Today',
    this_week: 'This Week',
    this_month: 'This Month',
    this_year: 'This Year',
    custom: 'Custom',
    all: 'All Time',
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-2.5">
      <div className="flex items-center justify-between gap-2 max-w-md mx-auto">
        {/* Left: User Profile & App Wordmark */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
            {settings.userName.charAt(0) || 'H'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-medium tracking-tight uppercase block truncate">
                {navTitles[activeNav] || 'FundFlow'}
              </span>
              {/* Supabase status badge */}
              <button
                onClick={onNavigateToSettings}
                title={isCloudConnected ? 'Supabase Connected' : 'Local Storage Mode - Click to connect Supabase'}
                className={`flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-semibold transition-colors ${
                  isCloudConnected
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isCloudConnected ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                <span>{isCloudConnected ? 'Supabase' : 'Offline'}</span>
              </button>
            </div>
            <h2 className="text-xs font-bold text-slate-900 leading-tight truncate">
              {settings.userName}
            </h2>
          </div>
        </div>

        {/* Center / Right: Date Filter Badge & Phone Frame Switcher */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Date Range Selector Pill */}
          <div className="relative">
            <select
              value={dateFilter.range}
              onChange={(e) => setDateFilter({ ...dateFilter, range: e.target.value as DateFilterRange })}
              className="appearance-none pl-2.5 pr-6 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full text-[11px] font-semibold border-none focus:outline-hidden cursor-pointer"
            >
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="this_year">This Year</option>
              <option value="all">All Time</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Desktop Preview Frame Mode Switcher */}
          <button
            onClick={onTogglePhoneFrame}
            className="hidden md:flex p-1.5 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title={phoneFrameMode ? 'Switch to Fullscreen Responsive' : 'Switch to Phone Mockup Frame'}
          >
            {phoneFrameMode ? <Maximize2 className="w-4 h-4" /> : <Smartphone className="w-4 h-4 text-blue-600" />}
          </button>
        </div>
      </div>
    </header>
  );
};
