<template>
  <RaceShell title="挑战任务">
    <view v-if="task" class="task-detail">
      <view class="detail-illustration"
        ><RaceIcon :name="task.icon" :size="118"
      /></view>
      <text class="race-heading">{{ task.title }}</text
      ><text class="race-muted">{{ task.description }}</text>
      <button role="button" tabindex="0" class="race-link" @click="listen">
        听一听任务
      </button>
      <view v-if="task.steps.length" class="task-steps"
        ><view v-for="(step, i) in task.steps" :key="i" class="step-row"
          ><text class="step-number">{{ i + 1 }}</text
          ><text>{{ step }}</text></view
        ><text class="race-muted">照着做就好，不用一项项打勾。</text></view
      >
      <view class="task-reward"
        ><RaceIcon name="star" :size="30" /><text>{{
          task.points ? `完成可获得 ${task.points} 星` : "完成也能让赛车前进"
        }}</text></view
      >
      <text v-if="task.status === 'submitted'" class="race-notice" role="status"
        >已经提交，等爸爸妈妈确认。确认后赛车才会前进哦。</text
      >
      <text v-if="task.status === 'completed'" class="race-success"
        >✓ 已完成，{{ task.points }} 星已记入成长记录</text
      >
      <text v-if="task.status === 'skipped'" class="race-muted"
        >今天先休息，下次再出发。</text
      >
      <view
        v-if="task.status === 'pending' && task.date === store.today"
        class="detail-actions"
        ><text class="race-muted">{{
          task.checkMode === "parent"
            ? "做完后请家长确认。"
            : "做完后，你可以自己确认。"
        }}</text
        ><button
          role="button"
          tabindex="0"
          class="race-primary"
          :disabled="store.busy"
          :aria-disabled="store.busy"
          @click="submit"
        >
          {{ store.busy ? "正在保存…" : "我完成啦！" }}
        </button></view
      >
      <text v-if="task.date !== store.today" class="race-muted"
        >这是 {{ task.date }} 的记录，可以回看，不再补打卡。</text
      >
      <button role="button" tabindex="0" class="race-secondary" @click="back">
        回到今日赛道
      </button>
    </view>
    <view v-else class="race-empty"
      ><text class="race-heading">找不到这个任务</text
      ><button role="button" tabindex="0" class="race-primary" @click="back">
        回到今日赛道
      </button></view
    >
    <CompletionOverlay ref="completion" />
  </RaceShell>
</template>
<script setup lang="ts">
import { computed, ref, nextTick } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { useRacingStore } from "@/stores/racing";
import { useAppStore } from "@/stores/app";
import { speak } from "@/utils/speak";
import RaceShell from "@/components/racing/RaceShell.vue";
import RaceIcon from "@/components/racing/RaceIcon.vue";
import CompletionOverlay from "@/components/racing/CompletionOverlay.vue";
const store = useRacingStore();
const app = useAppStore();
const id = ref("");
const completion = ref<InstanceType<typeof CompletionOverlay>>();
const task = computed(() =>
  store.data.dailyTasks.find((t) => t.id === id.value),
);
onLoad((q) => (id.value = q?.id || ""));
onShow(() => {
  store.lockParent();
  store.refresh();
  store.ensureToday();
});
async function submit() {
  if (!task.value) return;
  if (await store.run({ type: "submit", id: id.value })) {
    await nextTick();
    await completion.value?.show();
  }
}
function listen() {
  if (!task.value) return;
  if (!app.soundEnabled || !store.data.parentPreferences.soundsEnabled) {
    uni.showToast({ title: "声音已关闭，照着文字做就好", icon: "none" });
    return;
  }
  speak(
    [task.value.title, task.value.description, ...task.value.steps].join("。"),
  );
}
function back() {
  uni.redirectTo({ url: "/pages/racing/index" });
}
</script>
<style scoped>
.task-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  text-align: center;
  padding: 15px 0;
}
.detail-illustration {
  width: 180px;
  height: 180px;
  border-radius: 60px;
  background: #ffebcc;
  display: flex;
  align-items: center;
  justify-content: center;
}
.task-detail .race-heading {
  font-size: 30px;
}
.task-steps {
  width: 100%;
  background: #fffef9;
  padding: 20px;
  border: 1px solid #ecdfc8;
  border-radius: 24px;
  text-align: left;
}
.step-row {
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 12px 0;
  font-size: 18px;
}
.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e2f4ed;
  color: #176959;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  font-weight: 800;
}
.task-reward {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 750;
  color: #825315;
}
.detail-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.task-detail > .race-secondary {
  width: 100%;
}
</style>
