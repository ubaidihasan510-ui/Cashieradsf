-- ==========================================================
-- FundFlow: Smart Income & Automatic Fund Allocation System
-- Supabase PostgreSQL Schema & Security Policies
-- ==========================================================

-- 1. Create Funds Table
CREATE TABLE IF NOT EXISTS funds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'expenses',
  allocation_percentage NUMERIC NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#2563eb',
  icon TEXT NOT NULL DEFAULT 'Folder',
  current_balance BIGINT NOT NULL DEFAULT 0,
  total_allocated BIGINT NOT NULL DEFAULT 0,
  total_spent BIGINT NOT NULL DEFAULT 0,
  allow_overdraft BOOLEAN NOT NULL DEFAULT false,
  target_goal BIGINT,
  description TEXT,
  is_emergency_fund BOOLEAN NOT NULL DEFAULT false,
  is_savings_fund BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2. Create Allocation Rules Table
CREATE TABLE IF NOT EXISTS allocation_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 3. Create Income Transactions Table
CREATE TABLE IF NOT EXISTS income_transactions (
  id TEXT PRIMARY KEY,
  amount BIGINT NOT NULL,
  source TEXT NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  payment_method TEXT NOT NULL,
  description TEXT,
  rule_id TEXT,
  rule_name TEXT,
  is_excluded_from_allocation BOOLEAN NOT NULL DEFAULT false,
  allocations JSONB NOT NULL DEFAULT '[]'::jsonb,
  unallocated_amount BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 4. Create Expense Transactions Table
CREATE TABLE IF NOT EXISTS expense_transactions (
  id TEXT PRIMARY KEY,
  amount BIGINT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  payment_method TEXT NOT NULL,
  fund_id TEXT NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
  fund_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 5. Create Fund Transfers Table
CREATE TABLE IF NOT EXISTS fund_transfers (
  id TEXT PRIMARY KEY,
  from_fund_id TEXT NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
  from_fund_name TEXT NOT NULL,
  to_fund_id TEXT NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
  to_fund_name TEXT NOT NULL,
  amount BIGINT NOT NULL,
  date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 6. Create App Settings Table
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  currency TEXT NOT NULL DEFAULT 'BDT',
  date_format TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
  allow_global_overdraft BOOLEAN NOT NULL DEFAULT false,
  theme TEXT NOT NULL DEFAULT 'light',
  user_name TEXT NOT NULL DEFAULT 'Hasan Ali',
  business_name TEXT NOT NULL DEFAULT 'Apex Studio Ltd.',
  income_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  income_sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  expense_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  payment_methods JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
ALTER TABLE funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Allow Public/Anon read and write for the prototype app
CREATE POLICY "Allow public all access on funds" ON funds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on allocation_rules" ON allocation_rules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on income_transactions" ON income_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on expense_transactions" ON expense_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on fund_transfers" ON fund_transfers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on app_settings" ON app_settings FOR ALL USING (true) WITH CHECK (true);
