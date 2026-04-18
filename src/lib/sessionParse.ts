import { SESSION_PARSE_KEY } from "@/lib/constants";
import { parseResultFromJsonObject } from "@/lib/llm/parseVideoParseJson";
import type { ParseResult } from "@/lib/types";

type Stored = { url: string; parse: ParseResult };

export function writeSessionParse(url: string, parse: ParseResult): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(
      SESSION_PARSE_KEY,
      JSON.stringify({ url, parse } satisfies Stored)
    );
  } catch {
    /* quota / private mode */
  }
}

export function readSessionParse(url: string): ParseResult | null {
  if (typeof sessionStorage === "undefined" || !url.trim()) return null;
  try {
    const raw = sessionStorage.getItem(SESSION_PARSE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as Stored;
    if (o.url !== url) return null;
    const p = o.parse;
    if (!p || typeof p !== "object") return null;
    return parseResultFromJsonObject(p as Record<string, unknown>);
  } catch {
    return null;
  }
}
