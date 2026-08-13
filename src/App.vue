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
</style>
