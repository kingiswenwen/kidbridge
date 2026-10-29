<template>
  <RaceShell :title="editingId ? '编辑奖励' : '约定一个小奖励'" parent
    ><ParentGate>
      <text class="race-heading">把陪伴，也变成惊喜</text
      ><text class="race-muted"
        >奖励由家长按约定兑现。可以是一起野餐、选一本书，不一定是买东西。</text
      >
      <view class="race-form"
        ><label
          >奖励名称<input
            v-model="form.title"
            aria-label="奖励名称"
            class="race-input"
            maxlength="24"
            placeholder="例如：周末一起去公园"
        /></label>
        <label
          >奖励图标<view class="race-choice"
            ><button
              role="button"
              tabindex="0"
              v-for="icon in icons"
              :key="icon"
              :class="{ selected: form.icon === icon }"
              :aria-label="icon"
              @click="form.icon = icon"
            >
              <RaceIcon :name="icon" :size="42" /></button></view
        ></label>
        <label
          >需要几颗星？<input
            v-model="costText"
            aria-label="奖励星星价格"
            class="race-input"
            type="number"
            maxlength="4"
            placeholder="0–9999 的整数"
        /></label>
        <label
          >和孩子的约定<textarea
            v-model="form.description"
            aria-label="奖励约定"
            class="race-input"
            maxlength="160"
            placeholder="例如：周末天气好时，和家长一起去公园玩"
          />
        </label>
        <view class="race-row"
          ><text class="race-row-main">允许新兑换</text
          ><AppSwitch
            :model-value="form.enabled"
            label="允许兑换这个奖励"
            @update:model-value="(value) => (form.enabled = value)"
        /></view>
        <text class="race-muted"
          >停用后不能新兑换，已拥有的装扮和历史申请仍然保留。修改价格不会改变已经提交的申请价格。</text
        >
        <text v-if="message" class="race-error" role="alert">{{ message }}</text
        ><button
          role="button"
          tabindex="0"
          class="race-primary"
          :disabled="store.busy || saving"
          :aria-disabled="store.busy || saving"
          @click="save"
        >
          保存奖励约定
        </button>
      </view>
    </ParentGate></RaceShell
  >
</template>
<script setup lang="ts">
import { reactive, ref } from "vue";
import { onLoad, onShow, onHide } from "@dcloudio/uni-app";
import type { RewardInput } from "@/types/racing";
import { useRacingStore } from "@/stores/racing";
import RaceShell from "@/components/racing/RaceShell.vue";
import ParentGate from "@/components/racing/ParentGate.vue";
import RaceIcon from "@/components/racing/RaceIcon.vue";
import AppSwitch from "@/components/AppSwitch.vue";
const store = useRacingStore();
let pageActive = true;
const editingId = ref("");
const form = reactive<RewardInput>({
  title: "",
  icon: "gift",
  type: "real_world",
  cost: 10,
  description: "",
  enabled: true,
});
const costText = ref("10");
const message = ref("");
const saving = ref(false);
const icons = ["gift", "family", "book", "ball", "car", "star", "flower"];
onLoad((q) => {
  editingId.value = "";
  Object.assign(form, {
    title: "",
    icon: "gift",
    type: "real_world",
    cost: 10,
    description: "",
    enabled: true,
    cosmeticSlot: undefined,
    assetId: undefined,
  });
  costText.value = "10";
  message.value = "";
  if (q?.id) {
    editingId.value = q.id;
    const old = store.data.rewards.find((r) => r.id === q.id);
    if (old) {
      Object.assign(form, JSON.parse(JSON.stringify(old)));
      costText.value = String(old.cost);
    } else message.value = "奖励不存在，请返回检查";
  }
});
onShow(() => {
  pageActive = true;
  store.refresh();
});
onHide(() => {
  pageActive = false;
});
async function save() {
  if (saving.value) return;
  saving.value = true;
  try {
    message.value = "";
    if (!/^\d{1,4}$/.test(costText.value)) {
      message.value = "请填写 0–9999 的整数星星价格";
      return;
    }
    if (
      await store.run({
        type: "saveReward",
        id: editingId.value || undefined,
        input: {
          ...form,
          cost: Number(costText.value),
          title: form.title.trim(),
          description: form.description.trim(),
        },
      })
    ) {
      uni.showToast({ title: "奖励约定已保存", icon: "none" });
      if (!pageActive) return;
      uni.redirectTo({ url: "/pages/parent/index?section=rewards" });
    } else message.value = store.error;
  } finally {
    saving.value = false;
  }
}
</script>
