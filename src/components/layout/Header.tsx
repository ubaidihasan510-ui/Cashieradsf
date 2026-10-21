import React from 'react';
import { Plus, ArrowDownLeft, ArrowUpRight, Calendar, SlidersHorizontal } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { DateFilterRange } from '../../types/finance.ts';

interface HeaderProps {
  onOpenAddIncome: () => void;
  onOpenAddExpense: () => void;
  activeNav: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAddIncome,
  onOpenAddExpense,
  activeNav,
}) => {
  const { dateFilter, setDateFilter, settings } = useFinance();

  const handleRangeChange = (range: DateFilterRange) => {
    setDateFilter({ ...dateFilter, range });
  };

  const navTitles: Record<string, string> = {
    dashboard: 'Dashboard Overview',
    income: 'Income & Inflow',
    expenses: 'Expense Management',
    funds: 'Fund Allocations',
    transactions: 'Transaction History',
    reports: 'Reports & Analytics',
    rules: 'Allocation Rules',
    settings: 'Settings & Preferences',
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Zone 1: Brand & Page Context */}
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight whitespace-nowrap truncate">
          {navTitles[activeNav] || 'FundFlow'}
        </h1>
        <span className="hidden md:inline text-slate-300">/</span>
        <span className="hidden md:inline text-xs text-slate-500 whitespace-nowrap">
          {settings.businessName || 'Personal & Business Finance'}
        </span>
      </div>

      {/* Zone 2: Date Filter Bar (Segmented / Select) */}
      <div className="flex items-center gap-2">
        <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium text-slate-600">
          {(
            [
              { id: 'today', label: 'Today' },
              { id: 'this_week', label: 'Week' },
              { id: 'this_month', label: 'Month' },
              { id: 'this_year', label: 'Year' },
              { id: 'all', label: 'All Time' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => handleRangeChange(item.id)}
              className={`px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
                dateFilter.range === item.id
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Mobile / Compact Date Selector */}
        <select
          value={dateFilter.range}
          onChange={(e) => handleRangeChange(e.target.value as DateFilterRange)}
          className="lg:hidden px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
        >
          <option value="today">Today</option>
          <option value="this_week">This Week</option>
          <option value="this_month">This Month</option>
          <option value="this_year">This Year</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Zone 3: Primary Fast Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={onOpenAddIncome}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors whitespace-nowrap"
        >
          <ArrowDownLeft className="w-4 h-4 text-white" />
          <span>Add Income</span>
        </button>

        <button
          onClick={onOpenAddExpense}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
        >
          <ArrowUpRight className="w-4 h-4 text-rose-600" />
          <span>Add Expense</span>
        </button>
      </div>
    </header>
  );
};
