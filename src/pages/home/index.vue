<template>
  <view class="home-page">
    <view class="hero-section">
      <view class="deco-blob blob-1"></view>
      <view class="deco-blob blob-2"></view>
      <view class="deco-blob blob-3"></view>
      <image class="float-shape shape-star s1" src="/static/icons/sparkle.svg" mode="aspectFit" />
      <image class="float-shape shape-star s2" src="/static/icons/sparkle.svg" mode="aspectFit" />
      <view class="float-shape shape-dot d1"></view>
      <view class="float-shape shape-dot d2"></view>

      <view class="hero-content">
        <view class="top-row">
          <view class="brand-pill">
            <view class="brand-icon">
              <view class="brand-rainbow"></view>
            </view>
            <view class="brand-texts">
              <text class="brand-name">彩虹桥</text>
              <text class="brand-sub">KIDBRIDGE</text>
            </view>
          </view>
          <view class="profile-entry" @click="goProfile">
            <view class="profile-avatar">
              <image class="profile-avatar-img" src="/static/icons/panda.svg" mode="aspectFit" />
            </view>
            <view class="profile-edit-dot"></view>
          </view>
        </view>

        <view class="greeting-block">
          <text class="greeting-title">{{ greetingText }}，{{ store.childName || '小朋友' }}！</text>
          <text class="greeting-desc">{{ timeGreeting }} · 今天想学什么呀？</text>
        </view>

        <view class="daily-card" @click="go('/pages/math/practice/index')">
          <view class="daily-header">
            <view class="daily-title-row">
              <view class="daily-icon-dot">
                <image class="dot-icon-img" src="/static/icons/book.svg" mode="aspectFit" />
              </view>
              <text class="daily-title">今日学习</text>
            </view>
            <view class="streak-pill" v-if="streak > 0">
              <image class="streak-icon-img" src="/static/icons/flame.svg" mode="aspectFit" />
              <text class="streak-num">连续{{ streak }}天</text>
            </view>
          </view>

          <view class="daily-stats">
            <view class="stat-block">
              <text class="stat-num coral">{{ todayQuestions }}</text>
              <text class="stat-label">已做题</text>
            </view>
            <view class="stat-divider"></view>
            <view class="stat-block">
              <text class="stat-num green">{{ accuracy }}%</text>
              <text class="stat-label">正确率</text>
            </view>
            <view class="stat-divider"></view>
            <view class="stat-block">
              <text class="stat-num blue">{{ wrongCount }}</text>
              <text class="stat-label">待复习</text>
            </view>
          </view>

          <view class="progress-wrap">
            <view class="progress-info">
              <text class="progress-label">今日目标</text>
              <text class="progress-num">{{ Math.min(todayQuestions, 10) }} / 10</text>
            </view>
            <view class="progress-track">
              <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="modules-section">
      <view class="section-head">
        <text class="section-title">快乐学习</text>
        <text class="section-sub">选一个开始吧</text>
      </view>

      <view class="mod-list">
        <view class="mod-row mod-math" @click="go('/pages/math/practice/index')">
          <view class="mod-icon-box">
            <image class="mod-icon-img" src="/static/modules/math.png" mode="aspectFit" />
          </view>
          <view class="mod-text-area">
            <text class="mod-name">数学启蒙</text>
            <text class="mod-desc">加减 · 比较 · 分解</text>
            <text class="mod-tag">{{ mathProgress }}</text>
          </view>
          <view class="mod-arrow">
            <text class="mod-arrow-icon">›</text>
          </view>
        </view>

        <view class="mod-row mod-pinyin" @click="go('/pages/pinyin/index')">
          <view class="mod-icon-box">
            <image class="mod-icon-img" src="/static/modules/pinyin.png" mode="aspectFit" />
          </view>
          <view class="mod-text-area">
            <text class="mod-name">拼音学习</text>
            <text class="mod-desc">声母 · 韵母 · 拼读</text>
            <text class="mod-tag">{{ pinyinProgress }}</text>
          </view>
          <view class="mod-arrow">
            <text class="mod-arrow-icon">›</text>
          </view>
        </view>

        <view class="mod-row mod-english" @click="go('/pages/english/flashcard/index')">
          <view class="mod-icon-box">
            <image class="mod-icon-img" src="/static/modules/english.png" mode="aspectFit" />
          </view>
          <view class="mod-text-area">
            <text class="mod-name">英语启蒙</text>
            <text class="mod-desc">闪卡 · 句子</text>
            <text class="mod-tag">{{ englishProgress }}</text>
          </view>
          <view class="mod-arrow">
            <text class="mod-arrow-icon">›</text>
          </view>
        </view>

        <view class="mod-row mod-challenge" @click="go('/pages/math/challenge/index')">
          <view class="mod-icon-box">
            <image class="mod-icon-img" src="/static/modules/challenge.png" mode="aspectFit" />
            <view class="mod-corner-badge">
              <image class="badge-icon-img" src="/static/icons/bolt.svg" mode="aspectFit" />
            </view>
          </view>
          <view class="mod-text-area">
            <text class="mod-name">闯关挑战</text>
            <text class="mod-desc">{{ challengeDesc }}</text>
            <text class="mod-tag mod-tag-gold">{{ challengeLabel }}</text>
          </view>
          <view class="mod-arrow">
            <text class="mod-arrow-icon">›</text>
          </view>
        </view>
      </view>
    </view>

    <view class="tip-bar">
      <view class="tip-bubble">
        <image class="tip-icon-img" src="/static/icons/bulb.svg" mode="aspectFit" />
        <text class="tip-text">{{ tip }}</text>
      </view>
    </view>

    <view class="safe-bottom"></view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, computed } from "vue";
import { useAppStore } from "@/stores/app";
import { getRandomEncouragement } from "@/data/encouragements";

const store = useAppStore();

const streak = computed(() => store.progress.streak || 0);
const todayQuestions = computed(() => store.progress.todayQuestions || 0);
const wrongCount = computed(() => store.wrongBook.length || 0);
const accuracy = computed(() => {
  if (!store.progress.todayQuestions) return 0;
  return Math.round((store.progress.todayCorrect / store.progress.todayQuestions) * 100);
});
const progressPercent = computed(() => Math.min(todayQuestions.value * 10, 100));

const hour = new Date().getHours();
const timeGreeting = computed(() => {
  if (hour < 12) return '早上好';
  if (hour < 18) return '下午好';
  return '晚上好';
});
const greetingText = computed(() => {
  if (hour < 12) return '早安';
  if (hour < 18) return '你好';
  return '晚安';
});

const mathProgress = computed(() => {
  const { totalQuestions } = store.progress.mathProgress;
  return totalQuestions ? `已练 ${totalQuestions} 题` : '开始学习';
});
const mathProgressNum = computed(() => {
  const n = store.progress.mathProgress.totalQuestions || 0;
  return Math.min(100, Math.round((n / 50) * 100));
});

const pinyinProgress = computed(() => {
  const p = store.progress.pinyinProgress;
  return p.learnedPinyin.length ? `已学 ${p.learnedPinyin.length} 个` : '开始学习';
});
const pinyinProgressNum = computed(() => {
  const n = store.progress.pinyinProgress.learnedPinyin.length || 0;
  return Math.min(100, Math.round((n / 30) * 100));
});

const englishProgress = computed(() => {
  const p = store.progress.englishProgress;
  return p.learnedWords.length ? `已学 ${p.learnedWords.length} 词` : '开始学习';
});
const englishProgressNum = computed(() => {
  const n = store.progress.englishProgress.learnedWords.length || 0;
  return Math.min(100, Math.round((n / 30) * 100));
});

const challengeLabel = computed(() => {
  const done = Object.values(store.challengeProgress).filter((c) => c.completed).length;
  return done ? `${done}/12 通关` : '开始闯关';
});
const challengeDesc = computed(() => {
  const done = Object.values(store.challengeProgress).filter((c) => c.completed).length;
  return done ? '继续你的冒险' : '12 关等你来战';
});
const challengeProgressNum = computed(() => {
  const done = Object.values(store.challengeProgress).filter((c) => c.completed).length;
  return Math.min(100, Math.round((done / 12) * 100));
});

const tip = getRandomEncouragement("completion");

onMounted(() => {
  store.ensureDailyReset();
});

function go(url: string) {
  // tabBar: 首页 / 数学 / 拼音 / 英语 / 闯关
  const tabs = [
    "/pages/home/index",
    "/pages/math/practice/index",
    "/pages/pinyin/index",
    "/pages/english/flashcard/index",
    "/pages/math/challenge/index",
  ];
  if (tabs.includes(url)) {
    uni.switchTab({ url });
  } else {
    uni.navigateTo({ url });
  }
}
function goProfile() {
  // 我的已从 tabBar 移除，改用 navigateTo
  uni.navigateTo({ url: "/pages/profile/index" });
}
</script>

<style lang="scss" scoped>
/* ==================== 设计令牌 ====================
 * 糖果色系：粉 #FF6B6B / 橙 #FF8C42 / 薄荷 #3BBFB6
 *           天蓝 #5BA8F5 / 金 #F5B417 / 紫 #A98CF5
 * 圆角：模块 24px，卡片 28px，按钮 999px
 * 间距：模块 14px，外边距 16px
 * ===================================================== */

.home-page {
  min-height: 100vh;
  background:
    radial-gradient(ellipse at top, #FFF4F1 0%, transparent 60%),
    linear-gradient(180deg, #FFF7ED 0%, #F0F9FF 100%);
  padding-bottom: calc(env(safe-area-inset-bottom) + 24px);
}

.hero-section {
  position: relative;
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 40%, #FFB347 75%, #FFD56B 100%);
  border-radius: 0 0 40px 40px;
  overflow: hidden;
  padding-top: env(safe-area-inset-top);
  padding-bottom: 24px;
  box-shadow: 0 12px 32px rgba(255, 107, 107, 0.18);
}

.deco-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(28px);
  pointer-events: none;
}
.blob-1 { top: -40px; right: -30px; width: 180px; height: 180px; background: rgba(255,255,255,0.45); }
.blob-2 { top: 120px; left: -50px; width: 160px; height: 160px; background: rgba(255,217,61,0.5); }
.blob-3 { bottom: -50px; right: 30%; width: 140px; height: 140px; background: rgba(91,168,245,0.4); }

.float-shape { position: absolute; pointer-events: none; }
.shape-star {
  pointer-events: none;
}
.shape-star.s1 { top: 30px; right: 18%; width: 24px; height: 24px; animation: float 4s ease-in-out infinite; }
.shape-star.s2 { top: 180px; right: 8%; width: 18px; height: 18px; animation: float 5s ease-in-out infinite; }
.shape-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: rgba(255,255,255,0.7);
}
.shape-dot.d1 { top: 220px; left: 15%; }
.shape-dot.d2 { top: 60px; left: 35%; width: 6px; height: 6px; }

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0); }
  50% { transform: translateY(-8px) rotate(8deg); }
}

.hero-content {
  position: relative;
  z-index: 1;
  padding: 12px 18px 0;
}

.top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.brand-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.96);
  border-radius: 999px;
  padding: 6px 16px 6px 8px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
}
.brand-icon {
  width: 32px; height: 32px;
  border-radius: 10px;
  background: linear-gradient(135deg, #FF6B6B, #FFB347);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.brand-rainbow {
  width: 22px; height: 22px;
  border-radius: 50%;
  background: conic-gradient(from 0deg,
    #FF6B6B 0deg, #FF8E53 60deg, #FFD93D 120deg,
    #3BBFB6 180deg, #5BA8F5 240deg, #A98CF5 300deg, #FF6B6B 360deg);
  border: 2px solid #fff;
}
.brand-texts { display: flex; flex-direction: column; }
.brand-name {
  font-size: 16px; font-weight: 800;
  background: linear-gradient(135deg, #FF6B6B, #FF8E53);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  line-height: 1.1;
}
.brand-sub {
  font-size: 9px; font-weight: 700;
  color: #9CA3AF; letter-spacing: 1.5px;
  margin-top: 1px;
}

.profile-entry {
  position: relative;
  width: 44px; height: 44px;
  border-radius: 50%;
  background: rgba(255,255,255,0.96);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  border: 3px solid rgba(255,255,255,0.5);
  flex-shrink: 0;
  overflow: hidden;
}
.profile-avatar {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
}
.profile-avatar-img {
  width: 34px; height: 34px;
}
.profile-edit-dot {
  position: absolute;
  bottom: -2px; right: -2px;
  width: 18px; height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #A98CF5, #FF6B6B);
  border: 2px solid #fff;
}

.greeting-block {
  margin-bottom: 18px;
  padding: 0 4px;
}
.greeting-title {
  display: block;
  font-size: 26px;
  font-weight: 800;
  color: #fff;
  line-height: 1.25;
  margin-bottom: 6px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.greeting-desc {
  display: block;
  font-size: 14px;
  color: rgba(255,255,255,0.92);
  line-height: 1.4;
  font-weight: 600;
}

.daily-card {
  background: rgba(255,255,255,0.98);
  border-radius: 28px;
  padding: 18px 18px 16px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.06);
  position: relative;
  overflow: hidden;
}
.daily-card::before {
  content: '';
  position: absolute;
  top: -40px; right: -40px;
  width: 100px; height: 100px;
  background: linear-gradient(135deg, rgba(255,217,61,0.2), rgba(255,142,83,0.2));
  border-radius: 50%;
  pointer-events: none;
}
.daily-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  position: relative;
}
.daily-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.daily-icon-dot {
  width: 28px; height: 28px;
  border-radius: 10px;
  background: linear-gradient(135deg, #FFE4E6, #FFD1D8);
  display: flex; align-items: center; justify-content: center;
}
.dot-icon-img { width: 20px; height: 20px; }
.daily-title {
  font-size: 17px;
  font-weight: 800;
  color: #1F2937;
}
.streak-pill {
  display: flex; align-items: center; gap: 4px;
  background: linear-gradient(135deg, #FEF3C7, #FDE68A);
  border-radius: 999px;
  padding: 5px 12px;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
}
.streak-icon-img { width: 16px; height: 16px; }
.streak-num {
  font-size: 12px; font-weight: 800;
  color: #B45309;
}

.daily-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  position: relative;
}
.stat-block {
  flex: 1;
  display: flex; flex-direction: column; align-items: center;
  gap: 2px;
}
.stat-num {
  font-size: 24px; font-weight: 800;
  line-height: 1.2;
}
.stat-num.coral { color: #FF6B6B; }
.stat-num.green { color: #10B981; }
.stat-num.blue  { color: #5BA8F5; }
.stat-label {
  font-size: 11px;
  color: #9CA3AF;
  font-weight: 600;
}
.stat-divider {
  width: 1px; height: 32px;
  background: linear-gradient(180deg, transparent, #E5E7EB, transparent);
  flex-shrink: 0;
}

.progress-wrap { position: relative; }
.progress-info {
  display: flex; justify-content: space-between;
  margin-bottom: 6px;
}
.progress-label {
  font-size: 12px; color: #6B7280; font-weight: 600;
}
.progress-num {
  font-size: 12px; color: #FF6B6B; font-weight: 800;
}
.progress-track {
  height: 10px;
  background: #F3F4F6;
  border-radius: 999px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FF8E53, #FF6B6B);
  border-radius: 999px;
  transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 2px 6px rgba(255, 107, 107, 0.3);
}

.modules-section {
  padding: 24px 16px 0;
}
.section-head {
  display: flex; align-items: baseline; gap: 8px;
  margin-bottom: 14px;
  padding: 0 4px;
}
.section-title {
  font-size: 22px; font-weight: 800;
  color: #1F2937;
  letter-spacing: 0.5px;
}
.section-sub {
  font-size: 12px;
  color: #9CA3AF;
  font-weight: 600;
}

.mod-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mod-row {
  position: relative;
  background: #fff;
  border-radius: 20px;
  padding: 14px 16px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  gap: 14px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  border: 2px solid transparent;
  overflow: hidden;
}
.mod-row:active {
  transform: scale(0.98);
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
}

.mod-math      { border-color: rgba(255,140,66,0.15); }
.mod-pinyin    { border-color: rgba(59,191,182,0.15); }
.mod-english   { border-color: rgba(91,168,245,0.15); }
.mod-challenge { border-color: rgba(245,180,23,0.2); }

.mod-row::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 5px;
}
.mod-math::before      { background: linear-gradient(180deg, #FF8C42, #FFB347); }
.mod-pinyin::before    { background: linear-gradient(180deg, #3BBFB6, #6DD5CD); }
.mod-english::before   { background: linear-gradient(180deg, #5BA8F5, #8AC4F8); }
.mod-challenge::before { background: linear-gradient(180deg, #F5B417, #FFD56B); }

.mod-icon-box {
  width: 64px; height: 64px;
  border-radius: 18px;
  display: flex; align-items: center; justify-content: center;
  position: relative;
  flex-shrink: 0;
}
.mod-math      .mod-icon-box { background: linear-gradient(135deg, #FFF1E6, #FFE4D1); }
.mod-pinyin    .mod-icon-box { background: linear-gradient(135deg, #E0F7F5, #D0F5F0); }
.mod-english   .mod-icon-box { background: linear-gradient(135deg, #E5F0FE, #D6E8FC); }
.mod-challenge .mod-icon-box { background: linear-gradient(135deg, #FEF3C7, #FDE8B4); }

.mod-icon-img {
  width: 48px; height: 48px;
}
.mod-corner-badge {
  position: absolute;
  top: -4px; right: -4px;
  width: 22px; height: 22px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF6B6B, #FF8E53);
  display: flex; align-items: center; justify-content: center;
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(255,107,107,0.4);
}
.badge-icon-img { width: 13px; height: 13px; }

.mod-text-area {
  flex: 1;
  display: flex; flex-direction: column; gap: 3px;
  min-width: 0;
}
.mod-name {
  font-size: 17px; font-weight: 800;
  color: #1F2937;
}
.mod-desc {
  font-size: 12px;
  color: #9CA3AF;
  font-weight: 600;
}

.mod-arrow {
  flex-shrink: 0;
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
}
.mod-arrow-icon {
  font-size: 24px;
  font-weight: 600;
  line-height: 1;
}
.mod-math      .mod-arrow-icon { color: #FFB347; }
.mod-pinyin    .mod-arrow-icon { color: #3BBFB6; }
.mod-english   .mod-arrow-icon { color: #5BA8F5; }
.mod-challenge .mod-arrow-icon { color: #F5B417; }

.mod-tag {
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 999px;
  background: #F3F4F6;
  color: #6B7280;
  letter-spacing: 0.3px;
  width: fit-content;
}
.mod-math      .mod-tag { background: #FFF1E6; color: #D96B1F; }
.mod-pinyin    .mod-tag { background: #E0F7F5; color: #147A75; }
.mod-english   .mod-tag { background: #E5F0FE; color: #1E5FB8; }
.mod-tag-gold { background: linear-gradient(135deg, #FEF3C7, #FDE68A); color: #B45309; }

.tip-bar {
  padding: 20px 16px 0;
  display: flex; justify-content: center;
}
.tip-bubble {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border-radius: 999px;
  padding: 10px 20px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.05);
  max-width: 92%;
}
.tip-icon-img { width: 22px; height: 22px; }
.tip-text {
  font-size: 13px;
  font-weight: 700;
  color: #4ECDC4;
}

.safe-bottom { height: 20px; }

@media screen and (min-width: 768px) {
  .home-page { max-width: 720px; margin: 0 auto; }
  .hero-section { border-radius: 32px; margin: 12px 12px 0; }
  .hero-content { padding: 16px 24px 0; }
  .greeting-title { font-size: 30px; }
  .greeting-desc  { font-size: 15px; }
  .stat-num { font-size: 28px; }
  .mod-icon-box { width: 72px; height: 72px; }
  .mod-icon-img { width: 54px; height: 54px; }
  .mod-name { font-size: 18px; }
  .mod-desc { font-size: 13px; }
  .mod-row { padding: 16px 18px; }
}

@media screen and (min-width: 1024px) {
  .home-page { max-width: 860px; margin: 0 auto; }
  .hero-content { padding: 16px 32px 0; }
  .greeting-title { font-size: 32px; }
  .stat-num { font-size: 30px; }
  .mod-icon-box { width: 80px; height: 80px; }
  .mod-icon-img { width: 60px; height: 60px; }
  .mod-name { font-size: 20px; }
}
</style>
