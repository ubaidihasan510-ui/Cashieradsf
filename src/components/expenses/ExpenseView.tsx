import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Edit2,
  ArrowUpRight,
  AlertTriangle,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { formatCurrency, formatDate } from '../../utils/currency.ts';
import { ExpenseTransaction } from '../../types/finance.ts';

interface ExpenseViewProps {
  onOpenAddExpense: () => void;
  onEditExpense: (expense: ExpenseTransaction) => void;
}

export const ExpenseView: React.FC<ExpenseViewProps> = ({
  onOpenAddExpense,
  onEditExpense,
}) => {
  const { expenseTransactions, deleteExpense, funds, settings } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFundId, setSelectedFundId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredExpenses = useMemo(() => {
    return expenseTransactions.filter((exp) => {
      if (selectedFundId !== 'all' && exp.fundId !== selectedFundId) return false;
      if (selectedCategory !== 'all' && exp.category !== selectedCategory) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = exp.title.toLowerCase().includes(q);
        const matchCat = exp.category.toLowerCase().includes(q);
        const matchFund = exp.fundName.toLowerCase().includes(q);
        const matchDesc = exp.description?.toLowerCase().includes(q);
        return matchTitle || matchCat || matchFund || matchDesc;
      }
      return true;
    });
  }, [expenseTransactions, selectedFundId, selectedCategory, searchQuery]);

  const totalFilteredAmount = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredExpenses]);

  // Breakdown of expenses by category for quick insights
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach((exp) => {
      map[exp.category] = (map[exp.category] || 0) + exp.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses]);

  const exportCsv = () => {
    const headers = [
      'Date',
      'Title',
      'Category',
      'Deducted Fund',
      'Amount',
      'Currency',
      'Payment Method',
      'Description',
    ];

    const rows = filteredExpenses.map((exp) => [
      exp.date,
      `"${exp.title.replace(/"/g, '""')}"`,
      `"${exp.category}"`,
      `"${exp.fundName}"`,
      (exp.amount / 100).toFixed(2),
      settings.currency,
      `"${exp.paymentMethod}"`,
      `"${(exp.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FundFlow_Expenses_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header bar with total and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">
            Outflow Management
          </span>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            Expenses & Fund Deductions
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Total Spent:{' '}
            <strong className="font-mono tabular-nums text-slate-900">
              {formatCurrency(totalFilteredAmount, settings.currency)}
            </strong>{' '}
            across {filteredExpenses.length} expense record{filteredExpenses.length === 1 ? '' : 's'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportCsv}
            disabled={filteredExpenses.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenAddExpense}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Quick Category Spend Bar if expenses exist */}
      {categoryBreakdown.length > 0 && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800">Top Expense Categories</span>
            <span className="text-[11px] text-slate-400">
              {categoryBreakdown.length} active categor{categoryBreakdown.length === 1 ? 'y' : 'ies'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {categoryBreakdown.slice(0, 5).map(([cat, amt]) => {
              const pct = totalFilteredAmount > 0 ? Math.round((amt / totalFilteredAmount) * 100) : 0;
              return (
                <div
                  key={cat}
                  className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                >
                  <span className="font-medium text-slate-700">{cat}</span>
                  <span className="text-slate-400">·</span>
                  <span className="font-mono tabular-nums font-bold text-slate-900">
                    {formatCurrency(amt, settings.currency)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
              placeholder="Search expenses by title or note..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Filter by Fund */}
          <div>
            <select
              value={selectedFundId}
              onChange={(e) => setSelectedFundId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-hidden focus:bg-white"
            >
              <option value="all">All Funds</option>
              {funds.map((f) => (
                <option key={f.id} value={f.id}>
                  Fund: {f.name}
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
              <option value="all">All Expense Categories</option>
              {settings.expenseCategories.map((c) => (
                <option key={c} value={c}>
                  Category: {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Expense Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <ArrowUpRight className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No expense records found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || selectedFundId !== 'all'
                ? 'Try clearing the search query or changing your fund filter.'
                : 'No expenses have been recorded yet.'}
            </p>
            <button
              onClick={onOpenAddExpense}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
            >
              Record First Expense
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Expense Title & Memo</th>
                  <th className="py-3 px-4">Deducted From Fund</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Date */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-medium">
                      {formatDate(exp.date, settings.dateFormat)}
                    </td>

                    {/* Title & Memo */}
                    <td className="py-3 px-4 max-w-xs">
                      <span className="font-bold text-slate-900 block truncate">{exp.title}</span>
                      {exp.description ? (
                        <span className="text-[11px] text-slate-500 block truncate">
                          {exp.description}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">No notes</span>
                      )}
                    </td>

                    {/* Fund */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded font-semibold text-xs inline-block">
                        {exp.fundName}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-slate-700 font-medium">{exp.category}</span>
                    </td>

                    {/* Payment Method */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                      {exp.paymentMethod}
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 whitespace-nowrap text-right font-mono tabular-nums font-bold text-rose-600 text-sm">
                      -{formatCurrency(exp.amount, settings.currency)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEditExpense(exp)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
                          title="Edit Expense"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(exp.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors"
                          title="Delete Expense"
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
              <h4 className="font-bold text-sm text-slate-900">Delete Expense Record?</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will restore the deducted amount back into the fund's available balance.
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
                  deleteExpense(deleteConfirmId);
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
