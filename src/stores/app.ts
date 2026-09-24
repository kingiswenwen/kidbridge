import { defineStore } from "pinia";
import type { Question, Grade } from "@/types";
import type {
  Settings,
  Progress,
  ChallengeProgress,
  LevelProgress,
  PinyinFavorite,
} from "@/types";
import {
  defaultSettings,
  defaultProgress,
  getTodayDateString,
  checkAndUpdateStreak,
} from "@/utils/storage";

export const useAppStore = defineStore("app", {
  state: () => ({
    settings: { ...defaultSettings } as Settings,
    progress: { ...defaultProgress } as Progress,
    // 错题本：直接存 Question + 附带 timestamp，便于页面直接展示
    wrongBook: [] as Question[],
    challengeProgress: {} as ChallengeProgress,
    pinyinFavorites: [] as PinyinFavorite[],
  }),

  getters: {
    // 扁平化几个高频字段给页面用
    soundEnabled: (s) => s.settings.soundEnabled,
    autoSpeak: (s) => s.settings.autoSpeak,
    grade: (s) => s.settings.grade,
    avatar: (s) => s.settings.avatar,
    childName: (s) => s.settings.childName,
    streakDays: (s) => s.progress.streak,
    stats: (s) => ({
      totalDone: s.progress.totalQuestions,
      totalCorrect: s.progress.correctAnswers,
    }),
  },

  actions: {
    // ===== 设置项 =====
    toggleSound(on: boolean) {
      this.settings.soundEnabled = on;
    },
    setAutoSpeak(on: boolean) {
      this.settings.autoSpeak = on;
    },
    setGrade(grade: Grade) {
      this.settings.grade = grade;
    },
    setAvatar(emoji: string) {
      this.settings.avatar = emoji;
    },
    setChildName(name: string) {
      this.settings.childName = name;
    },
    updateSettings(patch: Partial<Settings>) {
      this.settings = { ...this.settings, ...patch };
    },

    // ===== 错题本 =====
    addWrong(q: Question) {
      const idx = this.wrongBook.findIndex((x) => x.id === q.id);
      if (idx >= 0) {
        this.wrongBook.splice(idx, 1);
      }
      // 最新的放前面
      this.wrongBook.unshift({
        ...q,
        timestamp: q.timestamp ?? Date.now(),
      });
      // 上限 200 条
      if (this.wrongBook.length > 200) this.wrongBook.length = 200;
    },
    removeWrong(id: string) {
      this.wrongBook = this.wrongBook.filter((q) => q.id !== id);
    },
    clearWrong() {
      this.wrongBook = [];
    },
    // 兼容老命名
    addWrongQuestion(q: any) { this.addWrong(q as Question); },
    removeWrongQuestion(id: string) { this.removeWrong(id); },
    clearWrongBook() { this.clearWrong(); },

    // ===== 学习进度 =====
    ensureDailyReset() {
      this.progress = checkAndUpdateStreak(this.progress);
    },
    updateProgress(patch: Partial<Progress>) {
      this.progress = { ...this.progress, ...patch };
    },
    addProgress(delta: { totalDone: number; totalCorrect: number }) {
      const today = getTodayDateString();
      if (this.progress.lastActiveDate !== today) {
        this.progress = checkAndUpdateStreak(this.progress);
      }
      const last = new Date(this.progress.lastActiveDate);
      const now = new Date(today);
      const diff = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

      this.progress.totalQuestions += delta.totalDone;
      this.progress.correctAnswers += delta.totalCorrect;
      this.progress.todayQuestions += delta.totalDone;
      this.progress.todayCorrect += delta.totalCorrect;
      this.progress.lastActiveDate = today;
      this.progress.streak =
        diff === 1 || this.progress.lastActiveDate === today
          ? Math.max(this.progress.streak, 1)
          : this.progress.streak === 0
            ? 1
            : this.progress.streak;
    },
    recordAnswer(isCorrect: boolean, module: "math" | "pinyin") {
      const mp =
        module === "math" ? this.progress.mathProgress : this.progress.pinyinProgress;
      this.addProgress({ totalDone: 1, totalCorrect: isCorrect ? 1 : 0 });
      const mpNext = {
        totalQuestions: mp.totalQuestions + 1,
        correctAnswers: isCorrect ? mp.correctAnswers + 1 : mp.correctAnswers,
      };
      if (module === "math") {
        this.progress.mathProgress = mpNext;
      } else {
        this.progress.pinyinProgress = {
          ...this.progress.pinyinProgress,
          ...mpNext,
        };
      }
    },
    updatePinyinProgress(total: number, correct: number) {
      this.addProgress({ totalDone: total, totalCorrect: correct });
      this.progress.pinyinProgress = {
        ...this.progress.pinyinProgress,
        totalQuestions: this.progress.pinyinProgress.totalQuestions + total,
        correctAnswers: this.progress.pinyinProgress.correctAnswers + correct,
      };
    },
    updateEnglishProgress(total: number, correct: number) {
      this.addProgress({ totalDone: total, totalCorrect: correct });
      this.progress.englishProgress = {
        ...this.progress.englishProgress,
        totalQuestions: this.progress.englishProgress.totalQuestions + total,
        correctAnswers: this.progress.englishProgress.correctAnswers + correct,
      };
    },

    // ===== 闯关进度 =====
    updateChallengeProgress(levelId: string, patch: Partial<LevelProgress>) {
      const existing: LevelProgress = this.challengeProgress[levelId] ?? {
        stars: 0,
        completed: false,
        attempts: 0,
      };
      this.challengeProgress = {
        ...this.challengeProgress,
        [levelId]: { ...existing, ...patch },
      };
    },

    // ===== 拼音收藏 / 学习过 =====
    addPinyinFavorite(pinyin: string) {
      if (this.pinyinFavorites.some((f) => f.pinyin === pinyin)) return;
      this.pinyinFavorites.push({ pinyin, addedAt: Date.now() });
    },
    removePinyinFavorite(pinyin: string) {
      this.pinyinFavorites = this.pinyinFavorites.filter((f) => f.pinyin !== pinyin);
    },
    markPinyinLearned(pinyin: string) {
      if (this.progress.pinyinProgress.learnedPinyin.includes(pinyin)) return;
      this.progress.pinyinProgress = {
        ...this.progress.pinyinProgress,
        learnedPinyin: [...this.progress.pinyinProgress.learnedPinyin, pinyin],
      };
    },

    // ===== 全部重置 =====
    resetAll() {
      this.settings = { ...defaultSettings };
      this.progress = { ...defaultProgress };
      this.wrongBook = [];
      this.challengeProgress = {};
      this.pinyinFavorites = [];
    },
    resetAllData() {
      this.resetAll();
    },
  },

  persist: {
    key: "kidbridge-app-storage",
    storage: {
      getItem: (key) => uni.getStorageSync(key) || null,
      setItem: (key, value) => uni.setStorageSync(key, value),
    },
  },
});
