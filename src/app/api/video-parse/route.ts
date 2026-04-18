import { NextRequest, NextResponse } from "next/server";
import { getLlmServerConfig, isLlmConfigured } from "@/config/server";
import { parseArkCompletionBody } from "@/lib/llm/server/parseArkCompletionBody";
import { parseVideoParseContent } from "@/lib/llm/parseVideoParseJson";
import {
  buildVideoParseMessages,
  buildVideoParseMessagesUserOnly,
  normalizeVideoUrlForRequest,
} from "@/lib/llm/videoParseMessages";
import { probeVideoUrlLooksLikeHtmlPage } from "@/lib/videoUrlStreamProbe";
import type { ChatMessage } from "@/lib/llm/messages";
import type { ParseResult } from "@/lib/types";

export const maxDuration = 300;

type JsonBody = { url?: unknown; debug?: unknown };

const DEFAULT_UPLOAD_MAX = 15 * 1024 * 1024;

/** Node / 跨 realm 下 File 不一定通过 instanceof Blob，用结构判断 */
function isBlobLike(v: unknown): v is Blob {
  if (v == null || typeof v !== "object") return false;
  if (typeof Blob !== "undefined" && v instanceof Blob) return true;
  const o = v as { size?: unknown; arrayBuffer?: unknown };
  return typeof o.size === "number" && typeof o.arrayBuffer === "function";
}

/** 从 multipart 中取第一个非空 Blob（含 file / video 及未知字段名） */
function pickUploadBlob(form: FormData): Blob | null {
  const named = form.get("file") ?? form.get("video");
  if (isBlobLike(named) && named.size > 0) return named;
  for (const [, v] of Array.from(form.entries())) {
    if (isBlobLike(v) && v.size > 0) return v;
  }
  return null;
}

/** 浏览器常把本地文件的 type 留空，需用扩展名补全；无扩展名时按 mp4 兜底 */
function videoMimeForUpload(file: Blob & { readonly name?: string }): string | null {
  const direct = file.type?.trim() ?? "";
  if (direct.startsWith("image/")) return null;

  if (direct.startsWith("video/")) return direct;

  const name = typeof file.name === "string" ? file.name : "";
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  const ext = m?.[1] ?? "";
  const extToMime: Record<string, string> = {
    mp4: "video/mp4",
    m4v: "video/x-m4v",
    webm: "video/webm",
    mov: "video/quicktime",
    mkv: "video/x-matroska",
    ogv: "video/ogg",
    avi: "video/x-msvideo",
    "3gp": "video/3gpp",
    flv: "video/x-flv",
    wmv: "video/x-ms-wmv",
    ts: "video/mp2t",
    mts: "video/mp2t",
  };
  const fromExt = extToMime[ext];
  if (fromExt) return fromExt;

  if (direct === "application/octet-stream" || direct === "") {
    return "video/mp4";
  }
  return direct.startsWith("video/") ? direct : null;
}

function looksLikeMultipart(contentType: string): boolean {
  const c = contentType.toLowerCase();
  return c.includes("multipart/form-data") || /\bboundary=/.test(c);
}

function isAllowedHttpVideoUrl(raw: string): boolean {
  const normalized = normalizeVideoUrlForRequest(raw);
  if (normalized.length < 12 || normalized.length > 2048) return false;
  try {
    const u = new URL(normalized);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** 日志里截断 data: 视频，避免刷屏 */
function payloadForLog(payload: Record<string, unknown>): Record<string, unknown> {
  try {
    const p = JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;
    const msgs = p.messages;
    if (!Array.isArray(msgs)) return p;
    for (const m of msgs) {
      if (!m || typeof m !== "object") continue;
      const content = (m as { content?: unknown }).content;
      if (!Array.isArray(content)) continue;
      for (const part of content) {
        if (!part || typeof part !== "object") continue;
        const o = part as { type?: string; video_url?: { url?: string } };
        const u = o.video_url?.url;
        if (o.type === "video_url" && typeof u === "string" && u.startsWith("data:")) {
          o.video_url = {
            url: `[data:${u.length} chars]`,
          };
        }
      }
    }
    return p;
  } catch {
    return { ...payload, messages: "[truncated]" };
  }
}

async function arkChatCompletionsRaw(
  cfg: ReturnType<typeof getLlmServerConfig>,
  payload: Record<string, unknown>,
  signal: AbortSignal
): Promise<Response> {
  const endpoint = `${cfg.apiBase}/chat/completions`;
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log(
      `\n[video-parse] ${endpoint}\n${JSON.stringify(payloadForLog(payload), null, 2)}\n`
    );
  }
  return fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify(payload),
    signal,
  });
}

async function runVideoParseToJson(
  cfg: ReturnType<typeof getLlmServerConfig>,
  arkVideoRef: string,
  _clientDebug: boolean,
  signal: AbortSignal
): Promise<
  | { ok: true; parse: ParseResult; lastPayload: Record<string, unknown> }
  | { ok: false; lastError: string; lastPayload: Record<string, unknown> | null }
> {
  const model = cfg.videoParseModel ?? cfg.model;

  const messageChains: ChatMessage[][] = [
    buildVideoParseMessages(arkVideoRef),
    buildVideoParseMessagesUserOnly(arkVideoRef),
  ];

  let lastError = "";
  let lastPayloadEcho: Record<string, unknown> | null = null;

  const useJsonObject =
    process.env.LLM_VIDEO_PARSE_JSON_OBJECT?.trim() === "true";

  outer: for (const messages of messageChains) {
      const payload: Record<string, unknown> = {
        model,
        messages,
        temperature: 0.38,
        max_tokens: 1024,
      };
      if (useJsonObject) {
        payload.response_format = { type: "json_object" };
      }

      lastPayloadEcho = payload;

      let res: Response;
      try {
        res = await arkChatCompletionsRaw(cfg, payload, signal);
      } catch (e) {
        lastError = e instanceof Error ? e.message : "fetch failed";
        break outer;
      }

      const rawText = await res.text();
      let data: unknown;
      try {
        data = JSON.parse(rawText);
      } catch {
        if (!res.ok) {
          lastError = rawText.slice(0, 1200) || res.statusText;
          if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.error(`[video-parse] Ark HTTP ${res.status}:`, lastError);
          }
          continue;
        }
        lastError = `Invalid JSON response: ${rawText.slice(0, 400)}`;
        continue;
      }

      if (!res.ok) {
        const oErr =
          data &&
          typeof data === "object" &&
          "error" in (data as object) &&
          (data as { error?: { message?: unknown } }).error?.message;
        lastError =
          typeof oErr === "string"
            ? oErr.slice(0, 1200)
            : rawText.slice(0, 1200) || res.statusText;
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.error(`[video-parse] Ark HTTP ${res.status}:`, lastError);
        }
        continue;
      }

      const parsedAssist = parseArkCompletionBody(data);
      if (parsedAssist.kind === "upstream_error") {
        lastError = parsedAssist.message;
        continue;
      }
      if (parsedAssist.kind === "empty") {
        lastError = "Empty assistant content";
        continue;
      }

      const parsedJson = parseVideoParseContent(parsedAssist.text);
      if (!parsedJson) {
        lastError =
          "Model text is not valid parse JSON: " +
          parsedAssist.text.slice(0, 300);
        continue;
      }

      return {
        ok: true,
        parse: parsedJson,
        lastPayload: lastPayloadEcho!,
      };
    }

  return {
    ok: false,
    lastError: lastError || "All attempts failed",
    lastPayload: lastPayloadEcho,
  };
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";

  if (looksLikeMultipart(contentType)) {
    return handleMultipartUpload(req);
  }

  return handleJsonBody(req);
}

async function handleMultipartUpload(req: NextRequest) {
  if (!isLlmConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        code: "LLM_NOT_CONFIGURED",
        message: "Set LLM_API_KEY in .env.local",
      },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { ok: false, code: "BAD_FORM", message: "Invalid multipart body" },
      { status: 400 }
    );
  }

  const file = pickUploadBlob(form);
  const clientDebug = form.get("debug") === "true";

  if (!file) {
    return NextResponse.json(
      {
        ok: false,
        code: "NO_FILE",
        message: "multipart 需要非空文件字段（file / video 或其它字段名）",
      },
      { status: 400 }
    );
  }

  const maxBytes = Math.min(
    100 * 1024 * 1024,
    Math.max(
      1024 * 1024,
      Number(process.env.LLM_VIDEO_UPLOAD_MAX_BYTES) || DEFAULT_UPLOAD_MAX
    )
  );

  if (file.size > maxBytes) {
    return NextResponse.json(
      {
        ok: false,
        code: "FILE_TOO_LARGE",
        message: `视频不超过 ${Math.round(maxBytes / 1024 / 1024)}MB（可调 LLM_VIDEO_UPLOAD_MAX_BYTES）`,
      },
      { status: 400 }
    );
  }

  const mime = videoMimeForUpload(file as Blob & { name?: string });
  if (!mime || !mime.startsWith("video/")) {
    return NextResponse.json(
      {
        ok: false,
        code: "BAD_MIME",
        message:
          "无法识别为视频文件（已排除明确的图片类型）；请使用常见视频格式如 mp4",
      },
      { status: 400 }
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${mime};base64,${buf.toString("base64")}`;

  const cfg = getLlmServerConfig();
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    cfg.videoParseTimeoutMs ?? cfg.timeoutMs
  );

  try {
    const result = await runVideoParseToJson(
      cfg,
      dataUrl,
      clientDebug,
      controller.signal
    );
    if (!result.ok) {
      const errBody: Record<string, unknown> = {
        ok: false,
        code: "VIDEO_PARSE_FAILED",
        message: result.lastError,
      };
      if (clientDebug && result.lastPayload) {
        errBody.debug = { requestBody: payloadForLog(result.lastPayload) };
      }
      return NextResponse.json(errBody, { status: 502 });
    }

    const responsePayload: Record<string, unknown> = {
      ok: true,
      parse: result.parse,
      source: "upload",
    };
    if (clientDebug && result.lastPayload) {
      responsePayload.debug = { requestBody: payloadForLog(result.lastPayload) };
    }
    return NextResponse.json(responsePayload);
  } finally {
    clearTimeout(timer);
  }
}

async function handleJsonBody(req: NextRequest) {
  let body: JsonBody;
  try {
    body = (await req.json()) as JsonBody;
  } catch {
    return NextResponse.json(
      { ok: false, code: "BAD_JSON", message: "Invalid JSON" },
      { status: 400 }
    );
  }

  const raw = typeof body.url === "string" ? body.url.trim() : "";
  const clientDebug = body.debug === true;

  if (!isAllowedHttpVideoUrl(raw)) {
    return NextResponse.json(
      {
        ok: false,
        code: "BAD_URL",
        message: "Requires http(s) URL, 10–2048 chars（本地上传请用 multipart）",
      },
      { status: 400 }
    );
  }

  if (!isLlmConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        code: "LLM_NOT_CONFIGURED",
        message: "Set LLM_API_KEY in .env.local",
      },
      { status: 503 }
    );
  }

  const url = normalizeVideoUrlForRequest(raw);

  if (process.env.LLM_VIDEO_PARSE_SKIP_MIME_PROBE?.trim() !== "true") {
    const probe = await probeVideoUrlLooksLikeHtmlPage(url);
    if (!probe.ok) {
      return NextResponse.json(
        {
          ok: false,
          code: "VIDEO_URL_HTML_NOT_STREAM",
          message: probe.message,
        },
        { status: 400 }
      );
    }
  }

  const cfg = getLlmServerConfig();
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    cfg.videoParseTimeoutMs ?? cfg.timeoutMs
  );

  try {
    const result = await runVideoParseToJson(
      cfg,
      url,
      clientDebug,
      controller.signal
    );
    if (!result.ok) {
      const errBody: Record<string, unknown> = {
        ok: false,
        code: "VIDEO_PARSE_FAILED",
        message: result.lastError,
      };
      if (clientDebug && result.lastPayload) {
        errBody.debug = { lastRequestBody: result.lastPayload };
      }
      return NextResponse.json(errBody, { status: 502 });
    }

    const responsePayload: Record<string, unknown> = {
      ok: true,
      parse: result.parse,
      source: "url",
    };
    if (clientDebug && result.lastPayload) {
      responsePayload.debug = { requestBody: result.lastPayload };
    }
    return NextResponse.json(responsePayload);
  } finally {
    clearTimeout(timer);
  }
}
