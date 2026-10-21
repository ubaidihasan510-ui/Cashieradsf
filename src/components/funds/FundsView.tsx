import React, { useState } from 'react';
import {
  Plus,
  ArrowRightLeft,
  Edit2,
  Trash2,
  History,
  Layers,
  CheckCircle,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  PiggyBank,
  TrendingUp,
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
  const [selectedFundHistory, setSelectedFundHistory] = useState<Fund | null>(null);

  // Total allocation percentage across all funds
  const totalAllocationPct = funds.reduce((acc, f) => acc + f.allocationPercentage, 0);

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

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Portfolio Architecture
          </span>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            Fund Balances & Allocation Rates
          </h2>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
            <span>
              Total Rules Sum:{' '}
              <strong
                className={`font-mono font-bold ${
                  totalAllocationPct === 100
                    ? 'text-emerald-600'
                    : totalAllocationPct > 100
                    ? 'text-rose-600'
                    : 'text-amber-600'
                }`}
              >
                {totalAllocationPct}%
              </strong>
            </span>
            <span>·</span>
            <span>{funds.length} Active Target Funds</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onOpenTransfer()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <ArrowRightLeft className="w-4 h-4 text-slate-600" />
            <span>Transfer Funds</span>
          </button>
          <button
            onClick={onOpenCreateFund}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Create New Fund</span>
          </button>
        </div>
      </div>

      {/* Allocation Rule Alert if not 100% */}
      {totalAllocationPct !== 100 && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
            totalAllocationPct < 100
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              {totalAllocationPct < 100
                ? `Total fund allocation is currently ${totalAllocationPct}%. Remaining ${
                    100 - totalAllocationPct
                  }% will stay in the Unallocated Cash balance for all future income.`
                : `Total fund allocation exceeds 100% (${totalAllocationPct}%). Please adjust fund percentages to reach exactly 100%.`}
            </span>
          </div>
        </div>
      )}

      {/* Unallocated Cash Card (if any balance exists) */}
      {unallocatedBalance > 0 && (
        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-amber-900 block">
              Unallocated Cash Reserve
            </span>
            <p className="text-xs text-amber-700">
              Income excluded from automatic distribution or unassigned percentages
            </p>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold font-mono tabular-nums text-amber-900 block">
              {formatCurrency(unallocatedBalance, settings.currency)}
            </span>
            <span className="text-[10px] text-amber-600 font-medium">Ready to allocate</span>
          </div>
        </div>
      )}

      {/* Fund Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {funds.map((fund) => {
          // Find recent transactions matching this fund
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
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-5 pb-3 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: fund.color }}
                    >
                      {fund.isEmergencyFund ? (
                        <ShieldCheck className="w-5 h-5" />
                      ) : fund.isSavingsFund ? (
                        <PiggyBank className="w-5 h-5" />
                      ) : (
                        <Layers className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 leading-tight">
                        {fund.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <span className="capitalize">{fund.category}</span>
                        {fund.allowOverdraft && (
                          <>
                            <span>·</span>
                            <span className="text-amber-600 font-medium">Overdraft OK</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Allocation Rate Badge */}
                  <div className="text-right">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md font-mono font-bold text-xs">
                      {fund.allocationPercentage}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Allocation Rate</span>
                  </div>
                </div>

                {fund.description && (
                  <p className="text-xs text-slate-500 line-clamp-1">{fund.description}</p>
                )}

                {/* Balance Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">
                      Total Allocated
                    </span>
                    <span className="text-xs font-bold font-mono text-slate-900 block truncate">
                      {formatCurrency(fund.totalAllocated, settings.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Total Spent</span>
                    <span className="text-xs font-bold font-mono text-rose-600 block truncate">
                      {formatCurrency(fund.totalSpent, settings.currency)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">Available</span>
                    <span
                      className={`text-sm font-bold font-mono tabular-nums block truncate ${
                        fund.currentBalance < 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {formatCurrency(fund.currentBalance, settings.currency)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span>Utilization Rate</span>
                    <span className="font-mono tabular-nums font-semibold">{spentRatio}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${spentRatio}%`,
                        backgroundColor: spentRatio > 85 ? '#ef4444' : fund.color,
                      }}
                    />
                  </div>
                </div>

                {/* Recent Transactions in Fund */}
                <div className="pt-1">
                  <span className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                    Recent Fund Activity:
                  </span>
                  {fundTransactions.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No recent transactions</p>
                  ) : (
                    <div className="space-y-1">
                      {fundTransactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between text-[11px] text-slate-600"
                        >
                          <span className="truncate max-w-[160px]">{tx.title}</span>
                          <span
                            className={`font-mono tabular-nums font-semibold shrink-0 ${
                              tx.type === 'expense' ? 'text-rose-600' : 'text-slate-800'
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
              </div>

              {/* Card Footer Actions */}
              <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onOpenAddExpenseForFund(fund.id)}
                    className="px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded transition-colors"
                  >
                    + Spend
                  </button>
                  <button
                    onClick={() => onOpenTransfer(fund.id)}
                    className="px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 rounded transition-colors"
                  >
                    Transfer
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditFund(fund)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200/60 transition-colors"
                    title="Edit Fund Settings"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setDeleteFundTarget(fund);
                      setDeleteError(null);
                      const other = funds.find((f) => f.id !== fund.id);
                      setTransferTargetId(other?.id || '');
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-200/60 transition-colors"
                    title="Delete Fund"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Fund Confirmation Modal with Balance Sweep option */}
      {deleteFundTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl p-5 max-w-md w-full shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h4 className="font-bold text-sm text-slate-900">
                Delete "{deleteFundTarget.name}" Fund?
              </h4>
            </div>

            {deleteError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700">
                {deleteError}
              </div>
            )}

            {deleteFundTarget.currentBalance !== 0 ? (
              <div className="space-y-3 text-xs">
                <p className="text-slate-600">
                  This fund has an active balance of{' '}
                  <strong className="font-mono text-slate-900">
                    {formatCurrency(deleteFundTarget.currentBalance, settings.currency)}
                  </strong>
                  . You must select a destination fund to transfer this remaining balance to before
                  deletion:
                </p>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Transfer Remaining Balance To:
                  </label>
                  <select
                    value={transferTargetId}
                    onChange={(e) => setTransferTargetId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-medium"
                  >
                    {funds
                      .filter((f) => f.id !== deleteFundTarget.id)
                      .map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({formatCurrency(f.currentBalance, settings.currency)})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600">
                Are you sure you want to delete this fund? Its historical transaction references will
                remain preserved in your audit logs.
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeleteFundTarget(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubmit}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors"
              >
                Confirm Delete & Sweep
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
