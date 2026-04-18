"use client";

import { useMemo, useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { mockParse, PRESSURE_MESSAGES } from "@/lib/mock";
import { SESSION_REPORT_KEY } from "@/lib/constants";
import { buildReport } from "@/lib/report";
import type { TrainingRound } from "@/lib/types";
import { inputField } from "@/lib/ui";

function TrainInner() {
  const router = useRouter();
  const search = useSearchParams();
  const url = useMemo(() => {
    const u = search.get("url");
    return u ? decodeURIComponent(u) : "";
  }, [search]);

  const parse = useMemo(() => mockParse(url), [url]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [rounds, setRounds] = useState<TrainingRound[]>([]);
  const [draft, setDraft] = useState("");

  const currentAi =
    roundIndex < 3 ? PRESSURE_MESSAGES[roundIndex] : "";
  const isDone = roundIndex >= 3;

  useEffect(() => {
    if (isDone) {
      const report = buildReport(url || "", parse, rounds);
      sessionStorage.setItem(SESSION_REPORT_KEY, JSON.stringify(report));
      const t = setTimeout(() => router.replace("/report"), 400);
      return () => clearTimeout(t);
    }
  }, [isDone, parse, rounds, router, url]);

  const submitRound = () => {
    const text = draft.trim();
    if (!text || roundIndex >= 3) return;
    const next: TrainingRound = {
      round: roundIndex + 1,
      aiMessage: PRESSURE_MESSAGES[roundIndex],
      userReply: text,
    };
    setRounds((r) => [...r, next]);
    setDraft("");
    setRoundIndex((i) => i + 1);
  };

  return (
    <div className="flex min-h-[calc(100dvh-120px)] flex-col pt-2">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-4 rounded-xl border border-dojo-accent/20 bg-dojo-mist/40 px-3 py-2"
      >
        <p className="text-[10px] text-dojo-muted">语境</p>
        <p className="font-display text-sm text-dojo-gold">{parse.title}</p>
      </motion.div>

      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        <AnimatePresence mode="popLayout">
          {rounds.map((r) => (
            <motion.div
              key={r.round}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <div className="flex justify-start">
                <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-dojo-line/60 bg-dojo-ink/90 px-4 py-3 text-sm text-dojo-text/95 shadow-lg">
                  <span className="mb-1 block text-[10px] text-dojo-coral">
                    第 {r.round} 轮
                  </span>
                  {r.aiMessage}
                </div>
              </div>
              <div className="flex justify-end">
                <div className="max-w-[90%] rounded-2xl rounded-br-md border border-dojo-accent/30 bg-dojo-accent/15 px-4 py-3 text-sm text-dojo-text">
                  {r.userReply}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {roundIndex < 3 && (
          <motion.div
            key={`ai-${roundIndex}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-dojo-coral/25 bg-gradient-to-br from-dojo-mist/80 to-dojo-ink/90 px-4 py-3 text-sm text-dojo-text shadow-xl">
              <span className="mb-1 block text-[10px] text-dojo-cyan">
                第 {roundIndex + 1} / 3 轮
              </span>
              {currentAi}
            </div>
          </motion.div>
        )}

        {isDone && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-8 text-center text-sm text-dojo-muted"
          >
            生成战报中…
          </motion.p>
        )}
      </div>

      {roundIndex < 3 && (
        <motion.div
          layout
          className="sticky bottom-0 border-t border-dojo-line/40 bg-dojo-void/95 pb-[max(1rem,var(--safe-bottom))] pt-3 backdrop-blur-lg"
        >
          <div className="flex gap-2">
            <input
              className={`${inputField} flex-1 text-sm`}
              placeholder="输入回复"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submitRound()}
            />
            <motion.button
              type="button"
              className="shrink-0 rounded-xl bg-dojo-accent px-4 py-3 text-sm font-medium text-dojo-void disabled:opacity-40"
              onClick={submitRound}
              disabled={!draft.trim()}
              whileTap={{ scale: 0.96 }}
            >
              发送
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function TrainPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-dojo-muted">加载训练…</div>
      }
    >
      <TrainInner />
    </Suspense>
  );
}
