<template>
  <view
    class="pinyin-card"
    :class="{ active, highlighted }"
    @click="$emit('click')"
  >
    <view class="pinyin-main">
      <text class="pinyin-text" :style="{ color: toneColor }">{{ item.pinyin }}</text>
      <text v-if="showToneLabel" class="tone-label">{{ toneLabel }}</text>
    </view>
    <view v-if="showChars && item.chars && item.chars.length" class="pinyin-chars">
      <text
        v-for="(c, i) in previewChars"
        :key="i"
        class="char-item"
        @click.stop="$emit('char', c)"
      >{{ c.char }}</text>
    </view>
    <view v-if="showTypeLabel" class="type-dot">
      <text class="type-dot-text">{{ typeLabel }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { PinyinItem } from "@/types";

const props = withDefaults(
  defineProps<{
    item: PinyinItem;
    active?: boolean;
    highlighted?: boolean;
    showToneLabel?: boolean;
    showChars?: boolean;
    showTypeLabel?: boolean;
  }>(),
  { active: false, highlighted: false, showToneLabel: true, showChars: true, showTypeLabel: true },
);

defineEmits<{
  click: [];
  char: [char: { char: string; word?: string }];
}>();

const toneColor = computed(() => {
  const tone = props.item.tone;
  if (tone === 1) return "#FF6B6B";
  if (tone === 2) return "#FFD93D";
  if (tone === 3) return "#4ECDC4";
  if (tone === 4) return "#74B9FF";
  return "#9CA3AF";
});

const toneLabel = computed(() => {
  const tone = props.item.tone ?? 0;
  return ["轻声", "一声", "二声", "三声", "四声"][tone] || "";
});

const typeLabel = computed(() => {
  const type = props.item.type;
  if (type === "shengmu") return "声";
  if (type === "yunmu") return "韵";
  if (type === "zhengti") return "整";
  return "拼";
});

const previewChars = computed(
  () => (props.item.chars || []).slice(0, 3),
);
</script>

<style lang="scss" scoped>
.pinyin-card {
  background: #FFFFFF;
  border-radius: 28rpx;
  padding: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.06);
  border: 3rpx solid transparent;
  position: relative;
  transition: all 0.2s ease;
  &:active { transform: scale(0.97); }
  &.active {
    border-color: #FF6B6B;
    background: linear-gradient(135deg, #FFF5F5 0%, #FFE8E8 100%);
    box-shadow: 0 12rpx 36rpx rgba(255,107,107,0.18);
  }
  &.highlighted { border-color: #FFD93D; }
}
.pinyin-main { display: flex; align-items: center; justify-content: space-between; }
.pinyin-text { font-size: 52rpx; font-weight: 800; letter-spacing: 2rpx; }
.tone-label {
  font-size: 22rpx; font-weight: 600; padding: 4rpx 16rpx;
  border-radius: 999rpx; background: #FFF9E6; color: #B45309;
}
.pinyin-chars { display: flex; gap: 16rpx; margin-top: 16rpx; flex-wrap: wrap; }
.char-item {
  padding: 8rpx 20rpx; border-radius: 16rpx;
  background: linear-gradient(135deg, #FFF9E6 0%, #FFF4CC 100%);
  font-size: 36rpx; font-weight: 600; color: #374151;
}
.type-dot {
  position: absolute; top: 12rpx; right: 12rpx;
  width: 40rpx; height: 40rpx; border-radius: 999rpx;
  background: linear-gradient(135deg, #4ECDC4 0%, #3AB8B0 100%);
  display: flex; align-items: center; justify-content: center;
}
.type-dot-text { color: #FFF; font-size: 22rpx; font-weight: 700; }
</style>
