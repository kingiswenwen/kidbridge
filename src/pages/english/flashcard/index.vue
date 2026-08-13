<template>
  <view class="flash-bg">
    <view class="flash-stage px-6 pt-8">
      <view class="flash-header text-center">
        <image class="fh-icon" src="/static/icons/book2.svg" mode="aspectFit" />
        <text class="fh-title">英语闪卡</text>
        <text class="fh-subtitle">点击卡片翻一翻，学单词～</text>
      </view>

      <view class="category-row">
        <view
          v-for="c in categories"
          :key="c.key"
          :class="['cat-chip', c.key === category ? 'active' : '']"
          @click="category = c.key; idx = 0; flipped = false"
        >
          <image class="cat-icon-img" :src="c.icon" mode="aspectFit" />
          <text class="cat-name">{{ c.name }}</text>
          <text class="cat-count">{{ c.data.length }}</text>
        </view>
      </view>

      <!-- 卡片 -->
      <view class="flash-card-wrap mt-8">
        <view class="progress-top flex justify-between items-center mb-4">
          <text class="pt-label">
            {{ idx + 1 }} / {{ cards.length }}
          </text>
          <view class="progress-bar-mini">
            <view class="pb-fill" :style="{ width: `${((idx + 1) / cards.length) * 100}%` }" />
          </view>
          <text class="pt-complete">{{ completeRate }}%</text>
        </view>

        <view
          :class="['flash-card', flipped ? 'flipped' : '']"
          @click="flipped = !flipped"
        >
          <!-- 正面：图 + 英 -->
          <view class="card-face card-front">
            <text class="card-emoji">{{ card?.image }}</text>
            <text class="card-word">{{ card?.word }}</text>
            <text class="card-phonetic">/ {{ card?.phonetic }} /</text>
            <view class="speak-btn" @click.stop="speakWord">
              <image class="speak-icon-img" src="/static/icons/speaker.svg" mode="aspectFit" />
            </view>
            <text class="flip-hint">点卡片看中文意思</text>
          </view>

          <!-- 背面：中文 + 例句 -->
          <view class="card-face card-back">
            <text class="card-emoji">{{ card?.image }}</text>
            <text class="card-cn">{{ card?.chinese }}</text>
            <view class="example-box" v-if="card?.examples && card.examples[0]">
              <text class="ex-en">{{ card.examples[0].en }}</text>
              <text class="ex-cn">{{ card.examples[0].cn }}</text>
            </view>
            <text class="flip-hint back">点卡片翻回正面</text>
          </view>
        </view>

        <view class="nav-row mt-8 flex justify-center items-center gap-4">
          <view
            :class="['nav-btn', idx === 0 ? 'disabled' : '']"
            @click="prev"
          >
            <text class="nav-text">← 上一张</text>
          </view>
          <view
            class="know-btn"
            @click="markKnown"
          >
            <image class="know-icon-img" src="/static/icons/check.svg" mode="aspectFit" />
            <text class="know-text">认识</text>
          </view>
          <view
            :class="['nav-btn primary', idx + 1 === cards.length ? 'disabled' : '']"
            @click="next"
          >
            <text class="nav-text">下一张 →</text>
          </view>
        </view>
      </view>

      <!-- 更多功能入口 -->
      <view class="more-entry">
        <view class="me-grid">
          <view class="me-card" @click="go('/pages/english/sentences/index')">
            <image class="me-icon-img" src="/static/icons/mic.svg" mode="aspectFit" />
            <text class="me-name">日常句子</text>
          </view>
          <view class="me-card" @click="go('/pages/english/practice/index')">
            <image class="me-icon-img" src="/static/icons/pencil.svg" mode="aspectFit" />
            <text class="me-name">英语练习</text>
          </view>
        </view>
      </view>

      <view class="footer-tip mt-10 text-center">
        <text class="tip-text">Tip：H5 浏览器可自动发音，小程序点喇叭图标可播放</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { animalFlashcards, familyFlashcards, fruitFlashcards, colorFlashcards, numberFlashcards, type Flashcard } from "@/data/english";

const cats = [
  { key: "animal", name: "动物", icon: "/static/icons/paw.svg", data: animalFlashcards },
  { key: "family", name: "家人", icon: "/static/icons/family.svg", data: familyFlashcards },
  { key: "fruit", name: "水果", icon: "/static/icons/apple.svg", data: fruitFlashcards },
  { key: "color", name: "颜色", icon: "/static/icons/palette.svg", data: colorFlashcards },
  { key: "number", name: "数字", icon: "/static/icons/numbers.svg", data: numberFlashcards },
];
const categories = cats;

type CatKey = typeof cats[number]["key"];
const category = ref<CatKey>("animal");

const cards = computed<Flashcard[]>(
  () => (categories.find((c) => c.key === category.value)?.data || []) as Flashcard[],
);
const idx = ref(0);
const flipped = ref(false);
const known = ref<Record<string, boolean>>({});

const card = computed(() => cards.value[idx.value] || null);

const completeRate = computed(() => {
  const all = cards.value;
  if (!all.length) return 0;
  const k = all.filter((c) => known.value[category.value + "::" + c.word]).length;
  return Math.round((k / all.length) * 100);
});

const prev = () => {
  if (idx.value === 0) return;
  idx.value -= 1;
  flipped.value = false;
};
const next = () => {
  if (idx.value + 1 >= cards.value.length) return;
  idx.value += 1;
  flipped.value = false;
};

const markKnown = () => {
  if (!card.value) return;
  const key = category.value + "::" + card.value.word;
  known.value = { ...known.value, [key]: true };
  uni.showToast({ title: "已标记认识", icon: "none", duration: 600 });
  setTimeout(next, 400);
};

const speakWord = () => {
  if (!card.value) return;
  // #ifdef H5
  try {
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(card.value.word);
      u.lang = "en-US";
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
      return;
    }
  } catch (e) {}
  // #endif
  uni.showToast({ title: card.value.word, icon: "none", duration: 1000 });
};

const go = (url: string) => uni.navigateTo({ url });
</script>

<style lang="scss" scoped>
.flash-bg {
  min-height: 100vh;
  background: linear-gradient(180deg, #FDF2F8 0%, #EFF6FF 100%);
  padding-bottom: 140rpx;
}
.flash-stage { max-width: 880rpx; margin: 0 auto; }

.fh-icon { width: 100rpx; height: 100rpx; display: block; margin: 0 auto; }
.fh-title { display: block; font-size: 48rpx; font-weight: 800; color: #DB2777; margin-top: 8rpx; }
.fh-subtitle { display: block; font-size: 26rpx; color: #6B7280; margin-top: 6rpx; }

.category-row {
  margin-top: 36rpx;
  display: flex; gap: 16rpx; overflow-x: auto;
  padding: 8rpx 4rpx;
}
.cat-chip {
  display: flex; align-items: center; gap: 8rpx;
  padding: 14rpx 24rpx; border-radius: 999rpx;
  background: #FFFFFF;
  box-shadow: 0 4rpx 14rpx rgba(0,0,0,0.05);
  flex-shrink: 0;
  &.active { background: linear-gradient(135deg, #DB2777 0%, #8B5CF6 100%); .cat-name, .cat-count { color: #FFFFFF; } .cat-count { background: rgba(255,255,255,0.25); } }
  &:active { transform: scale(0.97); }
}
.cat-icon-img { width: 32rpx; height: 32rpx; }
.cat-name { font-size: 26rpx; color: #1F2937; font-weight: 700; }
.cat-count {
  margin-left: 4rpx;
  background: #F3F4F6; padding: 2rpx 14rpx; border-radius: 999rpx;
  font-size: 20rpx; color: #4B5563; font-weight: 700;
}

.progress-top { padding: 0 4rpx; }
.pt-label, .pt-complete { font-size: 24rpx; color: #6B7280; font-weight: 600; }
.progress-bar-mini { flex: 1; margin: 0 16rpx; height: 12rpx; border-radius: 999rpx; background: #F3F4F6; overflow: hidden; }
.pb-fill { height: 100%; background: linear-gradient(90deg, #DB2777, #8B5CF6); border-radius: 999rpx; transition: width 0.4s ease; }

/* Flip card */
.flash-card-wrap { perspective: 2000rpx; }
.flash-card {
  position: relative;
  width: 100%;
  min-height: 640rpx;
  border-radius: 40rpx;
  transition: transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
  transform-style: preserve-3d;
  &.flipped { transform: rotateY(180deg); }
}
.card-face {
  position: absolute; inset: 0;
  border-radius: 40rpx;
  padding: 40rpx 32rpx;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  backface-visibility: hidden;
  box-shadow: 0 20rpx 60rpx rgba(0,0,0,0.08);
}
.card-front {
  background: linear-gradient(135deg, #FFFFFF 0%, #FDF2F8 100%);
  border: 4rpx solid #FCE7F3;
}
.card-back {
  background: linear-gradient(135deg, #FFFFFF 0%, #EFF6FF 100%);
  border: 4rpx solid #DBEAFE;
  transform: rotateY(180deg);
}
.card-emoji { font-size: 200rpx; line-height: 1; }
.card-word { font-size: 64rpx; font-weight: 800; color: #DB2777; letter-spacing: 2rpx; margin-top: 16rpx; }
.card-phonetic { font-size: 30rpx; color: #8B5CF6; margin-top: 8rpx; letter-spacing: 1rpx; }

.card-cn { font-size: 60rpx; font-weight: 800; color: #1D4ED8; margin-top: 16rpx; }
.example-box {
  margin-top: 28rpx;
  padding: 24rpx;
  border-radius: 24rpx;
  background: #EFF6FF;
  text-align: center;
  max-width: 90%;
}
.ex-en { display: block; font-size: 30rpx; color: #1E3A8A; font-weight: 600; }
.ex-cn { display: block; font-size: 26rpx; color: #3B82F6; margin-top: 8rpx; }

.speak-btn {
  margin-top: 20rpx;
  width: 96rpx; height: 96rpx; border-radius: 999rpx;
  background: linear-gradient(135deg, #F472B6 0%, #C084FC 100%);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(192, 132, 252, 0.3);
  &:active { transform: scale(0.92); }
}
.speak-icon-img { width: 44rpx; height: 44rpx; }
.flip-hint { margin-top: 24rpx; font-size: 24rpx; color: #9CA3AF; &.back { color: #60A5FA; } }

/* Nav */
.nav-row { display: flex; gap: 16rpx; }
.nav-btn, .know-btn {
  padding: 20rpx 32rpx; border-radius: 28rpx;
  display: flex; align-items: center; justify-content: center; gap: 8rpx;
  min-width: 180rpx;
  &:active { transform: scale(0.96); }
}
.know-icon-img { width: 28rpx; height: 28rpx; }
.nav-btn {
  background: #FFFFFF; border: 3rpx solid #E5E7EB;
  &.primary { background: linear-gradient(135deg, #DB2777 0%, #8B5CF6 100%); border-color: transparent; .nav-text { color: #FFFFFF; } }
  &.disabled { opacity: 0.4; }
}
.nav-text { font-size: 28rpx; font-weight: 700; color: #4B5563; }
.know-btn {
  background: linear-gradient(135deg, #10B981 0%, #14B8A6 100%);
  box-shadow: 0 10rpx 32rpx rgba(16, 185, 129, 0.28);
}
.know-text { color: #FFFFFF; font-size: 28rpx; font-weight: 700; }

.footer-tip { padding-bottom: 24rpx; }
.tip-text { font-size: 22rpx; color: #9CA3AF; }

.mt-8 { margin-top: 32rpx; }
.mt-10 { margin-top: 40rpx; }

/* 更多功能入口 */
.more-entry { margin-top: 32rpx; padding: 28rpx; background: #FFFFFF; border-radius: 32rpx; box-shadow: 0 8rpx 28rpx rgba(0,0,0,0.05); }
.me-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16rpx; }
.me-card {
  background: linear-gradient(135deg, #FDF2F8 0%, #EFF6FF 100%);
  border-radius: 24rpx; padding: 28rpx 8rpx;
  display: flex; flex-direction: column; align-items: center; gap: 10rpx;
  &:active { transform: scale(0.95); }
}
.me-icon-img { width: 56rpx; height: 56rpx; }
.me-name { font-size: 26rpx; font-weight: 700; color: #1F2937; }
</style>
