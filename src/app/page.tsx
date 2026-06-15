'use client';

import { useState, useMemo, useCallback } from 'react';
import { CODES_DATABASE, type CodeEntry } from '@/data/codes';
import {
  calcQMS,
  calcES,
  calcEnergyComplexity,
  calcEnergy,
  getFactorsForSystem,
  calcTeamCapability,
  type AdjustmentFactor,
  type TeamMember,
} from '@/lib/manday-calculator';

type SystemType = 'Q' | 'E' | 'S' | 'En';
type AuditType = 'init' | 'monitor' | 'recert';

interface SingleSystemState {
  systemType: SystemType;
  auditType: AuditType;
  empCount: number;
  riskLevel: string;
  energyConsumption: number;
  energyTypes: number;
  mainEnergyUses: number;
}

interface MultiSystemItem {
  enabled: boolean;
  systemType: SystemType;
  auditType: AuditType;
  empCount: number;
  riskLevel: string;
  energyConsumption: number;
  energyTypes: number;
  mainEnergyUses: number;
}

interface FactorState {
  enabled: boolean;
  percent: number;
}

const SYSTEM_LABELS: Record<SystemType, string> = {
  Q: 'QMS 质量管理体系',
  E: 'EMS 环境管理体系',
  S: 'OHSMS 职业健康安全管理体系',
  En: 'EnMS 能源管理体系',
};

const SYSTEM_COLORS: Record<SystemType, string> = {
  Q: 'bg-blue-50 border-blue-200',
  E: 'bg-green-50 border-green-200',
  S: 'bg-orange-50 border-orange-200',
  En: 'bg-purple-50 border-purple-200',
};

const SYSTEM_BADGE: Record<SystemType, string> = {
  Q: 'bg-blue-100 text-blue-800',
  E: 'bg-green-100 text-green-800',
  S: 'bg-orange-100 text-orange-800',
  En: 'bg-purple-100 text-purple-800',
};

const AUDIT_TYPE_LABELS: Record<AuditType, string> = {
  init: '初次审核',
  monitor: '监督审核',
  recert: '再认证审核',
};

const RISK_OPTIONS_Q = ['一级', '二级'];
const RISK_OPTIONS_ES = ['一级', '二级', '三级'];

export default function Home() {
  // ========== 代码查询状态 ==========
  const [codeInput, setCodeInput] = useState('');
  const [codeResult, setCodeResult] = useState<CodeEntry | null>(null);
  const [codeError, setCodeError] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<CodeEntry[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // ========== 单体系状态 ==========
  const [single, setSingle] = useState<SingleSystemState>({
    systemType: 'Q',
    auditType: 'init',
    empCount: 100,
    riskLevel: '二级',
    energyConsumption: 100,
    energyTypes: 2,
    mainEnergyUses: 5,
  });

  // ========== 多体系状态 ==========
  const [multiItems, setMultiItems] = useState<MultiSystemItem[]>([
    { enabled: true, systemType: 'Q', auditType: 'init', empCount: 100, riskLevel: '二级', energyConsumption: 100, energyTypes: 2, mainEnergyUses: 5 },
    { enabled: false, systemType: 'E', auditType: 'init', empCount: 100, riskLevel: '二级', energyConsumption: 100, energyTypes: 2, mainEnergyUses: 5 },
    { enabled: false, systemType: 'S', auditType: 'init', empCount: 100, riskLevel: '二级', energyConsumption: 100, energyTypes: 2, mainEnergyUses: 5 },
    { enabled: false, systemType: 'En', auditType: 'init', empCount: 100, riskLevel: '二级', energyConsumption: 100, energyTypes: 2, mainEnergyUses: 5 },
  ]);

  // ========== 调整因子状态 ==========
  const [singleFactors, setSingleFactors] = useState<Record<string, FactorState>>({});
  const [multiFactors, setMultiFactors] = useState<Record<string, FactorState>>({});

  // ========== 审核组能力状态 ==========
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: '1', name: '审核组长', role: 'leader', competencies: ['QMS'], auditDays: 5 },
    { id: '2', name: '审核员A', role: 'auditor', competencies: ['QMS'], auditDays: 3 },
  ]);
  const [requiredCompetencies, setRequiredCompetencies] = useState<string[]>(['QMS']);
  const [newMemberName, setNewMemberName] = useState('');

  // ========== 代码查询逻辑 ==========
  const handleCodeSearch = useCallback((input: string) => {
    setCodeInput(input);
    if (!input.trim()) {
      setSearchSuggestions([]);
      setCodeResult(null);
      setCodeError('');
      setShowSuggestions(false);
      return;
    }
    const trimmed = input.trim();
    const exact = CODES_DATABASE.find(c => c.code === trimmed);
    if (exact) {
      setCodeResult(exact);
      setCodeError('');
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const lower = trimmed.toLowerCase();
    const matches = CODES_DATABASE.filter(c =>
      c.code.includes(trimmed) ||
      c.name.toLowerCase().includes(lower) ||
      (c.description && c.description.toLowerCase().includes(lower))
    ).slice(0, 30);
    setSearchSuggestions(matches);
    setShowSuggestions(true);
    if (matches.length === 1) {
      setCodeResult(matches[0]);
      setCodeError('');
    } else if (matches.length === 0) {
      setCodeResult(null);
      setCodeError('未找到匹配的专业代码');
    } else {
      setCodeResult(null);
      setCodeError('');
    }
  }, []);

  const selectSuggestion = useCallback((entry: CodeEntry) => {
    setCodeInput(entry.code);
    setCodeResult(entry);
    setSearchSuggestions([]);
    setShowSuggestions(false);
    setCodeError('');
  }, []);

  // ========== 人天计算函数 ==========
  const calcSingleSystem = useCallback((state: SingleSystemState) => {
    if (state.systemType === 'Q') {
      return calcQMS(state.empCount, state.riskLevel, state.auditType);
    } else if (state.systemType === 'E' || state.systemType === 'S') {
      return calcES(state.empCount, state.riskLevel, state.auditType);
    } else if (state.systemType === 'En') {
      const complexity = calcEnergyComplexity(state.energyConsumption, state.energyTypes, state.mainEnergyUses);
      const result = calcEnergy(state.empCount, complexity.level, state.auditType);
      if (result) {
        return { total: result.total, docReview: 0, onsite: result.total, level: complexity.level, complexity: complexity.value };
      }
      return null;
    }
    return null;
  }, []);

  const singleResult = useMemo(() => calcSingleSystem(single), [single, calcSingleSystem]);

  // 单体系调整因子计算
  const singleAdjustResult = useMemo(() => {
    if (!singleResult) return null;
    const baseTotal = singleResult.total || 0;
    const sysKey = single.systemType === 'En' ? 'Q' : single.systemType;
    const factors = getFactorsForSystem(sysKey as 'Q' | 'E' | 'S');
    let totalReduce = 0;
    let totalIncrease = 0;
    const activeFactors: { factor: AdjustmentFactor; percent: number; direction: string }[] = [];

    factors.forEach(f => {
      const state = singleFactors[f.id];
      if (state?.enabled) {
        const pct = Math.min(state.percent, f.maxPercent || 100);
        if (f.direction === 'reduce') {
          totalReduce += pct;
        } else {
          totalIncrease += pct;
        }
        activeFactors.push({ factor: f, percent: pct, direction: f.direction === 'reduce' ? '减少' : '增加' });
      }
    });

    // 减少总量不超过30%
    const effectiveReduce = Math.min(totalReduce, 30);
    const adjustedTotal = Math.max(0, baseTotal * (1 - effectiveReduce / 100) + baseTotal * totalIncrease / 100);

    // 各阶段分配
    const r = singleResult as unknown as Record<string, number>;
    const docReview = r.docReview || 0;
    const phase1 = r.phase1 || 0;
    const phase2 = r.phase2 || 0;
    const onsite = r.onsite || 0;
    const ratio = 1 - effectiveReduce / 100 + totalIncrease / 100;

    return {
      baseTotal,
      totalReduce: effectiveReduce,
      totalIncrease,
      adjustedTotal: Math.round(adjustedTotal * 10) / 10,
      activeFactors,
      stages: single.auditType === 'init'
        ? [
            { name: '文审/策划/报告', base: docReview, adjusted: Math.round(docReview * ratio * 10) / 10 },
            { name: '一阶段现场', base: phase1, adjusted: Math.round(phase1 * ratio * 10) / 10 },
            { name: '二阶段现场', base: phase2, adjusted: Math.round(phase2 * ratio * 10) / 10 },
          ]
        : [
            { name: '文审/策划/报告', base: docReview, adjusted: Math.round(docReview * ratio * 10) / 10 },
            { name: '现场审核', base: onsite, adjusted: Math.round(onsite * ratio * 10) / 10 },
          ],
    };
  }, [singleResult, singleFactors, single.systemType, single.auditType]);

  // 多体系计算
  const multiResults = useMemo(() => {
    const enabled = multiItems.filter(m => m.enabled);
    if (enabled.length === 0) return null;

    const results = enabled.map(item => {
      const result = calcSingleSystem(item);
      return { item, result };
    });

    // 合并计算：文审累加，现场取最大值后乘以合并系数
    let totalDocReview = 0;
    let maxOnsite = 0;
    let totalAll = 0;
    const details: { system: SystemType; auditType: AuditType; total: number; docReview: number; onsite: number }[] = [];

    results.forEach(({ item, result }) => {
      if (!result) return;
      const r = result as unknown as Record<string, number>;
      const doc = r.docReview || 0;
      const onsite = r.onsite || r.totalOnsite || 0;
      const total = result.total || 0;
      totalDocReview += doc;
      maxOnsite = Math.max(maxOnsite, onsite);
      totalAll += total;
      details.push({ system: item.systemType, auditType: item.auditType, total, docReview: doc, onsite });
    });

    // 合并系数：每多一个体系+20%
    const mergeCoeff = 1 + (enabled.length - 1) * 0.2;
    const mergedOnsite = Math.round(maxOnsite * mergeCoeff * 10) / 10;
    const mergedTotal = Math.round((totalDocReview + mergedOnsite) * 10) / 10;

    return { details, totalDocReview, maxOnsite, mergeCoeff, mergedOnsite, mergedTotal, systemCount: enabled.length };
  }, [multiItems, calcSingleSystem]);

  // 审核组能力计算
  const teamResult = useMemo(() => calcTeamCapability(teamMembers, requiredCompetencies), [teamMembers, requiredCompetencies]);

  // ========== 渲染辅助 ==========
  const riskBadge = (risk: string) => {
    const colors: Record<string, string> = {
      '一级': 'bg-red-100 text-red-800 border-red-200',
      '二级': 'bg-amber-100 text-amber-800 border-amber-200',
      '三级': 'bg-green-100 text-green-800 border-green-200',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colors[risk] || 'bg-gray-100 text-gray-600'}`}>
        {risk}风险
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶部标题栏 */}
      <header className="bg-slate-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold tracking-tight">管理体系认证审核人天计算工具</h1>
          <p className="text-slate-300 text-sm mt-1">依据 MSWM11-02 / MSWM102-2 审核人天数确定指南</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* ============================================================ */}
        {/* 模块1: 专业代码查询与风险识别 - 大尺寸 */}
        {/* ============================================================ */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-700 px-5 py-3">
            <h2 className="text-base font-semibold text-white">专业代码查询与风险识别</h2>
            <p className="text-slate-300 text-xs mt-0.5">输入三级代码、专业名称或描述关键词进行查询</p>
          </div>
          <div className="p-5">
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                专业代码 / 名称 / 描述
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={codeInput}
                  onChange={e => handleCodeSearch(e.target.value)}
                  onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="输入代码如 01.01.01，或名称如 小麦，或描述如 纺织..."
                  className="flex-1 h-12 px-4 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
                {codeResult && (
                  <button
                    onClick={() => { setCodeInput(''); setCodeResult(null); setCodeError(''); }}
                    className="px-4 h-12 text-sm text-slate-500 hover:text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    清除
                  </button>
                )}
              </div>

              {/* 下拉建议列表 - 大尺寸可见 */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-xl max-h-80 overflow-y-auto">
                  {searchSuggestions.map(c => (
                    <button
                      key={c.code}
                      onClick={() => selectSuggestion(c)}
                      className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-slate-100 last:border-0 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-semibold text-indigo-700 min-w-[80px]">{c.code}</span>
                        <span className="text-sm text-slate-800 font-medium truncate">{c.name}</span>
                      </div>
                      {c.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1 pl-[92px]">{c.description.slice(0, 80)}...</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {codeError && <p className="mt-2 text-sm text-red-600">{codeError}</p>}

            {/* 查询结果 - 完整展示 */}
            {codeResult && (
              <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-lg font-bold text-indigo-700">{codeResult.code}</span>
                    <span className="text-lg font-semibold text-slate-800">{codeResult.name}</span>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  {/* 归属信息 */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">大类：</span>
                      <span className="font-medium text-slate-800">{codeResult.major_code} {codeResult.major_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">中类：</span>
                      <span className="font-medium text-slate-800">{codeResult.medium_code} {codeResult.medium_name}</span>
                    </div>
                  </div>

                  {/* 风险等级 */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <div className="text-xs text-slate-500 mb-1">QMS 质量</div>
                      <div className="flex items-center gap-2">
                        {codeResult.q_risk ? riskBadge(codeResult.q_risk) : <span className="text-xs text-slate-400">未评级</span>}
                        {codeResult.q_accept && (
                          <span className="text-xs text-slate-500 ml-1">{codeResult.q_accept}</span>
                        )}
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <div className="text-xs text-slate-500 mb-1">EMS 环境</div>
                      <div>{codeResult.e_risk ? riskBadge(codeResult.e_risk) : <span className="text-xs text-slate-400">未评级</span>}</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <div className="text-xs text-slate-500 mb-1">OHSMS 安全</div>
                      <div>{codeResult.s_risk ? riskBadge(codeResult.s_risk) : <span className="text-xs text-slate-400">未评级</span>}</div>
                    </div>
                  </div>

                  {/* 专业描述 */}
                  {codeResult.description && (
                    <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                      <div className="text-xs font-medium text-indigo-700 mb-2">分类内容说明</div>
                      <p className="text-sm text-slate-700 leading-relaxed">{codeResult.description}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 模块2: 单体系人天计算 */}
        {/* ============================================================ */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-indigo-700 px-5 py-3">
            <h2 className="text-base font-semibold text-white">单体系审核人天计算</h2>
            <p className="text-indigo-200 text-xs mt-0.5">选择单个体系，输入有效人数和风险等级，计算审核人天</p>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">管理体系</label>
                <select
                  value={single.systemType}
                  onChange={e => {
                    const st = e.target.value as SystemType;
                    setSingle(s => ({
                      ...s,
                      systemType: st,
                      riskLevel: st === 'Q' ? '二级' : st === 'En' ? '二级' : '二级',
                    }));
                  }}
                  className="w-full h-11 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Q">QMS 质量</option>
                  <option value="E">EMS 环境</option>
                  <option value="S">OHSMS 安全</option>
                  <option value="En">EnMS 能源</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">审核类型</label>
                <select
                  value={single.auditType}
                  onChange={e => setSingle(s => ({ ...s, auditType: e.target.value as AuditType }))}
                  className="w-full h-11 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="init">初次审核</option>
                  <option value="monitor">监督审核</option>
                  <option value="recert">再认证审核</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">有效人数</label>
                <input
                  type="number"
                  value={single.empCount}
                  onChange={e => setSingle(s => ({ ...s, empCount: parseInt(e.target.value) || 0 }))}
                  className="w-full h-11 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  min={1}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {single.systemType === 'En' ? '复杂程度' : '风险等级'}
                </label>
                {single.systemType === 'En' ? (
                  <div className="h-11 px-3 flex items-center bg-purple-50 border border-purple-200 rounded-lg text-sm font-medium text-purple-800">
                    {(() => {
                      const c = calcEnergyComplexity(single.energyConsumption, single.energyTypes, single.mainEnergyUses);
                      return `${c.level}（${c.value}）`;
                    })()}
                  </div>
                ) : (
                  <select
                    value={single.riskLevel}
                    onChange={e => setSingle(s => ({ ...s, riskLevel: e.target.value }))}
                    className="w-full h-11 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {(single.systemType === 'Q' ? RISK_OPTIONS_Q : RISK_OPTIONS_ES).map(r => (
                      <option key={r} value={r}>{r}风险</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* 能源管理特殊输入 */}
            {single.systemType === 'En' && (
              <div className="grid grid-cols-3 gap-4 mb-5 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div>
                  <label className="block text-xs font-medium text-purple-700 mb-1">年度综合能耗 (TJ)</label>
                  <input
                    type="number"
                    value={single.energyConsumption}
                    onChange={e => setSingle(s => ({ ...s, energyConsumption: parseFloat(e.target.value) || 0 }))}
                    className="w-full h-10 px-3 border border-purple-200 rounded-lg text-sm bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-purple-700 mb-1">能源种类数量</label>
                  <input
                    type="number"
                    value={single.energyTypes}
                    onChange={e => setSingle(s => ({ ...s, energyTypes: parseInt(e.target.value) || 0 }))}
                    className="w-full h-10 px-3 border border-purple-200 rounded-lg text-sm bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-purple-700 mb-1">主要能源使用数量</label>
                  <input
                    type="number"
                    value={single.mainEnergyUses}
                    onChange={e => setSingle(s => ({ ...s, mainEnergyUses: parseInt(e.target.value) || 0 }))}
                    className="w-full h-10 px-3 border border-purple-200 rounded-lg text-sm bg-white outline-none"
                  />
                </div>
              </div>
            )}

            {/* 单体系计算结果 */}
            {singleResult && (
              <div className="space-y-4">
                {/* 基础人天 */}
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="text-sm font-medium text-slate-700 mb-3">
                    {SYSTEM_LABELS[single.systemType]} - {AUDIT_TYPE_LABELS[single.auditType]}
                  </div>
                  {single.auditType === 'init' ? (() => {
                    const r = singleResult as unknown as Record<string, number>;
                    return (
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div className="bg-white rounded p-2 border border-slate-200">
                        <div className="text-xs text-slate-500">文审</div>
                        <div className="text-lg font-bold text-slate-800">{singleResult.docReview}</div>
                      </div>
                      <div className="bg-white rounded p-2 border border-slate-200">
                        <div className="text-xs text-slate-500">一阶段</div>
                        <div className="text-lg font-bold text-slate-800">{r.phase1}</div>
                      </div>
                      <div className="bg-white rounded p-2 border border-slate-200">
                        <div className="text-xs text-slate-500">二阶段</div>
                        <div className="text-lg font-bold text-slate-800">{r.phase2}</div>
                      </div>
                      <div className="bg-indigo-50 rounded p-2 border border-indigo-200">
                        <div className="text-xs text-indigo-600">合计</div>
                        <div className="text-lg font-bold text-indigo-700">{singleResult.total}</div>
                      </div>
                    </div>
                    );
                  })() : (() => {
                    const r = singleResult as unknown as Record<string, number>;
                    return (
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-white rounded p-2 border border-slate-200">
                        <div className="text-xs text-slate-500">文审</div>
                        <div className="text-lg font-bold text-slate-800">{singleResult.docReview}</div>
                      </div>
                      <div className="bg-white rounded p-2 border border-slate-200">
                        <div className="text-xs text-slate-500">现场</div>
                        <div className="text-lg font-bold text-slate-800">{r.onsite}</div>
                      </div>
                      <div className="bg-indigo-50 rounded p-2 border border-indigo-200">
                        <div className="text-xs text-indigo-600">合计</div>
                        <div className="text-lg font-bold text-indigo-700">{singleResult.total}</div>
                      </div>
                    </div>
                    );
                  })()}
                </div>

                {/* 调整因子 */}
                <AdjustmentFactorsPanel
                  system={single.systemType}
                  factors={singleFactors}
                  setFactors={setSingleFactors}
                  baseTotal={singleResult.total || 0}
                  adjustResult={singleAdjustResult}
                />
              </div>
            )}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 模块3: 多体系人天合并计算 */}
        {/* ============================================================ */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-emerald-700 px-5 py-3">
            <h2 className="text-base font-semibold text-white">多体系审核人天合并计算</h2>
            <p className="text-emerald-200 text-xs mt-0.5">各体系可独立选择审核类型，合并计算：文审累加 + 现场取最大值 × 合并系数（每多一个体系+20%）</p>
          </div>
          <div className="p-5 space-y-4">
            {multiItems.map((item, idx) => (
              <div key={idx} className={`rounded-lg border-2 p-4 transition-all ${item.enabled ? SYSTEM_COLORS[item.systemType] : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={e => {
                        const next = [...multiItems];
                        next[idx] = { ...next[idx], enabled: e.target.checked };
                        setMultiItems(next);
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className={`text-sm font-semibold px-2 py-0.5 rounded ${SYSTEM_BADGE[item.systemType]}`}>
                      {item.systemType}
                    </span>
                    <span className="text-sm text-slate-600">{SYSTEM_LABELS[item.systemType]}</span>
                  </label>
                </div>
                {item.enabled && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">审核类型</label>
                      <select
                        value={item.auditType}
                        onChange={e => {
                          const next = [...multiItems];
                          next[idx] = { ...next[idx], auditType: e.target.value as AuditType };
                          setMultiItems(next);
                        }}
                        className="w-full h-10 px-2 border border-slate-300 rounded-lg text-sm bg-white outline-none"
                      >
                        <option value="init">初次审核</option>
                        <option value="monitor">监督审核</option>
                        <option value="recert">再认证审核</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">有效人数</label>
                      <input
                        type="number"
                        value={item.empCount}
                        onChange={e => {
                          const next = [...multiItems];
                          next[idx] = { ...next[idx], empCount: parseInt(e.target.value) || 0 };
                          setMultiItems(next);
                        }}
                        className="w-full h-10 px-2 border border-slate-300 rounded-lg text-sm bg-white outline-none"
                        min={1}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        {item.systemType === 'En' ? '复杂程度' : '风险等级'}
                      </label>
                      {item.systemType === 'En' ? (
                        <div className="h-10 px-2 flex items-center bg-purple-50 border border-purple-200 rounded-lg text-xs font-medium text-purple-800">
                          {(() => {
                            const c = calcEnergyComplexity(item.energyConsumption, item.energyTypes, item.mainEnergyUses);
                            return `${c.level}（${c.value}）`;
                          })()}
                        </div>
                      ) : (
                        <select
                          value={item.riskLevel}
                          onChange={e => {
                            const next = [...multiItems];
                            next[idx] = { ...next[idx], riskLevel: e.target.value };
                            setMultiItems(next);
                          }}
                          className="w-full h-10 px-2 border border-slate-300 rounded-lg text-sm bg-white outline-none"
                        >
                          {(item.systemType === 'Q' ? RISK_OPTIONS_Q : RISK_OPTIONS_ES).map(r => (
                            <option key={r} value={r}>{r}风险</option>
                          ))}
                        </select>
                      )}
                    </div>
                    {item.systemType === 'En' && (
                      <div className="grid grid-cols-3 gap-1">
                        <div>
                          <label className="block text-[10px] text-slate-500">能耗TJ</label>
                          <input type="number" value={item.energyConsumption}
                            onChange={e => { const n = [...multiItems]; n[idx] = { ...n[idx], energyConsumption: parseFloat(e.target.value) || 0 }; setMultiItems(n); }}
                            className="w-full h-10 px-1 border border-slate-300 rounded text-xs bg-white outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500">种类</label>
                          <input type="number" value={item.energyTypes}
                            onChange={e => { const n = [...multiItems]; n[idx] = { ...n[idx], energyTypes: parseInt(e.target.value) || 0 }; setMultiItems(n); }}
                            className="w-full h-10 px-1 border border-slate-300 rounded text-xs bg-white outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500">主要用途</label>
                          <input type="number" value={item.mainEnergyUses}
                            onChange={e => { const n = [...multiItems]; n[idx] = { ...n[idx], mainEnergyUses: parseInt(e.target.value) || 0 }; setMultiItems(n); }}
                            className="w-full h-10 px-1 border border-slate-300 rounded text-xs bg-white outline-none" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* 多体系合并结果 */}
            {multiResults && multiResults.systemCount > 0 && (
              <div className="space-y-4 mt-4">
                {/* 各体系明细 */}
                <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium text-slate-600">体系</th>
                        <th className="text-left px-4 py-2 font-medium text-slate-600">审核类型</th>
                        <th className="text-right px-4 py-2 font-medium text-slate-600">文审</th>
                        <th className="text-right px-4 py-2 font-medium text-slate-600">现场</th>
                        <th className="text-right px-4 py-2 font-medium text-slate-600">合计</th>
                      </tr>
                    </thead>
                    <tbody>
                      {multiResults.details.map((d, i) => (
                        <tr key={i} className="border-t border-slate-200">
                          <td className="px-4 py-2">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${SYSTEM_BADGE[d.system]}`}>{d.system}</span>
                          </td>
                          <td className="px-4 py-2 text-slate-600">{AUDIT_TYPE_LABELS[d.auditType]}</td>
                          <td className="px-4 py-2 text-right font-mono">{d.docReview}</td>
                          <td className="px-4 py-2 text-right font-mono">{d.onsite}</td>
                          <td className="px-4 py-2 text-right font-mono font-semibold">{d.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 合并结果 */}
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                  <div className="text-sm font-medium text-emerald-800 mb-3">合并计算结果</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                    <div className="bg-white rounded p-2 border border-emerald-200">
                      <div className="text-xs text-slate-500">文审合计</div>
                      <div className="text-lg font-bold text-slate-800">{multiResults.totalDocReview}</div>
                    </div>
                    <div className="bg-white rounded p-2 border border-emerald-200">
                      <div className="text-xs text-slate-500">现场最大×{multiResults.mergeCoeff.toFixed(1)}</div>
                      <div className="text-lg font-bold text-slate-800">{multiResults.mergedOnsite}</div>
                    </div>
                    <div className="bg-white rounded p-2 border border-emerald-200">
                      <div className="text-xs text-slate-500">体系数</div>
                      <div className="text-lg font-bold text-slate-800">{multiResults.systemCount}</div>
                    </div>
                    <div className="bg-emerald-100 rounded p-2 border border-emerald-300">
                      <div className="text-xs text-emerald-700">合并总人天</div>
                      <div className="text-xl font-bold text-emerald-800">{multiResults.mergedTotal}</div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-emerald-700">
                    合并规则：文审累加（{multiResults.totalDocReview}）+ 现场最大值 × 合并系数（{multiResults.mergeCoeff.toFixed(1)}）= {multiResults.totalDocReview} + {multiResults.mergedOnsite} = {multiResults.mergedTotal}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 模块4: 审核组能力计算 */}
        {/* ============================================================ */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-violet-700 px-5 py-3">
            <h2 className="text-base font-semibold text-white">审核组能力计算</h2>
            <p className="text-violet-200 text-xs mt-0.5">根据审核组成员能力和审核天数计算审核组能力程度</p>
          </div>
          <div className="p-5 space-y-5">
            {/* 公式说明 */}
            <div className="bg-violet-50 rounded-lg p-4 border border-violet-200">
              <div className="text-sm font-medium text-violet-800 mb-2">审核组能力计算公式</div>
              <div className="text-xs text-slate-700 space-y-1.5 font-mono">
                <p>2名审核人员：能力 = 最高能力分 / (最高能力分 + 次高能力分) × 100%</p>
                <p>3名审核人员：能力 = (最高×2 + 次高×1) / (最高 + 次高 + 第三) × 1/2 × 100%</p>
                <p>4名审核人员：能力 = (最高×3 + 次高×2 + 第三×1) / (最高 + 次高 + 第三 + 第四) × 1/3 × 100%</p>
                <p className="text-violet-700 font-semibold pt-1">通用公式：能力 = Σ[(n-1-i) × 能力ᵢ] / Σ能力ᵢ × 1/(n-1) × 100%</p>
                <p className="text-slate-500">其中 n = 审核人员数量，i = 按能力降序排列的序号（从0开始）</p>
              </div>
              <div className="mt-3 text-xs text-slate-600 border-t border-violet-200 pt-2">
                <span className="font-medium">审核时间最多减少量规则：</span>
                <span className="ml-2">能力100% → 最多减少20% | 能力80%-99% → 最多减少15% | 能力60%-79% → 最多减少10% | 能力40%-59% → 最多减少5% | 能力&lt;40% → 不减少</span>
              </div>
            </div>

            {/* 所需能力 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">所需审核能力</label>
              <div className="flex flex-wrap gap-2">
                {['QMS', 'EMS', 'OHSMS', 'EnMS', 'ISMS', 'FSMS'].map(c => (
                  <label key={c} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 text-sm">
                    <input
                      type="checkbox"
                      checked={requiredCompetencies.includes(c)}
                      onChange={e => {
                        if (e.target.checked) {
                          setRequiredCompetencies([...requiredCompetencies, c]);
                        } else {
                          setRequiredCompetencies(requiredCompetencies.filter(x => x !== c));
                        }
                      }}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                    />
                    {c}
                  </label>
                ))}
              </div>
            </div>

            {/* 审核组成员列表 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">审核组成员</label>
              </div>
              <div className="space-y-2">
                {teamMembers.map((member, idx) => (
                  <div key={member.id} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-400 w-6">{idx + 1}.</span>
                    <input
                      type="text"
                      value={member.name}
                      onChange={e => {
                        const next = [...teamMembers];
                        next[idx] = { ...next[idx], name: e.target.value };
                        setTeamMembers(next);
                      }}
                      className="w-24 h-9 px-2 border border-slate-300 rounded text-sm bg-white outline-none"
                      placeholder="姓名"
                    />
                    <select
                      value={member.role}
                      onChange={e => {
                        const next = [...teamMembers];
                        next[idx] = { ...next[idx], role: e.target.value as TeamMember['role'] };
                        setTeamMembers(next);
                      }}
                      className="h-9 px-2 border border-slate-300 rounded text-sm bg-white outline-none"
                    >
                      <option value="leader">组长</option>
                      <option value="auditor">审核员</option>
                      <option value="technical">技术专家</option>
                      <option value="observer">观察员</option>
                    </select>
                    <div className="flex items-center gap-1">
                      {['QMS', 'EMS', 'OHSMS', 'EnMS'].map(c => (
                        <label key={c} className="flex items-center gap-0.5 text-xs">
                          <input
                            type="checkbox"
                            checked={member.competencies.includes(c)}
                            onChange={e => {
                              const next = [...teamMembers];
                              if (e.target.checked) {
                                next[idx] = { ...next[idx], competencies: [...next[idx].competencies, c] };
                              } else {
                                next[idx] = { ...next[idx], competencies: next[idx].competencies.filter(x => x !== c) };
                              }
                              setTeamMembers(next);
                            }}
                            className="w-3 h-3 rounded border-slate-300"
                          />
                          <span className="text-slate-600">{c.replace('MS', '')}</span>
                        </label>
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-500">人天:</span>
                      <input
                        type="number"
                        value={member.auditDays}
                        onChange={e => {
                          const next = [...teamMembers];
                          next[idx] = { ...next[idx], auditDays: parseFloat(e.target.value) || 0 };
                          setTeamMembers(next);
                        }}
                        className="w-16 h-9 px-2 border border-slate-300 rounded text-sm bg-white outline-none"
                        min={0}
                        step={0.5}
                      />
                    </div>
                    <button
                      onClick={() => setTeamMembers(teamMembers.filter(m => m.id !== member.id))}
                      className="ml-auto text-red-500 hover:text-red-700 text-sm px-2"
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  const id = Date.now().toString();
                  setTeamMembers([...teamMembers, { id, name: newMemberName || `审核员${teamMembers.length + 1}`, role: 'auditor', competencies: ['QMS'], auditDays: 0 }]);
                  setNewMemberName('');
                }}
                className="mt-2 px-4 py-2 text-sm text-violet-700 border border-violet-300 rounded-lg hover:bg-violet-50"
              >
                + 添加成员
              </button>
            </div>

            {/* 计算结果 */}
            <div className="bg-violet-50 rounded-lg p-4 border border-violet-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-xs text-slate-500">审核组能力程度</div>
                  <div className="text-2xl font-bold text-violet-800">{teamResult.capabilityPercent}%</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-500">审核组长</div>
                  <div className={`text-lg font-bold ${teamResult.hasLeader ? 'text-green-700' : 'text-red-600'}`}>
                    {teamResult.hasLeader ? '已配置' : '未配置'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-500">能力覆盖</div>
                  <div className="text-lg font-bold text-slate-800">
                    {teamResult.coveredCompetencies.length}/{requiredCompetencies.length}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-500">最多可减少</div>
                  <div className="text-lg font-bold text-emerald-700">{teamResult.maxReductionPercent}%</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-600 font-mono bg-white rounded p-2 border border-violet-100">
                计算过程：{teamResult.formula}
              </div>
              {teamResult.missingCompetencies.length > 0 && (
                <div className="mt-2 text-xs text-red-600">
                  缺失能力：{teamResult.missingCompetencies.join(', ')}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// ============================================================
// 调整因子面板组件
// ============================================================
function AdjustmentFactorsPanel({
  system,
  factors,
  setFactors,
  baseTotal,
  adjustResult,
}: {
  system: SystemType;
  factors: Record<string, FactorState>;
  setFactors: React.Dispatch<React.SetStateAction<Record<string, FactorState>>>;
  baseTotal: number;
  adjustResult: ReturnType<typeof calcSingleAdjustResult> | null;
}) {
  const systemKey = system === 'En' ? 'Q' : system;
  const availableFactors = getFactorsForSystem(systemKey as 'Q' | 'E' | 'S');
  const reduceFactors = availableFactors.filter(f => f.direction === 'reduce');
  const increaseFactors = availableFactors.filter(f => f.direction === 'increase');

  const toggleFactor = (id: string) => {
    setFactors(prev => ({
      ...prev,
      [id]: { enabled: !prev[id]?.enabled, percent: prev[id]?.percent || 0 },
    }));
  };

  const setPercent = (id: string, percent: number) => {
    setFactors(prev => ({
      ...prev,
      [id]: { ...prev[id], enabled: true, percent },
    }));
  };

  return (
    <div className="space-y-4">
      {/* 减少因子 */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-amber-50 px-4 py-2 border-b border-amber-200">
          <span className="text-sm font-medium text-amber-800">减少审核时间的因素</span>
          <span className="text-xs text-amber-600 ml-2">（减少总量不超过30%）</span>
        </div>
        <div className="divide-y divide-slate-100">
          {reduceFactors.map(f => (
            <div key={f.id} className={`px-4 py-3 flex items-start gap-3 ${factors[f.id]?.enabled ? 'bg-amber-50/50' : ''}`}>
              <input
                type="checkbox"
                checked={factors[f.id]?.enabled || false}
                onChange={() => toggleFactor(f.id)}
                className="mt-1 w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-800">{f.description}</div>
                <div className="text-xs text-amber-700 mt-0.5 font-medium">{f.rule}</div>
              </div>
              {factors[f.id]?.enabled && f.maxPercent > 0 && (
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="range"
                    min={0}
                    max={f.maxPercent}
                    value={factors[f.id]?.percent || 0}
                    onChange={e => setPercent(f.id, parseInt(e.target.value))}
                    className="w-20 h-1.5 accent-amber-600"
                  />
                  <span className="text-sm font-mono text-amber-800 w-10 text-right">-{factors[f.id]?.percent || 0}%</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 增加因子 */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-red-50 px-4 py-2 border-b border-red-200">
          <span className="text-sm font-medium text-red-800">增加审核时间的因素</span>
        </div>
        <div className="divide-y divide-slate-100">
          {increaseFactors.map(f => (
            <div key={f.id} className={`px-4 py-3 flex items-start gap-3 ${factors[f.id]?.enabled ? 'bg-red-50/50' : ''}`}>
              <input
                type="checkbox"
                checked={factors[f.id]?.enabled || false}
                onChange={() => toggleFactor(f.id)}
                className="mt-1 w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-800">{f.description}</div>
                <div className="text-xs text-red-700 mt-0.5 font-medium">{f.rule}</div>
              </div>
              {factors[f.id]?.enabled && f.maxPercent > 0 && (
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="range"
                    min={0}
                    max={f.maxPercent}
                    value={factors[f.id]?.percent || 0}
                    onChange={e => setPercent(f.id, parseInt(e.target.value))}
                    className="w-20 h-1.5 accent-red-600"
                  />
                  <span className="text-sm font-mono text-red-800 w-10 text-right">+{factors[f.id]?.percent || 0}%</span>
                </div>
              )}
              {factors[f.id]?.enabled && f.id === 'rb_compliance' && (
                <span className="text-xs text-red-700 font-medium shrink-0">+1人日</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 调整后结果 */}
      {adjustResult && (
        <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
          <div className="text-sm font-medium text-indigo-800 mb-3">调整后的人天</div>
          <div className="grid grid-cols-3 gap-3 text-center mb-3">
            <div className="bg-white rounded p-2 border border-indigo-200">
              <div className="text-xs text-slate-500">基础人天</div>
              <div className="text-lg font-bold text-slate-800">{adjustResult.baseTotal}</div>
            </div>
            <div className="bg-white rounded p-2 border border-amber-200">
              <div className="text-xs text-slate-500">减少 -{adjustResult.totalReduce}%</div>
              <div className="text-lg font-bold text-amber-700">{adjustResult.totalReduce > 0 ? '-' : ''}{adjustResult.totalReduce}%</div>
            </div>
            <div className="bg-white rounded p-2 border border-red-200">
              <div className="text-xs text-slate-500">增加 +{adjustResult.totalIncrease}%</div>
              <div className="text-lg font-bold text-red-700">{adjustResult.totalIncrease > 0 ? '+' : ''}{adjustResult.totalIncrease}%</div>
            </div>
          </div>
          <div className="bg-indigo-100 rounded p-3 border border-indigo-300 text-center">
            <div className="text-xs text-indigo-600">调整后总人天</div>
            <div className="text-2xl font-bold text-indigo-800">{adjustResult.adjustedTotal}</div>
          </div>

          {/* 各阶段详情 */}
          <div className="mt-3 text-xs text-indigo-700">
            <div className="font-medium mb-1">各阶段调整后人天：</div>
            <div className="grid grid-cols-2 gap-1">
              {adjustResult.stages.map((s, i) => (
                <div key={i} className="flex justify-between bg-white rounded px-2 py-1 border border-indigo-100">
                  <span>{s.name}</span>
                  <span className="font-mono">{s.base} → {s.adjusted}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 类型辅助
function calcSingleAdjustResult(
  singleResult: { total: number; docReview: number; phase1?: number; phase2?: number; onsite?: number } | null,
  singleFactors: Record<string, FactorState>,
  system: SystemType,
  auditType: AuditType
) {
  if (!singleResult) return null;
  const baseTotal = singleResult.total || 0;
  const systemKey = system === 'En' ? 'Q' : system;
  const factors = getFactorsForSystem(systemKey as 'Q' | 'E' | 'S');
  let totalReduce = 0;
  let totalIncrease = 0;
  const activeFactors: { factor: AdjustmentFactor; percent: number; direction: string }[] = [];

  factors.forEach(f => {
    const state = singleFactors[f.id];
    if (state?.enabled) {
      const pct = Math.min(state.percent, f.maxPercent || 100);
      if (f.direction === 'reduce') totalReduce += pct;
      else totalIncrease += pct;
      activeFactors.push({ factor: f, percent: pct, direction: f.direction === 'reduce' ? '减少' : '增加' });
    }
  });

  const effectiveReduce = Math.min(totalReduce, 30);
  const adjustedTotal = Math.max(0, baseTotal * (1 - effectiveReduce / 100) + baseTotal * totalIncrease / 100);

  const docReview = singleResult.docReview || 0;
  const phase1 = singleResult.phase1 || 0;
  const phase2 = singleResult.phase2 || 0;
  const onsite = singleResult.onsite || 0;

  return {
    baseTotal,
    totalReduce: effectiveReduce,
    totalIncrease,
    adjustedTotal: Math.round(adjustedTotal * 10) / 10,
    activeFactors,
    stages: auditType === 'init'
      ? [
          { name: '文审/策划/报告', base: docReview, adjusted: Math.round(docReview * (1 - effectiveReduce / 100 + totalIncrease / 100) * 10) / 10 },
          { name: '一阶段现场', base: phase1, adjusted: Math.round(phase1 * (1 - effectiveReduce / 100 + totalIncrease / 100) * 10) / 10 },
          { name: '二阶段现场', base: phase2, adjusted: Math.round(phase2 * (1 - effectiveReduce / 100 + totalIncrease / 100) * 10) / 10 },
        ]
      : [
          { name: '文审/策划/报告', base: docReview, adjusted: Math.round(docReview * (1 - effectiveReduce / 100 + totalIncrease / 100) * 10) / 10 },
          { name: '现场审核', base: onsite, adjusted: Math.round(onsite * (1 - effectiveReduce / 100 + totalIncrease / 100) * 10) / 10 },
        ],
  };
}
