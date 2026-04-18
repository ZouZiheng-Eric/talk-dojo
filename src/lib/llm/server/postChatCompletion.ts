import { getLlmServerConfig, isLlmConfigured } from "@/config/server";
import type { LlmThinkingType } from "@/config/server";
import type { ChatMessage } from "@/lib/llm/messages";

export type CompletionOptions = {
  /** 覆盖默认模型（用于评分等独立链路） */
  model?: string;
  /** 覆盖默认 thinking（未设置则回退到服务端配置） */
  thinkingType?: LlmThinkingType;
  /** 为 true 时不发送 thinking（多模态视频等场景避免与网关冲突） */
  omitThinking?: boolean;
  temperature?: number;
  maxTokens?: number;
  /** 覆盖全局请求超时（如视频理解） */
  timeoutMs?: number;
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

/** 兼容 string 与多模态返回的 content 数组（如豆包） */
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

type ArkBody = Record<string, unknown>;

function resultFromArkJson(raw: ArkBody): CompletionResult {
  const err = raw.error;
  if (err && typeof err === "object") {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) {
      return {
        ok: false,
        code: "UPSTREAM",
        message: msg.trim().slice(0, 1200),
        status: 502,
      };
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

  if (!text) {
    return {
      ok: false,
      code: "EMPTY",
      message: "No content in response",
      status: 502,
    };
  }
  return { ok: true, content: text };
}

async function parseResponse(res: Response): Promise<CompletionResult> {
  try {
    const raw = (await res.json()) as ArkBody;
    return resultFromArkJson(raw);
  } catch {
    return {
      ok: false,
      code: "UPSTREAM",
      message: "Invalid JSON from upstream",
      status: 502,
    };
  }
}

type Variant = {
  useJsonObject: boolean;
  thinking: LlmThinkingType | null;
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
  const endpoint = `${cfg.apiBase}/chat/completions`;
  const temperature =
    options?.temperature !== undefined
      ? options.temperature
      : cfg.temperature;
  const max_tokens =
    options?.maxTokens !== undefined ? options.maxTokens : cfg.maxTokens;

  const resolvedThinking: LlmThinkingType | null = options?.omitThinking
    ? null
    : (options?.thinkingType ?? cfg.thinkingType ?? null) || null;

  const timeoutMs =
    options?.timeoutMs !== undefined ? options.timeoutMs : cfg.timeoutMs;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const variants: Variant[] = [];
  if (options?.jsonObject) {
    variants.push(
      { useJsonObject: true, thinking: resolvedThinking },
      { useJsonObject: false, thinking: resolvedThinking },
      { useJsonObject: false, thinking: null }
    );
  } else {
    variants.push(
      { useJsonObject: false, thinking: resolvedThinking },
      { useJsonObject: false, thinking: null }
    );
  }

  const seen = new Set<string>();
  const unique = variants.filter((v) => {
    const k = `${v.useJsonObject}|${v.thinking ?? "∅"}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const doRequest = (payload: Record<string, unknown>) =>
    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

  try {
    let lastHttpError = "";

    for (let i = 0; i < unique.length; i++) {
      const v = unique[i];
      const payload: Record<string, unknown> = {
        model: options?.model?.trim() || cfg.model,
        messages,
        temperature,
        max_tokens,
      };
      if (v.useJsonObject) {
        payload.response_format = { type: "json_object" };
      }
      if (v.thinking) {
        payload.thinking = { type: v.thinking };
      }

      const res = await doRequest(payload);

      if (!res.ok) {
        lastHttpError = (await res.text().catch(() => "")).slice(0, 1200);
        continue;
      }

      const out = await parseResponse(res);
      if (out.ok) {
        clearTimeout(timer);
        return out;
      }
      if (out.code === "UPSTREAM") {
        clearTimeout(timer);
        return out;
      }
      /* EMPTY：换下一配方重试 */
    }

    clearTimeout(timer);
    return {
      ok: false,
      code: "UPSTREAM",
      message:
        lastHttpError || "Request failed or empty after parameter retries",
      status: 502,
    };
  } catch (e) {
    clearTimeout(timer);
    const msg = e instanceof Error ? e.message : "fetch failed";
    return {
      ok: false,
      code: "NETWORK",
      message: msg,
      status: 502,
    };
  }
}
