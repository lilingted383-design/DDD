import React, { useState } from 'react';
import { Sparkles, X, Loader2, CheckCircle2, AlertCircle, Wand2, BookOpen, Layers } from 'lucide-react';
import { GradeLevel, Semester, SubjectId, PublisherId, Question, QuestionType, Difficulty } from '../types/quiz';
import { SUBJECTS, PUBLISHERS, getCurriculumUnits } from '../data/curriculumData';

interface AISmartGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGrade: GradeLevel;
  currentSemester: Semester;
  currentSubject: SubjectId;
  currentPublisher: PublisherId;
  onQuestionsGenerated: (questions: Question[]) => void;
}

export const AISmartGeneratorModal: React.FC<AISmartGeneratorModalProps> = ({
  isOpen,
  onClose,
  currentGrade,
  currentSemester,
  currentSubject,
  currentPublisher,
  onQuestionsGenerated,
}) => {
  const [grade, setGrade] = useState<GradeLevel>(currentGrade);
  const [semester, setSemester] = useState<Semester>(currentSemester);
  const [subject, setSubject] = useState<SubjectId>(currentSubject);
  const [publisher, setPublisher] = useState<PublisherId>(currentPublisher);
  const [unitTitle, setUnitTitle] = useState('全部單元統整');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [count, setCount] = useState(5);
  const [customTopic, setCustomTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const units = getCurriculumUnits(subject, grade, semester, publisher);

  const presets = [
    { title: '台灣生活情境素養題', desc: '以超商買文具、夜市小吃、捷運高鐵旅程或日常烹飪為題材的生活素養題' },
    { title: '高頻段考易錯陷阱題', desc: '特別針對小朋友容易混淆、粗心未看清題意或逆向思考的常考題型' },
    { title: '多步驟邏輯文字題', desc: '需要先列出第一步算式再算第二步的進階應用題，附詳細步驟詳解' },
    { title: '跨領域閱讀理解題組', desc: '結合台灣動植物生態、文化古蹟或科普實驗的閱讀與判讀題' },
  ];

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade,
          semester,
          subject,
          publisher,
          unitTitle,
          difficulty,
          count,
          customTopic,
          questionTypes: ['choice', 'truefalse', 'fill'],
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || '生成題目失敗，請稍後重試');
      }

      onQuestionsGenerated(data.questions);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || '出題發生錯誤，請確認網路連線');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-indigo-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md shadow-inner">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl font-black flex items-center gap-2">
                AI 國小名師出題引擎
                <span className="text-xs bg-amber-400 text-indigo-950 px-2 py-0.5 rounded-full font-bold">
                  Gemini 3.8 Flash
                </span>
              </h2>
              <p className="text-xs text-indigo-100 mt-1">
                嚴格遵循台灣 108 課綱與康軒/翰林/南一教材指標，客製化生成符合國小認知之素養題庫
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
              <div>
                <p className="font-bold">生成未完成</p>
                <p className="text-xs text-rose-600 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Scope Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">年級</label>
              <select
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value) as GradeLevel)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                {[1, 2, 3, 4, 5, 6].map((g) => (
                  <option key={g} value={g}>
                    國小 {g} 年級
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">學期</label>
              <select
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value) as Semester)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                <option value={1}>上學期</option>
                <option value={2}>下學期</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">科目</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as SubjectId)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                {SUBJECTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">教科書版本</label>
              <select
                value={publisher}
                onChange={(e) => setPublisher(e.target.value as PublisherId)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                {PUBLISHERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Unit selection */}
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1.5">範圍課次 / 單元</label>
            <select
              value={unitTitle}
              onChange={(e) => setUnitTitle(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="全部單元統整綜合複習">全部單元統整綜合複習 (段考模擬)</option>
              {units.map((u) => (
                <option key={u.id} value={u.title}>
                  {u.title} ({u.keyConcepts.join('、')})
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty and Count */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1.5">難易度</label>
              <div className="flex gap-2">
                {[
                  { id: 'easy', name: '基礎奠基' },
                  { id: 'medium', name: '進階挑戰' },
                  { id: 'hard', name: '素養拔尖' },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDifficulty(d.id as Difficulty)}
                    className={`flex-1 py-1.5 text-xs rounded-xl font-bold border transition cursor-pointer ${
                      difficulty === d.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1.5">生成題數</label>
              <div className="flex gap-2">
                {[3, 5, 8, 10].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCount(n)}
                    className={`flex-1 py-1.5 text-xs rounded-xl font-bold border transition cursor-pointer ${
                      count === n
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {n} 題
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1.5 flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-indigo-500" />
              常見素養命題主題快捷套用
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {presets.map((p) => (
                <button
                  key={p.title}
                  type="button"
                  onClick={() => setCustomTopic(p.desc)}
                  className="text-left p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition cursor-pointer text-xs group"
                >
                  <p className="font-bold text-slate-800 group-hover:text-indigo-700 flex items-center justify-between">
                    {p.title}
                    <span className="text-[10px] text-indigo-500 opacity-0 group-hover:opacity-100 transition">套用</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom topic prompt */}
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">自訂題目加強重點或情境描述 (選填)</label>
            <textarea
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="例：多出一些有連續退位減法並結合去文具店找錢的生活應用題；或是台灣地形與水庫相關的社會科題目..."
              rows={2}
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            產生後將自動載入測驗與考卷列印
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-200 transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-bold shadow-lg shadow-indigo-200 hover:from-indigo-700 hover:to-blue-700 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI 老師命題中 ({count}題)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>立即生成 {count} 道題目</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
