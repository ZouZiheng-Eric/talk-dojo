/**
 * 方舟 video_url 要求可拉取到 **视频流**（常见 video/*），分享页返回 HTML 会报 mimetype text/html 不支持。
 */
const PROBE_MS = 8_000;

export type VideoUrlProbeResult =
  | { ok: true }
  | { ok: false; message: string };

export async function probeVideoUrlLooksLikeHtmlPage(
  videoUrl: string
): Promise<VideoUrlProbeResult> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), PROBE_MS);
    const res = await fetch(videoUrl, {
      method: "HEAD",
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        Accept: "*/*",
      },
    });
    clearTimeout(timer);

    const ct = (res.headers.get("content-type") || "").toLowerCase();
    if (ct.includes("text/html")) {
      return {
        ok: false,
        message:
          "该链接指向网页(HTML)而非视频文件。抖音/快手/B站分享链多为落地页，方舟无法当视频解析。请使用可直接访问的直链(如 .mp4)，或经你方服务端解析出真实媒体 URL 再传入。",
      };
    }
    return { ok: true };
  } catch {
    return { ok: true };
  }
}
