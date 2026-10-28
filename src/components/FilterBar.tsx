import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Calculator,
  Atom,
  Compass,
  Languages,
  Filter,
  Check,
  ChevronDown,
  Layers,
  Sparkles,
  Shuffle,
  Printer,
  Settings2,
  Calendar,
} from 'lucide-react';
import {
  GradeLevel,
  Semester,
  SubjectId,
  PublisherId,
  QuizFilter,
  Difficulty,
  QuestionType,
} from '../types/quiz';
import { SUBJECTS, PUBLISHERS, getCurriculumUnits } from '../data/curriculumData';

interface FilterBarProps {
  filter: QuizFilter;
  onChangeFilter: (newFilter: QuizFilter) => void;
  onStartQuiz: () => void;
  onGoToPrint: () => void;
  onOpenAIGenerator: () => void;
  totalAvailableCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  onChangeFilter,
  onStartQuiz,
  onGoToPrint,
  onOpenAIGenerator,
  totalAvailableCount,
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Get available subjects for selected grade
  const availableSubjects = useMemo(() => {
    return SUBJECTS.filter((s) => s.availableGrades.includes(filter.grade));
  }, [filter.grade]);

  // Current units for selected grade, semester, subject, publisher
  const units = useMemo(() => {
    return getCurriculumUnits(filter.subject, filter.grade, filter.semester, filter.publisher);
  }, [filter.subject, filter.grade, filter.semester, filter.publisher]);

  const handleGradeChange = (grade: GradeLevel) => {
    // If current subject is not available for new grade, fallback to math or chinese
    let newSubject = filter.subject;
    const isAvail = SUBJECTS.find((s) => s.id === newSubject)?.availableGrades.includes(grade);
    if (!isAvail) {
      newSubject = 'math';
    }
    onChangeFilter({
      ...filter,
      grade,
      subject: newSubject,
      selectedUnits: [], // reset selected units
    });
  };

  const handleSemesterChange = (semester: Semester) => {
    onChangeFilter({ ...filter, semester, selectedUnits: [] });
  };

  const handleSubjectChange = (subject: SubjectId) => {
    onChangeFilter({ ...filter, subject, selectedUnits: [] });
  };

  const handlePublisherChange = (publisher: PublisherId) => {
    onChangeFilter({ ...filter, publisher, selectedUnits: [] });
  };

  const handleExamStageFilter = (stage: 1 | 2 | 3 | 'all') => {
    if (stage === 'all') {
      onChangeFilter({ ...filter, selectedUnits: [] });
    } else {
      const stageUnits = units.filter((u) => u.examStage === stage).map((u) => u.id);
      onChangeFilter({ ...filter, selectedUnits: stageUnits });
    }
  };

  const toggleUnit = (unitId: string) => {
    const isSelected = filter.selectedUnits.includes(unitId);
    let nextUnits: string[];
    if (isSelected) {
      nextUnits = filter.selectedUnits.filter((id) => id !== unitId);
    } else {
      nextUnits = [...filter.selectedUnits, unitId];
    }
    onChangeFilter({ ...filter, selectedUnits: nextUnits });
  };

  const toggleQuestionType = (type: QuestionType) => {
    const isSelected = filter.questionTypes.includes(type);
    let nextTypes: QuestionType[];
    if (isSelected) {
      if (filter.questionTypes.length === 1) return; // Keep at least one
      nextTypes = filter.questionTypes.filter((t) => t !== type);
    } else {
      nextTypes = [...filter.questionTypes, type];
    }
    onChangeFilter({ ...filter, questionTypes: nextTypes });
  };

  const renderSubjectIcon = (id: SubjectId) => {
    switch (id) {
      case 'chinese':
        return <BookOpen className="w-4 h-4" />;
      case 'math':
        return <Calculator className="w-4 h-4" />;
      case 'science':
        return <Atom className="w-4 h-4" />;
      case 'social':
        return <Compass className="w-4 h-4" />;
      case 'english':
        return <Languages className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-6">
      {/* 1. Grade & Semester Row */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
            1. 選擇年級與學期
          </span>
          {/* Semester toggle */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => handleSemesterChange(1)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                filter.semester === 1
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              上學期
            </button>
            <button
              onClick={() => handleSemesterChange(2)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                filter.semester === 2
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              下學期
            </button>
          </div>
        </div>

        {/* Grade Buttons */}
        <div className="grid grid-cols-6 gap-2">
          {([1, 2, 3, 4, 5, 6] as GradeLevel[]).map((g) => {
            const isSelected = filter.grade === g;
            return (
              <button
                key={g}
                onClick={() => handleGradeChange(g)}
                className={`py-2.5 sm:py-3 rounded-2xl flex flex-col items-center justify-center font-black transition cursor-pointer relative ${
                  isSelected
                    ? 'bg-gradient-to-b from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-200 ring-2 ring-indigo-400 ring-offset-2'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <span className="text-xs sm:text-sm">小{['一', '二', '三', '四', '五', '六'][g - 1]}</span>
                <span className={`text-[10px] mt-0.5 font-semibold ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {g}年級
                </span>
                {isSelected && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-indigo-950 rounded-full flex items-center justify-center text-[10px] font-black">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Subjects Row */}
      <div className="space-y-2">
        <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
          2. 選擇科目
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {availableSubjects.map((sub) => {
            const isSelected = filter.subject === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => handleSubjectChange(sub.id)}
                className={`p-3 rounded-2xl flex items-center gap-2.5 font-bold text-sm transition cursor-pointer text-left border ${
                  isSelected
                    ? `${sub.bgLight} ${sub.color} ${sub.borderColor} ring-2 ring-offset-1 ring-current shadow-xs`
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-white shadow-xs' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {renderSubjectIcon(sub.id)}
                </div>
                <div className="truncate">
                  <div className="leading-tight">{sub.name}</div>
                  <div className="text-[10px] text-slate-400 font-normal truncate mt-0.5">
                    {sub.id === 'chinese' ? '注音/成語/閱讀' : sub.id === 'math' ? '數量幾何應用' : sub.name}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Publisher Versions */}
      <div className="space-y-2">
        <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
          3. 選擇教科書版本
        </span>
        <div className="grid grid-cols-3 gap-3">
          {PUBLISHERS.map((pub) => {
            const isSelected = filter.publisher === pub.id;
            return (
              <button
                key={pub.id}
                onClick={() => handlePublisherChange(pub.id)}
                className={`py-3 px-4 rounded-2xl flex items-center justify-between font-black text-sm transition cursor-pointer border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-300'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-amber-400' : 'bg-slate-300'}`} />
                  <span>{pub.name}</span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {pub.shortName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Units & Exam Scope Selection */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              段考考期與單元課次
            </span>
            <span className="text-[11px] text-slate-400">
              ({filter.selectedUnits.length === 0 ? '全部單元綜合' : `已指定 ${filter.selectedUnits.length} 個單元`})
            </span>
          </div>

          {/* Quick exam stage filters */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => handleExamStageFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                filter.selectedUnits.length === 0 ? 'bg-indigo-600 text-white font-bold' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              全部單元
            </button>
            <button
              onClick={() => handleExamStageFilter(1)}
              className="px-2.5 py-1 rounded-lg font-semibold bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 transition cursor-pointer"
            >
              第一次段考範圍
            </button>
            <button
              onClick={() => handleExamStageFilter(2)}
              className="px-2.5 py-1 rounded-lg font-semibold bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 transition cursor-pointer"
            >
              第二次段考/期末
            </button>
          </div>
        </div>

        {/* Unit chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {units.map((unit) => {
            const isChecked = filter.selectedUnits.length === 0 || filter.selectedUnits.includes(unit.id);
            const isStrictlySelected = filter.selectedUnits.includes(unit.id);
            return (
              <button
                key={unit.id}
                onClick={() => toggleUnit(unit.id)}
                className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer flex items-start gap-2.5 ${
                  isStrictlySelected
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                    : filter.selectedUnits.length === 0
                    ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    : 'bg-white/60 border-slate-200 text-slate-400 opacity-70 hover:opacity-100'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                    isStrictlySelected
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {isStrictlySelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div className="flex-1">
                  <div className="font-bold">{unit.title}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                    重點：{unit.keyConcepts.join('、')}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Additional Quiz Settings Toggle */}
      <div>
        <button
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 transition cursor-pointer"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>進階題型與題數設定</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
        </button>

        {isAdvancedOpen && (
          <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs animate-in fade-in duration-150">
            {/* Question Types */}
            <div>
              <span className="font-bold text-slate-700 block mb-2">題型包含 (可多選)</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'choice', name: '單選題' },
                  { id: 'truefalse', name: '是非題' },
                  { id: 'fill', name: '計算/填空' },
                  { id: 'reading', name: '素養閱讀' },
                ].map((t) => {
                  const active = filter.questionTypes.includes(t.id as QuestionType);
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggleQuestionType(t.id as QuestionType)}
                      className={`p-1.5 rounded-lg font-semibold border transition cursor-pointer ${
                        active
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <span className="font-bold text-slate-700 block mb-2">難易度</span>
              <div className="flex gap-1.5">
                {[
                  { id: 'all', name: '全部' },
                  { id: 'easy', name: '基礎' },
                  { id: 'medium', name: '進階' },
                  { id: 'hard', name: '素養' },
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => onChangeFilter({ ...filter, difficulty: d.id as any })}
                    className={`flex-1 py-1.5 rounded-lg font-semibold border transition cursor-pointer ${
                      filter.difficulty === d.id
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Count and Mode */}
            <div>
              <span className="font-bold text-slate-700 block mb-2">練習題數與作答模式</span>
              <div className="flex gap-1.5 mb-2">
                {[5, 10, 15, 20].map((n) => (
                  <button
                    key={n}
                    onClick={() => onChangeFilter({ ...filter, questionCount: n })}
                    className={`flex-1 py-1 rounded-lg font-semibold border transition cursor-pointer ${
                      filter.questionCount === n
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {n} 題
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => onChangeFilter({ ...filter, mode: 'instant' })}
                  className={`flex-1 py-1 rounded-lg font-semibold border transition cursor-pointer ${
                    filter.mode === 'instant'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  即時對答案
                </button>
                <button
                  onClick={() => onChangeFilter({ ...filter, mode: 'exam' })}
                  className={`flex-1 py-1 rounded-lg font-semibold border transition cursor-pointer ${
                    filter.mode === 'exam'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  模擬段考評分
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 6. Primary Action Buttons */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span>現成精選題庫：</span>
          <span className="font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full">
            {totalAvailableCount} 題符合條件
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenAIGenerator}
            className="px-4 py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>AI 命題補充新題</span>
          </button>

          <button
            onClick={onGoToPrint}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>產出考卷與解答</span>
          </button>

          <button
            onClick={onStartQuiz}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-700 text-white font-black text-sm shadow-lg shadow-indigo-200 flex items-center gap-2 transition cursor-pointer active:scale-95"
          >
            <BookOpen className="w-4 h-4 text-yellow-300" />
            <span>開始線上練習 ({filter.questionCount} 題)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
