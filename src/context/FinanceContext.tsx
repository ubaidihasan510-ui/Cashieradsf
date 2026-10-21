import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  AllocationRule,
  AppSettings,
  DateFilter,
  ExpenseTransaction,
  FinancialSummary,
  Fund,
  FundAllocationSplit,
  FundTransfer,
  IncomeTransaction,
  UnifiedTransaction,
} from '../types/finance.ts';
import { calculateAllocations, toMinorUnits } from '../utils/currency.ts';
import {
  AppState,
  DEFAULT_FUNDS,
  DEFAULT_RULES,
  DEFAULT_SETTINGS,
  INITIAL_EXPENSE_TRANSACTIONS,
  INITIAL_INCOME_TRANSACTIONS,
  INITIAL_TRANSFERS,
  getInitialAppState,
  recalculateAllFundBalances,
  saveAppState,
} from '../utils/storage.ts';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface FinanceContextType {
  funds: Fund[];
  incomeTransactions: IncomeTransaction[];
  expenseTransactions: ExpenseTransaction[];
  fundTransfers: FundTransfer[];
  allocationRules: AllocationRule[];
  settings: AppSettings;
  unallocatedBalance: number;
  dateFilter: DateFilter;
  setDateFilter: (filter: DateFilter) => void;
  filteredSummary: FinancialSummary;
  unifiedTransactions: UnifiedTransaction[];
  filteredUnifiedTransactions: UnifiedTransaction[];
  toasts: ToastMessage[];
  addToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;

  // Actions
  addIncome: (
    data: {
      amountMinor: number;
      source: string;
      category: string;
      date: string;
      paymentMethod: string;
      description?: string;
      ruleId?: string;
      isExcludedFromAllocation: boolean;
      customSplits?: FundAllocationSplit[];
    }
  ) => boolean;

  updateIncome: (
    id: string,
    data: {
      amountMinor: number;
      source: string;
      category: string;
      date: string;
      paymentMethod: string;
      description?: string;
      ruleId?: string;
      isExcludedFromAllocation: boolean;
    }
  ) => boolean;

  deleteIncome: (id: string) => void;

  addExpense: (
    data: {
      amountMinor: number;
      title: string;
      category: string;
      date: string;
      paymentMethod: string;
      fundId: string;
      description?: string;
      allowOverdraftOverride?: boolean;
    }
  ) => { success: boolean; error?: string };

  updateExpense: (
    id: string,
    data: {
      amountMinor: number;
      title: string;
      category: string;
      date: string;
      paymentMethod: string;
      fundId: string;
      description?: string;
      allowOverdraftOverride?: boolean;
    }
  ) => { success: boolean; error?: string };

  deleteExpense: (id: string) => void;

  transferFunds: (
    fromFundId: string,
    toFundId: string,
    amountMinor: number,
    date: string,
    note?: string
  ) => { success: boolean; error?: string };

  createFund: (data: {
    name: string;
    category: Fund['category'];
    allocationPercentage: number;
    color: string;
    icon: string;
    allowOverdraft: boolean;
    targetGoalMinor?: number;
    description?: string;
    isEmergencyFund?: boolean;
    isSavingsFund?: boolean;
  }) => { success: boolean; error?: string };

  updateFund: (id: string, data: Partial<Fund>) => { success: boolean; error?: string };

  deleteFund: (id: string, transferBalanceToFundId?: string) => { success: boolean; error?: string };

  saveAllocationRule: (rule: AllocationRule) => void;
  setDefaultAllocationRule: (ruleId: string) => void;
  deleteAllocationRule: (ruleId: string) => void;

  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetToSampleData: () => void;
  exportDataJson: () => string;
  importDataJson: (json: string) => { success: boolean; error?: string };
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(getInitialAppState);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ range: 'this_month' });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Synchronize state changes to localStorage
  useEffect(() => {
    saveAppState(state);
  }, [state]);

  const addToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper to recompute balances whenever transaction sets change
  const applyStateUpdate = (
    newIncomes: IncomeTransaction[],
    newExpenses: ExpenseTransaction[],
    newTransfers: FundTransfer[],
    baseFunds: Fund[] = state.funds,
    newRules: AllocationRule[] = state.allocationRules,
    newSettings: AppSettings = state.settings
  ) => {
    const { updatedFunds, totalUnallocated } = recalculateAllFundBalances(
      baseFunds,
      newIncomes,
      newExpenses,
      newTransfers
    );

    setState({
      funds: updatedFunds,
      incomeTransactions: newIncomes,
      expenseTransactions: newExpenses,
      fundTransfers: newTransfers,
      allocationRules: newRules,
      settings: newSettings,
      unallocatedBalance: totalUnallocated,
      lastUpdated: new Date().toISOString(),
    });
  };

  // ADD INCOME
  const addIncome = (data: {
    amountMinor: number;
    source: string;
    category: string;
    date: string;
    paymentMethod: string;
    description?: string;
    ruleId?: string;
    isExcludedFromAllocation: boolean;
    customSplits?: FundAllocationSplit[];
  }): boolean => {
    if (data.amountMinor <= 0) {
      addToast('Income amount must be greater than zero', 'error');
      return false;
    }

    let splits: FundAllocationSplit[] = [];
    let unallocatedMinor = 0;
    let ruleName = 'Excluded from Allocation';

    if (data.isExcludedFromAllocation) {
      splits = [];
      unallocatedMinor = data.amountMinor;
    } else if (data.customSplits && data.customSplits.length > 0) {
      splits = data.customSplits;
      const allocatedSum = splits.reduce((acc, s) => acc + s.amount, 0);
      unallocatedMinor = Math.max(0, data.amountMinor - allocatedSum);
      ruleName = 'Custom Split';
    } else {
      const activeRule =
        state.allocationRules.find((r) => r.id === data.ruleId) ||
        state.allocationRules.find((r) => r.isDefault) ||
        state.allocationRules[0];

      ruleName = activeRule?.name || 'Default Allocation';
      const ruleItems =
        activeRule?.items ||
        state.funds.map((f) => ({ fundId: f.id, percentage: f.allocationPercentage }));

      const res = calculateAllocations(data.amountMinor, ruleItems, state.funds);
      splits = res.splits;
      unallocatedMinor = res.unallocatedMinor;
    }

    const newIncome: IncomeTransaction = {
      id: `inc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      amount: data.amountMinor,
      source: data.source,
      category: data.category,
      date: data.date,
      paymentMethod: data.paymentMethod,
      description: data.description,
      ruleId: data.ruleId,
      ruleName,
      isExcludedFromAllocation: data.isExcludedFromAllocation,
      allocations: splits,
      unallocatedAmount: unallocatedMinor,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newIncomes = [newIncome, ...state.incomeTransactions];
    applyStateUpdate(newIncomes, state.expenseTransactions, state.fundTransfers);
    addToast('Income recorded & fund allocations automatically distributed', 'success');
    return true;
  };

  // UPDATE INCOME
  const updateIncome = (
    id: string,
    data: {
      amountMinor: number;
      source: string;
      category: string;
      date: string;
      paymentMethod: string;
      description?: string;
      ruleId?: string;
      isExcludedFromAllocation: boolean;
    }
  ): boolean => {
    const existingIndex = state.incomeTransactions.findIndex((item) => item.id === id);
    if (existingIndex === -1) return false;

    let splits: FundAllocationSplit[] = [];
    let unallocatedMinor = 0;
    let ruleName = 'Excluded from Allocation';

    if (data.isExcludedFromAllocation) {
      splits = [];
      unallocatedMinor = data.amountMinor;
    } else {
      const activeRule =
        state.allocationRules.find((r) => r.id === data.ruleId) ||
        state.allocationRules.find((r) => r.isDefault) ||
        state.allocationRules[0];

      ruleName = activeRule?.name || 'Default Allocation';
      const ruleItems =
        activeRule?.items ||
        state.funds.map((f) => ({ fundId: f.id, percentage: f.allocationPercentage }));

      const res = calculateAllocations(data.amountMinor, ruleItems, state.funds);
      splits = res.splits;
      unallocatedMinor = res.unallocatedMinor;
    }

    const updatedIncome: IncomeTransaction = {
      ...state.incomeTransactions[existingIndex],
      amount: data.amountMinor,
      source: data.source,
      category: data.category,
      date: data.date,
      paymentMethod: data.paymentMethod,
      description: data.description,
      ruleId: data.ruleId,
      ruleName,
      isExcludedFromAllocation: data.isExcludedFromAllocation,
      allocations: splits,
      unallocatedAmount: unallocatedMinor,
      updatedAt: new Date().toISOString(),
    };

    const newIncomes = [...state.incomeTransactions];
    newIncomes[existingIndex] = updatedIncome;

    applyStateUpdate(newIncomes, state.expenseTransactions, state.fundTransfers);
    addToast('Income updated and allocations safely recalculated', 'success');
    return true;
  };

  // DELETE INCOME
  const deleteIncome = (id: string) => {
    const newIncomes = state.incomeTransactions.filter((item) => item.id !== id);
    applyStateUpdate(newIncomes, state.expenseTransactions, state.fundTransfers);
    addToast('Income removed and allocated balances reversed', 'info');
  };

  // ADD EXPENSE
  const addExpense = (data: {
    amountMinor: number;
    title: string;
    category: string;
    date: string;
    paymentMethod: string;
    fundId: string;
    description?: string;
    allowOverdraftOverride?: boolean;
  }): { success: boolean; error?: string } => {
    if (data.amountMinor <= 0) {
      const err = 'Expense amount must be greater than zero';
      addToast(err, 'error');
      return { success: false, error: err };
    }

    const fund = state.funds.find((f) => f.id === data.fundId);
    if (!fund) {
      const err = 'Selected fund does not exist';
      addToast(err, 'error');
      return { success: false, error: err };
    }

    // Overdraft check
    const isOverdraftAllowed =
      data.allowOverdraftOverride || fund.allowOverdraft || state.settings.allowGlobalOverdraft;

    if (!isOverdraftAllowed && fund.currentBalance < data.amountMinor) {
      const err = `Insufficient funds in "${fund.name}". Available balance: ${(
        fund.currentBalance / 100
      ).toLocaleString()}. Enable overdraft in settings or check to proceed.`;
      addToast(err, 'error');
      return { success: false, error: err };
    }

    const newExpense: ExpenseTransaction = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      amount: data.amountMinor,
      title: data.title,
      category: data.category,
      date: data.date,
      paymentMethod: data.paymentMethod,
      fundId: data.fundId,
      fundName: fund.name,
      description: data.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newExpenses = [newExpense, ...state.expenseTransactions];
    applyStateUpdate(state.incomeTransactions, newExpenses, state.fundTransfers);
    addToast(`Expense deducted from ${fund.name}`, 'success');
    return { success: true };
  };

  // UPDATE EXPENSE
  const updateExpense = (
    id: string,
    data: {
      amountMinor: number;
      title: string;
      category: string;
      date: string;
      paymentMethod: string;
      fundId: string;
      description?: string;
      allowOverdraftOverride?: boolean;
    }
  ): { success: boolean; error?: string } => {
    const index = state.expenseTransactions.findIndex((e) => e.id === id);
    if (index === -1) return { success: false, error: 'Expense not found' };

    const fund = state.funds.find((f) => f.id === data.fundId);
    if (!fund) return { success: false, error: 'Fund not found' };

    const updatedExpense: ExpenseTransaction = {
      ...state.expenseTransactions[index],
      amount: data.amountMinor,
      title: data.title,
      category: data.category,
      date: data.date,
      paymentMethod: data.paymentMethod,
      fundId: data.fundId,
      fundName: fund.name,
      description: data.description,
      updatedAt: new Date().toISOString(),
    };

    const newExpenses = [...state.expenseTransactions];
    newExpenses[index] = updatedExpense;

    applyStateUpdate(state.incomeTransactions, newExpenses, state.fundTransfers);
    addToast('Expense details updated', 'success');
    return { success: true };
  };

  // DELETE EXPENSE
  const deleteExpense = (id: string) => {
    const newExpenses = state.expenseTransactions.filter((e) => e.id !== id);
    applyStateUpdate(state.incomeTransactions, newExpenses, state.fundTransfers);
    addToast('Expense deleted and amount returned to fund balance', 'info');
  };

  // TRANSFER FUNDS
  const transferFunds = (
    fromFundId: string,
    toFundId: string,
    amountMinor: number,
    date: string,
    note?: string
  ): { success: boolean; error?: string } => {
    if (fromFundId === toFundId) {
      const err = 'Source and destination funds cannot be the same';
      addToast(err, 'error');
      return { success: false, error: err };
    }

    if (amountMinor <= 0) {
      const err = 'Transfer amount must be greater than zero';
      addToast(err, 'error');
      return { success: false, error: err };
    }

    const fromFund = state.funds.find((f) => f.id === fromFundId);
    const toFund = state.funds.find((f) => f.id === toFundId);

    if (!fromFund || !toFund) {
      const err = 'One or both funds could not be found';
      addToast(err, 'error');
      return { success: false, error: err };
    }

    if (!fromFund.allowOverdraft && !state.settings.allowGlobalOverdraft && fromFund.currentBalance < amountMinor) {
      const err = `Insufficient balance in ${fromFund.name} for transfer`;
      addToast(err, 'error');
      return { success: false, error: err };
    }

    const newTransfer: FundTransfer = {
      id: `tr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      fromFundId,
      fromFundName: fromFund.name,
      toFundId,
      toFundName: toFund.name,
      amount: amountMinor,
      date,
      note,
      createdAt: new Date().toISOString(),
    };

    const newTransfers = [newTransfer, ...state.fundTransfers];
    applyStateUpdate(state.incomeTransactions, state.expenseTransactions, newTransfers);
    addToast(`Transferred ${(amountMinor / 100).toLocaleString()} from ${fromFund.name} to ${toFund.name}`, 'success');
    return { success: true };
  };

  // CREATE FUND
  const createFund = (data: {
    name: string;
    category: Fund['category'];
    allocationPercentage: number;
    color: string;
    icon: string;
    allowOverdraft: boolean;
    targetGoalMinor?: number;
    description?: string;
    isEmergencyFund?: boolean;
    isSavingsFund?: boolean;
  }): { success: boolean; error?: string } => {
    if (!data.name.trim()) {
      return { success: false, error: 'Fund name is required' };
    }

    // Verify percentage
    const currentSum = state.funds.reduce((acc, f) => acc + f.allocationPercentage, 0);
    if (currentSum + data.allocationPercentage > 100) {
      return {
        success: false,
        error: `Total allocation would exceed 100% (${currentSum + data.allocationPercentage}%). Please adjust existing fund percentages first.`,
      };
    }

    const newFund: Fund = {
      id: `fund-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: data.name.trim(),
      category: data.category,
      allocationPercentage: data.allocationPercentage,
      color: data.color || '#3b82f6',
      icon: data.icon || 'Folder',
      currentBalance: 0,
      totalAllocated: 0,
      totalSpent: 0,
      allowOverdraft: data.allowOverdraft,
      targetGoal: data.targetGoalMinor,
      description: data.description,
      isEmergencyFund: data.isEmergencyFund || false,
      isSavingsFund: data.isSavingsFund || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newFunds = [...state.funds, newFund];
    applyStateUpdate(state.incomeTransactions, state.expenseTransactions, state.fundTransfers, newFunds);
    addToast(`New fund "${newFund.name}" created`, 'success');
    return { success: true };
  };

  // UPDATE FUND
  const updateFund = (id: string, data: Partial<Fund>): { success: boolean; error?: string } => {
    const index = state.funds.findIndex((f) => f.id === id);
    if (index === -1) return { success: false, error: 'Fund not found' };

    if (data.allocationPercentage !== undefined) {
      const otherSum = state.funds
        .filter((f) => f.id !== id)
        .reduce((acc, f) => acc + f.allocationPercentage, 0);

      if (otherSum + data.allocationPercentage > 100) {
        return {
          success: false,
          error: `Total percentage would exceed 100% (${otherSum + data.allocationPercentage}%). Maximum allowed for this fund is ${100 - otherSum}%.`,
        };
      }
    }

    const updatedFunds = [...state.funds];
    updatedFunds[index] = {
      ...updatedFunds[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    applyStateUpdate(state.incomeTransactions, state.expenseTransactions, state.fundTransfers, updatedFunds);
    addToast('Fund configuration saved', 'success');
    return { success: true };
  };

  // DELETE FUND
  const deleteFund = (id: string, transferBalanceToFundId?: string): { success: boolean; error?: string } => {
    const fund = state.funds.find((f) => f.id === id);
    if (!fund) return { success: false, error: 'Fund not found' };

    let currentTransfers = [...state.fundTransfers];

    if (fund.currentBalance !== 0) {
      if (!transferBalanceToFundId) {
        return {
          success: false,
          error: `Fund "${fund.name}" has an active balance of ${(
            fund.currentBalance / 100
          ).toLocaleString()}. Please select a destination fund to transfer remaining funds to before deleting.`,
        };
      }

      const destFund = state.funds.find((f) => f.id === transferBalanceToFundId);
      if (!destFund) return { success: false, error: 'Destination fund not found' };

      // Create an automatic closing sweep transfer
      const sweepTransfer: FundTransfer = {
        id: `tr-close-${Date.now()}`,
        fromFundId: fund.id,
        fromFundName: fund.name,
        toFundId: destFund.id,
        toFundName: destFund.name,
        amount: fund.currentBalance,
        date: new Date().toISOString().split('T')[0],
        note: `Closing balance sweep upon deletion of fund ${fund.name}`,
        createdAt: new Date().toISOString(),
      };
      currentTransfers.push(sweepTransfer);
    }

    const remainingFunds = state.funds.filter((f) => f.id !== id);
    applyStateUpdate(state.incomeTransactions, state.expenseTransactions, currentTransfers, remainingFunds);
    addToast(`Fund "${fund.name}" removed`, 'info');
    return { success: true };
  };

  // ALLOCATION RULES
  const saveAllocationRule = (rule: AllocationRule) => {
    const exists = state.allocationRules.some((r) => r.id === rule.id);
    let updatedRules: AllocationRule[];

    if (exists) {
      updatedRules = state.allocationRules.map((r) => (r.id === rule.id ? rule : r));
    } else {
      updatedRules = [...state.allocationRules, rule];
    }

    if (rule.isDefault) {
      updatedRules = updatedRules.map((r) => ({ ...r, isDefault: r.id === rule.id }));
    }

    setState((prev) => ({ ...prev, allocationRules: updatedRules }));
    addToast(`Allocation rule "${rule.name}" saved`, 'success');
  };

  const setDefaultAllocationRule = (ruleId: string) => {
    const updated = state.allocationRules.map((r) => ({
      ...r,
      isDefault: r.id === ruleId,
    }));
    setState((prev) => ({ ...prev, allocationRules: updated }));
    addToast('Default allocation rule updated for future income', 'success');
  };

  const deleteAllocationRule = (ruleId: string) => {
    if (state.allocationRules.length <= 1) {
      addToast('Cannot delete the last allocation rule', 'error');
      return;
    }
    const filtered = state.allocationRules.filter((r) => r.id !== ruleId);
    if (!filtered.some((r) => r.isDefault)) {
      filtered[0].isDefault = true;
    }
    setState((prev) => ({ ...prev, allocationRules: filtered }));
    addToast('Allocation rule deleted', 'info');
  };

  // SETTINGS
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings },
    }));
    addToast('Settings updated successfully', 'success');
  };

  // RESET TO SAMPLE DATA
  const resetToSampleData = () => {
    const freshState: AppState = {
      funds: DEFAULT_FUNDS,
      incomeTransactions: INITIAL_INCOME_TRANSACTIONS,
      expenseTransactions: INITIAL_EXPENSE_TRANSACTIONS,
      fundTransfers: INITIAL_TRANSFERS,
      allocationRules: DEFAULT_RULES,
      settings: DEFAULT_SETTINGS,
      unallocatedBalance: 0,
      lastUpdated: new Date().toISOString(),
    };
    setState(freshState);
    addToast('Reset to realistic sample financial data', 'info');
  };

  // EXPORT / IMPORT
  const exportDataJson = (): string => {
    return JSON.stringify(state, null, 2);
  };

  const importDataJson = (json: string): { success: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(json);
      if (!parsed.funds || !parsed.incomeTransactions || !parsed.expenseTransactions) {
        return { success: false, error: 'Invalid backup file structure' };
      }
      setState(parsed);
      addToast('Financial data restored successfully', 'success');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to parse JSON file' };
    }
  };

  // UNIFIED TRANSACTIONS LIST
  const unifiedTransactions = useMemo<UnifiedTransaction[]>(() => {
    const list: UnifiedTransaction[] = [];

    // Income
    state.incomeTransactions.forEach((inc) => {
      list.push({
        id: `unified-${inc.id}`,
        type: 'income',
        date: inc.date,
        title: `${inc.source}: ${inc.category}`,
        amount: inc.amount,
        category: inc.category,
        description: inc.description,
        rawIncomeId: inc.id,
        allocations: inc.allocations,
      });
    });

    // Expense
    state.expenseTransactions.forEach((exp) => {
      list.push({
        id: `unified-${exp.id}`,
        type: 'expense',
        date: exp.date,
        title: exp.title,
        amount: exp.amount,
        category: exp.category,
        fundId: exp.fundId,
        fundName: exp.fundName,
        description: exp.description,
        rawExpenseId: exp.id,
      });
    });

    // Transfer
    state.fundTransfers.forEach((tr) => {
      list.push({
        id: `unified-${tr.id}`,
        type: 'transfer',
        date: tr.date,
        title: `Transfer: ${tr.fromFundName} → ${tr.toFundName}`,
        amount: tr.amount,
        category: 'Fund Transfer',
        fundId: tr.fromFundId,
        fundName: tr.fromFundName,
        relatedFundName: tr.toFundName,
        description: tr.note,
        rawTransferId: tr.id,
      });
    });

    // Sort descending by date, then by creation time
    return list.sort((a, b) => {
      const cmp = new Date(b.date).getTime() - new Date(a.date).getTime();
      return cmp !== 0 ? cmp : b.id.localeCompare(a.id);
    });
  }, [state.incomeTransactions, state.expenseTransactions, state.fundTransfers]);

  // DATE FILTERING HELPER
  const isDateInFilter = (dateStr: string, filter: DateFilter): boolean => {
    if (filter.range === 'all') return true;
    const now = new Date();
    const target = new Date(dateStr);

    if (filter.range === 'today') {
      return target.toDateString() === now.toDateString();
    }
    if (filter.range === 'this_week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return target >= oneWeekAgo && target <= now;
    }
    if (filter.range === 'this_month') {
      return (
        target.getFullYear() === now.getFullYear() && target.getMonth() === now.getMonth()
      );
    }
    if (filter.range === 'this_year') {
      return target.getFullYear() === now.getFullYear();
    }
    if (filter.range === 'custom') {
      if (filter.startDate && dateStr < filter.startDate) return false;
      if (filter.endDate && dateStr > filter.endDate) return false;
      return true;
    }
    return true;
  };

  const filteredUnifiedTransactions = useMemo(() => {
    return unifiedTransactions.filter((tx) => isDateInFilter(tx.date, dateFilter));
  }, [unifiedTransactions, dateFilter]);

  // FINANCIAL SUMMARY (Filtered by current date range)
  const filteredSummary = useMemo<FinancialSummary>(() => {
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalAllocated = 0;

    // Filter incomes
    state.incomeTransactions.forEach((inc) => {
      if (isDateInFilter(inc.date, dateFilter)) {
        totalIncome += inc.amount;
        inc.allocations.forEach((a) => {
          totalAllocated += a.amount;
        });
      }
    });

    // Filter expenses
    state.expenseTransactions.forEach((exp) => {
      if (isDateInFilter(exp.date, dateFilter)) {
        totalExpenses += exp.amount;
      }
    });

    // Total available balance is across all current fund balances + unallocated balance
    const totalAvailableBalance = state.funds.reduce((acc, f) => acc + f.currentBalance, 0);

    // Total Savings: Funds designated as savings or investments
    const totalSavings = state.funds
      .filter((f) => f.isSavingsFund || f.category === 'savings' || f.category === 'investments')
      .reduce((acc, f) => acc + f.currentBalance, 0);

    // Emergency fund balance
    const emergencyFund = state.funds.find((f) => f.isEmergencyFund || f.category === 'emergency');
    const emergencyFundBalance = emergencyFund ? emergencyFund.currentBalance : 0;

    // Net Savings Rate: (Income - Expenses) / Income * 100
    const netSavingsRate =
      totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalExpenses) / totalIncome) * 100)) : 0;

    const fundBalances: { [id: string]: number } = {};
    state.funds.forEach((f) => {
      fundBalances[f.id] = f.currentBalance;
    });

    return {
      totalIncome,
      totalExpenses,
      totalAllocated,
      totalAvailableBalance,
      unallocatedBalance: state.unallocatedBalance,
      totalSavings,
      emergencyFundBalance,
      netSavingsRate,
      fundBalances,
    };
  }, [state, dateFilter]);

  return (
    <FinanceContext.Provider
      value={{
        funds: state.funds,
        incomeTransactions: state.incomeTransactions,
        expenseTransactions: state.expenseTransactions,
        fundTransfers: state.fundTransfers,
        allocationRules: state.allocationRules,
        settings: state.settings,
        unallocatedBalance: state.unallocatedBalance,
        dateFilter,
        setDateFilter,
        filteredSummary,
        unifiedTransactions,
        filteredUnifiedTransactions,
        toasts,
        addToast,
        removeToast,
        addIncome,
        updateIncome,
        deleteIncome,
        addExpense,
        updateExpense,
        deleteExpense,
        transferFunds,
        createFund,
        updateFund,
        deleteFund,
        saveAllocationRule,
        setDefaultAllocationRule,
        deleteAllocationRule,
        updateSettings,
        resetToSampleData,
        exportDataJson,
        importDataJson,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
