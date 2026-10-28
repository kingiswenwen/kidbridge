import { onBeforeUnmount, ref } from 'vue';

export interface DialogResult {
  confirm: boolean;
  cancel: boolean;
  content?: string;
}

export interface DialogOptions {
  title: string;
  content?: string;
  editable?: boolean;
  placeholderText?: string;
  showCancel?: boolean;
  confirmText?: string;
  cancelText?: string;
  tone?: 'default' | 'danger';
  success?: (result: DialogResult) => void;
}

export interface DialogState extends DialogOptions {
  visible: boolean;
}

/** Each page owns its dialog, so switching pages cannot leave a stale overlay. */
export function useAppDialog() {
  const dialog = ref<DialogState>({ visible: false, title: '' });

  function showDialog(options: DialogOptions) {
    dialog.value = { ...options, visible: true };
  }

  function resolveDialog(result: DialogResult) {
    const callback = dialog.value.success;
    dialog.value.visible = false;
    callback?.(result);
  }

  onBeforeUnmount(() => {
    dialog.value.visible = false;
  });

  return { dialog, showDialog, resolveDialog };
}
