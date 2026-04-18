import { clientConfig } from "@/config/client";
import type {
  GoldenQuotePick,
  LineScoreRow,
  ParseResult,
  ReportScores,
  TrainingRound,
} from "@/lib/types";

export type AiBattleScore = {
  scores: ReportScores;
  overall: number;
  coachNotes: string[];
  suggestions: string[];
  lineScores: LineScoreRow[];
  goldenQuote: GoldenQuotePick | null;
};

type ScoreApiOk = {
  ok: true;
  scores: ReportScores;
  overall: number;
  coachNotes?: string[];
  suggestions?: string[];
  lineScores?: LineScoreRow[];
  goldenQuote?: GoldenQuotePick | null;
  /** 旧版 API 字段，兼容 */
  quotes?: string[];
};

type ScoreApiErr = {
  ok: false;
  code?: string;
};

/**
 * 请求 AI 战报评分；未开启 LLM、请求失败或解析失败时返回 null（由 report 回退本地算法）。
 */
export async function fetchAiBattleScore(
  parse: ParseResult,
  rounds: TrainingRound[]
): Promise<AiBattleScore | null> {
  if (!clientConfig.useLlmApi) return null;
  if (rounds.length === 0) return null;

  try {
    const res = await fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parse, rounds }),
    });

    const data = (await res.json()) as ScoreApiOk | ScoreApiErr;

    if (!res.ok || !data.ok || !("scores" in data)) return null;

    const notes = Array.isArray(data.coachNotes)
      ? data.coachNotes
      : Array.isArray(data.quotes)
        ? data.quotes
        : [];

    const suggestions = Array.isArray(data.suggestions)
      ? data.suggestions.filter((x): x is string => typeof x === "string")
      : [];

    const lineScores = Array.isArray(data.lineScores) ? data.lineScores : [];
    const goldenQuote =
      data.goldenQuote === null || data.goldenQuote === undefined
        ? null
        : typeof data.goldenQuote === "object" &&
            typeof data.goldenQuote.text === "string"
          ? data.goldenQuote
          : null;

    return {
      scores: data.scores,
      overall: Math.round(Number(data.overall)) || 0,
      coachNotes: notes,
      suggestions,
      lineScores,
      goldenQuote,
    };
  } catch {
    return null;
  }
}
