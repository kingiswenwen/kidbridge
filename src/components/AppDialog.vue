<template>
  <view v-if="state.visible" class="dialog-overlay" @tap.self="cancel">
    <view
      :id="dialogId"
      class="dialog-panel"
      :class="{ 'is-danger': state.tone === 'danger' }"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="`${dialogId}-title`"
      :aria-describedby="state.editable ? undefined : `${dialogId}-content`"
      tabindex="-1"
      @tap.stop
    >
      <view class="dialog-heading">
        <image class="dialog-brand" src="/static/logo/kidbridge-logo.svg" mode="aspectFit" />
        <button type="button" class="dialog-close" role="button" aria-label="关闭弹窗" tabindex="0" @tap="cancel" @keydown.enter.prevent.stop="cancel" @keydown.space.prevent.stop="cancel"><view class="close-mark" aria-hidden="true" /></button>
      </view>
      <text :id="`${dialogId}-title`" class="dialog-title">{{ state.title }}</text>
      <template v-if="state.editable">
        <label :for="`${dialogId}-input`" class="dialog-label">小朋友的昵称</label>
        <input
          :id="`${dialogId}-input`"
          v-model="draft"
          class="dialog-input"
          :class="{ 'has-error': error }"
          :placeholder="state.placeholderText || '输入昵称'"
          :maxlength="24"
          :aria-invalid="Boolean(error)"
          :aria-describedby="`${dialogId}-hint`"
          :focus="state.visible"
          confirm-type="done"
          @confirm="confirm"
          @input="error = ''"
        />
        <text :id="`${dialogId}-hint`" class="dialog-hint" :class="{ 'is-error': error }" role="status">{{ error || '最多 24 个字符，随时可以修改。' }}</text>
      </template>
      <text v-else :id="`${dialogId}-content`" class="dialog-content">{{ state.content }}</text>
      <view class="dialog-actions">
        <button v-if="state.showCancel !== false" type="button" class="dialog-button secondary" role="button" tabindex="0" data-dialog-cancel @tap="cancel" @keydown.enter.prevent.stop="cancel" @keydown.space.prevent.stop="cancel">{{ state.cancelText || '先不改了' }}</button>
        <button type="button" class="dialog-button primary" role="button" tabindex="0" data-dialog-confirm @tap="confirm" @keydown.enter.prevent.stop="confirm" @keydown.space.prevent.stop="confirm">{{ state.confirmText || (state.editable ? '保存昵称' : '确定') }}</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { getCurrentInstance, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import type { DialogResult, DialogState } from '@/utils/dialog';

const props = defineProps<{ state: DialogState }>();
const emit = defineEmits<{ resolve: [result: DialogResult] }>();
const dialogId = `kidbridge-dialog-${getCurrentInstance()?.uid ?? 'page'}`;
const draft = ref('');
const error = ref('');

function cancel() {
  emit('resolve', { confirm: false, cancel: true });
}

function confirm() {
  const value = draft.value.trim();
  if (props.state.editable && !value) {
    error.value = '请输入一个昵称，再点保存。';
    return;
  }
  emit('resolve', { confirm: true, cancel: false, content: props.state.editable ? value : undefined });
}

// #ifdef H5
let previousFocus: HTMLElement | null = null;
let previousOverflow: string | null = null;

function keydown(event: KeyboardEvent) {
  if (!props.state.visible) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    cancel();
  } else if (event.key === 'Tab') {
    const panel = document.getElementById(dialogId);
    const focusable = Array.from(panel?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [tabindex="0"]') || []);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || !panel?.contains(document.activeElement))) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !panel?.contains(document.activeElement))) {
      event.preventDefault();
      first?.focus();
    }
  }
}

function releaseFocus() {
  document.removeEventListener('keydown', keydown, true);
  if (previousOverflow !== null) document.body.style.overflow = previousOverflow;
  previousOverflow = null;
  if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  previousFocus = null;
}
// #endif

watch(() => props.state.visible, async visible => {
  if (!visible) {
    // #ifdef H5
    releaseFocus();
    // #endif
    return;
  }
  draft.value = props.state.editable ? props.state.content || '' : '';
  error.value = '';
  // #ifdef H5
  previousFocus = document.activeElement as HTMLElement;
  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', keydown, true);
  await nextTick();
  const panel = document.getElementById(dialogId);
  const target = props.state.editable
    ? panel?.querySelector<HTMLInputElement>('input')
    : panel?.querySelector<HTMLElement>('[data-dialog-cancel], [data-dialog-confirm]');
  target?.focus();
  if (target instanceof HTMLInputElement) target.select();
  // #endif
});

onBeforeUnmount(() => {
  // #ifdef H5
  releaseFocus();
  // #endif
});
</script>

<style scoped lang="scss">
.dialog-overlay { position: fixed; inset: 0; z-index: 10010; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(47, 34, 30, .42); }
.dialog-panel { box-sizing: border-box; width: 100%; max-width: 408px; max-height: 86vh; overflow-y: auto; background: #fffaf1; border: 1px solid #e9cfb8; border-radius: 25px; padding: 25px; box-shadow: 0 18px 55px rgba(66, 35, 21, .2); color: #293344; font-family: "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif; }
.dialog-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.dialog-brand { width: 46px; height: 40px; }
.dialog-close { display: flex; align-items: center; justify-content: center; margin: 0; padding: 0; width: 36px; height: 36px; background: #fff0de; border: 1px solid #e9d4b9; border-radius: 11px; color: #76513c; font-size: 25px; line-height: 1; }
.dialog-close::after, .dialog-button::after { border: 0; }
.close-mark { position: relative; width: 16px; height: 16px; }
.close-mark::before, .close-mark::after { content: ''; position: absolute; left: 7px; top: 0; width: 2px; height: 16px; border-radius: 2px; background: currentColor; transform: rotate(45deg); }
.close-mark::after { transform: rotate(-45deg); }
.dialog-panel.is-danger { border-color: #d9ad91; }
.dialog-title { display: block; font-size: 22px; line-height: 1.5; font-weight: 800; margin-bottom: 14px; }
.dialog-content { display: block; white-space: pre-line; color: #675b53; font-size: 14px; line-height: 1.9; }
.dialog-label { display: block; color: #66523f; font-size: 13px; margin-bottom: 8px; }
.dialog-input { box-sizing: border-box; width: 100%; height: 48px; min-height: 48px; padding: 0 13px; background: #fff; border: 1px solid #c9aa8a; border-radius: 12px; color: #293344; font-size: 16px; caret-color: #b94328; }
.dialog-input:focus-within { border-color: #b94328; outline: 2px solid #f4d2b9; outline-offset: 2px; }
.dialog-input.has-error { border-color: #b94328; }
.dialog-hint { display: block; font-size: 12px; line-height: 1.6; margin-top: 8px; color: #78675a; }
.dialog-hint.is-error { color: #a13b27; }
.dialog-actions { display: flex; gap: 10px; margin-top: 25px; }
.dialog-button { box-sizing: border-box; flex: 1; display: flex; align-items: center; justify-content: center; margin: 0; min-height: 46px; padding: 10px 12px; border-radius: 12px; font-size: 14px; font-weight: 700; line-height: 1.5; }
.dialog-button.secondary { border: 1px solid #d3b493; background: #fff4e5; color: #76513c; }
.dialog-button.primary { border: 1px solid #b94328; background: #b94328; color: #fff; }
.dialog-button.primary:hover { background: #96351e; }
.dialog-button.secondary:hover { background: #ffe9cf; }
.dialog-panel button:focus-visible { outline: 3px solid #96351e; outline-offset: 3px; }
@media (max-width: 480px) { .dialog-overlay { padding: 20px; } .dialog-panel { padding: 22px; border-radius: 22px; } .dialog-title { font-size: 21px; } }
</style>
