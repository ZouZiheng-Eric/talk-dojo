/** 综合分档位：夯 ＞ 顶级 ＞ 人上人 ＞ NPC ＞ 拉完了（由高到低） */
export const PERFORMANCE_TIER_ORDER = [
  "夯",
  "顶级",
  "人上人",
  "NPC",
  "拉完了",
] as const;

export type PerformanceTier = (typeof PERFORMANCE_TIER_ORDER)[number];

/**
 * 按 0～100 分档：80+ 夯，60+ 顶级，40+ 人上人，20+ NPC，否则拉完了。
 */
export function overallToPerformanceTier(overall: number): PerformanceTier {
  const o = Math.round(Number(overall));
  const x = Number.isFinite(o) ? Math.min(100, Math.max(0, o)) : 0;
  if (x >= 80) return "夯";
  if (x >= 60) return "顶级";
  if (x >= 40) return "人上人";
  if (x >= 20) return "NPC";
  return "拉完了";
}

export function performanceTierTone(tier: PerformanceTier): string {
  switch (tier) {
    case "夯":
      return "text-[#248a3d]";
    case "顶级":
      return "text-dojo-accent";
    case "人上人":
      return "text-dojo-text";
    case "NPC":
      return "text-dojo-muted";
    case "拉完了":
    default:
      return "text-dojo-coral";
  }
}
