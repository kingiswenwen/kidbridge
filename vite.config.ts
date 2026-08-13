import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import path from "node:path";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

export default defineConfig({
  plugins: [uni()],
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
