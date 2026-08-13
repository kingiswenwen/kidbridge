<template>
  <view class="ep-bg">
    <!-- 进度条 -->
    <view v-if="stage === 'quiz'" class="px-4 pt-4">
      <ProgressBar
        :current="currentIndex + 1"
        :total="questions.length"
        :correct="correctCount"
      />
    </view>

    <!-- 阶段一：选择 -->
    <view v-if="stage === 'select'" class="ep-stage px-5 pt-10 pb-12">
      <view class="ep-hero text-center">
        <text class="ep-hero-emoji">📚</text>
        <text class="ep-hero-title">英语练习</text>
        <text class="ep-hero-sub">背单词，选一选！</text>
      </view>

      <!-- 模式 -->
      <view class="ep-block mt-8">
        <text class="ep-label">练习模式</text>
        <view class="mode-grid">
          <view
            v-for="m in modes"
            :key="m.key"
            :class="['mode-card', mode === m.key ? 'active' : '']"
            @click="mode = m.key"
          >
            <text class="mode-emoji">{{ m.emoji }}</text>
            <text class="mode-name">{{ m.name }}</text>
            <text class="mode-desc">{{ m.desc }}</text>
          </view>
        </view>
      </view>

      <!-- 分类 -->
      <view class="ep-block mt-8">
        <text class="ep-label">单词分类（可多选）</text>
        <view class="cat-row flex flex-wrap gap-3">
          <view
            v-for="c in categories"
            :key="c.key"
            :class="['cat-chip', cats.includes(c.key) ? 'active' : '']"
            @click="toggleCat(c.key)"
          >
            <text class="cc-emoji">{{ c.emoji }}</text>
            <text class="cc-name">{{ c.name }}</text>
          </view>
        </view>
      </view>

      <!-- 题量 -->
      <view class="ep-block mt-8">
        <text class="ep-label">题目数量</text>
        <view class="count-row flex items-center justify-center gap-4">
          <view
            v-for="n in [5, 10, 20]"
            :key="n"
            :class="['count-chip', count === n ? 'active' : '']"
            @click="count = n"
          >
            <text class="count-text">{{ n }} 题</text>
          </view>
        </view>
      </view>

      <view
        :class="['start-btn mt-10', cats.length === 0 ? 'disabled' : '']"
        @click="cats.length && startQuiz()"
      >
        <text class="start-text">🚀 开始练习</text>
      </view>
    </view>

    <!-- 阶段二：答题 -->
    <view v-else-if="stage === 'quiz'" class="ep-stage px-4 pt-4 pb-32">
      <view v-if="q">
        <view class="q-card mt-4">
          <view class="q-tag">{{ modeName }}</view>
          <text class="q-text">{{ questionText }}</text>
          <text v-if="q.hint" class="q-hint">{{ q.hint }}</text>
        </view>

        <view class="opts mt-8 space-y-4">
          <OptionButton
            v-for="(opt, i) in q.options"
            :key="i"
            :value="opt"
            :label="String(opt)"
            :index="i"
            :selected="selectedIdx === i"
            :status="
              answered
                ? i === correctIdx
                  ? 'correct'
                  : selectedIdx === i
                    ? 'wrong'
                    : 'normal'
                : 'normal'
            "
            @click="pick(i)"
          />
        </view>

        <view v-if="answered" class="feedback text-center mt-8">
          <text :class="['fb-emoji', lastOk ? 'ok' : 'bad']">
            {{ lastOk ? '🎉' : '😿' }}
          </text>
          <text :class="['fb-text', lastOk ? 'ok' : 'bad']">
            {{ lastOk ? encouragement : '正确答案：' + String(correctLabel) }}
          </text>
          <view class="next-btn" @click="next">
            <text class="next-text">
              {{ currentIndex + 1 === questions.length ? '🏆 查看成绩' : '下一题 →' }}
            </text>
          </view>
        </view>
      </view>
    </view>

    <!-- 阶段三：结算 -->
    <view v-else-if="stage === 'result'" class="ep-stage px-6 pt-10">
      <view class="result-card">
        <text class="result-emoji">
          {{ stars === 3 ? '🏆' : stars === 2 ? '🎉' : stars === 1 ? '💪' : '🌈' }}
        </text>
        <text class="result-title">{{ resultTitle }}</text>
        <view class="mt-6">
          <StarRating :stars="stars" :animated="true" />
        </view>
        <view class="stats-grid mt-8">
          <view class="stat">
            <text class="sv text-coral">{{ correctCount }}</text>
            <text class="sl">答对</text>
          </view>
          <view class="stat">
            <text class="sv text-gray-500">{{ questions.length - correctCount }}</text>
            <text class="sl">答错</text>
          </view>
          <view class="stat">
            <text class="sv text-green">{{ rate }}%</text>
            <text class="sl">正确率</text>
          </view>
        </view>
        <view class="r-actions mt-10 flex gap-4">
          <view class="r-btn-a" @click="reset">
            <text class="r-btn-a-text">🔄 再练一组</text>
          </view>
          <view class="r-btn-b" @click="() => uni.navigateBack()">
            <text class="r-btn-b-text">↩️ 返回</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { englishWords, type EnglishWord, type WordCategory } from '@/data/english/words';
import { encouragement as encouragements } from '@/data/encouragements';
import ProgressBar from '@/components/ProgressBar.vue';
import OptionButton from '@/components/OptionButton.vue';
import StarRating, { calculateStars } from '@/components/StarRating.vue';

type Mode = 'word2cn' | 'cn2word';
interface QItem {
  text: string;
  hint?: string;
  options: string[];
  correctIndex: number;
  correctLabel: string;
}

const modes: { key: Mode; name: string; desc: string; emoji: string }[] = [
  { key: 'word2cn', name: '英文 → 中文', desc: '看到英文选正确的中文意思', emoji: '🔡' },
  { key: 'cn2word', name: '中文 → 英文', desc: '看到中文意思，选正确的英文单词', emoji: '🅰️' },
];
const categories: { key: WordCategory | 'all'; name: string; emoji: string }[] = [
  { key: 'animals', name: '动物', emoji: '🐾' },
  { key: 'colors', name: '颜色', emoji: '🎨' },
  { key: 'numbers', name: '数字', emoji: '🔢' },
  { key: 'family', name: '家人', emoji: '👨‍👩‍👧' },
  { key: 'fruits', name: '水果', emoji: '🍎' },
  { key: 'body', name: '身体', emoji: '🖐️' },
  { key: 'all', name: '全部混合', emoji: '🌟' },
];

const mode = ref<Mode>('word2cn');
const cats = ref<(WordCategory | 'all')[]>(['animals']);
const count = ref(10);

const stage = ref<'select' | 'quiz' | 'result'>('select');
const questions = ref<QItem[]>([]);
const currentIndex = ref(0);
const selectedIdx = ref<number | null>(null);
const answered = ref(false);
const correctCount = ref(0);
const lastOk = ref(false);

const q = computed(() => questions.value[currentIndex.value]);
const correctIdx = computed(() => q.value?.correctIndex ?? 0);
const correctLabel = computed(() => q.value?.correctLabel ?? '');
const modeName = computed(() => modes.find((m) => m.key === mode.value)?.name || '');
const questionText = computed(() => q.value?.text || '');
const pickOne = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const encouragement = computed(() => pickOne(encouragements).content);

function toggleCat(k: (WordCategory | 'all')) {
  // 选"全部混合"就清掉其他
  if (k === 'all') {
    cats.value = ['all'];
    return;
  }
  const i = cats.value.indexOf(k);
  if (i >= 0) cats.value.splice(i, 1);
  else {
    // 去掉 all
    cats.value = cats.value.filter((x) => x !== 'all');
    cats.value.push(k);
  }
}

function pickWords(n: number): EnglishWord[] {
  let pool = englishWords.slice();
  if (!cats.value.includes('all')) {
    pool = pool.filter((w) => cats.value.includes(w.category as any));
  }
  if (pool.length === 0) pool = englishWords.slice();
  // 洗牌
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  // 不够就循环再取
  const out: EnglishWord[] = [];
  while (out.length < n) {
    out.push(pool[out.length % pool.length]);
  }
  return out;
}

function buildOptions(correct: string, distractors: string[]): string[] {
  const opts = [correct, ...distractors.slice(0, 3)];
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return opts;
}

function startQuiz() {
  const words = pickWords(count.value);
  const all = englishWords;
  questions.value = words.map((w) => {
    if (mode.value === 'word2cn') {
      const meanings = all
        .filter((x) => x.meaning !== w.meaning)
        .map((x) => x.meaning);
      const opts = buildOptions(w.meaning, meanings);
      return {
        text: w.word,
        hint: w.phonetic,
        options: opts,
        correctIndex: opts.indexOf(w.meaning),
        correctLabel: w.meaning,
      };
    } else {
      const ws = all.filter((x) => x.word !== w.word).map((x) => x.word);
      const opts = buildOptions(w.word, ws);
      return {
        text: w.meaning,
        hint: '',
        options: opts,
        correctIndex: opts.indexOf(w.word),
        correctLabel: w.word,
      };
    }
  });
  currentIndex.value = 0;
  selectedIdx.value = null;
  answered.value = false;
  correctCount.value = 0;
  lastOk.value = false;
  stage.value = 'quiz';
}

function pick(i: number) {
  if (answered.value || !q.value) return;
  selectedIdx.value = i;
  answered.value = true;
  const ok = i === q.value.correctIndex;
  lastOk.value = ok;
  if (ok) correctCount.value += 1;
}
function next() {
  if (currentIndex.value + 1 >= questions.value.length) {
    stage.value = 'result';
    return;
  }
  currentIndex.value += 1;
  selectedIdx.value = null;
  answered.value = false;
}

const rate = computed(() =>
  questions.value.length ? Math.round((correctCount.value / questions.value.length) * 100) : 0,
);
const stars = computed(() => calculateStars(correctCount.value, questions.value.length));
const resultTitle = computed(() => {
  if (stars.value === 3) return '太棒啦，全部都会！';
  if (stars.value === 2) return '做得不错，继续加油！';
  if (stars.value === 1) return '有进步，再来一次？';
  return '别灰心，多练就会啦！';
});

function reset() {
  stage.value = 'select';
}
</script>

<style lang="scss" scoped>
.ep-bg {
  min-height: 100vh;
  background: linear-gradient(180deg, #DBEAFE 0%, #EFF6FF 50%, #F0FDFA 100%);
  padding-bottom: 120rpx;
}
.ep-stage { max-width: 860rpx; margin: 0 auto; }

.ep-hero { display: flex; flex-direction: column; align-items: center; gap: 12rpx; }
.ep-hero-emoji { font-size: 120rpx; }
.ep-hero-title { font-size: 56rpx; font-weight: 800; color: #74B9FF; }
.ep-hero-sub { font-size: 28rpx; color: #6B7280; }

.ep-block .ep-label { display: block; font-size: 30rpx; font-weight: 700; color: #1F2937; margin-bottom: 16rpx; padding-left: 4rpx; }

/* Mode */
.mode-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20rpx; }
.mode-card {
  background: #FFFFFF; border-radius: 28rpx; padding: 28rpx;
  box-shadow: 0 6rpx 18rpx rgba(0,0,0,0.05); border: 3rpx solid transparent;
  display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8rpx;
  &.active {
    border-color: #74B9FF;
    background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
    box-shadow: 0 8rpx 28rpx rgba(116, 185, 255, 0.22);
  }
  &:active { transform: scale(0.97); }
}
.mode-emoji { font-size: 56rpx; }
.mode-name { font-size: 28rpx; font-weight: 700; color: #1F2937; }
.mode-desc { font-size: 22rpx; color: #9CA3AF; }

/* Categories */
.cat-chip {
  padding: 16rpx 24rpx; border-radius: 999rpx; background: #FFFFFF;
  box-shadow: 0 4rpx 14rpx rgba(0,0,0,0.05); display: inline-flex; align-items: center; gap: 8rpx;
  &.active { background: linear-gradient(135deg, #74B9FF 0%, #4ECDC4 100%);
    .cc-name, .cc-emoji { color: #FFF; }
  }
}
.cc-emoji { font-size: 28rpx; }
.cc-name { font-size: 26rpx; font-weight: 700; color: #4B5563; }

.count-chip {
  padding: 16rpx 36rpx; border-radius: 999rpx; background: #FFFFFF;
  box-shadow: 0 4rpx 14rpx rgba(0,0,0,0.05);
  &.active { background: linear-gradient(135deg, #74B9FF 0%, #4ECDC4 100%);
    .count-text { color: #FFF; }
  }
}
.count-text { font-size: 28rpx; font-weight: 700; color: #4B5563; }

.start-btn {
  min-height: 100rpx; border-radius: 32rpx;
  background: linear-gradient(135deg, #74B9FF 0%, #4ECDC4 100%);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 12rpx 36rpx rgba(116, 185, 255, 0.32);
  &.disabled { opacity: 0.5; }
  &:active { transform: scale(0.98); }
}
.start-text { color: #FFFFFF; font-size: 36rpx; font-weight: 800; }

/* Question */
.q-card {
  background: #FFFFFF; border-radius: 36rpx; padding: 40rpx 32rpx; text-align: center;
  box-shadow: 0 10rpx 40rpx rgba(0,0,0,0.06); position: relative;
}
.q-tag {
  position: absolute; top: -18rpx; left: 50%; transform: translateX(-50%);
  padding: 8rpx 24rpx; border-radius: 999rpx; background: linear-gradient(135deg, #74B9FF 0%, #4ECDC4 100%);
  color: #FFFFFF; font-size: 22rpx; font-weight: 700;
}
.q-text { font-size: 60rpx; font-weight: 800; color: #1F2937; display: block; margin-top: 16rpx; }
.q-hint { font-size: 28rpx; color: #6B7280; margin-top: 12rpx; display: block; }

/* Feedback */
.feedback { padding: 16rpx 0; }
.fb-emoji { font-size: 80rpx; display: block; }
.fb-text {
  display: block; margin-top: 8rpx; font-size: 30rpx; font-weight: 600;
  &.ok { color: #10B981; }
  &.bad { color: #FF6B6B; }
}
.next-btn {
  max-width: 520rpx; margin: 32rpx auto 0;
  min-height: 96rpx; border-radius: 32rpx;
  background: linear-gradient(135deg, #4ECDC4 0%, #74B9FF 100%);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 12rpx 32rpx rgba(78, 205, 196, 0.3);
  &:active { transform: scale(0.98); }
}
.next-text { color: #FFFFFF; font-size: 34rpx; font-weight: 700; }

/* Result */
.result-card {
  background: #FFFFFF; border-radius: 40rpx; padding: 56rpx 32rpx 40rpx;
  box-shadow: 0 16rpx 56rpx rgba(0,0,0,0.08); text-align: center; margin-top: 24rpx;
}
.result-emoji { font-size: 160rpx; display: block; }
.result-title { font-size: 40rpx; font-weight: 800; color: #1F2937; margin-top: 16rpx; display: block; }
.stats-grid {
  display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16rpx; padding: 24rpx;
  background: linear-gradient(135deg, #EFF6FF 0%, #F0FDFA 100%); border-radius: 28rpx;
}
.stat { display: flex; flex-direction: column; align-items: center; gap: 4rpx; }
.sv { font-size: 48rpx; font-weight: 800; }
.sv.text-coral { color: #FF6B6B; }
.sv.text-green { color: #10B981; }
.sl { font-size: 24rpx; color: #6B7280; }

.r-btn-a, .r-btn-b {
  flex: 1; min-height: 96rpx; border-radius: 28rpx;
  display: flex; align-items: center; justify-content: center;
  &:active { transform: scale(0.97); }
}
.r-btn-a {
  background: linear-gradient(135deg, #74B9FF 0%, #4ECDC4 100%);
  box-shadow: 0 10rpx 32rpx rgba(116, 185, 255, 0.28);
}
.r-btn-a-text { color: #FFFFFF; font-weight: 700; font-size: 30rpx; }
.r-btn-b { background: #F3F4F6; }
.r-btn-b-text { color: #4B5563; font-weight: 700; font-size: 30rpx; }
</style>
