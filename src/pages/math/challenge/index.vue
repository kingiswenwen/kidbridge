<template>
  <view class="ch-bg">
    <!-- 列表：选关 -->
    <view v-if="stage === 'list'" class="ch-stage px-4 pt-8 pb-16">
      <view class="ch-hero text-center">
        <text class="ch-hero-emoji">🏆</text>
        <text class="ch-hero-title">闯关挑战</text>
        <text class="ch-hero-sub">一步步通关，成为数学小达人！</text>
        <view class="ch-progress-chip mt-4">
          <text class="pc-text">已通关 {{ completedCount }} / {{ levels.length }} 关 · 总星数 {{ totalStars }} ⭐</text>
        </view>
      </view>

      <view v-for="group in difficultyGroups" :key="group.key" class="ch-group mt-10">
        <view class="group-head flex items-center gap-3 mb-4">
          <view
            class="group-dot"
            :style="{ background: group.color }"
          ></view>
          <text class="group-name">{{ group.label }}</text>
          <text class="group-count">{{ group.items.length }} 关</text>
        </view>

        <view class="level-grid">
          <view
            v-for="lv in group.items"
            :key="lv.id"
            :class="['level-card', isUnlocked(lv) ? 'unlocked' : 'locked']"
            :style="isUnlocked(lv) ? { '--accent': difficultyColors[lv.difficulty] } : {}"
            @click="isUnlocked(lv) && enterLevel(lv)"
          >
            <view class="lc-top flex items-center justify-between">
              <text class="lc-no">{{ levelNo(lv.id) }}</text>
              <view class="lc-stars flex gap-1">
                <text v-if="!isUnlocked(lv)" class="lc-lock">🔒</text>
                <template v-else-if="prog(lv.id)?.completed">
                  <text v-for="n in 3" :key="n" class="lc-star" :class="{ on: n <= (prog(lv.id)?.stars || 0) }">★</text>
                </template>
                <text v-else class="lc-play">▶</text>
              </view>
            </view>
            <text class="lc-name">{{ lv.name }}</text>
            <text class="lc-desc">{{ lv.description }}</text>
            <view class="lc-meta flex items-center justify-between mt-3">
              <text class="lc-qt">📝 {{ lv.questionCount }} 题</text>
              <text v-if="!isUnlocked(lv)" class="lc-need">需先通过：{{ unlockText(lv) }}</text>
              <text v-else-if="prog(lv.id)?.attempts" class="lc-attempts">挑战 {{ prog(lv.id)?.attempts }} 次</text>
              <text v-else class="lc-attempts">等待挑战</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 答题 -->
    <view v-else-if="stage === 'quiz'" class="ch-stage px-4 pt-4 pb-32">
      <view class="px-2">
        <ProgressBar
          :current="currentIndex + 1"
          :total="questions.length"
          :correct="correctCount"
        />
      </view>
      <view class="level-title-card mt-5">
        <view class="ltc-row flex items-center justify-between">
          <view>
            <text class="ltc-no">第 {{ levelNo(currentLevel?.id || '') }} 关</text>
            <text class="ltc-name">{{ currentLevel?.name }}</text>
          </view>
          <view class="ltc-quit" @click="quit">
            <text class="ltc-quit-text">退出</text>
          </view>
        </view>
      </view>

      <view v-if="currentQuestion" class="mt-4">
        <QuestionCard
          :question="currentQuestion"
          :selected-answer="selectedAnswer"
          :is-answered="isAnswered"
          @answer="handleAnswer"
        />

        <view v-if="useNumberPad" class="mt-8">
          <view class="answer-box text-center mb-4">
            <text class="text-gray-500 mr-2 text-sm">你的答案：</text>
            <text class="answer-display">{{ draftAnswer === '' ? '  ' : draftAnswer }}</text>
          </view>
          <NumberPad
            :max-value="20"
            :disabled="isAnswered"
            @number="onNum"
            @clear="draftAnswer = ''"
            @submit="draftAnswer !== '' && handleAnswer(Number(draftAnswer))"
          />
        </view>

        <view v-if="isAnswered" class="feedback text-center mt-8">
          <text :class="['fb-emoji', lastCorrect ? 'ok' : 'bad']">
            {{ lastCorrect ? '🎉' : '😿' }}
          </text>
          <text :class="['fb-text', lastCorrect ? 'ok' : 'bad']">
            {{ lastCorrect ? pick(encouragements).content : '正确答案是 ' + String(currentQuestion.answer) }}
          </text>
          <view class="next-btn" @click="nextQuestion">
            <text class="next-text">
              {{ currentIndex + 1 === questions.length ? '🏆 查看成绩' : '下一题 →' }}
            </text>
          </view>
        </view>
      </view>
    </view>

    <!-- 结算 -->
    <view v-else-if="stage === 'result'" class="ch-stage px-6 pt-10">
      <view class="result-card">
        <text class="result-emoji">
          {{ stars === 3 ? '🏆' : stars === 2 ? '🎉' : stars === 1 ? '💪' : '🌈' }}
        </text>
        <text class="result-title">{{ resultTitle }}</text>
        <view class="mt-6">
          <StarRating :stars="stars" :animated="true" />
        </view>
        <view class="stats-grid mt-8">
          <view class="stat-item">
            <text class="stat-value text-coral">{{ correctCount }}</text>
            <text class="stat-label">答对</text>
          </view>
          <view class="stat-item">
            <text class="stat-value text-gray-500">{{ questions.length - correctCount }}</text>
            <text class="stat-label">答错</text>
          </view>
          <view class="stat-item">
            <text class="stat-value text-green">{{ correctRate }}%</text>
            <text class="stat-label">正确率</text>
          </view>
        </view>
        <view class="result-actions mt-10">
          <view class="again-btn" @click="retry">
            <text class="again-text">🔄 再挑战一次</text>
          </view>
          <view class="home-btn" @click="toList">
            <text class="home-text">📋 关卡列表</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAppStore } from '@/stores/app';
import { levels, difficultyLabels, difficultyColors, getLevelsByDifficulty, type LevelConfig } from '@/data/levels';
import type { Question } from '@/types';
import { generateQuestions, checkAnswer } from '@/utils/questionGenerator';
import { encouragement as encouragements } from '@/data/encouragements';
import ProgressBar from '@/components/ProgressBar.vue';
import QuestionCard from '@/components/QuestionCard.vue';
import NumberPad from '@/components/NumberPad.vue';
import StarRating, { calculateStars } from '@/components/StarRating.vue';

const store = useAppStore();

const stage = ref<'list' | 'quiz' | 'result'>('list');

const difficultyGroups = computed(() => [
  {
    key: 'beginner',
    label: difficultyLabels.beginner,
    color: difficultyColors.beginner,
    items: getLevelsByDifficulty('beginner'),
  },
  {
    key: 'intermediate',
    label: difficultyLabels.intermediate,
    color: difficultyColors.intermediate,
    items: getLevelsByDifficulty('intermediate'),
  },
  {
    key: 'challenge',
    label: difficultyLabels.challenge,
    color: difficultyColors.challenge,
    items: getLevelsByDifficulty('challenge'),
  },
]);

function levelNo(id: string): string {
  const i = levels.findIndex((l) => l.id === id);
  return String(i + 1).padStart(2, '0');
}
function prog(id: string) {
  return store.challengeProgress[id];
}
function isUnlocked(lv: LevelConfig): boolean {
  if (!lv.unlockCondition) return true;
  const prereqs = lv.unlockCondition.split(',').map((s) => s.trim()).filter(Boolean);
  return prereqs.every((id) => store.challengeProgress[id]?.completed);
}
function unlockText(lv: LevelConfig): string {
  if (!lv.unlockCondition) return '-';
  return lv.unlockCondition.split(',').map((id) => {
    const t = levels.find((x) => x.id === id);
    return t ? `第${levelNo(id)}关` : id;
  }).join(' + ');
}
const completedCount = computed(() =>
  Object.values(store.challengeProgress).filter((p) => p.completed).length,
);
const totalStars = computed(() =>
  Object.values(store.challengeProgress).reduce((sum, p) => sum + (p.stars || 0), 0),
);

// ===== 答题 =====
const currentLevel = ref<LevelConfig | null>(null);
const questions = ref<Question[]>([]);
const currentIndex = ref(0);
const selectedAnswer = ref<number | string | null>(null);
const isAnswered = ref(false);
const correctCount = ref(0);
const lastCorrect = ref(false);
const draftAnswer = ref('');

const currentQuestion = computed(() => questions.value[currentIndex.value] || null);
const useNumberPad = computed(() => {
  const q = currentQuestion.value;
  if (!q) return false;
  return !q.options || q.options.length === 0;
});

function enterLevel(lv: LevelConfig) {
  currentLevel.value = lv;
  questions.value = generateQuestions(lv.questionTypes, lv.questionCount);
  currentIndex.value = 0;
  selectedAnswer.value = null;
  isAnswered.value = false;
  correctCount.value = 0;
  lastCorrect.value = false;
  draftAnswer.value = '';
  stage.value = 'quiz';
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function handleAnswer(ans: number | string) {
  if (isAnswered.value || !currentQuestion.value) return;
  selectedAnswer.value = ans;
  isAnswered.value = true;
  const ok = checkAnswer(currentQuestion.value, ans);
  lastCorrect.value = ok;
  if (ok) correctCount.value += 1;
  else {
    store.addWrong({
      ...currentQuestion.value,
      timestamp: Date.now(),
    });
  }
}
function onNum(n: number) {
  if (isAnswered.value) return;
  draftAnswer.value = String(Number(draftAnswer.value + String(n)));
}
function nextQuestion() {
  if (currentIndex.value + 1 >= questions.value.length) {
    finishLevel();
    return;
  }
  currentIndex.value += 1;
  selectedAnswer.value = null;
  isAnswered.value = false;
  draftAnswer.value = '';
}
function quit() {
  uni.showModal({
    title: '确定退出关卡？',
    content: '本次进度将不会保存',
    success: (r) => {
      if (r.confirm) toList();
    },
  });
}
function finishLevel() {
  if (!currentLevel.value) return;
  const id = currentLevel.value.id;
  const stars = calculateStars(correctCount.value, questions.value.length);
  const passed = stars >= 1; // 有 1 星就算通关
  const prev = store.challengeProgress[id];
  store.addProgress({
    totalDone: questions.value.length,
    totalCorrect: correctCount.value,
  });
  store.updateChallengeProgress(id, {
    completed: passed || !!prev?.completed,
    stars: Math.max(prev?.stars || 0, stars),
    bestScore: Math.max(prev?.bestScore || 0, correctRate.value),
    attempts: (prev?.attempts || 0) + 1,
  });
  stage.value = 'result';
}
const correctRate = computed(() =>
  questions.value.length ? Math.round((correctCount.value / questions.value.length) * 100) : 0,
);
const stars = computed(() => calculateStars(correctCount.value, questions.value.length));
const resultTitle = computed(() => {
  if (stars.value === 3) return '太厉害啦，满星通关！';
  if (stars.value === 2) return '做得不错，再接再厉！';
  if (stars.value === 1) return '有进步，能过就好！';
  return '别灰心，再挑战一次！';
});

function retry() {
  if (currentLevel.value) enterLevel(currentLevel.value);
}
function toList() {
  currentLevel.value = null;
  stage.value = 'list';
}
</script>

<style lang="scss" scoped>
.ch-bg {
  min-height: 100vh;
  background: linear-gradient(180deg, #FFF9E6 0%, #FFE8F0 50%, #E0F7F5 100%);
}
.ch-stage { max-width: 860rpx; margin: 0 auto; }

/* Hero */
.ch-hero { display: flex; flex-direction: column; align-items: center; }
.ch-hero-emoji { font-size: 120rpx; }
.ch-hero-title { font-size: 56rpx; font-weight: 800; color: #D97706; margin-top: 8rpx; }
.ch-hero-sub { font-size: 28rpx; color: #6B7280; margin-top: 8rpx; }
.ch-progress-chip {
  padding: 14rpx 28rpx; border-radius: 999rpx;
  background: linear-gradient(135deg, #FFE4A6 0%, #FFD93D 100%);
  box-shadow: 0 6rpx 18rpx rgba(255, 217, 61, 0.3);
}
.pc-text { font-size: 24rpx; font-weight: 700; color: #78350F; }

/* Difficulty group */
.group-dot {
  width: 20rpx; height: 20rpx; border-radius: 999rpx;
  box-shadow: 0 0 0 6rpx rgba(255, 255, 255, 0.9);
}
.group-name { font-size: 32rpx; font-weight: 800; color: #1F2937; }
.group-count { margin-left: auto; font-size: 24rpx; color: #9CA3AF; }

/* Level card */
.level-grid {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20rpx;
}
/* 平板 / 桌面：关卡改为三列，铺满居中内容区 */
@media screen and (min-width: 768px) {
  .level-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
.level-card {
  background: #FFFFFF; border-radius: 32rpx; padding: 24rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.05);
  border: 3rpx solid transparent;
  position: relative;
  --accent: #FF6B6B;
  &.unlocked {
    border-color: var(--accent);
    background: #FFFFFF;
    &:active { transform: scale(0.97); }
  }
  &.locked {
    opacity: 0.55;
    background: #F9FAFB;
  }
}
.lc-top { margin-bottom: 14rpx; }
.lc-no {
  font-size: 22rpx; font-weight: 800; color: var(--accent);
  background: #FFF9E6;
  padding: 4rpx 16rpx; border-radius: 999rpx;
}
.locked .lc-no { color: #9CA3AF; background: #F3F4F6; }
.lc-lock { font-size: 24rpx; }
.lc-play { font-size: 22rpx; color: var(--accent); font-weight: 700; }
.lc-star {
  font-size: 24rpx; color: #E5E7EB;
  &.on { color: #FFD93D; text-shadow: 0 2rpx 4rpx rgba(255, 217, 61, 0.4); }
}
.lc-name { font-size: 30rpx; font-weight: 800; color: #1F2937; display: block; }
.lc-desc { font-size: 24rpx; color: #6B7280; margin-top: 4rpx; display: block; }
.lc-qt { font-size: 22rpx; color: #4B5563; font-weight: 600; }
.lc-need, .lc-attempts { font-size: 22rpx; color: #9CA3AF; }

/* Level title card */
.level-title-card {
  background: linear-gradient(135deg, #FFD93D 0%, #FF8E53 100%);
  border-radius: 28rpx; padding: 24rpx 28rpx;
  box-shadow: 0 10rpx 32rpx rgba(255, 142, 83, 0.25);
}
.ltc-no {
  display: block; font-size: 22rpx; font-weight: 700; color: rgba(255, 255, 255, 0.9);
}
.ltc-name { display: block; font-size: 36rpx; font-weight: 800; color: #FFFFFF; margin-top: 4rpx; }
.ltc-quit {
  padding: 14rpx 28rpx; border-radius: 999rpx; background: rgba(255, 255, 255, 0.25);
}
.ltc-quit-text { color: #FFFFFF; font-weight: 700; font-size: 26rpx; }

/* Answer display */
.answer-box { padding: 16rpx 0; }
.answer-display {
  display: inline-block; min-width: 120rpx; padding: 12rpx 32rpx; border-radius: 20rpx;
  background: #FFFFFF; border: 3rpx dashed #FFD93D;
  font-size: 56rpx; font-weight: 800; color: #FF6B6B;
}

/* Feedback */
.feedback { padding: 16rpx 0; }
.fb-emoji { font-size: 80rpx; display: block; }
.fb-text {
  display: block; margin-top: 8rpx; font-size: 30rpx; font-weight: 600;
  &.ok { color: #10B981; }
  &.bad { color: #FF6B6B; }
}
.next-btn {
  max-width: 520rpx; margin: 32rpx auto 0;
  min-height: 96rpx; border-radius: 32rpx;
  background: linear-gradient(135deg, #4ECDC4 0%, #74B9FF 100%);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 12rpx 32rpx rgba(78, 205, 196, 0.3);
  &:active { transform: scale(0.98); }
}
.next-text { color: #FFFFFF; font-size: 34rpx; font-weight: 700; }

/* Result */
.result-card {
  background: #FFFFFF; border-radius: 40rpx; padding: 56rpx 32rpx 40rpx;
  box-shadow: 0 16rpx 56rpx rgba(0,0,0,0.08); text-align: center; margin-top: 24rpx;
}
.result-emoji { font-size: 160rpx; display: block; }
.result-title { font-size: 40rpx; font-weight: 800; color: #1F2937; margin-top: 16rpx; display: block; }
.stats-grid {
  display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16rpx; padding: 24rpx;
  background: linear-gradient(135deg, #FFF9E6 0%, #F0FDFA 100%); border-radius: 28rpx;
}
.stat-item { display: flex; flex-direction: column; align-items: center; gap: 4rpx; }
.stat-value { font-size: 48rpx; font-weight: 800; }
.stat-value.text-coral { color: #FF6B6B; }
.stat-value.text-green { color: #10B981; }
.stat-label { font-size: 24rpx; color: #6B7280; }

.result-actions { display: flex; gap: 20rpx; }
.again-btn, .home-btn {
  flex: 1; min-height: 96rpx; border-radius: 28rpx;
  display: flex; align-items: center; justify-content: center;
  &:active { transform: scale(0.97); }
}
.again-btn {
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
  box-shadow: 0 10rpx 32rpx rgba(255, 107, 107, 0.28);
}
.again-text { color: #FFFFFF; font-weight: 700; font-size: 30rpx; }
.home-btn { background: #F3F4F6; }
.home-text { color: #4B5563; font-weight: 700; font-size: 30rpx; }
</style>
