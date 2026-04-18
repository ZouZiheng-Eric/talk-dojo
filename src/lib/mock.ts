import type { ParseResult } from "./types";

export function mockParse(_videoUrl: string): ParseResult {
  return {
    title: "中国人海外职场被歧视",
    conflict: "老板公开否定你",
    contextKeywords: "太真实了",
  };
}

const SCENE_PARSE_MAP: Record<string, ParseResult> = {
  boss: {
    title: "老板/导师高压质疑",
    conflict: "对方当众否定你的方案并要求立刻给结果",
    contextKeywords: "你到底能不能扛事？别解释，给结论。",
  },
  roommate: {
    title: "同学/室友边界冲突",
    conflict: "对方长期越界占用你的时间和空间",
    contextKeywords: "大家都这么相处，你怎么这么计较？",
  },
  relative: {
    title: "烦人亲戚持续施压",
    conflict: "对方反复拿你的选择和别人比较并进行道德绑架",
    contextKeywords: "都是为你好，你别不识好歹。",
  },
  racist: {
    title: "海外 racist 挑衅",
    conflict: "对方带偏见发言并试图用身份压制你",
    contextKeywords: "你们这种人就该闭嘴听着。",
  },
};

export function mockParseFromScene(scene: string, opponentHint?: string): ParseResult {
  const base = SCENE_PARSE_MAP[scene] ?? SCENE_PARSE_MAP.boss;
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
