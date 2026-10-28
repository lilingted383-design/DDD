import React, { useState } from 'react';
import {
  Printer,
  Eye,
  EyeOff,
  Settings,
  ArrowLeft,
  FileText,
  CheckCircle2,
  BookOpen,
  School,
  Type,
} from 'lucide-react';
import { Question, QuizFilter } from '../types/quiz';
import { SUBJECTS, PUBLISHERS } from '../data/curriculumData';

interface PrintPaperViewProps {
  questions: Question[];
  filter: QuizFilter;
  onBackToFilter: () => void;
}

export const PrintPaperView: React.FC<PrintPaperViewProps> = ({
  questions,
  filter,
  onBackToFilter,
}) => {
  const [showAnswers, setShowAnswers] = useState(false);
  const [schoolName, setSchoolName] = useState('小學星示範國民小學');
  const [paperTitle, setPaperTitle] = useState('第一次定期評量試卷');
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');

  const subjectName = SUBJECTS.find((s) => s.id === filter.subject)?.name || '科目';
  const publisherName = PUBLISHERS.find((p) => p.id === filter.publisher)?.name || '版本';

  // Group questions by type
  const trueFalseQuestions = questions.filter((q) => q.type === 'truefalse');
  const choiceQuestions = questions.filter((q) => q.type === 'choice');
  const fillQuestions = questions.filter((q) => q.type === 'fill');
  const readingQuestions = questions.filter((q) => q.type === 'reading');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Print Controls Bar (hidden during printing) */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 print:hidden flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToFilter}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回篩選設定</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-slate-800">試卷產生與列印預覽</span>
            <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full">
              共 {questions.length} 題
            </span>
          </div>
        </div>

        {/* Paper customizers */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Toggle Answer Key */}
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer border ${
              showAnswers
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {showAnswers ? <Eye className="w-4 h-4 text-amber-600" /> : <EyeOff className="w-4 h-4 text-slate-500" />}
            <span>{showAnswers ? '顯示教師答案卷' : '學生空白試卷'}</span>
          </button>

          {/* Font Size Toggle */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setFontSize('normal')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                fontSize === 'normal' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              標準字體
            </button>
            <button
              onClick={() => setFontSize('large')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                fontSize === 'large' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              低年級大字
            </button>
          </div>

          {/* Print button */}
          <button
            onClick={handlePrint}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-black flex items-center gap-1.5 shadow-md shadow-indigo-200 transition cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>列印試卷 / 存為 PDF</span>
          </button>
        </div>
      </div>

      {/* School Name & Exam Title quick editors (hidden during printing) */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 print:hidden grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label className="font-bold text-slate-600 block mb-1">自訂學校名稱</label>
          <input
            type="text"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 font-semibold"
          />
        </div>
        <div>
          <label className="font-bold text-slate-600 block mb-1">評量名稱 / 考卷名稱</label>
          <input
            type="text"
            value={paperTitle}
            onChange={(e) => setPaperTitle(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 font-semibold"
          />
        </div>
      </div>

      {/* Real Printable Paper Sheet (Authentic Taiwanese Elementary Layout) */}
      <div
        className={`bg-white rounded-3xl p-8 sm:p-12 shadow-md border border-slate-300 print:border-none print:shadow-none print:p-0 print:m-0 space-y-6 text-slate-900 ${
          fontSize === 'large' ? 'text-base' : 'text-sm'
        }`}
      >
        {/* Test Paper Header */}
        <div className="text-center border-b-2 border-slate-900 pb-4 space-y-2">
          <h2 className="text-xl sm:text-2xl font-black tracking-wide">
            {schoolName} 114 學年度 第 {filter.semester === 1 ? '一' : '二'} 學期
          </h2>
          <h3 className="text-lg sm:text-xl font-bold tracking-tight">
            國小 {filter.grade} 年級 【{subjectName}】 {paperTitle}
            {showAnswers && (
              <span className="ml-2 text-rose-600 text-sm font-black border border-rose-600 px-2 py-0.5 rounded">
                【教師解答與詳解版】
              </span>
            )}
          </h3>

          <div className="flex flex-wrap items-center justify-between text-xs sm:text-sm font-semibold pt-2 text-slate-700">
            <span>教科書版本：{publisherName}</span>
            <span>評量範圍：{filter.selectedUnits.length === 0 ? '全冊核心單元綜合' : '指定單元'}</span>
            <span>總題數：{questions.length} 題</span>
          </div>
        </div>

        {/* Student Identification & Score Box Table */}
        <div className="grid grid-cols-4 sm:grid-cols-6 border-2 border-slate-900 text-xs sm:text-sm font-bold text-center">
          <div className="bg-slate-100 p-2 border-r border-b border-slate-900 flex items-center justify-center">
            年級班級
          </div>
          <div className="p-2 border-r border-b border-slate-900 flex items-center justify-center">
            {filter.grade} 年 ___ 班
          </div>
          <div className="bg-slate-100 p-2 border-r border-b border-slate-900 flex items-center justify-center">
            座號
          </div>
          <div className="p-2 border-r border-b border-slate-900 flex items-center justify-center">
            _____ 號
          </div>
          <div className="bg-slate-100 p-2 border-r border-b border-slate-900 flex items-center justify-center">
            學生姓名
          </div>
          <div className="p-2 border-b border-slate-900 flex items-center justify-center">
            ___________
          </div>

          <div className="bg-slate-100 p-2 border-r border-slate-900 flex items-center justify-center">
            家長簽名
          </div>
          <div className="p-2 border-r border-slate-900 col-span-3 flex items-center justify-center">
            ___________________
          </div>
          <div className="bg-slate-100 p-2 border-r border-slate-900 flex items-center justify-center text-rose-700 font-black">
            評量得分
          </div>
          <div className="p-2 flex items-center justify-center text-lg font-black text-rose-600">
            {showAnswers ? '100' : ''}
          </div>
        </div>

        {/* --- 大題一：是非題 --- */}
        {trueFalseQuestions.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="font-black text-base border-b border-slate-300 pb-1 flex items-center justify-between">
              <span>一、是非題 (對的打 ○，錯的打 ╳)</span>
              <span className="text-xs font-normal text-slate-500">
                (共 {trueFalseQuestions.length} 題)
              </span>
            </div>
            <div className="space-y-4 pl-2">
              {trueFalseQuestions.map((q, idx) => (
                <div key={q.id} className="space-y-1">
                  <div className="flex items-start gap-2">
                    <span className="font-bold border border-slate-800 rounded px-2 py-0.5 min-w-[36px] text-center shrink-0">
                      ( {showAnswers ? (q.correctAnswer === 'T' ? '○' : '╳') : '  '} )
                    </span>
                    <span className="font-bold">{idx + 1}.</span>
                    <p className="flex-1 leading-relaxed">{q.content}</p>
                  </div>
                  {showAnswers && (
                    <div className="ml-12 text-xs text-indigo-800 bg-indigo-50/60 p-2 rounded border border-indigo-200">
                      【解析】：{q.explanation} (觀念：{q.knowledgePoint})
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- 大題二：單選題 --- */}
        {choiceQuestions.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="font-black text-base border-b border-slate-300 pb-1 flex items-center justify-between">
              <span>二、選擇題 (請選出最適當的一個答案)</span>
              <span className="text-xs font-normal text-slate-500">
                (共 {choiceQuestions.length} 題)
              </span>
            </div>
            <div className="space-y-5 pl-2">
              {choiceQuestions.map((q, idx) => (
                <div key={q.id} className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="font-bold border border-slate-800 rounded px-2 py-0.5 min-w-[36px] text-center shrink-0">
                      ( {showAnswers ? String.fromCharCode(65 + Number(q.correctAnswer)) : '  '} )
                    </span>
                    <span className="font-bold">{idx + 1}.</span>
                    <p className="flex-1 font-semibold leading-relaxed">{q.content}</p>
                  </div>

                  {/* Options Layout */}
                  {q.options && (
                    <div className="ml-12 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-slate-800">
                      {q.options.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className={`flex items-start gap-1.5 ${
                            showAnswers && Number(q.correctAnswer) === optIdx
                              ? 'font-black text-rose-700'
                              : ''
                          }`}
                        >
                          <span className="font-bold">({optIdx + 1})</span>
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {showAnswers && (
                    <div className="ml-12 text-xs text-indigo-800 bg-indigo-50/60 p-2 rounded border border-indigo-200">
                      【解析】：{q.explanation} (考點：{q.knowledgePoint})
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- 大題三：填充與計算應用題 --- */}
        {fillQuestions.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="font-black text-base border-b border-slate-300 pb-1 flex items-center justify-between">
              <span>三、填充與計算應用題 (請寫出算式或正確答案)</span>
              <span className="text-xs font-normal text-slate-500">
                (共 {fillQuestions.length} 題)
              </span>
            </div>
            <div className="space-y-6 pl-2">
              {fillQuestions.map((q, idx) => (
                <div key={q.id} className="space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="font-bold">{idx + 1}.</span>
                    <p className="flex-1 font-semibold leading-relaxed">{q.content}</p>
                  </div>

                  {/* Calculation Box Area */}
                  <div className="ml-6 border border-dashed border-slate-400 rounded-xl p-4 min-h-[70px] flex items-end justify-between text-xs text-slate-400">
                    <span>【計算過程與答】</span>
                    <span className="text-sm font-bold text-slate-800">
                      答：{showAnswers ? <span className="text-rose-600 underline font-black">{String(q.correctAnswer)}</span> : '_________________'}
                    </span>
                  </div>

                  {showAnswers && (
                    <div className="ml-6 text-xs text-indigo-800 bg-indigo-50/60 p-2 rounded border border-indigo-200">
                      【解析】：{q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- 大題四：閱讀素養題組 --- */}
        {readingQuestions.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="font-black text-base border-b border-slate-300 pb-1">
              四、素養閱讀與探究題組
            </div>
            <div className="space-y-4 pl-2">
              {readingQuestions.map((q, idx) => (
                <div key={q.id} className="space-y-3">
                  {q.readingPassage && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 font-serif leading-relaxed text-sm whitespace-pre-line">
                      {q.readingPassage}
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <span className="font-bold border border-slate-800 rounded px-2 py-0.5 min-w-[36px] text-center shrink-0">
                      ( {showAnswers ? String.fromCharCode(65 + Number(q.correctAnswer)) : '  '} )
                    </span>
                    <span className="font-bold">{idx + 1}.</span>
                    <p className="flex-1 font-semibold leading-relaxed">{q.content}</p>
                  </div>
                  {q.options && (
                    <div className="ml-12 grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-800">
                      {q.options.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className={`flex items-start gap-1.5 ${
                            showAnswers && Number(q.correctAnswer) === optIdx ? 'font-black text-rose-700' : ''
                          }`}
                        >
                          <span className="font-bold">({optIdx + 1})</span>
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {showAnswers && (
                    <div className="ml-12 text-xs text-indigo-800 bg-indigo-50/60 p-2 rounded border border-indigo-200">
                      【解析】：{q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Paper Footer Note */}
        <div className="text-center text-xs text-slate-500 pt-8 border-t border-slate-200">
          ── 本試卷試題結束，請務必仔細檢查驗算！ ──
        </div>
      </div>
    </div>
  );
};
