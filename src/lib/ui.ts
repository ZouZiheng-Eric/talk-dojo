/** 复用样式，避免 globals @apply 在部分构建链下异常 */
export const glassPanel =
  "rounded-2xl border border-dojo-line/60 bg-dojo-ink/75 backdrop-blur-xl shadow-2xl";

/** 主按钮：浅字 + 实色底 + 渐变（避免近黑字 + 渐变失效时被误认为「黑按钮」） */
export const btnPrimary =
  "rounded-xl bg-gradient-to-r from-dojo-accent to-dojo-coral px-6 py-3.5 font-semibold text-white shadow-lg shadow-dojo-accent/30 ring-1 ring-white/15 transition-all active:scale-95 disabled:opacity-50";

export const inputField =
  "w-full rounded-xl border border-dojo-line bg-dojo-mist/50 px-4 py-3.5 text-dojo-text placeholder:text-dojo-muted outline-none ring-0 transition-colors focus:border-dojo-accent/50";

/** 链接点击缩放反馈（避免 motion(Link) 与 Next 类型冲突） */
export const linkPressable =
  "transition-transform duration-150 active:scale-[0.96]";
