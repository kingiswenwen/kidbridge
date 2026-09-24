<template>
  <view class="number-pad">
    <view :class="['grid', cols === 5 ? 'grid-cols-5' : 'grid-cols-7', 'gap-2']">
      <view
        v-for="num in numbers"
        :key="num"
        class="num-btn"
        :class="{ disabled }"
        @click="!disabled && $emit('number', num)"
      >
        <text class="num-text">{{ num }}</text>
      </view>
    </view>

    <view class="flex gap-2 mt-4">
      <view
        class="btn-clear flex-1"
        :class="{ disabled }"
        @click="!disabled && $emit('clear')"
      >
        <text class="btn-clear-text">清除</text>
      </view>
      <view
        class="btn-submit flex-[2]"
        :class="{ disabled }"
        @click="!disabled && $emit('submit')"
      >
        <text class="btn-submit-text">确定</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    maxValue?: number;
    disabled?: boolean;
  }>(),
  { maxValue: 20, disabled: false },
);

defineEmits<{
  number: [num: number];
  clear: [];
  submit: [];
}>();

const numbers = props.maxValue <= 10
  ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
  : [1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

const cols = props.maxValue <= 10 ? 5 : 7;
</script>

<style lang="scss" scoped>
.number-pad { width: 100%; max-width: 720rpx; margin: 0 auto; }

.num-btn {
  min-height: 90rpx;
  background: #FFF;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid #FFE4E6;
  box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.08);
  transition: all 0.15s;

  &:active:not(.disabled) {
    transform: scale(0.92);
    background: #FFF0F0;
  }
  &.disabled { opacity: 0.5; }
}
.num-text { font-size: 36rpx; font-weight: 700; color: #FF6B6B; }

.btn-clear {
  min-height: 100rpx;
  border-radius: 24rpx;
  background: #F3F4F6;
  display: flex; align-items: center; justify-content: center;
  &:active:not(.disabled) { background: #E5E7EB; transform: scale(0.97); }
  &.disabled { opacity: 0.5; }
}
.btn-clear-text { font-size: 30rpx; font-weight: 600; color: #6B7280; }

.btn-submit {
  min-height: 100rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #4ECDC4 0%, #3AB8B0 100%);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(78, 205, 196, 0.3);
  &:active:not(.disabled) { transform: scale(0.97); }
  &.disabled { opacity: 0.5; }
}
.btn-submit-text { font-size: 38rpx; font-weight: 700; color: #FFF; }
</style>
