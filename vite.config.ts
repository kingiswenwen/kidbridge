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
