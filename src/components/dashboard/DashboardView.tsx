import React from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Wallet,
  PiggyBank,
  ShieldCheck,
  TrendingUp,
  Layers,
  ArrowRight,
  Receipt,
  Sparkles,
  Plus,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { formatCurrency, formatDate } from '../../utils/currency.ts';
import { NavItemKey } from '../layout/Sidebar.tsx';

interface DashboardViewProps {
  onOpenAddIncome: () => void;
  onOpenAddExpense: () => void;
  onOpenTransfer: (fundId?: string) => void;
  onNavigate: (nav: NavItemKey) => void;
  onSelectIncomeDetail: (incomeId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAddIncome,
  onOpenAddExpense,
  onOpenTransfer,
  onNavigate,
  onSelectIncomeDetail,
}) => {
  const {
    funds,
    filteredSummary,
    filteredUnifiedTransactions,
    settings,
    unallocatedBalance,
    incomeTransactions,
    expenseTransactions,
  } = useFinance();

  // Calculate monthly stats for the last 6 months for trend chart
  const monthlyTrends = React.useMemo(() => {
    const months: { label: string; yearMonth: string; income: number; expense: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short' });

      let income = 0;
      let expense = 0;

      incomeTransactions.forEach((inc) => {
        if (inc.date.startsWith(yearMonth)) income += inc.amount;
      });

      expenseTransactions.forEach((exp) => {
        if (exp.date.startsWith(yearMonth)) expense += exp.amount;
      });

      months.push({ label, yearMonth, income, expense });
    }

    const maxVal = Math.max(1, ...months.map((m) => Math.max(m.income, m.expense)));
    return { months, maxVal };
  }, [incomeTransactions, expenseTransactions]);

  const recentTransactions = filteredUnifiedTransactions.slice(0, 6);

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      {/* 1. Mobile Fintech Wallet Hero Card (bKash / Revolut / Apple Card Style) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-6 shadow-xl border border-slate-800">
        {/* Subtle decorative background blur mesh */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between space-y-5">
          {/* Top Row: User & Wallet Label */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-600/80 border border-blue-400/30 flex items-center justify-center font-bold text-xs text-white shadow-inner">
                {settings.userName.charAt(0) || 'H'}
              </div>
              <div>
                <span className="text-[11px] text-blue-200/80 font-medium block">
                  {settings.businessName || 'Personal Wallet'}
                </span>
                <span className="text-xs font-bold text-white block">{settings.userName}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[11px] text-emerald-300 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Auto-Allocated</span>
            </div>
          </div>

          {/* Center Balance Display */}
          <div className="py-1">
            <span className="text-xs text-slate-300 font-medium uppercase tracking-wider block">
              Total Available Funds
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums tracking-tight text-white">
                {formatCurrency(filteredSummary.totalAvailableBalance, settings.currency)}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-300">
              <span className="flex items-center gap-1">
                <span className="text-slate-400">Savings:</span>
                <strong className="font-mono text-emerald-300">
                  {formatCurrency(filteredSummary.totalSavings, settings.currency)}
                </strong>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <span className="text-slate-400">Rate:</span>
                <strong className="font-mono text-blue-300">
                  {filteredSummary.netSavingsRate}%
                </strong>
              </span>
            </div>
          </div>

          {/* Quick Action Touch Circles (Natural Thumb Zone) */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/10">
            {/* Add Income */}
            <button
              onClick={onOpenAddIncome}
              className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform"
            >
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 group-hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-300 flex items-center justify-center transition-colors shadow-xs">
                <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-[11px] font-semibold text-slate-200">Income</span>
            </button>

            {/* Add Expense */}
            <button
              onClick={onOpenAddExpense}
              className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform"
            >
              <div className="w-11 h-11 rounded-2xl bg-rose-500/20 group-hover:bg-rose-500/30 border border-rose-400/30 text-rose-300 flex items-center justify-center transition-colors shadow-xs">
                <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-[11px] font-semibold text-slate-200">Expense</span>
            </button>

            {/* Transfer */}
            <button
              onClick={() => onOpenTransfer()}
              className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform"
            >
              <div className="w-11 h-11 rounded-2xl bg-blue-500/20 group-hover:bg-blue-500/30 border border-blue-400/30 text-blue-300 flex items-center justify-center transition-colors shadow-xs">
                <ArrowRightLeft className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-[11px] font-semibold text-slate-200">Transfer</span>
            </button>

            {/* Rules */}
            <button
              onClick={() => onNavigate('rules')}
              className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform"
            >
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 group-hover:bg-indigo-500/30 border border-indigo-400/30 text-indigo-300 flex items-center justify-center transition-colors shadow-xs">
                <Sliders className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-[11px] font-semibold text-slate-200">Rules</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Horizontal Scrollable Fund Cards (Mobile App Style) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Your Funds</h3>
            <span className="text-[11px] text-slate-400">({funds.length})</span>
          </div>
          <button
            onClick={() => onNavigate('funds')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
          >
            <span>See All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Horizontal Scroll on Mobile, Flex/Grid on Desktop */}
        <div className="flex gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {funds.map((fund) => {
            const spentRatio =
              fund.totalAllocated > 0
                ? Math.min(100, Math.round((fund.totalSpent / fund.totalAllocated) * 100))
                : 0;

            return (
              <div
                key={fund.id}
                onClick={() => onNavigate('funds')}
                className="min-w-[175px] sm:min-w-[190px] flex-1 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-400 transition-all cursor-pointer flex flex-col justify-between shrink-0"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: fund.color }}
                    />
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-mono font-bold text-[10px]">
                      {fund.allocationPercentage}%
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 truncate">{fund.name}</h4>
                  <span className="text-[11px] text-slate-400 capitalize block">
                    {fund.category}
                  </span>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100">
                  <span
                    className={`text-base font-bold font-mono tabular-nums block ${
                      fund.currentBalance < 0 ? 'text-rose-600' : 'text-slate-900'
                    }`}
                  >
                    {formatCurrency(fund.currentBalance, settings.currency)}
                  </span>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${spentRatio}%`,
                        backgroundColor: spentRatio > 90 ? '#ef4444' : fund.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Primary Stats 2-Column Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Income */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-slate-500 font-medium">Inflow</span>
            <div className="p-1 bg-emerald-50 text-emerald-600 rounded-lg">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-base font-bold font-mono tabular-nums text-slate-900 block truncate">
            {formatCurrency(filteredSummary.totalIncome, settings.currency)}
          </span>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-slate-500 font-medium">Outflow</span>
            <div className="p-1 bg-rose-50 text-rose-600 rounded-lg">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-base font-bold font-mono tabular-nums text-slate-900 block truncate">
            {formatCurrency(filteredSummary.totalExpenses, settings.currency)}
          </span>
        </div>

        {/* Emergency Fund Reserve */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-slate-500 font-medium">Emergency</span>
            <div className="p-1 bg-amber-50 text-amber-600 rounded-lg">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-base font-bold font-mono tabular-nums text-slate-900 block truncate">
            {formatCurrency(filteredSummary.emergencyFundBalance, settings.currency)}
          </span>
        </div>

        {/* Total Savings */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-slate-500 font-medium">Savings</span>
            <div className="p-1 bg-indigo-50 text-indigo-600 rounded-lg">
              <PiggyBank className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-base font-bold font-mono tabular-nums text-slate-900 block truncate">
            {formatCurrency(filteredSummary.totalSavings, settings.currency)}
          </span>
        </div>
      </div>

      {/* 4. Monthly Inflow vs Outflow Mini Chart */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Monthly Cashflow</h3>
            <span className="text-[11px] text-slate-400">Past 6 months comparison</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-xs bg-emerald-500"></span>
              <span className="text-[11px]">In</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-xs bg-rose-500"></span>
              <span className="text-[11px]">Out</span>
            </div>
          </div>
        </div>

        {/* Interactive Responsive SVG Bar Chart */}
        <div className="h-36 flex items-end justify-between gap-2 pt-4 pb-1 border-b border-slate-100">
          {monthlyTrends.months.map((m) => {
            const incomeHeightPct = Math.round((m.income / monthlyTrends.maxVal) * 100);
            const expenseHeightPct = Math.round((m.expense / monthlyTrends.maxVal) * 100);

            return (
              <div key={m.yearMonth} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                <div className="w-full flex items-end justify-center gap-1 h-24">
                  <div
                    className="w-2.5 sm:w-3.5 bg-emerald-500 rounded-t-xs transition-all group-hover:bg-emerald-600"
                    style={{ height: `${Math.max(4, incomeHeightPct)}%` }}
                    title={`${m.label} Inflow: ${formatCurrency(m.income, settings.currency)}`}
                  />
                  <div
                    className="w-2.5 sm:w-3.5 bg-rose-500 rounded-t-xs transition-all group-hover:bg-rose-600"
                    style={{ height: `${Math.max(4, expenseHeightPct)}%` }}
                    title={`${m.label} Outflow: ${formatCurrency(m.expense, settings.currency)}`}
                  />
                </div>
                <span className="text-[10px] font-medium text-slate-500">{m.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Recent Mobile Activity Ledger (Tap List Rows) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
            <span className="text-[11px] text-slate-400">Transactions & allocations</span>
          </div>
          <button
            onClick={() => onNavigate('transactions')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No transactions in selected period
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentTransactions.map((tx) => {
              const isIncome = tx.type === 'income';
              const isExpense = tx.type === 'expense';

              return (
                <div
                  key={tx.id}
                  onClick={() => {
                    if (isIncome && tx.rawIncomeId) {
                      onSelectIncomeDetail(tx.rawIncomeId);
                    }
                  }}
                  className="py-3 flex items-center justify-between gap-3 active:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
                        isIncome
                          ? 'bg-emerald-50 text-emerald-600'
                          : isExpense
                          ? 'bg-rose-50 text-rose-600'
                          : 'bg-blue-50 text-blue-600'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownLeft className="w-5 h-5" />
                      ) : isExpense ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : (
                        <ArrowRightLeft className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{tx.title}</p>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <span>{formatDate(tx.date, settings.dateFormat)}</span>
                        {tx.fundName && (
                          <>
                            <span>·</span>
                            <span className="text-slate-600 font-medium truncate">
                              {tx.fundName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-bold font-mono tabular-nums block ${
                        isIncome
                          ? 'text-emerald-600'
                          : isExpense
                          ? 'text-rose-600'
                          : 'text-slate-700'
                      }`}
                    >
                      {isIncome ? '+' : isExpense ? '-' : ''}
                      {formatCurrency(tx.amount, settings.currency)}
                    </span>
                    {isIncome && tx.allocations && (
                      <span className="text-[10px] text-blue-600 font-medium block">
                        {tx.allocations.length} funds
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
