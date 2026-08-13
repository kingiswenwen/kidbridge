/** @type {import('tailwindcss').Config} */
module.exports = {
  // H5 端 + 小程序端全部覆盖
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx,wxml}"],
  // 小程序端不能用 * 选择器等，关闭 preflight，我们手写基础 reset
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        // 儿童风主色系
        primary: {
          DEFAULT: "#FF6B6B",
          coral: "#FF6B6B",
          mint: "#4ECDC4",
          warm: "#FFF9E6",
          "mint-dark": "#26B3AA",
        },
        simple: {
          blue: "#4A90A4",
          light: "#7FB3C8",
          gray: "#F5F5F5",
        },
        success: "#6BCB77",
        error: "#FF8E8E",
        warning: "#FFD93D",
        info: "#74B9FF",
        bg: {
          cream: "#FFF9E6",
          pink: "#FFF5F5",
          blue: "#F0F9FF",
          mint: "#ECFDF5",
        },
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
        "4xl": "32px",
      },
      fontFamily: {
        cartoon: ['"Comic Neue"', '"Comic Sans MS"', "cursive", "sans-serif"],
      },
      boxShadow: {
        cartoon: "0 6px 0 rgba(0,0,0,0.08), 0 10px 24px rgba(255,107,107,0.15)",
        soft: "0 4px 16px rgba(0,0,0,0.06)",
      },
      spacing: {
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
      },
    },
  },
  plugins: [],
};
