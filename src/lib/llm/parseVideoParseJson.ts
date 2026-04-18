import type { ParseResult } from "@/lib/types";

function clip(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

function tryParseJsonObject(s: string): unknown {
  const t = s.trim();
  try {
    return JSON.parse(t);
  } catch {
    const i = t.indexOf("{");
    const j = t.lastIndexOf("}");
    if (i === -1 || j <= i) return null;
    try {
      return JSON.parse(t.slice(i, j + 1));
    } catch {
      return null;
    }
  }
}

/**
 * 从模型 JSON 或 session 等对象提取 {@link ParseResult}。
 * 兼容历史字段名 `hotComment`。
 */
export function parseResultFromJsonObject(obj: Record<string, unknown>): ParseResult | null {
  const title = typeof obj.title === "string" ? obj.title.trim() : "";
  const conflict = typeof obj.conflict === "string" ? obj.conflict.trim() : "";
  const rawKw =
    typeof obj.contextKeywords === "string"
      ? obj.contextKeywords.trim()
      : typeof obj.hotComment === "string"
        ? obj.hotComment.trim()
        : "";
  if (!title || !conflict || !rawKw) return null;

  return {
    title: clip(title, 80),
    conflict: clip(conflict, 400),
    contextKeywords: clip(rawKw, 160),
  };
}

export function parseVideoParseContent(raw: string): ParseResult | null {
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
  }

  const obj = tryParseJsonObject(s);
  if (obj === null) return null;
  if (!obj || typeof obj !== "object") return null;
  return parseResultFromJsonObject(obj as Record<string, unknown>);
}
