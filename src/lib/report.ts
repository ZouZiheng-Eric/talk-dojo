import { fetchAiBattleScore } from "@/lib/llm/scoreClient";
import {
  clipUserQuoteForList,
  pickGoldenQuoteFromLineScores,
  sortedTrainingRounds,
} from "./reportSnippets";
import type { BattleReport, ReportScores, TrainingRound } from "./types";
import type { ParseResult } from "./types";

function hashReply(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

export function buildReport(
  videoUrl: string,
  parse: ParseResult,
  rounds: TrainingRound[]
): BattleReport {
  const base = rounds.reduce((acc, r) => acc + hashReply(r.userReply), 0) % 40;
  const lenBoost = rounds.reduce((a, r) => a + Math.min(r.userReply.length / 8, 12), 0);

  const scores: ReportScores = {
    boundary: clamp(55 + ((base * 5) % 20) + lenBoost * 0.35, 45, 96),
    pushback: clamp(48 + ((base * 11) % 26) + lenBoost * 0.4, 45, 96),
    logic: clamp(52 + ((base * 3) % 22) + lenBoost * 0.25, 45, 96),
    sarcasm: clamp(50 + ((base * 7) % 24) + lenBoost * 0.2, 45, 96),
    zen: clamp(58 + (base % 18) + lenBoost * 0.3, 45, 96),
  };

  const overall = Math.round(
    (scores.boundary +
      scores.pushback +
      scores.logic +
      scores.sarcasm +
      scores.zen) /
      5
  );

  /** 仅用户原话摘录；不再用通用文案冒充金句。短回复也保留。 */
  const quotes = sortedTrainingRounds(rounds)
    .map((r) => clipUserQuoteForList(r.userReply))
    .filter((q) => q.length > 0);

  return {
    overall,
    scores,
    quotes,
    rounds,
    parse,
    videoUrl,
  };
}

/**
 * 在本地 `buildReport` 基础上，若 `/api/score` 成功：采用 AI 五维分、综合分、锐评；
 * 若有 `goldenQuote`，金句区只展示该句（文本为用户原话），并附带各轮金句分。
 */
export async function buildReportWithOptionalAi(
  videoUrl: string,
  parse: ParseResult,
  rounds: TrainingRound[]
): Promise<BattleReport> {
  const base = buildReport(videoUrl, parse, rounds);
  const ai = await fetchAiBattleScore(parse, rounds);
  if (!ai) return base;

  const lineScores =
    ai.lineScores.length > 0 ? ai.lineScores : undefined;

  const goldenFromApi =
    ai.goldenQuote && ai.goldenQuote.text.trim() ? ai.goldenQuote : null;
  const golden =
    goldenFromApi ??
    (lineScores && lineScores.length > 0
      ? pickGoldenQuoteFromLineScores(rounds, lineScores)
      : null);

  if (golden && golden.text.trim()) {
    return {
      ...base,
      scores: ai.scores,
      overall: ai.overall,
      coachNotes: ai.coachNotes.length > 0 ? ai.coachNotes : undefined,
      lineScores,
      goldenQuote: golden,
      quotes: [golden.text.trim()],
    };
  }

  return {
    ...base,
    scores: ai.scores,
    overall: ai.overall,
    coachNotes: ai.coachNotes.length > 0 ? ai.coachNotes : undefined,
    lineScores,
  };
}
