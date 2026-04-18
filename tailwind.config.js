/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /** Apple-like light surfaces（对齐 awesome-design-md / Apple 条目） */
        dojo: {
          void: "#f5f5f7",
          ink: "#ffffff",
          mist: "#fbfbfd",
          line: "#d2d2d7",
          /** 与首页青绿→天蓝渐变同一色相链（非纯蓝） */
          accent: "#0d9488",
          gold: "#1d1d1f",
          coral: "#ff3b30",
          cyan: "#0e7490",
          text: "#1d1d1f",
          muted: "#86868b",
        },
        chat: {
          bubbleLeft: "#f3f3f3",
          bubbleRight: "#95ec69",
        },
      },
      fontFamily: {
        display: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "Helvetica Neue",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "Helvetica Neue",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease-out forwards",
        shimmer: "shimmer 2.5s ease-in-out infinite",
        "pulse-soft": "pulseSoft 3s ease-in-out infinite",
        /** 战报等待：纯展示，与 /api/score 并行、互不等待 */
        "rage-fill": "rageFill 5s cubic-bezier(0.22, 1, 0.36, 1) forwards",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        rageFill: {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
      },
    },
  },
  plugins: [],
};
