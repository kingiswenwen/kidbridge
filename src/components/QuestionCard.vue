<template>
  <view class="q-card">
    <!-- 顶部：题型标签 + 朗读 -->
    <view class="q-header">
      <view class="q-badge">{{ questionTypeLabels[question.type] || '数学' }}</view>
      <view class="q-speak-btn" @click="handleSpeak">
        <text class="speak-icon">🔊</text>
      </view>
    </view>

    <!-- 题干渲染 -->
    <view class="q-body">
      <!-- compare -->
      <template v-if="question.type === 'compare'">
        <view class="compare-row">
          <text class="compare-num c-blue">{{ question.num1 }}</text>
          <text class="compare-circle">○</text>
          <text class="compare-num c-green">{{ question.num2 }}</text>
        </view>
      </template>

      <!-- decompose -->
      <template v-else-if="question.type === 'decompose'">
        <view class="decompose-wrap text-center">
          <text class="decompose-total">{{ question.num1 }}</text>
          <view class="decompose-row flex items-center justify-center gap-2 flex-wrap mt-2">
            <text class="decompose-label">可以分成</text>
            <template v-if="contentHasQuestionAnd">
              <text class="decompose-q">?</text>
              <text class="decompose-label">和</text>
              <text class="decompose-num c-green">{{ question.num2 }}</text>
            </template>
            <template v-else>
              <text class="decompose-num c-green">{{ question.num2 }}</text>
              <text class="decompose-label">和</text>
              <text class="decompose-q">?</text>
            </template>
          </view>
        </view>
      </template>

      <!-- sequence -->
      <template v-else-if="question.type === 'sequence'">
        <text class="sequence-hint text-center block mb-3 text-gray-500">按顺序填数</text>
        <view class="sequence-row flex items-center justify-center gap-2 flex-wrap">
          <view
            v-for="(part, idx) in sequenceParts"
            :key="idx"
            :class="['seq-cell', part === '?' ? 'is-q' : 'is-n']"
          >
            <text>{{ part }}</text>
          </view>
        </view>
      </template>

      <!-- 其他：通用大字 -->
      <template v-else>
        <view class="q-general text-center">
          <text
            v-for="(ch, i) in question.content.split('')"
            :key="i"
            :class="['q-char', ch === '?' ? 'is-q' : '']"
          >{{ ch }}</text>
        </view>
      </template>
    </view>

    <!-- 视觉辅助 -->
    <view v-if="question.visual" class="mt-4">
      <VisualAid
        :visual="question.visual"
        :highlight-num="(question.num1 ?? undefined) as number | undefined"
      />
    </view>

    <!-- 选项 -->
    <view v-if="question.options" class="mt-4">
      <text class="block text-center text-gray-500 mb-3 text-sm">
        👇 点击选择正确答案
      </text>
      <view class="options-grid grid grid-cols-2 gap-3">
        <OptionButton
          v-for="(opt, i) in question.options"
          :key="String(opt) + i"
          :value="opt"
          :disabled="isAnswered"
          :is-selected="selectedAnswer === opt"
          :is-correct="getIsCorrect(opt)"
          @click="$emit('answer', opt)"
        />
      </view>
    </view>

    <!-- compare 选项特殊：三列 -->
    <view v-else-if="question.type === 'compare'" class="mt-4">
      <view class="options-grid grid grid-cols-3 gap-3">
        <OptionButton
          v-for="opt in ['>', '<', '=']"
          :key="opt"
          :value="opt"
          :disabled="isAnswered"
          :is-selected="selectedAnswer === opt"
          :is-correct="getIsCorrect(opt)"
          @click="$emit('answer', opt)"
        />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Question } from "@/types";
import OptionButton from "@/components/OptionButton.vue";
import VisualAid from "@/components/VisualAid.vue";

const props = defineProps<{
  question: Question;
  selectedAnswer: number | string | null;
  isAnswered: boolean;
}>();

defineEmits<{
  answer: [value: number | string];
}>();

const questionTypeLabels: Record<string, string> = {
  addition10: "10以内加法",
  subtraction10: "10以内减法",
  mixed10: "混合运算",
  addition20: "20以内加法",
  subtraction20: "20以内减法",
  mixed20: "混合运算",
  decompose: "拆数游戏",
  adjacent: "找邻居",
  compare: "比大小",
  wordProblem: "生活应用",
  counting: "数一数",
  sequence: "排排序",
};

const contentHasQuestionAnd = computed(() =>
  /\?\s*和/.test(props.question.content),
);

const sequenceParts = computed(() => {
  const raw = props.question.content
    .replace("按顺序填数：", "")
    .replace("倒着数：", "")
    .replace("隔一个数：", "");
  return raw.split(" , ").map((s) => s.trim());
});

const getIsCorrect = (opt: number | string): boolean | null => {
  if (!props.isAnswered) return null;
  if (String(opt) === String(props.question.answer)) return true;
  if (props.selectedAnswer === opt) return false;
  return null;
};

const handleSpeak = () => {
  // 优先 webSpeech (H5)，没有就用系统级 uni.showToast 提示
  // #ifdef H5
  try {
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(
        props.question.content.replace(/\?/g, "多少").replace(/○/g, "和"),
      );
      u.lang = "zh-CN";
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
      return;
    }
  } catch (e) {}
  // #endif
  uni.showToast({ title: "🔊 朗读", icon: "none", duration: 600 });
};
</script>

<style lang="scss" scoped>
.q-card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 36rpx;
  padding: 32rpx;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.06);
  border: 2rpx solid rgba(255, 255, 255, 0.8);
}
.q-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24rpx; }
.q-badge {
  padding: 8rpx 24rpx; border-radius: 999rpx;
  background: #FFE4E6; color: #FF6B6B;
  font-size: 24rpx; font-weight: 600;
}
.q-speak-btn {
  width: 72rpx; height: 72rpx; border-radius: 20rpx;
  background: #FFF0F5; display: flex; align-items: center; justify-content: center;
  &:active { transform: scale(0.92); }
}
.speak-icon { font-size: 36rpx; }

.q-body { min-height: 180rpx; display: flex; align-items: center; justify-content: center; padding: 16rpx 0; }

/* compare */
.compare-row { display: flex; align-items: center; gap: 32rpx; }
.compare-num { font-size: 84rpx; font-weight: 800; line-height: 1; }
.compare-num.c-blue { color: #3B82F6; }
.compare-num.c-green { color: #10B981; }
.compare-circle { font-size: 56rpx; color: #9CA3AF; }

/* decompose */
.decompose-total { font-size: 96rpx; font-weight: 800; color: #FF6B6B; line-height: 1; }
.decompose-label { font-size: 32rpx; color: #6B7280; }
.decompose-num { font-size: 48rpx; font-weight: 700; padding: 8rpx 24rpx; border-radius: 16rpx; }
.decompose-num.c-green { color: #10B981; background: #D1FAE5; }
.decompose-q {
  font-size: 48rpx; font-weight: 700; padding: 8rpx 24rpx;
  border-radius: 16rpx; background: #FFEDD5; color: #F97316;
  border: 2rpx dashed #FCD34D;
}

/* sequence */
.seq-cell {
  width: 88rpx; height: 88rpx; border-radius: 20rpx;
  display: flex; align-items: center; justify-content: center;
  font-size: 40rpx; font-weight: 700;
  &.is-n { background: #CCFBF1; color: #0F766E; }
  &.is-q { background: #FFEDD5; color: #F97316; border: 3rpx dashed #FCD34D; }
}
.sequence-hint { font-size: 26rpx; }

/* general */
.q-general { line-height: 1.5; }
.q-char {
  font-size: 56rpx; font-weight: 700; color: #1F2937;
  display: inline-block;
  &.is-q {
    background: #FFEDD5; color: #F97316;
    padding: 0 16rpx; border-radius: 16rpx; margin: 0 4rpx;
  }
}

.options-grid { margin-top: 8rpx; }
</style>
