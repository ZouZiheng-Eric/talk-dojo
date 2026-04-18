export type ParseResult = {
  title: string;
  conflict: string;
  hotComment: string;
};

export type TrainingRound = {
  round: number;
  aiMessage: string;
  userReply: string;
};

/** 五维 0～100，与雷达图、/api/score JSON 字段一致 */
export type ReportScores = {
  /** 边界意识：拒不合理要求；轻易「对不起/我尽量」则低分 */
  boundary: number;
  /** 反弹力度：被动挨怼 vs 把压力/问题抛回对方 */
  pushback: number;
  /** 逻辑闭环：抓漏洞、有理有据 */
  logic: number;
  /** 阴阳段位：魔法对魔法、讽刺是否到位 */
  sarcasm: number;
  /** 情绪内核：破防大骂低分；稳、降维打击高分 */
  zen: number;
};

/** AI 对单轮用户原话的「金句分」，用于选出最高分的一句（正文仍为用户原话） */
export type LineScoreRow = {
  round: number;
  lineScore: number;
};

/** AI 从多轮回复中选出的本场金句（文本一字不改来自用户） */
export type GoldenQuotePick = {
  round: number;
  lineScore: number;
  text: string;
};

export type BattleReport = {
  overall: number;
  scores: ReportScores;
  /**
   * 兼容收藏等：有 `goldenQuote` 时通常为该句一条；无 AI 精选时为多段原话摘录。
   */
  quotes: string[];
  /** AI 为每轮用户原话打的金句分 */
  lineScores?: LineScoreRow[];
  /** AI 按金句分选中的唯一一句（正文为用户原话） */
  goldenQuote?: GoldenQuotePick;
  /** AI 评分接口返回的锐评文案，与 quotes 分离 */
  coachNotes?: string[];
  rounds: TrainingRound[];
  parse: ParseResult;
  videoUrl: string;
};

export type FavoriteItem = BattleReport & {
  id: string;
  savedAt: string;
};
