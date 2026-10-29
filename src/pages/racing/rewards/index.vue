<template>
  <RaceShell title="奖励仓库">
    <text class="race-heading">小小努力，攒成惊喜</text
    ><text class="race-muted">攒下成长星星，换喜欢的赛车装扮。</text>
    <view v-if="target" class="race-notice"
      ><text
        >我的目标：{{ target.title }} ·
        {{
          store.stars >= target.cost
            ? "已经攒够啦！"
            : `还差 ${target.cost - store.stars} 星`
        }}</text
      ></view
    >
    <view class="race-tabs" role="tablist"
      ><button
        tabindex="0"
        v-for="t in tabs"
        :key="t.id"
        :class="{ active: tab === t.id }"
        role="tab"
        :aria-selected="tab === t.id"
        @click="tab = t.id"
      >
        {{ t.title }}
      </button></view
    >
    <template v-if="tab === 'trophies'">
      <view class="race-grid"
        ><view v-for="t in trophies" :key="t.title" class="race-reward"
          ><RaceIcon :name="t.earned ? 'flag' : 'lock'" :size="68" /><text
            class="race-row-title"
            >{{ t.title }}</text
          ><text class="race-muted">{{ t.description }}</text
          ><text :class="t.earned ? 'race-success' : 'race-muted'">{{
            t.earned ? "已获得" : "慢慢来，会做到的"
          }}</text></view
        ></view
      >
      <text class="race-muted trophy-note"
        >奖杯记录努力，不消耗星星，也不额外发星。</text
      >
    </template>
    <template v-else>
      <view v-if="preview" class="race-panel"
        ><text class="race-row-title">预览：{{ preview.title }}</text
        ><RaceCar
          :color-id="
            preview.cosmeticSlot === 'color'
              ? preview.id
              : store.data.garage.equipped.colorId
          "
          :sticker-id="
            preview.cosmeticSlot === 'sticker' ? preview.id : undefined
          "
          :wheel-id="preview.cosmeticSlot === 'wheel' ? preview.id : undefined"
          preview
        /><button
          role="button"
          tabindex="0"
          class="race-link"
          @click="previewId = ''"
        >
          收起预览
        </button></view
      >
      <view v-if="rewards.length" class="race-grid">
        <view v-for="r in rewards" :key="r.id" class="race-reward">
          <RaceIcon :name="r.icon" :size="66" /><text class="race-row-title">{{
            r.title
          }}</text
          ><text class="race-muted">{{ r.description }}</text
          ><text class="reward-cost">{{ r.cost }} 星</text>
          <button
            role="button"
            tabindex="0"
            v-if="r.type === 'cosmetic'"
            class="race-link"
            @click="previewId = r.id"
          >
            预览装扮
          </button>
          <button
            role="button"
            tabindex="0"
            v-if="owned(r.id)"
            class="race-secondary"
            @click="garage"
          >
            {{ equipped(r.id) ? "正在使用 · 去车库" : "已拥有 · 去装备" }}
          </button>
          <button
            role="button"
            tabindex="0"
            v-else-if="activeRequest(r.id)"
            class="race-secondary"
            disabled
            aria-disabled="true"
          >
            {{
              activeRequest(r.id)?.status === "requested"
                ? "等家长确认"
                : "等待兑现"
            }}
          </button>
          <button
            role="button"
            tabindex="0"
            v-else
            class="race-primary"
            :disabled="store.busy || store.stars < r.cost"
            :aria-disabled="store.busy || store.stars < r.cost"
            @click="redeem(r)"
          >
            {{
              store.stars < r.cost
                ? `还差 ${r.cost - store.stars} 星`
                : r.type === "cosmetic"
                  ? "兑换装扮"
                  : "申请兑换"
            }}
          </button>
        </view>
      </view>
      <view v-else class="race-empty"
        ><RaceIcon name="gift" :size="74" /><text class="race-row-title"
          >惊喜还在准备中</text
        ><text class="race-muted"
          >请家长来设置一个想一起实现的小奖励吧。</text
        ></view
      >
      <template v-if="tab === 'real_world'"
        ><text class="race-muted trophy-note"
          >申请时不扣星、不锁定余额。家长批准后才扣星，再按约定兑现。</text
        ><text class="race-subheading">我的兑换记录</text
        ><view v-if="!store.data.redemptions.length" class="race-muted"
          >还没有兑换记录。</view
        ><view
          v-for="r in [...store.data.redemptions].reverse()"
          :key="r.id"
          class="race-row"
          ><RaceIcon name="gift" :size="40" /><view class="race-row-main"
            ><text class="race-row-title">{{ r.rewardTitleSnapshot }}</text
            ><text class="race-muted"
              >{{ r.costSnapshot }} 星 · {{ redemptionLabels[r.status] }}</text
            ></view
          ></view
        ></template
      >
    </template>
    <AppDialog :state="dialog" @resolve="resolveDialog" />
  </RaceShell>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import type { RewardDefinition } from "@/types/racing";
import { useRacingStore } from "@/stores/racing";
import { useAppDialog } from "@/utils/dialog";
import RaceShell from "@/components/racing/RaceShell.vue";
import RaceIcon from "@/components/racing/RaceIcon.vue";
import RaceCar from "@/components/racing/RaceCar.vue";
import AppDialog from "@/components/AppDialog.vue";
const store = useRacingStore();
const { dialog, showDialog, resolveDialog } = useAppDialog();
const tab = ref("cosmetic");
const previewId = ref("");
const tabs = [
  { id: "cosmetic", title: "赛车装扮" },
  { id: "real_world", title: "生活奖励" },
  { id: "trophies", title: "我的奖杯" },
];
const rewards = computed(() =>
  store.data.rewards.filter((r) => r.enabled && r.type === tab.value),
);
const preview = computed(() =>
  store.data.rewards.find((r) => r.id === previewId.value),
);
const target = computed(() =>
  store.data.rewards.find(
    (r) => r.enabled && r.id === store.data.parentPreferences.targetRewardId,
  ),
);
const redemptionLabels = {
  requested: "等家长确认",
  approved: "等待兑现",
  fulfilled: "已经兑现",
  rejected: "这次未通过，和家长聊聊吧",
  cancelled: "已取消并退星",
};
const trophies = computed(() => [
  {
    title: "第一次出发",
    description: "完成第一个任务",
    earned: Boolean(store.data.achievements.firstTaskAt),
  },
  {
    title: "今日小车手",
    description: "完成一天的全部有效任务",
    earned: Boolean(store.data.achievements.firstRaceAt),
  },
  {
    title: "十次小努力",
    description: "累计完成 10 个任务",
    earned: Boolean(store.data.achievements.tenTasksAt),
  },
]);
onShow(() => {
  store.lockParent();
  store.refresh();
});
const owned = (id: string) => store.data.garage.ownedItemIds.includes(id);
const equipped = (id: string) =>
  Object.values(store.data.garage.equipped).includes(id);
const activeRequest = (id: string) =>
  store.data.redemptions.find(
    (r) => r.rewardId === id && ["requested", "approved"].includes(r.status),
  );
function garage() {
  uni.navigateTo({ url: "/pages/racing/garage/index" });
}
function redeem(r: RewardDefinition) {
  showDialog({
    title: r.type === "cosmetic" ? "兑换这件装扮？" : "申请这个小奖励？",
    content:
      r.type === "cosmetic"
        ? `使用 ${r.cost} 星兑换「${r.title}」，解锁后可以一直使用。`
        : `「${r.title}」需要 ${r.cost} 星。申请不会扣星，等家长批准后再扣除。`,
    confirmText: r.type === "cosmetic" ? "确认兑换" : "提交申请",
    cancelText: "再看看",
    success: async (result) => {
      if (
        result.confirm &&
        (await store.run({
          type: r.type === "cosmetic" ? "buy" : "request",
          id: r.id,
        }))
      )
        uni.showToast({
          title: r.type === "cosmetic" ? "装扮已放入车库" : "申请已交给家长",
          icon: "none",
        });
    },
  });
}
</script>
<style scoped>
.reward-cost {
  font-size: 20px;
  font-weight: 800;
  color: #825315;
}
.trophy-note {
  margin: 22px 0;
}
</style>
