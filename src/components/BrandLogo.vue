<template>
  <view class="flex items-center" :style="{ gap: showWordmark ? '14rpx' : '0' }">
    <!-- Logo 标记（彩虹桥） -->
    <view
      class="flex items-center justify-center overflow-hidden"
      :class="chip ? 'bg-white shadow-soft' : ''"
      :style="markWrapStyle"
    >
      <svg
        :width="svgSize"
        :height="svgSize"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <!-- 桥面 -->
        <rect x="18" y="84" width="84" height="7" rx="3.5" fill="#FFFFFF" />
        <!-- 彩虹三弧：珊瑚红 / 暖黄 / 薄荷绿 -->
        <path d="M24 86 A36 36 0 0 1 96 86" fill="none" stroke="#FF6B6B" stroke-width="8" stroke-linecap="round" />
        <path d="M34 86 A26 26 0 0 1 86 86" fill="none" stroke="#FFD93D" stroke-width="8" stroke-linecap="round" />
        <path d="M44 86 A16 16 0 0 1 76 86" fill="none" stroke="#4ECDC4" stroke-width="8" stroke-linecap="round" />
        <!-- 桥墩 -->
        <rect x="20" y="86" width="12" height="18" rx="4" fill="#FFFFFF" />
        <rect x="88" y="86" width="12" height="18" rx="4" fill="#FFFFFF" />
        <!-- 小太阳 / 星 -->
        <path
          d="M60 17 L62.70 24.28 L70.46 24.60 L64.37 29.42 L66.46 36.90 L60 32.6 L53.54 36.90 L55.63 29.42 L49.54 24.60 L57.30 24.28 Z"
          fill="#FFD93D"
        />
      </svg>
    </view>

    <!-- 字标 -->
    <view v-if="showWordmark" class="flex flex-col justify-center" :style="{ lineHeight: 1.05 }">
      <view class="flex items-center" :style="{ fontSize: wordSize + 'rpx', fontWeight: 800 }">
        <text :style="{ color: '#FF6B6B' }">Kid</text>
        <text :style="{ color: '#4ECDC4' }">Bridge</text>
      </view>
      <text
        v-if="showSubtitle"
        class="mt-1"
        :style="{ fontSize: subSize + 'rpx', color: subtitleColor, letterSpacing: '2rpx' }"
      >彩虹桥</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    size?: number; // 标记整体尺寸 (rpx)
    chip?: boolean; // 是否包裹白色圆角底
    showWordmark?: boolean;
    showSubtitle?: boolean;
    subtitleColor?: string;
  }>(),
  {
    size: 96,
    chip: false,
    showWordmark: true,
    showSubtitle: true,
    subtitleColor: "#8A94A6",
  }
);

const svgSize = computed(() => (props.chip ? Math.round(props.size * 0.72) : props.size));
const wordSize = computed(() => Math.round(props.size * 0.42));
const subSize = computed(() => Math.round(props.size * 0.2));

const markWrapStyle = computed(() => ({
  width: props.size + "rpx",
  height: props.size + "rpx",
  borderRadius: Math.round(props.size * 0.28) + "rpx",
  padding: props.chip ? Math.round(props.size * 0.14) + "rpx" : "0",
}));
</script>
