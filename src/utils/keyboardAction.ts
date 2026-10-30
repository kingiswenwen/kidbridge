/** H5 custom controls: Enter / Space dispatch the same click as pointer input. */
export function activateOnKey(event: KeyboardEvent) {
  const target = event.currentTarget as HTMLElement | null;
  if (target?.getAttribute('aria-disabled') !== 'true') target?.click?.();
}
