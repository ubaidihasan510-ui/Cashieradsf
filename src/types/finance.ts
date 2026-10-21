export type CurrencyCode = 'BDT' | 'USD' | 'EUR' | 'GBP' | 'INR' | 'CAD' | 'AUD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  position: 'prefix' | 'suffix';
}

export interface Fund {
  id: string;
  name: string;
  category: 'expenses' | 'savings' | 'emergency' | 'investments' | 'business' | 'other';
  allocationPercentage: number; // e.g. 20 for 20%
  color: string; // Tailwind color key or hex
  icon: string;
  currentBalance: number; // In minor units (e.g. cents/poisha)
  totalAllocated: number;
  totalSpent: number;
  allowOverdraft: boolean;
  targetGoal?: number; // Optional target savings goal in minor units
  description?: string;
  isEmergencyFund?: boolean;
  isSavingsFund?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AllocationRuleItem {
  fundId: string;
  percentage: number;
}

export interface AllocationRule {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  items: AllocationRuleItem[];
  createdAt: string;
}

export interface FundAllocationSplit {
  fundId: string;
  fundName: string;
  percentage: number;
  amount: number; // in minor units
}

export interface IncomeTransaction {
  id: string;
  amount: number; // In minor units
  source: string; // 'Client payments' | 'Business sales' | 'Freelance work' | 'Salary' | 'Commissions' | 'Other'
  category: string;
  date: string; // ISO date YYYY-MM-DD
  paymentMethod: string; // 'Bank Transfer' | 'Cash' | 'Card' | 'Mobile Banking' | 'Other'
  description?: string;
  ruleId?: string; // ID of rule applied
  ruleName?: string;
  isExcludedFromAllocation: boolean;
  allocations: FundAllocationSplit[]; // Recorded allocation breakdown snapshot
  unallocatedAmount: number; // Remainder if allocations < 100% or if excluded
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseTransaction {
  id: string;
  amount: number; // In minor units
  title: string;
  category: string; // 'Food', 'Rent', 'Utilities', 'Software', 'Salaries', 'Advertising', 'Transport', 'Personal', 'Miscellaneous'
  date: string;
  paymentMethod: string;
  fundId: string; // The fund this expense is deducted from
  fundName: string;
  description?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FundTransfer {
  id: string;
  fromFundId: string;
  fromFundName: string;
  toFundId: string;
  toFundName: string;
  amount: number; // In minor units
  date: string;
  note?: string;
  createdAt: string;
}

export type UnifiedTransactionType = 'income' | 'expense' | 'transfer' | 'allocation';

export interface UnifiedTransaction {
  id: string;
  type: UnifiedTransactionType;
  date: string;
  title: string;
  amount: number; // In minor units
  category: string;
  fundName?: string;
  fundId?: string;
  relatedFundName?: string;
  description?: string;
  rawIncomeId?: string;
  rawExpenseId?: string;
  rawTransferId?: string;
  allocations?: FundAllocationSplit[];
}

export interface AppSettings {
  currency: CurrencyCode;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  allowGlobalOverdraft: boolean;
  theme: 'light' | 'dark' | 'system';
  userName: string;
  businessName: string;
  incomeCategories: string[];
  incomeSources: string[];
  expenseCategories: string[];
  paymentMethods: string[];
}

export type DateFilterRange = 'today' | 'this_week' | 'this_month' | 'this_year' | 'custom' | 'all';

export interface DateFilter {
  range: DateFilterRange;
  startDate?: string;
  endDate?: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  totalAllocated: number;
  totalAvailableBalance: number;
  unallocatedBalance: number;
  totalSavings: number;
  emergencyFundBalance: number;
  netSavingsRate: number; // percentage
  fundBalances: { [fundId: string]: number };
}
