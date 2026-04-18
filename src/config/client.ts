import { VIDEO_UPLOAD_MAX_MB } from "@/lib/constants";

/**
 * 可在客户端安全引用（仅 NEXT_PUBLIC_* 或无密钥常量）。
 */
function readVideoUploadMaxMbForUi(): number {
  const raw = process.env.NEXT_PUBLIC_VIDEO_UPLOAD_MAX_MB;
  if (raw === undefined || raw === "") return VIDEO_UPLOAD_MAX_MB;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return VIDEO_UPLOAD_MAX_MB;
  return Math.min(100, Math.floor(n));
}

export const clientConfig = {
  /** 为 "false" 时训练页不请求 /api/chat，直接使用内置 Mock 台词 */
  useLlmApi: process.env.NEXT_PUBLIC_USE_LLM !== "false",
  /** 解析页「约 X MB」展示；调大服务端上限时请同步设 `NEXT_PUBLIC_VIDEO_UPLOAD_MAX_MB` */
  videoUploadMaxMb: readVideoUploadMaxMbForUi(),
} as const;
