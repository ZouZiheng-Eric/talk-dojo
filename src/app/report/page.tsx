"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { RadarBoard } from "@/components/RadarBoard";
import type { BattleReport, FavoriteItem } from "@/lib/types";
import { SESSION_REPORT_KEY } from "@/lib/constants";
import { saveFavorite } from "@/lib/storage";
import { glassPanel } from "@/lib/ui";

export default function ReportPage() {
  const router = useRouter();
  const [report, setReport] = useState<BattleReport | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_REPORT_KEY);
    if (!raw) {
      router.replace("/");
      return;
    }
    try {
      setReport(JSON.parse(raw) as BattleReport);
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
  };

  if (!report) {
    return (
      <div className="py-24 text-center text-sm text-dojo-muted">载入战报…</div>
    );
  }

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
        <p className="relative text-xs text-dojo-muted">综合评分</p>
        <p className="relative font-display text-5xl font-bold tabular-nums text-dojo-gold">
          {report.overall}
        </p>
        <p className="relative mt-1 text-xs text-dojo-muted">满分 100</p>
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
        <ul className="mt-3 space-y-3">
          {report.quotes.map((q, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.06 }}
              className="border-l-2 border-dojo-accent/50 pl-3 text-sm leading-relaxed text-dojo-text/90"
            >
              「{q}」
            </motion.li>
          ))}
        </ul>
      </motion.div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <motion.button
          type="button"
          onClick={favorite}
          disabled={saved}
          className="flex-1 rounded-xl border border-dojo-accent/40 bg-dojo-mist/50 py-3.5 text-sm font-medium text-dojo-gold transition-colors disabled:opacity-60"
          whileTap={{ scale: 0.98 }}
        >
          {saved ? "已收藏" : "收藏"}
        </motion.button>
        <Link
          href="/"
          className="flex flex-1 items-center justify-center rounded-xl border border-dojo-line py-3.5 text-center text-sm text-dojo-muted transition-colors hover:border-dojo-accent/40 hover:text-dojo-text"
        >
          再来一局
        </Link>
      </div>

      <Link
        href="/favorites"
        className="block text-center text-xs text-dojo-cyan underline-offset-4 hover:underline"
      >
        我的收藏
      </Link>
    </div>
  );
}
