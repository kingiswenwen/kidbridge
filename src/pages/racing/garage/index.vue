<template>
  <RaceShell title="我的赛车" @before-back="leave">
    <text class="race-heading">今天，开哪种好心情？</text
    ><text class="race-muted">已解锁的装扮可以反复使用，不用再花星星。</text>
    <view class="garage-stage"
      ><RaceCar
        :color-id="draft.colorId"
        :sticker-id="draft.stickerId"
        :wheel-id="draft.wheelId"
        preview
      /><text class="race-badge">{{
        dirty ? "预览中 · 记得保存" : "我的小赛车"
      }}</text></view
    >
    <template v-for="slot in slots" :key="slot.id"
      ><text class="race-subheading">{{ slot.title }}</text
      ><view class="race-choice cosmetic-choices"
        ><button
          role="button"
          tabindex="0"
          v-if="slot.id !== 'color'"
          :class="{ selected: !draft[keyFor(slot.id)] }"
          @click="select(slot.id, undefined)"
        >
          不使用</button
        ><button
          role="button"
          tabindex="0"
          v-for="r in store.data.rewards.filter(
            (r) =>
              r.cosmeticSlot === slot.id &&
              (r.enabled || store.data.garage.ownedItemIds.includes(r.id)),
          )"
          :key="r.id"
          :class="{ selected: draft[keyFor(slot.id)] === r.id }"
          @click="choose(slot.id, r.id)"
        >
          <RaceIcon :name="r.icon" :size="36" /><text>{{ r.title }}</text
          ><text
            v-if="!store.data.garage.ownedItemIds.includes(r.id)"
            class="race-muted"
            >未解锁 · {{ r.cost }} 星</text
          ><text
            v-else-if="draft[keyFor(slot.id)] === r.id"
            class="race-success"
            >✓ 已选</text
          ><text v-else class="race-muted">已拥有</text>
        </button></view
      ></template
    >
    <view class="race-sticky"
      ><button
        role="button"
        tabindex="0"
        class="race-primary"
        :disabled="store.busy || !dirty"
        :aria-disabled="store.busy || !dirty"
        @click="save"
      >
        {{ dirty ? "保存装扮" : "已经保存好啦" }}
      </button></view
    >
    <AppDialog :state="dialog" @resolve="resolveDialog" />
  </RaceShell>
</template>
<script setup lang="ts">
import { computed, reactive } from "vue";
import { onShow, onBackPress } from "@dcloudio/uni-app";
import { useRacingStore } from "@/stores/racing";
import { useAppDialog } from "@/utils/dialog";
import RaceShell from "@/components/racing/RaceShell.vue";
import RaceCar from "@/components/racing/RaceCar.vue";
import RaceIcon from "@/components/racing/RaceIcon.vue";
import AppDialog from "@/components/AppDialog.vue";
const store = useRacingStore();
const { dialog, showDialog, resolveDialog } = useAppDialog();
const draft = reactive<{
  colorId: string;
  stickerId?: string;
  wheelId?: string;
}>({ colorId: "color-coral" });
let allowLeave = false;
const slots = [
  { id: "color" as const, title: "车身颜色" },
  { id: "sticker" as const, title: "可爱贴纸" },
  { id: "wheel" as const, title: "小小轮毂" },
];
const dirty = computed(
  () => JSON.stringify(draft) !== JSON.stringify(store.data.garage.equipped),
);
onShow(() => {
  store.lockParent();
  store.refresh();
  Object.assign(draft, {
    colorId: store.data.garage.equipped.colorId,
    stickerId: store.data.garage.equipped.stickerId,
    wheelId: store.data.garage.equipped.wheelId,
  });
});
function keyFor(
  slot: "color" | "sticker" | "wheel",
): "colorId" | "stickerId" | "wheelId" {
  return slot === "color"
    ? "colorId"
    : slot === "sticker"
      ? "stickerId"
      : "wheelId";
}
function select(slot: "color" | "sticker" | "wheel", id?: string) {
  if (slot === "color") {
    if (id) draft.colorId = id;
  } else if (slot === "sticker") draft.stickerId = id;
  else draft.wheelId = id;
}
function choose(slot: "color" | "sticker" | "wheel", id: string) {
  if (store.data.garage.ownedItemIds.includes(id)) select(slot, id);
  else
    showDialog({
      title: "这件装扮还没解锁",
      content: "去奖励仓库看看吧，攒够成长星星就能兑换。",
      confirmText: "去奖励仓库",
      cancelText: "先看看别的",
      success: (r) => {
        if (r.confirm) uni.navigateTo({ url: "/pages/racing/rewards/index" });
      },
    });
}
async function save() {
  if (await store.run({ type: "equip", ...draft }))
    uni.showToast({ title: "装扮保存好啦", icon: "none" });
}
function leave() {
  if (!dirty.value) {
    allowLeave = true;
    uni.navigateBack({
      fail: () => uni.redirectTo({ url: "/pages/racing/index" }),
    });
    return;
  }
  showDialog({
    title: "装扮还没有保存",
    content: "要先保存这次搭配吗？",
    confirmText: "保存装扮",
    cancelText: "放弃修改",
    success: async (r) => {
      if (r.confirm && !(await store.run({ type: "equip", ...draft }))) return;
      allowLeave = true;
      uni.navigateBack({
        fail: () => uni.redirectTo({ url: "/pages/racing/index" }),
      });
    },
  });
}
onBackPress(() => {
  if (allowLeave || !dirty.value) return false;
  leave();
  return true;
});
</script>
<style scoped>
.garage-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 36px 15px;
  background: #e5f3df;
  border-radius: 28px;
  margin: 24px 0;
}
.cosmetic-choices > button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  min-width: 110px;
  flex: 1;
  max-width: 48%;
  padding: 15px 10px !important;
}
</style>
