import type { BattleReport, GoldenQuotePick, ReportScores, TrainingRound } from "./types";

const DEFAULT_SCORES: ReportScores = {
  boundary: 50,
  pushback: 50,
  logic: 50,
  sarcasm: 50,
  zen: 50,
};

function clampScore(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}

function readNum(v: unknown, fallback: number): number {
  const x = Number(v);
  if (!Number.isFinite(x)) return fallback;
  return clampScore(x);
}

/** 兼容旧版五维字段（composure/empathy/punch）与新版（zen/sarcasm/pushback） */
export function normalizeReportScores(raw: unknown): ReportScores {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_SCORES };
  const o = raw as Record<string, unknown>;
  const pushback =
    o.pushback !== undefined ? readNum(o.pushback, 50) : readNum(o.punch, 50);
  const sarcasm =
    o.sarcasm !== undefined ? readNum(o.sarcasm, 50) : readNum(o.empathy, 50);
  const zen =
    o.zen !== undefined ? readNum(o.zen, 50) : readNum(o.composure, 50);
  return {
    boundary: readNum(o.boundary, 50),
    pushback,
    logic: readNum(o.logic, 50),
    sarcasm,
    zen,
  };
}

export function normalizeBattleReport(raw: BattleReport): BattleReport {
  return {
    ...raw,
    scores: normalizeReportScores(raw.scores),
  };
}

/** 战报展示：按轮次排序 */
export function sortedTrainingRounds(rounds: TrainingRound[]): TrainingRound[] {
  return [...rounds].sort((a, b) => a.round - b.round);
}

/**
 * 单字几乎不可能是金句，先排除；不参与「先长后短」分段比分的错误逻辑（否则长句会压过 lineScore 更高的短金句）。
 */
const GOLDEN_MIN_CHARS = 2;

function pickBestByLineScore(
  sorted: TrainingRound[],
  byRound: Map<number, number>,
  minLen: number
): GoldenQuotePick | null {
  let bestRound: number | null = null;
  let bestScore = -1;
  let bestLen = -1;

  for (const tr of sorted) {
    const text = tr.userReply.trim();
    if (text.length < minLen) continue;
    const s = byRound.get(tr.round);
    if (s === undefined) continue;
    const winsTie =
      s > bestScore ||
      (s === bestScore &&
        bestRound !== null &&
        (text.length > bestLen || (text.length === bestLen && tr.round < bestRound)));
    if (winsTie) {
      bestScore = s;
      bestRound = tr.round;
      bestLen = text.length;
    }
  }

  if (bestRound === null) return null;
  const winner = sorted.find((x) => x.round === bestRound);
  if (!winner) return null;

  return {
    round: bestRound,
    lineScore: bestScore,
    text: winner.userReply.trim(),
  };
}

/**
 * 根据 AI 返回的每轮 lineScore 选金句：**全局取 lineScore 最高**（在字数门槛内）；
 * 同分取长回复，再取更早轮次。字数仅过滤超短敷衍，不再让长段覆盖更高分的短句。
 */
export function pickGoldenQuoteFromLineScores(
  rounds: TrainingRound[],
  lineScores: Array<{ round: number; lineScore: number }>
): GoldenQuotePick | null {
  if (lineScores.length === 0) return null;

  const sorted = sortedTrainingRounds(rounds);
  const byRound = new Map<number, number>();
  for (const row of lineScores) {
    const r = Math.round(Number(row.round));
    if (!Number.isFinite(r)) continue;
    const s = Math.round(Number(row.lineScore));
    if (!Number.isFinite(s)) continue;
    byRound.set(r, Math.min(100, Math.max(0, s)));
  }

  const primary = pickBestByLineScore(sorted, byRound, GOLDEN_MIN_CHARS);
  if (primary) return primary;
  return pickBestByLineScore(sorted, byRound, 1);
}

/** 列表/卡片用摘录（仅截断，不改写内容） */
export function clipUserQuoteForList(text: string, maxLen = 100): string {
  const t = text.trim();
  if (!t) return "";
  return t.length > maxLen ? `${t.slice(0, maxLen)}…` : t;
}
