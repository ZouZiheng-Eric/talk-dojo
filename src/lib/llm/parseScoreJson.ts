import type { ReportScores } from "@/lib/types";

export type AiScorePayload = {
  scores: ReportScores;
  overall: number;
  coachNotes: string[];
  /** 每轮用户原话的金句分，与 rounds 中 round 对应 */
  lineScores: Array<{ round: number; lineScore: number }>;
};

function clampInt(n: number, lo: number, hi: number) {
  const x = Math.round(Number(n));
  if (!Number.isFinite(x)) return lo;
  return Math.min(hi, Math.max(lo, x));
}

function readScoreDim(
  sc: Record<string, unknown>,
  keys: string[],
  fallback: number
): number {
  for (const k of keys) {
    const v = sc[k];
    if (v === undefined || v === null || v === "") continue;
    const n = clampInt(Number(v), 0, 100);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

export function parseAiScoreContent(raw: string): AiScorePayload | null {
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
  }

  let obj: unknown;
  try {
    obj = JSON.parse(s);
  } catch {
    return null;
  }

  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  const scoresIn = o.scores;
  if (!scoresIn || typeof scoresIn !== "object") return null;
  const sc = scoresIn as Record<string, unknown>;

  const scores: ReportScores = {
    boundary: readScoreDim(sc, ["boundary"], 50),
    pushback: readScoreDim(sc, ["pushback", "punch"], 50),
    logic: readScoreDim(sc, ["logic"], 50),
    sarcasm: readScoreDim(sc, ["sarcasm", "empathy"], 50),
    zen: readScoreDim(sc, ["zen", "composure"], 50),
  };

  let overall: number;
  if (o.overall !== undefined && o.overall !== null) {
    overall = clampInt(Number(o.overall), 0, 100);
  } else {
    overall = clampInt(
      (scores.boundary +
        scores.pushback +
        scores.logic +
        scores.sarcasm +
        scores.zen) /
        5,
      0,
      100
    );
  }

  const rawNotes = Array.isArray(o.coachNotes)
    ? o.coachNotes
    : Array.isArray(o.quotes)
      ? o.quotes
      : [];

  const coachNotes = rawNotes
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((x) => (x.length > 120 ? `${x.slice(0, 120)}…` : x));

  const lineScores: Array<{ round: number; lineScore: number }> = [];
  if (Array.isArray(o.lineScores)) {
    for (const item of o.lineScores) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const round = Math.round(Number(row.round));
      const rawLs = row.lineScore ?? row.score;
      const lineScore = clampInt(Number(rawLs), 0, 100);
      if (!Number.isFinite(round) || round < 0) continue;
      lineScores.push({ round, lineScore });
    }
  }

  return { scores, overall, coachNotes, lineScores };
}
