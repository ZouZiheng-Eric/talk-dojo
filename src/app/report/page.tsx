"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { RadarBoard } from "@/components/RadarBoard";
import { useToast } from "@/components/ToastProvider";
import type { BattleReport, FavoriteItem } from "@/lib/types";
import { SESSION_REPORT_KEY } from "@/lib/constants";
import { saveFavorite } from "@/lib/storage";
import { glassPanel, linkPressable } from "@/lib/ui";
import {
  clipUserQuoteForList,
  normalizeBattleReport,
  sortedTrainingRounds,
} from "@/lib/reportSnippets";
import {
  overallToPerformanceTier,
  performanceTierTone,
} from "@/lib/performanceTier";

export default function ReportPage() {
  const router = useRouter();
  const showToast = useToast();
  const [report, setReport] = useState<BattleReport | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_REPORT_KEY);
    if (!raw) {
      router.replace("/");
      return;
    }
    try {
      setReport(normalizeBattleReport(JSON.parse(raw) as BattleReport));
    } catch {
      router.replace("/");
    }
  }, [router]);

  const favorite = () => {
    if (!report || saved) return;
    const item: FavoriteItem = {
      ...report,
      id: `td-${Date.now()}`,
      savedAt: new Date().toISOString(),
    };
    saveFavorite(item);
    setSaved(true);
    showToast("已收藏到本地");
  };

  if (!report) {
    return (
      <div className="py-24 text-center text-sm text-dojo-muted">载入战报…</div>
    );
  }

  const overallTier = overallToPerformanceTier(report.overall);
  const overallTierClass = performanceTierTone(overallTier);

  return (
    <div className="space-y-6 pb-8 pt-2">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-dojo-accent">
          训练战报
        </p>
        <h2 className="mt-1 font-display text-2xl text-dojo-gold">本场结算</h2>
      </motion.div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 22 }}
        className={`${glassPanel} relative overflow-hidden p-6 text-center`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-dojo-accent/5 to-transparent" />
        <p className="relative text-xs text-dojo-muted">综合评级</p>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 24, delay: 0.05 }}
          className={`relative mt-2 font-display text-4xl font-bold tracking-wide sm:text-5xl ${overallTierClass}`}
        >
          {overallTier}
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <p className="mb-2 text-center text-xs text-dojo-muted">五维雷达</p>
        <RadarBoard scores={report.scores} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className={`${glassPanel} p-5`}
      >
        <h3 className="font-display text-sm text-dojo-gold">金句摘录</h3>
        {report.goldenQuote ? (
          <>
            {report.lineScores && report.lineScores.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
                {sortedTrainingRounds(report.rounds).map((r) => {
                  const row = report.lineScores!.find((x) => x.round === r.round);
                  if (!row) return null;
                  const lineTier = overallToPerformanceTier(row.lineScore);
                  const lineTierClass = performanceTierTone(lineTier);
                  return (
                    <span
                      key={r.round}
                      className={`rounded-full border px-2 py-0.5 ${
                        r.round === report.goldenQuote!.round
                          ? "border-dojo-accent/60 bg-dojo-accent/10"
                          : "border-dojo-line/50"
                      } ${lineTierClass}`}
                    >
                      第 {r.round} 轮 · {lineTier}
                    </span>
                  );
                })}
              </div>
            ) : null}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              className={`rounded-xl border border-dojo-accent/35 bg-dojo-mist/30 px-4 py-3 ${
                report.lineScores && report.lineScores.length > 0
                  ? "mt-4"
                  : "mt-3"
              }`}
            >
              <p
                className={`text-[10px] font-medium ${performanceTierTone(
                  overallToPerformanceTier(report.goldenQuote.lineScore)
                )}`}
              >
                第 {report.goldenQuote.round} 轮 ·{" "}
                {overallToPerformanceTier(report.goldenQuote.lineScore)}
              </p>
              <p className="mt-2 break-words text-sm leading-relaxed text-dojo-text/95">
                「{report.goldenQuote.text}」
              </p>
            </motion.div>
          </>
        ) : (
          <>
            {report.lineScores && report.lineScores.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                {sortedTrainingRounds(report.rounds).map((r) => {
                  const row = report.lineScores!.find((x) => x.round === r.round);
                  if (!row) return null;
                  const lt = overallToPerformanceTier(row.lineScore);
                  return (
                    <span
                      key={r.round}
                      className={`rounded-full border border-dojo-line/50 px-2 py-0.5 ${performanceTierTone(lt)}`}
                    >
                      第 {r.round} 轮 · {lt}
                    </span>
                  );
                })}
              </div>
            ) : null}
            <ul className="mt-3 space-y-4">
              {sortedTrainingRounds(report.rounds).map((r, i) => {
                const raw = r.userReply.trim();
                const shown = raw ? clipUserQuoteForList(raw, 200) : "";
                return (
                  <motion.li
                    key={r.round}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.06 }}
                    className="border-l-2 border-dojo-accent/50 pl-3 text-sm leading-relaxed text-dojo-text/90"
                  >
                    <span className="mb-1 block text-[10px] font-medium text-dojo-coral">
                      第 {r.round} 轮 · 你的回复
                    </span>
                    {raw ? (
                      <span className="break-words">「{shown}」</span>
                    ) : (
                      <span className="text-dojo-muted">（本轮无文字）</span>
                    )}
                  </motion.li>
                );
              })}
            </ul>
            {sortedTrainingRounds(report.rounds).every(
              (r) => !r.userReply.trim()
            ) ? (
              <p className="mt-3 text-xs text-dojo-muted">
                本场没有可摘录的回复。
              </p>
            ) : null}
          </>
        )}
      </motion.div>

      {report.coachNotes && report.coachNotes.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className={`${glassPanel} p-5`}
        >
          <h3 className="font-display text-sm text-dojo-cyan">AI 锐评</h3>
          <ul className="mt-3 space-y-3">
            {report.coachNotes.map((line, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.28 + i * 0.05 }}
                className="border-l-2 border-dojo-cyan/40 pl-3 text-sm leading-relaxed text-dojo-text/85"
              >
                {line}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      ) : null}

      {report.suggestions && report.suggestions.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26 }}
          className={`${glassPanel} p-5`}
        >
          <h3 className="font-display text-sm text-dojo-accent">改进建议</h3>
          <ul className="mt-3 space-y-3">
            {report.suggestions.map((line, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.32 + i * 0.05 }}
                className="border-l-2 border-dojo-accent/45 pl-3 text-sm leading-relaxed text-dojo-text/90"
              >
                {line}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <motion.button
          type="button"
          onClick={favorite}
          disabled={saved}
          className="flex-1 rounded-xl border border-dojo-line bg-dojo-void py-3.5 text-sm font-medium text-dojo-text transition-colors hover:border-dojo-accent/50 disabled:opacity-60"
          whileTap={{ scale: 0.94 }}
          whileHover={{ scale: saved ? 1 : 1.02 }}
          transition={{ type: "spring", stiffness: 480, damping: 26 }}
        >
          {saved ? "已收藏" : "收藏"}
        </motion.button>
        <Link
          href="/"
          className={`${linkPressable} flex flex-1 items-center justify-center rounded-xl border border-dojo-line py-3.5 text-center text-sm text-dojo-muted transition-colors hover:border-dojo-accent/40 hover:text-dojo-text`}
        >
          再来一局
        </Link>
      </div>

      <Link
        href="/favorites"
        className={`${linkPressable} block text-center text-xs text-dojo-cyan underline-offset-4 hover:underline`}
      >
        我的收藏
      </Link>
    </div>
  );
}
