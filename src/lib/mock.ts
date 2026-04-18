import type { ParseResult } from "./types";

export function mockParse(_videoUrl: string): ParseResult {
  return {
    title: "中国人海外职场被歧视",
    conflict: "老板公开否定你",
    hotComment: "太真实了",
  };
}

export const PRESSURE_MESSAGES = [
  "会议室里大家都在，他直接说你这方案就是不行，根本没想清楚。你怎么接？",
  "他又补一句：别总拿文化差异当借口，这里要的是结果。你怎么办？",
  "最后他冷笑：你要是受不了压力，可以走人。最后一句话，你怎么说？",
] as const;
