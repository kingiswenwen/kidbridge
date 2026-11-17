<template>
  <!-- H5 uses a native image so a late load cannot write into an unmounted uni-image. -->
  <!-- #ifdef H5 -->
  <img
    :src="`/static/racing/${safeName}.svg`"
    class="race-icon"
    :style="{ width: `${size}px`, height: `${size}px` }"
    :alt="label || name"
    draggable="false"
  />
  <!-- #endif -->
  <!-- #ifndef H5 -->
  <image
    :src="`/static/racing/${safeName}.svg`"
    class="race-icon"
    :style="{ width: `${size}px`, height: `${size}px` }"
    mode="aspectFit"
    :aria-label="label || name"
  />
  <!-- #endif -->
</template>
<script setup lang="ts">
import { computed } from "vue";
const props = withDefaults(
  defineProps<{ name: string; size?: number; label?: string }>(),
  { size: 48, label: "" },
);
const safeName = computed(() =>
  [
    "tooth",
    "toy",
    "book",
    "ball",
    "dish",
    "sun",
    "moon",
    "family",
    "star",
    "flower",
    "wheel",
    "car",
    "gift",
    "flag",
    "lock",
    "check",
  ].includes(props.name)
    ? props.name
    : "star",
);
</script>
<style scoped>
.race-icon {
  display: inline-block;
  flex-shrink: 0;
  vertical-align: middle;
  object-fit: contain;
}
</style>
