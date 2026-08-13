export type FontSize = "small" | "medium" | "large";
export type Theme = "cartoon";
export type OperationType = "addition" | "subtraction" | "mixed";

export type MathQuestionType =
  | "addition10"
  | "subtraction10"
  | "mixed10"
  | "addition20"
  | "subtraction20"
  | "mixed20"
  | "decompose"
  | "adjacent"
  | "compare"
  | "wordProblem"
  | "counting"
  | "sequence";

export type PinyinQuestionType =
  | "pinyinToChar"
  | "charToPinyin"
  | "toneMatch"
  | "fillInitial"
  | "fillFinal"
  | "flatCurled"
  | "spellTwo"
  | "spellThree";

export type QuestionType = MathQuestionType | PinyinQuestionType;

export type PinyinCategory =
  | "singleVowel"
  | "compoundVowel"
  | "nasalVowel"
  | "initial"
  | "wholeSyllable";

export type ToneType = 1 | 2 | 3 | 4 | 0;

export interface PinyinItem {
  pinyin: string;
  category: PinyinCategory;
  audio?: string;
  mouthShape?: string;
  tips?: string;
  isFlat?: boolean;
  isCurled?: boolean;
  /** 卡片展示的例字（如声母/韵母配图例字） */
  chars?: { char: string; word?: string }[];
  /** 声调 1-4 / 0（轻声） */
  tone?: ToneType;
  /** 归类标签：声母/韵母/整体认读/拼读 */
  type?: "shengmu" | "yunmu" | "zhengti" | "pinyin";
}

export interface PinyinSyllable {
  syllable: string;
  initial?: string;
  final: string;
  medial?: string;
  tone: ToneType;
  char?: string;
  charImage?: string;
}

export type Grade = "small" | "middle" | "big" | "grade1";

export interface Settings {
  fontSize: FontSize;
  soundEnabled: boolean;
  autoSpeak: boolean;
  theme: Theme;
  pinyinSpeed: "slow" | "normal" | "fast";
  showSpellingHint: boolean;
  grade: Grade;
  avatar: string;
  childName: string;
}

export interface Progress {
  totalQuestions: number;
  correctAnswers: number;
  streak: number;
  lastActiveDate: string;
  todayQuestions: number;
  todayCorrect: number;
  mathProgress: {
    totalQuestions: number;
    correctAnswers: number;
  };
  pinyinProgress: {
    totalQuestions: number;
    correctAnswers: number;
    learnedPinyin: string[];
  };
  englishProgress: {
    totalQuestions: number;
    correctAnswers: number;
    learnedWords: string[];
  };
}

export interface Question {
  id: string;
  type: QuestionType;
  module: "math" | "pinyin";
  content: string;
  answer: number | string;
  options?: (number | string)[];
  visual?: VisualData;
  num1?: number;
  num2?: number;
  operator?: string;
  pinyin?: string;
  tone?: ToneType;
  syllable?: PinyinSyllable;
  /** 错题本使用：加入错题本时的时间戳 */
  timestamp?: number;
}

export type VisualConfig = VisualData;

export interface VisualData {
  type:
    | "dots"
    | "sticks"
    | "fruits"
    | "animals"
    | "numberLine"
    | "pinyinSpell";
  count?: number;
  items?: string[];
  range?: [number, number];
  initial?: string;
  final?: string;
  medial?: string;
}

export interface WrongQuestion {
  id: string;
  question: Question;
  userAnswer: number | string;
  correctAnswer: number | string;
  timestamp: number;
  retryCount: number;
}

export interface LevelConfig {
  id: string;
  name: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "challenge";
  questionTypes: QuestionType[];
  questionCount: number;
  module: "math" | "pinyin" | "comprehensive";
  timeLimit?: number;
  unlockCondition?: string;
}

export interface LevelProgress {
  stars: number;
  completed: boolean;
  bestScore?: number;
  attempts: number;
}

export interface ChallengeProgress {
  [levelId: string]: LevelProgress;
}

export interface PinyinFavorite {
  pinyin: string;
  addedAt: number;
}

export interface AppData {
  settings: Settings;
  progress: Progress;
  wrongBook: WrongQuestion[];
  challengeProgress: ChallengeProgress;
  pinyinFavorites: PinyinFavorite[];
}
