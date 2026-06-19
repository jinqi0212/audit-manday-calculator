'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import CodeSearch from '@/components/CodeSearch';
import { calcQMS, calcES, calcEnergy, calcEnergyComplexity, ADJUSTMENT_FACTORS } from '@/lib/manday-calculator';
import type { CodeEntry } from '@/data/codes';

type SystemType = 'Q' | 'E' | 'S' | 'En';
type InternalAuditType = 'init' | 'monitor' | 'recert';

interface SystemConfig {
  enabled: boolean;
  system: SystemType;
  auditType: InternalAuditType;
  effectiveCount: number;
  riskLevel: string;
  annualConsumption: number;
  energyUnit: 'TJ' | 'tce';
  energyTypes: number;
  mainUses: number;
  includeRB: boolean;
  adjustments: Record<string, { enabled: boolean; value: number }>;
}

const DEFAULT_SYSTEMS: SystemConfig[] = [
  { enabled: true, system: 'Q', auditType: 'init', effectiveCount: 100, riskLevel: '一级', annualConsumption: 0, energyUnit: 'TJ', energyTypes: 0, mainUses: 0, includeRB: false, adjustments: {} },
  { enabled: false, system: 'E', auditType: 'init', effectiveCount: 100, riskLevel: '一级', annualConsumption: 0, energyUnit: 'TJ', energyTypes: 0, mainUses: 0, includeRB: false, adjustments: {} },
  { enabled: false, system: 'S', auditType: 'init', effectiveCount: 100, riskLevel: '一级', annualConsumption: 0, energyUnit: 'TJ', energyTypes: 0, mainUses: 0, includeRB: false, adjustments: {} },
  { enabled: false, system: 'En', auditType: 'init', effectiveCount: 100, riskLevel: '中', annualConsumption: 10, energyUnit: 'TJ', energyTypes: 3, mainUses: 2, includeRB: false, adjustments: {} },
];

const SYSTEM_NAMES: Record<string, string> = {
  Q: 'QMS', E: 'EMS', S: 'OHSMS', En: 'EnMS',
};

const SYSTEM_COLORS: Record<string, string> = {
  Q: 'bg-indigo-500', E: 'bg-emerald-500', S: 'bg-amber-500', En: 'bg-orange-500',
};

interface AuditResult {
  total: number;
  docReview: number;
  phase1?: number;
  phase2?: number;
  onsite?: number;
  rbAdd?: number;
}

export default function MultiSystemPage() {
  const [selectedCode, setSelectedCode] = useState<CodeEntry | null>(null);
  const [systems, setSystems] = useState<SystemConfig[]>(DEFAULT_SYSTEMS);

  const updateSystem = (index: number, updates: Partial<SystemConfig>) => {
    setSystems(prev => prev.map((s, i) => i === index ? { ...s, ...updates } : s));
  };

  const toggleSystem = (index: number) => {
    setSystems(prev => prev.map((s, i) => i === index ? { ...s, enabled: !s.enabled } : s));
  };

  const enabledSystems = useMemo(() => systems.filter(s => s.enabled), [systems]);

  // 计算各体系三种审核类型的人天
  const systemResults = useMemo(() => {
    return enabledSystems.map(config => {
      const energyComplexity = config.system === 'En' && config.annualConsumption > 0
        ? calcEnergyComplexity(config.annualConsumption, config.energyTypes, config.mainUses, config.energyUnit)
        : null;

      const calcForType = (auditType: InternalAuditType): AuditResult | null => {
        let result;
        if (config.system === 'Q') {
          result = calcQMS(config.effectiveCount, config.riskLevel, auditType);
        } else if (config.system === 'E' || config.system === 'S') {
          result = calcES(config.effectiveCount, config.riskLevel, auditType);
        } else if (config.system === 'En' && energyComplexity) {
          result = calcEnergy(config.effectiveCount, energyComplexity.level, auditType, config.includeRB);
        }
        return result as AuditResult | null;
      };

      const initResult = calcForType('init');
      const monitorResult = calcForType('monitor');
      const recertResult = calcForType('recert');

      // 计算调整因子
      const systemFilter = config.system === 'En' ? 'common' : config.system;
      const applicableFactors = ADJUSTMENT_FACTORS.filter(
        f => f.system === systemFilter || f.system === 'common'
      );

      let totalReduction = 0;
      let totalIncrease = 0;
      applicableFactors.forEach(factor => {
        const adj = config.adjustments[factor.id];
        if (adj?.enabled) {
          if (factor.direction === 'reduce') {
            totalReduction += adj.value / 100;
          } else {
            totalIncrease += adj.value / 100;
          }
        }
      });

      if (totalReduction > 0.3) totalReduction = 0.3;

      const applyAdjustment = (result: AuditResult | null): { total: number; docReview: number; phase1?: number; phase2?: number; onsite?: number } | null => {
        if (!result) return null;
        const adjustedTotal = result.total * (1 - totalReduction + totalIncrease);
        const ratio = adjustedTotal / result.total;
        return {
          total: Math.round(adjustedTotal * 10) / 10,
          docReview: Math.round(result.docReview * ratio * 10) / 10,
          phase1: result.phase1 ? Math.round(result.phase1 * ratio * 10) / 10 : undefined,
          phase2: result.phase2 ? Math.round(result.phase2 * ratio * 10) / 10 : undefined,
          onsite: result.onsite ? Math.round(result.onsite * ratio * 10) / 10 : undefined,
        };
      };

      return {
        config,
        energyComplexity,
        applicableFactors,
        init: applyAdjustment(initResult),
        monitor: applyAdjustment(monitorResult),
        recert: applyAdjustment(recertResult),
        initBase: initResult,
        monitorBase: monitorResult,
        recertBase: recertResult,
        reduction: Math.round(totalReduction * 100),
        increase: Math.round(totalIncrease * 100),
      };
    }).filter(r => r.init !== null);
  }, [enabledSystems]);

  // 合并计算（三种审核类型）
  const mergedResults = useMemo(() => {
    if (systemResults.length === 0) return null;

    const calcMerge = (type: 'init' | 'monitor' | 'recert') => {
      let totalDocReview = 0;
      let maxOnsite = 0;

      systemResults.forEach(r => {
        const result = r[type];
        if (!result) return;
        totalDocReview += result.docReview;
        if (type === 'init') {
          const onsite = (result.phase1 || 0) + (result.phase2 || 0);
          maxOnsite = Math.max(maxOnsite, onsite);
        } else {
          maxOnsite = Math.max(maxOnsite, result.onsite || 0);
        }
      });

      const mergeRatio = systemResults.length > 1 ? 1 + (systemResults.length - 1) * 0.2 : 1;
      const mergedOnsite = Math.round(maxOnsite * mergeRatio * 10) / 10;
      const mergedTotal = Math.round((totalDocReview + mergedOnsite) * 10) / 10;

      return { totalDocReview: Math.round(totalDocReview * 10) / 10, mergedOnsite, mergedTotal };
    };

    // 按各体系选择的审核类型合并
    const calcMergeBySelection = () => {
      let totalDocReview = 0;
      let maxOnsite = 0;
      const details: { system: string; auditType: string; result: { total: number; docReview: number; phase1?: number; phase2?: number; onsite?: number } | null }[] = [];

      systemResults.forEach(r => {
        const selectedType = r.config.auditType;
        const result = r[selectedType];
        if (!result) return;
        totalDocReview += result.docReview;
        if (selectedType === 'init') {
          const onsite = (result.phase1 || 0) + (result.phase2 || 0);
          maxOnsite = Math.max(maxOnsite, onsite);
        } else {
          maxOnsite = Math.max(maxOnsite, result.onsite || 0);
        }
        details.push({
          system: SYSTEM_NAMES[r.config.system],
          auditType: selectedType === 'init' ? '初审' : selectedType === 'monitor' ? '监督' : '再认证',
          result
        });
      });

      const mergeRatio = systemResults.length > 1 ? 1 + (systemResults.length - 1) * 0.2 : 1;
      const mergedOnsite = Math.round(maxOnsite * mergeRatio * 10) / 10;
      const mergedTotal = Math.round((totalDocReview + mergedOnsite) * 10) / 10;

      return { totalDocReview: Math.round(totalDocReview * 10) / 10, mergedOnsite, mergedTotal, details, mergeRatio: Math.round(mergeRatio * 100) / 100 };
    };

    return {
      init: calcMerge('init'),
      monitor: calcMerge('monitor'),
      recert: calcMerge('recert'),
      bySelection: calcMergeBySelection(),
    };
  }, [systemResults]);

  const toggleAdjustment = (systemIndex: number, factorId: string) => {
    const config = systems[systemIndex];
    const current = config.adjustments[factorId] || { enabled: false, value: 10 };
    updateSystem(systemIndex, {
      adjustments: { ...config.adjustments, [factorId]: { ...current, enabled: !current.enabled } }
    });
  };

  const updateAdjustmentValue = (systemIndex: number, factorId: string, value: number) => {
    const config = systems[systemIndex];
    updateSystem(systemIndex, {
      adjustments: { ...config.adjustments, [factorId]: { enabled: true, value } }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-800 text-white px-6 py-3 flex items-center justify-between shadow-md">
        <h1 className="text-lg font-semibold">多体系审核人天计算</h1>
        <div className="flex items-center gap-3">
          <Link href="/ims" className="text-sm text-slate-300 hover:text-white">IMS计算 →</Link>
          <Link href="/" className="text-sm text-slate-300 hover:text-white">← 返回首页</Link>
        </div>
      </header>

      <div className="max-w-[1800px] mx-auto p-3 grid grid-cols-12 gap-3">
        {/* 左侧：代码查询 + 体系配置 */}
        <div className="col-span-3 space-y-2">
          {/* 代码查询 */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-2.5">
            <h2 className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <span className="w-4 h-4 bg-indigo-500 text-white rounded text-[10px] flex items-center justify-center">1</span>
              专业代码查询
            </h2>
            <CodeSearch onSelect={setSelectedCode} compact={true} />
          </div>

          {/* 专业描述 - 紧凑折叠 */}
          {selectedCode && selectedCode.description && (
            <details className="bg-white rounded-lg shadow-sm border border-slate-200">
              <summary className="px-2.5 py-1 cursor-pointer text-[10px] text-slate-600 hover:bg-slate-50 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                专业描述
              </summary>
              <div className="px-2.5 pb-1.5 text-[10px] text-slate-600 leading-relaxed max-h-14 overflow-y-auto border-t border-slate-100 pt-1">
                {selectedCode.description}
              </div>
            </details>
          )}

          {/* 体系配置列表 */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-2.5">
            <h2 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <span className="w-4 h-4 bg-indigo-500 text-white rounded text-[10px] flex items-center justify-center">2</span>
              体系配置
            </h2>
            <div className="space-y-2">
              {systems.map((config, index) => (
                <div key={config.system} className={`border rounded-lg p-2 transition-all ${config.enabled ? 'border-slate-300 bg-white' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <input type="checkbox" checked={config.enabled} onChange={() => toggleSystem(index)} className="w-3.5 h-3.5 rounded" />
                    <span className={`text-[10px] font-medium text-white px-1.5 py-0.5 rounded ${SYSTEM_COLORS[config.system]}`}>
                      {SYSTEM_NAMES[config.system]}
                    </span>
                  </div>
                  
                  {config.enabled && (
                    <>
                      {/* 审核类型选择 */}
                      <div className="mb-1.5">
                        <label className="text-[9px] text-slate-500 block mb-0.5">审核类型</label>
                        <div className="flex gap-1">
                          {[
                            { value: 'init', label: '初审' },
                            { value: 'monitor', label: '监督' },
                            { value: 'recert', label: '再认证' },
                          ].map(t => (
                            <button
                              key={t.value}
                              onClick={() => updateSystem(index, { auditType: t.value as InternalAuditType })}
                              className={`flex-1 px-1.5 py-1 rounded text-[9px] font-medium transition-colors ${
                                config.auditType === t.value
                                  ? 'bg-indigo-500 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {config.system !== 'En' && (
                        <div>
                          <label className="text-[9px] text-slate-500 block mb-0.5">风险等级</label>
                          <select value={config.riskLevel} onChange={e => updateSystem(index, { riskLevel: e.target.value })} className={`w-full px-1.5 py-1 border rounded text-[10px] font-medium ${
                            config.riskLevel === '一级' ? 'border-red-300 bg-red-50 text-red-700' :
                            config.riskLevel === '二级' ? 'border-orange-300 bg-orange-50 text-orange-700' :
                            'border-green-300 bg-green-50 text-green-700'
                          }`}>
                            <option value="一级">一级(高)</option>
                            <option value="二级">二级(中)</option>
                            <option value="三级">三级(低)</option>
                          </select>
                        </div>
                        )}
                        <div>
                          <label className="text-[9px] text-slate-500 block mb-0.5">有效人数</label>
                          <input type="number" value={config.effectiveCount} onChange={e => updateSystem(index, { effectiveCount: Number(e.target.value) })} className="w-full px-1.5 py-1 border border-slate-300 rounded text-[10px]" />
                        </div>
                      </div>
                      
                      {/* 能源体系特有输入 */}
                      {config.system === 'En' && (
                        <div className="mt-2 pt-2 border-t border-slate-200 space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <label className="text-[8px] text-slate-500">单位:</label>
                            <select 
                              value={config.energyUnit} 
                              onChange={e => updateSystem(index, { energyUnit: e.target.value as 'TJ' | 'tce' })}
                              className="px-1 py-0.5 border border-slate-300 rounded text-[9px]"
                            >
                              <option value="TJ">TJ</option>
                              <option value="tce">万tce</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5">
                            <div>
                              <label className="text-[9px] text-slate-500 block mb-0.5">综合能耗</label>
                              <input type="number" value={config.annualConsumption} onChange={e => updateSystem(index, { annualConsumption: Number(e.target.value) })} className="w-full px-1.5 py-1 border border-slate-300 rounded text-[10px]" />
                            </div>
                            <div>
                              <label className="text-[9px] text-slate-500 block mb-0.5">能源种类</label>
                              <input type="number" value={config.energyTypes} onChange={e => updateSystem(index, { energyTypes: Number(e.target.value) })} className="w-full px-1.5 py-1 border border-slate-300 rounded text-[10px]" />
                            </div>
                            <div>
                              <label className="text-[9px] text-slate-500 block mb-0.5">主要用途</label>
                              <input type="number" value={config.mainUses} onChange={e => updateSystem(index, { mainUses: Number(e.target.value) })} className="w-full px-1.5 py-1 border border-slate-300 rounded text-[10px]" />
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <input type="checkbox" id={`rb-${index}`} checked={config.includeRB} onChange={e => updateSystem(index, { includeRB: e.target.checked })} className="w-3 h-3 rounded" />
                            <label htmlFor={`rb-${index}`} className="text-[9px] text-slate-600">含RB要求</label>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 中间：调整因子 */}
        <div className="col-span-3 bg-white rounded-lg shadow-sm border border-slate-200 p-2.5">
          <h2 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <span className="w-4 h-4 bg-indigo-500 text-white rounded text-[10px] flex items-center justify-center">3</span>
            调整因子
            <span className="text-[9px] text-slate-400 ml-auto">减少上限30%</span>
          </h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {enabledSystems.map((config) => {
              const realIndex = systems.findIndex(s => s.system === config.system);
              const systemFilter = config.system === 'En' ? 'common' : config.system;
              const applicableFactors = ADJUSTMENT_FACTORS.filter(f => f.system === systemFilter || f.system === 'common');
              
              return (
                <div key={config.system} className="border-t border-slate-100 pt-1.5 first:border-t-0 first:pt-0">
                  <div className="flex items-center gap-1 mb-1">
                    <span className={`text-[9px] font-medium text-white px-1 py-0.5 rounded ${SYSTEM_COLORS[config.system]}`}>
                      {SYSTEM_NAMES[config.system]}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {applicableFactors.map(factor => {
                      const adj = config.adjustments[factor.id] || { enabled: false, value: 10 };
                      const isReduce = factor.direction === 'reduce';
                      return (
                        <div key={factor.id} className={`rounded px-1.5 py-1 ${isReduce ? 'bg-green-50' : 'bg-red-50'}`}>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input type="checkbox" checked={adj.enabled} onChange={() => toggleAdjustment(realIndex, factor.id)} className="w-3 h-3 rounded" />
                            <span className="text-[9px] text-slate-700 flex-1 leading-tight">{factor.description}</span>
                            <span className={`text-[9px] font-medium ${isReduce ? 'text-green-600' : 'text-red-600'}`}>
                              {isReduce ? '↓' : '↑'}{factor.maxPercent}%
                            </span>
                          </label>
                          {adj.enabled && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <input type="range" min={0} max={30} value={adj.value} onChange={e => updateAdjustmentValue(realIndex, factor.id, Number(e.target.value))} className="flex-1 h-1" />
                              <span className="text-[9px] text-slate-600 w-8 text-right">{adj.value}%</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 右侧：计算结果 - 三种审核类型同时显示 */}
        <div className="col-span-6 space-y-2">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-2.5">
            <h2 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <span className="w-4 h-4 bg-indigo-500 text-white rounded text-[10px] flex items-center justify-center">4</span>
              计算结果（初审/监督/再认证）
            </h2>

            {systemResults.length === 0 ? (
              <p className="text-[10px] text-slate-400 text-center py-4">请至少启用一个体系</p>
            ) : (
              <>
                {/* 汇总表格 */}
                <div className="overflow-x-auto mb-3">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="px-2 py-1.5 text-left font-medium text-slate-600">体系</th>
                        <th colSpan={3} className="px-2 py-1.5 text-center font-medium text-indigo-600 border-l border-slate-200">初次认证</th>
                        <th colSpan={2} className="px-2 py-1.5 text-center font-medium text-emerald-600 border-l border-slate-200">监督审核</th>
                        <th colSpan={2} className="px-2 py-1.5 text-center font-medium text-amber-600 border-l border-slate-200">再认证</th>
                      </tr>
                      <tr className="bg-slate-50 text-[9px] text-slate-500">
                        <th className="px-2 py-1 text-left"></th>
                        <th className="px-1 py-1 text-center border-l border-slate-200">文审</th>
                        <th className="px-1 py-1 text-center">现场</th>
                        <th className="px-1 py-1 text-center font-semibold">合计</th>
                        <th className="px-1 py-1 text-center border-l border-slate-200">现场</th>
                        <th className="px-1 py-1 text-center font-semibold">合计</th>
                        <th className="px-1 py-1 text-center border-l border-slate-200">现场</th>
                        <th className="px-1 py-1 text-center font-semibold">合计</th>
                      </tr>
                    </thead>
                    <tbody>
                      {systemResults.map((r, i) => r && (
                        <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-2 py-1.5">
                            <span className={`text-[9px] font-medium text-white px-1 py-0.5 rounded ${SYSTEM_COLORS[r.config.system]}`}>
                              {SYSTEM_NAMES[r.config.system]}
                            </span>
                          </td>
                          {/* 初次 */}
                          <td className="px-1 py-1.5 text-center border-l border-slate-200">{r.init?.docReview}</td>
                          <td className="px-1 py-1.5 text-center">{r.init?.phase1 && r.init?.phase2 ? `${r.init.phase1}+${r.init.phase2}` : '-'}</td>
                          <td className="px-1 py-1.5 text-center font-semibold text-indigo-700">{r.init?.total}</td>
                          {/* 监督 */}
                          <td className="px-1 py-1.5 text-center border-l border-slate-200">{r.monitor?.onsite}</td>
                          <td className="px-1 py-1.5 text-center font-semibold text-emerald-700">{r.monitor?.total}</td>
                          {/* 再认证 */}
                          <td className="px-1 py-1.5 text-center border-l border-slate-200">{r.recert?.onsite}</td>
                          <td className="px-1 py-1.5 text-center font-semibold text-amber-700">{r.recert?.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 合并结果 */}
                {mergedResults && systemResults.length > 1 && (
                  <div className="border-t border-slate-200 pt-2">
                    <div className="bg-indigo-50 rounded p-2">
                      <div className="text-[10px] font-semibold text-slate-700 mb-1.5">合并审核人天</div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white rounded p-1.5 text-center">
                          <div className="text-[9px] text-slate-500">初次认证</div>
                          <div className="text-sm font-bold text-indigo-600">{mergedResults.init.mergedTotal} 天</div>
                          <div className="text-[8px] text-slate-400">文审{mergedResults.init.totalDocReview} + 现场{mergedResults.init.mergedOnsite}</div>
                        </div>
                        <div className="bg-white rounded p-1.5 text-center">
                          <div className="text-[9px] text-slate-500">监督审核</div>
                          <div className="text-sm font-bold text-emerald-600">{mergedResults.monitor.mergedTotal} 天</div>
                          <div className="text-[8px] text-slate-400">文审{mergedResults.monitor.totalDocReview} + 现场{mergedResults.monitor.mergedOnsite}</div>
                        </div>
                        <div className="bg-white rounded p-1.5 text-center">
                          <div className="text-[9px] text-slate-500">再认证</div>
                          <div className="text-sm font-bold text-amber-600">{mergedResults.recert.mergedTotal} 天</div>
                          <div className="text-[8px] text-slate-400">文审{mergedResults.recert.totalDocReview} + 现场{mergedResults.recert.mergedOnsite}</div>
                        </div>
                      </div>
                      <div className="text-[8px] text-slate-500 mt-1.5 text-center">
                        合并规则：文审累加 + 现场取最大值 × (1 + (n-1)×20%)
                      </div>
                      {/* 合并公式详情 */}
                      <div className="mt-1.5 bg-white rounded px-2 py-1 text-[8px] text-slate-600 font-mono">
                        <div className="font-semibold text-slate-700 mb-0.5">合并公式：</div>
                        <div>合并现场 = max(各体系现场) × (1 + (体系数-1) × 20%)</div>
                        <div>= max({systemResults.map(r => r.init?.phase1 && r.init?.phase2 ? `${r.init.phase1}+${r.init.phase2}` : r.init?.onsite || 0).join(', ')}) × (1 + ({systemResults.length}-1) × 20%)</div>
                        <div>合并总人天 = 文审累加 + 合并现场</div>
                      </div>
                      {/* 按选择审核类型合并结果 */}
                      {mergedResults.bySelection && (
                        <div className="mt-1.5 bg-emerald-50 rounded p-2">
                          <div className="text-[10px] font-semibold text-slate-700 mb-1">按各体系选择的审核类型合并</div>
                          <div className="bg-white rounded p-1.5 text-center">
                            <div className="text-sm font-bold text-emerald-600">{mergedResults.bySelection.mergedTotal} 天</div>
                            <div className="text-[9px] text-slate-500">文审 {mergedResults.bySelection.totalDocReview} + 现场 {mergedResults.bySelection.mergedOnsite}</div>
                          </div>
                          <div className="mt-1.5 bg-white rounded px-2 py-1 text-[8px] text-slate-600">
                            <div className="font-semibold text-slate-700 mb-0.5">各体系选择：</div>
                            {mergedResults.bySelection.details.map((d, i) => (
                              <div key={i} className="flex justify-between">
                                <span>{d.system}</span>
                                <span className="text-slate-500">{d.auditType}：{d.result?.total || 0}天</span>
                              </div>
                            ))}
                            <div className="mt-1 font-mono border-t border-slate-200 pt-1">
                              <div>合并现场 = max(现场) × (1 + ({systemResults.length}-1) × 20%)</div>
                              <div>= max({mergedResults.bySelection.details.map(d => d.result?.phase1 && d.result?.phase2 ? `${d.result.phase1}+${d.result.phase2}` : d.result?.onsite || 0).join(', ')}) × {mergedResults.bySelection.mergeRatio}</div>
                              <div>= {mergedResults.bySelection.mergedOnsite} 天</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 基础人天 vs 调整后 对比表 */}
                <div className="border-t border-slate-200 pt-2">
                  <div className="text-[10px] font-semibold text-slate-700 mb-1.5">基础人天与调整后对比</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[9px] border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border border-slate-200">
                          <th className="px-2 py-1 text-left font-semibold" rowSpan={2}>体系</th>
                          <th className="px-1 py-1 text-center font-semibold border-l border-slate-200" colSpan={3}>初次认证</th>
                          <th className="px-1 py-1 text-center font-semibold border-l border-slate-200" colSpan={2}>监督审核</th>
                          <th className="px-1 py-1 text-center font-semibold border-l border-slate-200" colSpan={2}>再认证</th>
                        </tr>
                        <tr className="bg-slate-50 border border-slate-200">
                          <th className="px-1 py-0.5 text-center text-slate-500 border-l border-slate-200">基础</th>
                          <th className="px-1 py-0.5 text-center text-slate-500">调整后</th>
                          <th className="px-1 py-0.5 text-center text-slate-500">变化</th>
                          <th className="px-1 py-0.5 text-center text-slate-500 border-l border-slate-200">基础</th>
                          <th className="px-1 py-0.5 text-center text-slate-500">调整后</th>
                          <th className="px-1 py-0.5 text-center text-slate-500 border-l border-slate-200">基础</th>
                          <th className="px-1 py-0.5 text-center text-slate-500">调整后</th>
                        </tr>
                      </thead>
                      <tbody>
                        {systemResults.map((r, i) => r && (
                          <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                            <td className="px-2 py-1.5">
                              <span className={`text-[9px] font-medium text-white px-1 py-0.5 rounded ${SYSTEM_COLORS[r.config.system]}`}>
                                {SYSTEM_NAMES[r.config.system]}
                              </span>
                            </td>
                            {/* 初次 - 基础/调整/变化 */}
                            <td className="px-1 py-1.5 text-center text-slate-500 border-l border-slate-200">{r.initBase?.total || '-'}</td>
                            <td className="px-1 py-1.5 text-center font-semibold text-indigo-700">{r.init?.total || '-'}</td>
                            <td className="px-1 py-1.5 text-center">
                              {r.initBase?.total && r.init?.total && r.initBase.total !== r.init.total ? (
                                <span className={`${r.init.total < r.initBase.total ? 'text-green-600' : 'text-red-600'}`}>
                                  {r.init.total < r.initBase.total ? '↓' : '↑'}{Math.abs(Math.round((r.init.total - r.initBase.total!) * 10) / 10)}
                                </span>
                              ) : '-'}
                            </td>
                            {/* 监督 - 基础/调整 */}
                            <td className="px-1 py-1.5 text-center text-slate-500 border-l border-slate-200">{r.monitorBase?.total || '-'}</td>
                            <td className="px-1 py-1.5 text-center font-semibold text-emerald-700">{r.monitor?.total || '-'}</td>
                            {/* 再认证 - 基础/调整 */}
                            <td className="px-1 py-1.5 text-center text-slate-500 border-l border-slate-200">{r.recertBase?.total || '-'}</td>
                            <td className="px-1 py-1.5 text-center font-semibold text-amber-700">{r.recert?.total || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-[8px] text-slate-500 mt-1">
                    基础人天 = 按风险等级/复杂程度查表所得；调整后 = 基础 × (1 - 减少% + 增加%)
                  </div>
                </div>

                {/* 各体系详情 */}
                <div className="border-t border-slate-200 pt-2 mt-2">
                  <div className="text-[10px] font-semibold text-slate-700 mb-1.5">各体系详情</div>
                  <div className="space-y-2">
                    {systemResults.map((r, i) => r && (
                      <div key={i} className="border border-slate-200 rounded p-2">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-[9px] font-medium text-white px-1.5 py-0.5 rounded ${SYSTEM_COLORS[r.config.system]}`}>
                            {SYSTEM_NAMES[r.config.system]}
                          </span>
                          <span className="text-[9px] text-slate-500">{r.config.effectiveCount}人 | {r.config.riskLevel}风险</span>
                          {(r.reduction > 0 || r.increase > 0) && (
                            <span className="text-[8px] ml-auto">
                              {r.reduction > 0 && <span className="text-green-600">减{r.reduction}% </span>}
                              {r.increase > 0 && <span className="text-red-600">增{r.increase}%</span>}
                            </span>
                          )}
                        </div>
                        {/* 能源复杂系数 */}
                        {r.config.system === 'En' && r.energyComplexity && (
                          <div className="text-[8px] text-amber-700 bg-amber-50 rounded px-1.5 py-1 mb-1.5">
                            <span className="font-semibold">C={r.energyComplexity.value.toFixed(2)}({r.energyComplexity.level})</span>
                            <span className="text-slate-500 ml-1">= 能耗{r.energyComplexity.consumptionCoeff}×0.25 + 种类{r.energyComplexity.typeCoeff}×0.25 + 用途{r.energyComplexity.useCoeff}×0.5</span>
                            {r.config.includeRB && <span className="text-indigo-600 ml-1">| 含RB: 初+1/监+0.5/再+1天</span>}
                          </div>
                        )}
                        {/* 调整因子描述和公式 */}
                        {(r.reduction > 0 || r.increase > 0) && (
                          <div className="mt-1.5 border-t border-slate-100 pt-1.5">
                            <div className="text-[9px] font-medium text-slate-600 mb-1">调整因子明细：</div>
                            <div className="space-y-0.5">
                              {r.applicableFactors.filter((f) => r.config.adjustments[f.id]?.enabled).map((factor) => {
                                const adj = r.config.adjustments[factor.id];
                                const isReduce = factor.direction === 'reduce';
                                return (
                                  <div key={factor.id} className={`text-[8px] flex items-start gap-1 ${isReduce ? 'text-green-700' : 'text-red-700'}`}>
                                    <span className={`font-medium ${isReduce ? 'bg-green-100' : 'bg-red-100'} px-1 rounded`}>
                                      {isReduce ? '↓' : '↑'}{adj.value}%
                                    </span>
                                    <span className="flex-1">{factor.description}</span>
                                    <span className="text-slate-400">({factor.rule})</span>
                                  </div>
                                );
                              })}
                            </div>
                            {/* 调整公式 */}
                            <div className="mt-1.5 bg-slate-50 rounded px-2 py-1 text-[8px] text-slate-600 font-mono">
                              <div className="font-semibold text-slate-700 mb-0.5">调整公式：</div>
                              <div>基础人天 = 按风险等级/复杂程度查表所得</div>
                              <div>调整后 = 基础人天 × (1 - 减少比例 + 增加比例)</div>
                              <div className="mt-0.5">
                                初次：{r.initBase?.total || '?'} × (1 - {r.reduction}% + {r.increase}%) = {r.init?.total || '?'} 天
                              </div>
                              <div>
                                监督：{r.monitorBase?.total || '?'} × (1 - {r.reduction}% + {r.increase}%) = {r.monitor?.total || '?'} 天
                              </div>
                              <div>
                                再认证：{r.recertBase?.total || '?'} × (1 - {r.reduction}% + {r.increase}%) = {r.recert?.total || '?'} 天
                              </div>
                              {r.reduction >= 30 && (
                                <div className="mt-0.5 text-amber-600">注：减少上限30%，已封顶</div>
                              )}
                            </div>
                          </div>
                        )}
                        {/* 三栏显示 */}
                        <div className="grid grid-cols-3 gap-1.5 text-[9px]">
                          <div className="bg-indigo-50 rounded p-1.5">
                            <div className="font-medium text-indigo-700 mb-0.5">初次认证</div>
                            <div className="text-slate-600 space-y-0.5">
                              <div>文审: {r.init?.docReview}天</div>
                              {r.init?.phase1 !== undefined && <div>一阶段: {r.init?.phase1}天</div>}
                              {r.init?.phase2 !== undefined && <div>二阶段: {r.init?.phase2}天</div>}
                              {r.init?.onsite !== undefined && <div>现场: {r.init?.onsite}天</div>}
                              <div className="font-semibold pt-0.5 border-t border-indigo-200">合计: {r.init?.total}天</div>
                            </div>
                          </div>
                          <div className="bg-emerald-50 rounded p-1.5">
                            <div className="font-medium text-emerald-700 mb-0.5">监督审核</div>
                            <div className="text-slate-600 space-y-0.5">
                              <div>文审: {r.monitor?.docReview}天</div>
                              <div>现场: {r.monitor?.onsite}天</div>
                              <div className="font-semibold pt-0.5 border-t border-emerald-200">合计: {r.monitor?.total}天</div>
                            </div>
                          </div>
                          <div className="bg-amber-50 rounded p-1.5">
                            <div className="font-medium text-amber-700 mb-0.5">再认证</div>
                            <div className="text-slate-600 space-y-0.5">
                              <div>文审: {r.recert?.docReview}天</div>
                              <div>现场: {r.recert?.onsite}天</div>
                              <div className="font-semibold pt-0.5 border-t border-amber-200">合计: {r.recert?.total}天</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
