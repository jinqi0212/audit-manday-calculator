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
  const getRiskColor = (risk: string) => {
    if (risk === '一级') return 'bg-red-500';
    if (risk === '二级') return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getRiskBadge = (risk: string) => {
    if (risk === '一级') return 'bg-red-100 text-red-700 border-red-200';
    if (risk === '二级') return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-800 text-white px-6 py-3 flex items-center justify-between shadow-md">
        <h1 className="text-lg font-semibold">单体系审核人天计算</h1>
        <Link href="/" className="text-sm text-slate-300 hover:text-white">← 返回首页</Link>
      </header>

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-12 gap-4">
        {/* 左侧：代码查询 + 配置 */}
        <div className="col-span-4 space-y-4">
          {/* 代码查询 */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-indigo-500 text-white rounded text-xs flex items-center justify-center">1</span>
              专业代码查询
            </h2>
            <CodeSearch onSelect={setSelectedCode} />
            
            {selectedCode && (
              <div className="mt-3 p-3 bg-slate-50 rounded border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-sm font-semibold text-indigo-600">{selectedCode.code}</span>
                  <span className="text-sm font-medium text-slate-700">{selectedCode.name}</span>
                </div>
                {/* 风险等级强显示 */}
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className={`text-center py-1.5 px-2 rounded border ${selectedCode.q_risk ? getRiskBadge(selectedCode.q_risk) : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                    <div className="text-xs font-medium">QMS</div>
                    <div className="text-sm font-bold">{selectedCode.q_risk || '-'}</div>
                  </div>
                  <div className={`text-center py-1.5 px-2 rounded border ${selectedCode.e_risk ? getRiskBadge(selectedCode.e_risk) : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                    <div className="text-xs font-medium">EMS</div>
                    <div className="text-sm font-bold">{selectedCode.e_risk || '-'}</div>
                  </div>
                  <div className={`text-center py-1.5 px-2 rounded border ${selectedCode.s_risk ? getRiskBadge(selectedCode.s_risk) : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                    <div className="text-xs font-medium">OHSMS</div>
                    <div className="text-sm font-bold">{selectedCode.s_risk || '-'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 体系配置 */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-indigo-500 text-white rounded text-xs flex items-center justify-center">2</span>
              体系配置
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">管理体系</label>
                <select 
                  value={system} 
                  onChange={e => setSystem(e.target.value as SystemType)}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Q">QMS 质量管理体系</option>
                  <option value="E">EMS 环境管理体系</option>
                  <option value="S">OHSMS 职业健康安全管理体系</option>
                  <option value="En">能源管理体系</option>
                </select>
              </div>
              
              <div>
                <label className="text-xs text-slate-500 mb-1 block">审核类型</label>
                <select 
                  value={auditType} 
                  onChange={e => setAuditType(e.target.value as AuditType)}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="initial">初次审核</option>
                  <option value="surveillance">监督审核</option>
                  <option value="recertification">再认证审核</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1 block">风险等级</label>
                <select 
                  value={riskLevel} 
                  onChange={e => setRiskLevel(e.target.value)}
                  className={`w-full px-3 py-2 border rounded text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    riskLevel === '一级' ? 'border-red-300 bg-red-50 text-red-700' :
                    riskLevel === '二级' ? 'border-orange-300 bg-orange-50 text-orange-700' :
                    'border-green-300 bg-green-50 text-green-700'
                  }`}
                >
                  <option value="一级">一级风险（高）</option>
                  <option value="二级">二级风险（中）</option>
                  <option value="三级">三级风险（低）</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1 block">有效人数</label>
                <input 
                  type="number" 
                  value={effectiveCount} 
                  onChange={e => setEffectiveCount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {system === 'En' && (
                <>
                  <div className="pt-2 border-t border-slate-200">
                    <label className="text-xs text-slate-500 mb-1 block">年综合能耗 (TJ)</label>
                    <input 
                      type="number" 
                      value={annualConsumption} 
                      onChange={e => setAnnualConsumption(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">能源种类数量</label>
                    <input 
                      type="number" 
                      value={energyTypes} 
                      onChange={e => setEnergyTypes(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">主要能源使用数量</label>
                    <input 
                      type="number" 
                      value={mainUses} 
                      onChange={e => setMainUses(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 中间：调整因子 */}
        <div className="col-span-4">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 h-full">
            <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-indigo-500 text-white rounded text-xs flex items-center justify-center">3</span>
              调整因子
            </h2>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {applicableFactors.map(factor => {
                const adj = adjustments[factor.id];
                const isEnabled = adj?.enabled || false;
                const value = adj?.value || factor.defaultPercent;
                
                return (
                  <div 
                    key={factor.id} 
                    className={`p-2.5 rounded border transition-all ${
                      isEnabled 
                        ? factor.direction === 'reduce' 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-red-200 bg-red-50'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isEnabled}
                          onChange={() => toggleAdjustment(factor.id)}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <span className="text-xs font-medium text-slate-700">{factor.description}</span>
                      </label>
                      <span className={`text-xs font-bold ${factor.direction === 'reduce' ? 'text-green-600' : 'text-red-600'}`}>
                        {factor.direction === 'reduce' ? '↓' : '↑'} {factor.description}
                      </span>
                    </div>
                    {isEnabled && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <input 
                          type="range" 
                          min={0} 
                          max={factor.maxPercent} 
                          value={value}
                          onChange={e => updateAdjustmentValue(factor.id, Number(e.target.value))}
                          className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-xs font-mono w-10 text-right">{value}%</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 右侧：计算结果 */}
        <div className="col-span-4 space-y-4">
          {/* 基础人天 */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-indigo-500 text-white rounded text-xs flex items-center justify-center">4</span>
              基础人天
            </h2>
            {baseResult ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-xs text-slate-500">文审/策划/报告</span>
                  <span className="text-sm font-semibold text-slate-700">
                    {(baseResult as unknown as Record<string, number>).docReview?.toFixed(1) || '-'} 人天
                  </span>
                </div>
                {auditType === 'initial' && (
                  <>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                      <span className="text-xs text-slate-500">一阶段现场</span>
                      <span className="text-sm font-semibold text-slate-700">
                        {(baseResult as unknown as Record<string, number>).phase1?.toFixed(1) || '-'} 人天
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                      <span className="text-xs text-slate-500">二阶段现场</span>
                      <span className="text-sm font-semibold text-slate-700">
                        {(baseResult as unknown as Record<string, number>).phase2?.toFixed(1) || '-'} 人天
                      </span>
                    </div>
                  </>
                )}
                {auditType !== 'initial' && (
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-xs text-slate-500">现场审核</span>
                    <span className="text-sm font-semibold text-slate-700">
                      {(baseResult as unknown as Record<string, number>).onsite?.toFixed(1) || '-'} 人天
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 bg-slate-50 -mx-2 px-2 rounded">
                  <span className="text-sm font-medium text-slate-600">基础总人天</span>
                  <span className="text-lg font-bold text-slate-800">{baseResult.total.toFixed(1)} 人天</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-slate-400 text-sm">请输入有效人数</div>
            )}
          </div>

          {/* 调整后结果 */}
          {adjustedResult && (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg shadow-sm border border-indigo-200 p-4">
              <h2 className="text-sm font-semibold text-indigo-700 mb-3">调整后结果</h2>
              
              {/* 调整后总人天 */}
              <div className="bg-white rounded-lg p-3 mb-3 border border-indigo-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">调整后总人天</span>
                  <span className="text-2xl font-bold text-indigo-600">{adjustedResult.total} 人天</span>
                </div>
              </div>

              {/* 调整后各阶段 */}
              <div className="space-y-1.5 mb-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">文审/策划/报告</span>
                  <span className="font-mono text-slate-700">{adjustedResult.docReview} 人天</span>
                </div>
                {auditType === 'initial' && (
                  <>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">一阶段现场</span>
                      <span className="font-mono text-slate-700">{adjustedResult.phase1} 人天</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">二阶段现场</span>
                      <span className="font-mono text-slate-700">{adjustedResult.phase2} 人天</span>
                    </div>
                  </>
                )}
                {auditType !== 'initial' && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">现场审核</span>
                    <span className="font-mono text-slate-700">{adjustedResult.onsite} 人天</span>
                  </div>
                )}
              </div>

              {/* 调整明细 */}
              {adjustedResult.enabledFactors.length > 0 && (
                <div className="bg-white rounded-lg p-3 border border-indigo-100">
                  <div className="text-xs font-medium text-slate-600 mb-2">调整明细</div>
                  <div className="space-y-1">
                    {adjustedResult.enabledFactors.map((f, i) => (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <span className="text-slate-600">{f.name}</span>
                        <span className={f.direction === '减少' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                          {f.direction} {f.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {/* 计算公式 */}
                  <div className="mt-3 pt-2 border-t border-slate-100">
                    <div className="text-xs text-slate-500 mb-1">计算公式：</div>
                    <div className="text-xs font-mono text-slate-700 bg-slate-50 p-2 rounded">
                      调整后 = 基础人天 × (1 - 减少{adjustedResult.reduction}% + 增加{adjustedResult.increase}%)
                    </div>
                    <div className="text-xs font-mono text-slate-700 bg-slate-50 p-2 rounded mt-1">
                      = {baseResult?.total.toFixed(1)} × (1 - {adjustedResult.reduction}% + {adjustedResult.increase}%) = <span className="font-bold text-indigo-600">{adjustedResult.total} 人天</span>
                    </div>
                    {adjustedResult.savedDays > 0 && (
                      <div className="text-xs text-green-600 mt-2 font-medium">
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
