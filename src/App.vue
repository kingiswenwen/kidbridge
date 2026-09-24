<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";

onLaunch(() => {
  console.log("[彩虹桥] App Launch");
});

onShow(() => {
  console.log("[彩虹桥] App Show");
});

onHide(() => {
  console.log("[彩虹桥] App Hide");
});
</script>

<style lang="scss">
@import "uview-plus/index.scss";

page {
  background-color: #fff9e6;
  font-family: "PingFang SC", "Helvetica Neue", Helvetica, "Comic Sans MS",
    "Microsoft YaHei", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}

view,
text {
  box-sizing: border-box;
}

/* ============ 三端响应式适配（H5 端） ============
   限制页面内容最大宽度并居中，避免在大屏（iPad / 桌面浏览器）上铺满或元素被拉伸过大。
   - 手机：全宽（默认）
   - iPad / 平板（>=768px）：内容最大 720px 居中
   - 桌面（>=1024px）：内容最大 860px 居中
   小程序端使用 rpx（uni-app 原生响应式单位，按屏宽等比缩放），本身已适配，无需此层。 */
/* #ifdef H5 */
#app {
  max-width: 100%;
  margin: 0 auto;
}
@media screen and (min-width: 768px) {
  #app {
    max-width: 720px;
  }
}
@media screen and (min-width: 1024px) {
  #app {
    max-width: 860px;
  }
}
/* #endif */
</style>
