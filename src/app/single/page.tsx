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

interface AdjustmentState {
  enabled: boolean;
  value: number;
}

export default function SingleSystemPage() {
  // 代码查询
  const [selectedCode, setSelectedCode] = useState<CodeEntry | null>(null);

  // 体系配置
  const [system, setSystem] = useState<SystemType>('Q');
  const [auditType, setAuditType] = useState<AuditType>('initial');
  const [effectiveCount, setEffectiveCount] = useState(50);
  const [riskLevel, setRiskLevel] = useState('一级');

  // 能源体系特有字段
  const [annualConsumption, setAnnualConsumption] = useState(10);
  const [energyTypes, setEnergyTypes] = useState(3);
  const [mainUses, setMainUses] = useState(2);

  // 调整因子
  const [adjustments, setAdjustments] = useState<Record<string, AdjustmentState>>({});

  // 审核组
  const [requiredCapabilities, setRequiredCapabilities] = useState<string[]>(['QMS']);
  const [auditors, setAuditors] = useState([
    { id: 1, name: '审核员A', role: '组长', capabilities: ['QMS'], plannedDays: 5 }
  ]);

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

    applicableFactors.forEach(factor => {
      const adj = adjustments[factor.id];
      if (adj?.enabled) {
        if (factor.direction === 'reduce') {
          totalReduction += adj.value / 100;
        } else {
          totalIncrease += adj.value / 100;
        }
      }
    });

    // 减少总量不超过30%
    if (totalReduction > 0.3) totalReduction = 0.3;

    const adjustedTotal = baseResult.total * (1 - totalReduction + totalIncrease);
    const ratio = adjustedTotal / baseResult.total;

    return {
      total: Math.round(adjustedTotal * 10) / 10,
      docReview: Math.round((baseResult as unknown as Record<string, number>).docReview * ratio * 10) / 10,
      phase1: (baseResult as unknown as Record<string, number>).phase1 ? Math.round((baseResult as unknown as Record<string, number>).phase1! * ratio * 10) / 10 : undefined,
      phase2: (baseResult as unknown as Record<string, number>).phase2 ? Math.round((baseResult as unknown as Record<string, number>).phase2! * ratio * 10) / 10 : undefined,
      onsite: (baseResult as unknown as Record<string, number>).onsite ? Math.round((baseResult as unknown as Record<string, number>).onsite! * ratio * 10) / 10 : undefined,
      reduction: Math.round(totalReduction * 100),
      increase: Math.round(totalIncrease * 100),
    };
  }, [baseResult, adjustments, applicableFactors]);

  // 审核组能力计算
  const teamAssessment = useMemo(() => {
    const allCapabilities = new Set<string>();
    auditors.forEach(a => a.capabilities.forEach(c => allCapabilities.add(c)));

    const covered = requiredCapabilities.filter(c => allCapabilities.has(c));
    const missing = requiredCapabilities.filter(c => !allCapabilities.has(c));
    const coverageRate = requiredCapabilities.length > 0
      ? Math.round((covered.length / requiredCapabilities.length) * 100)
      : 100;

    const totalPlannedDays = auditors.reduce((sum, a) => sum + a.plannedDays, 0);
    const minRequiredDays = Math.ceil(requiredCapabilities.length * 1.5);
    const hasTeamLeader = auditors.some(a => a.role === '组长');

    return { covered, missing, coverageRate, totalPlannedDays, minRequiredDays, hasTeamLeader };
  }, [auditors, requiredCapabilities]);

  const toggleAdjustment = (id: string) => {
    setAdjustments(prev => ({
      ...prev,
      [id]: { enabled: !prev[id]?.enabled, value: prev[id]?.value || 0 }
    }));
  };

  const setAdjustmentValue = (id: string, value: number) => {
    setAdjustments(prev => ({
      ...prev,
      [id]: { ...prev[id], enabled: true, value }
    }));
  };

  const capabilityOptions = ['QMS', 'EMS', 'OHSMS', 'EnMS', 'ISMS', 'FSMS'];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-800 text-white py-4 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">单体系审核人天计算</h1>
            <p className="text-slate-300 text-sm">MSWM11-02 / MSWM102-2 审核人天数确定指南</p>
          </div>
          <Link href="/" className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors">
            ← 返回首页
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* 1. 专业代码查询 */}
        <CodeSearch onSelect={setSelectedCode} />

        {/* 2. 体系配置 - 简洁布局 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            体系配置
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* 体系选择 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">管理体系</label>
              <select
                value={system}
                onChange={(e) => setSystem(e.target.value as SystemType)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Q">QMS 质量管理体系</option>
                <option value="E">EMS 环境管理体系</option>
                <option value="S">OHSMS 职业健康安全</option>
                <option value="En">EnMS 能源管理体系</option>
              </select>
            </div>

            {/* 审核类型 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">审核类型</label>
              <select
                value={auditType}
                onChange={(e) => setAuditType(e.target.value as AuditType)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {system === 'En' ? (
                  <>
                    <option value="高">高复杂程度</option>
                    <option value="中">中复杂程度</option>
                    <option value="低">低复杂程度</option>
                  </>
                ) : system === 'Q' ? (
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
                value={effectiveCount}
                onChange={(e) => setEffectiveCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                min="1"
              />
            </div>
          </div>

          {/* 能源体系特有字段 */}
          {system === 'En' && (
            <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="text-sm font-medium text-amber-800 mb-3">能源管理体系复杂程度计算</div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">年度综合能耗 (TJ)</label>
                  <input
                    type="number"
                    value={annualConsumption}
                    onChange={(e) => setAnnualConsumption(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">能源种类数量</label>
                  <input
                    type="number"
                    value={energyTypes}
                    onChange={(e) => setEnergyTypes(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">主要能源使用数量</label>
                  <input
                    type="number"
                    value={mainUses}
                    onChange={(e) => setMainUses(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="mt-2 text-xs text-amber-700">
                复杂程度值 = {annualConsumption}×0.5 + {energyTypes}×0.3 + {mainUses}×0.2 = {(annualConsumption * 0.5 + energyTypes * 0.3 + mainUses * 0.2).toFixed(2)}
              </div>
            </div>
          )}
        </div>

        {/* 3. 计算结果 */}
        {baseResult && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              计算结果
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {'docReview' in baseResult && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-sm text-slate-600">文审/策划/报告</div>
                  <div className="text-2xl font-bold text-slate-800 mt-1">{(baseResult as unknown as Record<string, number>).docReview}天</div>
                </div>
              )}
              {(baseResult as unknown as Record<string, number>).phase1 !== undefined && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-sm text-slate-600">一阶段现场</div>
                  <div className="text-2xl font-bold text-slate-800 mt-1">{(baseResult as unknown as Record<string, number>).phase1}天</div>
                </div>
              )}
              {(baseResult as unknown as Record<string, number>).phase2 !== undefined && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-sm text-slate-600">二阶段现场</div>
                  <div className="text-2xl font-bold text-slate-800 mt-1">{(baseResult as unknown as Record<string, number>).phase2}天</div>
                </div>
              )}
              {(baseResult as unknown as Record<string, number>).onsite !== undefined && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-sm text-slate-600">现场审核</div>
                  <div className="text-2xl font-bold text-slate-800 mt-1">{(baseResult as unknown as Record<string, number>).onsite}天</div>
                </div>
              )}
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="text-sm text-indigo-700">基础总人天</div>
                <div className="text-2xl font-bold text-indigo-800 mt-1">{baseResult.total}天</div>
              </div>
            </div>
          </div>
        )}

        {/* 4. 调整因子 */}
        {applicableFactors.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              调整因子
            </h2>

            <div className="space-y-3">
              {applicableFactors.map(factor => (
                <div key={factor.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={adjustments[factor.id]?.enabled || false}
                    onChange={() => toggleAdjustment(factor.id)}
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-slate-800">{factor.description}</div>
                    <div className="text-sm text-slate-500">{factor.rule}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${factor.direction === 'reduce' ? 'text-green-600' : 'text-red-600'}`}>
                      {factor.direction === 'reduce' ? '-' : '+'}{factor.defaultPercent}%
                    </span>
                    {adjustments[factor.id]?.enabled && (
                      <input
                        type="range"
                        min={0}
                        max={factor.maxPercent}
                        value={adjustments[factor.id]?.value ?? factor.defaultPercent}
                        onChange={(e) => setAdjustmentValue(factor.id, parseInt(e.target.value))}
                        className="w-24"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 调整后结果 */}
            {adjustedResult && (adjustedResult.reduction > 0 || adjustedResult.increase > 0) && (
              <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                <div className="text-sm font-medium text-indigo-800 mb-2">调整后人天</div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-600">基础: {baseResult?.total}天</span>
                  {adjustedResult.reduction > 0 && <span className="text-green-600">减少{adjustedResult.reduction}%</span>}
                  {adjustedResult.increase > 0 && <span className="text-red-600">增加{adjustedResult.increase}%</span>}
                  <span className="text-slate-400">→</span>
                  <span className="text-xl font-bold text-indigo-800">{adjustedResult.total}天</span>
                </div>
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {adjustedResult.docReview > 0 && (
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <div className="text-slate-500">文审</div>
                      <div className="font-semibold">{adjustedResult.docReview}天</div>
                    </div>
                  )}
                  {adjustedResult.phase1 !== undefined && (
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <div className="text-slate-500">一阶段</div>
                      <div className="font-semibold">{adjustedResult.phase1}天</div>
                    </div>
                  )}
                  {adjustedResult.phase2 !== undefined && (
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <div className="text-slate-500">二阶段</div>
                      <div className="font-semibold">{adjustedResult.phase2}天</div>
                    </div>
                  )}
                  {adjustedResult.onsite !== undefined && (
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <div className="text-slate-500">现场</div>
                      <div className="font-semibold">{adjustedResult.onsite}天</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. 审核组能力计算 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            审核组能力计算
          </h2>

          {/* 公式说明 */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm font-medium text-blue-800 mb-1">计算公式</div>
            <div className="text-sm text-blue-700 space-y-1">
              <div>• 审核人日 ≥ 所需专业能力数量 × 1.5</div>
              <div>• 能力覆盖率 = (成员能力 ∩ 所需能力) / 所需能力 × 100%</div>
            </div>
          </div>

          {/* 所需能力 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">所需审核能力</label>
            <div className="flex flex-wrap gap-2">
              {capabilityOptions.map(cap => (
                <button
                  key={cap}
                  onClick={() => setRequiredCapabilities(prev =>
                    prev.includes(cap) ? prev.filter(c => c !== cap) : [...prev, cap]
                  )}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    requiredCapabilities.includes(cap)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cap}
                </button>
              ))}
            </div>
          </div>

          {/* 审核组成员 */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">审核组成员</label>
              <button
                onClick={() => setAuditors(prev => [...prev, { id: Date.now(), name: '', role: '审核员', capabilities: [], plannedDays: 3 }])}
                className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
              >
                + 添加成员
              </button>
            </div>
            <div className="space-y-3">
              {auditors.map((auditor, idx) => (
                <div key={auditor.id} className="p-3 bg-slate-50 rounded-lg">
                  <div className="grid grid-cols-4 gap-3">
                    <input
                      type="text"
                      value={auditor.name}
                      onChange={(e) => {
                        const newAuditors = [...auditors];
                        newAuditors[idx].name = e.target.value;
                        setAuditors(newAuditors);
                      }}
                      placeholder="姓名"
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                    <select
                      value={auditor.role}
                      onChange={(e) => {
                        const newAuditors = [...auditors];
                        newAuditors[idx].role = e.target.value;
                        setAuditors(newAuditors);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="组长">组长</option>
                      <option value="审核员">审核员</option>
                      <option value="技术专家">技术专家</option>
                    </select>
                    <div className="flex flex-wrap gap-1">
                      {capabilityOptions.map(cap => (
                        <button
                          key={cap}
                          onClick={() => {
                            const newAuditors = [...auditors];
                            const caps = newAuditors[idx].capabilities;
                            newAuditors[idx].capabilities = caps.includes(cap)
                              ? caps.filter(c => c !== cap)
                              : [...caps, cap];
                            setAuditors(newAuditors);
                          }}
                          className={`px-2 py-1 rounded text-xs ${
                            auditor.capabilities.includes(cap)
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {cap}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={auditor.plannedDays}
                        onChange={(e) => {
                          const newAuditors = [...auditors];
                          newAuditors[idx].plannedDays = parseFloat(e.target.value) || 0;
                          setAuditors(newAuditors);
                        }}
                        className="w-16 px-2 py-2 border border-slate-300 rounded-lg text-sm"
                        min="0"
                        step="0.5"
                      />
                      <span className="text-sm text-slate-500">天</span>
                      <button
                        onClick={() => setAuditors(prev => prev.filter((_, i) => i !== idx))}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 评估结果 */}
          <div className="p-4 bg-gradient-to-r from-slate-50 to-indigo-50 rounded-lg border border-indigo-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-slate-600">能力覆盖率</div>
                <div className={`text-2xl font-bold ${teamAssessment.coverageRate >= 100 ? 'text-green-600' : 'text-amber-600'}`}>
                  {teamAssessment.coverageRate}%
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-600">最少需要人日</div>
                <div className="text-2xl font-bold text-slate-800">{teamAssessment.minRequiredDays}天</div>
              </div>
              <div>
                <div className="text-sm text-slate-600">计划总人日</div>
                <div className={`text-2xl font-bold ${teamAssessment.totalPlannedDays >= teamAssessment.minRequiredDays ? 'text-green-600' : 'text-red-600'}`}>
                  {teamAssessment.totalPlannedDays}天
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-600">审核组长</div>
                <div className={`text-lg font-bold ${teamAssessment.hasTeamLeader ? 'text-green-600' : 'text-red-600'}`}>
                  {teamAssessment.hasTeamLeader ? '已配置' : '未配置'}
                </div>
              </div>
            </div>
            {teamAssessment.missing.length > 0 && (
              <div className="mt-3 text-sm text-red-600">
                缺失能力: {teamAssessment.missing.join(', ')}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
