import { getLlmServerConfig, isLlmConfigured } from "@/config/server";
import type { LlmThinkingType } from "@/config/server";
import type { ChatMessage } from "@/lib/llm/messages";

export type CompletionOptions = {
  /** 覆盖默认模型（用于评分等独立链路） */
  model?: string;
  /** 覆盖默认 thinking（用于按任务精细控制） */
  thinkingType?: LlmThinkingType;
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
    model: options?.model?.trim() || cfg.model,
    messages,
    temperature,
    max_tokens,
  };
  if (options?.jsonObject) {
    payload.response_format = { type: "json_object" };
  }
  const thinkingType = options?.thinkingType ?? cfg.thinkingType;
  if (thinkingType) {
    payload.thinking = { type: thinkingType };
  }

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), cfg.timeoutMs);

  try {
    const doRequest = async (bodyPayload: Record<string, unknown>) =>
      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify(bodyPayload),
        signal: controller.signal,
      });

    let upstream = await doRequest(payload);

    if (!upstream.ok) {
      let errText = await upstream.text().catch(() => "");
      // 部分兼容模型不支持 response_format=json_object，自动降级重试一次
      const canRetryWithoutJsonObject =
        options?.jsonObject &&
        errText.includes("response_format.type") &&
        errText.includes("json_object");
      if (canRetryWithoutJsonObject) {
        const fallbackPayload = { ...payload };
        delete fallbackPayload.response_format;
        upstream = await doRequest(fallbackPayload);
        if (upstream.ok) {
          const raw = (await upstream.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const content = raw.choices?.[0]?.message?.content?.trim() ?? "";
          clearTimeout(t);
          if (!content) {
            return {
              ok: false,
              code: "EMPTY",
              message: "No content in response",
              status: 502,
            };
          }
          return { ok: true, content };
        }
        errText = await upstream.text().catch(() => "");
      }
      clearTimeout(t);
      return {
        ok: false,
        code: "UPSTREAM",
        message: errText.slice(0, 500) || upstream.statusText,
        status: 502,
      };
    }
    clearTimeout(t);

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
