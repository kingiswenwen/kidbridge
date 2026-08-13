<template>
  <view class="pinyin-page">
    <!-- 顶部导航 -->
    <view class="tabs">
      <view
        v-for="(t, idx) in tabs"
        :key="t.key"
        :class="['tab', tab === t.key ? 'active' : '']"
        @click="tab = t.key"
      >
        <text class="tab-text">{{ t.label }}</text>
        <view v-if="tab === t.key" class="tab-line" />
      </view>
    </view>

    <scroll-view scroll-y class="content" :show-scrollbar="false">
      <!-- 声母 -->
      <view v-if="tab === 'initial'" class="section">
        <view
          v-for="group in initialGroups"
          :key="group.title"
          class="group"
        >
          <text class="group-title">{{ group.title }}</text>
          <view class="grid-5">
            <view
              v-for="it in group.items"
              :key="it.pinyin"
              :class="['py-cell', it.isFlat ? 'flat' : '', it.isCurled ? 'curled' : '']"
              @click="speak(it.pinyin)"
            >
              <text class="py-char">{{ it.pinyin }}</text>
              <text class="py-tips">{{ it.tips }}</text>
              <text v-if="it.isFlat" class="tag tag-flat">平舌</text>
              <text v-if="it.isCurled" class="tag tag-curl">翘舌</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 韵母 -->
      <view v-if="tab === 'vowel'" class="section">
        <view
          v-for="group in vowelGroups"
          :key="group.title"
          class="group"
        >
          <text class="group-title">{{ group.title }}</text>
          <view :class="group.items.length > 6 ? 'grid-5' : 'grid-4'">
            <view
              v-for="it in group.items"
              :key="it.pinyin"
              class="py-cell vowel"
              @click="speak(it.pinyin)"
            >
              <text class="py-char c-vowel">{{ it.pinyin }}</text>
              <text class="py-tips">{{ it.tips }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 整体认读 -->
      <view v-if="tab === 'whole'" class="section">
        <view class="group">
          <text class="group-title">整体认读音节 (16 个，不用拼直接读)</text>
          <view class="grid-4">
            <view
              v-for="(s, i) in wholeSyllables"
              :key="s.pinyin"
              class="py-cell whole"
              @click="speak(s.pinyin)"
            >
              <text class="py-char c-whole">{{ s.pinyin }}</text>
              <text class="py-tips">第 {{ i + 1 }} 个</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 四声 -->
      <view v-if="tab === 'tone'" class="section">
        <view class="group">
          <text class="group-title">拼音四声调 + 轻声</text>
          <view class="tone-demo">
            <view
              v-for="(t, i) in toneDemos"
              :key="i"
              class="tone-cell"
              @click="speakWithTone(t.base, i)"
            >
              <text class="tone-sample" :style="{ color: toneColor(i) }">{{ t.symbol }}</text>
              <text class="tone-name">{{ t.name }}</text>
              <text class="tone-desc">{{ t.desc }}</text>
            </view>
          </view>

          <view class="mt-10">
            <text class="group-title">单韵母四声示范（按 a 来练）</text>
            <view class="grid-5 mt-4">
              <view
                v-for="(v, i) in singleVowels"
                :key="v.pinyin"
                class="vowel-demo"
              >
                <text class="v-demo-title">{{ v.pinyin }}</text>
                <view class="v-tones">
                  <view
                    v-for="n in 4"
                    :key="n"
                    class="vt-item"
                    :style="{ color: toneColor(n) }"
                    @click="speakSingleVowelTone(v.pinyin, n)"
                  >{{ toneMark(v.pinyin, n) }}</view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 更多功能入口 -->
      <view class="more-entry">
        <text class="me-title">更多练习</text>
        <view class="me-grid">
          <view class="me-card" @click="go('/pages/pinyin/spelling/index')">
            <image class="me-icon-img" src="/static/icons/puzzle.svg" mode="aspectFit" />
            <text class="me-name">拼音拼读</text>
          </view>
          <view class="me-card" @click="go('/pages/pinyin/practice/index')">
            <image class="me-icon-img" src="/static/icons/pencil.svg" mode="aspectFit" />
            <text class="me-name">拼音练习</text>
          </view>
          <view class="me-card" @click="go('/pages/pinyin/table/index')">
            <image class="me-icon-img" src="/static/icons/clipboard.svg" mode="aspectFit" />
            <text class="me-name">拼音总表</text>
          </view>
          <view class="me-card" @click="go('/pages/pinyin/initials/index')">
            <image class="me-icon-img" src="/static/icons/letters.svg" mode="aspectFit" />
            <text class="me-name">声母详解</text>
          </view>
          <view class="me-card" @click="go('/pages/pinyin/vowels/index')">
            <image class="me-icon-img" src="/static/icons/lettera.svg" mode="aspectFit" />
            <text class="me-name">韵母详解</text>
          </view>
        </view>
      </view>

      <view style="height: 160rpx;" />
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import {
  labialInitials, alveolarInitials, velarInitials, palatalInitials,
  flatInitials, curledInitials, allInitials, initialCategories,
} from "@/data/pinyin/initials";
import {
  singleVowels, compoundVowels, frontNasalVowels, backNasalVowels,
} from "@/data/pinyin/vowels";
import { wholeSyllables, toneNames, toneDescriptions, toneSymbols } from "@/data/pinyin/syllables";
import type { PinyinItem } from "@/types";

const tab = ref<"initial" | "vowel" | "whole" | "tone">("initial");
const tabs = [
  { key: "initial" as const, label: "声母 23" },
  { key: "vowel" as const, label: "韵母 24" },
  { key: "whole" as const, label: "整体认读 16" },
  { key: "tone" as const, label: "四声调" },
];

// 声母按发音部位分组
const initialGroups = [
  { title: initialCategories.labial?.name || "唇音（b p m f）", items: labialInitials },
  { title: initialCategories.alveolar?.name || "舌尖音（d t n l）", items: alveolarInitials },
  { title: initialCategories.velar?.name || "舌根音（g k h）", items: velarInitials },
  { title: initialCategories.palatal?.name || "舌面音（j q x）", items: palatalInitials },
  { title: initialCategories.flat?.name || "平舌音（z c s）", items: flatInitials },
  { title: initialCategories.curled?.name || "翘舌音（zh ch sh r）", items: curledInitials },
  { title: "零声母（y w）", items: allInitials.filter((i) => ["y", "w"].includes(i.pinyin)) },
];

// 韵母分组
const vowelGroups = [
  { title: "单韵母（6 个）", items: singleVowels },
  { title: "复韵母（9 个）", items: compoundVowels },
  { title: "前鼻韵母（5 个）", items: frontNasalVowels },
  { title: "后鼻韵母（4 个）", items: backNasalVowels },
];

// 声调（toneNames/toneSymbols/toneDescriptions 都是 Record<> 对象，转成数组使用）
const toneOrder = [0, 1, 2, 3, 4] as const;
const toneDemos = toneOrder.map((i) => ({
  idx: i,
  base: 'a',
  name: toneNames[i],
  symbol: toneSymbols[i],
  desc: toneDescriptions[i],
}));
const toneColor = (tone: number) =>
  ["#9CA3AF", "#FF6B6B", "#FFD93D", "#4ECDC4", "#74B9FF"][tone] || "#6B7280";

// 简单的声调标注（常用 6 个单韵母）
const toneMark = (base: string, tone: number): string => {
  const map: Record<string, string[]> = {
    a: ["a", "ā", "á", "ǎ", "à"],
    o: ["o", "ō", "ó", "ǒ", "ò"],
    e: ["e", "ē", "é", "ě", "è"],
    i: ["i", "ī", "í", "ǐ", "ì"],
    u: ["u", "ū", "ú", "ǔ", "ù"],
    ü: ["ü", "ǖ", "ǘ", "ǚ", "ǜ"],
  };
  return (map[base] && map[base][tone]) || base;
};

// 朗读
const speak = (text: string) => {
  // #ifdef H5
  try {
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "zh-CN";
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
      return;
    }
  } catch (e) {}
  // #endif
  uni.showToast({ title: text, icon: "none", duration: 800 });
};
const speakWithTone = (base: string, tone: number) => {
  const demo = toneDemos.find((d) => d.idx === tone);
  speak(`${toneMark(base, tone || 1)}（${demo?.name || "轻声"}）`);
};
const speakSingleVowelTone = (base: string, n: number) => speak(toneMark(base, n));

// 让编译器不警告未使用类型（兼容导入）
void ({} as PinyinItem);

// 跳转到子功能页
const go = (url: string) => uni.navigateTo({ url });
</script>

<style lang="scss" scoped>
.pinyin-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #FFF9E6 0%, #F0FDFA 100%);
  display: flex;
  flex-direction: column;
}
.tabs {
  display: flex;
  background: #FFFFFF;
  padding: 20rpx 16rpx 0;
  border-bottom: 2rpx solid #F3F4F6;
  position: sticky; top: 0; z-index: 10;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.03);
}
.tab { flex: 1; position: relative; padding: 20rpx 0; display: flex; flex-direction: column; align-items: center; gap: 8rpx; }
.tab-text { font-size: 28rpx; color: #6B7280; font-weight: 600; }
.tab.active .tab-text { color: #FF6B6B; font-weight: 800; font-size: 30rpx; }
.tab-line { width: 48rpx; height: 6rpx; border-radius: 999rpx; background: #FF6B6B; }

.content { flex: 1; padding: 24rpx 20rpx; }
.section { display: flex; flex-direction: column; gap: 32rpx; }
.group { background: #FFFFFF; border-radius: 32rpx; padding: 28rpx; box-shadow: 0 6rpx 22rpx rgba(0,0,0,0.04); }
.group-title { display: block; font-size: 28rpx; font-weight: 700; color: #1F2937; margin-bottom: 20rpx; padding-left: 8rpx; border-left: 6rpx solid #FF6B6B; }

.grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 16rpx; }
.grid-5 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr; gap: 12rpx; }

.py-cell {
  position: relative;
  background: linear-gradient(135deg, #FFF 0%, #FFF9F0 100%);
  border-radius: 24rpx;
  padding: 20rpx 8rpx 16rpx;
  border: 3rpx solid #FFE4E6;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 140rpx;
  transition: all 0.15s;
  &:active { transform: scale(0.94); }
  &.flat { border-color: #FFD93D; background: linear-gradient(135deg, #FFFFFF 0%, #FFFBEB 100%); }
  &.curled { border-color: #4ECDC4; background: linear-gradient(135deg, #FFFFFF 0%, #F0FDFA 100%); }
  &.vowel { border-color: #E0F2FE; background: linear-gradient(135deg, #FFFFFF 0%, #F0F9FF 100%); }
  &.whole { border-color: #FCE7F3; background: linear-gradient(135deg, #FFFFFF 0%, #FDF2F8 100%); }
}
.py-char { font-size: 48rpx; font-weight: 800; color: #FF6B6B; letter-spacing: 1rpx; line-height: 1.1; }
.py-char.c-vowel { color: #0284C7; }
.py-char.c-whole { color: #DB2777; }
.py-tips { font-size: 20rpx; color: #9CA3AF; margin-top: 6rpx; text-align: center; padding: 0 6rpx; line-height: 1.3; }
.tag { position: absolute; top: 8rpx; right: 8rpx; font-size: 18rpx; padding: 2rpx 10rpx; border-radius: 999rpx; font-weight: 600; }
.tag-flat { background: #FEF3C7; color: #B45309; }
.tag-curl { background: #CCFBF1; color: #047857; }

/* Tone demo */
.tone-demo { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr; gap: 16rpx; }
.tone-cell {
  background: linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%);
  border-radius: 24rpx;
  padding: 24rpx 8rpx;
  border: 3rpx solid #E5E7EB;
  display: flex; flex-direction: column; align-items: center; gap: 6rpx;
  &:active { transform: scale(0.95); }
}
.tone-sample { font-size: 64rpx; font-weight: 800; }
.tone-name { font-size: 24rpx; font-weight: 700; color: #374151; }
.tone-desc { font-size: 20rpx; color: #6B7280; text-align: center; }

/* Vowel demo */
.vowel-demo {
  background: linear-gradient(135deg, #FFF 0%, #F0F9FF 100%);
  border: 3rpx solid #BAE6FD;
  border-radius: 24rpx;
  padding: 16rpx 8rpx;
  display: flex; flex-direction: column; align-items: center; gap: 8rpx;
}
.v-demo-title { font-size: 36rpx; font-weight: 800; color: #0284C7; }
.v-tones { display: flex; gap: 10rpx; }
.vt-item {
  width: 56rpx; height: 56rpx; border-radius: 16rpx;
  background: #FFFFFF;
  display: flex; align-items: center; justify-content: center;
  font-size: 30rpx; font-weight: 700;
  border: 2rpx solid #E5E7EB;
  &:active { transform: scale(0.9); }
}
.mt-10 { margin-top: 40rpx; }
.mt-4 { margin-top: 16rpx; }

/* 更多功能入口 */
.more-entry { margin-top: 32rpx; padding: 28rpx; background: #FFFFFF; border-radius: 32rpx; box-shadow: 0 6rpx 22rpx rgba(0,0,0,0.04); }
.me-title { display: block; font-size: 28rpx; font-weight: 700; color: #1F2937; margin-bottom: 20rpx; padding-left: 8rpx; border-left: 6rpx solid #4ECDC4; }
.me-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16rpx; }
.me-card {
  background: linear-gradient(135deg, #E0F7F5 0%, #FFF9E6 100%);
  border-radius: 24rpx; padding: 24rpx 8rpx;
  display: flex; flex-direction: column; align-items: center; gap: 10rpx;
  &:active { transform: scale(0.95); }
}
.me-icon-img { width: 52rpx; height: 52rpx; }
.me-name { font-size: 24rpx; font-weight: 700; color: #1F2937; }
</style>
