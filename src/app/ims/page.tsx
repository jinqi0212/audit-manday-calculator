'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

// 按体系资格数量分组的审核员数据
interface AuditorGroup {
  systemsCount: number; // 具备的体系资格数量
  count: number;        // 该级别的审核员数量
}

// 审核组能力程度计算
// 公式: [(Y-1)×N_Y + (Y-2-1)×N_{Y-1} + ... + (1-1)×N_1] / [Z × (Y-1)] × 100%
// Y = IMS涵盖的体系标准数量
// N_k = 具备k个体系资格的审核员数量
// Z = 审核员总数 = ΣN_k
function calcAuditTeamCapability(auditorGroups: AuditorGroup[], totalSystems: number): {
  numerator: number;
  denominator: number;
  percent: number;
  totalAuditors: number;
} {
  if (totalSystems <= 1) return { numerator: 0, denominator: 0, percent: 0, totalAuditors: 0 };
  
  const totalAuditors = auditorGroups.reduce((sum, g) => sum + g.count, 0);
  if (totalAuditors === 0) return { numerator: 0, denominator: 0, percent: 0, totalAuditors: 0 };
  
  // 计算分子：每个资格级别的 (资格数-1) × 该级别人数
  let numerator = 0;
  auditorGroups.forEach(g => {
    if (g.systemsCount > 0) {
      numerator += (g.systemsCount - 1) * g.count;
    }
  });
  
  // 计算分母：审核员总数 × (体系数-1)
  const denominator = totalAuditors * (totalSystems - 1);
  
  if (denominator === 0) return { numerator, denominator, percent: 0, totalAuditors };
  
  const percent = (numerator / denominator) * 100;
  
  return { numerator, denominator, percent, totalAuditors };
}

// 整合程度等级
type IntegrationLevel = 'low' | 'medium' | 'high';

// 根据矩阵表获取减少量
// 图1矩阵：纵轴=整合程度，横轴=审核组能力
// 根据MSWM11-02文件中的图1矩阵
function getReductionPercent(integrationLevel: IntegrationLevel, capabilityPercent: number): number {
  // 矩阵定义（从MSWM11-02图1提取，经Excel验证）
  // 审核组能力程度分为4个区间：0-40%, 40-60%, 60-80%, 80-100%
  // 验证：高整合 + 76.2%能力 → 10%减少量
  const matrix: Record<IntegrationLevel, [number, number, number, number]> = {
    // [0-40%, 40-60%, 60-80%, 80-100%]
    'low':    [0,  5,  8, 10],
    'medium': [5,  8, 10, 15],
    'high':   [8, 10, 10, 20],
  };
  
  const row = matrix[integrationLevel];
  if (capabilityPercent < 40) return row[0];
  if (capabilityPercent < 60) return row[1];
  if (capabilityPercent < 80) return row[2];
  return row[3];
}

const INTEGRATION_LABELS: Record<IntegrationLevel, string> = {
  low: '低 (0%-40%)',
  medium: '中 (40%-80%)',
  high: '高 (80%-100%)',
};

const INTEGRATION_DESC: Record<IntegrationLevel, string[]> = {
  low: [
    '分别建立管理体系',
    '策划机制各不相同',
    '管理评审各自进行',
    '对法律要求的监视不一致',
    '有不同的管理体系文件',
  ],
  medium: [
    '一定程度上建立整合管理体系',
    '一个管理体系协调员和不同的管理者代表',
    '管理体系文件部分整合（如手册、程序）',
    '对管理体系文件和记录协调控制',
    '虽然策划机制不同但各管理评审一起进行',
  ],
  high: [
    '一套整合的文件，含适度融合的作业文件',
    '考虑总体经营战略和计划的管理评审',
    '内部审核采用一体化的方法',
    '对方针和目标采用一体化的方法',
    '对体系过程采用一体化的方法',
    '对改进机制采用一体化的方法',
    '一体化的管理支持和管理职责',
  ],
};

export default function IMSPage() {
  const [totalSystems, setTotalSystems] = useState(4);
  // 按体系资格数量分组的审核员
  const [auditorGroups, setAuditorGroups] = useState<AuditorGroup[]>([
    { systemsCount: 4, count: 3 },
    { systemsCount: 3, count: 3 },
    { systemsCount: 2, count: 1 },
    { systemsCount: 1, count: 0 },
  ]);
  const [integrationLevel, setIntegrationLevel] = useState<IntegrationLevel>('high');
  const [baseAuditTime, setBaseAuditTime] = useState(21); // Ti 起始审核时间

  // 计算审核组能力程度
  const capability = useMemo(() => {
    return calcAuditTeamCapability(auditorGroups, totalSystems);
  }, [auditorGroups, totalSystems]);

  // 计算减少量
  const reductionPercent = useMemo(() => {
    return getReductionPercent(integrationLevel, capability.percent);
  }, [integrationLevel, capability.percent]);

  // 计算最终审核时间
  const finalAuditTime = useMemo(() => {
    return baseAuditTime * (1 - reductionPercent / 100);
  }, [baseAuditTime, reductionPercent]);

  // 更新某个资格级别的审核员数量
  const updateAuditorCount = (systemsCount: number, count: number) => {
    setAuditorGroups(prev => prev.map(g => 
      g.systemsCount === systemsCount ? { ...g, count: Math.max(0, count) } : g
    ));
  };

  // 添加新的资格级别
  const addAuditorGroup = () => {
    const existingCounts = auditorGroups.map(g => g.systemsCount);
    let newCount = totalSystems;
    while (existingCounts.includes(newCount) && newCount > 0) {
      newCount--;
    }
    if (newCount > 0) {
      setAuditorGroups(prev => [...prev, { systemsCount: newCount, count: 0 }].sort((a, b) => b.systemsCount - a.systemsCount));
    }
  };

  // 删除某个资格级别
  const removeAuditorGroup = (systemsCount: number) => {
    setAuditorGroups(prev => prev.filter(g => g.systemsCount !== systemsCount));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-400 hover:text-white transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold">IMS结合审核人天计算</h1>
              <p className="text-xs text-slate-400">依据MSWM11-02审核人天数确定指南</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左栏：基本配置 */}
          <div className="space-y-4">
            {/* IMS体系数量 */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-xs">1</span>
                IMS涵盖的体系标准数量
              </h2>
              <select
                value={totalSystems}
                onChange={(e) => setTotalSystems(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {[2, 3, 4, 5, 6].map(n => (
                  <option key={n} value={n}>{n} 个体系</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-2">
                如：QMS+EMS+OHSMS = 3个体系
              </p>
            </div>

            {/* 审核员配置 */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-xs">2</span>
                审核组构成
              </h2>
              <p className="text-xs text-slate-500 mb-3">
                按具备的体系资格数量分组输入审核员人数
              </p>
              
              <div className="space-y-2">
                {auditorGroups.map(group => (
                  <div key={group.systemsCount} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                    <span className="text-xs text-slate-600 w-20 shrink-0">
                      {group.systemsCount}个体系资格
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={group.count}
                      onChange={(e) => updateAuditorCount(group.systemsCount, Number(e.target.value))}
                      className="flex-1 px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="人数"
                    />
                    <span className="text-xs text-slate-500">人</span>
                    {auditorGroups.length > 1 && (
                      <button
                        onClick={() => removeAuditorGroup(group.systemsCount)}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              {auditorGroups.length < totalSystems && (
                <button
                  onClick={addAuditorGroup}
                  className="mt-2 w-full py-1.5 text-xs text-indigo-600 border border-dashed border-indigo-300 rounded hover:bg-indigo-50 transition"
                >
                  + 添加资格级别
                </button>
              )}
              
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-600">
                  审核员总数：<span className="font-bold text-slate-800">{capability.totalAuditors} 人</span>
                </p>
              </div>
            </div>

            {/* 起始审核时间 */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-xs">3</span>
                起始审核时间 Ti
              </h2>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={baseAuditTime}
                  onChange={(e) => setBaseAuditTime(Number(e.target.value))}
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-600">人天</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Ti = T<sub>Q</sub> + T<sub>E</sub> + T<sub>S</sub> + T<sub>F</sub> + T<sub>H</sub> + T<sub>IS</sub> + ...
              </p>
              <p className="text-xs text-slate-400 mt-1">
                各单一体系审核人天数的合计（暂不取整）
              </p>
            </div>
          </div>

          {/* 中栏：整合程度 */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-xs">4</span>
                管理体系整合程度
              </h2>
              
              <div className="space-y-2">
                {(Object.keys(INTEGRATION_LABELS) as IntegrationLevel[]).map(level => (
                  <label
                    key={level}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                      integrationLevel === level
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="integration"
                      value={level}
                      checked={integrationLevel === level}
                      onChange={() => setIntegrationLevel(level)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700">{INTEGRATION_LABELS[level]}</p>
                      <ul className="mt-1 space-y-0.5">
                        {INTEGRATION_DESC[level].slice(0, 3).map((desc, i) => (
                          <li key={i} className="text-xs text-slate-500">• {desc}</li>
                        ))}
                        {INTEGRATION_DESC[level].length > 3 && (
                          <li className="text-xs text-slate-400">...等{INTEGRATION_DESC[level].length}项特征</li>
                        )}
                      </ul>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 矩阵说明 */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-xs font-bold text-slate-600 mb-2">审核时间减少量矩阵（图1）</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="px-2 py-1 text-left">整合程度</th>
                      <th className="px-2 py-1 text-center">0-40%</th>
                      <th className="px-2 py-1 text-center">40-60%</th>
                      <th className="px-2 py-1 text-center">60-80%</th>
                      <th className="px-2 py-1 text-center">80-100%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.keys(INTEGRATION_LABELS) as IntegrationLevel[]).map(level => (
                      <tr key={level} className={integrationLevel === level ? 'bg-indigo-50 font-semibold' : ''}>
                        <td className="px-2 py-1 font-medium">{INTEGRATION_LABELS[level].split(' ')[0]}</td>
                        {[10, 50, 70, 90].map((sample, i) => {
                          const val = getReductionPercent(level, sample);
                          const isCurrentCell = integrationLevel === level && 
                            ((i === 0 && capability.percent < 40) ||
                             (i === 1 && capability.percent >= 40 && capability.percent < 60) ||
                             (i === 2 && capability.percent >= 60 && capability.percent < 80) ||
                             (i === 3 && capability.percent >= 80));
                          return (
                            <td key={i} className={`px-2 py-1 text-center ${isCurrentCell ? 'bg-indigo-200 rounded' : ''}`}>
                              {val}%
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500 mt-2">横轴：审核组能力程度 | 高亮单元格为当前查表位置</p>
            </div>
          </div>

          {/* 右栏：计算结果 */}
          <div className="space-y-4">
            {/* 审核组能力计算 */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-sm font-bold text-slate-700 mb-3">审核组能力程度计算</h2>
              
              <div className="bg-slate-50 rounded-lg p-3 mb-3">
                <p className="text-xs text-slate-600 mb-1">计算公式：</p>
                <p className="text-xs font-mono text-slate-700">
                  [(Y₁-1)×N₁ + (Y₂-1)×N₂ + ...] / [Z × (Y-1)] × 100%
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">分子计算：</span>
                  <span className="font-mono text-slate-800">
                    {auditorGroups.map(g => g.count > 0 ? `(${g.systemsCount}-1)×${g.count}` : null).filter(Boolean).join(' + ') || '0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">分子结果：</span>
                  <span className="font-bold text-slate-800">{capability.numerator}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">分母计算：</span>
                  <span className="font-mono text-slate-800">
                    {capability.totalAuditors} × ({totalSystems}-1) = {capability.denominator}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="text-slate-600">审核组能力程度：</span>
                  <span className="font-bold text-indigo-600">
                    {capability.percent.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* 最终计算结果 */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-sm p-4 text-white">
              <h2 className="text-sm font-bold mb-3">结合审核时间计算</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-indigo-100">起始审核时间 Ti</span>
                  <span className="text-lg font-bold">{baseAuditTime.toFixed(1)} 人天</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-indigo-100">审核时间减少量</span>
                  <span className="text-lg font-bold">{reductionPercent}%</span>
                </div>
                
                <div className="pt-3 border-t border-white/20">
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-xs text-indigo-100 mb-1">计算公式：</p>
                    <p className="text-xs font-mono">
                      T = Ti × (100% - 减少量)
                    </p>
                    <p className="text-xs font-mono mt-1">
                      T = {baseAuditTime.toFixed(1)} × (100% - {reductionPercent}%)
                    </p>
                    <p className="text-xs font-mono mt-1">
                      T = {baseAuditTime.toFixed(1)} × {(1 - reductionPercent / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm font-medium">最终审核时间 T</span>
                  <span className="text-2xl font-bold">{finalAuditTime.toFixed(1)} 人天</span>
                </div>
              </div>
            </div>

            {/* 说明 */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <h3 className="text-xs font-bold text-amber-800 mb-1">注意事项</h3>
              <ul className="text-xs text-amber-700 space-y-1">
                <li>• IMS减少量最大不超过20%</li>
                <li>• 减少量是基于起始时间Ti的百分比</li>
                <li>• 最终结果应精确至小数点后1位</li>
                <li>• 审核组能力需在审核组成员确定后计算</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
