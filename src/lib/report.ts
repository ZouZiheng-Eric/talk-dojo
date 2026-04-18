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
    composure: clamp(58 + (base % 18) + lenBoost * 0.3, 45, 96),
    logic: clamp(52 + ((base * 3) % 22) + lenBoost * 0.25, 45, 96),
    boundary: clamp(55 + ((base * 5) % 20) + lenBoost * 0.35, 45, 96),
    empathy: clamp(50 + ((base * 7) % 24) + lenBoost * 0.2, 45, 96),
    punch: clamp(48 + ((base * 11) % 26) + lenBoost * 0.4, 45, 96),
  };

  const overall = Math.round(
    (scores.composure +
      scores.logic +
      scores.boundary +
      scores.empathy +
      scores.punch) /
      5
  );

  const quotes = rounds
    .map((r) => r.userReply.trim())
    .filter((t) => t.length > 4)
    .slice(0, 3)
    .map((t) => (t.length > 48 ? t.slice(0, 48) + "…" : t));

  const fallback = [
    "先接住事实，再谈观点，节奏在你手里。",
    "边界清晰不等于撕破脸，是让对方知道你的底线。",
  ];

  return {
    overall,
    scores,
    quotes: quotes.length ? quotes : fallback,
    rounds,
    parse,
    videoUrl,
  };
}
