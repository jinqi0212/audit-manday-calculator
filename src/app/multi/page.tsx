'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import CodeSearch from '@/components/CodeSearch';
import { calcQMS, calcES, calcEnergy, calcEnergyComplexity, ADJUSTMENT_FACTORS } from '@/lib/manday-calculator';
import type { CodeEntry } from '@/data/codes';

type SystemType = 'Q' | 'E' | 'S' | 'En';
type AuditType = 'initial' | 'surveillance' | 'recertification';
type InternalAuditType = 'init' | 'monitor' | 'recert';

const toInternalAuditType = (t: AuditType): InternalAuditType => {
  if (t === 'initial') return 'init';
  if (t === 'surveillance') return 'monitor';
  return 'recert';
};

interface SystemConfig {
  enabled: boolean;
  system: SystemType;
  auditType: AuditType;
  effectiveCount: number;
  riskLevel: string;
  annualConsumption: number;
  energyTypes: number;
  mainUses: number;
  includeRB: boolean;
  adjustments: Record<string, { enabled: boolean; value: number }>;
}

const DEFAULT_SYSTEMS: SystemConfig[] = [
  { enabled: true, system: 'Q', auditType: 'initial', effectiveCount: 100, riskLevel: '一级', annualConsumption: 0, energyTypes: 0, mainUses: 0, includeRB: false, adjustments: {} },
  { enabled: false, system: 'E', auditType: 'initial', effectiveCount: 100, riskLevel: '一级', annualConsumption: 0, energyTypes: 0, mainUses: 0, includeRB: false, adjustments: {} },
  { enabled: false, system: 'S', auditType: 'initial', effectiveCount: 100, riskLevel: '一级', annualConsumption: 0, energyTypes: 0, mainUses: 0, includeRB: false, adjustments: {} },
  { enabled: false, system: 'En', auditType: 'initial', effectiveCount: 100, riskLevel: '中', annualConsumption: 10, energyTypes: 3, mainUses: 2, includeRB: false, adjustments: {} },
];

const SYSTEM_NAMES: Record<string, string> = {
  Q: 'QMS', E: 'EMS', S: 'OHSMS', En: 'EnMS',
};

const SYSTEM_COLORS: Record<string, string> = {
  Q: 'bg-indigo-500', E: 'bg-emerald-500', S: 'bg-amber-500', En: 'bg-orange-500',
};

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

  // 计算各体系人天
  const systemResults = useMemo(() => {
    return enabledSystems.map(config => {
      const internalAuditType = toInternalAuditType(config.auditType);
      let result;
      let energyComplexity = null;
      
      if (config.system === 'Q') {
        result = calcQMS(config.effectiveCount, config.riskLevel, internalAuditType);
      } else if (config.system === 'E' || config.system === 'S') {
        result = calcES(config.effectiveCount, config.riskLevel, internalAuditType);
      } else if (config.system === 'En') {
        // 先计算能源复杂程度
        if (config.annualConsumption > 0) {
          energyComplexity = calcEnergyComplexity(config.annualConsumption, config.energyTypes, config.mainUses);
          result = calcEnergy(config.effectiveCount, energyComplexity.level, internalAuditType, config.includeRB);
        }
      }

      if (!result) return null;

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

      const adjustedTotal = result.total * (1 - totalReduction + totalIncrease);
      const ratio = adjustedTotal / result.total;
      const baseData = result as unknown as Record<string, number>;

      return {
        config,
        base: result,
        energyComplexity,
        adjusted: {
          total: Math.round(adjustedTotal * 10) / 10,
          docReview: Math.round(baseData.docReview * ratio * 10) / 10,
          phase1: baseData.phase1 ? Math.round(baseData.phase1 * ratio * 10) / 10 : undefined,
          phase2: baseData.phase2 ? Math.round(baseData.phase2 * ratio * 10) / 10 : undefined,
          onsite: baseData.onsite ? Math.round(baseData.onsite * ratio * 10) / 10 : undefined,
        },
        reduction: Math.round(totalReduction * 100),
        increase: Math.round(totalIncrease * 100),
      };
    }).filter(r => r !== null);
  }, [enabledSystems]);

  // 合并计算
  const mergedResult = useMemo(() => {
    if (systemResults.length === 0) return null;

    let totalDocReview = 0;
    let maxOnsite = 0;
    let totalOnsite = 0;

    systemResults.forEach(r => {
      if (!r) return;
      totalDocReview += r.adjusted.docReview;
      if (r.config.auditType === 'initial') {
        const onsite = (r.adjusted.phase1 || 0) + (r.adjusted.phase2 || 0);
        maxOnsite = Math.max(maxOnsite, onsite);
        totalOnsite += onsite;
      } else {
        maxOnsite = Math.max(maxOnsite, r.adjusted.onsite || 0);
        totalOnsite += r.adjusted.onsite || 0;
      }
    });

    const mergeRatio = systemResults.length > 1 ? 1 + (systemResults.length - 1) * 0.2 : 1;
    const mergedOnsite = Math.round(maxOnsite * mergeRatio * 10) / 10;
    const mergedTotal = Math.round((totalDocReview + mergedOnsite) * 10) / 10;

    return {
      totalDocReview: Math.round(totalDocReview * 10) / 10,
      mergedOnsite,
      mergedTotal,
      mergeRatio,
      totalOnsite: Math.round(totalOnsite * 10) / 10,
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
        <Link href="/" className="text-sm text-slate-300 hover:text-white">← 返回首页</Link>
      </header>

      <div className="max-w-[1600px] mx-auto p-3 grid grid-cols-12 gap-3">
        {/* 左侧：代码查询 + 体系配置 */}
        <div className="col-span-4 space-y-2">
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
                    {config.enabled && (
                      <span className="text-[10px] text-slate-500 ml-auto">
                        {config.auditType === 'initial' ? '初次' : config.auditType === 'surveillance' ? '监督' : '再认证'}
                      </span>
                    )}
                  </div>
                  
                  {config.enabled && (
                    <>
                      <div className="grid grid-cols-3 gap-1.5">
                        <div>
                          <label className="text-[9px] text-slate-500 block mb-0.5">审核类型</label>
                          <select value={config.auditType} onChange={e => updateSystem(index, { auditType: e.target.value as AuditType })} className="w-full px-1.5 py-1 border border-slate-300 rounded text-[10px]">
                            <option value="initial">初次</option>
                            <option value="surveillance">监督</option>
                            <option value="recertification">再认证</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500 block mb-0.5">风险</label>
                          <select value={config.riskLevel} onChange={e => updateSystem(index, { riskLevel: e.target.value })} className={`w-full px-1.5 py-1 border rounded text-[10px] font-medium ${
                            config.riskLevel === '一级' ? 'border-red-300 bg-red-50 text-red-700' :
                            config.riskLevel === '二级' ? 'border-orange-300 bg-orange-50 text-orange-700' :
                            'border-green-300 bg-green-50 text-green-700'
                          }`}>
                            <option value="一级">一级</option>
                            <option value="二级">二级</option>
                            <option value="三级">三级</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500 block mb-0.5">人数</label>
                          <input type="number" value={config.effectiveCount} onChange={e => updateSystem(index, { effectiveCount: Number(e.target.value) })} className="w-full px-1.5 py-1 border border-slate-300 rounded text-[10px]" />
                        </div>
                      </div>
                      
                      {/* 能源体系特有输入 */}
                      {config.system === 'En' && (
                        <div className="mt-2 pt-2 border-t border-slate-200 space-y-1.5">
                          <div className="grid grid-cols-3 gap-1.5">
                            <div>
                              <label className="text-[9px] text-slate-500 block mb-0.5">综合能耗(TJ)</label>
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
                            <label htmlFor={`rb-${index}`} className="text-[9px] text-slate-600">含RB要求（人天-10%）</label>
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
        <div className="col-span-4 bg-white rounded-lg shadow-sm border border-slate-200 p-2.5">
          <h2 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <span className="w-4 h-4 bg-indigo-500 text-white rounded text-[10px] flex items-center justify-center">3</span>
            调整因子
            <span className="text-[9px] text-slate-400 ml-auto">减少上限30%</span>
          </h2>
          <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
            {enabledSystems.map((config, systemIdx) => {
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

        {/* 右侧：计算结果 */}
        <div className="col-span-4 space-y-2">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-2.5">
            <h2 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <span className="w-4 h-4 bg-indigo-500 text-white rounded text-[10px] flex items-center justify-center">4</span>
              计算结果
            </h2>

            {systemResults.length === 0 ? (
              <p className="text-[10px] text-slate-400 text-center py-4">请至少启用一个体系</p>
            ) : (
              <>
                {/* 各体系明细 */}
                <div className="space-y-1.5 mb-2">
                  {systemResults.map((r, i) => r && (
                    <div key={i} className="border border-slate-200 rounded p-1.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[9px] font-medium text-white px-1 py-0.5 rounded ${SYSTEM_COLORS[r.config.system]}`}>
                          {SYSTEM_NAMES[r.config.system]}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-700">{r.adjusted.total} 天</span>
                      </div>
                      {/* 能源复杂系数详情 */}
                      {r.config.system === 'En' && r.energyComplexity && (
                        <div className="text-[8px] text-amber-700 bg-amber-50 rounded px-1.5 py-1 mb-1 space-y-0.5">
                          <div className="font-semibold">复杂程度: C={r.energyComplexity.value.toFixed(2)} ({r.energyComplexity.level})</div>
                          <div className="text-[7px] text-slate-600">
                            能耗×{r.energyComplexity.consumptionCoeff} + 种类×{r.energyComplexity.typeCoeff} + 用途×{r.energyComplexity.useCoeff}
                          </div>
                          {r.config.includeRB && (
                            <div className="text-[7px] text-indigo-600">含RB要求（已-10%）</div>
                          )}
                        </div>
                      )}
                      <div className="text-[9px] text-slate-600 space-y-0.5">
                        <div className="flex justify-between">
                          <span>文审:</span>
                          <span className="font-medium">{(r.base as any).docReview} → {r.adjusted.docReview} 天</span>
                        </div>
                        {r.config.auditType === 'initial' ? (
                          <>
                            <div className="flex justify-between">
                              <span>一阶段:</span>
                              <span className="font-medium">{(r.base as any).phase1} → {r.adjusted.phase1} 天</span>
                            </div>
                            <div className="flex justify-between">
                              <span>二阶段:</span>
                              <span className="font-medium">{(r.base as any).phase2} → {r.adjusted.phase2} 天</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-between">
                            <span>现场:</span>
                            <span className="font-medium">{(r.base as any).onsite} → {r.adjusted.onsite} 天</span>
                          </div>
                        )}
                        {(r.reduction > 0 || r.increase > 0) && (
                          <div className="text-[8px] text-slate-500 pt-0.5 border-t border-slate-100 space-y-0.5">
                            {r.reduction > 0 && <span className="text-green-600">减少{r.reduction}% </span>}
                            {r.increase > 0 && <span className="text-red-600">增加{r.increase}%</span>}
                            {r.config.system === 'Q' && r.config.auditType === 'initial' && r.reduction > 0 && (
                              <div className="text-[8px] text-green-700 bg-green-50 rounded px-1 py-0.5">
                                现场人天减少公式: {(r.base as any).phase2} × (1 - {r.reduction}%) = {r.adjusted.phase2} 天
                              </div>
                            )}
                            {r.config.system === 'Q' && r.config.auditType !== 'initial' && r.reduction > 0 && (
                              <div className="text-[8px] text-green-700 bg-green-50 rounded px-1 py-0.5">
                                现场人天减少公式: {(r.base as any).onsite} × (1 - {r.reduction}%) = {r.adjusted.onsite} 天
                              </div>
                            )}
                            {(r.config.system === 'E' || r.config.system === 'S' || r.config.system === 'En') && r.reduction > 0 && (
                              <div className="text-[8px] text-green-700 bg-green-50 rounded px-1 py-0.5">
                                现场人天减少公式: {(r.base as any).onsite} × (1 - {r.reduction}%) = {r.adjusted.onsite} 天
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 合并结果 */}
                {mergedResult && systemResults.length > 1 && (
                  <div className="border-t border-slate-200 pt-2">
                    <div className="bg-indigo-50 rounded p-2">
                      <div className="text-[10px] font-semibold text-slate-700 mb-1">合并结果</div>
                      <div className="text-[9px] text-slate-600 space-y-0.5">
                        <div className="flex justify-between">
                          <span>文审合计:</span>
                          <span className="font-medium text-indigo-600">{mergedResult.totalDocReview} 天</span>
                        </div>
                        <div className="flex justify-between">
                          <span>现场审核:</span>
                          <span className="font-medium text-indigo-600">{mergedResult.mergedOnsite} 天</span>
                        </div>
                        <div className="flex justify-between text-[10px] pt-1 border-t border-indigo-200">
                          <span className="font-semibold">合并总人天:</span>
                          <span className="font-bold text-indigo-700">{mergedResult.mergedTotal} 天</span>
                        </div>
                        {systemResults.length > 1 && (
                          <div className="text-[8px] text-slate-500 pt-0.5">
                            合并系数: ×{mergedResult.mergeRatio.toFixed(1)} (每增加一个体系+20%)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
