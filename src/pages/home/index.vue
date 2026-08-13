<template>
  <view class="min-h-screen bg-gradient-to-b from-primary-coral/10 via-bg-cream to-bg-mint/20 pb-safe-bottom">
    <!-- 顶部渐变栏 -->
    <view class="relative h-[calc(340rpx+env(safe-area-inset-top))] bg-gradient-to-br from-primary-coral via-[#FF8E72] to-primary-mint rounded-b-[48rpx] overflow-hidden">
      <!-- 装饰气泡 -->
      <view class="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/20 blur-xl"></view>
      <view class="absolute top-20 -right-6 w-32 h-32 rounded-full bg-yellow-300/40 blur-xl"></view>
      <view class="absolute bottom-4 left-16 w-16 h-16 rounded-full bg-white/30"></view>

      <view class="pt-safe-top px-6 pb-8 relative">
        <!-- 顶部栏：品牌标识 + 设置 -->
        <view class="flex items-center justify-between mb-4 mt-2">
          <view class="flex items-center gap-2 bg-white/95 backdrop-blur rounded-full pl-2 pr-5 py-2 shadow-soft">
            <BrandLogo :size="72" :chip="false" :show-wordmark="true" />
          </view>
          <view class="flex gap-2">
            <view class="w-11 h-11 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-xl" @click="goSettings">
              ⚙️
            </view>
          </view>
        </view>

        <!-- 问候语 -->
        <view class="mb-4">
          <uv-text type="white" size="lg" font-weight="bold">你好，小朋友！</uv-text>
          <uv-text type="white" :opacity="80" size="sm">今天也要一起加油呀</uv-text>
        </view>

        <!-- 学习概览卡片 -->
        <view class="bg-white/95 backdrop-blur rounded-3xl p-5 shadow-cartoon">
          <view class="flex justify-between items-center mb-4">
            <view>
              <uv-text type="primary" size="xxl" font-weight="bold">📚 今日学习</uv-text>
            </view>
            <view class="flex items-center gap-1">
              <text class="text-orange-500 text-xl">🔥</text>
              <uv-text type="warning" size="lg" font-weight="bold">{{ streak }}天连续</uv-text>
            </view>
          </view>

          <view class="grid grid-cols-3 gap-3 mb-3">
            <view class="flex flex-col items-center py-3 rounded-2xl bg-gradient-to-br from-primary-coral/10 to-primary-coral/5">
              <uv-text type="primary" size="xxl" font-weight="bold">{{ todayQuestions }}</uv-text>
              <uv-text type="info" size="sm">今日题数</uv-text>
            </view>
            <view class="flex flex-col items-center py-3 rounded-2xl bg-gradient-to-br from-success/10 to-success/5">
              <uv-text type="success" size="xxl" font-weight="bold">{{ accuracy }}%</uv-text>
              <uv-text type="info" size="sm">正确率</uv-text>
            </view>
            <view class="flex flex-col items-center py-3 rounded-2xl bg-gradient-to-br from-warning/15 to-warning/5">
              <uv-text type="warning" size="xxl" font-weight="bold">{{ wrongCount }}</uv-text>
              <uv-text type="info" size="sm">待复习</uv-text>
            </view>
          </view>

          <!-- 进度条 -->
          <view>
            <view class="flex justify-between mb-1">
              <uv-text type="content" size="sm">今日目标 10 题</uv-text>
              <uv-text type="primary" size="sm" font-weight="bold">{{ Math.min(todayQuestions, 10) }}/10</uv-text>
            </view>
            <uv-line-progress :percentage="Math.min(todayQuestions * 10, 100)" color="#FF6B6B" activeColor="#FF6B6B" height="14" striped striped-flow />
          </view>
        </view>
      </view>
    </view>

    <!-- 模块入口 -->
    <view class="px-5 pt-6">
      <uv-row :gutter="20">
        <!-- 数学 -->
        <uv-col :span="12">
          <view class="entry-card card-base !p-5 mb-5 cursor-pointer bg-gradient-to-br from-[#FFE5E5] to-white" @click="go('/pages/math/practice/index')">
            <view class="text-5xl mb-3">🔢</view>
            <uv-text type="primary" size="xl" font-weight="bold" mb-1>数学启蒙</uv-text>
            <uv-text type="content" size="sm" mb-3>10/20以内加减</uv-text>
            <uv-tag type="primary" mode="light" shape="circle" size="mini" :text="mathProgress" />
          </view>
        </uv-col>

        <!-- 拼音 -->
        <uv-col :span="12">
          <view class="entry-card card-base !p-5 mb-5 cursor-pointer bg-gradient-to-br from-[#D1FAFA] to-white" @click="go('/pages/pinyin/index')">
            <view class="text-5xl mb-3">🅰️</view>
            <uv-text type="primary-mint" size="xl" font-weight="bold" mb-1 color="#4ECDC4">拼音学习</uv-text>
            <uv-text type="content" size="sm" mb-3>声母·韵母·拼读</uv-text>
            <uv-tag type="success" mode="light" shape="circle" size="mini" :text="pinyinProgress" />
          </view>
        </uv-col>

        <!-- 英语 -->
        <uv-col :span="12">
          <view class="entry-card card-base !p-5 mb-5 cursor-pointer bg-gradient-to-br from-[#DBEAFE] to-white" @click="go('/pages/english/flashcard/index')">
            <view class="text-5xl mb-3">🔤</view>
            <uv-text color="#74B9FF" type="info" size="xl" font-weight="bold" mb-1>英语启蒙</uv-text>
            <uv-text type="content" size="sm" mb-3>闪卡·日常句子</uv-text>
            <uv-tag type="info" mode="light" shape="circle" size="mini" :text="englishProgress" />
          </view>
        </uv-col>

        <!-- 闯关 -->
        <uv-col :span="12">
          <view class="entry-card card-base !p-5 mb-5 cursor-pointer bg-gradient-to-br from-[#FEF3C7] to-white" @click="go('/pages/math/challenge/index')">
            <view class="text-5xl mb-3">🏆</view>
            <uv-text color="#D97706" type="warning" size="xl" font-weight="bold" mb-1>闯关挑战</uv-text>
            <uv-text type="content" size="sm" mb-3>12关等你解锁</uv-text>
            <uv-tag type="warning" mode="light" shape="circle" size="mini" :text="challengeLabel" />
          </view>
        </uv-col>
      </uv-row>
    </view>

    <!-- 快捷操作 -->
    <view class="px-5 pt-2">
      <view class="card-base flex items-center justify-between p-5" @click="go('/pages/wrongbook/index')">
        <view class="flex items-center gap-4">
          <view class="w-14 h-14 rounded-2xl bg-warning/15 flex items-center justify-center text-3xl">📒</view>
          <view>
            <uv-text size="lg" font-weight="bold" mb-1>错题本</uv-text>
            <uv-text type="content" size="sm">{{ wrongCount }} 道题目需要复习</uv-text>
          </view>
        </view>
        <uv-button type="warning" size="normal" shape="circle" icon="arrow-rightward" />
      </view>

      <!-- 4 个快捷入口：闯关、错题本（↑）、收藏、设置 -->
      <view class="grid grid-cols-3 gap-4 mt-5">
        <view class="card-base !p-4 flex flex-col items-center text-center" @click="go('/pages/math/challenge/index')">
          <view class="w-12 h-12 rounded-2xl bg-warning/15 flex items-center justify-center text-2xl mb-2">🏆</view>
          <uv-text size="sm" font-weight="bold">闯关挑战</uv-text>
          <uv-text type="info" size="xs">{{ challengeLabel }}</uv-text>
        </view>
        <view class="card-base !p-4 flex flex-col items-center text-center" @click="go('/pages/pinyin/favorites/index')">
          <view class="w-12 h-12 rounded-2xl bg-primary-coral/10 flex items-center justify-center text-2xl mb-2">⭐</view>
          <uv-text size="sm" font-weight="bold">我的收藏</uv-text>
          <uv-text type="info" size="xs">喜欢的拼音</uv-text>
        </view>
        <view class="card-base !p-4 flex flex-col items-center text-center" @click="goSettings">
          <view class="w-12 h-12 rounded-2xl bg-slate-500/10 flex items-center justify-center text-2xl mb-2">⚙️</view>
          <uv-text size="sm" font-weight="bold">设置</uv-text>
          <uv-text type="info" size="xs">偏好·进度</uv-text>
        </view>
      </view>
    </view>

    <!-- 鼓励语 -->
    <view class="px-5 pt-5 pb-10 text-center">
      <uv-text type="primary-mint" size="lg" color="#4ECDC4">✨ {{ tip }}</uv-text>
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
  const { totalQuestions, correctAnswers } = store.progress.mathProgress;
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
  // tabbar 页面用 switchTab
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
.entry-card {
  transition: transform 0.15s ease;
}
.entry-card:active {
  transform: scale(0.96);
}
</style>
