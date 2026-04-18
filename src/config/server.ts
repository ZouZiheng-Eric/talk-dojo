/**
 * 仅在服务端使用：Route Handlers、Server Actions、Server Components。
 * 勿在客户端组件中 import 本文件（避免误打包密钥相关逻辑）。
 */
export type LlmServerConfig = {
  apiBase: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
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
  };
}

export function isLlmConfigured(): boolean {
  return Boolean(getLlmServerConfig().apiKey.trim());
}
