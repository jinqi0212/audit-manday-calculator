import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-800 text-white py-4 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <h1 className="text-xl md:text-2xl font-bold">管理体系认证审核人天计算工具</h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1">MSWM11-02 / MSWM102-2 审核人天数确定指南</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* 单体系计算 */}
          <Link href="/single" className="group">
            <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 p-6 border-2 border-transparent hover:border-indigo-500 h-full">
              <div className="flex items-center justify-center w-14 h-14 bg-indigo-100 rounded-xl mb-4 group-hover:bg-indigo-500 transition-colors">
                <svg className="w-7 h-7 text-indigo-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">单体系计算</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                单一管理体系审核人天计算，支持 QMS、EMS、OHSMS、EnMS。
              </p>
              <div className="mt-4 flex items-center text-indigo-600 font-medium text-sm">
                <span>开始计算</span>
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </Link>

          {/* 多体系计算 */}
          <Link href="/multi" className="group">
            <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 p-6 border-2 border-transparent hover:border-emerald-500 h-full">
              <div className="flex items-center justify-center w-14 h-14 bg-emerald-100 rounded-xl mb-4 group-hover:bg-emerald-500 transition-colors">
                <svg className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">多体系计算</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                多体系联合审核，同时显示初审/监督/再认证人天，支持差异化调整。
              </p>
              <div className="mt-4 flex items-center text-emerald-600 font-medium text-sm">
                <span>开始计算</span>
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </Link>

          {/* IMS结合审核 */}
          <Link href="/ims" className="group">
            <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 p-6 border-2 border-transparent hover:border-purple-500 h-full">
              <div className="flex items-center justify-center w-14 h-14 bg-purple-100 rounded-xl mb-4 group-hover:bg-purple-500 transition-colors">
                <svg className="w-7 h-7 text-purple-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">IMS结合审核</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                计算整合程度与审核组能力，查矩阵表得出结合审核减少量。
              </p>
              <div className="mt-4 flex items-center text-purple-600 font-medium text-sm">
                <span>开始计算</span>
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* 功能说明 */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold text-slate-800 mb-6 text-center">工具功能</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h4 className="font-medium text-slate-800">专业代码查询</h4>
              <p className="text-sm text-slate-500 mt-1">611条三级代码，支持代码/描述反查</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="font-medium text-slate-800">人天计算</h4>
              <p className="text-sm text-slate-500 mt-1">依据最新指南，精确查表计算</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 className="font-medium text-slate-800">审核组能力</h4>
              <p className="text-sm text-slate-500 mt-1">评估审核组能力覆盖情况</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
