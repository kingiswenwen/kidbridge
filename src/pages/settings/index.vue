<template>
  <view class="settings-bg">
    <view class="st-content px-6 pt-8 pb-40">
      <!-- 顶部：个人信息 -->
      <view class="profile-card">
        <view class="avatar-wrap">
          <image class="avatar-img" src="/static/icons/panda.svg" mode="aspectFit" />
        </view>
        <view class="profile-info">
          <text class="profile-name">{{ store.childName || '小朋友' }}</text>
          <text class="profile-slogan">{{ gradeLabel(store.grade) }} · 加油呀！</text>
        </view>
        <view
          class="edit-btn"
          @click="editName"
        >
          <text class="edit-btn-text">编辑</text>
        </view>
      </view>

      <!-- 学习统计 -->
      <view class="stats-card">
        <view class="card-title-row">
          <image class="card-title-icon" src="/static/icons/chart.svg" mode="aspectFit" />
          <text class="card-title">学习统计</text>
        </view>
        <view class="stats-grid">
          <view class="stat">
            <text class="sv coral">{{ store.stats.totalDone }}</text>
            <text class="sl">总做题</text>
          </view>
          <view class="stat">
            <text class="sv green">{{ store.stats.totalCorrect }}</text>
            <text class="sl">答对</text>
          </view>
          <view class="stat">
            <text class="sv yellow">{{ store.streakDays }}</text>
            <text class="sl">连续打卡</text>
          </view>
          <view class="stat">
            <text class="sv blue">{{ store.wrongBook.length }}</text>
            <text class="sl">错题数</text>
          </view>
        </view>
      </view>

      <!-- 设置项 -->
      <view class="set-card">
        <view class="card-title-row">
          <image class="card-title-icon" src="/static/icons/gear.svg" mode="aspectFit" />
          <text class="card-title">偏好设置</text>
        </view>

        <view class="set-row">
          <view class="set-l">
            <image class="set-icon-img" src="/static/icons/speaker.svg" mode="aspectFit" />
            <view class="set-texts">
              <text class="set-name">音效</text>
              <text class="set-desc">答题反馈、鼓励音</text>
            </view>
          </view>
          <switch
            :checked="store.soundEnabled"
            color="#FF6B6B"
            @change="(e: any) => store.toggleSound(e.detail.value)"
          />
        </view>

        <view class="set-row">
          <view class="set-l">
            <image class="set-icon-img" src="/static/icons/mic.svg" mode="aspectFit" />
            <view class="set-texts">
              <text class="set-name">自动朗读题目</text>
              <text class="set-desc">答题前自动读一遍（H5/小程序支持）</text>
            </view>
          </view>
          <switch
            :checked="store.autoSpeak"
            color="#4ECDC4"
            @change="(e: any) => store.setAutoSpeak(e.detail.value)"
          />
        </view>

        <view class="set-row">
          <view class="set-l">
            <image class="set-icon-img" src="/static/icons/star.svg" mode="aspectFit" />
            <view class="set-texts">
              <text class="set-name">年级</text>
              <text class="set-desc">自动建议题目难度</text>
            </view>
          </view>
          <view class="grade-picker flex gap-2">
            <view
              v-for="g in ['small', 'middle', 'big', 'grade1']"
              :key="g"
              :class="['grade-chip', store.grade === g ? 'active' : '']"
              @click="store.setGrade(g as any)"
            >
              <text class="grade-chip-text">{{ gradeShortLabel(g as any) }}</text>
            </view>
          </view>
        </view>

        <view class="set-row">
          <view class="set-l">
            <image class="set-icon-img" src="/static/icons/panda.svg" mode="aspectFit" />
            <view class="set-texts">
              <text class="set-name">选择头像</text>
              <text class="set-desc">点一下就能换一个头像</text>
            </view>
          </view>
        </view>
        <view class="avatars-grid">
          <view
            v-for="a in avatarChoices"
            :key="a"
            :class="['av-item', store.avatar === a ? 'selected' : '']"
            @click="store.setAvatar(a)"
          >
            <image class="av-icon-img" :src="a" mode="aspectFit" />
          </view>
        </view>
      </view>

      <!-- 数据管理 -->
      <view class="set-card">
        <view class="card-title-row">
          <image class="card-title-icon" src="/static/icons/save.svg" mode="aspectFit" />
          <text class="card-title">数据与备份</text>
        </view>

        <view class="set-row" @click="resetProgress">
          <view class="set-l">
            <image class="set-icon-img" src="/static/icons/refresh.svg" mode="aspectFit" />
            <view class="set-texts">
              <text class="set-name">重置学习进度</text>
              <text class="set-desc">清空调用/错题/收藏（需二次确认）</text>
            </view>
          </view>
          <text class="arrow">›</text>
        </view>

      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useAppStore } from "@/stores/app";

const store = useAppStore();

const gradeLabel = (g?: string) =>
  ({ small: "小班", middle: "中班", big: "大班", grade1: "一年级" }[g || "big"] || "");
const gradeShortLabel = (g: string) =>
  ({ small: "小班", middle: "中班", big: "大班", grade1: "一年" }[g] || g);

const avatarChoices = [
  "/static/icons/panda.svg",
  "/static/icons/cat.svg",
  "/static/icons/star.svg",
  "/static/icons/sparkle.svg",
  "/static/icons/bulb.svg",
  "/static/icons/bolt.svg",
  "/static/icons/flame.svg",
  "/static/icons/trophy.svg",
  "/static/icons/heart.svg",
  "/static/icons/party.svg",
  "/static/icons/puzzle.svg",
  "/static/icons/dice.svg",
];

const editName = () => {
  uni.showModal({
    title: "设置昵称",
    editable: true,
    placeholderText: "输入小朋友的名字",
    content: store.childName,
    success: (r) => {
      if (r.confirm && r.content) store.setChildName(r.content.trim());
    },
  });
};

const resetProgress = () => {
  uni.showModal({
    title: "确定重置所有学习数据？",
    content: "这会清空：总做题数、答对、错题本、收藏、打卡。无法撤销哦。",
    confirmText: "重置",
    confirmColor: "#FF6B6B",
    success: (r) => {
      if (r.confirm) {
        store.resetAll();
        uni.showToast({ title: "已重置学习数据", icon: "none" });
      }
    },
  });
};

</script>

<style lang="scss" scoped>
.settings-bg {
  min-height: 100vh;
  background: linear-gradient(180deg, #F0F9FF 0%, #F0FDFA 100%);
}
.st-content { max-width: 880rpx; margin: 0 auto; }

.profile-card {
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 50%, #FFD93D 100%);
  border-radius: 36rpx;
  padding: 32rpx 28rpx;
  display: flex; align-items: center; gap: 20rpx;
  box-shadow: 0 14rpx 40rpx rgba(255, 107, 107, 0.28);
  color: #FFFFFF;
}
.avatar-wrap {
  width: 120rpx; height: 120rpx; border-radius: 999rpx;
  background: rgba(255,255,255,0.95);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6rpx 20rpx rgba(0,0,0,0.1);
  overflow: hidden;
}
.avatar-img { width: 84rpx; height: 84rpx; }
.profile-info { flex: 1; display: flex; flex-direction: column; gap: 6rpx; }
.profile-name { font-size: 38rpx; font-weight: 800; color: #FFFFFF; }
.profile-slogan { font-size: 24rpx; color: rgba(255,255,255,0.92); }
.edit-btn {
  padding: 14rpx 28rpx; border-radius: 999rpx;
  background: rgba(255,255,255,0.25); backdrop-filter: blur(6px);
  &:active { background: rgba(255,255,255,0.4); }
}
.edit-btn-text { color: #FFFFFF; font-weight: 700; font-size: 26rpx; }

/* Stats */
.stats-card, .set-card {
  margin-top: 32rpx;
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 28rpx;
  box-shadow: 0 8rpx 28rpx rgba(0,0,0,0.05);
}
.card-title-row { display: flex; align-items: center; gap: 12rpx; margin-bottom: 20rpx; }
.card-title-icon { width: 40rpx; height: 40rpx; }
.card-title { font-size: 30rpx; font-weight: 800; color: #1F2937; }

.stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 16rpx; }
.stat { background: linear-gradient(135deg, #F9FAFB 0%, #FFF 100%); border-radius: 24rpx; padding: 20rpx 8rpx; display: flex; flex-direction: column; align-items: center; gap: 4rpx; border: 2rpx solid #F3F4F6; }
.sv { font-size: 40rpx; font-weight: 800; }
.sv.coral { color: #FF6B6B; }
.sv.green { color: #10B981; }
.sv.yellow { color: #F59E0B; }
.sv.blue { color: #3B82F6; }
.sl { font-size: 22rpx; color: #6B7280; }

/* Settings row */
.set-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20rpx 8rpx;
  border-bottom: 2rpx solid #F9FAFB;
  &:last-child { border-bottom: none; }
}
.set-l { display: flex; align-items: center; gap: 20rpx; flex: 1; min-width: 0; }
.set-icon-img { width: 44rpx; height: 44rpx; flex-shrink: 0; }
.set-texts { display: flex; flex-direction: column; gap: 4rpx; min-width: 0; }
.set-name { font-size: 30rpx; font-weight: 700; color: #1F2937; }
.set-desc { font-size: 22rpx; color: #9CA3AF; line-height: 1.4; }
.arrow { font-size: 36rpx; color: #D1D5DB; }

.grade-picker { display: flex; flex-wrap: wrap; gap: 12rpx; justify-content: flex-end; max-width: 360rpx; }
.grade-chip {
  padding: 10rpx 20rpx; border-radius: 999rpx;
  background: #F3F4F6;
  &.active { background: linear-gradient(135deg, #4ECDC4 0%, #38BDF8 100%); .grade-chip-text { color: #FFFFFF; } }
}
.grade-chip-text { font-size: 24rpx; color: #4B5563; font-weight: 700; }

.avatars-grid {
  display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr; gap: 16rpx;
  padding: 16rpx 8rpx 0;
}
.av-item {
  aspect-ratio: 1 / 1;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #FFF9E6 0%, #FFF0F0 100%);
  display: flex; align-items: center; justify-content: center;
  border: 4rpx solid transparent;
  &.selected { border-color: #FF6B6B; background: linear-gradient(135deg, #FFE4E6 0%, #FFF5F5 100%); box-shadow: 0 8rpx 20rpx rgba(255, 107, 107, 0.2); }
  &:active { transform: scale(0.94); }
}
.av-icon-img { width: 56rpx; height: 56rpx; }
</style>
