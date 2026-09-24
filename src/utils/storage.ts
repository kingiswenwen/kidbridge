import type {
  Settings,
  Progress,
  WrongQuestion,
  ChallengeProgress,
  LevelProgress,
  PinyinFavorite,
} from "@/types";

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const defaultSettings: Settings = {
  fontSize: "medium",
  soundEnabled: true,
  autoSpeak: false,
  theme: "cartoon",
  pinyinSpeed: "normal",
  showSpellingHint: true,
  grade: "big",
  avatar: "🐼",
  childName: "小朋友",
};

export const defaultProgress: Progress = {
  totalQuestions: 0,
  correctAnswers: 0,
  streak: 0,
  lastActiveDate: getTodayDateString(),
  todayQuestions: 0,
  todayCorrect: 0,
  mathProgress: { totalQuestions: 0, correctAnswers: 0 },
  pinyinProgress: {
    totalQuestions: 0,
    correctAnswers: 0,
    learnedPinyin: [],
  },
  englishProgress: {
    totalQuestions: 0,
    correctAnswers: 0,
    learnedWords: [],
  },
};

export function checkAndUpdateStreak(progress: Progress): Progress {
  const today = getTodayDateString();
  if (progress.lastActiveDate === today) return progress;

  const last = new Date(progress.lastActiveDate);
  const now = new Date(today);
  const diffDays = Math.floor(
    (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24),
  );

  const newStreak = diffDays === 1 ? progress.streak : diffDays > 1 ? 0 : 0;

  return {
    ...progress,
    streak: newStreak,
    lastActiveDate: today,
    todayQuestions: 0,
    todayCorrect: 0,
  };
}
