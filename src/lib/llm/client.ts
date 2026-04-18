import type { ParseResult } from "@/lib/types";
import type { TrainingRound } from "@/lib/types";
import { clientConfig } from "@/config/client";
import { buildCoachMessages } from "@/lib/llm/messages";
import { PRESSURE_MESSAGES } from "@/lib/mock";

type ChatResponse =
  | { ok: true; content: string }
  | { ok: false; code: string; message?: string };

function mockLine(roundIndex: number): string {
  return PRESSURE_MESSAGES[Math.min(roundIndex, PRESSURE_MESSAGES.length - 1)];
}

/**
 * 请求本轮教练台词；失败或未配置时回退到本地 Mock。
 * @param roundIndex 0-based，与训练页 roundIndex 一致
 */
export async function fetchCoachLine(
  parse: ParseResult,
  completedRounds: TrainingRound[],
  roundIndex: number
): Promise<{ text: string; fromApi: boolean }> {
  const roundNumber = roundIndex + 1;
  if (!clientConfig.useLlmApi) {
    return { text: mockLine(roundIndex), fromApi: false };
  }

  const messages = buildCoachMessages(parse, completedRounds, roundNumber);

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    const data = (await res.json()) as ChatResponse;

    if (!res.ok || !data.ok || !data.content?.trim()) {
      return { text: mockLine(roundIndex), fromApi: false };
    }

    return { text: data.content.trim(), fromApi: true };
  } catch {
    return { text: mockLine(roundIndex), fromApi: false };
  }
}
