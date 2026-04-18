import { NextRequest, NextResponse } from "next/server";
import { getLlmServerConfig } from "@/config/server";
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
  /** 训练轮次台词：未单独配置 LLM_CHAT_THINKING 时不要继承 LLM_THINKING，避免方舟等接入点对 thinking 报错/空内容导致 502 */
  const result = await postChatCompletion(messages, {
    ...(cfg.chatThinkingType !== undefined
      ? { thinkingType: cfg.chatThinkingType }
      : { omitThinking: true }),
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, code: result.code, message: result.message },
      { status: result.status }
    );
  }

  return NextResponse.json({ ok: true, content: result.content });
}
