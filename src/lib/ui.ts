/** 复用样式，避免 globals @apply 在部分构建链下异常 */
export const glassPanel =
  "rounded-2xl border border-dojo-line bg-dojo-ink shadow-[0_2px_16px_rgba(0,0,0,0.06)]";

/** 主按钮：Apple 式实色强调 */
export const btnPrimary =
  "rounded-xl bg-dojo-accent px-6 py-3.5 font-semibold text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-50";

export const inputField =
  "w-full rounded-xl border border-dojo-line bg-dojo-ink px-4 py-3.5 text-dojo-text placeholder:text-dojo-muted outline-none ring-0 transition-[box-shadow,border-color] focus:border-dojo-accent focus:shadow-[0_0_0_3px_rgba(13,148,136,0.22)]";

/** 链接点击缩放反馈（避免 motion(Link) 与 Next 类型冲突） */
export const linkPressable =
  "transition-transform duration-150 active:scale-[0.96]";
