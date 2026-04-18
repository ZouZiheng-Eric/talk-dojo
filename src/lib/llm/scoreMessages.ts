import type { ParseResult, TrainingRound } from "@/lib/types";
import type { ChatMessage } from "@/lib/llm/messages";
import { SCORE_HIGH_TIER_REFERENCE } from "@/lib/llm/scoreReferenceTemplate";

export function buildScoreMessages(
  parse: ParseResult,
  rounds: TrainingRound[]
): ChatMessage[] {
  const lines = rounds
    .map(
      (r) => `第${r.round}轮\n教练：${r.aiMessage}\n用户：${r.userReply}`
    )
    .join("\n\n");

  const system = `你是「回嘴道场」对练结算 AI：输出①五维能力分 ②极短锐评 ③每轮用户原话的金句分 ④**改进建议**。①②③ 语气可冷静、毒舌；④ 必须建设性、可下次对练时用。禁止「总体来说」「还可以」等空话套话。

**体验**：用户是来练嘴的，五维与 overall 在合理范围内**略偏宽容**（不必严苛扣分）；明显敷衍/破防仍要低分，但有努力、有句像样的回击时**别让分数太难看**。

五维 scores：均为 0-100 的整数（可理解为把 S/A/B/C 档拉成百分制），字段名必须与下述 JSON 示例完全一致，综合用户三轮整体表现评定：

- boundary 边界意识：是否坚决拒绝不合理要求？是否轻易妥协、满口「对不起」「我尽量」「算了算了」？越软越低分。
- pushback 反弹力度：是被动挨怼、只会解释，还是把压力或问题有效抛回给对方、反将一军？抛回越强分越高。
- logic 逻辑闭环：有没有揪住对方话里的漏洞？反驳是否有理有据、自成一说？
- sarcasm 阴阳段位：有没有「用魔法打败魔法」？讽刺、反讽是否到位、是否好笑又扎心？纯直球辱骂不算高分阴阳。
- zen 情绪内核：破防大骂、上头失态 → 低分；表面平静、节奏稳、甚至降维打击 → 高分。

lineScores：对**每一轮「用户」原话**单独打金句分 lineScore（0-100 整数）。round 从 1 开始与轮次一致。只看该句：回击利不利索、值不值得截图、有没有记忆点；**不要**参考教练台词。一两字敷衍（单独「是」「嗯」「好」「算了」等）**金句分不得超过 35**。有几轮就必须有几个对象。用户消息里会带 **【高分参考模版】**：若某轮用户回复在**结构、力度、节奏**上与该模版相近，该轮 **lineScore 与相关五维应明显偏高**；模版不是逐句照抄标准，仅作锚点。

coachNotes：2～3 条**锐评**字符串，像弹幕/评论区毒舌大佬，每条 ≤36 个汉字；必须点名具体哪一轮或哪种毛病，禁止正确的废话。

suggestions：2～4 条**改进建议**（放在 coachNotes 之后、与锐评区分：要具体、可执行，例如「下轮流…」「第 X 轮可…」），每条 ≤48 个汉字；禁止与 coachNotes 逐条重复同一句。**建议中禁止**：脏话、人身攻击、羞辱、歧视或地域/身份攻击、煽动暴力或违法；用语保持尊重，只谈话术与节奏改进。

overall：综合分 0-100，可与五维均值接近，允许按明显短板微调。

只输出**一个**合法 JSON 对象，首字符必须是 {，禁止 markdown、禁止代码围栏、禁止任何 JSON 外文字。字段名与下例完全一致：
{"scores":{"boundary":80,"pushback":65,"logic":72,"sarcasm":58,"zen":70},"overall":69,"coachNotes":["锐评1","锐评2"],"suggestions":["建议1","建议2"],"lineScores":[{"round":1,"lineScore":55},{"round":2,"lineScore":82},{"round":3,"lineScore":70}]}`;

  const refBlock =
    SCORE_HIGH_TIER_REFERENCE.trim().length > 0
      ? `【高分参考模版】（给分锚点；用户哪轮接近这种风格，该轮 lineScore 与相关维度可给高）
${SCORE_HIGH_TIER_REFERENCE}

`
      : "";

  const user = `【语境】
主题：${parse.title}
冲突：${parse.conflict}
关键词：${parse.contextKeywords}

${refBlock}【完整三轮对话】
${lines}

严格按 system 要求只输出 JSON。`;

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}
