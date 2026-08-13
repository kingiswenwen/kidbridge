<template>
  <view class="wb-bg">
    <view v-if="store.wrongBook.length === 0" class="empty text-center">
      <text class="empty-emoji">🎉</text>
      <text class="empty-title">太棒啦！还没有错题</text>
      <text class="empty-subtitle">多练多答，记录自动整理</text>
      <view class="empty-btn mt-8" @click="() => uni.switchTab({ url: '/pages/home/index' })">
        <text class="empty-btn-text">去首页练习</text>
      </view>
    </view>

    <view v-else class="wb-content px-4 pt-4 pb-32">
      <view class="wb-header flex justify-between items-center mb-4">
        <view>
          <text class="wb-title">我的错题本</text>
          <text class="wb-subtitle">共 {{ store.wrongBook.length }} 道题</text>
        </view>
        <view
          class="clear-btn"
          @click="handleClear"
        >
          <text class="clear-btn-text">🧹 清空</text>
        </view>
      </view>

      <view class="wb-groups flex flex-col gap-4">
        <view class="wb-group">
          <view class="wb-group-title flex items-center justify-between">
            <text class="gt-text">🧮 数学错题</text>
            <text class="gt-count">{{ mathWrongs.length }}</text>
          </view>

          <view v-if="mathWrongs.length === 0" class="gt-empty">
            <text class="gt-empty-text">这部分没有错题，继续保持！</text>
          </view>

          <view v-else class="wb-list flex flex-col gap-3">
            <view
              v-for="w in mathWrongs"
              :key="w.id"
              class="wb-item"
            >
              <view class="wb-q-meta flex justify-between items-start">
                <text class="q-type">{{ typeLabel(w.type) }}</text>
                <text class="q-time">{{ fmtTime(w.timestamp) }}</text>
              </view>
              <view class="wb-q-body">
                <text class="q-content">{{ w.content }}</text>
                <view class="q-answer-row mt-2 flex items-center gap-3 flex-wrap">
                  <view class="ans-cell correct">
                    <text class="ans-k">正确答案</text>
                    <text class="ans-v">{{ w.answer }}</text>
                  </view>
                </view>
              </view>
              <view class="wb-q-actions mt-3 flex gap-3">
                <view
                  class="wb-btn wb-btn-green"
                  @click="removeWrong(w)"
                >
                  <text class="wb-btn-text">✓ 已会，移除</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useAppStore } from "@/stores/app";
import type { Question } from "@/types";

const store = useAppStore();

const mathWrongs = computed(() => store.wrongBook.filter((w) => w.module === "math"));

const typeMap: Record<string, string> = {
  addition10: "10 以内加法",
  subtraction10: "10 以内减法",
  mixed10: "10 以内混合",
  addition20: "20 以内加法",
  subtraction20: "20 以内减法",
  mixed20: "20 以内混合",
  decompose: "数的分解",
  adjacent: "相邻数",
  compare: "比大小",
  wordProblem: "生活应用",
  counting: "数一数",
  sequence: "排序规律",
};
const typeLabel = (t?: string) => typeMap[t || ""] || t || "数学";

const fmtTime = (ts?: number) => {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const removeWrong = (w: Question) => {
  store.removeWrong(w.id);
  uni.showToast({ title: "已从错题本移除", icon: "none" });
};

const handleClear = () => {
  uni.showModal({
    title: "确定清空错题本？",
    content: "清空后无法恢复，建议先做完一轮再清空～",
    confirmText: "清空",
    confirmColor: "#FF6B6B",
    success: (r) => {
      if (r.confirm) {
        store.clearWrong();
        uni.showToast({ title: "已清空", icon: "none" });
      }
    },
  });
};
</script>

<style lang="scss" scoped>
.wb-bg {
  min-height: 100vh;
  background: linear-gradient(180deg, #FFF9E6 0%, #FFE4F1 100%);
  padding-bottom: 140rpx;
}
.empty { padding: 200rpx 60rpx 0; }
.empty-emoji { font-size: 160rpx; display: block; }
.empty-title { font-size: 40rpx; font-weight: 800; color: #1F2937; display: block; margin-top: 20rpx; }
.empty-subtitle { font-size: 28rpx; color: #6B7280; display: block; margin-top: 8rpx; }
.empty-btn {
  max-width: 480rpx; margin: 0 auto;
  min-height: 96rpx; border-radius: 32rpx;
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 10rpx 32rpx rgba(255, 107, 107, 0.28);
  &:active { transform: scale(0.97); }
}
.empty-btn-text { color: #FFF; font-size: 32rpx; font-weight: 700; }

.wb-content { max-width: 880rpx; margin: 0 auto; padding-top: 32rpx; }
.wb-title { display: block; font-size: 40rpx; font-weight: 800; color: #1F2937; }
.wb-subtitle { font-size: 24rpx; color: #6B7280; margin-top: 4rpx; }
.clear-btn {
  padding: 14rpx 28rpx; border-radius: 999rpx;
  background: #FFFFFF; box-shadow: 0 4rpx 14rpx rgba(0,0,0,0.06);
}
.clear-btn-text { color: #4B5563; font-size: 26rpx; font-weight: 600; }

.wb-group { background: #FFFFFF; border-radius: 32rpx; padding: 28rpx; box-shadow: 0 8rpx 28rpx rgba(0,0,0,0.05); }
.wb-group-title { margin-bottom: 16rpx; padding: 0 4rpx 12rpx; border-bottom: 2rpx dashed #F3F4F6; }
.gt-text { font-size: 30rpx; font-weight: 700; color: #1F2937; }
.gt-count { font-size: 24rpx; color: #FF6B6B; background: #FFE4E6; padding: 4rpx 16rpx; border-radius: 999rpx; font-weight: 700; }
.gt-empty { padding: 32rpx; border-radius: 24rpx; background: linear-gradient(135deg, #F0FDFA 0%, #CCFBF1 100%); text-align: center; }
.gt-empty-text { color: #047857; font-weight: 600; font-size: 26rpx; }

.wb-item {
  background: linear-gradient(135deg, #FFFFFF 0%, #FFF9F0 100%);
  border: 2rpx solid #FEE2E2;
  border-radius: 28rpx;
  padding: 20rpx;
}
.wb-q-meta { margin-bottom: 8rpx; }
.q-type { font-size: 22rpx; color: #FF6B6B; font-weight: 700; padding: 4rpx 14rpx; background: #FFF1F2; border-radius: 999rpx; }
.q-time { font-size: 22rpx; color: #9CA3AF; }
.q-content { font-size: 34rpx; font-weight: 700; color: #1F2937; line-height: 1.5; padding: 12rpx 0; }

.ans-cell { display: inline-flex; align-items: center; gap: 12rpx; padding: 8rpx 20rpx; border-radius: 999rpx; }
.ans-cell.correct { background: #D1FAE5; }
.ans-k { font-size: 24rpx; color: #065F46; font-weight: 600; }
.ans-v { font-size: 30rpx; font-weight: 800; color: #059669; }

.wb-q-actions { display: flex; }
.wb-btn { padding: 14rpx 28rpx; border-radius: 24rpx; &:active { transform: scale(0.96); } }
.wb-btn-green { background: linear-gradient(135deg, #10B981 0%, #34D399 100%); }
.wb-btn-text { color: #FFFFFF; font-weight: 700; font-size: 26rpx; }

.mt-2 { margin-top: 8rpx; }
.mt-3 { margin-top: 12rpx; }
.mt-4 { margin-top: 16rpx; }
.mt-8 { margin-top: 32rpx; }
</style>
