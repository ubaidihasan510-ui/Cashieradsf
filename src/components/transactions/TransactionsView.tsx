import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Layers,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Calendar,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { formatCurrency, formatDate } from '../../utils/currency.ts';
import { UnifiedTransaction, UnifiedTransactionType } from '../../types/finance.ts';

interface TransactionsViewProps {
  onSelectIncomeDetail: (incomeId: string) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ onSelectIncomeDetail }) => {
  const { unifiedTransactions, funds, settings, dateFilter, setDateFilter } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedFundId, setSelectedFundId] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Filter & sort
  const processedTransactions = useMemo(() => {
    return unifiedTransactions
      .filter((tx) => {
        if (selectedType !== 'all' && tx.type !== selectedType) return false;
        if (selectedFundId !== 'all') {
          if (tx.type === 'income') {
            const hasFundInAlloc = tx.allocations?.some((a) => a.fundId === selectedFundId);
            if (!hasFundInAlloc) return false;
          } else if (tx.type === 'expense' || tx.type === 'transfer') {
            if (tx.fundId !== selectedFundId && tx.relatedFundName !== funds.find((f) => f.id === selectedFundId)?.name) {
              return false;
            }
          }
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = tx.title.toLowerCase().includes(q);
          const matchCat = tx.category.toLowerCase().includes(q);
          const matchDesc = tx.description?.toLowerCase().includes(q);
          const matchFund = tx.fundName?.toLowerCase().includes(q);
          return matchTitle || matchCat || matchDesc || matchFund;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'date_desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (sortOrder === 'date_asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
        if (sortOrder === 'amount_desc') return b.amount - a.amount;
        if (sortOrder === 'amount_asc') return a.amount - b.amount;
        return 0;
      });
  }, [unifiedTransactions, selectedType, selectedFundId, searchQuery, sortOrder, funds]);

  const totalPages = Math.max(1, Math.ceil(processedTransactions.length / pageSize));
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedTransactions.slice(start, start + pageSize);
  }, [processedTransactions, currentPage, pageSize]);

  const exportCsv = () => {
    const headers = ['Date', 'Type', 'Title', 'Category', 'Fund Involved', 'Amount', 'Currency', 'Notes'];
    const rows = processedTransactions.map((tx) => [
      tx.date,
      tx.type.toUpperCase(),
      `"${tx.title.replace(/"/g, '""')}"`,
      `"${tx.category}"`,
      `"${tx.fundName || (tx.allocations ? `${tx.allocations.length} Funds` : '')}"`,
      (tx.amount / 100).toFixed(2),
      settings.currency,
      `"${(tx.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FundFlow_Transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Unified Ledger & Audit
          </span>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            Transaction History
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Complete audit trail of all incomes, expenses, automatic allocations, and internal fund
            transfers
          </p>
        </div>

        <button
          onClick={exportCsv}
          disabled={processedTransactions.length === 0}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap"
        >
          <Download className="w-4 h-4 text-slate-600" />
          <span>Export Ledger (CSV)</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by title, note, fund..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-hidden focus:bg-white"
            >
              <option value="all">All Transaction Types</option>
              <option value="income">Incomes (Inflows)</option>
              <option value="expense">Expenses (Outflows)</option>
              <option value="transfer">Fund Transfers</option>
            </select>
          </div>

          {/* Fund Filter */}
          <div>
            <select
              value={selectedFundId}
              onChange={(e) => {
                setSelectedFundId(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-hidden focus:bg-white"
            >
              <option value="all">All Funds Involved</option>
              {funds.map((f) => (
                <option key={f.id} value={f.id}>
                  Fund: {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sorting */}
          <div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-hidden focus:bg-white"
            >
              <option value="date_desc">Sort: Date (Newest first)</option>
              <option value="date_asc">Sort: Date (Oldest first)</option>
              <option value="amount_desc">Sort: Amount (Highest first)</option>
              <option value="amount_asc">Sort: Amount (Lowest first)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {processedTransactions.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No transactions match your criteria</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your search terms or filters to view records.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Description / Reference</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Fund Impact</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedList.map((tx) => {
                    const isIncome = tx.type === 'income';
                    const isExpense = tx.type === 'expense';
                    const isTransfer = tx.type === 'transfer';

                    return (
                      <tr
                        key={tx.id}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          isIncome && tx.rawIncomeId ? 'cursor-pointer' : ''
                        }`}
                        onClick={() => {
                          if (isIncome && tx.rawIncomeId) {
                            onSelectIncomeDetail(tx.rawIncomeId);
                          }
                        }}
                      >
                        {/* Type Icon & Label */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <div
                              className={`p-1.5 rounded-md ${
                                isIncome
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : isExpense
                                  ? 'bg-rose-50 text-rose-600'
                                  : 'bg-blue-50 text-blue-600'
                              }`}
                            >
                              {isIncome ? (
                                <ArrowDownLeft className="w-3.5 h-3.5" />
                              ) : isExpense ? (
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              ) : (
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <span className="font-semibold capitalize text-slate-800">
                              {tx.type}
                            </span>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-medium">
                          {formatDate(tx.date, settings.dateFormat)}
                        </td>

                        {/* Description */}
                        <td className="py-3 px-4 max-w-sm">
                          <span className="font-bold text-slate-900 block truncate">{tx.title}</span>
                          {tx.description && (
                            <span className="text-[11px] text-slate-400 block truncate">
                              {tx.description}
                            </span>
                          )}
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                          {tx.category}
                        </td>

                        {/* Fund Impact */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {isIncome ? (
                            <span className="text-blue-600 font-medium">
                              {tx.allocations && tx.allocations.length > 0
                                ? `${tx.allocations.length} Funds Distributed`
                                : 'Unallocated Cash'}
                            </span>
                          ) : isExpense ? (
                            <span className="font-semibold text-slate-800">{tx.fundName}</span>
                          ) : (
                            <span className="text-slate-600 font-medium">
                              {tx.fundName} → {tx.relatedFundName}
                            </span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-4 whitespace-nowrap text-right font-mono tabular-nums font-bold text-sm">
                          <span
                            className={
                              isIncome
                                ? 'text-emerald-600'
                                : isExpense
                                ? 'text-rose-600'
                                : 'text-slate-700'
                            }
                          >
                            {isIncome ? '+' : isExpense ? '-' : ''}
                            {formatCurrency(tx.amount, settings.currency)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing {(currentPage - 1) * pageSize + 1} to{' '}
                  {Math.min(currentPage * pageSize, processedTransactions.length)} of{' '}
                  {processedTransactions.length} records
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-semibold text-slate-800 px-2 font-mono">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
