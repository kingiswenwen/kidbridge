<template>
  <view class="in-bg">
    <view class="in-hero text-center pt-8 pb-4">
      <text class="ih-emoji">🔤</text>
      <text class="ih-title">声母学习</text>
      <text class="ih-sub">点击声母卡片，听一听发音吧！</text>
    </view>

    <view v-for="(cat, key) in categories" :key="key" class="in-section px-4 mb-8">
      <view class="sec-head flex items-center gap-3 mb-4">
        <text class="sec-emoji">{{ cat.emoji }}</text>
        <text class="sec-name">{{ cat.name }}</text>
        <text class="sec-count">{{ cat.items.length }} 个</text>
      </view>
      <view class="card-grid">
        <view
          v-for="item in cat.items"
          :key="item.pinyin"
          class="in-card"
          :class="{ flat: item.isFlat, curled: item.isCurled }"
          @click="onTap(item)"
          @longpress="onLongPress(item)"
        >
          <text class="in-pinyin">{{ item.pinyin }}</text>
          <text class="in-tips">{{ item.tips }}</text>
          <view class="in-actions">
            <text class="in-speak">🔊</text>
            <text v-if="isFav(item.pinyin)" class="in-fav on">⭐</text>
            <text v-else class="in-fav">☆</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 平舌 vs 翘舌对比 -->
    <view class="in-section px-4 mb-10">
      <view class="sec-head flex items-center gap-3 mb-4">
        <text class="sec-emoji">⚖️</text>
        <text class="sec-name">平舌音 vs 翘舌音</text>
      </view>
      <view class="compare-card">
        <view v-for="(c, i) in flatVsCurled" :key="i" class="cmp-row">
          <view class="cmp-side flat" @click="speak(c.flat.split(' ')[0])">
            <text class="cmp-py">{{ c.flat }}</text>
            <text class="cmp-label">平舌</text>
          </view>
          <text class="cmp-vs">vs</text>
          <view class="cmp-side curled" @click="speak(c.curled.split(' ')[0])">
            <text class="cmp-py">{{ c.curled }}</text>
            <text class="cmp-label">翘舌</text>
          </view>
        </view>
      </view>
    </view>

    <view class="in-tip px-6 pb-10 text-center">
      <text class="tip-text">💡 长按卡片可以收藏哦</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import { initialCategories, flatVsCurled } from '@/data/pinyin/initials'
import type { PinyinItem } from '@/types'
import { speak } from '@/utils/speak'

const store = useAppStore()
const categories = initialCategories

function isFav(p: string) {
  return store.pinyinFavorites.some((f) => f.pinyin === p)
}

function onTap(item: PinyinItem) {
  speak(item.pinyin)
  store.markPinyinLearned(item.pinyin)
}

function onLongPress(item: PinyinItem) {
  if (isFav(item.pinyin)) {
    store.removePinyinFavorite(item.pinyin)
    uni.showToast({ title: '已取消收藏', icon: 'none', duration: 800 })
  } else {
    store.addPinyinFavorite(item.pinyin)
    uni.showToast({ title: '已收藏 ⭐', icon: 'none', duration: 800 })
  }
}
</script>

<style lang="scss" scoped>
.in-bg {
  min-height: 100vh;
  background: linear-gradient(180deg, #E0F7F5 0%, #FFF9E6 50%, #F0FDFA 100%);
  padding-bottom: 120rpx;
}
.in-hero { display: flex; flex-direction: column; align-items: center; gap: 8rpx; }
.ih-emoji { font-size: 100rpx; }
.ih-title { font-size: 52rpx; font-weight: 800; color: #4ECDC4; }
.ih-sub { font-size: 28rpx; color: #6B7280; }

.sec-emoji { font-size: 36rpx; }
.sec-name { font-size: 32rpx; font-weight: 800; color: #1F2937; }
.sec-count { margin-left: auto; font-size: 24rpx; color: #9CA3AF; }

.card-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 20rpx;
}
.in-card {
  background: #FFFFFF; border-radius: 28rpx; padding: 28rpx 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(78, 205, 196, 0.08);
  border: 3rpx solid transparent;
  display: flex; flex-direction: column; align-items: center; gap: 12rpx;
  &:active { transform: scale(0.96); border-color: #4ECDC4; }
  &.flat { background: linear-gradient(135deg, #F0FDFA 0%, #FFFFFF 100%); }
  &.curled { background: linear-gradient(135deg, #FFF9E6 0%, #FFFFFF 100%); }
}
.in-pinyin { font-size: 64rpx; font-weight: 800; color: #1F2937; }
.in-tips { font-size: 24rpx; color: #6B7280; text-align: center; line-height: 1.4; }
.in-actions { display: flex; gap: 24rpx; margin-top: 4rpx; }
.in-speak { font-size: 32rpx; }
.in-fav { font-size: 32rpx; color: #D1D5DB; &.on { color: #FFD93D; } }

/* Compare */
.compare-card {
  background: #FFFFFF; border-radius: 32rpx; padding: 24rpx;
  box-shadow: 0 8rpx 30rpx rgba(0,0,0,0.05);
}
.cmp-row {
  display: flex; align-items: center; gap: 16rpx; padding: 20rpx 0;
  border-bottom: 2rpx solid #F3F4F6;
  &:last-child { border-bottom: none; }
}
.cmp-side {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8rpx;
  padding: 20rpx; border-radius: 24rpx;
  &.flat { background: linear-gradient(135deg, #E0F7F5 0%, #F0FDFA 100%); }
  &.curled { background: linear-gradient(135deg, #FFF9E6 0%, #FFF4CC 100%); }
  &:active { transform: scale(0.96); }
}
.cmp-py { font-size: 40rpx; font-weight: 800; color: #1F2937; }
.cmp-label { font-size: 22rpx; color: #6B7280; font-weight: 600; }
.cmp-vs { font-size: 24rpx; font-weight: 700; color: #9CA3AF; }

.in-tip { margin-top: 8rpx; }
.tip-text { font-size: 26rpx; color: #9CA3AF; }
</style>
