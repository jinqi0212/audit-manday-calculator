'use client';

import { useState, useMemo, useCallback } from 'react';
import { CODES_DATABASE, type CodeEntry } from '@/data/codes';
import {
  calcQMS,
  calcES,
  calcEnergyComplexity,
  calcEnergy,
  ADJUSTMENT_FACTORS,
  type AdjustmentFactor,
} from '@/lib/manday-calculator';

type SystemType = 'Q' | 'E' | 'S' | 'En';
type AuditType = 'init' | 'monitor' | 'recert';

export default function Home() {
  // 代码查询状态
  const [codeInput, setCodeInput] = useState('');
  const [codeResult, setCodeResult] = useState<CodeEntry | null>(null);
  const [codeError, setCodeError] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<CodeEntry[]>([]);

  // 人天计算状态
  const [systemType, setSystemType] = useState<SystemType>('Q');
  const [auditType, setAuditType] = useState<AuditType>('init');
  const [empCount, setEmpCount] = useState<number>(100);
  const [riskLevel, setRiskLevel] = useState('二级');

  // 能源管理状态
  const [energyConsumption, setEnergyConsumption] = useState(100);
  const [energyTypes, setEnergyTypes] = useState(2);
  const [mainEnergyUses, setMainEnergyUses] = useState(5);

  // 调整因子状态
  const [selectedFactors, setSelectedFactors] = useState<Record<string, { enabled: boolean; percent: number }>>({});

  // 代码查询
  const handleCodeSearch = useCallback((input: string) => {
    setCodeInput(input);
    if (!input.trim()) {
      setSearchSuggestions([]);
      setCodeResult(null);
      setCodeError('');
      return;
    }

    const trimmed = input.trim();
    // 精确匹配
    const exact = CODES_DATABASE.find(c => c.code === trimmed);
    if (exact) {
      setCodeResult(exact);
      setCodeError('');
      setSearchSuggestions([]);
      return;
    }

    // 模糊搜索
    const suggestions = CODES_DATABASE.filter(c =>
      c.code.includes(trimmed) || c.name.includes(trimmed)
    ).slice(0, 10);
    setSearchSuggestions(suggestions);

    if (suggestions.length === 0) {
      setCodeResult(null);
      setCodeError('未找到匹配的专业代码');
    }
  }, []);

  const selectCode = useCallback((entry: CodeEntry) => {
    setCodeInput(entry.code);
    setCodeResult(entry);
    setSearchSuggestions([]);
    setCodeError('');
    // 自动填充风险等级
    if (systemType === 'Q' && entry.q_risk) {
      const r = entry.q_risk.replace(/[^一二三]/g, '');
      if (r) setRiskLevel(r);
    } else if ((systemType === 'E' || systemType === 'S') && (systemType === 'E' ? entry.e_risk : entry.s_risk)) {
      const r = (systemType === 'E' ? entry.e_risk : entry.s_risk).replace(/[^一二三]/g, '');
      if (r) setRiskLevel(r);
    }
  }, [systemType]);

  // 人天计算结果
  const mandayResult = useMemo(() => {
    if (systemType === 'En') {
      const complexity = calcEnergyComplexity(energyConsumption, energyTypes, mainEnergyUses);
      const result = calcEnergy(empCount, complexity.level === '高' ? 'high' : complexity.level === '中' ? 'mid' : 'low', auditType);
      return { ...result, complexity };
    } else if (systemType === 'Q') {
      return calcQMS(empCount, riskLevel, auditType);
    } else {
      return calcES(empCount, riskLevel, auditType);
    }
  }, [systemType, auditType, empCount, riskLevel, energyConsumption, energyTypes, mainEnergyUses]);

  // 调整因子过滤
  const availableFactors = useMemo(() => {
    return ADJUSTMENT_FACTORS.filter(f => f.systems.includes(systemType));
  }, [systemType]);

  // 计算调整后的总人天
  const adjustedResult = useMemo(() => {
    if (!mandayResult || !('total' in mandayResult)) return null;
    const baseTotal = mandayResult.total ?? 0;
    if (baseTotal <= 0) return null;
    let totalDecrease = 0;
    let totalIncrease = 0;

    for (const factor of availableFactors) {
      const state = selectedFactors[factor.id];
      if (state?.enabled) {
        const amount = baseTotal * (state.percent / 100);
        if (factor.type === 'decrease') totalDecrease += amount;
        else totalIncrease += amount;
      }
    }

    // 减少不超过30%
    const maxDecrease = baseTotal * 0.3;
    totalDecrease = Math.min(totalDecrease, maxDecrease);

    const adjusted = baseTotal - totalDecrease + totalIncrease;
    return {
      baseTotal,
      totalDecrease: Math.round(totalDecrease * 100) / 100,
      totalIncrease: Math.round(totalIncrease * 100) / 100,
      adjusted: Math.round(adjusted * 100) / 100,
    };
  }, [mandayResult, selectedFactors, availableFactors]);

  const toggleFactor = (id: string) => {
    setSelectedFactors(prev => ({
      ...prev,
      [id]: {
        enabled: !prev[id]?.enabled,
        percent: prev[id]?.percent || 10,
      },
    }));
  };

  const setFactorPercent = (id: string, percent: number) => {
    setSelectedFactors(prev => ({
      ...prev,
      [id]: { ...prev[id], enabled: true, percent },
    }));
  };

  const riskColor = (risk: string) => {
    if (risk.includes('一') || risk.includes('特')) return 'text-red-600 bg-red-50 border-red-200';
    if (risk.includes('二')) return 'text-amber-600 bg-amber-50 border-amber-200';
    if (risk.includes('三')) return 'text-green-600 bg-green-50 border-green-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-sm">
              审
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">管理体系认证审核人天计算工具</h1>
              <p className="text-xs text-slate-400">专业代码查询 / 风险识别 / 人天计算 / 能源管理</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 space-y-6">
        {/* 专业代码查询区 */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <span className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-xs">1</span>
              专业代码查询与风险识别
            </h2>
          </div>
          <div className="p-5">
            <div className="relative">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={codeInput}
                    onChange={e => handleCodeSearch(e.target.value)}
                    placeholder="输入专业三级代码（如 01.01.01）或关键词搜索..."
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                  {searchSuggestions.length > 0 && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {searchSuggestions.map(s => (
                        <button
                          key={s.code}
                          onClick={() => selectCode(s)}
                          className="w-full text-left px-4 py-2 hover:bg-indigo-50 border-b border-slate-50 last:border-0 flex items-center gap-3"
                        >
                          <span className="font-mono text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{s.code}</span>
                          <span className="text-sm text-slate-700 truncate">{s.name}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded border ${riskColor(s.q_risk)}`}>Q:{s.q_risk || '-'}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleCodeSearch(codeInput)}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  查询
                </button>
              </div>
            </div>

            {codeError && (
              <p className="mt-2 text-sm text-red-500">{codeError}</p>
            )}

            {codeResult && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-lg font-bold text-indigo-700">{codeResult.code}</span>
                      <span className="text-base font-medium text-slate-800">{codeResult.name}</span>
                    </div>
                    <div className="text-xs text-slate-500 mb-3">
                      大类: {codeResult.major_code} {codeResult.major_name} / 中类: {codeResult.medium_code} {codeResult.medium_name}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${riskColor(codeResult.q_risk)}`}>
                        QMS: {codeResult.q_risk || '未定'}
                        {codeResult.q_accept && codeResult.q_accept !== '是' && (
                          <span className="text-[10px] opacity-75">({codeResult.q_accept})</span>
                        )}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${riskColor(codeResult.e_risk)}`}>
                        EMS: {codeResult.e_risk || '未定'}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${riskColor(codeResult.s_risk)}`}>
                        OHSMS: {codeResult.s_risk || '未定'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 人天计算区 */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <span className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-xs">2</span>
              审核人天计算
            </h2>
          </div>
          <div className="p-5">
            {/* 体系类型和审核类型选择 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">管理体系类型</label>
                <div className="flex gap-1">
                  {(['Q', 'E', 'S', 'En'] as SystemType[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setSystemType(t)}
                      className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
                        systemType === t
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {t === 'Q' ? 'QMS' : t === 'E' ? 'EMS' : t === 'S' ? 'OHSMS' : '能源EnMS'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">审核类型</label>
                <div className="flex gap-1">
                  {([['init', '初次'], ['monitor', '监督'], ['recert', '再认证']] as const).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setAuditType(val)}
                      className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
                        auditType === val
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  {systemType === 'En' ? '能源有效人数' : '体系有效人数'}
                </label>
                <input
                  type="number"
                  value={empCount}
                  onChange={e => setEmpCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  min={1}
                />
              </div>
            </div>

            {/* 风险等级选择 (非能源) */}
            {systemType !== 'En' && (
              <div className="mb-6">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">风险级别</label>
                <div className="flex gap-2">
                  {(systemType === 'Q' ? ['一级', '二级'] : ['一级', '二级', '三级', '有限复杂']).map(level => (
                    <button
                      key={level}
                      onClick={() => setRiskLevel(level)}
                      className={`px-4 py-2 text-xs font-medium rounded-md transition-colors border ${
                        riskLevel === level
                          ? level === '一级' ? 'bg-red-600 text-white border-red-600'
                            : level === '二级' ? 'bg-amber-500 text-white border-amber-500'
                            : level === '三级' ? 'bg-green-600 text-white border-green-600'
                            : 'bg-slate-600 text-white border-slate-600'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 能源管理特殊输入 */}
            {systemType === 'En' && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-xs font-semibold text-blue-800 mb-3">能源管理体系参数</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">年度综合能耗 (TJ)</label>
                    <input
                      type="number"
                      value={energyConsumption}
                      onChange={e => setEnergyConsumption(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                      step={0.1}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">能源种类数量 (占80%以上)</label>
                    <input
                      type="number"
                      value={energyTypes}
                      onChange={e => setEnergyTypes(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">主要能源使用数量</label>
                    <input
                      type="number"
                      value={mainEnergyUses}
                      onChange={e => setMainEnergyUses(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                      min={1}
                    />
                  </div>
                </div>
                {'complexity' in (mandayResult || {}) && (mandayResult as { complexity: { value: number; level: string } }).complexity && (
                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-xs text-slate-600">复杂程度值:</span>
                    <span className="font-mono text-sm font-bold text-blue-700">
                      {(mandayResult as { complexity: { value: number; level: string } }).complexity.value}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      (mandayResult as { complexity: { value: number; level: string } }).complexity.level === '高'
                        ? 'bg-red-100 text-red-700'
                        : (mandayResult as { complexity: { value: number; level: string } }).complexity.level === '中'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {(mandayResult as { complexity: { value: number; level: string } }).complexity.level}复杂
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 计算结果 */}
            {mandayResult && 'total' in mandayResult && (
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
                <h3 className="text-xs font-semibold text-indigo-800 mb-3">计算结果</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {auditType === 'init' ? (
                    <>
                      <ResultCard label="文审/策划/报告" value={(mandayResult as { docReview: number }).docReview} />
                      <ResultCard label="一阶段现场" value={(mandayResult as { phase1: number }).phase1} />
                      <ResultCard label="二阶段现场" value={(mandayResult as { phase2: number }).phase2} />
                      <ResultCard label="总人天" value={(mandayResult as { total: number }).total} highlight />
                    </>
                  ) : (
                    <>
                      <ResultCard label="文审/策划/报告" value={(mandayResult as { docReview: number }).docReview} />
                      <ResultCard label="现场审核" value={(mandayResult as { onsite: number }).onsite} />
                      <ResultCard label="现场最小极限" value={(mandayResult as { minOnsite: number }).minOnsite} />
                      <ResultCard label="总人天" value={(mandayResult as { total: number }).total} highlight />
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 调整因子区 */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <span className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-xs">3</span>
              调整因子 (可选)
              <span className="text-xs text-slate-400 font-normal ml-2">减少总量不超过30%</span>
            </h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableFactors.map(factor => (
                <FactorCard
                  key={factor.id}
                  factor={factor}
                  enabled={selectedFactors[factor.id]?.enabled || false}
                  percent={selectedFactors[factor.id]?.percent || 10}
                  onToggle={() => toggleFactor(factor.id)}
                  onPercentChange={(p) => setFactorPercent(factor.id, p)}
                />
              ))}
            </div>

            {adjustedResult && (
              <div className="mt-5 p-4 bg-slate-900 rounded-lg text-white">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-slate-400">基础人天</div>
                    <div className="text-xl font-bold font-mono">{adjustedResult.baseTotal}</div>
                  </div>
                  <div>
                    <div className="text-xs text-green-400">减少</div>
                    <div className="text-xl font-bold font-mono text-green-400">-{adjustedResult.totalDecrease}</div>
                  </div>
                  <div>
                    <div className="text-xs text-red-400">增加</div>
                    <div className="text-xl font-bold font-mono text-red-400">+{adjustedResult.totalIncrease}</div>
                  </div>
                  <div>
                    <div className="text-xs text-indigo-300">调整后人天</div>
                    <div className="text-2xl font-bold font-mono text-indigo-300">{adjustedResult.adjusted}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-4 sm:px-6 text-center">
        <p className="text-xs text-slate-400">
          数据来源: MSWM11-02审核人天数确定指南(2026.2.28修订) / MSWM102-2能源管理体系审核人天数确定指南(2026.3.27修订) / 《管理体系认证业务范围分类内容说明》第三部分
        </p>
      </footer>
    </div>
  );
}

function ResultCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`p-3 rounded-lg ${highlight ? 'bg-indigo-600 text-white' : 'bg-white/80 text-slate-800'}`}>
      <div className={`text-[10px] ${highlight ? 'text-indigo-200' : 'text-slate-500'}`}>{label}</div>
      <div className={`text-lg font-bold font-mono ${highlight ? '' : 'text-indigo-700'}`}>{value}</div>
    </div>
  );
}

function FactorCard({
  factor,
  enabled,
  percent,
  onToggle,
  onPercentChange,
}: {
  factor: AdjustmentFactor;
  enabled: boolean;
  percent: number;
  onToggle: () => void;
  onPercentChange: (p: number) => void;
}) {
  return (
    <div className={`p-3 rounded-lg border transition-colors ${
      enabled
        ? factor.type === 'decrease'
          ? 'border-green-300 bg-green-50'
          : 'border-red-300 bg-red-50'
        : 'border-slate-200 bg-white'
    }`}>
      <div className="flex items-start gap-2">
        <button
          onClick={onToggle}
          className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            enabled
              ? factor.type === 'decrease'
                ? 'bg-green-500 border-green-500'
                : 'bg-red-500 border-red-500'
              : 'border-slate-300'
          }`}
        >
          {enabled && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-800">{factor.label}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
              factor.type === 'decrease' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {factor.type === 'decrease' ? '减少' : '增加'}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">{factor.description}</p>
          {enabled && factor.maxPercent > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={factor.maxPercent}
                value={percent}
                onChange={e => onPercentChange(parseInt(e.target.value))}
                className="flex-1 h-1 accent-indigo-600"
              />
              <span className="text-xs font-mono text-slate-600 w-10 text-right">{percent}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
