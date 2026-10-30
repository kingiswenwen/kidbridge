<template>
  <RaceShell title="审核与兑现" parent
    ><ParentGate>
      <text class="race-heading">看见孩子的小小努力</text
      ><text class="race-muted"
        >确认后才发星星。以前日期的任务只更新对应赛道。</text
      >
      <text class="race-subheading">任务待审核（{{ tasks.length }}）</text
      ><text v-if="!tasks.length" class="race-muted">没有等待确认的任务。</text>
      <view v-for="t in tasks" :key="t.id" class="race-panel"
        ><view class="race-row"
          ><RaceIcon :name="t.icon" :size="56" /><view class="race-row-main"
            ><text class="race-row-title">{{ t.title }}</text
            ><text class="race-muted"
              >{{ t.points }} 星 · {{ t.date }} 的任务</text
            ><text class="race-date"
              >提交于 {{ time(t.submittedAt) }}</text
            ></view
          ></view
        ><view class="race-actions"
          ><button
            role="button"
            tabindex="0"
            class="race-primary"
            :disabled="store.busy"
            :aria-disabled="store.busy"
            @click="act('approve', t.id)"
          >
            确认完成</button
          ><button
            role="button"
            tabindex="0"
            class="race-secondary"
            :disabled="store.busy"
            :aria-disabled="store.busy"
            @click="act('reject', t.id)"
          >
            再试一次
          </button></view
        ></view
      >
      <text class="race-subheading">奖励申请（{{ requests.length }}）</text
      ><text v-if="!requests.length" class="race-muted"
        >没有新的奖励申请。</text
      >
      <view v-for="r in requests" :key="r.id" class="race-panel"
        ><text class="race-row-title">{{ r.rewardTitleSnapshot }}</text
        ><text class="race-muted"
          >申请约定 {{ r.costSnapshot }} 星 · 当前余额
          {{ store.stars }} 星</text
        ><text class="race-date">{{ time(r.requestedAt) }}</text
        ><text v-if="r.costSnapshot > store.stars" class="race-notice"
          >余额不足，申请仍会保留。等攒够星星再批准。</text
        ><view class="race-actions"
          ><button
            role="button"
            tabindex="0"
            class="race-primary"
            :disabled="store.busy || r.costSnapshot > store.stars"
            :aria-disabled="store.busy || r.costSnapshot > store.stars"
            @click="act('approveReward', r.id)"
          >
            批准并扣 {{ r.costSnapshot }} 星</button
          ><button
            role="button"
            tabindex="0"
            class="race-secondary"
            :disabled="store.busy"
            :aria-disabled="store.busy"
            @click="act('rejectReward', r.id)"
          >
            这次不兑换
          </button></view
        ></view
      >
      <text class="race-subheading">等待兑现（{{ approved.length }}）</text
      ><text v-if="!approved.length" class="race-muted"
        >没有等待兑现的奖励。</text
      >
      <view v-for="r in approved" :key="r.id" class="race-panel"
        ><text class="race-row-title">{{ r.rewardTitleSnapshot }}</text
        ><text class="race-muted"
          >已扣 {{ r.costSnapshot }} 星，请按与孩子的约定兑现。</text
        ><text class="race-date">批准于 {{ time(r.approvedAt) }}</text
        ><view class="race-actions"
          ><button
            role="button"
            tabindex="0"
            class="race-primary"
            :disabled="store.busy"
            :aria-disabled="store.busy"
            @click="fulfill(r.id)"
          >
            标记已兑现</button
          ><button
            role="button"
            tabindex="0"
            class="race-danger"
            :disabled="store.busy"
            :aria-disabled="store.busy"
            @click="cancel(r.id, r.costSnapshot)"
          >
            取消并退星
          </button></view
        ></view
      >
      <text v-if="notice" class="race-success" role="status">{{ notice }}</text
      ><AppDialog :state="dialog" @resolve="resolveDialog" /> </ParentGate
  ></RaceShell>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useRacingStore } from "@/stores/racing";
import { useAppDialog } from "@/utils/dialog";
import RaceShell from "@/components/racing/RaceShell.vue";
import ParentGate from "@/components/racing/ParentGate.vue";
import RaceIcon from "@/components/racing/RaceIcon.vue";
import AppDialog from "@/components/AppDialog.vue";
const store = useRacingStore();
const { dialog, showDialog, resolveDialog } = useAppDialog();
const notice = ref("");
const tasks = computed(() =>
  store.data.dailyTasks
    .filter((t) => t.status === "submitted")
    .sort((a, b) => (a.submittedAt || 0) - (b.submittedAt || 0)),
);
const requests = computed(() =>
  store.data.redemptions.filter((r) => r.status === "requested"),
);
const approved = computed(() =>
  store.data.redemptions.filter((r) => r.status === "approved"),
);
onShow(() => store.refresh());
function time(at?: number) {
  if (!at) return "—";
  const d = new Date(at);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
async function act(
  type:
    | "approve"
    | "reject"
    | "approveReward"
    | "rejectReward"
    | "cancelReward"
    | "fulfillReward",
  id: string,
) {
  notice.value = "";
  if (await store.run({ type, id })) {
    notice.value =
      type === "approve"
        ? "已确认完成，星星已保存。"
        : type === "reject"
          ? "已退回任务，孩子可以再试一次。"
          : type === "approveReward"
            ? "已批准，星星扣除一次，等待兑现。"
            : type === "cancelReward"
              ? "已取消，星星已退回。"
              : type === "fulfillReward"
                ? "已记录兑现，没有再次扣星。"
                : "申请已处理，没有扣星。";
  }
}
function cancel(id: string, cost: number) {
  showDialog({
    title: "取消这个奖励？",
    content: `尚未兑现，取消后退回 ${cost} 星。请先和孩子说明原因。`,
    confirmText: "取消并退星",
    cancelText: "保留约定",
    tone: "danger",
    success: (r) => {
      if (r.confirm) act("cancelReward", id);
    },
  });
}
function fulfill(id: string) {
  showDialog({
    title: "已经兑现给孩子了吗？",
    content: "标记后会保留兑现记录，不再自动退款，也不会再次扣星。",
    confirmText: "已经兑现",
    cancelText: "还没有",
    success: (r) => {
      if (r.confirm) act("fulfillReward", id);
    },
  });
}
</script>
