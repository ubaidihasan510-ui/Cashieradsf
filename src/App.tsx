/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext.tsx';
import { NavItemKey } from './components/layout/Sidebar.tsx';
import { MobileTopBar } from './components/layout/MobileTopBar.tsx';
import { MobileTabBar } from './components/layout/MobileTabBar.tsx';
import {
  MobileQuickActionSheet,
  MobileMenuDrawer,
} from './components/layout/MobileQuickActionSheet.tsx';
import { DashboardView } from './components/dashboard/DashboardView.tsx';
import { IncomeView } from './components/income/IncomeView.tsx';
import { ExpenseView } from './components/expenses/ExpenseView.tsx';
import { FundsView } from './components/funds/FundsView.tsx';
import { TransactionsView } from './components/transactions/TransactionsView.tsx';
import { ReportsView } from './components/reports/ReportsView.tsx';
import { AllocationRulesView } from './components/rules/AllocationRulesView.tsx';
import { SettingsView } from './components/settings/SettingsView.tsx';
import {
  AddIncomeModal,
  AddExpenseModal,
  FundTransferModal,
  FundModal,
  AllocationDetailModal,
  ToastContainer,
} from './components/common/Modals.tsx';
import { ExpenseTransaction, Fund, IncomeTransaction } from './types/finance.ts';
import { Smartphone, Maximize2, Wifi, Battery, Signal } from 'lucide-react';

const AppContent: React.FC = () => {
  const { incomeTransactions } = useFinance();

  const [activeNav, setActiveNav] = useState<NavItemKey>('dashboard');
  const [phoneFrameMode, setPhoneFrameMode] = useState(true);

  // Bottom sheets & Drawers state
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);

  // Modals state
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [editIncomeTarget, setEditIncomeTarget] = useState<IncomeTransaction | null>(null);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editExpenseTarget, setEditExpenseTarget] = useState<ExpenseTransaction | null>(null);
  const [defaultExpenseFundId, setDefaultExpenseFundId] = useState<string | undefined>(undefined);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferSourceFundId, setTransferSourceFundId] = useState<string | undefined>(undefined);

  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [editFundTarget, setEditFundTarget] = useState<Fund | null>(null);

  const [selectedIncomeDetail, setSelectedIncomeDetail] = useState<IncomeTransaction | null>(null);

  // Actions
  const handleOpenAddIncome = () => {
    setEditIncomeTarget(null);
    setIsIncomeModalOpen(true);
  };

  const handleEditIncome = (income: IncomeTransaction) => {
    setEditIncomeTarget(income);
    setIsIncomeModalOpen(true);
  };

  const handleOpenAddExpense = (fundId?: string) => {
    setEditExpenseTarget(null);
    setDefaultExpenseFundId(fundId);
    setIsExpenseModalOpen(true);
  };

  const handleEditExpense = (expense: ExpenseTransaction) => {
    setEditExpenseTarget(expense);
    setDefaultExpenseFundId(expense.fundId);
    setIsExpenseModalOpen(true);
  };

  const handleOpenTransfer = (fromFundId?: string) => {
    setTransferSourceFundId(fromFundId);
    setIsTransferModalOpen(true);
  };

  const handleOpenCreateFund = () => {
    setEditFundTarget(null);
    setIsFundModalOpen(true);
  };

  const handleEditFund = (fund: Fund) => {
    setEditFundTarget(fund);
    setIsFundModalOpen(true);
  };

  const handleSelectIncomeDetail = (incomeId: string) => {
    const found = incomeTransactions.find((inc) => inc.id === incomeId);
    if (found) {
      setSelectedIncomeDetail(found);
    }
  };

  const renderActiveView = () => {
    switch (activeNav) {
      case 'dashboard':
        return (
          <DashboardView
            onOpenAddIncome={handleOpenAddIncome}
            onOpenAddExpense={() => handleOpenAddExpense()}
            onOpenTransfer={handleOpenTransfer}
            onNavigate={setActiveNav}
            onSelectIncomeDetail={handleSelectIncomeDetail}
          />
        );
      case 'income':
        return (
          <IncomeView
            onOpenAddIncome={handleOpenAddIncome}
            onEditIncome={handleEditIncome}
            onViewAllocations={setSelectedIncomeDetail}
          />
        );
      case 'expenses':
        return (
          <ExpenseView
            onOpenAddExpense={() => handleOpenAddExpense()}
            onEditExpense={handleEditExpense}
          />
        );
      case 'funds':
        return (
          <FundsView
            onOpenCreateFund={handleOpenCreateFund}
            onEditFund={handleEditFund}
            onOpenTransfer={handleOpenTransfer}
            onOpenAddExpenseForFund={(fundId) => handleOpenAddExpense(fundId)}
          />
        );
      case 'transactions':
        return <TransactionsView onSelectIncomeDetail={handleSelectIncomeDetail} />;
      case 'reports':
        return <ReportsView />;
      case 'rules':
        return <AllocationRulesView />;
      case 'settings':
        return <SettingsView />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 md:bg-slate-900/95 flex flex-col items-center justify-start text-slate-900 font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Desktop Mode Bar: lets users toggle between Smartphone frame and Full width */}
      <div className="hidden md:flex w-full max-w-4xl items-center justify-between px-6 py-2.5 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-tight text-white">FundFlow Mobile Experience</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400">Automatic Fund Allocation System</span>
        </div>

        <button
          onClick={() => setPhoneFrameMode(!phoneFrameMode)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-xs"
        >
          {phoneFrameMode ? (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Expanded View</span>
            </>
          ) : (
            <>
              <Smartphone className="w-3.5 h-3.5 text-blue-400" />
              <span>Smartphone Frame</span>
            </>
          )}
        </button>
      </div>

      {/* Main Container: Either iPhone Smartphone Bezel or Responsive Canvas */}
      <div
        className={`w-full transition-all duration-300 flex flex-col justify-between ${
          phoneFrameMode
            ? 'max-w-[420px] md:my-4 md:rounded-[44px] md:border-[10px] md:border-slate-800 md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] md:overflow-hidden md:min-h-[860px] md:max-h-[92vh] bg-slate-50 relative'
            : 'max-w-4xl bg-slate-50 min-h-screen relative shadow-2xl'
        }`}
      >
        {/* Smartphone Status Bar (Top notch & indicators on phone frame) */}
        {phoneFrameMode && (
          <div className="hidden md:flex items-center justify-between px-7 pt-3 pb-1 bg-white select-none text-[11px] font-semibold text-slate-800 border-b border-slate-100/50">
            <span>9:41</span>
            {/* Dynamic Island / Speaker Pill */}
            <div className="w-24 h-4 bg-slate-900 rounded-full" />
            <div className="flex items-center gap-1 text-slate-700">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* Mobile Top Header */}
        <MobileTopBar
          activeNav={activeNav}
          onOpenDateFilter={() => setIsQuickActionOpen(true)}
          phoneFrameMode={phoneFrameMode}
          onTogglePhoneFrame={() => setPhoneFrameMode(!phoneFrameMode)}
          onNavigateToSettings={() => setActiveNav('settings')}
        />

        {/* Scrollable Viewport Content */}
        <main className="flex-1 overflow-y-auto px-4 pt-4 pb-24 md:pb-28">
          {renderActiveView()}
        </main>

        {/* Fixed Mobile Bottom Tab Bar */}
        <MobileTabBar
          activeNav={activeNav}
          onSelectNav={setActiveNav}
          onOpenQuickAction={() => setIsQuickActionOpen(true)}
          onOpenMoreMenu={() => setIsMenuDrawerOpen(true)}
        />

        {/* Smartphone Home Indicator Bar */}
        {phoneFrameMode && (
          <div className="hidden md:block absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-300 rounded-full pointer-events-none z-50" />
        )}
      </div>

      {/* Mobile Quick Action Bottom Sheet (FAB) */}
      <MobileQuickActionSheet
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        onSelectIncome={handleOpenAddIncome}
        onSelectExpense={() => handleOpenAddExpense()}
        onSelectTransfer={handleOpenTransfer}
        onSelectRules={() => setActiveNav('rules')}
      />

      {/* Mobile Menu Drawer (for all tools) */}
      <MobileMenuDrawer
        isOpen={isMenuDrawerOpen}
        onClose={() => setIsMenuDrawerOpen(false)}
        activeNav={activeNav}
        onSelectNav={setActiveNav}
      />

      {/* Global Modals (Rendered as bottom-sheets on mobile) */}
      <AddIncomeModal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
        editIncome={editIncomeTarget}
      />

      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        editExpense={editExpenseTarget}
        defaultFundId={defaultExpenseFundId}
      />

      <FundTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        defaultSourceFundId={transferSourceFundId}
      />

      <FundModal
        isOpen={isFundModalOpen}
        onClose={() => setIsFundModalOpen(false)}
        editFund={editFundTarget}
      />

      <AllocationDetailModal
        isOpen={!!selectedIncomeDetail}
        onClose={() => setSelectedIncomeDetail(null)}
        income={selectedIncomeDetail}
      />

      {/* Toasts */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}
