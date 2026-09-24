<template>
  <view
    class="option-btn"
    :class="stateClass"
    @click="handleClick"
  >
    <text v-if="emoji" class="option-emoji">{{ emoji }}</text>
    <text class="option-value">{{ value }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

const props = withDefaults(
  defineProps<{
    value: number | string;
    disabled?: boolean;
    isCorrect?: boolean | null | undefined;
    isSelected?: boolean;
  }>(),
  { disabled: false, isCorrect: null, isSelected: false },
);

const emit = defineEmits<{
  click: [value: number | string];
}>();

const clicked = ref(false);

const handleClick = () => {
  if (props.disabled) return;
  clicked.value = true;
  emit("click", props.value);
  setTimeout(() => (clicked.value = false), 200);
};

const stateClass = computed(() => {
  const arr: string[] = [];
  if (props.isCorrect === true) arr.push("correct");
  else if (props.isCorrect === false && props.isSelected) arr.push("wrong");
  else if (props.isSelected) arr.push("selected");
  else arr.push("normal");
  if (clicked.value) arr.push("clicked");
  if (props.disabled && props.isCorrect === null) arr.push("disabled");
  return arr;
});

const emoji = computed(() => {
  if (props.isCorrect === true) return "✓";
  if (props.isCorrect === false && props.isSelected) return "✗";
  return null;
});
</script>

<style lang="scss" scoped>
.option-btn {
  width: 100%;
  min-height: 120rpx;
  border-radius: 32rpx;
  border: 4rpx solid #E5E7EB;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  transition: all 0.2s ease;
  padding: 0 24rpx;

  &.normal {
    background: #FFFFFF;
    border-color: #E5E7EB;
    &:active { transform: scale(0.95); box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.06); }
  }
  &.selected {
    background: #FF6B6B;
    border-color: #FF6B6B;
    .option-value { color: #FFF; }
  }
  &.correct {
    background: #6BCB77;
    border-color: #6BCB77;
    .option-value, .option-emoji { color: #FFF; }
    animation: bounce-in 0.4s ease;
  }
  &.wrong {
    background: #FC8181;
    border-color: #FC8181;
    .option-value, .option-emoji { color: #FFF; }
    animation: shake 0.4s ease;
  }
  &.clicked { transform: scale(0.95); }
  &.disabled { opacity: 0.55; }
}
.option-emoji { font-size: 32rpx; font-weight: 700; }
.option-value { font-size: 40rpx; font-weight: 700; color: #1F2937; word-break: break-all; text-align: center; }

@keyframes bounce-in {
  0% { transform: scale(1); }
  40% { transform: scale(1.12); }
  70% { transform: scale(0.96); }
  100% { transform: scale(1); }
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-12rpx); }
  75% { transform: translateX(12rpx); }
}
</style>
