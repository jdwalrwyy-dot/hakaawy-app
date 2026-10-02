import React, { useState } from 'react';
import { Crown, Sparkles, RefreshCw, Smartphone } from 'lucide-react';

/**
 * TestView Component — Standalone Isolated Sandbox View
 * This file is created specifically for testing and designing royal 3D UI components
 * piece-by-piece without altering or deleting any existing application views.
 */
export const TestView: React.FC = () => {
  const [activeComponent, setActiveComponent] = useState<'all' | 'header' | 'hero' | 'buttons' | 'nav'>('all');

  return (
    <div className="w-full max-w-4xl mx-auto min-h-screen p-4 sm:p-6 bg-slate-950 text-slate-100 flex flex-col gap-6" dir="rtl">
      
      {/* Header Info */}
      <div className="w-full p-4 rounded-3xl bg-slate-900 border border-amber-500/40 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center font-black text-xl shadow-md border border-yellow-200">
            👑
          </div>
          <div>
            <h1 className="font-black text-base sm:text-lg text-amber-200">
              شاشة الاختبار والتصميم المستقلة (Test View Sandbox)
            </h1>
            <p className="text-xs text-amber-100/70 font-semibold">
              مساحة اختبار معزولة 100% لتصميم ومعاينة الواجهات الملكية قطعة تلو الأخرى
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>مكونات آمنة</span>
        </span>
      </div>

      {/* Component Selector Tabs */}
      <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto">
        {[
          { id: 'all' as const, label: 'معاينة النموذج كامل' },
          { id: 'header' as const, label: 'الهيدر العلوي' },
          { id: 'hero' as const, label: 'المسرح البانر الرئيسي' },
          { id: 'buttons' as const, label: 'صفوف الأزرار' },
          { id: 'nav' as const, label: 'شريط التنقل السفلي' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveComponent(tab.id)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeComponent === tab.id
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Canvas Area */}
      <div className="w-full flex justify-center py-4">
        <div className="w-full max-w-[380px] min-h-[640px] rounded-[2.5rem] border-4 border-amber-500/60 shadow-[0_0_40px_rgba(217,119,6,0.3)] bg-gradient-to-b from-[#fffbeb] via-[#fef3c7] to-[#fde68a] p-3 flex flex-col justify-between relative overflow-hidden">
          
          <div className="text-center py-2 border-b border-amber-500/30 flex items-center justify-between">
            <span className="text-[10px] font-black text-amber-950 flex items-center gap-1">
              <Smartphone className="w-3 h-3" />
              قالب هاتف 9:16 للمعاينة
            </span>
            <span className="text-[9px] bg-amber-500/20 text-amber-900 px-2 py-0.5 rounded-full font-bold">
              Sandbox
            </span>
          </div>

          <div className="flex-1 my-3 flex flex-col items-center justify-center text-amber-950 gap-3">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-600/40 text-amber-900 flex items-center justify-center font-black text-2xl shadow-inner">
              ✨
            </div>
            <h3 className="font-black text-sm">جاهز لتصميم المكون المختار</h3>
            <p className="text-[11px] text-amber-900/80 max-w-xs text-center leading-relaxed">
              هذه الصفحة مخصصة بالكامل لكتابة وتجربة أفكار المكونات 3D الملكية قبل دمجها.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};
