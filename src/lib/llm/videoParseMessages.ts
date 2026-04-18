import type { ChatContentPart, ChatMessage } from "@/lib/llm/messages";

/**
 * 用户粘贴的链接可能是短链或缺省协议，豆包 video_url 需要网关可访问的 http(s) 地址。
 */
export function normalizeVideoUrlForRequest(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t.replace(/^\/+/, "")}`;
}

const VIDEO_PARSE_SYSTEM = `你是「回嘴道场」App 的**视频语境编译器**，只服务于后续「高压对话训练」。

【应用背景】
用户会刷到一条短视频，想在 App 里练习怎么回嘴、扛压、把话怼回去。你的输出会被填进「语境画像」：教练 NPC 会按这里的主题、冲突和**关键词**（JSON 字段 \`contextKeywords\`）来施压、贴标签。

【你的输入】
消息里会带 **video_url**，请结合画面、人物互动与语音/字幕完成判断。

【输出（唯一）】
只输出**一个**合法 JSON 对象，三个字符串字段，禁止 markdown、禁止代码围栏、禁止 JSON 外的任何字符。字段含义：
1. **title**（12～36 字）：像短视频爆款标题，点出**话题 + 张力**。
2. **conflict**（40～160 字）：训练用的**对峙场面**——谁在场、什么场合、争什么；要具体。
3. **contextKeywords**（20～56 字）：从视频氛围里提炼的**关键词**——可用 3～8 个短语（顿号或逗号分隔），或一句短词组；要能概括评论/弹幕里的对立情绪、标签与梗，便于教练台词对准这些词施压（不必照搬某一条真实评论）。**必须非空字符串。**

【红线】
成年人对话练习：不违法教唆、不仇恨、不对群体做仇恨概括。`;

/**
 * 标准：system 文本 + user 多模态数组（与常见 OpenAI 兼容网关一致）
 */
export function buildVideoParseMessages(videoUrlNormalized: string): ChatMessage[] {
  const userParts: ChatContentPart[] = [
    {
      type: "text",
      text: `请观看并理解**紧随其后的视频输入**，再按 system 要求**只输出那一个 JSON 对象**（含 title、conflict、contextKeywords 三字段）。

内化时请关注：谁在施压、是否阴阳；**务必填好 contextKeywords**（关键词），要像真实网友会用的标签与情绪。`,
    },
    {
      type: "video_url",
      video_url: { url: videoUrlNormalized },
    },
  ];

  return [
    { role: "system", content: VIDEO_PARSE_SYSTEM },
    { role: "user", content: userParts },
  ];
}

/**
 * 与方舟示例一致：仅一条 user，content 为 [text, video_url]（部分接入点只对这种格式返回内容）
 */
export function buildVideoParseMessagesUserOnly(
  videoUrlNormalized: string
): ChatMessage[] {
  const userParts: ChatContentPart[] = [
    {
      type: "text",
      text: `${VIDEO_PARSE_SYSTEM}

请观看并理解紧随其后的视频，**只输出一个 JSON 对象**（title、conflict、contextKeywords）。不要任何前缀或分析段落。`,
    },
    {
      type: "video_url",
      video_url: { url: videoUrlNormalized },
    },
  ];

  return [{ role: "user", content: userParts }];
}
