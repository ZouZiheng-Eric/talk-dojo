import { NextRequest, NextResponse } from "next/server";
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

  const result = await postChatCompletion(messages);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, code: result.code, message: result.message },
      { status: result.status }
    );
  }

  return NextResponse.json({ ok: true, content: result.content });
}
