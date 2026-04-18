import { NextRequest, NextResponse } from "next/server";
import { getLlmServerConfig, isLlmConfigured } from "@/config/server";
import { postChatCompletion } from "@/lib/llm/server/postChatCompletion";
import type { ChatMessage } from "@/lib/llm/messages";

type Body = {
  messages?: ChatMessage[];
};

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

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { ok: false, code: "NO_MESSAGES", message: "messages required" },
      { status: 400 }
    );
  }

  const cfg = getLlmServerConfig();
  const rawKey = process.env.LLM_API_KEY;
  // #region agent log
  fetch("http://127.0.0.1:7524/ingest/a4e77efa-2ce8-4692-b03f-67338b987267", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "5b01e5",
    },
    body: JSON.stringify({
      sessionId: "5b01e5",
      hypothesisId: "H1-H4",
      location: "api/chat/route.ts:POST:before-completion",
      message: "LLM env snapshot (no secrets)",
      data: {
        msgCount: messages.length,
        isLlmConfigured: isLlmConfigured(),
        llmApiKeyEnvDefined: rawKey !== undefined,
        llmApiKeyTrimLen: cfg.apiKey.trim().length,
        nodeEnv: process.env.NODE_ENV ?? "",
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  /** 训练轮次台词：未单独配置 LLM_CHAT_THINKING 时不要继承 LLM_THINKING，避免方舟等接入点对 thinking 报错/空内容导致 502 */
  const result = await postChatCompletion(messages, {
    ...(cfg.chatThinkingType !== undefined
      ? { thinkingType: cfg.chatThinkingType }
      : { omitThinking: true }),
  });

  if (!result.ok) {
    // #region agent log
    fetch("http://127.0.0.1:7524/ingest/a4e77efa-2ce8-4692-b03f-67338b987267", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "5b01e5",
      },
      body: JSON.stringify({
        sessionId: "5b01e5",
        hypothesisId: "H1",
        location: "api/chat/route.ts:POST:error-result",
        message: "postChatCompletion failed",
        data: { code: result.code, status: result.status },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return NextResponse.json(
      { ok: false, code: result.code, message: result.message },
      { status: result.status }
    );
  }

  return NextResponse.json({ ok: true, content: result.content });
}
