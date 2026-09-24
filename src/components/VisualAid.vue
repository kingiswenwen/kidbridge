<template>
  <view class="visual-aid">
    <!-- 数点：加法/拆数用 -->
    <view v-if="visual.type === 'dots'" class="dots-wrap">
      <text
        v-for="(_, i) in visual.count!"
        :key="i"
        class="dot"
        :style="{ animationDelay: `${i * 0.04}s` }"
      >●</text>
    </view>

    <!-- 小木棒 -->
    <view v-else-if="visual.type === 'sticks'" class="sticks-wrap">
      <view
        v-for="(_, i) in visual.count!"
        :key="i"
        class="stick"
        :style="{ animationDelay: `${i * 0.04}s` }"
      />
    </view>

    <!-- 数字线 -->
    <view v-else-if="visual.type === 'numberLine' && visual.range" class="number-line">
      <text
        v-for="n in range(visual.range[0], visual.range[1])"
        :key="n"
        :class="['nl-item', n === highlightNum ? 'highlight' : '']"
      >{{ n }}</text>
    </view>

    <!-- 图形数数 -->
    <view v-else-if="visual.type === 'fruits'" class="fruits-wrap">
      <text
        v-for="(item, i) in visual.items!"
        :key="i"
        class="fruit-item"
        :style="{ animationDelay: `${i * 0.05}s` }"
      >{{ item }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { VisualConfig } from "@/types";

const props = defineProps<{
  visual: VisualConfig;
  highlightNum?: number;
}>();

const range = (a: number, b: number) =>
  Array.from({ length: b - a + 1 }, (_, i) => a + i);
</script>

<style lang="scss" scoped>
.visual-aid {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16rpx;
  background: linear-gradient(135deg, #FFF9E6 0%, #FFFCF5 100%);
  border-radius: 24rpx;
  border: 2rpx dashed #FFE4A3;
}

/* Dots */
.dots-wrap { display: flex; flex-wrap: wrap; gap: 12rpx; justify-content: center; max-width: 100%; padding: 16rpx; }
.dot { font-size: 38rpx; color: #FF6B6B; animation: pop 0.35s ease both; }

/* Sticks */
.sticks-wrap { display: flex; gap: 8rpx; padding: 24rpx; flex-wrap: wrap; justify-content: center; }
.stick {
  width: 10rpx; height: 80rpx; border-radius: 6rpx;
  background: linear-gradient(180deg, #D4A373 0%, #B08968 100%);
  box-shadow: inset -2rpx 0 0 rgba(0,0,0,0.12);
  animation: pop 0.35s ease both;
}

/* Number line */
.number-line { display: flex; gap: 12rpx; padding: 16rpx; flex-wrap: wrap; justify-content: center; }
.nl-item {
  width: 64rpx; height: 64rpx; border-radius: 16rpx;
  display: flex; align-items: center; justify-content: center;
  background: #FFF; border: 2rpx solid #E5E7EB;
  font-size: 28rpx; font-weight: 600; color: #4B5563;
  &.highlight { background: #FF6B6B; color: #FFF; border-color: #FF6B6B; transform: scale(1.1); }
}

/* Fruits */
.fruits-wrap { display: flex; flex-wrap: wrap; gap: 12rpx; justify-content: center; padding: 16rpx; max-width: 100%; }
.fruit-item { font-size: 44rpx; animation: pop 0.35s ease both; }

@keyframes pop {
  0% { transform: scale(0); opacity: 0; }
  70% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
</style>
