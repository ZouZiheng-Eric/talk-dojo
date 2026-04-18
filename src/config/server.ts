/**
 * 仅在服务端使用：Route Handlers、Server Actions、Server Components。
 * 勿在客户端组件中 import 本文件（避免误打包密钥相关逻辑）。
 */
/** 火山方舟等：请求体 `thinking.type`，关闭深度思考可加快首字；OpenAI 勿设此项 */
export type LlmThinkingType = "disabled" | "auto" | "enabled";

function parseLlmThinking(
  raw: string | undefined
): LlmThinkingType | undefined {
  if (!raw?.trim()) return undefined;
  const v = raw.trim().toLowerCase();
  if (v === "disabled" || v === "auto" || v === "enabled") return v;
  return undefined;
}

export type LlmServerConfig = {
  apiBase: string;
  apiKey: string;
  model: string;
  /** 评分路由专用模型；未配置则回退到 model */
  scoreModel?: string;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
  /** 仅兼容接口支持时生效；未设置则不发送该字段 */
  thinkingType?: LlmThinkingType;
  /** 训练对话专用 thinking；未设置则回退 thinkingType */
  chatThinkingType?: LlmThinkingType;
  /** 评分专用 thinking；未设置则回退 thinkingType */
  scoreThinkingType?: LlmThinkingType;
};

export function getLlmServerConfig(): LlmServerConfig {
  const base =
    (process.env.LLM_API_BASE || "https://api.openai.com/v1").replace(
      /\/+$/,
      ""
    );
  return {
    apiBase: base,
    apiKey: process.env.LLM_API_KEY || "",
    model: process.env.LLM_MODEL || "gpt-4o-mini",
    scoreModel: process.env.LLM_SCORE_MODEL?.trim() || undefined,
    temperature: Math.min(
      2,
      Math.max(0, Number(process.env.LLM_TEMPERATURE ?? 0.85))
    ),
    maxTokens: Math.min(
      8192,
      Math.max(64, Number(process.env.LLM_MAX_TOKENS ?? 512))
    ),
    timeoutMs: Math.min(
      120_000,
      Math.max(5_000, Number(process.env.LLM_TIMEOUT_MS ?? 60_000))
    ),
    thinkingType: parseLlmThinking(process.env.LLM_THINKING),
    chatThinkingType: parseLlmThinking(process.env.LLM_CHAT_THINKING),
    scoreThinkingType: parseLlmThinking(process.env.LLM_SCORE_THINKING),
  };
}

export function isLlmConfigured(): boolean {
  return Boolean(getLlmServerConfig().apiKey.trim());
}
