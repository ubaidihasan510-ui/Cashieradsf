import React, { useState, useMemo } from 'react';
import {
  Download,
  BarChart3,
  PieChart,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  PiggyBank,
  Calendar,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { formatCurrency } from '../../utils/currency.ts';

export const ReportsView: React.FC = () => {
  const {
    incomeTransactions,
    expenseTransactions,
    funds,
    settings,
    filteredSummary,
    unallocatedBalance,
  } = useFinance();

  // Aggregate by Income Source
  const incomeBySource = useMemo(() => {
    const map: Record<string, number> = {};
    let total = 0;
    incomeTransactions.forEach((inc) => {
      map[inc.source] = (map[inc.source] || 0) + inc.amount;
      total += inc.amount;
    });

    return Object.entries(map)
      .map(([source, amount]) => ({
        source,
        amount,
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [incomeTransactions]);

  // Aggregate by Expense Category
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    let total = 0;
    expenseTransactions.forEach((exp) => {
      map[exp.category] = (map[exp.category] || 0) + exp.amount;
      total += exp.amount;
    });

    return Object.entries(map)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenseTransactions]);

  // Monthly trends for the current year (12 months)
  const annualMonthlySummary = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const rows: {
      monthName: string;
      yearMonth: string;
      income: number;
      expense: number;
      netSavings: number;
      savingsRate: number;
    }[] = [];

    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    for (let m = 0; m < 12; m++) {
      const ym = `${currentYear}-${String(m + 1).padStart(2, '0')}`;
      let inc = 0;
      let exp = 0;

      incomeTransactions.forEach((i) => {
        if (i.date.startsWith(ym)) inc += i.amount;
      });

      expenseTransactions.forEach((e) => {
        if (e.date.startsWith(ym)) exp += e.amount;
      });

      const net = inc - exp;
      const rate = inc > 0 ? Math.max(0, Math.round((net / inc) * 100)) : 0;

      rows.push({
        monthName: monthNames[m],
        yearMonth: ym,
        income: inc,
        expense: exp,
        netSavings: net,
        savingsRate: rate,
      });
    }

    return rows;
  }, [incomeTransactions, expenseTransactions]);

  const maxMonthValue = Math.max(
    1,
    ...annualMonthlySummary.map((m) => Math.max(m.income, m.expense))
  );

  // Month-over-month performance
  const momStats = useMemo(() => {
    const now = new Date();
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevYM = `${prevMonthDate.getFullYear()}-${String(
      prevMonthDate.getMonth() + 1
    ).padStart(2, '0')}`;

    let curInc = 0;
    let curExp = 0;
    let prevInc = 0;
    let prevExp = 0;

    incomeTransactions.forEach((i) => {
      if (i.date.startsWith(currentYM)) curInc += i.amount;
      if (i.date.startsWith(prevYM)) prevInc += i.amount;
    });

    expenseTransactions.forEach((e) => {
      if (e.date.startsWith(currentYM)) curExp += e.amount;
      if (e.date.startsWith(prevYM)) prevExp += e.amount;
    });

    const incomeGrowth = prevInc > 0 ? Math.round(((curInc - prevInc) / prevInc) * 100) : 0;
    const expenseGrowth = prevExp > 0 ? Math.round(((curExp - prevExp) / prevExp) * 100) : 0;

    return {
      curInc,
      curExp,
      prevInc,
      prevExp,
      incomeGrowth,
      expenseGrowth,
    };
  }, [incomeTransactions, expenseTransactions]);

  const exportAnnualCsv = () => {
    const headers = [
      'Month',
      'Total Income',
      'Total Expenses',
      'Net Savings',
      'Savings Rate (%)',
      'Currency',
    ];
    const rows = annualMonthlySummary.map((m) => [
      m.monthName,
      (m.income / 100).toFixed(2),
      (m.expense / 100).toFixed(2),
      (m.netSavings / 100).toFixed(2),
      `${m.savingsRate}%`,
      settings.currency,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FundFlow_Annual_Summary_${new Date().getFullYear()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Analytics & Business Intelligence
          </span>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            Financial Reports & Performance
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Trends, capital allocation breakdowns, savings acceleration, and annual summaries
          </p>
        </div>

        <button
          onClick={exportAnnualCsv}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
        >
          <Download className="w-4 h-4 text-slate-600" />
          <span>Export Annual Report (CSV)</span>
        </button>
      </div>

      {/* MoM Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Income Growth */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Month-over-Month Income</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-lg font-bold font-mono text-slate-900">
              {formatCurrency(momStats.curInc, settings.currency)}
            </span>
            <span
              className={`text-xs font-bold font-mono ${
                momStats.incomeGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {momStats.incomeGrowth >= 0 ? '+' : ''}
              {momStats.incomeGrowth}%
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Previous month: {formatCurrency(momStats.prevInc, settings.currency)}
          </span>
        </div>

        {/* Expense Growth */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Month-over-Month Expenses</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-lg font-bold font-mono text-slate-900">
              {formatCurrency(momStats.curExp, settings.currency)}
            </span>
            <span
              className={`text-xs font-bold font-mono ${
                momStats.expenseGrowth <= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {momStats.expenseGrowth >= 0 ? '+' : ''}
              {momStats.expenseGrowth}%
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Previous month: {formatCurrency(momStats.prevExp, settings.currency)}
          </span>
        </div>

        {/* Overall Net Margin */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Net Savings Rate</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-lg font-bold font-mono text-slate-900">
              {filteredSummary.netSavingsRate}%
            </span>
            <span className="text-xs text-emerald-600 font-semibold">Active Period</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Surplus: {formatCurrency(Math.max(0, momStats.curInc - momStats.curExp), settings.currency)}
          </span>
        </div>

        {/* Total Available Assets */}
        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs ring-1 ring-blue-500/10">
          <span className="text-xs text-blue-900 font-semibold">Total Liquid Capital</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-lg font-bold font-mono text-blue-900">
              {formatCurrency(filteredSummary.totalAvailableBalance, settings.currency)}
            </span>
          </div>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
            Across {funds.length} allocated funds
          </span>
        </div>
      </div>

      {/* Annual Monthly Trajectory Bar Chart */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Annual Financial Trajectory ({new Date().getFullYear()})
            </h3>
            <p className="text-xs text-slate-500">Monthly breakdown of income and expenses</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-500"></span>
              <span className="text-slate-600">Income</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-rose-500"></span>
              <span className="text-slate-600">Expenses</span>
            </div>
          </div>
        </div>

        {/* 12-Month SVG Bar Chart */}
        <div className="h-56 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-slate-100 overflow-x-auto">
          {annualMonthlySummary.map((m) => {
            const incHeight = Math.round((m.income / maxMonthValue) * 100);
            const expHeight = Math.round((m.expense / maxMonthValue) * 100);

            return (
              <div
                key={m.yearMonth}
                className="flex-1 min-w-[40px] flex flex-col items-center gap-1.5 h-full justify-end group"
              >
                <div className="w-full flex items-end justify-center gap-1 h-40">
                  <div
                    className="w-3 sm:w-4 bg-emerald-500 rounded-t-xs transition-all group-hover:bg-emerald-600"
                    style={{ height: `${Math.max(2, incHeight)}%` }}
                    title={`${m.monthName} Income: ${formatCurrency(m.income, settings.currency)}`}
                  />
                  <div
                    className="w-3 sm:w-4 bg-rose-500 rounded-t-xs transition-all group-hover:bg-rose-600"
                    style={{ height: `${Math.max(2, expHeight)}%` }}
                    title={`${m.monthName} Expense: ${formatCurrency(m.expense, settings.currency)}`}
                  />
                </div>
                <span className="text-[10px] font-medium text-slate-500 truncate">
                  {m.monthName.slice(0, 3)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Breakdown Grids: Income by Source & Expenses by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income by Source */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Income by Source</h3>
            <span className="text-xs text-slate-400">{incomeBySource.length} sources</span>
          </div>

          {incomeBySource.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No income sources recorded</p>
          ) : (
            <div className="space-y-3">
              {incomeBySource.map((item) => (
                <div key={item.source} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{item.source}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono tabular-nums font-bold text-emerald-600">
                        {formatCurrency(item.amount, settings.currency)}
                      </span>
                      <span className="text-slate-400 w-8 text-right font-mono">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expenses by Category */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Expense by Category</h3>
            <span className="text-xs text-slate-400">{expenseByCategory.length} categories</span>
          </div>

          {expenseByCategory.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No expenses recorded</p>
          ) : (
            <div className="space-y-3">
              {expenseByCategory.map((item) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{item.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono tabular-nums font-bold text-rose-600">
                        {formatCurrency(item.amount, settings.currency)}
                      </span>
                      <span className="text-slate-400 w-8 text-right font-mono">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Available Balance by Fund Breakdown & Annual Summary Table */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Annual Financial Summary Table</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Month</th>
                <th className="py-2.5 px-4 text-right">Income</th>
                <th className="py-2.5 px-4 text-right">Expenses</th>
                <th className="py-2.5 px-4 text-right">Net Savings</th>
                <th className="py-2.5 px-4 text-center">Savings Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {annualMonthlySummary.map((row) => (
                <tr key={row.yearMonth} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 font-medium text-slate-800">{row.monthName}</td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-emerald-600 font-semibold">
                    {formatCurrency(row.income, settings.currency)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-rose-600 font-semibold">
                    {formatCurrency(row.expense, settings.currency)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                    {formatCurrency(row.netSavings, settings.currency)}
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono font-semibold text-blue-600">
                    {row.savingsRate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
