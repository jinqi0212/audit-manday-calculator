'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import CodeSearch from '@/components/CodeSearch';
import { calcQMS, calcES, calcEnergy, ADJUSTMENT_FACTORS, type AdjustmentFactor } from '@/lib/manday-calculator';
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
  // 能源体系特有
  annualConsumption: number;
  energyTypes: number;
  mainUses: number;
  // 调整因子
  adjustments: Record<string, { enabled: boolean; value: number }>;
}

const DEFAULT_SYSTEMS: SystemConfig[] = [
  { enabled: true, system: 'Q', auditType: 'initial', effectiveCount: 100, riskLevel: '一级', annualConsumption: 0, energyTypes: 0, mainUses: 0, adjustments: {} },
  { enabled: false, system: 'E', auditType: 'initial', effectiveCount: 100, riskLevel: '一级', annualConsumption: 0, energyTypes: 0, mainUses: 0, adjustments: {} },
  { enabled: false, system: 'S', auditType: 'initial', effectiveCount: 100, riskLevel: '一级', annualConsumption: 0, energyTypes: 0, mainUses: 0, adjustments: {} },
  { enabled: false, system: 'En', auditType: 'initial', effectiveCount: 100, riskLevel: '中', annualConsumption: 10, energyTypes: 3, mainUses: 2, adjustments: {} },
];

const SYSTEM_NAMES: Record<string, string> = {
  Q: 'QMS 质量管理体系',
  E: 'EMS 环境管理体系',
  S: 'OHSMS 职业健康安全',
  En: 'EnMS 能源管理体系',
};

const SYSTEM_COLORS: Record<string, string> = {
  Q: 'indigo',
  E: 'emerald',
  S: 'amber',
  En: 'orange',
};

export default function MultiSystemPage() {
  const [selectedCode, setSelectedCode] = useState<CodeEntry | null>(null);
  const [systems, setSystems] = useState<SystemConfig[]>(DEFAULT_SYSTEMS);

  // 更新体系配置
  const updateSystem = (index: number, updates: Partial<SystemConfig>) => {
    setSystems(prev => prev.map((s, i) => i === index ? { ...s, ...updates } : s));
  };

  // 切换体系启用状态
  const toggleSystem = (index: number) => {
    setSystems(prev => prev.map((s, i) => i === index ? { ...s, enabled: !s.enabled } : s));
  };

  // 获取启用的体系
  const enabledSystems = useMemo(() => systems.filter(s => s.enabled), [systems]);

  // 计算各体系人天
  const systemResults = useMemo(() => {
    return enabledSystems.map(config => {
      const internalAuditType = toInternalAuditType(config.auditType);
      let result;
      if (config.system === 'Q') {
        result = calcQMS(config.effectiveCount, config.riskLevel, internalAuditType);
      } else if (config.system === 'E' || config.system === 'S') {
        result = calcES(config.effectiveCount, config.riskLevel, internalAuditType);
      } else if (config.system === 'En') {
        result = calcEnergy(config.effectiveCount, config.riskLevel, internalAuditType);
      }

      if (!result) return null;

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

      const ratio = 1 - totalReduction + totalIncrease;
      const adjustedTotal = result.total * ratio;

      return {
        config,
        base: result,
        adjusted: {
          total: Math.round(adjustedTotal * 10) / 10,
          docReview: Math.round(((result as unknown as Record<string, number>).docReview || 0) * ratio * 10) / 10,
          phase1: (result as unknown as Record<string, number>).phase1 ? Math.round((result as unknown as Record<string, number>).phase1! * ratio * 10) / 10 : undefined,
          phase2: (result as unknown as Record<string, number>).phase2 ? Math.round((result as unknown as Record<string, number>).phase2! * ratio * 10) / 10 : undefined,
          onsite: (result as unknown as Record<string, number>).onsite ? Math.round((result as unknown as Record<string, number>).onsite! * ratio * 10) / 10 : undefined,
        },
        reduction: Math.round(totalReduction * 100),
        increase: Math.round(totalIncrease * 100),
      };
    }).filter(Boolean);
  }, [enabledSystems]);

  // 合并计算
  const mergedResult = useMemo(() => {
    if (systemResults.length === 0) return null;

    // 文审累加
    const totalDocReview = systemResults.reduce((sum, r) => sum + (r?.adjusted.docReview || 0), 0);

    // 现场取最大值
    let maxOnsite = 0;
    systemResults.forEach(r => {
      if (r) {
        const onsite = r.adjusted.phase1 !== undefined
          ? (r.adjusted.phase1 || 0) + (r.adjusted.phase2 || 0)
          : r.adjusted.onsite || 0;
        if (onsite > maxOnsite) maxOnsite = onsite;
      }
    });

    // 合并系数：每多一个体系+20%
    const mergeFactor = 1 + (enabledSystems.length - 1) * 0.2;
    const mergedOnsite = Math.round(maxOnsite * mergeFactor * 10) / 10;
    const mergedTotal = Math.round((totalDocReview + mergedOnsite) * 10) / 10;

    return {
      totalDocReview: Math.round(totalDocReview * 10) / 10,
      maxOnsite,
      mergeFactor: Math.round(mergeFactor * 100) / 100,
      mergedOnsite,
      mergedTotal,
      systemCount: enabledSystems.length,
    };
  }, [systemResults, enabledSystems]);

  // 切换调整因子
  const toggleAdjustment = (systemIndex: number, factorId: string) => {
    setSystems(prev => prev.map((s, i) => {
      if (i !== systemIndex) return s;
      const current = s.adjustments[factorId];
      return {
        ...s,
        adjustments: {
          ...s.adjustments,
          [factorId]: { enabled: !current?.enabled, value: current?.value || 0 }
        }
      };
    }));
  };

  const setAdjustmentValue = (systemIndex: number, factorId: string, value: number) => {
    setSystems(prev => prev.map((s, i) => {
      if (i !== systemIndex) return s;
      return {
        ...s,
        adjustments: {
          ...s.adjustments,
          [factorId]: { ...s.adjustments[factorId], enabled: true, value }
        }
      };
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-800 text-white py-4 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">多体系审核人天计算</h1>
            <p className="text-slate-300 text-sm">各体系独立配置，自动合并计算</p>
          </div>
          <Link href="/" className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors">
            ← 返回首页
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* 1. 专业代码查询 */}
        <CodeSearch onSelect={setSelectedCode} />

        {/* 2. 各体系配置 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">各体系配置</h2>
          <p className="text-sm text-slate-500 mb-4">勾选启用的体系，各体系可独立配置有效人数、风险等级、审核类型</p>

          <div className="space-y-4">
            {systems.map((config, index) => {
              const color = SYSTEM_COLORS[config.system];
              return (
                <div
                  key={config.system}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    config.enabled
                      ? `border-${color}-300 bg-${color}-50/30`
                      : 'border-slate-200 bg-slate-50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <input
                      type="checkbox"
                      checked={config.enabled}
                      onChange={() => toggleSystem(index)}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-lg font-semibold text-slate-800">{SYSTEM_NAMES[config.system]}</span>
                  </div>

                  {config.enabled && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 ml-9">
                      {/* 审核类型 */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">审核类型</label>
                        <select
                          value={config.auditType}
                          onChange={(e) => updateSystem(index, { auditType: e.target.value as AuditType })}
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="initial">初次认证审核</option>
                          <option value="surveillance">监督审核</option>
                          <option value="recertification">再认证审核</option>
                        </select>
                      </div>

                      {/* 风险等级 */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">风险等级</label>
                        <select
                          value={config.riskLevel}
                          onChange={(e) => updateSystem(index, { riskLevel: e.target.value })}
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                          {config.system === 'En' ? (
                            <>
                              <option value="高">高复杂程度</option>
                              <option value="中">中复杂程度</option>
                              <option value="低">低复杂程度</option>
                            </>
                          ) : config.system === 'Q' ? (
                            <>
                              <option value="一级">一级风险</option>
                              <option value="二级">二级风险</option>
                            </>
                          ) : (
                            <>
                              <option value="一级">一级风险</option>
                              <option value="二级">二级风险</option>
                              <option value="三级">三级风险</option>
                            </>
                          )}
                        </select>
                      </div>

                      {/* 有效人数 */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">有效人数</label>
                        <input
                          type="number"
                          value={config.effectiveCount}
                          onChange={(e) => updateSystem(index, { effectiveCount: Math.max(1, parseInt(e.target.value) || 1) })}
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          min="1"
                        />
                      </div>

                      {/* 能源特有字段 */}
                      {config.system === 'En' && (
                        <div className="col-span-2 md:col-span-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">年度综合能耗(TJ)</label>
                              <input
                                type="number"
                                value={config.annualConsumption}
                                onChange={(e) => updateSystem(index, { annualConsumption: parseFloat(e.target.value) || 0 })}
                                className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                                step="0.1"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">能源种类</label>
                              <input
                                type="number"
                                value={config.energyTypes}
                                onChange={(e) => updateSystem(index, { energyTypes: parseInt(e.target.value) || 0 })}
                                className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">主要能源使用</label>
                              <input
                                type="number"
                                value={config.mainUses}
                                onChange={(e) => updateSystem(index, { mainUses: parseInt(e.target.value) || 0 })}
                                className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. 各体系计算结果 */}
        {systemResults.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">各体系计算结果</h2>

            <div className="space-y-4">
              {systemResults.map((result, idx) => {
                if (!result) return null;
                const color = SYSTEM_COLORS[result.config.system];
                return (
                  <div key={idx} className={`p-4 rounded-lg border border-${color}-200 bg-${color}-50/30`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-slate-800">{SYSTEM_NAMES[result.config.system]}</span>
                      <span className="text-sm text-slate-500">
                        {result.config.auditType === 'initial' ? '初次' : result.config.auditType === 'surveillance' ? '监督' : '再认证'}
                        {' | '}
                        {result.config.riskLevel}风险
                        {' | '}
                        {result.config.effectiveCount}人
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                      {result.adjusted.docReview > 0 && (
                        <div className="p-2 bg-white rounded border border-slate-200">
                          <div className="text-slate-500">文审</div>
                          <div className="font-semibold">{result.adjusted.docReview}天</div>
                        </div>
                      )}
                      {result.adjusted.phase1 !== undefined && (
                        <div className="p-2 bg-white rounded border border-slate-200">
                          <div className="text-slate-500">一阶段</div>
                          <div className="font-semibold">{result.adjusted.phase1}天</div>
                        </div>
                      )}
                      {result.adjusted.phase2 !== undefined && (
                        <div className="p-2 bg-white rounded border border-slate-200">
                          <div className="text-slate-500">二阶段</div>
                          <div className="font-semibold">{result.adjusted.phase2}天</div>
                        </div>
                      )}
                      {result.adjusted.onsite !== undefined && (
                        <div className="p-2 bg-white rounded border border-slate-200">
                          <div className="text-slate-500">现场</div>
                          <div className="font-semibold">{result.adjusted.onsite}天</div>
                        </div>
                      )}
                      <div className={`p-2 bg-${color}-100 rounded border border-${color}-200`}>
                        <div className={`text-${color}-700`}>合计</div>
                        <div className={`font-bold text-${color}-800`}>{result.adjusted.total}天</div>
                      </div>
                    </div>

                    {(result.reduction > 0 || result.increase > 0) && (
                      <div className="mt-2 text-xs text-slate-500">
                        调整: {result.reduction > 0 && <span className="text-green-600">减少{result.reduction}%</span>}
                        {result.increase > 0 && <span className="text-red-600 ml-2">增加{result.increase}%</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. 合并结果 */}
        {mergedResult && (
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-sm border border-indigo-200 p-6">
            <h2 className="text-lg font-semibold text-indigo-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              多体系合并结果
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="p-4 bg-white rounded-lg border border-indigo-200">
                <div className="text-sm text-slate-600">文审累加</div>
                <div className="text-2xl font-bold text-slate-800">{mergedResult.totalDocReview}天</div>
              </div>
              <div className="p-4 bg-white rounded-lg border border-indigo-200">
                <div className="text-sm text-slate-600">现场最大值</div>
                <div className="text-2xl font-bold text-slate-800">{mergedResult.maxOnsite}天</div>
              </div>
              <div className="p-4 bg-white rounded-lg border border-indigo-200">
                <div className="text-sm text-slate-600">合并系数</div>
                <div className="text-2xl font-bold text-indigo-700">×{mergedResult.mergeFactor}</div>
                <div className="text-xs text-slate-500">{mergedResult.systemCount}个体系</div>
              </div>
              <div className="p-4 bg-indigo-600 rounded-lg">
                <div className="text-sm text-indigo-100">合并总人天</div>
                <div className="text-3xl font-bold text-white">{mergedResult.mergedTotal}天</div>
              </div>
            </div>

            <div className="p-3 bg-white/60 rounded-lg text-sm text-slate-700">
              <strong>合并规则：</strong>
              文审人天累加 + 现场审核人天取最大值 × 合并系数（每增加一个体系+20%）
            </div>
          </div>
        )}

        {/* 5. 各体系调整因子 */}
        {enabledSystems.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">各体系调整因子</h2>

            {enabledSystems.map((config, systemIndex) => {
              const originalIndex = systems.findIndex(s => s.system === config.system);
              const systemFilter = config.system === 'En' ? 'common' : config.system;
              const applicableFactors = ADJUSTMENT_FACTORS.filter(
                f => f.system === systemFilter || f.system === 'common'
              );
              const color = SYSTEM_COLORS[config.system];

              return (
                <div key={config.system} className={`mb-6 p-4 rounded-lg border border-${color}-200 bg-${color}-50/20`}>
                  <h3 className="font-semibold text-slate-800 mb-3">{SYSTEM_NAMES[config.system]}</h3>
                  <div className="space-y-2">
                    {applicableFactors.map(factor => (
                      <div key={factor.id} className="flex items-center gap-3 p-2 bg-white rounded-lg">
                        <input
                          type="checkbox"
                          checked={config.adjustments[factor.id]?.enabled || false}
                          onChange={() => toggleAdjustment(originalIndex, factor.id)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-slate-700">{factor.description}</span>
                          <span className="text-xs text-slate-500 ml-2">({factor.rule})</span>
                        </div>
                        <span className={`text-sm font-medium ${factor.direction === 'reduce' ? 'text-green-600' : 'text-red-600'}`}>
                          {factor.direction === 'reduce' ? '-' : '+'}{factor.defaultPercent}%
                        </span>
                        {config.adjustments[factor.id]?.enabled && (
                          <input
                            type="range"
                            min={0}
                            max={factor.maxPercent}
                            value={config.adjustments[factor.id]?.value ?? factor.defaultPercent}
                            onChange={(e) => setAdjustmentValue(originalIndex, factor.id, parseInt(e.target.value))}
                            className="w-20"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
