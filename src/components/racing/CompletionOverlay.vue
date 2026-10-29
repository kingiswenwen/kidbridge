<template>
  <view
    v-if="visible"
    class="completion-backdrop"
    role="dialog"
    aria-modal="true"
    aria-label="任务完成反馈"
  >
    <view class="completion-panel" :class="{ 'reduce-motion': reduced }">
      <RaceIcon :name="finished ? 'flag' : 'check'" :size="78" />
      <text class="race-heading">{{
        finished ? "今天的赛道完成啦！" : "又完成一站啦！"
      }}</text>
      <text class="race-muted">{{
        historical
          ? `${date} 的任务已确认`
          : `${progress.completed} / ${progress.total} 站完成，真棒！`
      }}</text>
      <RaceTrack
        :total="progress.total"
        :completed="shownCompleted"
        :animate="stage > 0"
        :reduced="reduced"
      />
      <text
        class="completion-points"
        role="status"
        :style="{ visibility: stage >= 2 || reduced ? 'visible' : 'hidden' }"
        >{{
          points ? `获得 ${points} 颗成长星星` : "每一次努力，都让小车前进"
        }}</text
      >
      <button
        role="button"
        tabindex="0"
        class="race-primary"
        @click="close(finished)"
      >
        {{ finished ? "去奖励仓库" : "继续我的冒险" }}
      </button>
      <button
        role="button"
        tabindex="0"
        class="race-link"
        @click="close(false)"
      >
        跳过动画
      </button>
    </view>
  </view>
</template>
<script setup lang="ts">
import { computed, nextTick, watch, onUnmounted, ref } from "vue";
import { useRacingStore } from "@/stores/racing";
import { useAppStore } from "@/stores/app";
import { raceProgress } from "@/utils/racing/engine";
import { speak } from "@/utils/speak";
import RaceIcon from "./RaceIcon.vue";
import RaceTrack from "./RaceTrack.vue";
const store = useRacingStore();
const app = useAppStore();
const visible = ref(false);
const date = ref("");
const points = ref(0);
const stage = ref(0);
const count = ref(0);
const systemReduced = ref(false);
const finishCelebration = ref(false);
let startTimer: ReturnType<typeof setTimeout>;
let endTimer: ReturnType<typeof setTimeout>;
const reduced = computed(
  () => store.data.parentPreferences.reduceMotion || systemReduced.value,
);
const progress = computed(() => raceProgress(store.data, date.value));
const historical = computed(() => date.value !== store.today);
const finished = computed(() => !historical.value && finishCelebration.value);
const shownCompleted = computed(() =>
  stage.value
    ? progress.value.completed
    : Math.max(0, progress.value.completed - count.value),
);
async function show() {
  if (visible.value || store.storageBlocked) return;
  // #ifdef H5
  systemReduced.value =
    typeof matchMedia !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  // #endif
  const pending = store.pendingFeedback;
  if (!pending.length) return;
  date.value = pending[0].date;
  const batch = pending.filter((e) => e.date === date.value);
  points.value = batch.reduce((n, e) => n + e.points, 0);
  count.value = batch.length;
  const celebrate =
    date.value === store.today &&
    raceProgress(store.data, date.value).finished &&
    !store.data.celebratedDates.includes(date.value);
  finishCelebration.value = celebrate;
  // Acknowledge before playing: refresh or skip can never mint stars or replay this event.
  if (
    !(await store.run({
      type: "feedback",
      ids: batch.map((e) => e.id),
      celebratedDate: celebrate ? date.value : undefined,
    }))
  )
    return;
  stage.value = 0;
  visible.value = true;
  if (
    app.soundEnabled &&
    store.data.parentPreferences.soundsEnabled &&
    !reduced.value
  )
    speak(celebrate ? "今天的赛道完成啦，真棒！" : "又完成一个任务啦，真棒！");
  startTimer = setTimeout(() => (stage.value = 1), reduced.value ? 0 : 400);
  endTimer = setTimeout(
    () => {
      stage.value = 2;
    },
    reduced.value ? 100 : 1600,
  );
}
function close(rewards: boolean) {
  visible.value = false;
  clearTimeout(startTimer);
  clearTimeout(endTimer);
  if (rewards) uni.navigateTo({ url: "/pages/racing/rewards/index" });
}
// #ifdef H5
let previousFocus: HTMLElement | null = null;
let previousOverflow: string | null = null;
function overlayKeydown(event: KeyboardEvent) {
  if (!visible.value) return;
  if (event.key === "Escape") {
    event.preventDefault();
    close(false);
    return;
  }
  if (event.key !== "Tab") return;
  const buttons = Array.from(
    document.querySelectorAll<HTMLElement>('.completion-panel [role="button"]'),
  );
  const first = buttons[0],
    last = buttons[buttons.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}
function releaseFocus() {
  document.removeEventListener("keydown", overlayKeydown, true);
  if (previousOverflow !== null)
    document.body.style.overflow = previousOverflow;
  previousOverflow = null;
  if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  previousFocus = null;
}
watch(visible, async (shown) => {
  if (!shown) {
    releaseFocus();
    return;
  }
  previousFocus = document.activeElement as HTMLElement;
  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  document.addEventListener("keydown", overlayKeydown, true);
  await nextTick();
  document
    .querySelector<HTMLElement>(".completion-panel .race-primary")
    ?.focus();
});
// #endif
onUnmounted(() => {
  clearTimeout(startTimer);
  clearTimeout(endTimer);
  // #ifdef H5
  releaseFocus();
  // #endif
});
defineExpose({ show });
</script>
<style scoped>
.completion-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10100;
  background: rgba(35, 45, 58, 0.48);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.completion-panel {
  width: 100%;
  max-width: 470px;
  max-height: 90vh;
  overflow: auto;
  background: #fff9e6;
  border-radius: 28px;
  padding: 28px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}
.completion-points {
  font-size: 22px;
  font-weight: 800;
  color: #8d5500;
}
.completion-panel .race-primary {
  width: 100%;
}
.completion-panel:not(.reduce-motion) {
  animation: arrive 0.25s ease-out;
}
@keyframes arrive {
  from {
    opacity: 0.4;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .completion-panel {
    animation: none !important;
  }
}
</style>
