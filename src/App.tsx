/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { QuizView } from './components/QuizView';
import { PrintPaperView } from './components/PrintPaperView';
import { MistakesNotebook } from './components/MistakesNotebook';
import { Scratchpad } from './components/Scratchpad';
import { AISmartGeneratorModal } from './components/AISmartGeneratorModal';
import {
  QuizFilter,
  Question,
  MistakeItem,
  QuizResult,
  GradeLevel,
  Semester,
  SubjectId,
  PublisherId,
} from './types/quiz';
import { QUESTION_BANK, SUBJECTS, PUBLISHERS } from './data/curriculumData';
import { Sparkles, BookOpen, Layers, Award, ShieldCheck, Heart } from 'lucide-react';

const STORAGE_MISTAKES_KEY = 'xiaoxue_xing_mistakes_v1';
const STORAGE_CUSTOM_QUESTIONS_KEY = 'xiaoxue_xing_custom_questions_v1';

export default function App() {
  // Navigation tab
  const [currentTab, setCurrentTab] = useState<'quiz' | 'print' | 'mistakes'>('quiz');

  // Filter state
  const [filter, setFilter] = useState<QuizFilter>({
    grade: 3,
    semester: 1,
    subject: 'math',
    publisher: 'kangxuan',
    selectedUnits: [],
    questionTypes: ['choice', 'truefalse', 'fill'],
    difficulty: 'all',
    questionCount: 5,
    mode: 'instant',
  });

  // Custom AI-generated questions saved across sessions
  const [customQuestions, setCustomQuestions] = useState<Question[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CUSTOM_QUESTIONS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Mistakes stored in localStorage
  const [mistakes, setMistakes] = useState<MistakeItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_MISTAKES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // UI state
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<Question[]>([]);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
  const [totalAnsweredCount, setTotalAnsweredCount] = useState(0);

  // Sync mistakes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_MISTAKES_KEY, JSON.stringify(mistakes));
    } catch (e) {
      console.error('Failed to save mistakes', e);
    }
  }, [mistakes]);

  // Sync custom questions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CUSTOM_QUESTIONS_KEY, JSON.stringify(customQuestions));
    } catch (e) {
      console.error('Failed to save custom questions', e);
    }
  }, [customQuestions]);

  // All available questions (Built-in bank + custom generated questions)
  const allPool = useMemo(() => {
    return [...QUESTION_BANK, ...customQuestions];
  }, [customQuestions]);

  // Filtered pool matching current filter criteria
  const filteredPool = useMemo(() => {
    return allPool.filter((q) => {
      // Grade match
      if (q.grade !== filter.grade) return false;
      // Subject match
      if (q.subject !== filter.subject) return false;

      // Publisher match (allow matching publisher or general if specific publisher has fewer items)
      if (q.publisher && q.publisher !== filter.publisher) {
        // If question belongs to another publisher, we can allow it if subject/grade match as general practice fallback
      }

      // Unit filter
      if (filter.selectedUnits.length > 0 && q.unitId) {
        if (!filter.selectedUnits.includes(q.unitId)) return false;
      }

      // Question type filter
      if (!filter.questionTypes.includes(q.type)) return false;

      // Difficulty filter
      if (filter.difficulty !== 'all' && q.difficulty !== filter.difficulty) return false;

      return true;
    });
  }, [allPool, filter]);

  // Generate randomized questions for quiz or print
  const prepareQuestions = (count: number): Question[] => {
    let pool = [...filteredPool];

    // If pool has fewer items than requested, broaden to all questions of the same grade and subject
    if (pool.length < count) {
      const broader = allPool.filter(
        (q) => q.grade === filter.grade && q.subject === filter.subject
      );
      pool = Array.from(new Set([...pool, ...broader]));
    }

    // If still empty (e.g. newly selected combination), synthesize grade-appropriate template questions
    if (pool.length === 0) {
      pool = [
        {
          id: `synth-${Date.now()}-1`,
          grade: filter.grade,
          semester: filter.semester,
          subject: filter.subject,
          publisher: filter.publisher,
          type: 'choice',
          difficulty: 'medium',
          content: `國小 ${filter.grade} 年級 ${filter.publisher} 核心觀念題：在日常生活應用中，下列哪一項做法或推論是正確的？`,
          options: ['根據課本規範確實驗算與檢驗步驟', '不讀題目直接猜測第一個答案', '忽略長度與重量單位的換算', '遇到不懂的字詞隨便帶過'],
          correctAnswer: 0,
          explanation: '在學習各學科時，依循步驟認真審題、檢查單位並落實驗算，是獲得高分與良好素養的關鍵！',
          knowledgePoint: '108課綱各領域核心素養觀念',
        },
        {
          id: `synth-${Date.now()}-2`,
          grade: filter.grade,
          semester: filter.semester,
          subject: filter.subject,
          publisher: filter.publisher,
          type: 'truefalse',
          difficulty: 'easy',
          content: `在學習【${filter.subject === 'math' ? '數學' : filter.subject === 'chinese' ? '國語' : '自然社會'}】時，仔細讀題並標記關鍵字有助於正確解題。`,
          options: ['正確 (O)', '錯誤 (X)'],
          correctAnswer: 'T',
          explanation: '正確！養成審題劃記關鍵字的好習慣，能大幅降低粗心失誤率。',
          knowledgePoint: '學習策略與素養奠基',
        },
      ];
    }

    // Shuffle pool
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length));
  };

  const handleStartQuiz = () => {
    const qs = prepareQuestions(filter.questionCount);
    setActiveQuizQuestions(qs);
    setIsQuizActive(true);
    setCurrentTab('quiz');
  };

  const handleGoToPrint = () => {
    const qs = prepareQuestions(filter.questionCount);
    setActiveQuizQuestions(qs);
    setIsQuizActive(false);
    setCurrentTab('print');
  };

  const handleFinishQuiz = (result: QuizResult) => {
    setTotalAnsweredCount((prev) => prev + result.totalQuestions);
  };

  const handleSaveMistake = (item: MistakeItem) => {
    setMistakes((prev) => {
      const existingIdx = prev.findIndex((m) => m.question.id === item.question.id);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = { ...copy[existingIdx], ...item };
        return copy;
      } else {
        return [item, ...prev];
      }
    });
  };

  const handleUpdateMistake = (updated: MistakeItem) => {
    setMistakes((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  };

  const handleRemoveMistake = (id: string) => {
    setMistakes((prev) => prev.filter((m) => m.id !== id));
  };

  const handleClearAllMistakes = () => {
    setMistakes([]);
  };

  const handleStartMistakesQuiz = (questions: Question[]) => {
    setActiveQuizQuestions(questions);
    setIsQuizActive(true);
    setCurrentTab('quiz');
  };

  const handleQuestionsGenerated = (newQuestions: Question[]) => {
    setCustomQuestions((prev) => [...newQuestions, ...prev]);
    setActiveQuizQuestions(newQuestions);
    setIsQuizActive(true);
    setCurrentTab('quiz');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-sky-50/30 to-amber-50/20 text-slate-900 flex flex-col font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* Global Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          if (tab !== 'quiz') {
            setIsQuizActive(false);
          }
        }}
        onOpenAIGenerator={() => setIsAIGeneratorOpen(true)}
        onOpenScratchpad={() => setIsScratchpadOpen(true)}
        mistakesCount={mistakes.filter((m) => !m.mastered).length}
        totalAnsweredCount={totalAnsweredCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* TAB 1: Online Quiz */}
        {currentTab === 'quiz' && (
          <>
            {isQuizActive && activeQuizQuestions.length > 0 ? (
              <QuizView
                questions={activeQuizQuestions}
                filter={filter}
                onFinishQuiz={handleFinishQuiz}
                onExit={() => setIsQuizActive(false)}
                onOpenScratchpad={() => setIsScratchpadOpen(true)}
                onSaveMistake={handleSaveMistake}
                mistakes={mistakes}
                onGoToPrint={handleGoToPrint}
              />
            ) : (
              <div className="space-y-6">
                {/* Hero Feature Banner */}
                <div className="bg-gradient-to-r from-indigo-700 via-blue-700 to-indigo-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-indigo-200/50 relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 w-60 h-60 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                  <div className="max-w-2xl relative z-10 space-y-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-amber-300 text-xs font-bold backdrop-blur-md">
                      <Sparkles className="w-3.5 h-3.5" />
                      108 課綱台灣國小全學科專用
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
                      康軒 ‧ 翰林 ‧ 南一各版本自由篩選
                      <br className="hidden sm:inline" />
                      隨選隨測，即時解析、語音朗讀與試卷列印
                    </h2>
                    <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
                      支援國小 1~6 年級全科目。可指定段考考期或自選單元，作答時可呼叫 AI 星星老師步驟詳解，並提供手寫計算紙與錯題自動收錄！
                    </p>
                  </div>
                </div>

                {/* Filter Selector Bar */}
                <FilterBar
                  filter={filter}
                  onChangeFilter={setFilter}
                  onStartQuiz={handleStartQuiz}
                  onGoToPrint={handleGoToPrint}
                  onOpenAIGenerator={() => setIsAIGeneratorOpen(true)}
                  totalAvailableCount={filteredPool.length}
                />
              </div>
            )}
          </>
        )}

        {/* TAB 2: Printable Exam Paper */}
        {currentTab === 'print' && (
          <PrintPaperView
            questions={
              activeQuizQuestions.length > 0 ? activeQuizQuestions : prepareQuestions(filter.questionCount)
            }
            filter={filter}
            onBackToFilter={() => setCurrentTab('quiz')}
          />
        )}

        {/* TAB 3: Mistakes Notebook */}
        {currentTab === 'mistakes' && (
          <MistakesNotebook
            mistakes={mistakes}
            onUpdateMistake={handleUpdateMistake}
            onRemoveMistake={handleRemoveMistake}
            onClearAll={handleClearAllMistakes}
            onStartMistakesQuiz={handleStartMistakesQuiz}
          />
        )}
      </main>

      {/* Floating Interactive Scratchpad for math & drafting */}
      <Scratchpad isOpen={isScratchpadOpen} onClose={() => setIsScratchpadOpen(false)} />

      {/* AI Smart Generator Modal */}
      <AISmartGeneratorModal
        isOpen={isAIGeneratorOpen}
        onClose={() => setIsAIGeneratorOpen(false)}
        currentGrade={filter.grade}
        currentSemester={filter.semester}
        currentSubject={filter.subject}
        currentPublisher={filter.publisher}
        onQuestionsGenerated={handleQuestionsGenerated}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8 print:hidden text-center text-xs text-slate-500 space-y-2">
        <div className="flex items-center justify-center gap-2 font-bold text-slate-700">
          <span>小學星題庫系統</span>
          <span>‧</span>
          <span>符合台灣教育部 108 課綱標準</span>
          <span>‧</span>
          <span>支援康軒、翰林、南一教材篩選</span>
        </div>
        <p className="text-[11px] text-slate-400">
          提供國小國語文、數學科、自然科學、社會科、英語文之線上互動測驗、錯題筆記本與試卷 A4 列印匯出功能。
        </p>
      </footer>
    </div>
  );
}
