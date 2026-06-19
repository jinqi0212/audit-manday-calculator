'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import CodeSearch from '@/components/CodeSearch';
import { calcQMS, calcES, calcEnergy, ADJUSTMENT_FACTORS } from '@/lib/manday-calculator';
import type { CodeEntry } from '@/data/codes';

type SystemType = 'Q' | 'E' | 'S' | 'En';
type AuditType = 'initial' | 'surveillance' | 'recertification';
type InternalAuditType = 'init' | 'monitor' | 'recert';

const toInternalAuditType = (t: AuditType): InternalAuditType => {
  if (t === 'initial') return 'init';
  if (t === 'surveillance') return 'monitor';
  return 'recert';
};

interface AdjustmentState {
  enabled: boolean;
  value: number;
}

export default function SingleSystemPage() {
  const [selectedCode, setSelectedCode] = useState<CodeEntry | null>(null);
  const [system, setSystem] = useState<SystemType>('Q');
  const [auditType, setAuditType] = useState<AuditType>('initial');
  const [effectiveCount, setEffectiveCount] = useState(50);
  const [riskLevel, setRiskLevel] = useState('一级');
  const [annualConsumption, setAnnualConsumption] = useState(10);
  const [energyTypes, setEnergyTypes] = useState(3);
  const [mainUses, setMainUses] = useState(2);
  const [adjustments, setAdjustments] = useState<Record<string, AdjustmentState>>({});

  // 计算基础人天
  const baseResult = useMemo(() => {
    const internalAuditType = toInternalAuditType(auditType);
    if (system === 'Q') {
      return calcQMS(effectiveCount, riskLevel, internalAuditType);
    } else if (system === 'E' || system === 'S') {
      return calcES(effectiveCount, riskLevel, internalAuditType);
    } else if (system === 'En') {
      return calcEnergy(effectiveCount, riskLevel, internalAuditType);
    }
    return null;
  }, [system, effectiveCount, riskLevel, auditType]);

  // 获取适用的调整因子
  const applicableFactors = useMemo(() => {
    const systemFilter = system === 'En' ? 'common' : system;
    return ADJUSTMENT_FACTORS.filter(f => f.system === systemFilter || f.system === 'common');
  }, [system]);

  // 计算调整后的人天
  const adjustedResult = useMemo(() => {
    if (!baseResult) return null;

    let totalReduction = 0;
    let totalIncrease = 0;
    const enabledFactors: { name: string; direction: string; value: number }[] = [];

    applicableFactors.forEach(factor => {
      const adj = adjustments[factor.id];
      if (adj?.enabled) {
        if (factor.direction === 'reduce') {
          totalReduction += adj.value / 100;
          enabledFactors.push({ name: factor.description, direction: '减少', value: adj.value });
        } else {
          totalIncrease += adj.value / 100;
          enabledFactors.push({ name: factor.description, direction: '增加', value: adj.value });
        }
      }
    });

    // 减少总量不超过30%
    if (totalReduction > 0.3) totalReduction = 0.3;

    const adjustedTotal = baseResult.total * (1 - totalReduction + totalIncrease);
    const ratio = adjustedTotal / baseResult.total;
    const baseData = baseResult as unknown as Record<string, number>;

    return {
      total: Math.round(adjustedTotal * 10) / 10,
      docReview: Math.round(baseData.docReview * ratio * 10) / 10,
      phase1: baseData.phase1 ? Math.round(baseData.phase1 * ratio * 10) / 10 : undefined,
      phase2: baseData.phase2 ? Math.round(baseData.phase2 * ratio * 10) / 10 : undefined,
      onsite: baseData.onsite ? Math.round(baseData.onsite * ratio * 10) / 10 : undefined,
      reduction: Math.round(totalReduction * 100),
      increase: Math.round(totalIncrease * 100),
      enabledFactors,
      savedDays: Math.round((baseResult.total - adjustedTotal) * 10) / 10,
    };
  }, [baseResult, adjustments, applicableFactors]);

  const toggleAdjustment = (factorId: string) => {
    setAdjustments(prev => ({
      ...prev,
      [factorId]: {
        enabled: !prev[factorId]?.enabled,
        value: prev[factorId]?.value || 10,
      }
    }));
  };

  const updateAdjustmentValue = (factorId: string, value: number) => {
    setAdjustments(prev => ({
      ...prev,
      [factorId]: { ...prev[factorId], enabled: true, value }
    }));
  };

  // 风险等级颜色
  const getRiskBadge = (risk: string) => {
    if (risk === '一级') return 'bg-red-500 text-white';
    if (risk === '二级') return 'bg-orange-500 text-white';
    return 'bg-green-500 text-white';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-800 text-white px-6 py-3 flex items-center justify-between shadow-md">
        <h1 className="text-lg font-semibold">单体系审核人天计算</h1>
        <Link href="/" className="text-sm text-slate-300 hover:text-white">← 返回首页</Link>
      </header>

      <div className="max-w-[1400px] mx-auto p-4 grid grid-cols-12 gap-3">
        {/* 左侧：代码查询 + 配置 */}
        <div className="col-span-4 space-y-3">
          {/* 代码查询 - 紧凑版 */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
            <h2 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <span className="w-5 h-5 bg-indigo-500 text-white rounded text-xs flex items-center justify-center">1</span>
              专业代码查询
            </h2>
            <CodeSearch onSelect={setSelectedCode} />
            
            {/* 代码信息和风险等级 - 紧凑显示 */}
            {selectedCode && (
              <div className="mt-2 p-2 bg-gradient-to-r from-indigo-50 to-blue-50 rounded border border-indigo-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-sm font-bold text-indigo-600 bg-white px-2 py-0.5 rounded border border-indigo-200">{selectedCode.code}</span>
                  <span className="text-xs text-slate-600 truncate flex-1">{selectedCode.name}</span>
                </div>
                {/* 风险等级 - 突出显示 */}
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="text-center">
                    <div className="text-[10px] text-slate-500 mb-0.5">QMS</div>
                    <div className={`text-xs font-bold py-1 rounded ${selectedCode.q_risk ? getRiskBadge(selectedCode.q_risk) : 'bg-slate-200 text-slate-400'}`}>
                      {selectedCode.q_risk || '-'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-slate-500 mb-0.5">EMS</div>
                    <div className={`text-xs font-bold py-1 rounded ${selectedCode.e_risk ? getRiskBadge(selectedCode.e_risk) : 'bg-slate-200 text-slate-400'}`}>
                      {selectedCode.e_risk || '-'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-slate-500 mb-0.5">OHSMS</div>
                    <div className={`text-xs font-bold py-1 rounded ${selectedCode.s_risk ? getRiskBadge(selectedCode.s_risk) : 'bg-slate-200 text-slate-400'}`}>
                      {selectedCode.s_risk || '-'}
                    </div>
                  </div>
                </div>
                {/* 专业描述 - 小框可折叠 */}
                {selectedCode.description && (
                  <details className="mt-2">
                    <summary className="text-[10px] text-slate-500 cursor-pointer hover:text-indigo-600">查看专业描述</summary>
                    <div className="mt-1 p-2 bg-white rounded border border-slate-200 text-[10px] text-slate-600 max-h-20 overflow-y-auto leading-relaxed">
                      {selectedCode.description}
                    </div>
                  </details>
                )}
              </div>
            )}
          </div>

          {/* 体系配置 - 紧凑版 */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
            <h2 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <span className="w-5 h-5 bg-indigo-500 text-white rounded text-xs flex items-center justify-center">2</span>
              体系配置
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 mb-0.5 block">管理体系</label>
                <select 
                  value={system} 
                  onChange={e => setSystem(e.target.value as SystemType)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Q">QMS 质量</option>
                  <option value="E">EMS 环境</option>
                  <option value="S">OHSMS 安全</option>
                  <option value="En">能源</option>
                </select>
              </div>
              
              <div>
                <label className="text-[10px] text-slate-500 mb-0.5 block">审核类型</label>
                <select 
                  value={auditType} 
                  onChange={e => setAuditType(e.target.value as AuditType)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="initial">初次审核</option>
                  <option value="surveillance">监督审核</option>
                  <option value="recertification">再认证</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 mb-0.5 block">风险等级</label>
                <select 
                  value={riskLevel} 
                  onChange={e => setRiskLevel(e.target.value)}
                  className={`w-full px-2 py-1.5 border rounded text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    riskLevel === '一级' ? 'border-red-300 bg-red-50 text-red-700' :
                    riskLevel === '二级' ? 'border-orange-300 bg-orange-50 text-orange-700' :
                    'border-green-300 bg-green-50 text-green-700'
                  }`}
                >
                  <option value="一级">一级（高）</option>
                  <option value="二级">二级（中）</option>
                  <option value="三级">三级（低）</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 mb-0.5 block">有效人数</label>
                <input 
                  type="number" 
                  value={effectiveCount} 
                  onChange={e => setEffectiveCount(Number(e.target.value))}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {system === 'En' && (
              <div className="mt-2 pt-2 border-t border-slate-200 grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 mb-0.5 block">年能耗(TJ)</label>
                  <input 
                    type="number" 
                    value={annualConsumption} 
                    onChange={e => setAnnualConsumption(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 mb-0.5 block">能源种类</label>
                  <input 
                    type="number" 
                    value={energyTypes} 
                    onChange={e => setEnergyTypes(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 mb-0.5 block">主要用途</label>
                  <input 
                    type="number" 
                    value={mainUses} 
                    onChange={e => setMainUses(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 中间：调整因子 */}
        <div className="col-span-4">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3 h-full">
            <h2 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <span className="w-5 h-5 bg-indigo-500 text-white rounded text-xs flex items-center justify-center">3</span>
              调整因子
              <span className="text-[10px] text-slate-400 font-normal ml-auto">减少上限30%</span>
            </h2>
            <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
              {applicableFactors.map(factor => {
                const adj = adjustments[factor.id];
                const isEnabled = adj?.enabled || false;
                const value = adj?.value || factor.defaultPercent;
                
                return (
                  <div 
                    key={factor.id} 
                    className={`p-2 rounded border transition-all ${
                      isEnabled 
                        ? factor.direction === 'reduce' 
                          ? 'border-green-300 bg-green-50' 
                          : 'border-red-300 bg-red-50'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 cursor-pointer flex-1 min-w-0">
                        <input 
                          type="checkbox" 
                          checked={isEnabled}
                          onChange={() => toggleAdjustment(factor.id)}
                          className="w-3.5 h-3.5 text-indigo-600 rounded flex-shrink-0"
                        />
                        <span className="text-[11px] text-slate-700 truncate">{factor.description}</span>
                      </label>
                      <span className={`text-[10px] font-bold flex-shrink-0 ${factor.direction === 'reduce' ? 'text-green-600' : 'text-red-600'}`}>
                        {factor.direction === 'reduce' ? '↓' : '↑'}{factor.maxPercent}%
                      </span>
                    </div>
                    {isEnabled && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <input 
                          type="range" 
                          min={0} 
                          max={factor.maxPercent} 
                          value={value}
                          onChange={e => updateAdjustmentValue(factor.id, Number(e.target.value))}
                          className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-[10px] font-mono w-8 text-right text-slate-600">{value}%</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 右侧：计算结果 */}
        <div className="col-span-4 space-y-3">
          {/* 基础人天 */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
            <h2 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <span className="w-5 h-5 bg-slate-500 text-white rounded text-xs flex items-center justify-center">4</span>
              基础人天
            </h2>
            {baseResult ? (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-xs text-slate-500">文审/策划/报告</span>
                  <span className="text-sm font-semibold text-slate-700">
                    {(baseResult as unknown as Record<string, number>).docReview?.toFixed(1) || '-'} 天
                  </span>
                </div>
                {auditType === 'initial' && (
                  <>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-xs text-slate-500">一阶段现场</span>
                      <span className="text-sm font-semibold text-slate-700">
                        {(baseResult as unknown as Record<string, number>).phase1?.toFixed(1) || '-'} 天
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-xs text-slate-500">二阶段现场</span>
                      <span className="text-sm font-semibold text-slate-700">
                        {(baseResult as unknown as Record<string, number>).phase2?.toFixed(1) || '-'} 天
                      </span>
                    </div>
                  </>
                )}
                {auditType !== 'initial' && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-xs text-slate-500">现场审核</span>
                    <span className="text-sm font-semibold text-slate-700">
                      {(baseResult as unknown as Record<string, number>).onsite?.toFixed(1) || '-'} 天
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1.5 mt-1 border-t border-slate-200">
                  <span className="text-sm font-medium text-slate-600">基础总人天</span>
                  <span className="text-lg font-bold text-slate-800">{baseResult.total.toFixed(1)} 天</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-slate-400 text-sm">请输入有效人数</div>
            )}
          </div>

          {/* 调整后结果 */}
          {adjustedResult && (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg shadow-sm border border-indigo-200 p-3">
              <h2 className="text-sm font-semibold text-indigo-700 mb-2">调整后结果</h2>
              
              {/* 调整后总人天 */}
              <div className="bg-white rounded-lg p-2.5 mb-2 border border-indigo-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-600">调整后总人天</span>
                  <span className="text-xl font-bold text-indigo-600">{adjustedResult.total} 天</span>
                </div>
              </div>

              {/* 调整后各阶段 */}
              <div className="bg-white rounded-lg p-2.5 mb-2 border border-indigo-100">
                <div className="text-[10px] text-slate-500 mb-1.5">各阶段调整后</div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-slate-500">文审/策划/报告</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400 line-through">
                        {(baseResult as unknown as Record<string, number>).docReview?.toFixed(1)}
                      </span>
                      <span className="text-xs font-mono font-medium text-indigo-600">→ {adjustedResult.docReview} 天</span>
                    </div>
                  </div>
                  {auditType === 'initial' && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-slate-500">一阶段现场</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400 line-through">
                            {(baseResult as unknown as Record<string, number>).phase1?.toFixed(1)}
                          </span>
                          <span className="text-xs font-mono font-medium text-indigo-600">→ {adjustedResult.phase1} 天</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-slate-500">二阶段现场</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400 line-through">
                            {(baseResult as unknown as Record<string, number>).phase2?.toFixed(1)}
                          </span>
                          <span className="text-xs font-mono font-medium text-indigo-600">→ {adjustedResult.phase2} 天</span>
                        </div>
                      </div>
                    </>
                  )}
                  {auditType !== 'initial' && (
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-slate-500">现场审核</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 line-through">
                          {(baseResult as unknown as Record<string, number>).onsite?.toFixed(1)}
                        </span>
                        <span className="text-xs font-mono font-medium text-indigo-600">→ {adjustedResult.onsite} 天</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 调整明细和公式 */}
              {adjustedResult.enabledFactors.length > 0 && (
                <div className="bg-white rounded-lg p-2.5 border border-indigo-100">
                  <div className="text-[10px] text-slate-500 mb-1.5">调整明细</div>
                  <div className="space-y-0.5 mb-2">
                    {adjustedResult.enabledFactors.map((f, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-600 truncate flex-1">{f.name}</span>
                        <span className={`text-[10px] font-medium flex-shrink-0 ${f.direction === '减少' ? 'text-green-600' : 'text-red-600'}`}>
                          {f.direction} {f.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {/* 计算公式 */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-[10px] font-mono text-slate-600 bg-slate-50 p-1.5 rounded leading-relaxed">
                      {baseResult?.total.toFixed(1)} × (1 - {adjustedResult.reduction}% + {adjustedResult.increase}%) = <span className="font-bold text-indigo-600">{adjustedResult.total}</span>
                    </div>
                    {adjustedResult.savedDays > 0 && (
                      <div className="text-[10px] text-green-600 mt-1 font-medium text-center">
                        ✓ 节约 {adjustedResult.savedDays} 人天
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
