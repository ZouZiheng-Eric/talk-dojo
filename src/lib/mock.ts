import type { ParseResult } from "./types";

export function mockParse(_videoUrl: string): ParseResult {
  return {
    title: "中国人海外职场被歧视",
    conflict: "老板公开否定你",
    contextKeywords: "太真实了",
    strategies: ["先问对方标准再回应", "把个人体验说成团队数据再问依据"],
  };
}

const SCENE_PARSE_MAP: Record<string, ParseResult> = {
  boss: {
    title: "老板/导师高压质疑",
    conflict: "对方当众否定你的方案并要求立刻给结果",
    contextKeywords: "你到底能不能扛事？别解释，给结论。",
    strategies: ["要结论时先复述对方质疑点再答", "用时间节点代替空头承诺"],
  },
  colleague: {
    title: "同学/同事职场边界冲突",
    conflict: "同事（或搭子）长期越界：甩锅、占用功劳或占用你时间",
    contextKeywords: "大家一个组的，你这么计较干嘛？",
    strategies: ["把球踢回：谁定规则谁执行", "用具体事实代替情绪控诉"],
  },
  relative: {
    title: "烦人亲戚持续施压",
    conflict: "对方反复拿你的选择和别人比较并进行道德绑架",
    contextKeywords: "都是为你好，你别不识好歹。",
    strategies: ["承认关心再划边界", "反问对方若换位能否接受"],
  },
  racist: {
    title: "海外 racist 挑衅",
    conflict: "对方带偏见发言并试图用身份压制你",
    contextKeywords: "你们这种人就该闭嘴听着。",
    strategies: ["把人身攻击拉回到具体事实与场合", "冷静反问对方依据"],
  },
};

export function mockParseFromScene(scene: string, opponentHint?: string): ParseResult {
  const key = scene === "roommate" ? "colleague" : scene;
  const base = SCENE_PARSE_MAP[key] ?? SCENE_PARSE_MAP.boss;
  const hint = opponentHint?.trim();
  if (!hint) return base;
  return {
    ...base,
    contextKeywords: `${base.contextKeywords}（对方特征：${hint}）`,
  };
}

export const PRESSURE_MESSAGES = [
  "会议室里大家都在，他皱眉说：你这方案差点意思，理由呢？你怎么接？",
  "他又补一句：这里只看结果，别铺垫太久——你怎么办？",
  "最后他语气变硬：行不行给个痛快话，别磨。你最后一句话怎么说？",
] as const;
