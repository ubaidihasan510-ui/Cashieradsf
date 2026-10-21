import {
  AppSettings,
  AllocationRule,
  ExpenseTransaction,
  Fund,
  FundTransfer,
  IncomeTransaction,
  UnifiedTransaction,
} from '../types/finance.ts';
import { calculateAllocations, toMinorUnits } from './currency.ts';

const STORAGE_KEY = 'fundflow_app_state_v1';

export interface AppState {
  funds: Fund[];
  incomeTransactions: IncomeTransaction[];
  expenseTransactions: ExpenseTransaction[];
  fundTransfers: FundTransfer[];
  allocationRules: AllocationRule[];
  settings: AppSettings;
  unallocatedBalance: number; // in minor units
  lastUpdated: string;
}

export const DEFAULT_FUNDS: Fund[] = [
  {
    id: 'fund-1',
    name: 'Personal Expenses',
    category: 'expenses',
    allocationPercentage: 20,
    color: '#10b981', // emerald
    icon: 'User',
    currentBalance: toMinorUnits(16500),
    totalAllocated: toMinorUnits(24000),
    totalSpent: toMinorUnits(7500),
    allowOverdraft: false,
    description: 'Day to day living, food, household and personal essentials',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'fund-2',
    name: 'Business Expenses',
    category: 'business',
    allocationPercentage: 30,
    color: '#2563eb', // blue
    icon: 'Briefcase',
    currentBalance: toMinorUnits(22000),
    totalAllocated: toMinorUnits(36000),
    totalSpent: toMinorUnits(14000),
    allowOverdraft: true,
    description: 'Operational costs, subscriptions, hosting, and office supply',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'fund-3',
    name: 'Savings',
    category: 'savings',
    allocationPercentage: 20,
    color: '#6366f1', // indigo
    icon: 'PiggyBank',
    currentBalance: toMinorUnits(26000),
    totalAllocated: toMinorUnits(24000),
    totalSpent: toMinorUnits(0),
    allowOverdraft: false,
    isSavingsFund: true,
    targetGoal: toMinorUnits(100000),
    description: 'Long term wealth accumulation and future goals',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'fund-4',
    name: 'Emergency Fund',
    category: 'emergency',
    allocationPercentage: 10,
    color: '#f59e0b', // amber
    icon: 'ShieldCheck',
    currentBalance: toMinorUnits(12000),
    totalAllocated: toMinorUnits(12000),
    totalSpent: toMinorUnits(0),
    allowOverdraft: false,
    isEmergencyFund: true,
    targetGoal: toMinorUnits(50000),
    description: '6 months buffer for unforeseen emergencies and medical needs',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'fund-5',
    name: 'Investments',
    category: 'investments',
    allocationPercentage: 10,
    color: '#8b5cf6', // violet
    icon: 'TrendingUp',
    currentBalance: toMinorUnits(12000),
    totalAllocated: toMinorUnits(12000),
    totalSpent: toMinorUnits(0),
    allowOverdraft: false,
    isSavingsFund: true,
    description: 'Stock market, mutual funds, gold, and growth assets',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'fund-6',
    name: 'Marketing Budget',
    category: 'business',
    allocationPercentage: 10,
    color: '#06b6d4', // cyan
    icon: 'Megaphone',
    currentBalance: toMinorUnits(7200),
    totalAllocated: toMinorUnits(12000),
    totalSpent: toMinorUnits(4800),
    allowOverdraft: false,
    description: 'Ad campaigns, social promotions, and branding',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
];

export const DEFAULT_RULES: AllocationRule[] = [
  {
    id: 'rule-standard',
    name: 'Standard 6-Fund Rule',
    description: 'Default 20/30/20/10/10/10 allocation for balanced personal & business management',
    isDefault: true,
    items: [
      { fundId: 'fund-1', percentage: 20 },
      { fundId: 'fund-2', percentage: 30 },
      { fundId: 'fund-3', percentage: 20 },
      { fundId: 'fund-4', percentage: 10 },
      { fundId: 'fund-5', percentage: 10 },
      { fundId: 'fund-6', percentage: 10 },
    ],
    createdAt: '2026-01-01',
  },
  {
    id: 'rule-savings-heavy',
    name: 'Growth & Savings Accelerator',
    description: 'Focuses 40% on savings and investments',
    isDefault: false,
    items: [
      { fundId: 'fund-1', percentage: 20 },
      { fundId: 'fund-2', percentage: 20 },
      { fundId: 'fund-3', percentage: 25 },
      { fundId: 'fund-4', percentage: 15 },
      { fundId: 'fund-5', percentage: 15 },
      { fundId: 'fund-6', percentage: 5 },
    ],
    createdAt: '2026-01-01',
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  currency: 'BDT',
  dateFormat: 'DD/MM/YYYY',
  allowGlobalOverdraft: false,
  theme: 'light',
  userName: 'Hasan Ali',
  businessName: 'Apex Studio Ltd.',
  incomeCategories: [
    'Client Projects',
    'Business Sales',
    'Freelance Work',
    'Monthly Salary',
    'Consulting',
    'Dividends & Return',
    'Other Income',
  ],
  incomeSources: [
    'Client Payments',
    'Business Sales',
    'Freelance Work',
    'Salary',
    'Commissions',
    'Other',
  ],
  expenseCategories: [
    'Food & Dining',
    'Office Rent',
    'Utilities & Internet',
    'Software & Cloud Tools',
    'Salaries & Contractor Pay',
    'Advertising & Marketing',
    'Transport & Logistics',
    'Personal Spending',
    'Taxes & Legal',
    'Miscellaneous',
  ],
  paymentMethods: [
    'Bank Transfer',
    'Cash',
    'bKash / Mobile Banking',
    'Nagad',
    'Credit/Debit Card',
    'Cheque',
  ],
};

export const INITIAL_INCOME_TRANSACTIONS: IncomeTransaction[] = [
  {
    id: 'inc-1',
    amount: toMinorUnits(50000),
    source: 'Client Payments',
    category: 'Client Projects',
    date: '2026-10-15',
    paymentMethod: 'Bank Transfer',
    description: 'Full-stack web application milestone delivery',
    ruleId: 'rule-standard',
    ruleName: 'Standard 6-Fund Rule',
    isExcludedFromAllocation: false,
    allocations: [
      { fundId: 'fund-1', fundName: 'Personal Expenses', percentage: 20, amount: toMinorUnits(10000) },
      { fundId: 'fund-2', fundName: 'Business Expenses', percentage: 30, amount: toMinorUnits(15000) },
      { fundId: 'fund-3', fundName: 'Savings', percentage: 20, amount: toMinorUnits(10000) },
      { fundId: 'fund-4', fundName: 'Emergency Fund', percentage: 10, amount: toMinorUnits(5000) },
      { fundId: 'fund-5', fundName: 'Investments', percentage: 10, amount: toMinorUnits(5000) },
      { fundId: 'fund-6', fundName: 'Marketing Budget', percentage: 10, amount: toMinorUnits(5000) },
    ],
    unallocatedAmount: 0,
    createdAt: '2026-10-15T10:00:00Z',
    updatedAt: '2026-10-15T10:00:00Z',
  },
  {
    id: 'inc-2',
    amount: toMinorUnits(70000),
    source: 'Salary',
    category: 'Monthly Salary',
    date: '2026-10-01',
    paymentMethod: 'Bank Transfer',
    description: 'Executive monthly consultancy retainer',
    ruleId: 'rule-standard',
    ruleName: 'Standard 6-Fund Rule',
    isExcludedFromAllocation: false,
    allocations: [
      { fundId: 'fund-1', fundName: 'Personal Expenses', percentage: 20, amount: toMinorUnits(14000) },
      { fundId: 'fund-2', fundName: 'Business Expenses', percentage: 30, amount: toMinorUnits(21000) },
      { fundId: 'fund-3', fundName: 'Savings', percentage: 20, amount: toMinorUnits(14000) },
      { fundId: 'fund-4', fundName: 'Emergency Fund', percentage: 10, amount: toMinorUnits(7000) },
      { fundId: 'fund-5', fundName: 'Investments', percentage: 10, amount: toMinorUnits(7000) },
      { fundId: 'fund-6', fundName: 'Marketing Budget', percentage: 10, amount: toMinorUnits(7000) },
    ],
    unallocatedAmount: 0,
    createdAt: '2026-10-01T09:00:00Z',
    updatedAt: '2026-10-01T09:00:00Z',
  },
];

export const INITIAL_EXPENSE_TRANSACTIONS: ExpenseTransaction[] = [
  {
    id: 'exp-1',
    amount: toMinorUnits(7500),
    title: 'Monthly Groceries & Home Utilities',
    category: 'Food & Dining',
    date: '2026-10-18',
    paymentMethod: 'Credit/Debit Card',
    fundId: 'fund-1',
    fundName: 'Personal Expenses',
    description: 'Organic provisions and monthly fresh grocery restock',
    createdAt: '2026-10-18T14:30:00Z',
    updatedAt: '2026-10-18T14:30:00Z',
  },
  {
    id: 'exp-2',
    amount: toMinorUnits(14000),
    title: 'AWS Cloud Hosting & Figma Workspace',
    category: 'Software & Cloud Tools',
    date: '2026-10-12',
    paymentMethod: 'Credit/Debit Card',
    fundId: 'fund-2',
    fundName: 'Business Expenses',
    description: 'Cloud server infrastructure and annual design team licenses',
    createdAt: '2026-10-12T11:00:00Z',
    updatedAt: '2026-10-12T11:00:00Z',
  },
  {
    id: 'exp-3',
    amount: toMinorUnits(4800),
    title: 'Meta Sponsored Ads & Google Search Ads',
    category: 'Advertising & Marketing',
    date: '2026-10-19',
    paymentMethod: 'Credit/Debit Card',
    fundId: 'fund-6',
    fundName: 'Marketing Budget',
    description: 'Q4 client acquisition campaign for B2B engineering services',
    createdAt: '2026-10-19T16:00:00Z',
    updatedAt: '2026-10-19T16:00:00Z',
  },
];

export const INITIAL_TRANSFERS: FundTransfer[] = [
  {
    id: 'tr-1',
    fromFundId: 'fund-1',
    fromFundName: 'Personal Expenses',
    toFundId: 'fund-3',
    toFundName: 'Savings',
    amount: toMinorUnits(2000),
    date: '2026-10-16',
    note: 'Surplus personal budget swept into high-yield savings',
    createdAt: '2026-10-16T12:00:00Z',
  },
];

export function getInitialAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.funds && parsed.incomeTransactions && parsed.expenseTransactions) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse state from localStorage, falling back to defaults', err);
  }

  const defaultState: AppState = {
    funds: DEFAULT_FUNDS,
    incomeTransactions: INITIAL_INCOME_TRANSACTIONS,
    expenseTransactions: INITIAL_EXPENSE_TRANSACTIONS,
    fundTransfers: INITIAL_TRANSFERS,
    allocationRules: DEFAULT_RULES,
    settings: DEFAULT_SETTINGS,
    unallocatedBalance: 0,
    lastUpdated: new Date().toISOString(),
  };

  saveAppState(defaultState);
  return defaultState;
}

export function saveAppState(state: AppState): void {
  try {
    state.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save state to localStorage', err);
  }
}

/**
 * Recalculates all fund balances dynamically based on the exact financial formula:
 * Fund Balance = Total Allocations + Incoming Transfers - Expenses - Outgoing Transfers + Adjustments
 * Also updates totalAllocated and totalSpent for each fund.
 */
export function recalculateAllFundBalances(
  funds: Fund[],
  incomeTransactions: IncomeTransaction[],
  expenseTransactions: ExpenseTransaction[],
  transfers: FundTransfer[]
): { updatedFunds: Fund[]; totalUnallocated: number } {
  // Map of stats per fund
  const statsMap: Record<
    string,
    { allocated: number; spent: number; transferIn: number; transferOut: number }
  > = {};

  funds.forEach((f) => {
    statsMap[f.id] = { allocated: 0, spent: 0, transferIn: 0, transferOut: 0 };
  });

  let totalUnallocated = 0;

  // Process Incomes and their allocations
  incomeTransactions.forEach((inc) => {
    totalUnallocated += inc.unallocatedAmount || 0;
    inc.allocations.forEach((alloc) => {
      if (statsMap[alloc.fundId]) {
        statsMap[alloc.fundId].allocated += alloc.amount;
      } else {
        // Fallback to unallocated if fund was deleted
        totalUnallocated += alloc.amount;
      }
    });
  });

  // Process Expenses
  expenseTransactions.forEach((exp) => {
    if (statsMap[exp.fundId]) {
      statsMap[exp.fundId].spent += exp.amount;
    }
  });

  // Process Transfers
  transfers.forEach((tr) => {
    if (statsMap[tr.fromFundId]) {
      statsMap[tr.fromFundId].transferOut += tr.amount;
    }
    if (statsMap[tr.toFundId]) {
      statsMap[tr.toFundId].transferIn += tr.amount;
    }
  });

  const updatedFunds = funds.map((fund) => {
    const stats = statsMap[fund.id] || { allocated: 0, spent: 0, transferIn: 0, transferOut: 0 };
    const currentBalance = stats.allocated + stats.transferIn - stats.spent - stats.transferOut;

    return {
      ...fund,
      totalAllocated: stats.allocated,
      totalSpent: stats.spent,
      currentBalance,
      updatedAt: new Date().toISOString(),
    };
  });

  return { updatedFunds, totalUnallocated };
}
