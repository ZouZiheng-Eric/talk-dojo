import type { ParseResult } from "@/lib/types";
import type { TrainingRound } from "@/lib/types";

/** 豆包等 OpenAI 兼容网关：多模态 user 消息 */
export type ChatContentPart =
  | { type: "text"; text: string }
  | { type: "video_url"; video_url: { url: string } };

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string | ChatContentPart[];
};

export function buildCoachSystemPrompt(parse: ParseResult): string {
  return `你是「回怼道场」里的施压方 NPC（上司、亲戚、杠精、对立面等）。输出只能是**你要说的台词**，不要任何旁白或教学。

风格：**有压迫感，但不要拉满难度**——像真实场景里会呛你的那种话：反问、挤兑、阴阳、堵话头都可以，但**每层只出一个刺点**，别连环叠三层刻薄、别把对方逼到没法接话；给用户**一点接话的空隙**。只对事不对人升级到「羞辱」的程度要收敛。

【当前训练语境】
- 主题：${parse.title}
- 冲突：${parse.conflict}
- 关键词：${parse.contextKeywords}
${
  parse.strategies.length > 0
    ? `- 视频侧策略要点（可作施压背景，不必逐条复读）：${parse.strategies.join("；")}`
    : "- 视频侧策略要点：（解析未归纳出条目，按冲突与关键词发挥）"
}

红线：不涉违法、不歧视、不辱骂家人与生理缺陷；除此以外不必给对方面子。

格式：每轮**仅一段台词**，**约 24～64 个汉字**（一两句，宁短勿长）。禁止标题、分点、括号、禁止写「第几轮」、禁止暴露你是 AI。

轮次策略（**难度递进温和**）：
- 第 1 轮：借主题/冲突施压，开门见山，力度**中等偏上**即可，别一上来就终局杀招。
- 第 2 轮：**必须回应用户上一轮原话**里的点或气口，可指出漏洞或带刺回击，**力度比第 1 轮略强但不要质的飞跃**；禁止无视用户说了什么、禁止把第 1 轮话术改两个词糊弄。
- 第 3 轮：略收一点也无妨：可后果施压或二选一，仍要短，**别把玩家怼到只能躺平**——要让人还觉得「再试一句能翻盘」。`;
}

const MAX_USER_EXCERPT = 240;

function clipUserReply(text: string): string {
  const t = text.trim();
  if (t.length <= MAX_USER_EXCERPT) return t;
  return `${t.slice(0, MAX_USER_EXCERPT)}…`;
}

/** 最后一则 user：引导模型只输出本轮台词，并在后续轮次锚定用户原话 */
function buildFinalUserInstruction(
  roundNumber: number,
  completedRounds: TrainingRound[]
): string {
  if (roundNumber === 1) {
    return `第 1 轮：只输出台词，24～64 字，带压迫感但别封顶，扣住语境开场。`;
  }

  const last = completedRounds[completedRounds.length - 1];
  const excerpt = last ? clipUserReply(last.userReply) : "";

  if (!excerpt) {
    return `第 ${roundNumber} 轮：只输出台词，24～64 字。`;
  }

  return `第 ${roundNumber} 轮。用户刚说：「${excerpt}」
只输出你的施压回一句，24～64 字，点到他话里的具体词或漏洞即可，适度即可，禁止冗长连环怼。`;
}

/**
 * @param roundNumber 1-based 当前要生成的轮次
 */
export function buildCoachMessages(
  parse: ParseResult,
  completedRounds: TrainingRound[],
  roundNumber: number
): ChatMessage[] {
  const system = buildCoachSystemPrompt(parse);
  const messages: ChatMessage[] = [{ role: "system", content: system }];

  for (const r of completedRounds) {
    messages.push({ role: "assistant", content: r.aiMessage });
    messages.push({ role: "user", content: r.userReply });
  }

  messages.push({
    role: "user",
    content: buildFinalUserInstruction(roundNumber, completedRounds),
  });

  return messages;
}
