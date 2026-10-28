export type GradeLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type Semester = 1 | 2; // 1 = 上學期, 2 = 下學期
export type SubjectId = 'chinese' | 'math' | 'science' | 'social' | 'english';
export type PublisherId = 'kangxuan' | 'hanlin' | 'nanyi';
export type QuestionType = 'choice' | 'truefalse' | 'fill' | 'reading';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface SubjectInfo {
  id: SubjectId;
  name: string;
  icon: string;
  color: string;
  bgLight: string;
  borderColor: string;
  availableGrades: GradeLevel[];
  description: string;
}

export interface PublisherInfo {
  id: PublisherId;
  name: string;
  shortName: string;
  color: string;
  badgeBg: string;
  description: string;
}

export interface UnitInfo {
  id: string;
  unitNumber: number;
  title: string;
  examStage: 1 | 2 | 3; // 1=第一次段考, 2=第二次段考, 3=第三次/期末
  keyConcepts: string[];
}

export interface Question {
  id: string;
  grade: GradeLevel;
  semester: Semester;
  subject: SubjectId;
  publisher: PublisherId;
  unitId?: string;
  unitTitle?: string;
  type: QuestionType;
  difficulty: Difficulty;
  content: string; // 題目內文
  readingPassage?: string; // 閱讀測驗引文（若有）
  options?: string[]; // 選擇題選項 (4項)
  correctAnswer: string | number; // 選擇題為 0-indexed 或 1-indexed / 是非題為 'T'|'F' / 填空題為答案文字
  explanation: string; // 詳細觀念解析
  knowledgePoint: string; // 核心知識點
  zhuyinHint?: string; // 低年級注音或拼音輔助說明
  tags?: string[];
}

export interface QuizFilter {
  grade: GradeLevel;
  semester: Semester;
  subject: SubjectId;
  publisher: PublisherId;
  selectedUnits: string[]; // empty means all units
  questionTypes: QuestionType[];
  difficulty: Difficulty | 'all';
  questionCount: number;
  mode: 'instant' | 'exam'; // instant=即時對答案, exam=交卷後評分
}

export interface UserAnswerRecord {
  questionId: string;
  question: Question;
  userAnswer: string | number | null;
  isCorrect: boolean;
  timeSpentSeconds: number;
  timestamp: number;
}

export interface QuizResult {
  id: string;
  title: string;
  grade: GradeLevel;
  semester: Semester;
  subject: SubjectId;
  publisher: PublisherId;
  date: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  timeSpentTotal: number;
  records: UserAnswerRecord[];
}

export interface MistakeItem {
  id: string;
  question: Question;
  lastAnswer: string | number | null;
  addedAt: number;
  notes?: string;
  tagCategory?: 'careless' | 'concept' | 'calculation' | 'reading';
  mastered: boolean;
}
