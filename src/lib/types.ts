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

export type ReportScores = {
  composure: number;
  logic: number;
  boundary: number;
  empathy: number;
  punch: number;
};

export type BattleReport = {
  overall: number;
  scores: ReportScores;
  quotes: string[];
  rounds: TrainingRound[];
  parse: ParseResult;
  videoUrl: string;
};

export type FavoriteItem = BattleReport & {
  id: string;
  savedAt: string;
};
