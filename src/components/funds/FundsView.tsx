import React, { useState, useMemo } from 'react';
import {
  Plus,
  ArrowRightLeft,
  Edit2,
  Trash2,
  Layers,
  AlertTriangle,
  ShieldCheck,
  PiggyBank,
  TrendingUp,
  Briefcase,
  User,
  Megaphone,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  Info,
  CheckCircle2,
  X,
  CreditCard,
  PieChart,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { formatCurrency, formatDate } from '../../utils/currency.ts';
import { Fund } from '../../types/finance.ts';

interface FundsViewProps {
  onOpenCreateFund: () => void;
  onEditFund: (fund: Fund) => void;
  onOpenTransfer: (fromFundId?: string) => void;
  onOpenAddExpenseForFund: (fundId: string) => void;
}

type FundCategoryFilter = 'all' | 'savings' | 'business' | 'expenses';

export const FundsView: React.FC<FundsViewProps> = ({
  onOpenCreateFund,
  onEditFund,
  onOpenTransfer,
  onOpenAddExpenseForFund,
}) => {
  const { funds, deleteFund, unifiedTransactions, settings, unallocatedBalance } = useFinance();

  const [deleteFundTarget, setDeleteFundTarget] = useState<Fund | null>(null);
  const [transferTargetId, setTransferTargetId] = useState<string>('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<FundCategoryFilter>('all');
  const [expandedFundId, setExpandedFundId] = useState<string | null>(null);

  // Total allocation percentage across all funds
  const totalAllocationPct = useMemo(
    () => funds.reduce((acc, f) => acc + f.allocationPercentage, 0),
    [funds]
  );

  // Total available money across all funds
  const totalFundsBalance = useMemo(
    () => funds.reduce((acc, f) => acc + f.currentBalance, 0),
    [funds]
  );

  // Filtered funds based on selected category tab
  const filteredFunds = useMemo(() => {
    if (categoryFilter === 'all') return funds;
    return funds.filter((f) => f.category === categoryFilter);
  }, [funds, categoryFilter]);

  const handleDeleteSubmit = () => {
    if (!deleteFundTarget) return;
    setDeleteError(null);

    const res = deleteFund(deleteFundTarget.id, transferTargetId || undefined);
    if (!res.success) {
      setDeleteError(res.error || 'Failed to delete fund');
      return;
    }
    setDeleteFundTarget(null);
  };

  const getFundIcon = (fund: Fund) => {
    if (fund.isEmergencyFund) return <ShieldCheck className="w-5 h-5" />;
    if (fund.isSavingsFund) return <PiggyBank className="w-5 h-5" />;
    if (fund.category === 'business') return <Briefcase className="w-5 h-5" />;
    if (fund.category === 'savings') return <TrendingUp className="w-5 h-5" />;
    if (fund.category === 'expenses') return <User className="w-5 h-5" />;
    return <Layers className="w-5 h-5" />;
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* 1. Mobile Overview Card (Fintech Wallet Architecture) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-5 shadow-lg border border-slate-700/80">
        {/* Soft background accents */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-400/30">
                <PieChart className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300/90 block">
                  Fund Portfolio
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  {funds.length} Active Automatic Funds
                </span>
              </div>
            </div>

            {/* Total Allocation Badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                totalAllocationPct === 100
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : totalAllocationPct > 100
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {totalAllocationPct === 100 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>{totalAllocationPct}% Allocated</span>
            </div>
          </div>

          {/* Large Portfolio Total Balance */}
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Total Balance in Funds</span>
            <div className="text-3xl font-extrabold font-mono tabular-nums tracking-tight text-white mt-0.5">
              {formatCurrency(totalFundsBalance, settings.currency)}
            </div>
          </div>

          {/* Segmented Visual Allocation Bar */}
          <div className="space-y-1.5">
            <div className="h-2.5 w-full bg-slate-800/80 rounded-full flex overflow-hidden p-0.5 gap-0.5">
              {funds.map((f) => (
                <div
                  key={f.id}
                  className="h-full rounded-xs transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                  style={{
                    width: `${Math.max(2, f.allocationPercentage)}%`,
                    backgroundColor: f.color,
                  }}
                  title={`${f.name}: ${f.allocationPercentage}%`}
                />
              ))}
              {totalAllocationPct < 100 && (
                <div
                  className="h-full bg-amber-400/40 rounded-r-full"
                  style={{ width: `${100 - totalAllocationPct}%` }}
                  title={`Unallocated: ${100 - totalAllocationPct}%`}
                />
              )}
            </div>

            {/* Legend info */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
              <span className="truncate max-w-[200px]">
                {funds.length > 0 ? `${funds[0].name} (${funds[0].allocationPercentage}%) + ${funds.length - 1} more` : 'No funds'}
              </span>
              <span>
                {totalAllocationPct === 100
                  ? '100% Rules Ready'
                  : `${100 - totalAllocationPct}% Unallocated`}
              </span>
            </div>
          </div>

          {/* Quick Action Touch Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={onOpenCreateFund}
              className="flex items-center justify-center gap-2 py-2.5 px-3 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Create Fund</span>
            </button>
            <button
              onClick={() => onOpenTransfer()}
              className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white/10 hover:bg-white/15 active:scale-95 text-white font-bold text-xs rounded-xl border border-white/10 transition-all cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4 stroke-[2.5] text-blue-300" />
              <span>Transfer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Allocation Rule Alert Notice if not 100% */}
      {totalAllocationPct !== 100 && (
        <div
          className={`p-3 rounded-2xl border flex items-center justify-between text-xs shadow-xs ${
            totalAllocationPct < 100
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-900'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span className="text-[11px] font-medium leading-relaxed">
              {totalAllocationPct < 100
                ? `ফান্ডের মোট পারসেন্টেজ ${totalAllocationPct}%। বাকি ${100 - totalAllocationPct}% আন-অ্যালোকেটেড ক্যাশ হিসেবে থাকবে।`
                : `ফান্ডের মোট পারসেন্টেজ ১০০% এর বেশি (${totalAllocationPct}%) হয়েছে! দয়া করে ঠিক করুন।`}
            </span>
          </div>
        </div>
      )}

      {/* Unallocated Cash Card (if balance > 0) */}
      {unallocatedBalance > 0 && (
        <div className="p-3.5 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/30 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-950 block">Unallocated Cash Reserve</span>
              <p className="text-[11px] text-amber-800">Income excluded from automatic distribution</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-sm font-extrabold font-mono tabular-nums text-amber-950 block">
              {formatCurrency(unallocatedBalance, settings.currency)}
            </span>
            <span className="text-[10px] text-amber-700 font-semibold">Available</span>
          </div>
        </div>
      )}

      {/* 2. Mobile Category Filter Pills (Horizontal Scroll) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {(
          [
            { key: 'all', label: `All (${funds.length})` },
            { key: 'savings', label: 'Savings & Goals' },
            { key: 'business', label: 'Business' },
            { key: 'expenses', label: 'Expenses' },
          ] as { key: FundCategoryFilter; label: string }[]
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setCategoryFilter(tab.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap active:scale-95 transition-all cursor-pointer ${
              categoryFilter === tab.key
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/90'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Mobile Fund Cards List */}
      <div className="space-y-3">
        {filteredFunds.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">No funds found in this category</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Create a fund or select "All" to view all active funds.
              </p>
            </div>
            <button
              onClick={onOpenCreateFund}
              className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              + Create Fund
            </button>
          </div>
        ) : (
          filteredFunds.map((fund) => {
            const isExpanded = expandedFundId === fund.id;
            const fundTransactions = unifiedTransactions
              .filter((tx) => tx.fundId === fund.id || tx.relatedFundName === fund.name)
              .slice(0, 3);

            const spentRatio =
              fund.totalAllocated > 0
                ? Math.min(100, Math.round((fund.totalSpent / fund.totalAllocated) * 100))
                : 0;

            return (
              <div
                key={fund.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden"
              >
                {/* Main Tap Area */}
                <div className="p-4 space-y-3">
                  {/* Top Header: Icon, Name & Allocation Percentage Pill */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Fund Circle Icon */}
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: fund.color }}
                      >
                        {getFundIcon(fund)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-sm text-slate-900 truncate">
                            {fund.name}
                          </h3>
                          {fund.isEmergencyFund && (
                            <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-100 text-amber-800 rounded">
                              Emergency
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span className="capitalize font-medium text-slate-500">{fund.category}</span>
                          {fund.allowOverdraft && (
                            <>
                              <span>•</span>
                              <span className="text-amber-600 font-semibold">Overdraft Active</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Allocation Percentage Pill */}
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200/70">
                        <span className="text-[10px] text-slate-500 font-medium">Inflow</span>
                        <span className="font-mono font-bold text-xs text-slate-900">
                          {fund.allocationPercentage}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Primary Balance Display (Big & Bold for Mobile) */}
                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                        Available Balance
                      </span>
                      <div
                        className={`text-2xl font-extrabold font-mono tabular-nums tracking-tight mt-0.5 ${
                          fund.currentBalance < 0
                            ? 'text-rose-600'
                            : fund.currentBalance === 0
                            ? 'text-slate-800'
                            : 'text-emerald-600'
                        }`}
                      >
                        {formatCurrency(fund.currentBalance, settings.currency)}
                      </div>
                    </div>

                    {/* Secondary Metrics */}
                    <div className="text-right text-[11px] text-slate-500 space-y-0.5">
                      <div>
                        <span>Allocated: </span>
                        <strong className="font-mono text-slate-800">
                          {formatCurrency(fund.totalAllocated, settings.currency)}
                        </strong>
                      </div>
                      <div>
                        <span>Spent: </span>
                        <strong className="font-mono text-rose-600">
                          {formatCurrency(fund.totalSpent, settings.currency)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Utilization Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span>Spent: {spentRatio}%</span>
                      <span>
                        {fund.currentBalance > 0
                          ? `Remaining: ${formatCurrency(fund.currentBalance, settings.currency)}`
                          : 'Zero balance'}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${spentRatio}%`,
                          backgroundColor: spentRatio > 90 ? '#ef4444' : fund.color,
                        }}
                      />
                    </div>
                  </div>

                  {/* Description if any */}
                  {fund.description && (
                    <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                      "{fund.description}"
                    </p>
                  )}
                </div>

                {/* Collapsible Recent Transactions Drawer */}
                {isExpanded && (
                  <div className="px-4 py-3 bg-slate-50/90 border-t border-slate-100 space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      Recent Activity in {fund.name}
                    </span>
                    {fundTransactions.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-1">
                        No transactions recorded for this fund yet.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {fundTransactions.map((tx) => (
                          <div
                            key={tx.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/60 text-xs"
                          >
                            <div className="min-w-0 pr-2">
                              <span className="font-semibold text-slate-800 truncate block">
                                {tx.title}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {formatDate(tx.date, settings.dateFormat)} · {tx.category}
                              </span>
                            </div>
                            <span
                              className={`font-mono font-bold shrink-0 ${
                                tx.type === 'expense' ? 'text-rose-600' : 'text-emerald-600'
                              }`}
                            >
                              {tx.type === 'expense' ? '-' : '+'}
                              {formatCurrency(tx.amount, settings.currency)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Mobile Bottom Action Pill Bar */}
                <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    {/* Add Expense from this fund */}
                    <button
                      onClick={() => onOpenAddExpenseForFund(fund.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl active:scale-95 transition-all cursor-pointer"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Spend</span>
                    </button>

                    {/* Transfer out of this fund */}
                    <button
                      onClick={() => onOpenTransfer(fund.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl active:scale-95 transition-all cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Transfer</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Activity Toggle */}
                    <button
                      onClick={() => setExpandedFundId(isExpanded ? null : fund.id)}
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 rounded-xl transition-colors active:scale-95 cursor-pointer"
                      title={isExpanded ? 'Hide Activity' : 'View Activity'}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {/* Edit Fund Settings */}
                    <button
                      onClick={() => onEditFund(fund)}
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 rounded-xl transition-colors active:scale-95 cursor-pointer"
                      title="Edit Fund"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Fund */}
                    <button
                      onClick={() => {
                        setDeleteFundTarget(fund);
                        setDeleteError(null);
                        const other = funds.find((f) => f.id !== fund.id);
                        setTransferTargetId(other?.id || '');
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors active:scale-95 cursor-pointer"
                      title="Delete Fund"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Delete Fund Mobile Bottom Sheet (Native Mobile Dialog) */}
      {deleteFundTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in slide-in-from-bottom duration-200">
            {/* Mobile Sheet Drag Handle */}
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto sm:hidden" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-rose-600">
                <div className="w-9 h-9 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Delete "{deleteFundTarget.name}"
                  </h4>
                  <span className="text-[11px] text-slate-500">Fund Deletion Confirmation</span>
                </div>
              </div>

              <button
                onClick={() => setDeleteFundTarget(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {deleteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium">
                {deleteError}
              </div>
            )}

            {deleteFundTarget.currentBalance !== 0 ? (
              <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <p className="text-slate-600 leading-relaxed">
                  এই ফান্ডে বর্তমানে{' '}
                  <strong className="font-mono text-slate-900 font-bold">
                    {formatCurrency(deleteFundTarget.currentBalance, settings.currency)}
                  </strong>{' '}
                  ব্যালেন্স রয়েছে। ফান্ডটি ডিলিট করার আগে অবশিষ্ট ব্যালেন্স অন্য ফান্ডে ট্রান্সফার (Sweep) করতে হবে:
                </p>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Select Target Fund to Transfer Balance:
                  </label>
                  <select
                    value={transferTargetId}
                    onChange={(e) => setTransferTargetId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    {funds
                      .filter((f) => f.id !== deleteFundTarget.id)
                      .map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} (Current: {formatCurrency(f.currentBalance, settings.currency)})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed">
                আপনি কি নিশ্চিত যে আপনি এই ফান্ডটি মুছে ফেলতে চান? পূর্বের ট্রানজেকশনের অডিট হিস্টোরি সংরক্ষিত থাকবে।
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeleteFundTarget(null)}
                className="w-full py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubmit}
                className="w-full py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl shadow-md transition-all cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
