import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  RotateCcw,
  Download,
  Upload,
  User,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Database,
  Cloud,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { CURRENCIES } from '../../utils/currency.ts';
import { CurrencyCode } from '../../types/finance.ts';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  pushStateToSupabase,
} from '../../lib/supabase.ts';

export const SettingsView: React.FC = () => {
  const {
    funds,
    incomeTransactions,
    expenseTransactions,
    fundTransfers,
    allocationRules,
    settings,
    unallocatedBalance,
    updateSettings,
    resetToSampleData,
    exportDataJson,
    importDataJson,
    addToast,
  } = useFinance();

  const [userName, setUserName] = useState(settings.userName);
  const [businessName, setBusinessName] = useState(settings.businessName);
  const [currency, setCurrency] = useState<CurrencyCode>(settings.currency);
  const [dateFormat, setDateFormat] = useState(settings.dateFormat);
  const [allowGlobalOverdraft, setAllowGlobalOverdraft] = useState(settings.allowGlobalOverdraft);

  // Categories manager
  const [incomeCats, setIncomeCats] = useState<string[]>([...settings.incomeCategories]);
  const [expenseCats, setExpenseCats] = useState<string[]>([...settings.expenseCategories]);
  const [newIncomeCat, setNewIncomeCat] = useState('');
  const [newExpenseCat, setNewExpenseCat] = useState('');

  // Supabase Configuration State
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<{
    tested: boolean;
    success?: boolean;
    message?: string;
  }>({ tested: false });
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [showSqlSchema, setShowSqlSchema] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    const config = getSupabaseConfig();
    setSupabaseUrl(config.url);
    setSupabaseAnonKey(config.anonKey);
    if (config.url && config.anonKey) {
      testSupabaseConnection(config).then((res) => {
        setSupabaseStatus({ tested: true, success: res.success, message: res.message });
      });
    }
  }, []);

  // Import file ref
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleSaveProfileAndGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      userName: userName.trim(),
      businessName: businessName.trim(),
      currency,
      dateFormat,
      allowGlobalOverdraft,
      incomeCategories: incomeCats,
      expenseCategories: expenseCats,
    });
  };

  const handleAddIncomeCategory = () => {
    if (!newIncomeCat.trim()) return;
    if (incomeCats.includes(newIncomeCat.trim())) {
      addToast('Category already exists', 'error');
      return;
    }
    const updated = [...incomeCats, newIncomeCat.trim()];
    setIncomeCats(updated);
    updateSettings({ incomeCategories: updated });
    setNewIncomeCat('');
  };

  const handleRemoveIncomeCategory = (cat: string) => {
    if (incomeCats.length <= 1) {
      addToast('At least one income category is required', 'error');
      return;
    }
    const updated = incomeCats.filter((c) => c !== cat);
    setIncomeCats(updated);
    updateSettings({ incomeCategories: updated });
  };

  const handleAddExpenseCategory = () => {
    if (!newExpenseCat.trim()) return;
    if (expenseCats.includes(newExpenseCat.trim())) {
      addToast('Category already exists', 'error');
      return;
    }
    const updated = [...expenseCats, newExpenseCat.trim()];
    setExpenseCats(updated);
    updateSettings({ expenseCategories: updated });
    setNewExpenseCat('');
  };

  const handleRemoveExpenseCategory = (cat: string) => {
    if (expenseCats.length <= 1) {
      addToast('At least one expense category is required', 'error');
      return;
    }
    const updated = expenseCats.filter((c) => c !== cat);
    setExpenseCats(updated);
    updateSettings({ expenseCategories: updated });
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FundFlow_Full_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Backup exported successfully', 'success');
  };

  const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importDataJson(content);
        if (res.success) {
          addToast('Backup restored successfully!', 'success');
        } else {
          addToast(res.error || 'Failed to restore backup', 'error');
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Supabase actions
  const handleSaveAndTestSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTestingSupabase(true);
    const config = {
      url: supabaseUrl.trim(),
      anonKey: supabaseAnonKey.trim(),
    };
    saveSupabaseConfig(config);

    const res = await testSupabaseConnection(config);
    setSupabaseStatus({ tested: true, success: res.success, message: res.message });
    setIsTestingSupabase(false);

    if (res.success) {
      addToast('Supabase connected successfully!', 'success');
    } else {
      addToast(res.message, 'error');
    }
  };

  const handlePushToSupabase = async () => {
    setIsSyncingCloud(true);
    const currentState = {
      funds,
      incomeTransactions,
      expenseTransactions,
      fundTransfers,
      allocationRules,
      settings,
      unallocatedBalance,
      lastUpdated: new Date().toISOString(),
    };

    const res = await pushStateToSupabase(currentState);
    setIsSyncingCloud(false);

    if (res.success) {
      addToast('All local funds & transactions pushed to Supabase!', 'success');
    } else {
      addToast(res.error || 'Failed to sync to Supabase', 'error');
    }
  };

  const sqlSchemaText = `-- FundFlow Supabase Schema
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

CREATE TABLE IF NOT EXISTS allocation_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

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

ALTER TABLE funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all access on funds" ON funds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on allocation_rules" ON allocation_rules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on income_transactions" ON income_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on expense_transactions" ON expense_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on fund_transfers" ON fund_transfers FOR ALL USING (true) WITH CHECK (true);`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlSchemaText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
    addToast('SQL schema copied to clipboard!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            System Preferences
          </span>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            Settings & Account Configuration
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Cloud database, currency formatting, category taxonomies, backup, and restore
          </p>
        </div>
      </div>

      {/* 1. SUPABASE CLOUD DATABASE CONNECTION PANEL */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Supabase Cloud Database (PostgreSQL)</h3>
                {supabaseStatus.tested && supabaseStatus.success ? (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Connected</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-medium">
                    Local Storage Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Connect your free Supabase PostgreSQL database for persistent cross-device cloud sync
              </p>
            </div>
          </div>

          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <span>Supabase Dashboard</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Quick Instructions in Bengali & English */}
        <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 text-xs text-emerald-950 space-y-1">
          <span className="font-bold flex items-center gap-1.5 text-emerald-900">
            <span>কানেক্ট করার ৩টি সহজ ধাপ (3 Simple Steps to Connect):</span>
          </span>
          <ol className="list-decimal list-inside space-y-1 text-emerald-900/90 text-[11px] leading-relaxed pl-1">
            <li>
              <strong>supabase.com</strong> এ গিয়ে একটি ফ্রি প্রজেক্ট তৈরি করুন (New Project)।
            </li>
            <li>
              Supabase এর <strong>SQL Editor</strong> এ গিয়ে নিচের <strong>"Copy SQL Schema"</strong> বাটনে ক্লিক করে কোড পেস্ট করে <strong>Run</strong> করুন।
            </li>
            <li>
              Project Settings &gt; <strong>API</strong> থেকে <strong>Project URL</strong> এবং <strong>anon/public Key</strong> কপি করে নিচের বক্সে বসিয়ে <strong>"Connect & Test"</strong> চাপুন।
            </li>
          </ol>
        </div>

        {/* Supabase URL & Anon Key Form */}
        <form onSubmit={handleSaveAndTestSupabase} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                placeholder="https://your-project-id.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Supabase Anon / Public Key
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Connection Test Status Message */}
          {supabaseStatus.tested && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                supabaseStatus.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {supabaseStatus.success ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{supabaseStatus.message}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={() => setShowSqlSchema(!showSqlSchema)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <span>{showSqlSchema ? 'Hide SQL Schema' : 'View SQL Migration Schema'}</span>
              {showSqlSchema ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <div className="flex items-center gap-2">
              {supabaseStatus.tested && supabaseStatus.success && (
                <button
                  type="button"
                  onClick={handlePushToSupabase}
                  disabled={isSyncingCloud}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                  <span>{isSyncingCloud ? 'Syncing...' : 'Push Local Data to Supabase'}</span>
                </button>
              )}

              <button
                type="submit"
                disabled={isTestingSupabase}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition-colors"
              >
                <span>{isTestingSupabase ? 'Testing Connection...' : 'Connect & Test'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Expandable SQL Schema Script */}
        {showSqlSchema && (
          <div className="mt-3 p-3 bg-slate-900 rounded-xl text-slate-200 text-xs font-mono space-y-2 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[11px] text-slate-400">supabase_schema.sql</span>
              <button
                onClick={copySqlToClipboard}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-sans font-semibold transition-colors"
              >
                {copiedSql ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copied!' : 'Copy SQL Schema'}</span>
              </button>
            </div>
            <pre className="max-h-56 overflow-y-auto text-[11px] text-emerald-400/90 leading-relaxed pr-2">
              {sqlSchemaText}
            </pre>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile & Currency Settings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            Account & Localization
          </h3>

          <form onSubmit={handleSaveProfileAndGeneral} className="space-y-4 text-xs">
            {/* User Name & Business */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">User Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Business / Studio Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Currency Selector */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Primary Currency (Default: BDT ৳)
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {Object.values(CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol}) — {c.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Updates all dashboard, funds, and transaction displays to {currency} format.
              </p>
            </div>

            {/* Date Format */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date Format</label>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 21/10/2026)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 10/21/2026)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-10-21)</option>
              </select>
            </div>

            {/* Global Overdraft Policy */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={allowGlobalOverdraft}
                  onChange={(e) => setAllowGlobalOverdraft(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Allow Global Overdraft on All Funds</span>
              </label>
              <p className="text-[11px] text-slate-500">
                When enabled, expenses and transfers can proceed even if a fund's available balance is
                insufficient (balance will reflect negative).
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save General Settings</span>
              </button>
            </div>
          </form>
        </div>

        {/* Backup & Sample Data Restoration */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Data Management & Backup
            </h3>

            {/* Export JSON */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-slate-900 block">Export Full Database Backup</span>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Download all your funds, income history, expenses, and allocation rules as a single
                  JSON backup file.
                </p>
              </div>
              <button
                onClick={handleDownloadBackup}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-semibold rounded-lg shrink-0 shadow-xs transition-colors"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>Download JSON</span>
              </button>
            </div>

            {/* Import JSON */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-slate-900 block">Restore Database from JSON</span>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Upload a previously saved FundFlow backup to restore all funds and transaction logs.
                </p>
              </div>
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={handleUploadBackup}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-semibold rounded-lg shrink-0 shadow-xs transition-colors"
                >
                  <Upload className="w-4 h-4 text-slate-600" />
                  <span>Restore File</span>
                </button>
              </div>
            </div>

            {/* Reset to Sample Realistic Data */}
            <div className="p-4 bg-rose-50/60 rounded-xl border border-rose-200 flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-rose-900 block">Reset to Realistic Sample Data</span>
                <p className="text-rose-700 text-[11px] mt-0.5">
                  Re-populates the app with sample ৳50,000+ income distributions, realistic expenses,
                  and 6 preconfigured funds.
                </p>
              </div>
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      'Are you sure you want to reset all data back to initial sample state?'
                    )
                  ) {
                    resetToSampleData();
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shrink-0 shadow-xs transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Management Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Categories */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Income Categories</h3>
            <span className="text-xs text-slate-400">{incomeCats.length} categories</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newIncomeCat}
              onChange={(e) => setNewIncomeCat(e.target.value)}
              placeholder="New income category..."
              className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-hidden"
            />
            <button
              onClick={handleAddIncomeCategory}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition-colors"
            >
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {incomeCats.map((cat) => (
              <div
                key={cat}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-xs text-slate-700 font-medium"
              >
                <span>{cat}</span>
                <button
                  onClick={() => handleRemoveIncomeCategory(cat)}
                  className="text-slate-400 hover:text-rose-600 transition-colors ml-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Expense Categories */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Expense Categories</h3>
            <span className="text-xs text-slate-400">{expenseCats.length} categories</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newExpenseCat}
              onChange={(e) => setNewExpenseCat(e.target.value)}
              placeholder="New expense category..."
              className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-hidden"
            />
            <button
              onClick={handleAddExpenseCategory}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs transition-colors"
            >
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {expenseCats.map((cat) => (
              <div
                key={cat}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-xs text-slate-700 font-medium"
              >
                <span>{cat}</span>
                <button
                  onClick={() => handleRemoveExpenseCategory(cat)}
                  className="text-slate-400 hover:text-rose-600 transition-colors ml-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
