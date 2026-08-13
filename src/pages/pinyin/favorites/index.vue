<template>
  <view class="fv-bg">
    <view class="fv-hero text-center pt-8 pb-4">
      <text class="fh-emoji">⭐</text>
      <text class="fh-title">我的收藏</text>
      <text class="fh-sub">{{ favorites.length }} 个已收藏的拼音</text>
    </view>

    <view v-if="favorites.length > 0" class="fv-list px-4 pb-10">
      <view class="fv-card" v-for="fav in favorites" :key="fav.pinyin">
        <view class="fv-main" @click="speak(fav.pinyin)">
          <text class="fv-pinyin">{{ fav.pinyin }}</text>
          <view class="fv-speak">
            <text class="fv-speak-icon">🔊</text>
          </view>
        </view>
        <view class="fv-meta">
          <text class="fv-date">{{ formatDate(fav.addedAt) }}</text>
          <view class="fv-remove" @click="remove(fav.pinyin)">
            <text class="fv-remove-text">取消收藏</text>
          </view>
        </view>
      </view>

      <view class="fv-clear mt-6" @click="clearAll">
        <text class="fv-clear-text">🗑️ 清空全部收藏</text>
      </view>
    </view>

    <view v-else class="fv-empty text-center py-20">
      <text class="empty-emoji">📭</text>
      <text class="empty-title">还没有收藏</text>
      <text class="empty-sub">在声母/韵母学习页长按卡片即可收藏</text>
      <view class="empty-btn mt-8" @click="goLearn">
        <text class="empty-btn-text">去学习拼音</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { speak } from '@/utils/speak'

const store = useAppStore()

const favorites = computed(() =>
  [...store.pinyinFavorites].sort((a, b) => b.addedAt - a.addedAt),
)

function formatDate(ts: number) {
  const d = new Date(ts)
  return `${d.getMonth() + 1}月${d.getDate()}日收藏`
}

function remove(p: string) {
  store.removePinyinFavorite(p)
  uni.showToast({ title: '已取消收藏', icon: 'none', duration: 800 })
}

function clearAll() {
  uni.showModal({
    title: '清空收藏',
    content: '确定要清空所有收藏的拼音吗？',
    success: (r) => {
      if (r.confirm) {
        store.pinyinFavorites = []
        uni.showToast({ title: '已清空', icon: 'none' })
      }
    },
  })
}

function goLearn() {
  uni.navigateTo({ url: '/pages/pinyin/index' })
}
</script>

<style lang="scss" scoped>
.fv-bg {
  min-height: 100vh;
  background: linear-gradient(180deg, #FFF9E6 0%, #FFE8F0 50%, #E0F7F5 100%);
  padding-bottom: 120rpx;
}
.fv-hero { display: flex; flex-direction: column; align-items: center; gap: 8rpx; }
.fh-emoji { font-size: 100rpx; }
.fh-title { font-size: 52rpx; font-weight: 800; color: #D97706; }
.fh-sub { font-size: 28rpx; color: #6B7280; }

.fv-card {
  background: #FFFFFF; border-radius: 28rpx; padding: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(255, 217, 61, 0.08);
  margin-bottom: 16rpx;
  border: 3rpx solid #FFF9E6;
}
.fv-main {
  display: flex; align-items: center; justify-content: space-between;
  &:active { transform: scale(0.98); }
}
.fv-pinyin { font-size: 56rpx; font-weight: 800; color: #1F2937; }
.fv-speak {
  width: 64rpx; height: 64rpx; border-radius: 999rpx;
  background: linear-gradient(135deg, #FFD93D 0%, #FF8E53 100%);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6rpx 20rpx rgba(255, 217, 61, 0.3);
}
.fv-speak-icon { font-size: 28rpx; }
.fv-meta { display: flex; align-items: center; justify-content: space-between; margin-top: 16rpx; }
.fv-date { font-size: 24rpx; color: #9CA3AF; }
.fv-remove {
  padding: 10rpx 24rpx; border-radius: 999rpx; background: #FEF2F2;
}
.fv-remove-text { font-size: 24rpx; color: #EF4444; font-weight: 600; }

.fv-clear {
  text-align: center; padding: 24rpx; border-radius: 28rpx;
  background: #FEF2F2; border: 2rpx dashed #FCA5A5;
  &:active { transform: scale(0.98); }
}
.fv-clear-text { font-size: 28rpx; color: #EF4444; font-weight: 600; }

/* Empty */
.fv-empty { display: flex; flex-direction: column; align-items: center; gap: 12rpx; }
.empty-emoji { font-size: 120rpx; }
.empty-title { font-size: 36rpx; font-weight: 800; color: #1F2937; }
.empty-sub { font-size: 26rpx; color: #9CA3AF; }
.empty-btn {
  padding: 24rpx 48rpx; border-radius: 32rpx;
  background: linear-gradient(135deg, #4ECDC4 0%, #74B9FF 100%);
  box-shadow: 0 10rpx 32rpx rgba(78, 205, 196, 0.28);
  &:active { transform: scale(0.97); }
}
.empty-btn-text { color: #FFFFFF; font-size: 30rpx; font-weight: 700; }
</style>
