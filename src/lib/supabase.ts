import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppState } from '../utils/storage.ts';

const SUPABASE_STORAGE_CONFIG_KEY = 'fundflow_supabase_custom_credentials';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseConfig(): SupabaseConfig {
  // Check local override first
  try {
    const stored = localStorage.getItem(SUPABASE_STORAGE_CONFIG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.url && parsed.anonKey) return parsed;
    }
  } catch (e) {
    // Ignore error
  }

  // Fallback to configured project credentials
  return {
    url:
      (import.meta as any).env?.VITE_SUPABASE_URL ||
      'https://lddsrsgvlzxcxidqhlec.supabase.co',
    anonKey:
      (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZHNyc2d2bHp4Y3hpZHFobGVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1ODQ4NjYsImV4cCI6MjEwODE2MDg2Nn0.guPFRKjY1_aFOdUXPydsI4FYZ6VF8qT6mS_wb8hmB0c',
  };
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  try {
    if (!config.url || !config.anonKey) {
      localStorage.removeItem(SUPABASE_STORAGE_CONFIG_KEY);
    } else {
      localStorage.setItem(SUPABASE_STORAGE_CONFIG_KEY, JSON.stringify(config));
    }
  } catch (e) {
    console.error('Failed to save supabase config', e);
  }
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey || config.url.includes('your-project')) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey);
    } catch (err) {
      console.warn('Could not initialize Supabase client:', err);
      return null;
    }
  }
  return supabaseInstance;
}

export function isSupabaseConfigured(): boolean {
  const config = getSupabaseConfig();
  return Boolean(
    config.url &&
    config.anonKey &&
    !config.url.includes('your-project') &&
    config.url.startsWith('https://')
  );
}

export async function testSupabaseConnection(config?: SupabaseConfig): Promise<{
  success: boolean;
  message: string;
}> {
  const targetConfig = config || getSupabaseConfig();
  if (!targetConfig.url || !targetConfig.anonKey || targetConfig.url.includes('your-project')) {
    return {
      success: false,
      message: 'Supabase URL or Anon Key is missing or invalid.',
    };
  }

  try {
    const client = createClient(targetConfig.url, targetConfig.anonKey);
    const { data, error } = await client.from('funds').select('id').limit(1);

    if (error) {
      // Check if table missing
      if (error.code === '42P01') {
        return {
          success: false,
          message:
            'Connected to Supabase, but the "funds" table does not exist. Please run the SQL schema in your Supabase SQL Editor.',
        };
      }
      return {
        success: false,
        message: `Supabase Error: ${error.message}`,
      };
    }

    return {
      success: true,
      message: 'Successfully connected to your Supabase PostgreSQL database!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Failed to connect to Supabase.',
    };
  }
}

/**
 * Pushes all local financial state into Supabase tables
 */
export async function pushStateToSupabase(state: AppState): Promise<{
  success: boolean;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase is not configured yet.' };
  }

  try {
    // 1. Sync Funds
    if (state.funds.length > 0) {
      const fundPayloads = state.funds.map((f) => ({
        id: f.id,
        name: f.name,
        category: f.category,
        allocation_percentage: f.allocationPercentage,
        color: f.color,
        icon: f.icon,
        current_balance: f.currentBalance,
        total_allocated: f.totalAllocated,
        total_spent: f.totalSpent,
        allow_overdraft: f.allowOverdraft,
        target_goal: f.targetGoal || null,
        description: f.description || '',
        is_emergency_fund: f.isEmergencyFund || false,
        is_savings_fund: f.isSavingsFund || false,
        updated_at: new Date().toISOString(),
      }));
      const { error: fundErr } = await client.from('funds').upsert(fundPayloads);
      if (fundErr) throw fundErr;
    }

    // 2. Sync Allocation Rules
    if (state.allocationRules.length > 0) {
      const rulePayloads = state.allocationRules.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description || '',
        is_default: r.isDefault,
        items: r.items,
      }));
      const { error: ruleErr } = await client.from('allocation_rules').upsert(rulePayloads);
      if (ruleErr) throw ruleErr;
    }

    // 3. Sync Income Transactions
    if (state.incomeTransactions.length > 0) {
      const incomePayloads = state.incomeTransactions.map((i) => ({
        id: i.id,
        amount: i.amount,
        source: i.source,
        category: i.category,
        date: i.date,
        payment_method: i.paymentMethod,
        description: i.description || '',
        rule_id: i.ruleId || null,
        rule_name: i.ruleName || '',
        is_excluded_from_allocation: i.isExcludedFromAllocation,
        allocations: i.allocations,
        unallocated_amount: i.unallocatedAmount,
        updated_at: new Date().toISOString(),
      }));
      const { error: incErr } = await client.from('income_transactions').upsert(incomePayloads);
      if (incErr) throw incErr;
    }

    // 4. Sync Expenses
    if (state.expenseTransactions.length > 0) {
      const expensePayloads = state.expenseTransactions.map((e) => ({
        id: e.id,
        amount: e.amount,
        title: e.title,
        category: e.category,
        date: e.date,
        payment_method: e.paymentMethod,
        fund_id: e.fundId,
        fund_name: e.fundName,
        description: e.description || '',
        updated_at: new Date().toISOString(),
      }));
      const { error: expErr } = await client.from('expense_transactions').upsert(expensePayloads);
      if (expErr) throw expErr;
    }

    // 5. Sync Transfers
    if (state.fundTransfers.length > 0) {
      const transferPayloads = state.fundTransfers.map((t) => ({
        id: t.id,
        from_fund_id: t.fromFundId,
        from_fund_name: t.fromFundName,
        to_fund_id: t.toFundId,
        to_fund_name: t.toFundName,
        amount: t.amount,
        date: t.date,
        note: t.note || '',
      }));
      const { error: trErr } = await client.from('fund_transfers').upsert(transferPayloads);
      if (trErr) throw trErr;
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error syncing data to Supabase' };
  }
}
