<template>
  <RaceShell title="成长记录" parent
    ><ParentGate>
      <text class="race-heading">每一步，都值得被记住</text
      ><text class="race-muted"
        >余额 {{ store.stars }} 颗成长星星；原学习关卡星级不计入这里。</text
      >
      <view class="race-tabs"
        ><button
          role="button"
          tabindex="0"
          :class="{ active: tab === 'days' }"
          @click="tab = 'days'"
        >
          每日赛道</button
        ><button
          role="button"
          tabindex="0"
          :class="{ active: tab === 'ledger' }"
          @click="tab = 'ledger'"
        >
          星星流水</button
        ><button
          role="button"
          tabindex="0"
          :class="{ active: tab === 'events' }"
          @click="tab = 'events'"
        >
          操作记录
        </button></view
      >
      <template v-if="tab === 'days'"
        ><label
          >选择日期<picker
            mode="date"
            :value="date"
            :end="store.today"
            @change="changeDate"
            ><view class="race-picker">{{ date }} ▾</view></picker
          ></label
        ><view class="race-panel"
          ><text class="race-row-title"
            >{{ date }} · 完成 {{ progress.completed }}/{{
              progress.total
            }}
            站</text
          ><RaceTrack
            :total="progress.total"
            :completed="progress.completed"
            reduced /></view
        ><text v-if="!dayTasks.length" class="race-muted"
          >这一天没有任务记录。</text
        ><view v-for="t in dayTasks" :key="t.id" class="race-row"
          ><RaceIcon :name="t.icon" :size="42" /><view class="race-row-main"
            ><text class="race-row-title">{{ t.title }}</text
            ><text class="race-muted"
              >{{ labels[t.status] }} · {{ t.points }} 星</text
            ></view
          ></view
        ><text class="race-subheading">已有记录的日期</text
        ><view class="race-choice"
          ><button
            role="button"
            tabindex="0"
            v-for="d in [...store.data.generatedDates].sort().reverse()"
            :key="d"
            :class="{ selected: date === d }"
            @click="date = d"
          >
            {{ d }}
          </button></view
        ></template
      >
      <template v-if="tab === 'ledger'"
        ><view v-if="!store.data.pointTransactions.length" class="race-empty"
          >还没有星星流水。</view
        ><view
          v-for="t in [...store.data.pointTransactions].reverse()"
          :key="t.id"
          class="race-row"
          ><RaceIcon name="star" :size="40" /><view class="race-row-main"
            ><text class="race-row-title">{{ t.note }}</text
            ><text class="race-date">{{ time(t.createdAt) }}</text
            ><text class="source-id" selectable>{{ t.sourceId }}</text></view
          ><text class="ledger-amount" :class="{ expense: t.amount < 0 }"
            >{{ t.amount >= 0 ? "+" : "" }}{{ t.amount }}</text
          ></view
        ></template
      >
      <template v-if="tab === 'events'"
        ><view v-if="!store.data.auditEvents.length" class="race-empty"
          >还没有操作记录。</view
        ><view
          v-for="e in [...store.data.auditEvents].reverse()"
          :key="e.id"
          class="race-row"
          ><view class="race-row-main"
            ><text class="race-row-title">{{
              eventNames[e.type] || e.type
            }}</text
            ><text class="race-muted">{{ e.note }}</text
            ><text class="race-date">{{ time(e.at) }}</text
            ><text class="source-id" selectable>事件 {{ e.id }}</text></view
          ></view
        ></template
      >
    </ParentGate></RaceShell
  >
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useRacingStore } from "@/stores/racing";
import { raceProgress } from "@/utils/racing/engine";
import RaceShell from "@/components/racing/RaceShell.vue";
import ParentGate from "@/components/racing/ParentGate.vue";
import RaceIcon from "@/components/racing/RaceIcon.vue";
import RaceTrack from "@/components/racing/RaceTrack.vue";
const store = useRacingStore();
const tab = ref("days");
const date = ref(store.today);
const progress = computed(() => raceProgress(store.data, date.value));
const dayTasks = computed(() =>
  store.data.dailyTasks.filter((t) => t.date === date.value),
);
const labels = {
  pending: "待完成",
  submitted: "待审核",
  completed: "已完成",
  skipped: "已跳过",
};
const eventNames: Record<string, string> = {
  task_saved: "保存任务安排",
  added_today: "安排到今天",
  submitted: "提交打卡",
  completed: "确认完成",
  rejected: "退回重做",
  skipped: "今天跳过",
  reward_saved: "保存奖励约定",
  reward_requested: "申请兑换",
  cosmetic_bought: "兑换装扮",
  approveReward: "批准兑换并扣星",
  rejectReward: "拒绝兑换申请",
  cancelReward: "取消兑换并退星",
  fulfillReward: "奖励已兑现",
};
onShow(() => store.refresh());
function changeDate(e: { detail: { value: string } }) {
  date.value = e.detail.value;
}
function time(at: number) {
  return new Date(at).toLocaleString();
}
</script>
<style scoped>
.source-id {
  display: block;
  font-size: 11px;
  line-height: 1.6;
  overflow-wrap: anywhere;
  color: #76644e;
}
.ledger-amount {
  font-size: 24px;
  font-weight: 800;
  color: #197c70;
  font-variant-numeric: tabular-nums;
}
.ledger-amount.expense {
  color: #a3442e;
}
</style>
