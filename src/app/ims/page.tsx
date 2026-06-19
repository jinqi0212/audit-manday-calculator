'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

// 整合程度描述（来自MSWM11-02 表1）
const INTEGRATION_DESC = {
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
    '虽然策划机制不同但各管理体系的管理评审一起进行',
  ],
  high: [
    '为一套整合的文件，适宜时包括适度融合的作业文件',
    '考虑总体经营战略和计划的管理评审',
    '内部审核采用一体化的方法',
    '对方针和目标采用一体化的方法',
    '对体系过程采用一体化的方法',
    '对改进机制（纠正和预防措施、测量和持续改进）采用一体化的方法',
    '一体化的管理支持和管理职责',
  ],
};

// 图1矩阵：5x5，纵轴=整合程度(0-100%按20%分档)，横轴=审核组能力(0-100%按20%分档)
// 数据来自MSWM11-02文件图1，经Excel验证调整
function getReductionPercent(integrationPercent: number, capabilityPercent: number): number {
  // 5x5矩阵，行=整合程度(0-20,20-40,40-60,60-80,80-100)，列=审核组能力(0-20,20-40,40-60,60-80,80-100)
  // 验证点：整合90%+能力76.19% → 减少量10%（来自Excel）
  const matrix: number[][] = [
    // [0-20%, 20-40%, 40-60%, 60-80%, 80-100%]
    [0, 0, 0, 0, 0],         // 整合程度 0-20%
    [0, 5, 5, 5, 5],         // 整合程度 20-40%
    [0, 5, 10, 10, 10],      // 整合程度 40-60%
    [0, 5, 10, 15, 15],      // 整合程度 60-80%
    [0, 5, 10, 10, 20],      // 整合程度 80-100% (经Excel验证: 76.19%能力→10%)
  ];

  const row = Math.min(Math.floor(integrationPercent / 20), 4);
  const col = Math.min(Math.floor(capabilityPercent / 20), 4);
  return matrix[row][col];
}

// 获取整合程度等级标签
function getIntegrationLabel(percent: number): { label: string; level: 'low' | 'medium' | 'high' } {
  if (percent < 40) return { label: '低', level: 'low' };
  if (percent < 80) return { label: '中', level: 'medium' };
  return { label: '高', level: 'high' };
}

interface AuditorGroup {
  systemsCount: number;
  count: number;
}

export default function IMSPage() {
  // 体系数量
  const [totalSystems, setTotalSystems] = useState(3);

  // 审核员构成：按具备的体系资格数量分组
  const [auditorGroups, setAuditorGroups] = useState<AuditorGroup[]>([
    { systemsCount: 3, count: 1 },
    { systemsCount: 2, count: 1 },
    { systemsCount: 1, count: 1 },
  ]);

  // 整合程度（百分比，0-100）
  const [integrationPercent, setIntegrationPercent] = useState(80);

  // 起始审核时间 Ti
  const [baseAuditTime, setBaseAuditTime] = useState(15);

  // 更新审核员人数
  const updateAuditorCount = (systemsCount: number, count: number) => {
    setAuditorGroups(prev => prev.map(g =>
      g.systemsCount === systemsCount ? { ...g, count: Math.max(0, count) } : g
    ));
  };

  // 添加新的资格级别
  const addAuditorGroup = () => {
    const existing = new Set(auditorGroups.map(g => g.systemsCount));
    for (let i = totalSystems; i >= 1; i--) {
      if (!existing.has(i)) {
        setAuditorGroups(prev => [...prev, { systemsCount: i, count: 0 }].sort((a, b) => b.systemsCount - a.systemsCount));
        return;
      }
    }
  };

  // 移除资格级别
  const removeAuditorGroup = (systemsCount: number) => {
    setAuditorGroups(prev => prev.filter(g => g.systemsCount !== systemsCount));
  };

  // 计算审核组能力程度
  const capability = useMemo(() => {
    const numerator = auditorGroups.reduce((sum, g) => sum + (g.systemsCount - 1) * g.count, 0);
    const totalAuditors = auditorGroups.reduce((sum, g) => sum + g.count, 0);
    const denominator = totalAuditors * (totalSystems - 1);
    const percent = denominator > 0 ? (numerator / denominator) * 100 : 0;
    return { numerator, denominator, totalAuditors, percent };
  }, [auditorGroups, totalSystems]);

  // 查表得减少量
  const reductionPercent = getReductionPercent(integrationPercent, capability.percent);

  // 最终审核时间
  const finalAuditTime = baseAuditTime * (1 - reductionPercent / 100);

  // 整合程度等级
  const integrationInfo = getIntegrationLabel(integrationPercent);

  // 当前矩阵高亮位置
  const currentRow = Math.min(Math.floor(integrationPercent / 20), 4);
  const currentCol = Math.min(Math.floor(capability.percent / 20), 4);

  // 矩阵数据（与getReductionPercent中的矩阵一致）
  const matrixData: number[][] = [
    [0, 0, 0, 0, 0],
    [0, 5, 5, 5, 5],
    [0, 5, 10, 10, 10],
    [0, 5, 10, 15, 15],
    [0, 5, 10, 10, 20],
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶部标题 */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 md:py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-slate-400 hover:text-slate-600 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-800">IMS结合审核人天计算</h1>
            <p className="text-[10px] md:text-xs text-slate-500 mt-0.5">
              依据 MSWM11-02 第6.9条 | 审核组能力 + 整合程度矩阵 → 减少量
            </p>
          </div>
        </div>
      </header>

      {/* 依据文件信息 */}
      <div className="bg-indigo-50 border-b border-indigo-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-1.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[10px] text-indigo-700">
          <span className="font-medium">依据文件：</span>
          <span>MSWM11-02《管理体系结合审核实施规范》</span>
          <span>MSWM102-2《管理体系审核人天数确定指南》</span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-6">
        {/* 三栏布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左栏：输入 */}
          <div className="lg:col-span-3 space-y-4">
            {/* 体系数量 */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-xs">1</span>
                IMS体系数量
              </h2>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={2}
                  max={6}
                  value={totalSystems}
                  onChange={(e) => setTotalSystems(Math.max(2, Math.min(6, Number(e.target.value))))}
                  className="w-20 px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-600">个体系</span>
              </div>
            </div>

            {/* 审核组构成 */}
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

          {/* 中栏：整合程度 + 矩阵 */}
          <div className="lg:col-span-5 space-y-4">
            {/* 整合程度输入 */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-xs">4</span>
                管理体系整合程度
              </h2>
              
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={integrationPercent}
                  onChange={(e) => setIntegrationPercent(Number(e.target.value))}
                  className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={integrationPercent}
                    onChange={(e) => setIntegrationPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                    className="w-16 px-2 py-1 text-sm border border-slate-200 rounded text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-600">%</span>
                </div>
              </div>

              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-3 ${
                integrationInfo.level === 'high' ? 'bg-green-100 text-green-700' :
                integrationInfo.level === 'medium' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  integrationInfo.level === 'high' ? 'bg-green-500' :
                  integrationInfo.level === 'medium' ? 'bg-amber-500' :
                  'bg-red-500'
                }`} />
                整合程度：{integrationInfo.label}（{integrationPercent}%）
              </div>

              {/* 整合程度特征描述 */}
              <div className="space-y-2">
                {(['low', 'medium', 'high'] as const).map(level => {
                  const rangeMap = { low: '0%-40%', medium: '40%-80%', high: '80%-100%' };
                  const labelMap = { low: '低', medium: '中', high: '高' };
                  const isActive = integrationInfo.level === level;
                  return (
                    <div
                      key={level}
                      className={`p-2.5 rounded-lg border transition ${
                        isActive ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <p className={`text-xs font-medium mb-1 ${isActive ? 'text-indigo-700' : 'text-slate-600'}`}>
                        整合程度{labelMap[level]}（{rangeMap[level]}）
                      </p>
                      <ul className="space-y-0.5">
                        {INTEGRATION_DESC[level].slice(0, 2).map((desc, i) => (
                          <li key={i} className={`text-xs ${isActive ? 'text-indigo-600' : 'text-slate-500'}`}>
                            {isActive ? '✓' : '•'} {desc}
                          </li>
                        ))}
                        {INTEGRATION_DESC[level].length > 2 && (
                          <li className={`text-xs ${isActive ? 'text-indigo-400' : 'text-slate-400'}`}>
                            ...等{INTEGRATION_DESC[level].length}项特征
                          </li>
                        )}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 图1矩阵 - 完整5x5 */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-xs font-bold text-slate-600 mb-3">图1：结合审核时间减少量矩阵（MSWM11-02）</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr>
                      <th className="px-1 py-1.5 text-left text-slate-500 border border-slate-200 bg-slate-50" rowSpan={2}>
                        整合程度 ↓ \ 能力 →
                      </th>
                      <th className="px-1 py-1 text-center text-slate-600 border border-slate-200 bg-slate-50" colSpan={5}>
                        审核组结合审核能力程度（%）
                      </th>
                    </tr>
                    <tr className="bg-slate-50">
                      {['0-20', '20-40', '40-60', '60-80', '80-100'].map((label, i) => (
                        <th key={i} className={`px-1 py-1 text-center border border-slate-200 text-xs ${
                          i === currentCol ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-slate-600'
                        }`}>
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[4, 3, 2, 1, 0].map(rowIdx => {
                      const rangeLabels = ['0-20', '20-40', '40-60', '60-80', '80-100'];
                      const isCurrentRow = rowIdx === currentRow;
                      return (
                        <tr key={rowIdx}>
                          <td className={`px-1 py-1.5 font-medium border border-slate-200 text-xs whitespace-nowrap ${
                            isCurrentRow ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-slate-600 bg-slate-50'
                          }`}>
                            {rangeLabels[rowIdx]}%
                          </td>
                          {matrixData[rowIdx].map((val, colIdx) => {
                            const isCurrentCell = isCurrentRow && colIdx === currentCol;
                            return (
                              <td
                                key={colIdx}
                                className={`px-1 py-1.5 text-center border border-slate-200 font-mono ${
                                  isCurrentCell
                                    ? 'bg-indigo-500 text-white font-bold text-sm'
                                    : val === 0
                                    ? 'text-slate-400'
                                    : val >= 15
                                    ? 'text-red-600 font-semibold'
                                    : val >= 10
                                    ? 'text-amber-600 font-medium'
                                    : 'text-slate-600'
                                }`}
                              >
                                {val}%
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                纵轴：整合程度（%）| 横轴：审核组能力程度（%）| 
                <span className="text-indigo-600 font-medium"> 高亮格 = 当前查表位置</span>
              </p>
            </div>
          </div>

          {/* 右栏：计算结果 */}
          <div className="lg:col-span-4 space-y-4">
            {/* 审核组能力计算 */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-sm font-bold text-slate-700 mb-3">审核组能力程度计算</h2>
              
              <div className="bg-slate-50 rounded-lg p-3 mb-3">
                <p className="text-xs text-slate-600 mb-1">计算公式（MSWM11-02 第6.9.2条）：</p>
                <p className="text-xs font-mono text-slate-700">
                  [(X₁-1) + (X₂-1) + ... + (Xₙ-1)] / [Z × (Y-1)] × 100%
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  X=审核员体系资格数, Y=体系标准数, Z=审核员数
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">分子计算：</span>
                  <span className="font-mono text-slate-800 text-xs">
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
                  <span className="text-sm text-indigo-100">整合程度</span>
                  <span className="text-sm font-bold">{integrationPercent}%（{integrationInfo.label}）</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-indigo-100">审核组能力程度</span>
                  <span className="text-sm font-bold">{capability.percent.toFixed(1)}%</span>
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
                <li>• IMS减少量最大不超过Ti的20%</li>
                <li>• 减少量是基于起始时间Ti的百分比</li>
                <li>• 最终结果应精确至小数点后1位（四舍五入至0.5）</li>
                <li>• 审核组能力需在审核组成员确定后计算</li>
                <li>• 结合审核人天数可能突破单一体系最低要求</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
