<template>
  <view class="tb-bg">
    <view class="tb-hero text-center pt-8 pb-4">
      <image class="th-icon" src="/static/icons/clipboard.svg" mode="aspectFit" />
      <text class="th-title">拼音总表</text>
      <text class="th-sub">声母 {{ initials.length }} 个 · 韵母 {{ vowels.length }} 个 · 整体认读 {{ wholeSyllables.length }} 个</text>
    </view>

    <!-- 声母区 -->
    <view class="tb-section px-4 mb-8">
      <view class="sec-head flex items-center gap-3 mb-4">
        <text class="sec-dot" style="background: #4ECDC4"></text>
        <text class="sec-name">声母（{{ initials.length }}）</text>
      </view>
      <view class="tb-grid">
        <view
          v-for="item in initials"
          :key="item.pinyin"
          class="tb-cell initial"
          @click="speak(item.pinyin)"
        >
          <text class="cell-py">{{ item.pinyin }}</text>
        </view>
      </view>
    </view>

    <!-- 韵母区 -->
    <view class="tb-section px-4 mb-8">
      <view class="sec-head flex items-center gap-3 mb-4">
        <text class="sec-dot" style="background: #FF6B6B"></text>
        <text class="sec-name">韵母（{{ vowels.length }}）</text>
      </view>
      <view class="tb-grid">
        <view
          v-for="item in vowels"
          :key="item.pinyin"
          class="tb-cell vowel"
          @click="speak(item.pinyin)"
        >
          <text class="cell-py">{{ item.pinyin }}</text>
        </view>
      </view>
    </view>

    <!-- 整体认读 -->
    <view class="tb-section px-4 mb-8">
      <view class="sec-head flex items-center gap-3 mb-4">
        <text class="sec-dot" style="background: #FFD93D"></text>
        <text class="sec-name">整体认读音节（{{ wholeSyllables.length }}）</text>
      </view>
      <view class="tb-grid">
        <view
          v-for="item in wholeSyllables"
          :key="item.pinyin"
          class="tb-cell whole"
          @click="speak(item.pinyin)"
        >
          <text class="cell-py">{{ item.pinyin }}</text>
        </view>
      </view>
    </view>

    <!-- 四声调 -->
    <view class="tb-section px-4 mb-10">
      <view class="sec-head flex items-center gap-3 mb-4">
        <text class="sec-dot" style="background: #74B9FF"></text>
        <text class="sec-name">四声调</text>
      </view>
      <view class="tone-grid">
        <view
          v-for="t in tones"
          :key="t.tone"
          class="tone-card"
          @click="speak(t.example)"
        >
          <text class="tone-symbol">{{ t.symbol }}</text>
          <text class="tone-mark">{{ t.mark }}</text>
          <text class="tone-name">{{ t.name }}</text>
          <text class="tone-desc">{{ t.desc }}</text>
          <text class="tone-example">{{ t.example }}</text>
        </view>
      </view>
    </view>

    <view class="tb-tip px-6 pb-10 text-center">
      <text class="tip-text">点击任意拼音可听发音</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { allVowels } from '@/data/pinyin/vowels'
import { allInitials } from '@/data/pinyin/initials'
import { wholeSyllables } from '@/data/pinyin/syllables'
import { speak } from '@/utils/speak'

const initials = allInitials
const vowels = allVowels

const tones = [
  { tone: 1, symbol: '—', mark: 'ˉ', name: '一声', desc: '高平调', example: 'mā 妈' },
  { tone: 2, symbol: '/', mark: 'ˊ', name: '二声', desc: '上升调', example: 'má 麻' },
  { tone: 3, symbol: 'V', mark: 'ˇ', name: '三声', desc: '先降后升', example: 'mǎ 马' },
  { tone: 4, symbol: '\\', mark: 'ˋ', name: '四声', desc: '下降调', example: 'mà 骂' },
]
</script>

<style lang="scss" scoped>
.tb-bg {
  min-height: 100vh;
  background: linear-gradient(180deg, #E0F7F5 0%, #FFF9E6 50%, #F0FDFA 100%);
  padding-bottom: 120rpx;
}
.tb-hero { display: flex; flex-direction: column; align-items: center; gap: 8rpx; }
.th-icon { width: 100rpx; height: 100rpx; display: block; margin: 0 auto; }
.th-title { font-size: 52rpx; font-weight: 800; color: #4ECDC4; }
.th-sub { font-size: 26rpx; color: #6B7280; }

.sec-dot {
  width: 20rpx; height: 20rpx; border-radius: 999rpx;
  box-shadow: 0 0 0 6rpx rgba(255, 255, 255, 0.9);
}
.sec-name { font-size: 32rpx; font-weight: 800; color: #1F2937; }

.tb-grid {
  display: grid; grid-template-columns: repeat(5, 1fr); gap: 12rpx;
}
.tb-cell {
  aspect-ratio: 1; border-radius: 20rpx;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4rpx 14rpx rgba(0,0,0,0.04);
  &:active { transform: scale(0.92); }
  &.initial { background: linear-gradient(135deg, #E0F7F5 0%, #D1FAFA 100%); }
  &.vowel { background: linear-gradient(135deg, #FFE5E5 0%, #FFEBEB 100%); }
  &.whole { background: linear-gradient(135deg, #FFF9E6 0%, #FFF4CC 100%); }
}
.cell-py { font-size: 32rpx; font-weight: 800; color: #1F2937; }

/* Tones */
.tone-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16rpx;
}
.tone-card {
  background: #FFFFFF; border-radius: 28rpx; padding: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(116, 185, 255, 0.08);
  display: flex; flex-direction: column; align-items: center; gap: 8rpx;
  &:active { transform: scale(0.96); }
}
.tone-symbol { font-size: 56rpx; font-weight: 800; color: #74B9FF; }
.tone-mark { font-size: 28rpx; color: #6B7280; }
.tone-name { font-size: 28rpx; font-weight: 700; color: #1F2937; }
.tone-desc { font-size: 22rpx; color: #9CA3AF; }
.tone-example { font-size: 32rpx; font-weight: 700; color: #FF6B6B; margin-top: 4rpx; }

.tb-tip { margin-top: 8rpx; }
.tip-text { font-size: 26rpx; color: #9CA3AF; }
</style>
