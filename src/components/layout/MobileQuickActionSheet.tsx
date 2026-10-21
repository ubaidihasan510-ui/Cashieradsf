import React from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Sliders,
  X,
  Layers,
  BarChart3,
  Settings,
  ReceiptText,
} from 'lucide-react';
import { NavItemKey } from './Sidebar.tsx';

interface MobileQuickActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIncome: () => void;
  onSelectExpense: () => void;
  onSelectTransfer: () => void;
  onSelectRules: () => void;
}

export const MobileQuickActionSheet: React.FC<MobileQuickActionSheetProps> = ({
  isOpen,
  onClose,
  onSelectIncome,
  onSelectExpense,
  onSelectTransfer,
  onSelectRules,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl p-6 pb-8 space-y-4 animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab Handle */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto -mt-2 mb-3" />

        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base text-slate-900">Quick Financial Action</h3>
            <p className="text-xs text-slate-500">Record money movement or manage fund rules</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Primary Mobile Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* Add Income */}
          <button
            onClick={() => {
              onClose();
              onSelectIncome();
            }}
            className="flex flex-col items-start p-4 bg-emerald-50/70 hover:bg-emerald-100/70 active:scale-98 border border-emerald-200/80 rounded-2xl text-left transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-xs">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <span className="font-bold text-xs text-slate-900">Add Income</span>
            <span className="text-[11px] text-emerald-700 font-medium mt-0.5">
              Auto-split by % rules
            </span>
          </button>

          {/* Add Expense */}
          <button
            onClick={() => {
              onClose();
              onSelectExpense();
            }}
            className="flex flex-col items-start p-4 bg-rose-50/70 hover:bg-rose-100/70 active:scale-98 border border-rose-200/80 rounded-2xl text-left transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center mb-2 shadow-xs">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <span className="font-bold text-xs text-slate-900">Record Expense</span>
            <span className="text-[11px] text-rose-700 font-medium mt-0.5">
              Deduct from fund
            </span>
          </button>

          {/* Fund Transfer */}
          <button
            onClick={() => {
              onClose();
              onSelectTransfer();
            }}
            className="flex flex-col items-start p-4 bg-blue-50/70 hover:bg-blue-100/70 active:scale-98 border border-blue-200/80 rounded-2xl text-left transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-2 shadow-xs">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <span className="font-bold text-xs text-slate-900">Transfer Funds</span>
            <span className="text-[11px] text-blue-700 font-medium mt-0.5">
              Internal rebalance
            </span>
          </button>

          {/* Allocation Rules */}
          <button
            onClick={() => {
              onClose();
              onSelectRules();
            }}
            className="flex flex-col items-start p-4 bg-indigo-50/70 hover:bg-indigo-100/70 active:scale-98 border border-indigo-200/80 rounded-2xl text-left transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-2 shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <span className="font-bold text-xs text-slate-900">Allocation Rules</span>
            <span className="text-[11px] text-indigo-700 font-medium mt-0.5">
              Configure % split
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeNav: NavItemKey;
  onSelectNav: (key: NavItemKey) => void;
}

export const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({
  isOpen,
  onClose,
  activeNav,
  onSelectNav,
}) => {
  if (!isOpen) return null;

  const menuItems: { key: NavItemKey; label: string; desc: string; icon: React.FC<{ className?: string }> }[] = [
    { key: 'income', label: 'Income Management', desc: 'View, search and edit all income streams', icon: ArrowDownLeft },
    { key: 'expenses', label: 'Expense Management', desc: 'Track spending deducted from funds', icon: ArrowUpRight },
    { key: 'reports', label: 'Reports & Analytics', desc: 'Monthly trends, graphs and annual summaries', icon: BarChart3 },
    { key: 'rules', label: 'Allocation Percentage Rules', desc: 'Customize percentage distributions', icon: Sliders },
    { key: 'settings', label: 'Settings & Preferences', desc: 'Currency, categories, backup & restore', icon: Settings },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl p-6 pb-8 space-y-4 animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto -mt-2 mb-3" />

        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base text-slate-900">All Modules & Tools</h3>
            <p className="text-xs text-slate-500">Access full ledger analytics and configurations</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isCurrent = activeNav === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onSelectNav(item.key);
                  onClose();
                }}
                className={`w-full flex items-center gap-3.5 p-3 rounded-xl text-left transition-colors ${
                  isCurrent ? 'bg-blue-50 text-blue-900 font-semibold' : 'hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold block">{item.label}</span>
                  <span className="text-[11px] text-slate-400 block truncate">{item.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
