<template>
  <view class="w-full mb-8">
    <view class="flex justify-between items-center mb-3">
      <text class="text-sm font-semibold text-gray-600">
        第 {{ current }} / {{ total }} 题
      </text>
      <text
        v-if="showCorrect && answeredCount > 0"
        class="text-sm font-semibold text-green-600"
      >
        正确率：{{ correctRate }}%
      </text>
    </view>

    <view class="progress-track" role="progressbar" aria-label="答题进度" :aria-valuemin="0" :aria-valuemax="total" :aria-valuenow="answeredCount">
      <view class="progress-fill" :style="{ width: `${percentage}%` }" />
      <text class="progress-label">{{ Math.round(percentage) }}%</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    current: number;
    total: number;
    correct: number;
    answeredCount: number;
    showCorrect?: boolean;
  }>(),
  { showCorrect: true },
);

const percentage = computed(() =>
  props.total > 0 ? (props.answeredCount / props.total) * 100 : 0,
);
const correctRate = computed(() =>
  props.answeredCount > 0 ? Math.round((props.correct / props.answeredCount) * 100) : 0,
);
</script>

<style lang="scss" scoped>
.progress-track {
  position: relative;
  width: 100%;
  height: 40rpx;
  background: #F3F4F6;
  border-radius: 999rpx;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  min-width: 0;
  background: linear-gradient(90deg, #FF6B6B 0%, #FFD93D 100%);
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 16rpx;
  transition: width 0.5s ease;
}
.progress-label { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 22rpx; font-weight: 700; color: var(--kb-text, #293344); }
@media (prefers-reduced-motion: reduce) { .progress-fill { transition: none; } }
</style>
