import { NextRequest, NextResponse } from "next/server";
import { isLlmConfigured } from "@/config/server";
import { postChatCompletion } from "@/lib/llm/server/postChatCompletion";
import { buildScoreMessages } from "@/lib/llm/scoreMessages";
import { parseAiScoreContent } from "@/lib/llm/parseScoreJson";
import { pickGoldenQuoteFromLineScores } from "@/lib/reportSnippets";
import type { ParseResult, TrainingRound } from "@/lib/types";

type Body = {
  parse?: unknown;
  rounds?: unknown;
};

function isParseResult(x: unknown): x is ParseResult {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.title === "string" &&
    typeof o.conflict === "string" &&
    typeof o.hotComment === "string"
  );
}

function isTrainingRounds(x: unknown): x is TrainingRound[] {
  if (!Array.isArray(x) || x.length === 0) return false;
  return x.every(
    (r) =>
      r &&
      typeof r === "object" &&
      typeof (r as TrainingRound).round === "number" &&
      typeof (r as TrainingRound).aiMessage === "string" &&
      typeof (r as TrainingRound).userReply === "string"
  );
}

/** 模型常把 round 写成 0、1、2；训练数据为 1、2、3 */
function normalizeLineScoreRounds(
  rounds: TrainingRound[],
  rows: Array<{ round: number; lineScore: number }>
): Array<{ round: number; lineScore: number }> {
  if (rows.length === 0 || rows.length !== rounds.length) return rows;
  const sorted = [...rows].sort((a, b) => a.round - b.round);
  const min = sorted[0].round;
  const max = sorted[sorted.length - 1].round;
  if (min === 0 && max === rounds.length - 1) {
    return sorted.map((x) => ({ round: x.round + 1, lineScore: x.lineScore }));
  }
  return rows;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "BAD_JSON", message: "Invalid JSON" },
      { status: 400 }
    );
  }

  if (!isParseResult(body.parse) || !isTrainingRounds(body.rounds)) {
    return NextResponse.json(
      { ok: false, code: "BAD_BODY", message: "parse and rounds required" },
      { status: 400 }
    );
  }

  if (!isLlmConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        code: "LLM_NOT_CONFIGURED",
        message: "Set LLM_API_KEY in .env.local",
      },
      { status: 503 }
    );
  }

  const messages = buildScoreMessages(body.parse, body.rounds);
  const result = await postChatCompletion(messages, {
    temperature: 0.32,
    maxTokens: 720,
    jsonObject: true,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, code: result.code, message: result.message },
      { status: result.status }
    );
  }

  const parsed = parseAiScoreContent(result.content);
  if (!parsed) {
    return NextResponse.json(
      { ok: false, code: "BAD_SCORE_JSON", message: "Model did not return valid JSON" },
      { status: 502 }
    );
  }

  const lineScoresNorm = normalizeLineScoreRounds(
    body.rounds,
    parsed.lineScores
  );

  const goldenQuote = pickGoldenQuoteFromLineScores(
    body.rounds,
    lineScoresNorm
  );

  return NextResponse.json({
    ok: true,
    scores: parsed.scores,
    overall: parsed.overall,
    coachNotes: parsed.coachNotes,
    lineScores: lineScoresNorm,
    goldenQuote,
  });
}
