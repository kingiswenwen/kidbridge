<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { watch } from "vue";
import { useAppStore } from "@/stores/app";
import { useRacingStore } from "@/stores/racing";
import { stopSpeaking } from "@/utils/speak";
const store = useAppStore();
watch(() => store.soundEnabled, enabled => { if (!enabled) stopSpeaking(); });

onLaunch(() => {
  console.log("[彩虹桥] App Launch");
  // #ifdef H5
  document.addEventListener('keydown', (event: KeyboardEvent) => {
    const target = event.target as HTMLElement;
    if (!['Enter', ' '].includes(event.key) || target.tagName !== 'UNI-BUTTON' || !target.matches('.racing-page uni-button, .home-racing-entry, .racing-settings-entry uni-button')) return;
    if (target.hasAttribute('disabled') || target.getAttribute('aria-disabled') === 'true') return;
    event.preventDefault();
    target.click();
  });
  // #endif
});

onShow(() => {
  console.log("[彩虹桥] App Show");
});

onHide(() => {
  stopSpeaking();
  useRacingStore().lockParent();
});
</script>

<style lang="scss">
@import "uview-plus/index.scss";
@import "@/styles/racing.scss";

page {
  background-color: #fff9e6;
  font-family: "PingFang SC", "Noto Sans CJK SC", "Helvetica Neue", Helvetica, "Comic Sans MS",
    "Microsoft YaHei", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}

view,
text {
  box-sizing: border-box;
}

/* #ifdef H5 */
html, body {
  --kb-primary: #b94348;
  --kb-focus: #9f3038;
  --kb-text: #293344;
  --kb-muted: #606779;
  --kb-border: #e6d7c4;
  --kb-paper: #fffdf8;
  --kb-cream: #fff9e6;
  --kb-success: #176b49;
  --kb-error: #b33038;
}
html, body { margin: 0; padding: 0; width: 100%; }
body { color: var(--kb-text); background: var(--kb-cream); }
*, *::before, *::after { box-sizing: border-box; }
#app { width: 100%; max-width: 860px; margin: 0 auto; }
uni-page-head .uni-page-head, uni-tabbar .uni-tabbar { max-width: 860px; margin-inline: auto; }
uni-page-body { width: 100%; }
uni-view, uni-text { min-width: 0; }
a { text-underline-offset: 4px; }
input { caret-color: var(--kb-primary); }
::selection { background: #ffe1d9; color: #70262c; }
:focus-visible { outline: 3px solid var(--kb-focus); outline-offset: 3px; }
[role="button"] { cursor: pointer; }
[role="button"][aria-disabled="true"] { cursor: default; }
/* 读写区保持舒适行长；网格在平板和桌面展开。 */
@media (min-width: 768px) {
  .stage, .ch-stage, .py-stage, .ep-stage, .flash-stage, .st-content { max-width: 860px !important; }
  .home-page, .profile-page { max-width: 860px !important; }
}
/* 淡色图形保留原主题，正文与操作文字使用足够深的主题色。 */
.type-desc, .stat-label, .tip-text, .set-desc, .fh-subtitle,
.py-tips, .in-tips, .vw-tips, .sc-cn, .th-sub, .sh-sub,
.hero-subtitle, .ep-hero-sub, .py-hero-subtitle, .lc-desc,
.lc-qt, .lc-attempts, .lc-need, .tone-desc, .greeting-desc { color: var(--kb-muted) !important; }
.hero-title, .sh-title, .th-title, .vh-title, .ih-title { color: var(--kb-primary) !important; }
.start-btn, .again-btn, .start-btn-text, .r-btn-a { color: #fff; }
.start-btn { min-height: 44px !important; background: var(--kb-primary) !important; }
.next-btn, .empty-btn { background: #176f75 !important; }
.count-chip.active, .grade-chip.active { background: var(--kb-primary) !important; }
.home-page, .flash-bg, .pinyin-page { padding-bottom: calc(72px + env(safe-area-inset-bottom)); }
/* 亮色背景上的文本采用对应深色，图形与装饰继续使用彩虹配色。 */
.greeting-title, .greeting-desc { color: #622c27 !important; }
.brand-name, .stat-num.coral, .sv.coral, .ov-num.coral, .stat-value.text-coral { color: var(--kb-primary) !important; }
.stat-num.green, .sv.green, .ov-num.green, .stat-value.text-green { color: var(--kb-success) !important; }
.stat-num.blue, .sv.blue, .ov-num.blue { color: #1b5ca4 !important; }
.profile-name, .profile-grade, .profile-slogan { color: #532c3b !important; }
.py-char, .tone-example { color: var(--kb-primary) !important; }
.py-char.c-vowel { color: #075985 !important; }
.py-char.c-whole { color: #784400 !important; }
/* 横向列表只在其容器内滚动，不扩大页面。 */
.category-row, .initial-strip, uni-scroll-view { max-width: 100%; }
.category-row { scroll-padding-inline: 8px; }
.cat-chip, .count-chip, .grade-chip, .strip-chip, .tab-chip,
.sc-speak, .fv-remove, .sp-speak-btn, .flash-speak { min-height: 44px; }
.sc-speak, .sp-speak-btn, .speak-btn { min-width: 44px; min-height: 44px; }
.av-item { min-width: 44px; min-height: 44px; }
.tb-cell { min-height: 44px; }
.start-btn, .next-btn, .nav-btn, .know-btn, .r-btn-a, .r-btn-b, .again-btn, .home-btn, .fv-remove, .fv-clear, .empty-btn { min-height: 44px !important; }
@media (max-width: 400px) {
  .type-grid { padding-inline: 12px !important; gap: 10px !important; }
  .type-card { padding: 12px 8px !important; gap: 6px !important; }
  .type-icon-img { width: 22px !important; height: 22px !important; }
  .check { width: 20px !important; height: 20px !important; flex-shrink: 0; }
  .grade-row { flex-wrap: wrap; }
  .grade-picker { max-width: 100% !important; }
  .avatars-grid { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
}
@media (prefers-reduced-motion: reduce) {
  .float-shape, .dot, .stick, .fruit-item, .star { animation: none !important; }
  .progress-fill, .mod-row, .type-card, .py-cell, .flash-card { transition: none !important; }
}
/* #endif */
</style>
