import React, { useState } from 'react';
import {
  Sliders,
  CheckCircle,
  AlertTriangle,
  Plus,
  Save,
  RotateCcw,
  Sparkles,
  Calculator,
  Layers,
  ArrowRight,
  ShieldCheck,
  PiggyBank,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { calculateAllocations, formatCurrency, toMinorUnits } from '../../utils/currency.ts';
import { AllocationRule, AllocationRuleItem } from '../../types/finance.ts';

export const AllocationRulesView: React.FC = () => {
  const {
    funds,
    allocationRules,
    saveAllocationRule,
    setDefaultAllocationRule,
    deleteAllocationRule,
    settings,
  } = useFinance();

  const activeRule =
    allocationRules.find((r) => r.isDefault) || allocationRules[0];

  const [selectedRuleId, setSelectedRuleId] = useState<string>(activeRule?.id || '');
  const [ruleName, setRuleName] = useState(activeRule?.name || '');
  const [ruleDescription, setRuleDescription] = useState(activeRule?.description || '');

  // Local percentages map { fundId: percentage }
  const [percentages, setPercentages] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    funds.forEach((f) => {
      const match = activeRule?.items.find((item) => item.fundId === f.id);
      map[f.id] = match ? match.percentage : f.allocationPercentage;
    });
    return map;
  });

  // Sandbox simulation amount (default 50,000 as in prompt)
  const [testAmountStr, setTestAmountStr] = useState('50000');

  // Update form when selected rule changes
  const handleSelectRule = (ruleId: string) => {
    setSelectedRuleId(ruleId);
    const r = allocationRules.find((rule) => rule.id === ruleId);
    if (r) {
      setRuleName(r.name);
      setRuleDescription(r.description || '');
      const map: Record<string, number> = {};
      funds.forEach((f) => {
        const match = r.items.find((item) => item.fundId === f.id);
        map[f.id] = match ? match.percentage : 0;
      });
      setPercentages(map);
    }
  };

  const handlePercentageChange = (fundId: string, val: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(val)));
    setPercentages((prev) => ({
      ...prev,
      [fundId]: clamped,
    }));
  };

  // Calculate total percentage
  const totalPercentage = Object.values(percentages).reduce((acc, curr) => acc + (curr || 0), 0);

  // Simulation test calculation
  const testNumeric = parseFloat(testAmountStr) || 0;
  const testMinor = toMinorUnits(testNumeric);

  const simulationRuleItems: AllocationRuleItem[] = Object.entries(percentages).map(
    ([fundId, percentage]) => ({ fundId, percentage })
  );

  const simulationResult = calculateAllocations(testMinor, simulationRuleItems, funds);

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) return;

    if (totalPercentage > 100) {
      return; // blocked by validation message
    }

    const items: AllocationRuleItem[] = Object.entries(percentages).map(
      ([fundId, percentage]) => ({
        fundId,
        percentage,
      })
    );

    const updatedRule: AllocationRule = {
      id: selectedRuleId || `rule-${Date.now()}`,
      name: ruleName.trim(),
      description: ruleDescription.trim(),
      isDefault: allocationRules.find((r) => r.id === selectedRuleId)?.isDefault || false,
      items,
      createdAt: new Date().toISOString(),
    };

    saveAllocationRule(updatedRule);
  };

  const handleCreateNewRule = () => {
    const newId = `rule-${Date.now()}`;
    setSelectedRuleId(newId);
    setRuleName('New Custom Allocation Rule');
    setRuleDescription('Custom percentage distribution for specific income streams');
    const map: Record<string, number> = {};
    funds.forEach((f) => {
      map[f.id] = 0;
    });
    setPercentages(map);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Rules & Distribution Engine
          </span>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            Automatic Fund Allocation Rules
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Configure how income is automatically divided upon recording. Changes apply strictly to
            future income entries; historical transaction allocations are permanently locked and
            preserved.
          </p>
        </div>

        <button
          onClick={handleCreateNewRule}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>New Rule Preset</span>
        </button>
      </div>

      {/* Preset Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap mr-1">
            Presets:
          </span>
          {allocationRules.map((rule) => (
            <button
              key={rule.id}
              onClick={() => handleSelectRule(rule.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                selectedRuleId === rule.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{rule.name}</span>
              {rule.isDefault && (
                <span className="text-[10px] bg-blue-700/60 text-white px-1.5 py-0.2 rounded font-normal">
                  Default
                </span>
              )}
            </button>
          ))}
        </div>

        {selectedRuleId && (
          <div className="flex items-center gap-2">
            {!allocationRules.find((r) => r.id === selectedRuleId)?.isDefault && (
              <button
                onClick={() => setDefaultAllocationRule(selectedRuleId)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                Set as Default Rule
              </button>
            )}
            {allocationRules.length > 1 && (
              <button
                onClick={() => deleteAllocationRule(selectedRuleId)}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2.5 py-1 rounded hover:bg-rose-50 transition-colors"
              >
                Delete Preset
              </button>
            )}
          </div>
        )}
      </div>

      {/* Two Column Layout: Rule Builder & Interactive Simulation Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Rule Configuration Form (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Rule Parameters</h3>
              <p className="text-xs text-slate-500">
                Adjust percentage weights for each fund. Target is exactly 100%.
              </p>
            </div>

            {/* Total Percentage Indicator */}
            <div className="text-right">
              <span
                className={`text-lg font-bold font-mono tabular-nums ${
                  totalPercentage === 100
                    ? 'text-emerald-600'
                    : totalPercentage > 100
                    ? 'text-rose-600'
                    : 'text-amber-600'
                }`}
              >
                {totalPercentage}%
              </span>
              <span className="text-[10px] text-slate-400 block font-medium">Total Allocated</span>
            </div>
          </div>

          <form onSubmit={handleSaveRule} className="space-y-4">
            {/* Rule Name & Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={ruleDescription}
                  onChange={(e) => setRuleDescription(e.target.value)}
                  placeholder="Optional memo"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Status Feedback Banner */}
            {totalPercentage > 100 ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Total exceeds 100% ({totalPercentage}%).</span>
                  <p className="text-rose-700 mt-0.5">
                    Please reduce fund percentages by {totalPercentage - 100}% before saving.
                  </p>
                </div>
              </div>
            ) : totalPercentage < 100 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Partial Allocation ({totalPercentage}%).</span>
                  <p className="text-amber-700 mt-0.5">
                    The remaining {100 - totalPercentage}% will be deposited into the Unallocated
                    Cash balance on future income entries.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Perfect 100% allocation. Every incoming amount will be fully distributed with zero
                  rounding error.
                </span>
              </div>
            )}

            {/* Percentage Sliders List */}
            <div className="space-y-3 pt-2">
              {funds.map((fund) => {
                const pct = percentages[fund.id] ?? 0;

                return (
                  <div
                    key={fund.id}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: fund.color }}
                        />
                        <span className="text-xs font-bold text-slate-900">{fund.name}</span>
                        <span className="text-[11px] text-slate-400 capitalize">
                          ({fund.category})
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={pct}
                          onChange={(e) =>
                            handlePercentageChange(fund.id, Number(e.target.value))
                          }
                          className="w-14 px-2 py-1 bg-white border border-slate-300 rounded text-center text-xs font-mono font-bold text-slate-900 focus:outline-hidden"
                        />
                        <span className="text-xs font-bold text-slate-500">%</span>
                      </div>
                    </div>

                    {/* Range Slider */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={pct}
                      onChange={(e) =>
                        handlePercentageChange(fund.id, Number(e.target.value))
                      }
                      className="w-full accent-blue-600"
                    />
                  </div>
                );
              })}
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="submit"
                disabled={totalPercentage > 100}
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Allocation Rule Preset</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right: Interactive Sandbox Calculator (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Allocation Sandbox</h3>
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                Live Simulator
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Test how an income amount will be automatically calculated and distributed across each
              fund.
            </p>

            {/* Input Test Amount */}
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Test Income Amount ({settings.currency})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                  {settings.currency === 'BDT' ? '৳' : '$'}
                </span>
                <input
                  type="number"
                  step="any"
                  min="1"
                  value={testAmountStr}
                  onChange={(e) => setTestAmountStr(e.target.value)}
                  placeholder="50000"
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-md font-mono text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Quick sample chips */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400">Quick test:</span>
                {['25000', '50000', '100000', '250000'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setTestAmountStr(val)}
                    className="px-2 py-0.5 text-[10px] font-mono font-medium bg-white hover:bg-slate-200 border border-slate-200 rounded text-slate-700 transition-colors"
                  >
                    {formatCurrency(toMinorUnits(Number(val)), settings.currency)}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Distribution Result List */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Fund Destination</span>
                <span>Calculated Share</span>
              </div>

              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {simulationResult.splits.map((split) => (
                  <div
                    key={split.fundId}
                    className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{split.fundName}</span>
                      <span className="text-[11px] text-slate-400">
                        {split.percentage}% allocation
                      </span>
                    </div>
                    <span className="font-mono tabular-nums font-bold text-emerald-600 text-sm">
                      +{formatCurrency(split.amount, settings.currency)}
                    </span>
                  </div>
                ))}

                {simulationResult.unallocatedMinor > 0 && (
                  <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-between text-xs text-amber-900">
                    <div>
                      <span className="font-bold block">Unallocated Pool</span>
                      <span className="text-[11px] text-amber-600">
                        {100 - totalPercentage}% remaining
                      </span>
                    </div>
                    <span className="font-mono tabular-nums font-bold text-amber-800 text-sm">
                      +{formatCurrency(simulationResult.unallocatedMinor, settings.currency)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Formula explanation box */}
          <div className="mt-4 p-3 bg-blue-50/70 rounded-lg border border-blue-200/60 text-[11px] text-blue-900 space-y-1">
            <span className="font-bold block">Exact Formula Guarantee:</span>
            <p className="text-blue-800 leading-relaxed font-mono">
              Allocated Amount = (Income × Percentage) / 100
            </p>
            <p className="text-blue-700">
              Allocations are calculated in integer poisha/cents minor-units to ensure
              sum(Allocations) + Unallocated strictly equals the exact income amount.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
