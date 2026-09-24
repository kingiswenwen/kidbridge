import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import { UnifiedViteWeappTailwindcssPlugin } from "weapp-tailwindcss/vite";
import path from "node:path";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

export default defineConfig({
  plugins: [
    uni(),
    // 让 Tailwind 原子类在 uni-app 小程序端生效：rem→rpx 转译 + 选择器适配。
    // 该插件会按平台自动激活（仅小程序端生效，H5 端由 postcss.config.js 处理，不受影响）。
    UnifiedViteWeappTailwindcssPlugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
    preprocessorOptions: {
      scss: {
        // 屏蔽 Dart Sass 弃用警告（不影响编译与运行，仅不再刷屏）：
        // - "import"：uview-plus 及本项目的 @import 语法在未来版本会被移除，目前仅为警告
        // - "legacy-js-api"：Vite 5.2 默认调用 sass 旧版 JS API，新版 sass 会提示弃用
        // 根因在两库且已是各自最新（uni 硬钉 vite 5.2.8 / uview-plus 3.8.86），升级无法消除，仅能静音。
        silenceDeprecations: ["import", "legacy-js-api"],
        additionalData: `
          @import "uview-plus/theme.scss";
          @import "uview-plus/libs/css/mixin.scss";
          @import "@/uni.scss";
        `,
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
