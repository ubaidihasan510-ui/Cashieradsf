import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Edit2,
  Eye,
  ArrowDownLeft,
  Layers,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { formatCurrency, formatDate } from '../../utils/currency.ts';
import { IncomeTransaction } from '../../types/finance.ts';

interface IncomeViewProps {
  onOpenAddIncome: () => void;
  onEditIncome: (income: IncomeTransaction) => void;
  onViewAllocations: (income: IncomeTransaction) => void;
}

export const IncomeView: React.FC<IncomeViewProps> = ({
  onOpenAddIncome,
  onEditIncome,
  onViewAllocations,
}) => {
  const { incomeTransactions, deleteIncome, settings } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredIncomes = useMemo(() => {
    return incomeTransactions.filter((inc) => {
      if (selectedSource !== 'all' && inc.source !== selectedSource) return false;
      if (selectedCategory !== 'all' && inc.category !== selectedCategory) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = inc.source.toLowerCase().includes(q);
        const matchCat = inc.category.toLowerCase().includes(q);
        const matchDesc = inc.description?.toLowerCase().includes(q);
        const matchMethod = inc.paymentMethod.toLowerCase().includes(q);
        return matchTitle || matchCat || matchDesc || matchMethod;
      }
      return true;
    });
  }, [incomeTransactions, selectedSource, selectedCategory, searchQuery]);

  const totalFilteredAmount = useMemo(() => {
    return filteredIncomes.reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredIncomes]);

  const exportCsv = () => {
    const headers = [
      'Date',
      'Source',
      'Category',
      'Amount',
      'Currency',
      'Payment Method',
      'Allocation Rule',
      'Allocated Breakdown',
      'Unallocated',
      'Notes',
    ];

    const rows = filteredIncomes.map((inc) => [
      inc.date,
      `"${inc.source}"`,
      `"${inc.category}"`,
      (inc.amount / 100).toFixed(2),
      settings.currency,
      `"${inc.paymentMethod}"`,
      `"${inc.ruleName || ''}"`,
      `"${inc.allocations.map((a) => `${a.fundName}: ${(a.amount / 100).toFixed(2)}`).join('; ')}"`,
      (inc.unallocatedAmount / 100).toFixed(2),
      `"${(inc.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FundFlow_Income_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header bar with total and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Inflow Management
          </span>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            Income Records & Fund Allocation
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Total Inflow:{' '}
            <strong className="font-mono tabular-nums text-slate-900">
              {formatCurrency(totalFilteredAmount, settings.currency)}
            </strong>{' '}
            across {filteredIncomes.length} transaction{filteredIncomes.length === 1 ? '' : 's'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportCsv}
            disabled={filteredIncomes.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenAddIncome}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Record Income</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by source, note, or category..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter by Source */}
          <div>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-hidden focus:bg-white"
            >
              <option value="all">All Income Sources</option>
              {settings.incomeSources.map((s) => (
                <option key={s} value={s}>
                  Source: {s}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Category */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-hidden focus:bg-white"
            >
              <option value="all">All Income Categories</option>
              {settings.incomeCategories.map((c) => (
                <option key={c} value={c}>
                  Category: {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Income Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredIncomes.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <ArrowDownLeft className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No income records found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || selectedSource !== 'all'
                ? 'Try clearing the search query or changing your source filter.'
                : 'Start tracking your inflow by recording your first income entry.'}
            </p>
            <button
              onClick={onOpenAddIncome}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Record First Income
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Source & Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Fund Distribution</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIncomes.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Date */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-medium">
                      {formatDate(inc.date, settings.dateFormat)}
                    </td>

                    {/* Source & Description */}
                    <td className="py-3 px-4 max-w-xs">
                      <span className="font-bold text-slate-900 block truncate">{inc.source}</span>
                      {inc.description ? (
                        <span className="text-[11px] text-slate-500 block truncate">
                          {inc.description}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">No notes</span>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-slate-700 font-medium">{inc.category}</span>
                    </td>

                    {/* Payment Method */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                      {inc.paymentMethod}
                    </td>

                    {/* Fund Distribution Breakdown Pill / Button */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {inc.isExcludedFromAllocation ? (
                        <span className="text-xs text-amber-700 font-medium">
                          Unallocated (Excluded)
                        </span>
                      ) : (
                        <button
                          onClick={() => onViewAllocations(inc)}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md font-medium text-xs transition-colors"
                          title="Click to view full distribution breakdown"
                        >
                          <Layers className="w-3.5 h-3.5 text-blue-600" />
                          <span>{inc.allocations.length} Funds Distributed</span>
                        </button>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 whitespace-nowrap text-right font-mono tabular-nums font-bold text-emerald-600 text-sm">
                      +{formatCurrency(inc.amount, settings.currency)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onViewAllocations(inc)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100 transition-colors"
                          title="View Audit Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEditIncome(inc)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
                          title="Edit Income"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(inc.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors"
                          title="Delete Income"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full shadow-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2.5 text-rose-600">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h4 className="font-bold text-sm text-slate-900">Delete Income Record?</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will safely reverse and remove all corresponding fund allocations from your fund
              balances. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteIncome(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors"
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
