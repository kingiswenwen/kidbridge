<template>
  <image
    :src="`/static/racing/${safeName}.svg`"
    class="race-icon"
    :style="{ width: `${size}px`, height: `${size}px` }"
    mode="aspectFit"
    :aria-label="label || name"
  />
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
}
</style>
