'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface Auditor {
  id: string;
  name: string;
  systems: number; // 该审核员具备的体系资格数量
}

// 审核组能力程度计算
// 公式: [(X1-1) + (X2-1) + ... + (Xn-1)] / [Z × (Y-1)] × 100%
// X = 审核员具有的体系资格数量
// Y = IMS涵盖的体系标准数量
// Z = 审核员数量
function calcAuditTeamCapability(auditors: Auditor[], totalSystems: number): number {
  if (auditors.length === 0 || totalSystems <= 1) return 0;
  
  const numerator = auditors.reduce((sum, a) => sum + Math.max(0, a.systems - 1), 0);
  const denominator = auditors.length * (totalSystems - 1);
  
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

// 整合程度等级
type IntegrationLevel = 'low' | 'medium' | 'high';

// 根据矩阵表获取减少量
// 图1矩阵：纵轴=整合程度，横轴=审核组能力
function getReductionPercent(integrationLevel: IntegrationLevel, capabilityPercent: number): number {
  // 矩阵定义（从图1提取）
  const matrix: Record<IntegrationLevel, [number, number, number, number, number]> = {
    // [0-20%, 20-40%, 40-60%, 60-80%, 80-100%]
    'low':    [0,  0,  5,  5,  8],
    'medium': [0,  5,  8, 10, 12],
    'high':   [5,  8, 12, 15, 20],
  };
  
  const row = matrix[integrationLevel];
  if (capabilityPercent < 20) return row[0];
  if (capabilityPercent < 40) return row[1];
  if (capabilityPercent < 60) return row[2];
  if (capabilityPercent < 80) return row[3];
  return row[4];
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
  const [totalSystems, setTotalSystems] = useState(3);
  const [auditors, setAuditors] = useState<Auditor[]>([
    { id: '1', name: '审核员A', systems: 3 },
    { id: '2', name: '审核员B', systems: 2 },
    { id: '3', name: '审核员C', systems: 1 },
  ]);
  const [integrationLevel, setIntegrationLevel] = useState<IntegrationLevel>('medium');
  const [baseAuditTime, setBaseAuditTime] = useState(20); // Ti 起始审核时间

  // 计算审核组能力程度
  const capabilityPercent = useMemo(() => {
    return calcAuditTeamCapability(auditors, totalSystems);
  }, [auditors, totalSystems]);

  // 计算减少量
  const reductionPercent = useMemo(() => {
    return getReductionPercent(integrationLevel, capabilityPercent);
  }, [integrationLevel, capabilityPercent]);

  // 计算最终审核时间
  const finalAuditTime = useMemo(() => {
    return Math.round(baseAuditTime * (1 - reductionPercent / 100) * 10) / 10;
  }, [baseAuditTime, reductionPercent]);

  const addAuditor = () => {
    const newId = String(auditors.length + 1);
    setAuditors([...auditors, { id: newId, name: `审核员${newId}`, systems: 1 }]);
  };

  const removeAuditor = (id: string) => {
    setAuditors(auditors.filter(a => a.id !== id));
  };

  const updateAuditor = (id: string, updates: Partial<Auditor>) => {
    setAuditors(auditors.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-800 text-white px-6 py-3 flex items-center justify-between shadow-md">
        <h1 className="text-lg font-semibold">IMS结合审核人天计算</h1>
        <div className="flex items-center gap-3">
          <Link href="/multi" className="text-sm text-slate-300 hover:text-white">多体系计算 →</Link>
          <Link href="/" className="text-sm text-slate-300 hover:text-white">← 返回首页</Link>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto p-4 grid grid-cols-12 gap-4">
        {/* 左侧：基本参数 + 审核组 */}
        <div className="col-span-5 space-y-4">
          {/* 基本参数 */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-indigo-500 text-white rounded text-xs flex items-center justify-center">1</span>
              基本参数
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-600 block mb-1">结合审核体系数量 (Y)</label>
                <input 
                  type="number" 
                  min={2} 
                  max={5}
                  value={totalSystems} 
                  onChange={e => setTotalSystems(Number(e.target.value))} 
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm" 
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">如Q+E+S=3个体系</span>
              </div>
              <div>
                <label className="text-xs text-slate-600 block mb-1">起始审核时间 Ti (天)</label>
                <input 
                  type="number" 
                  min={1}
                  value={baseAuditTime} 
                  onChange={e => setBaseAuditTime(Number(e.target.value))} 
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm" 
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">各体系单独审核时间之和</span>
              </div>
            </div>
            <div className="mt-3 p-2 bg-slate-50 rounded text-[10px] text-slate-600">
              <span className="font-medium">Ti = T</span><sub>Q</sub> + <span className="font-medium">T</span><sub>E</sub> + <span className="font-medium">T</span><sub>S</sub> + <span className="font-medium">T</span><sub>F</sub> + <span className="font-medium">T</span><sub>H</sub> + <span className="font-medium">T</span><sub>IS</sub> + ...
            </div>
          </div>

          {/* 审核组能力 */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-indigo-500 text-white rounded text-xs flex items-center justify-center">2</span>
              审核组构成
            </h2>
            <div className="space-y-2">
              {auditors.map((auditor, idx) => (
                <div key={auditor.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                  <span className="text-xs text-slate-500 w-5">{idx + 1}.</span>
                  <input 
                    type="text"
                    value={auditor.name}
                    onChange={e => updateAuditor(auditor.id, { name: e.target.value })}
                    className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs"
                    placeholder="审核员姓名"
                  />
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-slate-500">资格数:</label>
                    <select 
                      value={auditor.systems}
                      onChange={e => updateAuditor(auditor.id, { systems: Number(e.target.value) })}
                      className="px-2 py-1 border border-slate-300 rounded text-xs"
                    >
                      {Array.from({ length: totalSystems }, (_, i) => i + 1).map(n => (
                        <option key={n} value={n}>{n}个体系</option>
                      ))}
                    </select>
                  </div>
                  {auditors.length > 1 && (
                    <button onClick={() => removeAuditor(auditor.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                  )}
                </div>
              ))}
              <button onClick={addAuditor} className="w-full py-1.5 border border-dashed border-slate-300 rounded text-xs text-slate-500 hover:bg-slate-50">
                + 添加审核员
              </button>
            </div>

            {/* 能力计算公式 */}
            <div className="mt-3 p-3 bg-indigo-50 rounded">
              <div className="text-xs font-medium text-indigo-700 mb-1">审核组能力程度计算</div>
              <div className="text-[10px] text-slate-600 space-y-1">
                <div>公式: [(X₁-1) + (X₂-1) + ... + (Xₙ-1)] / [Z × (Y-1)] × 100%</div>
                <div className="text-slate-500">
                  其中: X = 各审核员体系资格数, Y = 体系数量({totalSystems}), Z = 审核员数({auditors.length})
                </div>
                <div className="pt-1 border-t border-indigo-200">
                  计算: [{auditors.map(a => `(${a.systems}-1)`).join(' + ')}] / [{auditors.length} × ({totalSystems}-1)] × 100%
                </div>
                <div className="text-sm font-semibold text-indigo-700">
                  = [{auditors.reduce((s, a) => s + (a.systems - 1), 0)}] / [{auditors.length * (totalSystems - 1)}] × 100% = <span className="text-base">{capabilityPercent}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：整合程度 + 结果 */}
        <div className="col-span-7 space-y-4">
          {/* 整合程度 */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-indigo-500 text-white rounded text-xs flex items-center justify-center">3</span>
              管理体系整合程度
            </h2>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {(['low', 'medium', 'high'] as IntegrationLevel[]).map(level => (
                <button
                  key={level}
                  onClick={() => setIntegrationLevel(level)}
                  className={`p-3 rounded border-2 text-left transition-all ${
                    integrationLevel === level 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`text-xs font-medium ${integrationLevel === level ? 'text-indigo-700' : 'text-slate-600'}`}>
                    {INTEGRATION_LABELS[level]}
                  </div>
                </button>
              ))}
            </div>
            {/* 整合程度描述 */}
            <div className="p-2 bg-slate-50 rounded max-h-32 overflow-y-auto">
              <div className="text-[10px] text-slate-500 mb-1">判定依据:</div>
              <ul className="text-[10px] text-slate-600 space-y-0.5">
                {INTEGRATION_DESC[integrationLevel].map((desc, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-indigo-400">•</span>
                    <span>{desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 矩阵表 + 结果 */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-indigo-500 text-white rounded text-xs flex items-center justify-center">4</span>
              结合审核时间减少量矩阵
            </h2>
            
            {/* 矩阵表 */}
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 px-2 py-1.5 text-left font-medium text-slate-600 w-24">整合程度 ↓ \ 能力 →</th>
                    <th className="border border-slate-300 px-2 py-1.5 text-center font-medium text-slate-600">0-20%</th>
                    <th className="border border-slate-300 px-2 py-1.5 text-center font-medium text-slate-600">20-40%</th>
                    <th className="border border-slate-300 px-2 py-1.5 text-center font-medium text-slate-600">40-60%</th>
                    <th className="border border-slate-300 px-2 py-1.5 text-center font-medium text-slate-600">60-80%</th>
                    <th className="border border-slate-300 px-2 py-1.5 text-center font-medium text-slate-600">80-100%</th>
                  </tr>
                </thead>
                <tbody>
                  {(['low', 'medium', 'high'] as IntegrationLevel[]).map((level, rowIdx) => (
                    <tr key={level} className={integrationLevel === level ? 'bg-indigo-50' : ''}>
                      <td className={`border border-slate-300 px-2 py-2 font-medium ${integrationLevel === level ? 'text-indigo-700' : 'text-slate-600'}`}>
                        {INTEGRATION_LABELS[level]}
                      </td>
                      {[0, 20, 40, 60, 80].map((capStart, colIdx) => {
                        const reduction = getReductionPercent(level, capStart);
                        const isCurrentCell = integrationLevel === level && 
                          capabilityPercent >= capStart && 
                          (capStart === 80 || capabilityPercent < capStart + 20);
                        return (
                          <td 
                            key={colIdx} 
                            className={`border border-slate-300 px-2 py-2 text-center ${
                              isCurrentCell 
                                ? 'bg-indigo-500 text-white font-bold' 
                                : reduction > 0 ? 'text-slate-600' : 'text-slate-400'
                            }`}
                          >
                            {reduction > 0 ? `-${reduction}%` : '0%'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 计算结果 */}
            <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
              <div className="text-sm font-semibold text-slate-700 mb-2">最终审核时间计算</div>
              <div className="text-xs text-slate-600 space-y-1.5">
                <div>
                  <span className="text-slate-500">起始时间 Ti =</span>
                  <span className="font-medium ml-1">{baseAuditTime} 天</span>
                </div>
                <div>
                  <span className="text-slate-500">整合程度 =</span>
                  <span className="font-medium ml-1 text-indigo-600">{INTEGRATION_LABELS[integrationLevel]}</span>
                </div>
                <div>
                  <span className="text-slate-500">审核组能力 =</span>
                  <span className="font-medium ml-1 text-indigo-600">{capabilityPercent}%</span>
                </div>
                <div>
                  <span className="text-slate-500">查表减少量 =</span>
                  <span className="font-medium ml-1 text-red-600">-{reductionPercent}%</span>
                </div>
                <div className="pt-2 border-t border-indigo-200">
                  <span className="text-slate-500">最终时间 T = Ti × (100% - 减少量)</span>
                </div>
                <div className="text-base font-bold text-indigo-700">
                  T = {baseAuditTime} × (100% - {reductionPercent}%) = {finalAuditTime} 天
                </div>
              </div>
              <div className="mt-2 text-[10px] text-slate-500">
                注: IMS审核可能导致审核时间增加，但减少情况下不超过起始时间Ti的20%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
