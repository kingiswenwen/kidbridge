<template>
  <view class="page-bg">
    <!-- 进度条 -->
    <view v-if="state === 'practice'" class="px-4 pt-4">
      <ProgressBar
        :current="currentIndex + 1"
        :total="questions.length"
        :correct="correctCount"
      />
    </view>

    <!-- 阶段一：选择题型 -->
    <view v-if="state === 'select'" class="stage">
      <view class="hero text-center pt-8">
        <text class="hero-emoji">🧮</text>
        <text class="hero-title">数学练习</text>
        <text class="hero-subtitle">选择今天要练习的内容吧！</text>
      </view>

      <view class="type-grid">
        <view
          v-for="t in types"
          :key="t.key"
          class="type-card"
          :class="{ selected: selectedTypes.includes(t.key) }"
          @click="toggleType(t.key)"
        >
          <text class="type-emoji">{{ t.emoji }}</text>
          <view class="type-info">
            <text class="type-name">{{ t.label }}</text>
            <text class="type-desc">{{ t.desc }}</text>
          </view>
          <view :class="['check', selectedTypes.includes(t.key) ? 'checked' : '']">
            <text v-if="selectedTypes.includes(t.key)" class="check-text">✓</text>
          </view>
        </view>
      </view>

      <view class="action-row">
        <view class="count-picker flex items-center justify-center gap-4 mb-6">
          <text class="text-gray-600 text-sm">题目数量</text>
          <view
            v-for="n in [5, 10, 20]"
            :key="n"
            :class="['count-chip', n === count ? 'active' : '']"
            @click="count = n"
          >
            <text class="count-chip-text">{{ n }} 题</text>
          </view>
        </view>
        <view
          :class="['start-btn', selectedTypes.length === 0 ? 'disabled' : '']"
          @click="selectedTypes.length && startPractice()"
        >
          <text class="start-text">🚀 开始练习</text>
        </view>
      </view>
    </view>

    <!-- 阶段二：答题 -->
    <view v-else-if="state === 'practice'" class="stage px-4 pb-32 pt-4">
      <view v-if="currentQuestion">
        <QuestionCard
          :question="currentQuestion"
          :selected-answer="selectedAnswer"
          :is-answered="isAnswered"
          @answer="handleAnswer"
        />

        <!-- 非选项题用 NumberPad：wordProblem / 部分 mixed -->
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

        <!-- 答题反馈 + 下一题 -->
        <view v-if="isAnswered" class="feedback text-center mt-8">
          <text :class="['fb-emoji', lastCorrect ? 'right' : 'wrong']">
            {{ lastCorrect ? '🎉' : '😿' }}
          </text>
          <text :class="['fb-text', lastCorrect ? 'right' : 'wrong']">
            {{ lastCorrect ? encouragementText : ('正确答案是 ' + String(currentQuestion.answer)) }}
          </text>
          <view class="next-btn" @click="nextQuestion">
            <text class="next-text">
              {{ currentIndex + 1 === questions.length ? '🏆 查看成绩' : '下一题 →' }}
            </text>
          </view>
        </view>
      </view>
    </view>

    <!-- 阶段三：结算 -->
    <view v-else-if="state === 'result'" class="stage px-6 pt-10">
      <view class="result-card">
        <text class="result-emoji">{{ resultStars === 3 ? '🏆' : resultStars === 2 ? '🎉' : resultStars === 1 ? '💪' : '🌈' }}</text>
        <text class="result-title">{{ resultTitle }}</text>

        <view class="mt-6">
          <StarRating :stars="resultStars" :animated="true" />
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
          <view class="again-btn" @click="reset()">
            <text class="again-text">🔄 再练一组</text>
          </view>
          <view class="home-btn" @click="goHome">
            <text class="home-text">🏠 回首页</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useAppStore } from "@/stores/app";
import type { Question, QuestionType } from "@/types";
import { generateQuestions, checkAnswer } from "@/utils/questionGenerator";
import ProgressBar from "@/components/ProgressBar.vue";
import QuestionCard from "@/components/QuestionCard.vue";
import NumberPad from "@/components/NumberPad.vue";
import StarRating, { calculateStars } from "@/components/StarRating.vue";
import { encouragement as encouragements } from "@/data/encouragements";

const store = useAppStore();

// 题型清单
const types: { key: QuestionType; label: string; desc: string; emoji: string }[] = [
  { key: "addition10", label: "10 以内加法", desc: "3+5=8 入门必练", emoji: "➕" },
  { key: "subtraction10", label: "10 以内减法", desc: "9-4=5 打好基础", emoji: "➖" },
  { key: "mixed10", label: "10 以内混合", desc: "含填空题：?+3=7", emoji: "🎲" },
  { key: "addition20", label: "20 以内加法", desc: "9+8=17 进阶", emoji: "🔢" },
  { key: "subtraction20", label: "20 以内减法", desc: "17-9=8 进阶", emoji: "🔻" },
  { key: "mixed20", label: "20 以内混合", desc: "连加连减：3+4-2", emoji: "🌀" },
  { key: "decompose", label: "数的分解组合", desc: "10 可以分成 ? 和 4", emoji: "🧩" },
  { key: "adjacent", label: "相邻数/邻居", desc: "5 的前面是？", emoji: "🏠" },
  { key: "compare", label: "比大小", desc: "7 ○ 10 填 > < =", emoji: "⚖️" },
  { key: "wordProblem", label: "生活应用题", desc: "小明有 5 个苹果…", emoji: "📖" },
  { key: "counting", label: "数一数", desc: "看图数图形数量", emoji: "🍎" },
  { key: "sequence", label: "排序找规律", desc: "1 2 ? 4 5 填一填", emoji: "🚂" },
];

const selectedTypes = ref<QuestionType[]>(["addition10", "subtraction10"]);
const count = ref<number>(10);

const state = ref<"select" | "practice" | "result">("select");
const questions = ref<Question[]>([]);
const currentIndex = ref(0);
const selectedAnswer = ref<number | string | null>(null);
const isAnswered = ref(false);
const correctCount = ref(0);
const lastCorrect = ref(false);
const draftAnswer = ref("");

const currentQuestion = computed(() => questions.value[currentIndex.value] || null);
const useNumberPad = computed(() => {
  // wordProblem 以及题目本身没有 options 的时候用 NumberPad
  const q = currentQuestion.value;
  if (!q) return false;
  return !q.options || q.options.length === 0;
});

const toggleType = (k: QuestionType) => {
  const i = selectedTypes.value.indexOf(k);
  if (i >= 0) selectedTypes.value.splice(i, 1);
  else selectedTypes.value.push(k);
};

const pickOne = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const encouragementText = computed(() => pickOne(encouragements).content);

const startPractice = () => {
  questions.value = generateQuestions(selectedTypes.value, count.value);
  currentIndex.value = 0;
  selectedAnswer.value = null;
  isAnswered.value = false;
  correctCount.value = 0;
  draftAnswer.value = "";
  state.value = "practice";
};

const handleAnswer = (ans: number | string) => {
  if (isAnswered.value || !currentQuestion.value) return;
  selectedAnswer.value = ans;
  isAnswered.value = true;

  const ok = checkAnswer(currentQuestion.value, ans);
  lastCorrect.value = ok;
  if (ok) correctCount.value += 1;
  else {
    // 记入错题本
    store.addWrong({
      ...currentQuestion.value,
      timestamp: Date.now(),
    });
  }
};

const onNum = (n: number) => {
  if (isAnswered.value) return;
  draftAnswer.value = String(Number(draftAnswer.value + String(n)));
};

const nextQuestion = () => {
  if (currentIndex.value + 1 >= questions.value.length) {
    // 同步进度到 store（总做对 / 总做题）
    store.addProgress({
      totalDone: questions.value.length,
      totalCorrect: correctCount.value,
    });
    state.value = "result";
  } else {
    currentIndex.value += 1;
    selectedAnswer.value = null;
    isAnswered.value = false;
    draftAnswer.value = "";
  }
};

const correctRate = computed(() =>
  questions.value.length ? Math.round((correctCount.value / questions.value.length) * 100) : 0,
);
const resultStars = computed(() =>
  calculateStars(correctCount.value, questions.value.length),
);
const resultTitle = computed(() => {
  if (resultStars.value === 3) return "太棒啦，全部都会！";
  if (resultStars.value === 2) return "做得不错，继续加油！";
  if (resultStars.value === 1) return "有进步，再来一次？";
  return "别灰心，多练就会啦！";
});

const reset = () => {
  state.value = "select";
};
const goHome = () => {
  uni.switchTab({ url: "/pages/home/index" });
};
</script>

<style lang="scss" scoped>
.page-bg {
  min-height: 100vh;
  background: linear-gradient(180deg, #FFF9E6 0%, #FFE8F0 50%, #E0F7F5 100%);
  padding-bottom: 120rpx;
}
.stage { max-width: 860rpx; margin: 0 auto; }

/* Hero */
.hero { display: flex; flex-direction: column; align-items: center; gap: 12rpx; }
.hero-emoji { font-size: 120rpx; }
.hero-title { font-size: 56rpx; font-weight: 800; color: #FF6B6B; }
.hero-subtitle { font-size: 28rpx; color: #6B7280; }

/* Type grid */
.type-grid {
  padding: 40rpx 32rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}
.type-card {
  background: #FFFFFF;
  border-radius: 28rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  box-shadow: 0 6rpx 18rpx rgba(0,0,0,0.05);
  border: 3rpx solid transparent;
  transition: all 0.2s ease;
  &:active { transform: scale(0.97); }
  &.selected {
    border-color: #FF6B6B;
    background: linear-gradient(135deg, #FFF5F5 0%, #FFEBEB 100%);
    box-shadow: 0 8rpx 28rpx rgba(255, 107, 107, 0.18);
  }
}
.type-emoji { font-size: 52rpx; }
.type-info { flex: 1; display: flex; flex-direction: column; gap: 4rpx; min-width: 0; }
.type-name { font-size: 28rpx; font-weight: 700; color: #1F2937; }
.type-desc { font-size: 22rpx; color: #9CA3AF; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.check {
  width: 40rpx; height: 40rpx; border-radius: 999rpx;
  border: 3rpx solid #E5E7EB; background: #FFFFFF;
  display: flex; align-items: center; justify-content: center;
  &.checked { background: #FF6B6B; border-color: #FF6B6B; }
}
.check-text { color: #FFF; font-size: 24rpx; font-weight: 700; }

/* Action row */
.action-row { padding: 0 32rpx 40rpx; }
.count-chip {
  padding: 16rpx 32rpx;
  border-radius: 999rpx;
  background: #FFFFFF;
  box-shadow: 0 4rpx 14rpx rgba(0,0,0,0.05);
  &.active {
    background: linear-gradient(135deg, #FF6B6B 0%, #FF8A8A 100%);
    .count-chip-text { color: #FFF; }
  }
}
.count-chip-text { font-size: 26rpx; font-weight: 700; color: #4B5563; }

.start-btn {
  min-height: 100rpx;
  border-radius: 32rpx;
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 12rpx 36rpx rgba(255, 107, 107, 0.32);
  &.disabled { opacity: 0.5; }
  &:active { transform: scale(0.98); }
}
.start-text { color: #FFFFFF; font-size: 36rpx; font-weight: 800; }

/* Answer display */
.answer-box {
  padding: 16rpx 0;
}
.answer-display {
  display: inline-block;
  min-width: 120rpx;
  padding: 12rpx 32rpx;
  border-radius: 20rpx;
  background: #FFFFFF;
  border: 3rpx dashed #FFD93D;
  font-size: 56rpx; font-weight: 800; color: #FF6B6B;
}

/* Feedback */
.feedback { padding: 16rpx 0; }
.fb-emoji { font-size: 80rpx; display: block; }
.fb-text {
  display: block;
  margin-top: 8rpx;
  font-size: 30rpx; font-weight: 600;
  &.right { color: #10B981; }
  &.wrong { color: #FF6B6B; }
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
  background: #FFFFFF;
  border-radius: 40rpx;
  padding: 56rpx 32rpx 40rpx;
  box-shadow: 0 16rpx 56rpx rgba(0,0,0,0.08);
  text-align: center;
  margin-top: 24rpx;
}
.result-emoji { font-size: 160rpx; display: block; }
.result-title { font-size: 40rpx; font-weight: 800; color: #1F2937; margin-top: 16rpx; display: block; }
.stats-grid {
  display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16rpx;
  padding: 24rpx;
  background: linear-gradient(135deg, #FFF9E6 0%, #F0FDFA 100%);
  border-radius: 28rpx;
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
