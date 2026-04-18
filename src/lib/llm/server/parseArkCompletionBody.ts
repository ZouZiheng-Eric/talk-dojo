/**
 * 解析方舟 / OpenAI 兼容 Chat Completions JSON 响应（与 postChatCompletion 语义对齐，便于独立 fetch 调试）
 */
function extractAssistantText(content: unknown): string {
  if (content === undefined || content === null) return "";
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (!part || typeof part !== "object") return "";
        const p = part as Record<string, unknown>;
        if (p.type === "text" && typeof p.text === "string") return p.text;
        if (typeof p.text === "string") return p.text;
        if (typeof p.content === "string") return p.content;
        return "";
      })
      .join("")
      .trim();
  }
  return String(content).trim();
}

export type ParsedArkCompletion =
  | { kind: "text"; text: string }
  | { kind: "upstream_error"; message: string }
  | { kind: "empty" };

export function parseArkCompletionBody(data: unknown): ParsedArkCompletion {
  if (!data || typeof data !== "object") {
    return { kind: "empty" };
  }
  const raw = data as Record<string, unknown>;
  const err = raw.error;
  if (err && typeof err === "object") {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) {
      return { kind: "upstream_error", message: msg.trim().slice(0, 1200) };
    }
  }

  const choices = raw.choices;
  const first =
    Array.isArray(choices) && choices[0] && typeof choices[0] === "object"
      ? (choices[0] as { message?: unknown })
      : null;
  const msgObj =
    first?.message && typeof first.message === "object"
      ? (first.message as Record<string, unknown>)
      : null;

  let text = extractAssistantText(msgObj?.content);
  if (
    !text &&
    msgObj &&
    typeof msgObj.reasoning_content === "string"
  ) {
    text = msgObj.reasoning_content.trim();
  }

  if (!text) return { kind: "empty" };
  return { kind: "text", text };
}
