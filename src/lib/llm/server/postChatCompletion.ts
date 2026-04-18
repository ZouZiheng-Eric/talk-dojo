import { getLlmServerConfig, isLlmConfigured } from "@/config/server";
import type { ChatMessage } from "@/lib/llm/messages";

export type CompletionOptions = {
  temperature?: number;
  maxTokens?: number;
  /** OpenAI Chat Completions：json_object（需在 messages 中要求输出 JSON） */
  jsonObject?: boolean;
};

export type CompletionResult =
  | { ok: true; content: string }
  | {
      ok: false;
      code: string;
      message: string;
      status: number;
    };

export async function postChatCompletion(
  messages: ChatMessage[],
  options?: CompletionOptions
): Promise<CompletionResult> {
  if (!isLlmConfigured()) {
    return {
      ok: false,
      code: "LLM_NOT_CONFIGURED",
      message: "Set LLM_API_KEY in .env.local",
      status: 503,
    };
  }

  const cfg = getLlmServerConfig();
  const url = `${cfg.apiBase}/chat/completions`;
  const temperature =
    options?.temperature !== undefined
      ? options.temperature
      : cfg.temperature;
  const max_tokens =
    options?.maxTokens !== undefined ? options.maxTokens : cfg.maxTokens;

  const payload: Record<string, unknown> = {
    model: cfg.model,
    messages,
    temperature,
    max_tokens,
  };
  if (options?.jsonObject) {
    payload.response_format = { type: "json_object" };
  }
  if (cfg.thinkingType) {
    payload.thinking = { type: cfg.thinkingType };
  }

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), cfg.timeoutMs);

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(t);

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => "");
      return {
        ok: false,
        code: "UPSTREAM",
        message: errText.slice(0, 500) || upstream.statusText,
        status: 502,
      };
    }

    const raw = (await upstream.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = raw.choices?.[0]?.message?.content?.trim() ?? "";

    if (!content) {
      return {
        ok: false,
        code: "EMPTY",
        message: "No content in response",
        status: 502,
      };
    }

    return { ok: true, content };
  } catch (e) {
    clearTimeout(t);
    const msg = e instanceof Error ? e.message : "fetch failed";
    return {
      ok: false,
      code: "NETWORK",
      message: msg,
      status: 502,
    };
  }
}
