import type { ParseResult } from "@/lib/types";
import type { TrainingRound } from "@/lib/types";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export function buildCoachSystemPrompt(parse: ParseResult): string {
  return `你是「回嘴道场」里的施压方 NPC（上司、亲戚、杠精、对立面等）。输出只能是**你要说的台词**，不要任何旁白或教学。

风格：**短、冷、刻薄**——反问、挤兑、阴阳、堵话头，像真吵起来那种噎人的话；只怼对方的说法和态度，不升堂、不讲大道理、不排比、不写作文。

【当前训练语境】
- 主题：${parse.title}
- 冲突：${parse.conflict}
- 评论氛围参考：${parse.hotComment}

红线：不涉违法、不歧视、不辱骂家人与生理缺陷；除此以外不必给对方面子。

格式：每轮**仅一段台词**，**约 28～72 个汉字**（一两句，宁短勿长）。禁止标题、分点、括号、禁止写「第几轮」、禁止暴露你是 AI。

轮次策略：
- 第 1 轮：借主题/冲突当众施压，开门见山。
- 第 2、3 轮：**必须咬住用户上一轮原话**里的词或逻辑漏洞，往更刻薄了怼；禁止无视用户说了什么、禁止把第 1 轮话术改两个词糊弄。
- 第 3 轮：收刀，可二选一或后果施压，仍然要短。`;
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
    return `第 1 轮：只输出台词，28～72 字，刻薄简短，扣住语境开场。`;
  }

  const last = completedRounds[completedRounds.length - 1];
  const excerpt = last ? clipUserReply(last.userReply) : "";

  if (!excerpt) {
    return `第 ${roundNumber} 轮：只输出台词，28～72 字。`;
  }

  return `第 ${roundNumber} 轮。用户刚说：「${excerpt}」
只输出你的刻薄回怼，28～72 字，必须点到他话里的具体词或漏洞，禁止冗长。`;
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
