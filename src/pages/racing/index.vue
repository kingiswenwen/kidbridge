<template>
  <RaceShell title="今日赛道">
    <view class="race-greeting"
      ><text class="race-heading">{{
        store.progress.finished ? "今天也很棒！" : "小赛车手，出发吧！"
      }}</text
      ><text class="race-muted"
        >{{ app.childName || "小朋友" }}，按自己的节奏来，顺序不限哦。</text
      ></view
    >
    <view
      class="progress-caption"
      :class="{ 'sticky-progress': store.tasks.length > 8 }"
      ><text
        >今天完成
        <text class="progress-number"
          >{{ store.progress.completed }} / {{ store.progress.total }}</text
        >
        站</text
      ><text v-if="waiting" class="race-badge waiting"
        >{{ waiting }} 项等确认</text
      ></view
    >
    <RaceTrack
      :total="store.progress.total"
      :completed="store.progress.completed"
      :reduced="store.data.parentPreferences.reduceMotion"
    />
    <view v-if="!store.tasks.length" class="race-empty"
      ><RaceIcon name="sun" :size="80" /><text class="race-heading"
        >今天是自由冒险日</text
      ><text class="race-muted">做点喜欢的事，和家人一起探索吧。</text
      ><button
        role="button"
        tabindex="0"
        class="race-secondary"
        @click="go('/pages/parent/index')"
      >
        请家长安排任务
      </button></view
    >
    <template v-for="group in groups" :key="group.slot">
      <template v-if="group.tasks.length"
        ><view class="slot-title"
          ><RaceIcon :name="group.icon" :size="26" /><text>{{
            group.label
          }}</text></view
        >
        <button
          role="button"
          tabindex="0"
          v-for="task in group.tasks"
          :key="task.id"
          class="task-card"
          :class="task.status"
          :aria-label="`${task.title}，${labels[task.status]}`"
          @click="
            go(`/pages/racing/task/index?id=${encodeURIComponent(task.id)}`)
          "
        >
          <view class="task-picture"
            ><RaceIcon :name="task.icon" :size="54" /></view
          ><view class="task-description"
            ><text class="task-title">{{ task.title }}</text
            ><text class="task-status">{{
              task.status === "completed"
                ? "✓ 已完成"
                : task.status === "submitted"
                  ? "◷ 等家长确认"
                  : task.status === "skipped"
                    ? "— 今天先休息"
                    : "完成后，小车向前一步"
            }}</text></view
          ><text class="task-action">{{
            task.status === "pending" ? "去完成 ›" : "查看 ›"
          }}</text>
        </button>
      </template>
    </template>
    <view v-if="store.progress.finished" class="race-notice"
      ><text>今天的有效任务都完成啦！奖励和成长记录会一直留在这里。</text></view
    >
    <view class="race-footer"
      ><button
        role="button"
        tabindex="0"
        @click="go('/pages/racing/garage/index')"
      >
        <RaceIcon name="car" :size="40" />我的赛车</button
      ><button
        role="button"
        tabindex="0"
        @click="go('/pages/racing/rewards/index')"
      >
        <RaceIcon name="gift" :size="40" />奖励仓库
      </button></view
    >
    <button
      role="button"
      tabindex="0"
      class="race-link parent-entry"
      @click="go('/pages/parent/index')"
    >
      家长入口
    </button>
    <CompletionOverlay ref="completion" />
  </RaceShell>
</template>
<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref } from "vue";
import { onShow, onHide } from "@dcloudio/uni-app";
import { useRacingStore } from "@/stores/racing";
import { useAppStore } from "@/stores/app";
import { timeSlots } from "@/data/racing/catalog";
import RaceShell from "@/components/racing/RaceShell.vue";
import RaceTrack from "@/components/racing/RaceTrack.vue";
import RaceIcon from "@/components/racing/RaceIcon.vue";
import CompletionOverlay from "@/components/racing/CompletionOverlay.vue";
const store = useRacingStore();
const app = useAppStore();
const completion = ref<InstanceType<typeof CompletionOverlay>>();
const labels = {
  pending: "待完成",
  submitted: "等家长确认",
  completed: "已完成",
  skipped: "今天先休息",
};
const groups = computed(() =>
  (["morning", "afternoon", "evening", "anytime"] as const).map((slot) => ({
    slot,
    label: timeSlots[slot],
    icon: slot === "evening" ? "moon" : "sun",
    tasks: store.tasks.filter((t) => t.timeSlot === slot),
  })),
);
const waiting = computed(
  () => store.tasks.filter((t) => t.status === "submitted").length,
);
let timer: ReturnType<typeof setInterval>;
async function enter() {
  store.lockParent();
  await store.ensureToday();
  await nextTick();
  await completion.value?.show();
}
onShow(() => {
  enter();
  clearInterval(timer);
  timer = setInterval(() => {
    const previous = store.today;
    store.tick();
    if (store.today !== previous) enter();
  }, 15000);
});
onHide(() => clearInterval(timer));
onUnmounted(() => clearInterval(timer));
function go(url: string) {
  uni.navigateTo({ url });
}
</script>
<style scoped>
.race-greeting {
  margin: 12px 0 20px;
}
.progress-caption {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 18px;
  font-weight: 750;
  margin-bottom: 15px;
}
.sticky-progress {
  position: sticky;
  top: env(safe-area-inset-top, 0px);
  z-index: 10;
  padding: 12px 0;
  background: #fff9e6;
}
.progress-number {
  color: #c24832;
  font-size: 26px;
  font-variant-numeric: tabular-nums;
}
.slot-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 25px 0 12px;
  font-size: 20px;
  font-weight: 800;
}
.task-card {
  display: flex !important;
  align-items: center;
  gap: 12px;
  width: 100%;
  text-align: left;
  margin: 12px 0 !important;
  padding: 17px 13px !important;
  border-radius: 23px;
  background: #fffef9;
  color: #24344c;
  border: 1px solid #eadcc7;
  min-height: 96px;
}
.task-card.completed {
  background: #effaf3;
  border-color: #bde5d3;
}
.task-card.submitted {
  background: #fff7e4;
  border-color: #ecd49f;
}
.task-card.skipped {
  background: #efede5;
  border-color: #ded6c8;
}
.task-picture {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 62px;
  height: 64px;
  background: #fff1d8;
  border-radius: 18px;
  flex-shrink: 0;
}
.task-description {
  flex: 1;
  min-width: 0;
}
.task-title {
  display: block;
  font-size: 20px;
  font-weight: 800;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
.task-status {
  display: block;
  margin-top: 6px;
  font-size: 14px;
  color: #646354;
}
.task-action {
  font-size: 15px;
  font-weight: 750;
  color: #a5422d;
  flex-shrink: 0;
}
.parent-entry {
  display: flex !important;
  margin: 18px auto 0 !important;
}
@media (max-width: 350px) {
  .task-card {
    gap: 8px;
    padding: 12px 9px !important;
  }
  .task-picture {
    width: 48px;
  }
  .task-title {
    font-size: 18px;
  }
  .task-action {
    font-size: 13px;
  }
}
</style>
