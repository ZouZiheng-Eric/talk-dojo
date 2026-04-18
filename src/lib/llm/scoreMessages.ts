import type { ParseResult, TrainingRound } from "@/lib/types";
import type { ChatMessage } from "@/lib/llm/messages";

export function buildScoreMessages(
  parse: ParseResult,
  rounds: TrainingRound[]
): ChatMessage[] {
  const lines = rounds
    .map(
      (r) => `第${r.round}轮\n教练：${r.aiMessage}\n用户：${r.userReply}`
    )
    .join("\n\n");

  const system = `你是「回嘴道场」对练结算 AI：只做三件事——①五维能力分 ②极短锐评 ③每轮用户原话的金句分。语气冷静、毒舌、不客套，禁止「总体来说」「还可以」等废话。

五维 scores：均为 0-100 的整数（可理解为把 S/A/B/C 档拉成百分制），字段名必须与下述 JSON 示例完全一致，综合用户三轮整体表现评定：

- boundary 边界意识：是否坚决拒绝不合理要求？是否轻易妥协、满口「对不起」「我尽量」「算了算了」？越软越低分。
- pushback 反弹力度：是被动挨怼、只会解释，还是把压力或问题有效抛回给对方、反将一军？抛回越强分越高。
- logic 逻辑闭环：有没有揪住对方话里的漏洞？反驳是否有理有据、自成一说？
- sarcasm 阴阳段位：有没有「用魔法打败魔法」？讽刺、反讽是否到位、是否好笑又扎心？纯直球辱骂不算高分阴阳。
- zen 情绪内核：破防大骂、上头失态 → 低分；表面平静、节奏稳、甚至降维打击 → 高分。

lineScores：对**每一轮「用户」原话**单独打金句分 lineScore（0-100 整数）。round 从 1 开始与轮次一致。只看该句：回击利不利索、值不值得截图、有没有记忆点；**不要**参考教练台词。一两字敷衍（单独「是」「嗯」「好」「算了」等）**金句分不得超过 35**。有几轮就必须有几个对象。

coachNotes：2～3 条**锐评**字符串，像弹幕/评论区毒舌大佬，每条 ≤36 个汉字；必须点名具体哪一轮或哪种毛病，禁止正确的废话。

overall：综合分 0-100，可与五维均值接近，允许按明显短板微调。

只输出**一个**合法 JSON 对象，首字符必须是 {，禁止 markdown、禁止代码围栏、禁止任何 JSON 外文字。字段名与下例完全一致：
{"scores":{"boundary":80,"pushback":65,"logic":72,"sarcasm":58,"zen":70},"overall":69,"coachNotes":["锐评1","锐评2"],"lineScores":[{"round":1,"lineScore":55},{"round":2,"lineScore":82},{"round":3,"lineScore":70}]}`;

  const user = `【语境】
主题：${parse.title}
冲突：${parse.conflict}
评论氛围：${parse.hotComment}

【完整三轮对话】
${lines}

严格按 system 要求只输出 JSON。`;

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}
