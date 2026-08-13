<template>
  <view class="home-page">
    <!-- ========== 顶部渐变栏 ========== -->
    <view class="header-area">
      <!-- 装饰气泡 -->
      <view class="bubble bubble-1"></view>
      <view class="bubble bubble-2"></view>
      <view class="bubble bubble-3"></view>

      <view class="header-inner">
        <!-- 顶部栏：品牌标识 + 设置 -->
        <view class="top-bar">
          <view class="brand-pill">
            <BrandLogo :size="72" :chip="false" :show-wordmark="true" />
          </view>
          <view class="settings-btn" @click="goSettings">
            <text class="settings-icon">⚙️</text>
          </view>
        </view>

        <!-- 问候语 -->
        <view class="greeting-block">
          <text class="greeting-title">你好，小朋友！</text>
          <text class="greeting-sub">今天也要一起加油呀</text>
        </view>

        <!-- 学习概览卡片 -->
        <view class="stats-card">
          <view class="stats-header">
            <text class="stats-title">📚 今日学习</text>
            <view class="streak-row">
              <text class="streak-icon">🔥</text>
              <text class="streak-text">{{ streak }}天连续</text>
            </view>
          </view>

          <view class="stats-grid">
            <view class="stat-box stat-coral">
              <text class="stat-num">{{ todayQuestions }}</text>
              <text class="stat-label">今日题数</text>
            </view>
            <view class="stat-box stat-green">
              <text class="stat-num">{{ accuracy }}%</text>
              <text class="stat-label">正确率</text>
            </view>
            <view class="stat-box stat-yellow">
              <text class="stat-num">{{ wrongCount }}</text>
              <text class="stat-label">待复习</text>
            </view>
          </view>

          <!-- 进度条 -->
          <view class="progress-wrap">
            <view class="progress-labels">
              <text class="progress-hint">今日目标 10 题</text>
              <text class="progress-val">{{ Math.min(todayQuestions, 10) }}/10</text>
            </view>
            <uv-line-progress
              :percentage="Math.min(todayQuestions * 10, 100)"
              color="#FF6B6B"
              activeColor="#FF6B6B"
              height="14"
              striped
              striped-flow
            />
          </view>
        </view>
      </view>
    </view>

    <!-- ========== 模块入口 ========== -->
    <view class="modules-section">
      <!-- 数学 -->
      <view class="module-card module-math" @click="go('/pages/math/practice/index')">
        <view class="module-left">
          <text class="module-emoji">🔢</text>
          <view class="module-info">
            <text class="module-name text-coral">数学启蒙</text>
            <text class="module-desc">10/20以内加减</text>
          </view>
        </view>
        <uv-tag type="primary" mode="light" shape="circle" size="mini" :text="mathProgress" />
      </view>

      <!-- 拼音 -->
      <view class="module-card module-pinyin" @click="go('/pages/pinyin/index')">
        <view class="module-left">
          <text class="module-emoji">🅰️</text>
          <view class="module-info">
            <text class="module-name" style="color: #4ECDC4;">拼音学习</text>
            <text class="module-desc">声母·韵母·拼读</text>
          </view>
        </view>
        <uv-tag type="success" mode="light" shape="circle" size="mini" :text="pinyinProgress" />
      </view>

      <!-- 英语 -->
      <view class="module-card module-english" @click="go('/pages/english/flashcard/index')">
        <view class="module-left">
          <text class="module-emoji">🔤</text>
          <view class="module-info">
            <text class="module-name" style="color: #74B9FF;">英语启蒙</text>
            <text class="module-desc">闪卡·日常句子</text>
          </view>
        </view>
        <uv-tag type="info" mode="light" shape="circle" size="mini" :text="englishProgress" />
      </view>

      <!-- 闯关 -->
      <view class="module-card module-challenge" @click="go('/pages/math/challenge/index')">
        <view class="module-left">
          <text class="module-emoji">🏆</text>
          <view class="module-info">
            <text class="module-name" style="color: #D97706;">闯关挑战</text>
            <text class="module-desc">12关等你解锁</text>
          </view>
        </view>
        <uv-tag type="warning" mode="light" shape="circle" size="mini" :text="challengeLabel" />
      </view>
    </view>

    <!-- ========== 快捷操作 ========== -->
    <view class="shortcuts-section">
      <!-- 错题本大卡 -->
      <view class="shortcut-large" @click="go('/pages/wrongbook/index')">
        <view class="shortcut-left">
          <view class="shortcut-icon shortcut-icon-warn">📒</view>
          <view class="shortcut-texts">
            <text class="shortcut-name">错题本</text>
            <text class="shortcut-desc">{{ wrongCount }} 道题目需要复习</text>
          </view>
        </view>
        <uv-button type="warning" size="normal" shape="circle" icon="arrow-rightward" />
      </view>

      <!-- 三格快捷入口 -->
      <view class="shortcuts-grid">
        <view class="shortcut-small" @click="go('/pages/math/challenge/index')">
          <view class="shortcut-icon-sm shortcut-icon-warn">🏆</view>
          <text class="shortcut-sm-name">闯关挑战</text>
          <text class="shortcut-sm-desc">{{ challengeLabel }}</text>
        </view>
        <view class="shortcut-small" @click="go('/pages/pinyin/favorites/index')">
          <view class="shortcut-icon-sm shortcut-icon-coral">⭐</view>
          <text class="shortcut-sm-name">我的收藏</text>
          <text class="shortcut-sm-desc">喜欢的拼音</text>
        </view>
        <view class="shortcut-small" @click="goSettings">
          <view class="shortcut-icon-sm shortcut-icon-gray">⚙️</view>
          <text class="shortcut-sm-name">设置</text>
          <text class="shortcut-sm-desc">偏好·进度</text>
        </view>
      </view>
    </view>

    <!-- ========== 鼓励语 ========== -->
    <view class="encouragement-bar">
      <text class="encouragement-text">✨ {{ tip }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, computed } from "vue";
import { useAppStore } from "@/stores/app";
import { getRandomEncouragement } from "@/data/encouragements";
import BrandLogo from "@/components/BrandLogo.vue";

const store = useAppStore();

const streak = computed(() => store.progress.streak || 0);
const todayQuestions = computed(() => store.progress.todayQuestions || 0);
const wrongCount = computed(() => store.wrongBook.length || 0);
const accuracy = computed(() => {
  if (!store.progress.todayQuestions) return 0;
  return Math.round((store.progress.todayCorrect / store.progress.todayQuestions) * 100);
});

const mathProgress = computed(() => {
  const { totalQuestions } = store.progress.mathProgress;
  return totalQuestions ? `已练${totalQuestions}题` : "点我开始";
});
const pinyinProgress = computed(() => {
  const p = store.progress.pinyinProgress;
  return p.learnedPinyin.length ? `学会${p.learnedPinyin.length}个` : "点我开始";
});
const englishProgress = computed(() => {
  const p = store.progress.englishProgress;
  return p.learnedWords.length ? `学会${p.learnedWords.length}词` : "点我开始";
});
const challengeLabel = computed(() => {
  const done = Object.values(store.challengeProgress).filter((c) => c.completed).length;
  return done ? `${done}/12 已通关` : "开始闯关";
});

const tip = getRandomEncouragement("completion");

onMounted(() => {
  store.ensureDailyReset();
});

function go(url: string) {
  const tabs = ["/pages/home/index", "/pages/wrongbook/index", "/pages/settings/index"];
  if (tabs.includes(url)) {
    uni.switchTab({ url });
  } else {
    uni.navigateTo({ url });
  }
}
function goSettings() {
  uni.switchTab({ url: "/pages/settings/index" });
}
</script>

<style lang="scss" scoped>
/* ===== 页面容器 ===== */
.home-page {
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  min-height: 100vh;
  background: linear-gradient(180deg, rgba(255, 107, 107, 0.06) 0%, #fff9e6 40%, rgba(236, 253, 245, 0.12) 100%);
  padding-bottom: calc(env(safe-area-inset-bottom) + 24px);
}

/* ===== 顶部渐变栏 ===== */
.header-area {
  position: relative;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e72 50%, #4ecdc4 100%);
  border-radius: 0 0 24px 24px;
  overflow: hidden;
  padding-top: env(safe-area-inset-top);
  padding-bottom: 24px;

  /* 装饰气泡 */
  .bubble {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
  }
  .bubble-1 {
    top: -40px;
    left: -40px;
    width: 160px;
    height: 160px;
    background: rgba(255, 255, 255, 0.2);
    filter: blur(24px);
  }
  .bubble-2 {
    top: 80px;
    right: -24px;
    width: 128px;
    height: 128px;
    background: rgba(253, 224, 71, 0.4);
    filter: blur(20px);
  }
  .bubble-3 {
    bottom: 16px;
    left: 64px;
    width: 64px;
    height: 64px;
    background: rgba(255, 255, 255, 0.3);
  }

  .header-inner {
    position: relative;
    z-index: 1;
    padding: 16px 20px 0;
  }
}

/* 顶部栏 */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  margin-top: 8px;
}
.brand-pill {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border-radius: 999px;
  padding: 6px 16px 6px 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}
.settings-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
}
.settings-icon {
  font-size: 20px;
}

/* 问候语 */
.greeting-block {
  margin-bottom: 16px;
}
.greeting-title {
  display: block;
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.3;
  margin-bottom: 4px;
}
.greeting-sub {
  display: block;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.82);
  line-height: 1.4;
}

/* 今日学习卡片 */
.stats-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border-radius: 20px;
  padding: 18px;
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.04), 0 10px 24px rgba(255, 107, 107, 0.1);
}
.stats-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.stats-title {
  font-size: 19px;
  font-weight: 700;
  color: #ff6b6b;
}
.streak-row {
  display: flex;
  align-items: center;
  gap: 4px;
}
.streak-icon {
  font-size: 18px;
}
.streak-text {
  font-size: 15px;
  font-weight: 700;
  color: #f59e0b;
}

/* 三格统计 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 14px;
}
.stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 4px;
  border-radius: 14px;
}
.stat-coral {
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(255, 107, 107, 0.04));
}
.stat-green {
  background: linear-gradient(135deg, rgba(107, 203, 119, 0.1), rgba(107, 203, 119, 0.04));
}
.stat-yellow {
  background: linear-gradient(135deg, rgba(255, 217, 61, 0.15), rgba(255, 217, 61, 0.05));
}
.stat-num {
  font-size: 22px;
  font-weight: 800;
  color: #1f2937;
  line-height: 1.2;
  margin-bottom: 2px;
}
.stat-label {
  font-size: 11px;
  color: #6b7280;
}

/* 进度条 */
.progress-wrap {
  margin-top: 4px;
}
.progress-labels {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}
.progress-hint {
  font-size: 12px;
  color: #6b7280;
}
.progress-val {
  font-size: 12px;
  font-weight: 700;
  color: #ff6b6b;
}

/* ===== 模块入口 ===== */
.modules-section {
  padding: 20px 20px 0;
}
.module-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border: 1px solid #f3f4f6;
  border-radius: 20px;
  padding: 18px 20px;
  margin-bottom: 14px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  transition: transform 0.15s ease;
  cursor: pointer;
}
.module-card:active {
  transform: scale(0.97);
}
.module-math {
  background: linear-gradient(135deg, #fff0f0, #ffffff);
}
.module-pinyin {
  background: linear-gradient(135deg, #effafafa, #ffffff);
}
.module-pinyin {
  background: linear-gradient(135deg, #e6f7fa, #ffffff);
}
.module-english {
  background: linear-gradient(135deg, #eef4ff, #ffffff);
}
.module-challenge {
  background: linear-gradient(135deg, #fffbeb, #ffffff);
}
.module-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}
.module-emoji {
  font-size: 36px;
  line-height: 1;
  flex-shrink: 0;
}
.module-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.module-name {
  font-size: 17px;
  font-weight: 700;
  color: #ff6b6b;
  line-height: 1.3;
}
.text-coral {
  color: #ff6b6b !important;
}
.module-desc {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.3;
}

/* ===== 快捷操作 ===== */
.shortcuts-section {
  padding: 8px 20px 0;
}
.shortcut-large {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border: 1px solid #f3f4f6;
  border-radius: 20px;
  padding: 16px 18px;
  margin-bottom: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  cursor: pointer;
}
.shortcut-large:active {
  transform: scale(0.98);
}
.shortcut-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  min-width: 0;
}
.shortcut-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  flex-shrink: 0;
}
.shortcut-icon-warn {
  background: rgba(245, 158, 11, 0.12);
}
.shortcut-icon-coral {
  background: rgba(255, 107, 107, 0.1);
}
.shortcut-icon-gray {
  background: rgba(100, 116, 139, 0.08);
}
.shortcut-texts {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.shortcut-name {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.3;
}
.shortcut-desc {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.3;
}

/* 三格快捷 */
.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.shortcut-small {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: #ffffff;
  border: 1px solid #f3f4f6;
  border-radius: 16px;
  padding: 14px 8px;
  cursor: pointer;
  transition: transform 0.12s ease;
}
.shortcut-small:active {
  transform: scale(0.96);
}
.shortcut-icon-sm {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-bottom: 6px;
}
.shortcut-sm-name {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.3;
  margin-bottom: 2px;
}
.shortcut-sm-desc {
  font-size: 10px;
  color: #9ca3af;
  line-height: 1.2;
}

/* ===== 鼓励语 ===== */
.encouragement-bar {
  padding: 20px 20px 8px;
  text-align: center;
}
.encouragement-text {
  font-size: 16px;
  font-weight: 600;
  color: #4ecdc4;
  line-height: 1.5;
}

/* ===================== 三端响应式适配 ===================== */
/* 手机：移动优先基线（单列、全宽）
   iPad/平板(>=768px)：限制内容最大宽度并居中 + 模块入口变双列网格
   桌面(>=1024px)：进一步放大内容宽度与字号，保持居中不被拉伸 */

/* —— iPad / 平板：768px ~ 1023px —— */
@media screen and (min-width: 768px) {
  .home-page {
    max-width: 720px;
  }
  /* 头部栏在大屏上变为浮起的圆角卡片而非贴顶全宽 */
  .header-area {
    border-radius: 24px;
    margin: 12px 12px 0;
  }
  .header-inner {
    padding: 16px 28px 0;
  }
  /* 模块入口：单列 → 双列网格，充分利用大屏宽度 */
  .modules-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
  .module-card {
    margin-bottom: 0;
  }
  .module-name {
    font-size: 18px;
  }
  .stats-title {
    font-size: 20px;
  }
}

/* —— 桌面：>= 1024px —— */
@media screen and (min-width: 1024px) {
  .home-page {
    max-width: 860px;
  }
  .header-inner {
    padding: 20px 32px 0;
  }
  .greeting-title {
    font-size: 24px;
  }
  .greeting-sub {
    font-size: 15px;
  }
  .module-name {
    font-size: 19px;
  }
  .module-desc {
    font-size: 14px;
  }
  .module-emoji {
    font-size: 40px;
  }
  .stat-num {
    font-size: 24px;
  }
  .shortcut-name {
    font-size: 17px;
  }
}
</style>
