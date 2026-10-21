import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { calculateAllocations, formatCurrency, fromMinorUnits, toMinorUnits } from '../../utils/currency.ts';
import { Fund, IncomeTransaction, ExpenseTransaction } from '../../types/finance.ts';

// -------------------------------------------------------------
// 1. ADD / EDIT INCOME MODAL
// -------------------------------------------------------------
interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  editIncome?: IncomeTransaction | null;
}

export const AddIncomeModal: React.FC<AddIncomeModalProps> = ({ isOpen, onClose, editIncome }) => {
  const { funds, allocationRules, settings, addIncome, updateIncome } = useFinance();

  const [amountStr, setAmountStr] = useState('');
  const [source, setSource] = useState('Client Payments');
  const [category, setCategory] = useState('Client Projects');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [description, setDescription] = useState('');
  const [ruleId, setRuleId] = useState(
    allocationRules.find((r) => r.isDefault)?.id || allocationRules[0]?.id || ''
  );
  const [isExcluded, setIsExcluded] = useState(false);

  useEffect(() => {
    if (editIncome) {
      setAmountStr((editIncome.amount / 100).toString());
      setSource(editIncome.source);
      setCategory(editIncome.category);
      setDate(editIncome.date);
      setPaymentMethod(editIncome.paymentMethod);
      setDescription(editIncome.description || '');
      setRuleId(editIncome.ruleId || allocationRules[0]?.id || '');
      setIsExcluded(editIncome.isExcludedFromAllocation);
    } else {
      setAmountStr('');
      setSource(settings.incomeSources[0] || 'Client Payments');
      setCategory(settings.incomeCategories[0] || 'Client Projects');
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod(settings.paymentMethods[0] || 'Bank Transfer');
      setDescription('');
      setRuleId(allocationRules.find((r) => r.isDefault)?.id || allocationRules[0]?.id || '');
      setIsExcluded(false);
    }
  }, [editIncome, isOpen, allocationRules, settings]);

  if (!isOpen) return null;

  const numericAmount = parseFloat(amountStr) || 0;
  const minorAmount = toMinorUnits(numericAmount);

  // Live calculation preview
  const selectedRule = allocationRules.find((r) => r.id === ruleId) || allocationRules[0];
  const ruleItems =
    selectedRule?.items ||
    funds.map((f) => ({ fundId: f.id, percentage: f.allocationPercentage }));

  const preview = calculateAllocations(minorAmount, ruleItems, funds);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount <= 0) return;

    if (editIncome) {
      updateIncome(editIncome.id, {
        amountMinor: minorAmount,
        source,
        category,
        date,
        paymentMethod,
        description,
        ruleId: isExcluded ? undefined : ruleId,
        isExcludedFromAllocation: isExcluded,
      });
    } else {
      addIncome({
        amountMinor: minorAmount,
        source,
        category,
        date,
        paymentMethod,
        description,
        ruleId: isExcluded ? undefined : ruleId,
        isExcludedFromAllocation: isExcluded,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2 sm:hidden shrink-0" />
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {editIncome ? 'Edit Income Entry' : 'Record New Income'}
            </h2>
            <p className="text-xs text-slate-500">
              Income is automatically split into your configured funds by percentage
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 text-sm">
          {/* Amount Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Income Amount ({settings.currency}) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-base">
                {settings.currency === 'BDT' ? '৳' : '$'}
              </span>
              <input
                type="number"
                step="any"
                min="1"
                required
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-base font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {numericAmount > 0 && (
              <p className="text-xs text-emerald-600 font-medium mt-1">
                Formatted: {formatCurrency(minorAmount, settings.currency)}
              </p>
            )}
          </div>

          {/* Source & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Income Source *
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {settings.incomeSources.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {settings.incomeCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Transaction Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {settings.paymentMethods.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Notes (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Website development phase 2 milestone payment"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Allocation Rule Selection */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-slate-800">
                  Automatic Fund Distribution
                </span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={isExcluded}
                  onChange={(e) => setIsExcluded(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Exclude (Keep Unallocated)</span>
              </label>
            </div>

            {!isExcluded ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 whitespace-nowrap">Allocation Rule:</span>
                  <select
                    value={ruleId}
                    onChange={(e) => setRuleId(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-800 focus:outline-hidden"
                  >
                    {allocationRules.map((rule) => (
                      <option key={rule.id} value={rule.id}>
                        {rule.name} {rule.isDefault ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Real-time Allocation Breakdown Preview */}
                {numericAmount > 0 && preview.splits.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/80">
                    <p className="text-xs font-medium text-slate-500 mb-2 flex items-center justify-between">
                      <span>Live Distribution Preview</span>
                      <span className="font-mono tabular-nums text-slate-700">
                        Total 100% = {formatCurrency(minorAmount, settings.currency)}
                      </span>
                    </p>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {preview.splits.map((split) => (
                        <div
                          key={split.fundId}
                          className="flex items-center justify-between py-1 px-2 bg-white rounded border border-slate-100 text-xs"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            <span className="font-medium text-slate-800">{split.fundName}</span>
                            <span className="text-slate-400">({split.percentage}%)</span>
                          </div>
                          <span className="font-mono tabular-nums font-semibold text-emerald-600">
                            +{formatCurrency(split.amount, settings.currency)}
                          </span>
                        </div>
                      ))}
                      {preview.unallocatedMinor > 0 && (
                        <div className="flex items-center justify-between py-1 px-2 bg-amber-50 rounded border border-amber-200 text-xs text-amber-800">
                          <span>Unallocated Remainder:</span>
                          <span className="font-mono tabular-nums font-semibold">
                            {formatCurrency(preview.unallocatedMinor, settings.currency)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded border border-amber-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  This income will be kept as unallocated cash and will not be split into funds.
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={numericAmount <= 0}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors"
            >
              {editIncome ? 'Update Income' : 'Record & Distribute Income'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 2. ADD / EDIT EXPENSE MODAL
// -------------------------------------------------------------
interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  editExpense?: ExpenseTransaction | null;
  defaultFundId?: string;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  editExpense,
  defaultFundId,
}) => {
  const { funds, settings, addExpense, updateExpense } = useFinance();

  const [amountStr, setAmountStr] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(settings.expenseCategories[0] || 'Food & Dining');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState(settings.paymentMethods[0] || 'Credit/Debit Card');
  const [fundId, setFundId] = useState(defaultFundId || funds[0]?.id || '');
  const [description, setDescription] = useState('');
  const [allowOverdraftOverride, setAllowOverdraftOverride] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (editExpense) {
      setAmountStr((editExpense.amount / 100).toString());
      setTitle(editExpense.title);
      setCategory(editExpense.category);
      setDate(editExpense.date);
      setPaymentMethod(editExpense.paymentMethod);
      setFundId(editExpense.fundId);
      setDescription(editExpense.description || '');
      setFormError(null);
    } else {
      setAmountStr('');
      setTitle('');
      setCategory(settings.expenseCategories[0] || 'Food & Dining');
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod(settings.paymentMethods[0] || 'Credit/Debit Card');
      setFundId(defaultFundId || funds[0]?.id || '');
      setDescription('');
      setAllowOverdraftOverride(false);
      setFormError(null);
    }
  }, [editExpense, isOpen, defaultFundId, funds, settings]);

  if (!isOpen) return null;

  const numericAmount = parseFloat(amountStr) || 0;
  const minorAmount = toMinorUnits(numericAmount);
  const selectedFund = funds.find((f) => f.id === fundId);

  const availableBalance = selectedFund ? selectedFund.currentBalance : 0;
  const isOverdrawn =
    selectedFund &&
    !selectedFund.allowOverdraft &&
    !settings.allowGlobalOverdraft &&
    minorAmount > availableBalance;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (numericAmount <= 0) {
      setFormError('Please enter a valid expense amount');
      return;
    }
    if (!title.trim()) {
      setFormError('Expense title is required');
      return;
    }
    if (!selectedFund) {
      setFormError('Please select a fund to deduct this expense from');
      return;
    }

    if (editExpense) {
      const res = updateExpense(editExpense.id, {
        amountMinor: minorAmount,
        title: title.trim(),
        category,
        date,
        paymentMethod,
        fundId,
        description,
        allowOverdraftOverride,
      });
      if (!res.success) {
        setFormError(res.error || 'Failed to update expense');
        return;
      }
    } else {
      const res = addExpense({
        amountMinor: minorAmount,
        title: title.trim(),
        category,
        date,
        paymentMethod,
        fundId,
        description,
        allowOverdraftOverride,
      });
      if (!res.success) {
        setFormError(res.error || 'Failed to record expense');
        return;
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2 sm:hidden shrink-0" />
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {editExpense ? 'Edit Expense' : 'Record New Expense'}
            </h2>
            <p className="text-xs text-slate-500">
              Deducts directly from the selected fund's available balance
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 text-sm">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Amount Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Expense Amount ({settings.currency}) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-base">
                {settings.currency === 'BDT' ? '৳' : '$'}
              </span>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="e.g. 2500"
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-base font-medium focus:outline-hidden focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              />
            </div>
          </div>

          {/* Expense Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Monthly Internet bill, Figma subscription, Lunch meeting"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Fund Selector with Balance Indicator */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Deduct From Fund *</label>
              {selectedFund && (
                <span className="text-xs text-slate-500">
                  Available:{' '}
                  <span
                    className={`font-mono tabular-nums font-semibold ${
                      selectedFund.currentBalance < 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {formatCurrency(selectedFund.currentBalance, settings.currency)}
                  </span>
                </span>
              )}
            </div>
            <select
              value={fundId}
              onChange={(e) => setFundId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {funds.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} — Balance: {formatCurrency(f.currentBalance, settings.currency)}
                </option>
              ))}
            </select>

            {/* Overdraft warning / checkbox */}
            {isOverdrawn && (
              <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1.5">
                <div className="flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Amount exceeds available fund balance!</span>
                </div>
                <p className="text-slate-600">
                  This fund does not have enough balance. You can check the box below to authorize an
                  overdraft.
                </p>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-amber-900 pt-1">
                  <input
                    type="checkbox"
                    checked={allowOverdraftOverride}
                    onChange={(e) => setAllowOverdraftOverride(e.target.checked)}
                    className="rounded border-amber-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <span>Allow overdraft for this transaction</span>
                </label>
              </div>
            )}
          </div>

          {/* Category & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {settings.expenseCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {settings.paymentMethods.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Transaction Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notes / Vendor
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional memo"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isOverdrawn && !allowOverdraftOverride}
              className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors"
            >
              {editExpense ? 'Update Expense' : 'Record Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 3. FUND TRANSFER MODAL
// -------------------------------------------------------------
interface FundTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSourceFundId?: string;
}

export const FundTransferModal: React.FC<FundTransferModalProps> = ({
  isOpen,
  onClose,
  defaultSourceFundId,
}) => {
  const { funds, settings, transferFunds } = useFinance();

  const [fromFundId, setFromFundId] = useState(defaultSourceFundId || funds[0]?.id || '');
  const [toFundId, setToFundId] = useState(funds[1]?.id || '');
  const [amountStr, setAmountStr] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (defaultSourceFundId) {
      setFromFundId(defaultSourceFundId);
      const other = funds.find((f) => f.id !== defaultSourceFundId);
      if (other) setToFundId(other.id);
    }
  }, [defaultSourceFundId, funds]);

  if (!isOpen) return null;

  const numericAmount = parseFloat(amountStr) || 0;
  const minorAmount = toMinorUnits(numericAmount);
  const fromFund = funds.find((f) => f.id === fromFundId);
  const toFund = funds.find((f) => f.id === toFundId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (numericAmount <= 0) {
      setErrorMsg('Please enter a valid transfer amount');
      return;
    }
    if (fromFundId === toFundId) {
      setErrorMsg('Source and Destination funds must be different');
      return;
    }

    const res = transferFunds(fromFundId, toFundId, minorAmount, date, note);
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to complete transfer');
      return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2 sm:hidden shrink-0" />
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Transfer Between Funds</h2>
            <p className="text-xs text-slate-500">
              Moves money internally without counting as income or expense
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* From Fund */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Source Fund (Deduct) *</label>
              {fromFund && (
                <span className="text-xs text-slate-500">
                  Available:{' '}
                  <span className="font-mono tabular-nums font-semibold text-slate-800">
                    {formatCurrency(fromFund.currentBalance, settings.currency)}
                  </span>
                </span>
              )}
            </div>
            <select
              value={fromFundId}
              onChange={(e) => setFromFundId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {funds.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({formatCurrency(f.currentBalance, settings.currency)})
                </option>
              ))}
            </select>
          </div>

          {/* To Fund */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Destination Fund (Add) *</label>
              {toFund && (
                <span className="text-xs text-slate-500">
                  Current:{' '}
                  <span className="font-mono tabular-nums font-semibold text-slate-800">
                    {formatCurrency(toFund.currentBalance, settings.currency)}
                  </span>
                </span>
              )}
            </div>
            <select
              value={toFundId}
              onChange={(e) => setToFundId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {funds.map((f) => (
                <option key={f.id} value={f.id} disabled={f.id === fromFundId}>
                  {f.name} {f.id === fromFundId ? '(Source)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Transfer Amount ({settings.currency}) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-base">
                {settings.currency === 'BDT' ? '৳' : '$'}
              </span>
              <input
                type="number"
                step="any"
                min="1"
                required
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-base font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Date & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Transfer Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Note</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Rebalance savings"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={numericAmount <= 0}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors"
            >
              Execute Transfer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 4. ADD / EDIT FUND MODAL
// -------------------------------------------------------------
interface FundModalProps {
  isOpen: boolean;
  onClose: () => void;
  editFund?: Fund | null;
}

export const FundModal: React.FC<FundModalProps> = ({ isOpen, onClose, editFund }) => {
  const { funds, settings, createFund, updateFund } = useFinance();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<Fund['category']>('expenses');
  const [percentage, setPercentage] = useState<number>(10);
  const [color, setColor] = useState('#2563eb');
  const [icon, setIcon] = useState('Folder');
  const [allowOverdraft, setAllowOverdraft] = useState(false);
  const [targetGoalStr, setTargetGoalStr] = useState('');
  const [description, setDescription] = useState('');
  const [isEmergencyFund, setIsEmergencyFund] = useState(false);
  const [isSavingsFund, setIsSavingsFund] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editFund) {
      setName(editFund.name);
      setCategory(editFund.category);
      setPercentage(editFund.allocationPercentage);
      setColor(editFund.color);
      setIcon(editFund.icon);
      setAllowOverdraft(editFund.allowOverdraft);
      setTargetGoalStr(editFund.targetGoal ? (editFund.targetGoal / 100).toString() : '');
      setDescription(editFund.description || '');
      setIsEmergencyFund(editFund.isEmergencyFund || false);
      setIsSavingsFund(editFund.isSavingsFund || false);
    } else {
      setName('');
      setCategory('expenses');
      setPercentage(10);
      setColor('#2563eb');
      setIcon('Folder');
      setAllowOverdraft(false);
      setTargetGoalStr('');
      setDescription('');
      setIsEmergencyFund(false);
      setIsSavingsFund(false);
    }
    setErrorMsg(null);
  }, [editFund, isOpen]);

  if (!isOpen) return null;

  // Calculate other funds total percentage
  const otherSum = funds
    .filter((f) => !editFund || f.id !== editFund.id)
    .reduce((acc, f) => acc + f.allocationPercentage, 0);

  const totalWithNew = otherSum + (Number(percentage) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Fund name is required');
      return;
    }

    const targetGoalMinor = targetGoalStr ? toMinorUnits(parseFloat(targetGoalStr) || 0) : undefined;

    if (editFund) {
      const res = updateFund(editFund.id, {
        name: name.trim(),
        category,
        allocationPercentage: Number(percentage) || 0,
        color,
        icon,
        allowOverdraft,
        targetGoal: targetGoalMinor,
        description,
        isEmergencyFund,
        isSavingsFund: isSavingsFund || category === 'savings',
      });
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to update fund');
        return;
      }
    } else {
      const res = createFund({
        name: name.trim(),
        category,
        allocationPercentage: Number(percentage) || 0,
        color,
        icon,
        allowOverdraft,
        targetGoalMinor,
        description,
        isEmergencyFund,
        isSavingsFund: isSavingsFund || category === 'savings',
      });
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to create fund');
        return;
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2 sm:hidden shrink-0" />
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {editFund ? 'Edit Fund Settings' : 'Create New Fund'}
            </h2>
            <p className="text-xs text-slate-500">Configure allocation rate, category, and limits</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 text-sm">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fund Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Travel & Vacations"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => {
                  const val = e.target.value as Fund['category'];
                  setCategory(val);
                  if (val === 'emergency') setIsEmergencyFund(true);
                  if (val === 'savings') setIsSavingsFund(true);
                }}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="expenses">Operating Expenses</option>
                <option value="savings">Savings & Wealth</option>
                <option value="emergency">Emergency Reserve</option>
                <option value="investments">Investments & Capital</option>
                <option value="business">Business Budget</option>
                <option value="other">Other Purpose</option>
              </select>
            </div>
          </div>

          {/* Allocation Percentage */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800">
                Income Allocation Percentage (%)
              </label>
              <span
                className={`text-xs font-mono tabular-nums font-semibold ${
                  totalWithNew > 100
                    ? 'text-rose-600'
                    : totalWithNew === 100
                    ? 'text-emerald-600'
                    : 'text-blue-600'
                }`}
              >
                Total with all funds: {totalWithNew}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max={Math.max(0, 100 - otherSum)}
                value={percentage}
                onChange={(e) => setPercentage(Number(e.target.value))}
                className="flex-1 accent-blue-600"
              />
              <div className="flex items-center gap-1 w-20">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={percentage}
                  onChange={(e) => setPercentage(Number(e.target.value))}
                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-center text-xs font-mono font-bold text-slate-900"
                />
                <span className="text-xs font-semibold text-slate-500">%</span>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Other funds use {otherSum}%. Available capacity: {Math.max(0, 100 - otherSum)}%.
            </p>
          </div>

          {/* Color & Target Goal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Card Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-9 p-0.5 rounded border border-slate-200 cursor-pointer"
                />
                <span className="text-xs text-slate-500 font-mono">{color}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Savings Goal (Optional)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={targetGoalStr}
                onChange={(e) => setTargetGoalStr(e.target.value)}
                placeholder="e.g. 100000"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Memo</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this fund is dedicated for"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Overdraft & Special Flags */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={allowOverdraft}
                onChange={(e) => setAllowOverdraft(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span>Allow Overdraft (Fund balance can go below 0 for unexpected urgent costs)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={isEmergencyFund}
                onChange={(e) => setIsEmergencyFund(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span>Designate as Emergency Fund (Highlighted on Dashboard)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={isSavingsFund}
                onChange={(e) => setIsSavingsFund(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span>Count towards Total Savings in Dashboard KPIs</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={totalWithNew > 100}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors"
            >
              {editFund ? 'Save Changes' : 'Create Fund'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 5. ALLOCATION BREAKDOWN AUDIT MODAL
// -------------------------------------------------------------
interface AllocationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  income: IncomeTransaction | null;
}

export const AllocationDetailModal: React.FC<AllocationDetailModalProps> = ({
  isOpen,
  onClose,
  income,
}) => {
  const { settings } = useFinance();

  if (!isOpen || !income) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2 sm:hidden shrink-0" />
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">Allocation Audit Record</h2>
            <p className="text-xs text-slate-500">
              Audit trail for {income.source} ({income.date})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-slate-500 block">Total Income Amount</span>
              <span className="text-base font-bold font-mono text-slate-900">
                {formatCurrency(income.amount, settings.currency)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block">Allocation Rule</span>
              <span className="font-semibold text-blue-600">{income.ruleName || 'Standard'}</span>
            </div>
          </div>

          {income.isExcludedFromAllocation ? (
            <div className="p-3 bg-amber-50 rounded border border-amber-200 text-amber-800">
              This income entry was excluded from automatic fund allocation. The entire{' '}
              {formatCurrency(income.amount, settings.currency)} was directed to Unallocated Balance.
            </div>
          ) : (
            <div>
              <p className="font-semibold text-slate-700 mb-2">Fund Allocation Breakdown</p>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white">
                {income.allocations.map((a) => (
                  <div key={a.fundId} className="flex items-center justify-between p-2.5">
                    <div>
                      <span className="font-medium text-slate-900 block">{a.fundName}</span>
                      <span className="text-slate-400 text-[11px]">{a.percentage}% rate</span>
                    </div>
                    <span className="font-mono tabular-nums font-semibold text-emerald-600 text-sm">
                      +{formatCurrency(a.amount, settings.currency)}
                    </span>
                  </div>
                ))}
                {income.unallocatedAmount > 0 && (
                  <div className="flex items-center justify-between p-2.5 bg-amber-50/50">
                    <div>
                      <span className="font-medium text-amber-900 block">Unallocated Remainder</span>
                      <span className="text-amber-600 text-[11px]">Unassigned percentage</span>
                    </div>
                    <span className="font-mono tabular-nums font-semibold text-amber-700">
                      +{formatCurrency(income.unallocatedAmount, settings.currency)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="pt-2 text-slate-400 text-[11px]">
            Created at {new Date(income.createdAt).toLocaleString()}. Historical allocations remain
            locked and are never altered by subsequent percentage rule changes.
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 6. TOAST NOTIFICATIONS CONTAINER
// -------------------------------------------------------------
export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useFinance();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-lg shadow-lg border text-xs font-medium transition-all ${
            toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : toast.type === 'info'
              ? 'bg-slate-900 border-slate-800 text-white'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : toast.type === 'info' ? (
              <HelpCircle className="w-4 h-4 text-slate-300 shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
