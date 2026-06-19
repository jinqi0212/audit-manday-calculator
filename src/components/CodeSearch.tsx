'use client';

import { useState, useRef, useEffect } from 'react';
import { CODES_DATABASE, type CodeEntry } from '@/data/codes';

interface CodeSearchProps {
  onSelect: (code: CodeEntry) => void;
  compact?: boolean;
}

export default function CodeSearch({ onSelect, compact = false }: CodeSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CodeEntry[]>([]);
  const [selected, setSelected] = useState<CodeEntry | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase();
    const matches = CODES_DATABASE.filter(c =>
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
    ).slice(0, 20);
    setResults(matches);
    setShowDropdown(matches.length > 0);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: CodeEntry) => {
    setSelected(code);
    setQuery(code.code);
    setShowDropdown(false);
    setResults([]); // 清空推荐列表
    onSelect(code);
  };

  const getRiskColor = (risk: string) => {
    if (risk === '一级') return 'bg-red-100 text-red-700 border-red-200';
    if (risk === '二级') return 'bg-amber-100 text-amber-700 border-amber-200';
    if (risk === '三级') return 'bg-green-100 text-green-700 border-green-200';
    return 'bg-slate-100 text-slate-500 border-slate-200';
  };

  return (
    <div className={compact ? '' : 'bg-white rounded-xl shadow-sm border border-slate-200 p-6'}>
      {!compact && (
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          专业代码查询
        </h2>
      )}

      {/* 搜索输入框 */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder="输入代码(如01.01.01)或关键词搜索..."
          className={`w-full ${compact ? 'px-3 py-2 text-sm' : 'px-4 py-3 text-base'} border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none`}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setSelected(null); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 下拉选项 */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-2 w-full min-w-[280px] max-h-96 bg-white border border-slate-200 rounded-lg shadow-lg overflow-y-auto"
        >
          {results.map((code) => (
            <div
              key={code.code}
              onClick={() => handleSelect(code)}
              className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} hover:bg-indigo-50 cursor-pointer border-b border-slate-100 last:border-b-0`}
            >
              <div className="flex items-center gap-3">
                <span className={`font-mono ${compact ? 'text-xs' : 'text-sm'} font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded`}>
                  {code.code}
                </span>
                <span className={`${compact ? 'text-sm' : 'text-base'} text-slate-800 font-medium`}>{code.name}</span>
              </div>
              {!compact && (
                <div className="text-xs text-slate-500 mt-1">
                  {code.major_name} &gt; {code.medium_name}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 选中结果展示 - 大卡片模式 */}
      {!compact && selected && (
        <div className="mt-6 p-5 bg-gradient-to-br from-slate-50 to-indigo-50 rounded-xl border border-indigo-100">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-lg font-bold text-indigo-700">{selected.code}</span>
                <span className="text-lg font-semibold text-slate-800">{selected.name}</span>
              </div>
              <div className="text-sm text-slate-600 mb-3">
                <span className="font-medium">大类：</span>{selected.major_code} {selected.major_name}
                <span className="mx-2 text-slate-300">|</span>
                <span className="font-medium">中类：</span>{selected.medium_code} {selected.medium_name}
              </div>
              
              {/* 风险等级 */}
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-600">QMS:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(selected.q_risk)}`}>
                    {selected.q_risk || '未评级'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-600">EMS:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(selected.e_risk)}`}>
                    {selected.e_risk || '未评级'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-600">OHSMS:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(selected.s_risk)}`}>
                    {selected.s_risk || '未评级'}
                  </span>
                </div>
              </div>

              {/* 专业描述 */}
              {selected.description && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200">
                  <div className="text-xs font-medium text-slate-500 mb-1">专业描述</div>
                  <div className="text-sm text-slate-700 leading-relaxed">{selected.description}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 紧凑模式 - 选中结果 */}
      {compact && selected && (
        <div className="mt-2 p-2 bg-gradient-to-r from-indigo-50 to-blue-50 rounded border border-indigo-100">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-sm font-bold text-indigo-600 bg-white px-2 py-0.5 rounded border border-indigo-200">{selected.code}</span>
            <span className="text-xs text-slate-600 truncate flex-1">{selected.name}</span>
          </div>
          {/* 风险等级 - 突出显示 */}
          <div className="grid grid-cols-3 gap-1.5">
            <div className="text-center">
              <div className="text-[10px] text-slate-500 mb-0.5">QMS</div>
              <div className={`text-xs font-bold py-1 rounded ${selected.q_risk ? getRiskColor(selected.q_risk) : 'bg-slate-200 text-slate-400'}`}>
                {selected.q_risk || '-'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-slate-500 mb-0.5">EMS</div>
              <div className={`text-xs font-bold py-1 rounded ${selected.e_risk ? getRiskColor(selected.e_risk) : 'bg-slate-200 text-slate-400'}`}>
                {selected.e_risk || '-'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-slate-500 mb-0.5">OHSMS</div>
              <div className={`text-xs font-bold py-1 rounded ${selected.s_risk ? getRiskColor(selected.s_risk) : 'bg-slate-200 text-slate-400'}`}>
                {selected.s_risk || '-'}
              </div>
            </div>
          </div>
          {/* 专业描述 - 折叠显示 */}
          {selected.description && (
            <details className="mt-1.5">
              <summary className="text-[10px] text-indigo-600 cursor-pointer hover:text-indigo-800 font-medium">
                查看专业描述
              </summary>
              <div className="mt-1 p-1.5 bg-white rounded border border-slate-200 max-h-16 overflow-y-auto">
                <div className="text-[10px] text-slate-600 leading-relaxed">{selected.description}</div>
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
