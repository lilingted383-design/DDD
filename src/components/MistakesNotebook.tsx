import React, { useState } from 'react';
import {
  BookX,
  CheckCircle2,
  Trash2,
  Play,
  RotateCcw,
  Sparkles,
  Search,
  Filter,
  Check,
  Tag,
  AlertCircle,
  Lightbulb,
  FileQuestion,
  Volume2,
} from 'lucide-react';
import { MistakeItem, SubjectId, GradeLevel, Question } from '../types/quiz';
import { SUBJECTS } from '../data/curriculumData';
import { speakText } from '../utils/speech';

interface MistakesNotebookProps {
  mistakes: MistakeItem[];
  onUpdateMistake: (mistake: MistakeItem) => void;
  onRemoveMistake: (id: string) => void;
  onClearAll: () => void;
  onStartMistakesQuiz: (questions: Question[]) => void;
}

export const MistakesNotebook: React.FC<MistakesNotebookProps> = ({
  mistakes,
  onUpdateMistake,
  onRemoveMistake,
  onClearAll,
  onStartMistakesQuiz,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<SubjectId | 'all'>('all');
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'unmastered' | 'all' | 'mastered'>('unmastered');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered mistakes
  const filteredMistakes = mistakes.filter((m) => {
    if (selectedSubject !== 'all' && m.question.subject !== selectedSubject) return false;
    if (selectedGrade !== 'all' && m.question.grade !== selectedGrade) return false;
    if (statusFilter === 'unmastered' && m.mastered) return false;
    if (statusFilter === 'mastered' && !m.mastered) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.question.content.toLowerCase().includes(q) ||
        (m.notes && m.notes.toLowerCase().includes(q)) ||
        m.question.knowledgePoint.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const unmasteredCount = mistakes.filter((m) => !m.mastered).length;

  const handleLaunchTraining = () => {
    const questionsToPractice = filteredMistakes.map((m) => m.question);
    if (questionsToPractice.length === 0) return;
    onStartMistakesQuiz(questionsToPractice);
  };

  const handleToggleMastered = (item: MistakeItem) => {
    onUpdateMistake({
      ...item,
      mastered: !item.mastered,
    });
  };

  const handleCategoryChange = (
    item: MistakeItem,
    tagCategory: 'careless' | 'concept' | 'calculation' | 'reading'
  ) => {
    onUpdateMistake({
      ...item,
      tagCategory,
    });
  };

  const handleNoteChange = (item: MistakeItem, notes: string) => {
    onUpdateMistake({
      ...item,
      notes,
    });
  };

  const tagLabels: Record<string, { label: string; color: string }> = {
    careless: { label: '粗心看錯', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    concept: { label: '觀念不熟', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    calculation: { label: '計算錯誤', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    reading: { label: '題意未明', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-orange-500 text-white rounded-3xl p-6 sm:p-8 shadow-lg shadow-rose-200/50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookX className="w-7 h-7 text-amber-300" />
            <h2 className="text-xl sm:text-2xl font-black">國小專屬 ‧ 個人錯題訂正本</h2>
          </div>
          <p className="text-xs sm:text-sm text-rose-100">
            「把做錯的題目弄懂，比做十題新題目更有價值！」自動收錄測驗錯誤題目，反覆消滅盲點。
          </p>
        </div>

        {/* Start practice button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleLaunchTraining}
            disabled={filteredMistakes.length === 0}
            className="px-6 py-3 rounded-2xl bg-white text-rose-600 hover:bg-rose-50 font-black text-sm shadow-md flex items-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>消滅錯題特訓 ({filteredMistakes.length} 題)</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setStatusFilter('unmastered')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'unmastered'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>待訂正練習</span>
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                {unmasteredCount}
              </span>
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              全部錯題 ({mistakes.length})
            </button>
            <button
              onClick={() => setStatusFilter('mastered')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                statusFilter === 'mastered'
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              已完全熟練 ({mistakes.length - unmasteredCount})
            </button>
          </div>

          {/* Clear all */}
          {mistakes.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('確定要清空所有的錯題本紀錄嗎？')) {
                  onClearAll();
                }
              }}
              className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>清空錯題本</span>
            </button>
          )}
        </div>

        {/* Filters and search input */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Search query */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋題目關鍵字、筆記或觀念..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Subject selector */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">全部科目 (不限)</option>
            {SUBJECTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Grade selector */}
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value === 'all' ? 'all' : (Number(e.target.value) as GradeLevel))}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">全年級 (不限)</option>
            {[1, 2, 3, 4, 5, 6].map((g) => (
              <option key={g} value={g}>
                國小 {g} 年級
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mistake Items List */}
      {filteredMistakes.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="font-black text-slate-800 text-lg">目前沒有符合的錯題！</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            太棒了！只要在線上測驗中答錯或點擊收藏書籤，題目就會自動收錄在這裡隨時複習。
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMistakes.map((item, idx) => {
            const subjectObj = SUBJECTS.find((s) => s.id === item.question.subject);
            return (
              <div
                key={item.id}
                className={`bg-white rounded-3xl p-6 shadow-sm border transition ${
                  item.mastered ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'
                }`}
              >
                {/* Header tags */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg">
                      {item.question.grade}年級 {subjectObj?.name}
                    </span>
                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">
                      {item.question.publisher}
                    </span>
                    {item.mastered && (
                      <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" /> 已熟練
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Speech */}
                    <button
                      onClick={() =>
                        speakText(
                          item.question.content,
                          item.question.subject === 'english' ? 'en-US' : 'zh-TW'
                        )
                      }
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition cursor-pointer"
                      title="朗讀題目"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    {/* Delete item */}
                    <button
                      onClick={() => onRemoveMistake(item.id)}
                      className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                      title="自錯題本移除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Content */}
                <div className="space-y-3">
                  {item.question.readingPassage && (
                    <div className="p-3 bg-slate-50 rounded-xl text-xs font-serif text-slate-700 leading-relaxed border border-slate-200">
                      {item.question.readingPassage}
                    </div>
                  )}

                  <p className="text-base font-bold text-slate-900 leading-relaxed">
                    {item.question.content}
                  </p>

                  {/* Options */}
                  {item.question.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {item.question.options.map((opt, optIdx) => {
                        const isCorrect = Number(item.question.correctAnswer) === optIdx;
                        const isUserPrev = Number(item.lastAnswer) === optIdx;
                        return (
                          <div
                            key={optIdx}
                            className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                              isCorrect
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                                : isUserPrev
                                ? 'bg-rose-50 border-rose-300 text-rose-900 line-through'
                                : 'bg-slate-50/60 border-slate-200 text-slate-600'
                            }`}
                          >
                            <span className="w-5 h-5 rounded-md bg-white border border-slate-200 flex items-center justify-center font-bold text-[10px] shrink-0">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                            {isCorrect && (
                              <span className="text-[10px] text-emerald-700 font-bold ml-auto">
                                正解
                              </span>
                            )}
                            {isUserPrev && !isCorrect && (
                              <span className="text-[10px] text-rose-700 font-bold ml-auto">
                                上次作答
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Standard Explanation */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-1">
                    <div className="font-bold text-indigo-700 flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                      觀念詳解與考點：
                    </div>
                    <p>{item.question.explanation}</p>
                  </div>

                  {/* Mistake classification tags */}
                  <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-400 font-bold text-[11px]">錯誤原因標籤：</span>
                    {(['careless', 'concept', 'calculation', 'reading'] as const).map((cat) => {
                      const isCat = item.tagCategory === cat;
                      const conf = tagLabels[cat];
                      return (
                        <button
                          key={cat}
                          onClick={() => handleCategoryChange(item, cat)}
                          className={`px-2.5 py-1 rounded-lg border font-semibold transition cursor-pointer ${
                            isCat
                              ? `${conf.color} font-bold ring-2 ring-current`
                              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          {conf.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Reflection Note */}
                  <div className="pt-1">
                    <input
                      type="text"
                      defaultValue={item.notes || ''}
                      onBlur={(e) => handleNoteChange(item, e.target.value)}
                      placeholder="✏️ 點此寫下你的訂正心得或提醒小筆記（例如：要看清楚題目是問『最大』不是『最小』）"
                      className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Bottom Action */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <span className="text-[10px] text-slate-400">
                      收錄時間：{new Date(item.addedAt).toLocaleDateString('zh-TW')}
                    </span>

                    <button
                      onClick={() => handleToggleMastered(item)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                        item.mastered
                          ? 'bg-slate-100 text-slate-600 border-slate-200'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-xs'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>{item.mastered ? '重新標記為待訂正' : '標記此題已完全弄懂'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
