import React from 'react';
import {
  LayoutDashboard,
  Layers,
  ReceiptText,
  BarChart3,
  Plus,
  Sliders,
  Settings,
  MoreHorizontal,
} from 'lucide-react';
import { NavItemKey } from './Sidebar.tsx';

interface MobileTabBarProps {
  activeNav: NavItemKey;
  onSelectNav: (key: NavItemKey) => void;
  onOpenQuickAction: () => void;
  onOpenMoreMenu: () => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  activeNav,
  onSelectNav,
  onOpenQuickAction,
  onOpenMoreMenu,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="max-w-md mx-auto h-16 flex items-center justify-around relative">
        {/* Tab 1: Home / Dashboard */}
        <button
          onClick={() => onSelectNav('dashboard')}
          className={`flex-1 flex flex-col items-center justify-center py-1 min-h-[44px] transition-colors ${
            activeNav === 'dashboard' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard
            className={`w-5 h-5 transition-transform ${
              activeNav === 'dashboard' ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'
            }`}
          />
          <span className="text-[10px] mt-1 tracking-tight font-medium">Home</span>
        </button>

        {/* Tab 2: Funds */}
        <button
          onClick={() => onSelectNav('funds')}
          className={`flex-1 flex flex-col items-center justify-center py-1 min-h-[44px] transition-colors ${
            activeNav === 'funds' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers
            className={`w-5 h-5 transition-transform ${
              activeNav === 'funds' ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'
            }`}
          />
          <span className="text-[10px] mt-1 tracking-tight font-medium">Funds</span>
        </button>

        {/* Center Elevated Quick Action FAB (+) */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            onClick={onOpenQuickAction}
            aria-label="Quick financial action"
            className="w-13 h-13 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center transition-all border-4 border-slate-50 ring-1 ring-slate-200/50"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab 4: Ledger / History */}
        <button
          onClick={() => onSelectNav('transactions')}
          className={`flex-1 flex flex-col items-center justify-center py-1 min-h-[44px] transition-colors ${
            activeNav === 'transactions' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ReceiptText
            className={`w-5 h-5 transition-transform ${
              activeNav === 'transactions' ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'
            }`}
          />
          <span className="text-[10px] mt-1 tracking-tight font-medium">Ledger</span>
        </button>

        {/* Tab 5: More (Rules, Analytics, Settings) */}
        <button
          onClick={onOpenMoreMenu}
          className={`flex-1 flex flex-col items-center justify-center py-1 min-h-[44px] transition-colors ${
            ['reports', 'rules', 'settings', 'income', 'expenses'].includes(activeNav)
              ? 'text-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <MoreHorizontal
            className={`w-5 h-5 transition-transform ${
              ['reports', 'rules', 'settings', 'income', 'expenses'].includes(activeNav)
                ? 'scale-110 stroke-[2.5]'
                : 'stroke-[1.8]'
            }`}
          />
          <span className="text-[10px] mt-1 tracking-tight font-medium">Menu</span>
        </button>
      </div>
    </nav>
  );
};
