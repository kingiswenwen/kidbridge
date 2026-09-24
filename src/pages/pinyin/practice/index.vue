<template>
  <view class="py-practice-bg">
    <!-- 进度条 -->
    <view v-if="state === 'practice'" class="px-4 pt-4">
      <ProgressBar
        :current="currentIndex + 1"
        :total="questions.length"
        :correct="correctCount"
      />
    </view>

    <!-- 阶段一：选模式 -->
    <view v-if="state === 'select'" class="py-stage px-6 pt-10">
      <view class="py-hero text-center">
        <image class="py-hero-icon" src="/static/icons/book2.svg" mode="aspectFit" />
        <text class="py-hero-title">拼音练习</text>
        <text class="py-hero-subtitle">选一个模式开始练习吧～</text>
      </view>

      <view class="mode-grid">
        <view
          v-for="m in modes"
          :key="m.key"
          :class="['mode-card', mode === m.key ? 'selected' : '']"
          @click="mode = m.key"
        >
          <image class="mode-icon-img" :src="m.icon" mode="aspectFit" />
          <text class="mode-name">{{ m.name }}</text>
          <text class="mode-desc">{{ m.desc }}</text>
        </view>
      </view>

      <view class="count-picker mt-8 flex items-center justify-center gap-4">
        <text class="text-gray-500 text-sm">题目数量</text>
        <view
          v-for="n in [5, 10, 20]"
          :key="n"
          :class="['count-chip', n === count ? 'active' : '']"
          @click="count = n"
        >
          <text class="count-chip-text">{{ n }} 题</text>
        </view>
      </view>

      <view class="start-btn mt-10" @click="start()">
        <text class="start-text">开始练习</text>
      </view>
    </view>

    <!-- 阶段二：答题 -->
    <view v-else-if="state === 'practice'" class="py-stage px-4 pt-4 pb-32">
      <view v-if="q" class="q-card-2">
        <!-- char -> pinyin -->
        <template v-if="mode === 'char2pinyin'">
          <view class="prompt-row text-center">
            <text class="prompt-hint">请选出下面汉字的正确拼音</text>
            <view class="char-big-wrap mt-4">
              <text class="char-emoji">{{ q.image }}</text>
              <text class="char-big">{{ q.char }}</text>
            </view>
          </view>
        </template>

        <!-- pinyin -> char -->
        <template v-else>
          <view class="prompt-row text-center">
            <text class="prompt-hint">请选出和拼音匹配的汉字</text>
            <view class="pinyin-big-wrap mt-4">
              <text
                class="pinyin-big"
                :style="{ color: toneColor(q.tone) }"
              >{{ displayPinyin }}</text>
              <text class="tone-tag">{{ toneLabel(q.tone) }}</text>
            </view>
          </view>
        </template>

        <!-- 选项 -->
        <view class="options-grid-2 mt-8 grid grid-cols-2 gap-3">
          <OptionButton
            v-for="(opt, i) in options"
            :key="(mode === 'char2pinyin' ? opt.pinyin : opt.char) + i"
            :value="mode === 'char2pinyin' ? displayOpt(opt) : opt.char"
            :disabled="isAnswered"
            :is-selected="isSelected(opt)"
            :is-correct="getIsCorrect(opt)"
            @click="() => handlePick(opt)"
          />
        </view>

        <view v-if="isAnswered" class="feedback text-center mt-8">
          <image :class="['fb-icon', lastCorrect ? 'right' : 'wrong']" :src="lastCorrect ? '/static/icons/party.svg' : '/static/icons/bulb.svg'" mode="aspectFit" />
          <text :class="['fb-text', lastCorrect ? 'right' : 'wrong']">
            {{ lastCorrect ? pick(encouragements).content : `${q.char} 读 ${displayPinyin}` }}
          </text>
          <view class="next-btn mt-6" @click="next">
            <text class="next-text">
              {{ currentIndex + 1 === questions.length ? '查看成绩' : '下一题 →' }}
            </text>
            <image v-if="currentIndex + 1 === questions.length" class="next-icon" src="/static/icons/trophy.svg" mode="aspectFit" />
          </view>
        </view>
      </view>
    </view>

    <!-- 阶段三：结算 -->
    <view v-else-if="state === 'result'" class="py-stage px-6 pt-10">
      <view class="result-card-2">
        <image class="r-icon" :src="resultIcon" mode="aspectFit" />
        <text class="r-title">{{ stars === 3 ? '全对啦！小拼音家' : stars === 2 ? '做得不错！' : stars === 1 ? '有进步！' : '继续加油呀！' }}</text>
        <view class="mt-6">
          <StarRating :stars="stars" :animated="true" />
        </view>
        <view class="r-stats mt-8">
          <view class="r-stat">
            <text class="r-v text-coral">{{ correctCount }}</text>
            <text class="r-l">答对</text>
          </view>
          <view class="r-stat">
            <text class="r-v text-gray-500">{{ questions.length - correctCount }}</text>
            <text class="r-l">答错</text>
          </view>
          <view class="r-stat">
            <text class="r-v text-green">{{ rate }}%</text>
            <text class="r-l">正确率</text>
          </view>
        </view>
        <view class="r-actions mt-10 flex gap-4">
          <view class="r-btn-a" @click="reset">
            <image class="r-btn-icon" src="/static/icons/refresh.svg" mode="aspectFit" />
            <text class="r-btn-a-text">再练一组</text>
          </view>
          <view class="r-btn-b" @click="() => uni.navigateBack()">
            <image class="r-btn-icon" src="/static/icons/arrow.svg" mode="aspectFit" />
            <text class="r-btn-b-text">返回</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { pinyinCharPairs, type PinyinCharPair } from "@/data/pinyin/questions";
import { encouragement as encouragements } from "@/data/encouragements";
import ProgressBar from "@/components/ProgressBar.vue";
import OptionButton from "@/components/OptionButton.vue";
import StarRating, { calculateStars } from "@/components/StarRating.vue";

type Mode = "char2pinyin" | "pinyin2char";

const modes = [
  { key: "char2pinyin" as Mode, name: "认字 → 选拼音", desc: "看到汉字，选择正确的读音", icon: "/static/icons/book2.svg" },
  { key: "pinyin2char" as Mode, name: "拼音 → 选汉字", desc: "看到拼音，选出对应的汉字", icon: "/static/icons/pencil.svg" },
];

const mode = ref<Mode>("char2pinyin");
const count = ref(10);

const state = ref<"select" | "practice" | "result">("select");
const questions = ref<PinyinCharPair[]>([]);
const currentIndex = ref(0);
const options = ref<PinyinCharPair[]>([]);
const selected = ref<PinyinCharPair | null>(null);
const isAnswered = ref(false);
const correctCount = ref(0);
const lastCorrect = ref(false);

const q = computed(() => questions.value[currentIndex.value]);
const rate = computed(() =>
  questions.value.length ? Math.round((correctCount.value / questions.value.length) * 100) : 0,
);
const stars = computed(() => calculateStars(correctCount.value, questions.value.length));
const resultIcon = computed(() => {
  if (stars.value === 3) return '/static/icons/trophy.svg';
  if (stars.value === 2) return '/static/icons/party.svg';
  if (stars.value === 1) return '/static/icons/bulb.svg';
  return '/static/icons/sparkle.svg';
});

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const pickMany = <T,>(arr: T[], n: number): T[] => {
  const a = [...arr];
  const out: T[] = [];
  while (out.length < n && a.length) {
    const i = Math.floor(Math.random() * a.length);
    out.push(a.splice(i, 1)[0]);
  }
  return out;
};

// 带声调显示
const markMap: Record<string, Record<number, string>> = {
  a: { 1: "ā", 2: "á", 3: "ǎ", 4: "à" },
  o: { 1: "ō", 2: "ó", 3: "ǒ", 4: "ò" },
  e: { 1: "ē", 2: "é", 3: "ě", 4: "è" },
  i: { 1: "ī", 2: "í", 3: "ǐ", 4: "ì" },
  u: { 1: "ū", 2: "ú", 3: "ǔ", 4: "ù" },
  ü: { 1: "ǖ", 2: "ǘ", 3: "ǚ", 4: "ǜ" },
};
const vowelsRe = /[aeiouü]/;

const withTone = (pinyin: string, tone: number): string => {
  if (tone === 0 || !tone) return pinyin;
  // 找到主要的元音字母（最靠近 a/o/e 的那个；否则最左）
  const vowelsIn = pinyin.match(/[aeiouü]+/g) || [];
  if (!vowelsIn.length) return pinyin;
  const group = vowelsIn[vowelsIn.length - 1];
  // 在组里优先 a > o > e > 其他
  let vowel: string = group[0];
  for (const order of ["a", "o", "e", "i", "u", "ü"]) {
    if (group.includes(order)) { vowel = order; break; }
  }
  const repl = markMap[vowel]?.[tone] || vowel;
  return pinyin.replace(vowel, repl);
};

const displayPinyin = computed(() =>
  q.value ? withTone(q.value.pinyin, q.value.tone) : "",
);
const displayOpt = (opt: PinyinCharPair) => withTone(opt.pinyin, opt.tone);

const toneColor = (tone: number) =>
  ["#9CA3AF", "#FF6B6B", "#FFD93D", "#4ECDC4", "#74B9FF"][tone] || "#6B7280";
const toneLabel = (tone: number) =>
  ["轻声", "一声", "二声", "三声", "四声"][tone] || "";

// 生成题目 + 干扰项
const start = () => {
  const all = pinyinCharPairs.slice();
  // 打乱 + 截取 count
  questions.value = pickMany(all, Math.min(count.value, all.length));
  buildOptions();
  currentIndex.value = 0;
  selected.value = null;
  isAnswered.value = false;
  correctCount.value = 0;
  state.value = "practice";
};

const buildOptions = () => {
  if (!q.value) return;
  const distractors = pickMany(
    pinyinCharPairs.filter(
      (x) =>
        mode.value === "char2pinyin"
          ? x.pinyin + String(x.tone) !== q.value!.pinyin + String(q.value!.tone)
          : x.char !== q.value!.char,
    ),
    3,
  );
  options.value = pickMany([q.value, ...distractors], 4);
};

const isSelected = (opt: PinyinCharPair): boolean =>
  !!selected.value &&
  (mode.value === "char2pinyin"
    ? selected.value.pinyin === opt.pinyin && selected.value.tone === opt.tone
    : selected.value.char === opt.char);

const getIsCorrect = (opt: PinyinCharPair): boolean | undefined => {
  if (!isAnswered.value) return undefined;
  const same = (a: PinyinCharPair, b: PinyinCharPair) =>
    mode.value === "char2pinyin"
      ? a.pinyin === b.pinyin && a.tone === b.tone
      : a.char === b.char;
  if (same(opt, q.value!)) return true;
  if (selected.value && same(opt, selected.value)) return false;
  return undefined;
};

const handlePick = (opt: PinyinCharPair) => {
  if (isAnswered.value) return;
  selected.value = opt;
  isAnswered.value = true;
  const ok =
    mode.value === "char2pinyin"
      ? opt.pinyin === q.value!.pinyin && opt.tone === q.value!.tone
      : opt.char === q.value!.char;
  lastCorrect.value = ok;
  if (ok) correctCount.value += 1;
};

const next = () => {
  if (currentIndex.value + 1 >= questions.value.length) {
    state.value = "result";
    return;
  }
  currentIndex.value += 1;
  buildOptions();
  selected.value = null;
  isAnswered.value = false;
};

const reset = () => (state.value = "select");

// 避免 unused
void vowelsRe;
</script>

<style lang="scss" scoped>
.py-practice-bg {
  min-height: 100vh;
  background: linear-gradient(180deg, #F0FDFA 0%, #FFF9E6 50%, #FFE4F1 100%);
  padding-bottom: 120rpx;
}
.py-stage { max-width: 860rpx; margin: 0 auto; }

.py-hero { display: flex; flex-direction: column; align-items: center; gap: 12rpx; }
.py-hero-icon { width: 120rpx; height: 120rpx; }
.py-hero-title { font-size: 56rpx; font-weight: 800; color: #047857; }
.py-hero-subtitle { font-size: 28rpx; color: #6B7280; }

.mode-grid {
  margin-top: 48rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}
.mode-card {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 32rpx 20rpx;
  border: 4rpx solid transparent;
  display: flex; flex-direction: column; align-items: center; gap: 12rpx;
  box-shadow: 0 8rpx 28rpx rgba(0,0,0,0.05);
  &.selected {
    border-color: #FF6B6B;
    background: linear-gradient(135deg, #FFF5F5 0%, #FFEBEE 100%);
    box-shadow: 0 12rpx 36rpx rgba(255,107,107,0.18);
  }
  &:active { transform: scale(0.97); }
}
.mode-icon-img { width: 72rpx; height: 72rpx; }
.mode-name { font-size: 32rpx; font-weight: 700; color: #1F2937; text-align: center; }
.mode-desc { font-size: 22rpx; color: #6B7280; text-align: center; line-height: 1.4; }

.count-chip {
  padding: 16rpx 32rpx; border-radius: 999rpx; background: #FFFFFF;
  box-shadow: 0 4rpx 14rpx rgba(0,0,0,0.05);
  &.active { background: linear-gradient(135deg, #4ECDC4 0%, #38BDF8 100%); .count-chip-text { color: #FFF; } }
}
.count-chip-text { font-size: 26rpx; font-weight: 700; color: #4B5563; }

.start-btn {
  min-height: 100rpx; border-radius: 32rpx;
  background: linear-gradient(135deg, #059669 0%, #10B981 50%, #34D399 100%);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 12rpx 40rpx rgba(16,185,129,0.3);
  &:active { transform: scale(0.98); }
}
.start-text { color: #FFFFFF; font-size: 36rpx; font-weight: 800; }

.q-card-2 {
  background: #FFFFFF;
  border-radius: 36rpx;
  padding: 32rpx;
  box-shadow: 0 14rpx 48rpx rgba(0,0,0,0.06);
}
.prompt-hint { font-size: 28rpx; color: #6B7280; }
.char-big-wrap { display: flex; flex-direction: column; align-items: center; gap: 12rpx; padding: 32rpx; background: linear-gradient(135deg, #FFF9E6 0%, #FFF0DE 100%); border-radius: 28rpx; }
.char-emoji { font-size: 96rpx; }
.char-big { font-size: 160rpx; font-weight: 800; color: #1F2937; line-height: 1; }

.pinyin-big-wrap { display: flex; align-items: baseline; justify-content: center; gap: 20rpx; padding: 40rpx; background: linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%); border-radius: 28rpx; }
.pinyin-big { font-size: 96rpx; font-weight: 800; letter-spacing: 2rpx; }
.tone-tag { font-size: 24rpx; padding: 8rpx 20rpx; border-radius: 999rpx; background: #FFF; color: #374151; font-weight: 600; }

.options-grid-2 { padding: 8rpx 0; }
.feedback { padding: 8rpx 0; }
.fb-icon { width: 90rpx; height: 90rpx; display: block; margin: 0 auto; }
.fb-text { display: block; margin-top: 8rpx; font-size: 30rpx; font-weight: 600;
  &.right { color: #10B981; }
  &.wrong { color: #FF6B6B; }
}
.next-btn {
  max-width: 520rpx; margin: 0 auto;
  min-height: 96rpx; border-radius: 32rpx;
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
  display: flex; align-items: center; justify-content: center; gap: 10rpx;
  box-shadow: 0 12rpx 32rpx rgba(255,107,107,0.28);
  &:active { transform: scale(0.98); }
}
.next-text { color: #FFFFFF; font-size: 32rpx; font-weight: 700; }
.next-icon { width: 32rpx; height: 32rpx; }

/* Result */
.result-card-2 {
  background: #FFFFFF;
  border-radius: 40rpx;
  padding: 56rpx 32rpx 40rpx;
  box-shadow: 0 16rpx 56rpx rgba(0,0,0,0.08);
  text-align: center;
  margin-top: 24rpx;
}
.r-icon { width: 150rpx; height: 150rpx; display: block; margin: 0 auto; }
.r-title { font-size: 40rpx; font-weight: 800; color: #1F2937; display: block; margin-top: 12rpx; }
.r-stats {
  display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16rpx;
  padding: 24rpx; border-radius: 28rpx;
  background: linear-gradient(135deg, #F0FDFA 0%, #FFF9E6 100%);
}
.r-stat { display: flex; flex-direction: column; align-items: center; gap: 4rpx; }
.r-v { font-size: 48rpx; font-weight: 800; }
.r-v.text-coral { color: #FF6B6B; }
.r-v.text-green { color: #10B981; }
.r-l { font-size: 24rpx; color: #6B7280; }

.r-actions { display: flex; gap: 16rpx; }
.r-btn-a, .r-btn-b {
  flex: 1; min-height: 96rpx; border-radius: 28rpx;
  display: flex; align-items: center; justify-content: center; gap: 10rpx;
  &:active { transform: scale(0.97); }
}
.r-btn-icon { width: 32rpx; height: 32rpx; }
.r-btn-a {
  background: linear-gradient(135deg, #059669 0%, #34D399 100%);
  box-shadow: 0 10rpx 28rpx rgba(5,150,105,0.28);
}
.r-btn-a-text { color: #FFFFFF; font-weight: 700; font-size: 30rpx; }
.r-btn-b { background: #F3F4F6; }
.r-btn-b-text { color: #4B5563; font-weight: 700; font-size: 30rpx; }

.mt-4 { margin-top: 16rpx; }
.mt-6 { margin-top: 24rpx; }
.mt-8 { margin-top: 32rpx; }
.mt-10 { margin-top: 40rpx; }
</style>
