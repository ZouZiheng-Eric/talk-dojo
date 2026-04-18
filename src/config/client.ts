/**
 * 可在客户端安全引用（仅 NEXT_PUBLIC_* 或无密钥常量）。
 */
export const clientConfig = {
  /** 为 "false" 时训练页不请求 /api/chat，直接使用内置 Mock 台词 */
  useLlmApi: process.env.NEXT_PUBLIC_USE_LLM !== "false",
} as const;
