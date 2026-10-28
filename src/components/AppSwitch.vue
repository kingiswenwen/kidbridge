<template>
  <button
    type="button"
    class="app-switch"
    :class="{ 'is-on': modelValue }"
    role="switch"
    tabindex="0"
    :aria-checked="modelValue"
    :aria-label="label"
    @tap="toggle"
    @keydown.enter.prevent.stop="toggle"
    @keydown.space.prevent.stop="toggle"
  ><view class="switch-track"><view class="switch-knob" /></view></button>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: boolean; label: string }>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();
function toggle() { emit('update:modelValue', !props.modelValue); }
</script>

<style scoped lang="scss">
.app-switch { position: relative; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 58px; height: 44px; min-height: 44px; margin: 0; padding: 2px; border: 0; border-radius: 19px; background: transparent; }
.app-switch::after { border: 0; }
.switch-track { box-sizing: border-box; width: 54px; height: 34px; padding: 4px; border: 1px solid #cbb69c; border-radius: 19px; background: #e8dece; transition: background .18s ease, border-color .18s ease; }
.switch-knob { width: 24px; height: 24px; border-radius: 50%; background: #fffdf8; box-shadow: 0 2px 5px rgba(77, 45, 26, .17); transition: transform .18s ease; }
.app-switch.is-on .switch-track { background: #b94328; border-color: #b94328; }
.app-switch.is-on .switch-knob { transform: translateX(19px); }
.app-switch:focus-visible { outline: 3px solid #96351e; outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) { .switch-track, .switch-knob { transition: none; } }
</style>
