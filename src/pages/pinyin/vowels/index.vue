<template>
  <view class="vw-bg">
    <view class="vw-hero text-center pt-8 pb-4">
      <image class="vh-icon" src="/static/icons/lettera.svg" mode="aspectFit" />
      <text class="vh-title">韵母学习</text>
      <text class="vh-sub">点击韵母卡片，听一听发音吧！</text>
    </view>

    <view v-for="(cat, key) in categories" :key="key" class="vw-section px-4 mb-8">
      <view class="sec-head flex items-center gap-3 mb-4">
        <image class="sec-icon-img" :src="cat.icon" mode="aspectFit" />
        <text class="sec-name">{{ cat.name }}</text>
        <text class="sec-count">{{ cat.items.length }} 个</text>
      </view>
      <view class="card-grid">
        <view
          v-for="item in cat.items"
          :key="item.pinyin"
          class="vw-card"
          @click="onTap(item)"
          @longpress="onLongPress(item)"
        >
          <text class="vw-pinyin">{{ item.pinyin }}</text>
          <text class="vw-tips">{{ item.tips }}</text>
          <view class="vw-actions">
            <image class="vw-speak-img" src="/static/icons/speaker.svg" mode="aspectFit" />
            <image v-if="isFav(item.pinyin)" class="vw-fav-img on" src="/static/icons/star.svg" mode="aspectFit" />
            <image v-else class="vw-fav-img" src="/static/icons/star.svg" mode="aspectFit" style="opacity:0.25;filter:grayscale(1)" />
          </view>
        </view>
      </view>
    </view>

    <view class="vw-tip px-6 pb-10 text-center">
      <text class="tip-text">长按卡片可以收藏哦</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { vowelCategories } from '@/data/pinyin/vowels'
import type { PinyinItem } from '@/types'
import { speak } from '@/utils/speak'

const store = useAppStore()
const categories = vowelCategories

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
    uni.showToast({ title: '已收藏', icon: 'none', duration: 800 })
  }
}
</script>

<style lang="scss" scoped>
.vw-bg {
  min-height: 100vh;
  background: linear-gradient(180deg, #E0F7F5 0%, #FFF9E6 50%, #F0FDFA 100%);
  padding-bottom: 120rpx;
}
.vw-hero { display: flex; flex-direction: column; align-items: center; gap: 8rpx; }
.vh-icon { width: 100rpx; height: 100rpx; display: block; margin: 0 auto; }
.vh-title { font-size: 52rpx; font-weight: 800; color: #4ECDC4; }
.vh-sub { font-size: 28rpx; color: #6B7280; }

.sec-icon-img { width: 36rpx; height: 36rpx; }
.sec-name { font-size: 32rpx; font-weight: 800; color: #1F2937; }
.sec-count { margin-left: auto; font-size: 24rpx; color: #9CA3AF; }

.card-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 20rpx;
}
.vw-card {
  background: #FFFFFF; border-radius: 28rpx; padding: 28rpx 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(78, 205, 196, 0.08);
  border: 3rpx solid transparent;
  display: flex; flex-direction: column; align-items: center; gap: 12rpx;
  &:active { transform: scale(0.96); border-color: #4ECDC4; }
}
.vw-pinyin { font-size: 64rpx; font-weight: 800; color: #1F2937; }
.vw-tips { font-size: 24rpx; color: #6B7280; text-align: center; line-height: 1.4; }
.vw-actions { display: flex; gap: 24rpx; margin-top: 4rpx; }
.vw-speak-img { width: 32rpx; height: 32rpx; }
.vw-fav-img { width: 32rpx; height: 32rpx; }

.vw-tip { margin-top: 8rpx; }
.tip-text { font-size: 26rpx; color: #9CA3AF; }
</style>
