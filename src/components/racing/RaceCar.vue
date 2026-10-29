<template>
  <view
    class="race-car"
    :aria-label="`${colorName}赛车${sticker ? '，带贴纸' : ''}`"
    role="img"
  >
    <image
      class="car-body"
      :src="`/static/racing/car-${color}.svg`"
      mode="aspectFit"
    />
    <image
      v-if="sticker"
      class="car-sticker"
      :src="`/static/racing/${sticker}.svg`"
      mode="aspectFit"
    />
    <template v-if="wheel"
      ><view class="car-wheel first" /><view class="car-wheel second"
    /></template>
  </view>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { useRacingStore } from "@/stores/racing";
const props = defineProps<{
  colorId?: string;
  stickerId?: string;
  wheelId?: string;
  preview?: boolean;
}>();
const store = useRacingStore();
const item = (id?: string) => store.data.rewards.find((r) => r.id === id);
const color = computed(() => {
  const asset = item(
    props.colorId || store.data.garage.equipped.colorId,
  )?.assetId;
  return ["coral", "mint", "sky", "gold"].includes(asset || "")
    ? asset
    : "coral";
});
const colorName = computed(
  () =>
    ({ coral: "珊瑚", mint: "薄荷", sky: "晴空", gold: "阳光" })[
      color.value || "coral"
    ],
);
const sticker = computed(() => {
  const asset = item(
    props.preview
      ? props.stickerId
      : props.stickerId || store.data.garage.equipped.stickerId,
  )?.assetId;
  return ["star", "flower"].includes(asset || "") ? asset : undefined;
});
const wheel = computed(() =>
  props.preview
    ? props.wheelId
    : props.wheelId || store.data.garage.equipped.wheelId,
);
</script>
<style scoped>
.race-car {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 45.3125%;
}
.car-body {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
}
.car-sticker {
  position: absolute;
  left: 43%;
  top: 49%;
  width: 13%;
  height: 28%;
}
.car-wheel {
  position: absolute;
  top: 66%;
  width: 7%;
  height: 15%;
  border-radius: 50%;
  background: #5ba8f5;
  border: 2px solid #e3f7ff;
}
.first {
  left: 23%;
}
.second {
  left: 69%;
}
</style>
