<template>
  <view class="sp-bg">
    <view class="sp-hero text-center pt-8 pb-4">
      <text class="sh-emoji">🧩</text>
      <text class="sh-title">拼音拼读</text>
      <text class="sh-sub">声母 + 韵母 = 音节，点一点听拼读！</text>
    </view>

    <!-- Tab 切换 -->
    <view class="tab-row px-4 mb-6">
      <view
        :class="['tab-chip', tab === 'two' ? 'active' : '']"
        @click="tab = 'two'"
      >
        <text class="tab-text">两拼音节</text>
      </view>
      <view
        :class="['tab-chip', tab === 'three' ? 'active' : '']"
        @click="tab = 'three'"
      >
        <text class="tab-text">三拼音节</text>
      </view>
    </view>

    <!-- 声母选择条 -->
    <view class="initial-strip px-4 mb-4">
      <scroll-view scroll-x :show-scrollbar="false">
        <view class="strip-inner">
          <view
            v-for="ini in currentInitials"
            :key="ini"
            :class="['strip-chip', selectedInitial === ini ? 'active' : '']"
            @click="selectedInitial = ini"
          >
            <text class="strip-text">{{ ini }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 当前声母的拼读卡片 -->
    <view class="sp-list px-4 pb-10">
      <view
        v-for="(item, i) in currentExamples"
        :key="i"
        class="sp-card"
        @click="speak(item.result)"
      >
        <view class="sp-formula">
          <text class="sp-part initial">{{ item.initial }}</text>
          <text v-if="item.medial" class="sp-plus">+</text>
          <text v-if="item.medial" class="sp-part medial">{{ item.medial }}</text>
          <text class="sp-plus">+</text>
          <text class="sp-part final">{{ item.final }}</text>
          <text class="sp-equals">=</text>
        </view>
        <view class="sp-result">
          <text class="sp-syllable">{{ item.result }}</text>
          <text class="sp-char">{{ item.char }}</text>
        </view>
        <view class="sp-speak-btn">
          <text class="sp-speak-icon">🔊</text>
        </view>
      </view>

      <view v-if="currentExamples.length === 0" class="empty-state text-center py-10">
        <text class="empty-emoji">🔍</text>
        <text class="empty-text">该声母暂无拼读示例</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { twoSpellExamples, threeSpellExamples } from '@/data/pinyin/syllables'
import { speak } from '@/utils/speak'

const tab = ref<'two' | 'three'>('two')

const currentList = computed(() =>
  tab.value === 'two' ? twoSpellExamples : threeSpellExamples,
)

const currentInitials = computed(() => {
  const set = new Set(currentList.value.map((e) => e.initial))
  return Array.from(set)
})

const selectedInitial = ref('b')

const currentExamples = computed(() =>
  currentList.value.filter((e) => e.initial === selectedInitial.value),
)
</script>

<style lang="scss" scoped>
.sp-bg {
  min-height: 100vh;
  background: linear-gradient(180deg, #E0F7F5 0%, #FFF9E6 50%, #FCE7F3 100%);
  padding-bottom: 120rpx;
}
.sp-hero { display: flex; flex-direction: column; align-items: center; gap: 8rpx; }
.sh-emoji { font-size: 100rpx; }
.sh-title { font-size: 52rpx; font-weight: 800; color: #4ECDC4; }
.sh-sub { font-size: 28rpx; color: #6B7280; }

/* Tabs */
.tab-row { display: flex; gap: 16rpx; }
.tab-chip {
  flex: 1; padding: 20rpx 0; border-radius: 28rpx;
  background: #FFFFFF; box-shadow: 0 4rpx 14rpx rgba(0,0,0,0.05);
  display: flex; align-items: center; justify-content: center;
  &.active {
    background: linear-gradient(135deg, #4ECDC4 0%, #74B9FF 100%);
    .tab-text { color: #FFFFFF; }
  }
}
.tab-text { font-size: 30rpx; font-weight: 700; color: #4B5563; }

/* Initial strip */
.strip-inner { display: flex; gap: 12rpx; padding: 4rpx; }
.strip-chip {
  flex-shrink: 0; width: 80rpx; height: 80rpx; border-radius: 20rpx;
  background: #FFFFFF; box-shadow: 0 4rpx 14rpx rgba(0,0,0,0.05);
  display: flex; align-items: center; justify-content: center;
  &.active {
    background: linear-gradient(135deg, #4ECDC4 0%, #3AB8B0 100%);
    .strip-text { color: #FFFFFF; }
  }
}
.strip-text { font-size: 36rpx; font-weight: 800; color: #1F2937; }

/* Spell card */
.sp-card {
  background: #FFFFFF; border-radius: 28rpx; padding: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(78, 205, 196, 0.08);
  margin-bottom: 16rpx;
  display: flex; align-items: center; gap: 16rpx;
  &:active { transform: scale(0.97); }
}
.sp-formula { display: flex; align-items: center; gap: 8rpx; flex: 1; }
.sp-part {
  padding: 8rpx 16rpx; border-radius: 16rpx; font-size: 32rpx; font-weight: 800;
  &.initial { background: #E0F7F5; color: #0F766E; }
  &.medial { background: #FEF3C7; color: #B45309; }
  &.final { background: #DBEAFE; color: #1E40AF; }
}
.sp-plus { font-size: 24rpx; color: #9CA3AF; font-weight: 700; }
.sp-equals { font-size: 24rpx; color: #9CA3AF; font-weight: 700; }
.sp-result { display: flex; flex-direction: column; align-items: center; gap: 4rpx; }
.sp-syllable { font-size: 40rpx; font-weight: 800; color: #FF6B6B; }
.sp-char { font-size: 32rpx; font-weight: 700; color: #1F2937; }
.sp-speak-btn {
  width: 64rpx; height: 64rpx; border-radius: 999rpx;
  background: linear-gradient(135deg, #4ECDC4 0%, #74B9FF 100%);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.sp-speak-icon { font-size: 28rpx; }

/* Empty */
.empty-emoji { font-size: 80rpx; display: block; }
.empty-text { font-size: 28rpx; color: #9CA3AF; margin-top: 12rpx; display: block; }
</style>
