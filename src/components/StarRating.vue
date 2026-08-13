<template>
  <view class="flex items-center justify-center gap-2">
    <view
      v-for="(_, idx) in maxStars"
      :key="idx"
      :class="['star-item', animated && idx < stars ? 'animate-pop' : '']"
      :style="animated ? `animation-delay: ${idx * 0.2}s;` : ''"
    >
      <text class="star-icon" :class="idx < stars ? 'filled' : 'empty'">★</text>
    </view>
  </view>
</template>

<script lang="ts">
export function calculateStars(correct: number, total: number): number {
  if (total === 0) return 0;
  const p = (correct / total) * 100;
  if (p >= 90) return 3;
  if (p >= 70) return 2;
  if (p >= 50) return 1;
  return 0;
}
</script>

<script setup lang="ts">
withDefaults(
  defineProps<{
    stars: number;
    maxStars?: number;
    animated?: boolean;
  }>(),
  { maxStars: 3, animated: false },
);
</script>

<style lang="scss" scoped>
.star-icon {
  font-size: 56rpx;
  line-height: 1;
  &.filled {
    color: #FFD93D;
    filter: drop-shadow(0 4rpx 8rpx rgba(255, 217, 61, 0.4));
  }
  &.empty { color: #E5E7EB; }
}
@keyframes pop {
  0% { transform: scale(0); }
  70% { transform: scale(1.25); }
  100% { transform: scale(1); }
}
.animate-pop { animation: pop 0.5s ease both; }
</style>
