import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Edit3,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Printer,
  Award,
  Clock,
  Check,
  AlertTriangle,
  Lightbulb,
  Loader2,
  Home,
} from 'lucide-react';
import { Question, QuizFilter, QuizResult, UserAnswerRecord, MistakeItem } from '../types/quiz';
import { speakText, stopSpeaking } from '../utils/speech';

interface QuizViewProps {
  questions: Question[];
  filter: QuizFilter;
  onFinishQuiz: (result: QuizResult) => void;
  onExit: () => void;
  onOpenScratchpad: () => void;
  onSaveMistake: (mistake: MistakeItem) => void;
  mistakes: MistakeItem[];
  onGoToPrint: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  questions,
  filter,
  onFinishQuiz,
  onExit,
  onOpenScratchpad,
  onSaveMistake,
  mistakes,
  onGoToPrint,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string | number>>({});
  const [fillInput, setFillInput] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalResult, setFinalResult] = useState<QuizResult | null>(null);

  // AI teacher explanation state
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isAiExplaining, setIsAiExplaining] = useState(false);

  // Timer interval
  useEffect(() => {
    if (isCompleted) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isCompleted]);

  // Clean speech when question changes or unmounts
  useEffect(() => {
    stopSpeaking();
    setIsSpeaking(false);
    setAiExplanation(null);
    setFillInput('');
  }, [currentIndex]);

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  const currentAnswer = userAnswers[currentQ.id];
  const isAnswered = currentAnswer !== undefined;

  // Check correctness of current question
  const checkCorrectness = (q: Question, ans: string | number | undefined): boolean => {
    if (ans === undefined) return false;
    if (q.type === 'choice') {
      return Number(ans) === Number(q.correctAnswer);
    }
    if (q.type === 'truefalse') {
      return String(ans).toUpperCase() === String(q.correctAnswer).toUpperCase();
    }
    if (q.type === 'fill') {
      const cleanUser = String(ans).trim().toLowerCase();
      const cleanTarget = String(q.correctAnswer).trim().toLowerCase();
      return cleanUser === cleanTarget || cleanTarget.includes(cleanUser);
    }
    return false;
  };

  const isCurrentCorrect = checkCorrectness(currentQ, currentAnswer);

  const handleSelectAnswer = (ans: string | number) => {
    if (filter.mode === 'instant' && isAnswered) return; // Locked after answering in instant mode

    const updated = { ...userAnswers, [currentQ.id]: ans };
    setUserAnswers(updated);

    // If answered wrong in instant mode, automatically offer to record in mistakes
    const correct = checkCorrectness(currentQ, ans);
    if (!correct) {
      onSaveMistake({
        id: `m-${currentQ.id}`,
        question: currentQ,
        lastAnswer: ans,
        addedAt: Date.now(),
        mastered: false,
      });
    }
  };

  const handleVoiceRead = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    let fullText = currentQ.content;
    if (currentQ.readingPassage) {
      fullText = `閱讀材料：${currentQ.readingPassage}。題目是：${currentQ.content}`;
    }
    if (currentQ.options && currentQ.type === 'choice') {
      fullText += '。選項：' + currentQ.options.map((opt, i) => `第${i + 1}個選項，${opt}`).join('；');
    }

    const lang = currentQ.subject === 'english' ? 'en-US' : 'zh-TW';
    speakText(fullText, lang, () => {
      setIsSpeaking(false);
    });
  };

  const handleExplainWithAI = async () => {
    setIsAiExplaining(true);
    try {
      const res = await fetch('/api/explain-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQ,
          userAnswer: currentAnswer,
          isCorrect: isCurrentCorrect,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiExplanation(data.explanation);
      } else {
        setAiExplanation('星星老師連線逾時，請參考題目本身的詳細解析喔！');
      }
    } catch (e) {
      setAiExplanation('網路連線稍微不順，請先閱讀下方的標準解析步驟。');
    } finally {
      setIsAiExplaining(false);
    }
  };

  const handleFinishQuiz = () => {
    stopSpeaking();
    let correctCount = 0;
    const records: UserAnswerRecord[] = questions.map((q) => {
      const ans = userAnswers[q.id];
      const isCorrect = checkCorrectness(q, ans);
      if (isCorrect) correctCount++;
      return {
        questionId: q.id,
        question: q,
        userAnswer: ans ?? null,
        isCorrect,
        timeSpentSeconds: Math.floor(timerSeconds / questions.length),
        timestamp: Date.now(),
      };
    });

    const score = Math.round((correctCount / questions.length) * 100);

    const result: QuizResult = {
      id: `quiz-${Date.now()}`,
      title: `${filter.grade}年級${filter.semester === 1 ? '上' : '下'}學期 ${currentQ.publisher} 測驗`,
      grade: filter.grade,
      semester: filter.semester,
      subject: filter.subject,
      publisher: filter.publisher,
      date: new Date().toLocaleDateString('zh-TW'),
      score,
      totalQuestions: questions.length,
      correctCount,
      timeSpentTotal: timerSeconds,
      records,
    };

    setFinalResult(result);
    setIsCompleted(true);
    onFinishQuiz(result);
  };

  const isMistakeSaved = mistakes.some((m) => m.question.id === currentQ.id && !m.mastered);

  const toggleMistake = () => {
    onSaveMistake({
      id: `m-${currentQ.id}`,
      question: currentQ,
      lastAnswer: currentAnswer ?? null,
      addedAt: Date.now(),
      mastered: isMistakeSaved, // toggle
    });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- Render Quiz Completed Result Screen ---
  if (isCompleted && finalResult) {
    const isPerfect = finalResult.score === 100;
    const isPass = finalResult.score >= 60;

    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Score Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-lg border border-slate-200 text-center relative overflow-hidden">
          <div
            className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-30 ${
              isPerfect ? 'bg-amber-400' : isPass ? 'bg-emerald-400' : 'bg-rose-400'
            }`}
          />

          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-50 border-2 border-slate-100 shadow-inner mb-4">
            <Award
              className={`w-10 h-10 ${
                isPerfect ? 'text-amber-500' : isPass ? 'text-emerald-500' : 'text-blue-500'
              }`}
            />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {isPerfect
              ? '🎉 哇！太厲害了，滿分 100 分！'
              : finalResult.score >= 80
              ? '🌟 非常優秀！表現亮眼！'
              : isPass
              ? '👍 順利通過！再接再厲！'
              : '💪 加油！把錯題弄懂就會進步！'}
          </h2>

          {/* Score display */}
          <div className="my-6">
            <div className="text-6xl sm:text-7xl font-black text-slate-900 tracking-tighter inline-flex items-baseline gap-1">
              <span>{finalResult.score}</span>
              <span className="text-xl sm:text-2xl font-bold text-slate-400">分</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              總題數 {finalResult.totalQuestions} 題 ‧ 答對 {finalResult.correctCount} 題 ‧ 答錯{' '}
              {finalResult.totalQuestions - finalResult.correctCount} 題
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center mb-6">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">總耗時</span>
              <span className="text-sm font-black text-slate-800">{formatTime(finalResult.timeSpentTotal)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">正確率</span>
              <span className="text-sm font-black text-indigo-600">
                {Math.round((finalResult.correctCount / finalResult.totalQuestions) * 100)}%
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">平均每題</span>
              <span className="text-sm font-black text-slate-800">
                {Math.round(finalResult.timeSpentTotal / finalResult.totalQuestions)} 秒
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onExit}
              className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>回到篩選首頁</span>
            </button>
            <button
              onClick={() => {
                setIsCompleted(false);
                setCurrentIndex(0);
                setUserAnswers({});
                setTimerSeconds(0);
              }}
              className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-amber-200"
            >
              <RotateCcw className="w-4 h-4" />
              <span>再測驗一次</span>
            </button>
            <button
              onClick={onGoToPrint}
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-indigo-200"
            >
              <Printer className="w-4 h-4" />
              <span>列印本次考卷與解答</span>
            </button>
          </div>
        </div>

        {/* Detailed Question Review List */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
              <span>逐題答題回顧與詳解</span>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                共 {finalResult.records.length} 題
              </span>
            </h3>
          </div>

          <div className="space-y-4">
            {finalResult.records.map((rec, idx) => (
              <div
                key={rec.questionId}
                className={`p-4 sm:p-5 rounded-2xl border transition ${
                  rec.isCorrect ? 'bg-emerald-50/40 border-emerald-200' : 'bg-rose-50/40 border-rose-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                        rec.isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                      }`}
                    >
                      {rec.isCorrect ? '✓' : '✕'}
                    </span>
                    <span className="font-bold text-sm text-slate-800">第 {idx + 1} 題</span>
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded-md text-slate-500 font-semibold border border-slate-200">
                      {rec.question.type === 'choice'
                        ? '單選題'
                        : rec.question.type === 'truefalse'
                        ? '是非題'
                        : rec.question.type === 'fill'
                        ? '填空題'
                        : '素養題'}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold ${rec.isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}
                  >
                    {rec.isCorrect ? '答對 (+100)' : '答錯'}
                  </span>
                </div>

                <p className="text-sm font-semibold text-slate-800 mb-2">{rec.question.content}</p>

                {/* Choices review */}
                {rec.question.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 my-2 text-xs">
                    {rec.question.options.map((opt, optIdx) => {
                      const isUserChoice = Number(rec.userAnswer) === optIdx;
                      const isCorrectChoice = Number(rec.question.correctAnswer) === optIdx;
                      return (
                        <div
                          key={optIdx}
                          className={`p-2 rounded-xl flex items-center gap-2 border ${
                            isCorrectChoice
                              ? 'bg-emerald-100/70 border-emerald-300 font-bold text-emerald-900'
                              : isUserChoice
                              ? 'bg-rose-100/70 border-rose-300 font-bold text-rose-900 line-through'
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          <span className="w-5 h-5 rounded-full bg-white text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 border border-slate-200">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="flex-1">{opt}</span>
                          {isCorrectChoice && <span className="text-[10px] text-emerald-700 font-bold">正解</span>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Explanation */}
                <div className="mt-3 pt-3 border-t border-slate-200/60 text-xs text-slate-600 space-y-1">
                  <div className="font-bold text-indigo-700 flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    觀念詳解：
                  </div>
                  <p className="leading-relaxed bg-white/70 p-2.5 rounded-xl border border-slate-200/80">
                    {rec.question.explanation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- Normal Quiz Taking Interface ---
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Quiz Top Action Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 flex items-center justify-between gap-3">
        {/* Left: Progress info */}
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-xl transition cursor-pointer"
            title="退出測驗"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900 text-sm">
                第 {currentIndex + 1} / {questions.length} 題
              </span>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                {filter.mode === 'instant' ? '即時反饋模式' : '模擬考試模式'}
              </span>
            </div>
            <div className="w-36 sm:w-56 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-300 rounded-full"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Timer & Tools */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Timer */}
          <div className="flex items-center gap-1 text-slate-600 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200 text-xs font-bold">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatTime(timerSeconds)}</span>
          </div>

          {/* Voice Speaker */}
          <button
            onClick={handleVoiceRead}
            className={`p-2 rounded-xl border transition cursor-pointer flex items-center gap-1 text-xs font-bold ${
              isSpeaking
                ? 'bg-amber-100 border-amber-300 text-amber-800 animate-pulse'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title="語音朗讀題目"
          >
            {isSpeaking ? <VolumeX className="w-4 h-4 text-amber-600" /> : <Volume2 className="w-4 h-4 text-indigo-600" />}
            <span className="hidden sm:inline">{isSpeaking ? '停止朗讀' : '語音朗讀'}</span>
          </button>

          {/* Scratchpad */}
          <button
            onClick={onOpenScratchpad}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition cursor-pointer flex items-center gap-1 text-xs font-bold"
            title="開啟數學計算草稿紙"
          >
            <Edit3 className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">計算草稿</span>
          </button>

          {/* Bookmark / Mistake Notebook */}
          <button
            onClick={toggleMistake}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              isMistakeSaved
                ? 'bg-rose-50 border-rose-300 text-rose-600'
                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
            }`}
            title={isMistakeSaved ? '已收錄在錯題本' : '收錄至錯題本'}
          >
            {isMistakeSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
        {/* Meta badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-xl">
              {currentQ.unitTitle || '核心課次'}
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-xl ${
                currentQ.difficulty === 'easy'
                  ? 'bg-emerald-50 text-emerald-700'
                  : currentQ.difficulty === 'hard'
                  ? 'bg-rose-50 text-rose-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {currentQ.difficulty === 'easy' ? '基礎題' : currentQ.difficulty === 'hard' ? '素養題' : '進階題'}
            </span>
          </div>

          <span className="text-xs text-slate-400 font-medium">
            知識點：{currentQ.knowledgePoint}
          </span>
        </div>

        {/* Reading Passage (if present) */}
        {currentQ.readingPassage && (
          <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200 text-slate-800 text-sm leading-relaxed font-serif whitespace-pre-line shadow-xs">
            {currentQ.readingPassage}
          </div>
        )}

        {/* Question Text */}
        <div className="space-y-2">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-relaxed tracking-tight">
            {currentQ.content}
          </h3>
          {currentQ.zhuyinHint && (
            <div className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 inline-block font-medium">
              💡 注音提示：{currentQ.zhuyinHint}
            </div>
          )}
        </div>

        {/* Options / Input Area */}
        <div className="space-y-3 pt-2">
          {/* Multiple Choice (單選題) */}
          {currentQ.type === 'choice' && currentQ.options && (
            <div className="grid grid-cols-1 gap-2.5">
              {currentQ.options.map((opt, idx) => {
                const isSelected = currentAnswer === idx;
                const isCorrectOption = Number(currentQ.correctAnswer) === idx;
                const showInstantResult = filter.mode === 'instant' && isAnswered;

                let buttonClass = 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800';

                if (showInstantResult) {
                  if (isCorrectOption) {
                    buttonClass = 'bg-emerald-100 border-emerald-400 text-emerald-950 font-bold ring-2 ring-emerald-500';
                  } else if (isSelected && !isCorrectOption) {
                    buttonClass = 'bg-rose-100 border-rose-400 text-rose-950 line-through ring-2 ring-rose-400';
                  } else {
                    buttonClass = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                  }
                } else if (isSelected) {
                  buttonClass = 'bg-indigo-50 border-indigo-500 text-indigo-950 font-bold ring-2 ring-indigo-400';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectAnswer(idx)}
                    disabled={filter.mode === 'instant' && isAnswered}
                    className={`p-4 rounded-2xl border text-left text-sm sm:text-base flex items-center gap-3 transition cursor-pointer ${buttonClass}`}
                  >
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 border ${
                        showInstantResult && isCorrectOption
                          ? 'bg-emerald-500 text-white border-emerald-600'
                          : showInstantResult && isSelected && !isCorrectOption
                          ? 'bg-rose-500 text-white border-rose-600'
                          : isSelected
                          ? 'bg-indigo-600 text-white border-indigo-700'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 leading-snug">{opt}</span>
                    {showInstantResult && isCorrectOption && (
                      <Check className="w-5 h-5 text-emerald-600 shrink-0 stroke-[3]" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* True / False (是非題) */}
          {currentQ.type === 'truefalse' && (
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: '正確 (O)', val: 'T', symbol: 'O' },
                { label: '錯誤 (X)', val: 'F', symbol: 'X' },
              ].map((item) => {
                const isSelected = currentAnswer === item.val;
                const isCorrectOption = String(currentQ.correctAnswer).toUpperCase() === item.val;
                const showInstantResult = filter.mode === 'instant' && isAnswered;

                let btnStyle = 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800';
                if (showInstantResult) {
                  if (isCorrectOption) {
                    btnStyle = 'bg-emerald-100 border-emerald-400 text-emerald-950 font-bold ring-2 ring-emerald-500';
                  } else if (isSelected && !isCorrectOption) {
                    btnStyle = 'bg-rose-100 border-rose-400 text-rose-950 ring-2 ring-rose-400';
                  } else {
                    btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                  }
                } else if (isSelected) {
                  btnStyle = 'bg-indigo-50 border-indigo-500 text-indigo-950 font-bold ring-2 ring-indigo-400';
                }

                return (
                  <button
                    key={item.val}
                    onClick={() => handleSelectAnswer(item.val)}
                    disabled={filter.mode === 'instant' && isAnswered}
                    className={`py-6 rounded-2xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${btnStyle}`}
                  >
                    <span className="text-3xl font-black">{item.symbol}</span>
                    <span className="text-xs font-bold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Fill-in / Calculation (填空與計算) */}
          {(currentQ.type === 'fill' || currentQ.type === 'reading') && !currentQ.options && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={fillInput}
                  onChange={(e) => setFillInput(e.target.value)}
                  disabled={filter.mode === 'instant' && isAnswered}
                  placeholder="請在此輸入你的計算答案..."
                  className="flex-1 bg-white border border-slate-300 rounded-2xl px-4 py-3 text-base text-slate-900 focus:ring-2 focus:ring-indigo-500 font-semibold"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && fillInput.trim()) {
                      handleSelectAnswer(fillInput.trim());
                    }
                  }}
                />
                {(!isAnswered || filter.mode === 'exam') && (
                  <button
                    onClick={() => {
                      if (fillInput.trim()) handleSelectAnswer(fillInput.trim());
                    }}
                    className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition cursor-pointer"
                  >
                    確認送出
                  </button>
                )}
              </div>
              {isAnswered && (
                <div className="text-xs text-slate-500">
                  你的作答：<span className="font-bold text-slate-800">{String(currentAnswer)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instant Feedback & Explanations */}
        {filter.mode === 'instant' && isAnswered && (
          <div
            className={`p-5 rounded-2xl border space-y-3 animate-in fade-in duration-200 ${
              isCurrentCorrect ? 'bg-emerald-50/70 border-emerald-300' : 'bg-rose-50/70 border-rose-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isCurrentCorrect ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <span className="font-black text-emerald-900 text-base">恭喜你！回答正確！</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-rose-600" />
                    <span className="font-black text-rose-900 text-base">
                      哎呀答錯囉！正確答案是：
                      <span className="underline decoration-2 ml-1">
                        {currentQ.type === 'choice' && currentQ.options
                          ? `${String.fromCharCode(65 + Number(currentQ.correctAnswer))}. ${
                              currentQ.options[Number(currentQ.correctAnswer)]
                            }`
                          : String(currentQ.correctAnswer)}
                      </span>
                    </span>
                  </>
                )}
              </div>

              {/* AI teacher button */}
              <button
                onClick={handleExplainWithAI}
                disabled={isAiExplaining}
                className="px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isAiExplaining ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>星星老師思考中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>AI 小老師步驟解析</span>
                  </>
                )}
              </button>
            </div>

            {/* Standard Explanation */}
            <div className="text-xs text-slate-700 leading-relaxed bg-white/80 p-3 rounded-xl border border-slate-200/80">
              <span className="font-bold text-indigo-800 block mb-1">【觀念解析】</span>
              {currentQ.explanation}
            </div>

            {/* AI Explanation block */}
            {aiExplanation && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 text-xs text-slate-800 leading-relaxed space-y-2">
                <div className="font-black text-indigo-900 flex items-center gap-1.5 text-sm">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>星星老師的步驟點撥</span>
                </div>
                <div className="whitespace-pre-line text-slate-700">{aiExplanation}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>上一題</span>
        </button>

        {/* Question dots indicator */}
        <div className="hidden sm:flex items-center gap-1.5">
          {questions.map((q, i) => {
            const hasAnswered = userAnswers[q.id] !== undefined;
            const isCurrent = i === currentIndex;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(i)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                  isCurrent
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                    : hasAnswered
                    ? 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {currentIndex < questions.length - 1 ? (
          <button
            onClick={() => setCurrentIndex((prev) => prev + 1)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-indigo-200"
          >
            <span>下一題</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleFinishQuiz}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm flex items-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-200"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>完成作答，查看成績</span>
          </button>
        )}
      </div>
    </div>
  );
};
