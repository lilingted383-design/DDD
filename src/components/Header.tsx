import React from 'react';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Printer,
  BookX,
  Edit3,
  Award,
  Layers,
} from 'lucide-react';

interface HeaderProps {
  currentTab: 'quiz' | 'print' | 'mistakes';
  setCurrentTab: (tab: 'quiz' | 'print' | 'mistakes') => void;
  onOpenAIGenerator: () => void;
  onOpenScratchpad: () => void;
  mistakesCount: number;
  totalAnsweredCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  onOpenAIGenerator,
  onOpenScratchpad,
  mistakesCount,
  totalAnsweredCount,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-400 to-amber-300 flex items-center justify-center shadow-md shadow-amber-200/60 ring-2 ring-white">
              <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-lg sm:text-xl text-slate-900 tracking-tight flex items-center gap-1.5">
                  小學星題庫
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 hidden sm:inline-block">
                    台灣 108 課綱
                  </span>
                </h1>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium hidden sm:block">
                康軒 ‧ 翰林 ‧ 南一各科各版本篩選 ‧ 線上作答 ‧ 考卷列印
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setCurrentTab('quiz')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                currentTab === 'quiz'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>線上測驗</span>
            </button>

            <button
              onClick={() => setCurrentTab('print')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                currentTab === 'print'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>考卷列印 / PDF</span>
            </button>

            <button
              onClick={() => setCurrentTab('mistakes')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer relative ${
                currentTab === 'mistakes'
                  ? 'bg-white text-rose-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <BookX className="w-4 h-4" />
              <span>錯題訂正本</span>
              {mistakesCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 animate-pulse">
                  {mistakesCount > 99 ? '99+' : mistakesCount}
                </span>
              )}
            </button>
          </nav>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenScratchpad}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="開啟數學計算紙"
            >
              <Edit3 className="w-4 h-4 text-indigo-600" />
              <span className="hidden md:inline">計算草稿板</span>
            </button>

            <button
              onClick={onOpenAIGenerator}
              className="px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-orange-200 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-yellow-200 animate-spin" style={{ animationDuration: '4s' }} />
              <span>AI 出題</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
