<template>
  <view class="profile-page">
    <!-- ========== 顶部个人信息卡片 ========== -->
    <view class="profile-hero">
      <view class="hero-bg-shape"></view>
      <view class="deco-blob blob-1"></view>
      <view class="deco-blob blob-2"></view>
      <image class="deco-star s1" src="/static/icons/sparkle.svg" mode="aspectFit" />
      <image class="deco-star s2" src="/static/icons/sparkle.svg" mode="aspectFit" />

      <view class="hero-content">
        <view class="avatar-section" @click="editName">
          <view class="avatar-large">
            <image class="avatar-img-lg" src="/static/icons/panda.svg" mode="aspectFit" />
          </view>
          <view class="avatar-edit">
            <image class="edit-icon" src="/static/menu/settings.png" mode="aspectFit" />
          </view>
        </view>

        <text class="profile-name">{{ store.childName || '小朋友' }}</text>
        <text class="profile-grade">{{ gradeLabel(store.grade) }} · 加油学习！</text>

        <view class="overview-row">
          <view class="overview-item">
            <text class="ov-num coral">{{ store.stats.totalDone }}</text>
            <text class="ov-label">总做题</text>
          </view>
          <view class="ov-divider"></view>
          <view class="overview-item">
            <text class="ov-num green">{{ store.stats.totalCorrect }}</text>
            <text class="ov-label">答对</text>
          </view>
          <view class="ov-divider"></view>
          <view class="overview-item">
            <text class="ov-num gold">{{ store.streakDays }}</text>
            <text class="ov-label">连续打卡</text>
          </view>
          <view class="ov-divider"></view>
          <view class="overview-item">
            <text class="ov-num blue">{{ store.wrongBook.length }}</text>
            <text class="ov-label">错题</text>
          </view>
        </view>
      </view>
    </view>

    <!-- ========== 功能入口列表 ========== -->
    <view class="menu-section">
      <!-- 错题本（带徽章） -->
      <view class="menu-card" @click="goWrongbook">
        <image class="menu-icon-img" src="/static/menu/wrongbook.png" mode="aspectFit" />
        <view class="menu-texts">
          <text class="menu-name">错题本</text>
          <text class="menu-desc">{{ store.wrongBook.length > 0 ? `${store.wrongBook.length} 道题目需要复习` : '太棒了，还没有错题！' }}</text>
        </view>
        <view v-if="store.wrongBook.length > 0" class="menu-badge">
          <text class="badge-txt">{{ store.wrongBook.length }}</text>
        </view>
        <text v-else class="menu-arrow">›</text>
      </view>

      <!-- 我的收藏 -->
      <view class="menu-card" @click="go('/pages/pinyin/favorites/index')">
        <image class="menu-icon-img" src="/static/menu/favorite.png" mode="aspectFit" />
        <view class="menu-texts">
          <text class="menu-name">我的收藏</text>
          <text class="menu-desc">喜欢的拼音和内容</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>

      <!-- 设置 -->
      <view class="menu-card" @click="goSettings">
        <image class="menu-icon-img" src="/static/menu/settings.png" mode="aspectFit" />
        <view class="menu-texts">
          <text class="menu-name">设置</text>
          <text class="menu-desc">音效、头像、年级偏好</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>

      <!-- 关于 -->
      <view class="menu-card" @click="showAbout">
        <image class="menu-icon-img" src="/static/menu/about.png" mode="aspectFit" />
        <view class="menu-texts">
          <text class="menu-name">关于彩虹桥</text>
          <text class="menu-desc">版本信息与反馈</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <view class="safe-bottom"></view>
  </view>
</template>

<script setup lang="ts">
import { useAppStore } from "@/stores/app";

const store = useAppStore();

const gradeLabel = (g?: string) =>
  ({ small: "小班", middle: "中班", big: "大班", grade1: "一年级" }[g || "big"] || "");

function go(url: string) {
  // 我的已不在 tabBar，全部用 navigateTo
  uni.navigateTo({ url });
}
function goWrongbook() {
  uni.navigateTo({ url: "/pages/wrongbook/index" });
}
function goSettings() {
  uni.navigateTo({ url: "/pages/settings/index" });
}
function editName() {
  uni.showModal({
    title: "设置昵称",
    editable: true,
    placeholderText: "输入小朋友的名字",
    content: store.childName,
    success: (r) => {
      if (r.confirm && r.content) store.setChildName(r.content.trim());
    },
  });
}
function showAbout() {
  uni.showModal({
    title: "彩虹桥 KidBridge",
    content: "一个为 3-6 岁小朋友设计的学习启蒙 App\n\n包含数学、拼音、英语、闯关挑战\n\n版本：2.0.0\n\n希望每个孩子都能快乐学习！",
    showCancel: false,
    confirmText: "太棒了",
  });
}
</script>

<style lang="scss" scoped>
/* ==================== 设计令牌（与首页统一）====================
 * 主色：紫 #A98CF5（profile 专属）
 * 圆角：卡片 20px / 头像外圈 50%
 * 间距：菜单 12px，外边距 16px
 * ============================================================== */

.profile-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #F5F1FE 0%, #FFF7ED 50%, #FDF2F8 100%);
}

/* ===== 顶部个人信息 ===== */
.profile-hero {
  position: relative;
  padding-top: env(safe-area-inset-top);
  padding-bottom: 28px;
  overflow: hidden;
}
.hero-bg-shape {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 320px;
  background: linear-gradient(135deg, #C4B5FD 0%, #A98CF5 40%, #FF9EC7 100%);
  border-radius: 0 0 40px 40px;
  z-index: 0;
}
.deco-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(28px);
  pointer-events: none;
  z-index: 0;
}
.blob-1 { top: -30px; right: -40px; width: 180px; height: 180px; background: rgba(255,255,255,0.5); }
.blob-2 { top: 140px; left: -50px; width: 160px; height: 160px; background: rgba(255,217,61,0.45); }
.deco-star {
  position: absolute;
  pointer-events: none;
  z-index: 0;
  animation: float 4s ease-in-out infinite;
}
.deco-star.s1 { top: 60px; right: 18%; width: 22px; height: 22px; }
.deco-star.s2 { top: 200px; right: 8%; width: 16px; height: 16px; }
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.hero-content {
  position: relative;
  z-index: 1;
  padding: 24px 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 头像 */
.avatar-section { position: relative; margin-bottom: 12px; }
.avatar-large {
  width: 92px; height: 92px;
  border-radius: 50%;
  background: rgba(255,255,255,0.98);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  border: 4px solid rgba(255,255,255,0.6);
}
.avatar-img-lg { width: 60px; height: 60px; }
.avatar-edit {
  position: absolute;
  bottom: 0; right: 0;
  width: 30px; height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, #A98CF5, #FF6B6B);
  display: flex; align-items: center; justify-content: center;
  border: 3px solid #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  overflow: hidden;
}
.edit-icon { width: 18px; height: 18px; }

.profile-name {
  font-size: 24px;
  font-weight: 800;
  color: #ffffff;
  margin-bottom: 4px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.profile-grade {
  font-size: 14px;
  color: rgba(255,255,255,0.9);
  font-weight: 600;
  margin-bottom: 20px;
}

/* 数据概览行 */
.overview-row {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255,255,255,0.98);
  border-radius: 22px;
  padding: 16px 12px;
  width: 100%;
  box-shadow: 0 6px 24px rgba(0,0,0,0.08);
}
.overview-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.ov-num {
  font-size: 22px;
  font-weight: 800;
  line-height: 1.2;
}
.ov-num.coral { color: #FF6B6B; }
.ov-num.green { color: #10B981; }
.ov-num.gold  { color: #F5B417; }
.ov-num.blue  { color: #5BA8F5; }
.ov-label {
  font-size: 11px;
  color: #6B7280;
  font-weight: 600;
}
.ov-divider {
  width: 1px;
  height: 36px;
  background: linear-gradient(180deg, transparent, #E5E7EB, transparent);
  border-radius: 1px;
  flex-shrink: 0;
}

/* ===== 功能菜单 ===== */
.menu-section {
  padding: 20px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.menu-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #FFFFFF;
  border-radius: 20px;
  padding: 16px 16px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.05);
  transition: transform 0.15s ease;
  &:active { transform: scale(0.98); }
}
.menu-icon-img {
  width: 52px; height: 52px;
  flex-shrink: 0;
}
.menu-texts { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.menu-name {
  font-size: 17px;
  font-weight: 800;
  color: #1F2937;
}
.menu-desc {
  font-size: 12px;
  color: #9CA3AF;
  font-weight: 500;
}
.menu-arrow {
  font-size: 26px;
  color: #C4B5FD;
  font-weight: 600;
  flex-shrink: 0;
  line-height: 1;
}
.menu-badge {
  background: linear-gradient(135deg, #FF6B6B, #FF8E53);
  border-radius: 999px;
  padding: 4px 12px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
}
.badge-txt {
  font-size: 13px;
  font-weight: 800;
  color: #fff;
}

.safe-bottom { height: 24px; }

/* ===== iPad / 平板 ===== */
@media screen and (min-width: 768px) {
  .profile-page { max-width: 720px; margin: 0 auto; }
  .hero-bg-shape { height: 340px; border-radius: 0 0 44px 44px; }
  .hero-content { padding: 28px 28px 0; }
  .avatar-large { width: 100px; height: 100px; }
  .avatar-emoji-lg { font-size: 54px; }
  .profile-name { font-size: 26px; }
  .ov-num { font-size: 26px; }
  .menu-section { padding: 24px 20px 0; }
  .menu-card { padding: 18px 18px; }
  .menu-icon-img { width: 58px; height: 58px; }
}

/* ===== 桌面 ===== */
@media screen and (min-width: 1024px) {
  .profile-page { max-width: 860px; margin: 0 auto; }
  .hero-content { padding: 32px 36px 0; }
  .avatar-large { width: 108px; height: 108px; }
  .avatar-emoji-lg { font-size: 58px; }
  .profile-name { font-size: 28px; }
  .ov-num { font-size: 30px; }
  .menu-name { font-size: 18px; }
  .menu-icon-img { width: 60px; height: 60px; }
}
</style>
