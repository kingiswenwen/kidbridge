<template>
  <view class="race-track" :class="{ compact }" :role="compact ? 'img' : 'group'"
    :aria-label="`今日赛道，完成 ${completed} / ${total} 站，任务顺序不限`">
    <scroll-view class="track-scroll" scroll-x :scroll-left="scrollPosition" :show-scrollbar="true">
      <view class="track-world" :style="{ width: `${worldWidth}px`, height: `${worldHeight}px` }">
        <image class="track-art" src="/static/racing/track.svg" mode="scaleToFill" />
        <view v-for="(stop, i) in stops" :key="stop.id" class="track-stop"
          :class="{ done: stop.status === 'completed', waiting: stop.status === 'submitted', skipped: stop.status === 'skipped' }"
          :style="position((i + 1) / stops.length)" aria-hidden="true">
          <text>{{ stop.status === 'completed' ? '✓' : i + 1 }}</text>
        </view>
        <template v-if="!compact">
          <button v-for="(stop, i) in tasks" :key="stop.id" class="track-landmark"
            :class="stop.status" :style="position((i + 1) / tasks.length)" role="button" tabindex="0"
            :aria-label="`赛道小站：${stop.title}，${statusLabels[stop.status]}`" @click="emit('select', stop.id)">
            <RaceIcon :name="stop.icon" :size="32" :label="stop.title" />
            <text class="landmark-title">{{ stop.title }}</text>
            <text class="landmark-status">{{ statusLabels[stop.status] }}</text>
          </button>
        </template>
        <view class="track-start" :style="position(0)" aria-hidden="true"><text>出发</text></view>
        <view class="finish-flag" :style="position(1)" aria-hidden="true"><RaceIcon name="flag" :size="28" /></view>
        <view class="track-car" :class="{ moving: moving && !reduced, 'no-motion': reduced }"
          :style="carStyle" :data-progress="displayProgress"><RaceCar /></view>
      </view>
    </scroll-view>
    <text v-if="!compact && worldWidth > availableWidth + 1" class="track-hint">左右滑动看小站 · 想先做哪项都可以</text>
  </view>
</template>
<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import type { DailyTask, TaskStatus } from '@/types/racing';
import { trackPoint, TRACK } from '@/utils/racing/track';
import RaceCar from './RaceCar.vue';
import RaceIcon from './RaceIcon.vue';
const props = withDefaults(defineProps<{ total: number; completed: number; tasks?: DailyTask[]; animate?: boolean; reduced?: boolean; compact?: boolean }>(),
  { tasks: () => [], animate: false, reduced: false, compact: false });
const emit = defineEmits<{ select: [id: string] }>();
const windowWidth = ref(uni.getSystemInfoSync().windowWidth);
const availableWidth = computed(() => Math.max(200, props.compact ? Math.min(windowWidth.value - 80, 430) : Math.min(windowWidth.value, 860) - 36));
const worldWidth = computed(() => props.compact ? availableWidth.value : Math.max(availableWidth.value, props.tasks.length * 106 + 120));
const worldHeight = computed(() => props.compact ? availableWidth.value * TRACK.height / TRACK.width : 280);
const statusLabels: Record<TaskStatus, string> = { pending: '去完成', submitted: '等家长确认', completed: '已完成', skipped: '今天休息' };
const stops = computed(() => props.tasks.length ? props.tasks : Array.from({ length: props.total }, (_, i) => ({ id: String(i), status: i < props.completed ? 'completed' : 'pending' })));
const displayProgress = ref(0);
const moving = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;
const target = computed(() => props.total ? props.completed / props.total : 0);
const scrollPosition = computed(() => Math.max(0, Math.min(worldWidth.value - availableWidth.value, trackPoint(target.value).x / TRACK.width * worldWidth.value - availableWidth.value / 2)));
function position(progress: number) {
  const point = trackPoint(progress);
  return { left: `${point.x / TRACK.width * 100}%`, top: `${point.y / TRACK.height * 100}%` };
}
const carStyle = computed(() => {
  const p = trackPoint(displayProgress.value);
  return { transform: `translate(${p.x / TRACK.width * worldWidth.value}px, ${p.y / TRACK.height * worldHeight.value}px) translate(-50%, -88%)` };
});
watch([target, () => props.animate, () => props.reduced], () => {
  clearTimeout(timer);
  const from = displayProgress.value, to = target.value;
  moving.value = props.animate && !props.reduced && from !== to;
  if (!moving.value) { displayProgress.value = to; return; }
  const start = Date.now();
  function frame() {
    const elapsed = Math.min(1, (Date.now() - start) / 1200);
    const eased = 1 - Math.pow(1 - elapsed, 3);
    displayProgress.value = from + (to - from) * eased;
    if (elapsed < 1) timer = setTimeout(frame, 16);
    else moving.value = false;
  }
  frame();
}, { immediate: true });
function resize() { windowWidth.value = uni.getSystemInfoSync().windowWidth; }
onMounted(() => uni.onWindowResize(resize));
onUnmounted(() => { clearTimeout(timer); uni.offWindowResize(resize); });
</script>
<style scoped>
.race-track { width: 100%; overflow: hidden; border-radius: 26px; }
.track-scroll { width: 100%; }
.track-world { position: relative; }
.track-art { position: absolute; inset: 0; width: 100%; height: 100%; }
.track-stop { position: absolute; z-index: 1; transform: translate(-50%, -50%); width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border: 3px solid #fffdf5; border-radius: 50%; background: #eee7da; color: #665c51; font-size: 12px; font-weight: 800; }
.track-stop.done { background: #248f81; color: white; }
.track-stop.waiting { background: #f5d484; color: #664500; }
.track-stop.skipped { background: #e5e1d7; color: #6a655d; }
.track-landmark { position: absolute; z-index: 3; overflow: visible; width: 92px; min-height: 80px; padding: 6px 4px !important; transform: translate(-50%, calc(-100% - 20px)); display: flex !important; flex-direction: column; align-items: center; gap: 2px; border-radius: 18px; background: #fffdf5; border: 1px solid #dacba9; color: #24344c; box-shadow: 0 4px 10px rgba(74, 83, 55, .08); }
.track-landmark::before { content: ''; position: absolute; bottom: -17px; height: 16px; width: 2px; background: #a29d79; }
.track-landmark::after { content: ''; position: absolute; top: -8px; left: 10px; right: 10px; height: 10px; border-radius: 10px 10px 3px 3px; background: #efb265; }
.track-landmark.completed::after { background: #76bfa0; }
.track-landmark.submitted::after { background: #d9b453; }
.track-landmark.skipped::after { background: #c7c2b3; }
.track-landmark.completed { background: #e0f5e7; border-color: #76bfa0; }
.track-landmark.submitted { background: #fff2ce; border-color: #cba85c; }
.track-landmark.skipped { background: #f0eee5; }
.landmark-title { font-size: 14px; line-height: 1.3; font-weight: 800; overflow-wrap: anywhere; }
.landmark-status { font-size: 11px; line-height: 1.3; color: #5d6050; }
.track-start { position: absolute; transform: translate(-50%, 28px); font-size: 12px; font-weight: 750; color: #465b3a; }
.finish-flag { position: absolute; transform: translate(8px, -100%); }
.track-car { position: absolute; left: 0; top: 0; z-index: 2; width: 68px; }
.compact .track-car { width: 62px; }
.track-hint { display: block; text-align: center; color: #5c654e; background: #eaf6e3; font-size: 13px; padding: 6px 12px 10px; }
.compact .track-stop { width: 20px; height: 20px; border-width: 2px; font-size: 10px; }
</style>
