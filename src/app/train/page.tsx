"use client";

import { useMemo, useState, Suspense, useEffect, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { mockParse, mockParseFromScene } from "@/lib/mock";
import { SESSION_REPORT_KEY } from "@/lib/constants";
import { buildReportWithOptionalAi } from "@/lib/report";
import type { TrainingRound } from "@/lib/types";
import { inputField } from "@/lib/ui";
import { TypewriterText } from "@/components/TypewriterText";
import { fetchCoachLine } from "@/lib/llm/client";

function ChatAvatar({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-md bg-[#e5e5ea] text-[13px] font-semibold text-[#1d1d1f]">
      {children}
    </div>
  );
}

function CoachBubble({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-[min(100%,20rem)] sm:max-w-[75%]">
      <div className="relative inline-block rounded-lg bg-chat-bubbleLeft px-[14px] py-[10px] text-[15px] leading-[1.45] text-[#000000]">
        <span
          className="absolute left-[-6px] top-1/2 z-0 h-0 w-0 -translate-y-1/2 border-y-[6px] border-y-transparent border-r-[7px] border-r-chat-bubbleLeft"
          aria-hidden
        />
        {children}
      </div>
    </div>
  );
}

function UserBubble({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-[min(100%,20rem)] sm:max-w-[75%]">
      <div className="relative inline-block rounded-lg bg-chat-bubbleRight px-[14px] py-[10px] text-[15px] leading-[1.45] text-[#000000]">
        <span
          className="absolute right-[-6px] top-1/2 z-0 h-0 w-0 -translate-y-1/2 border-y-[6px] border-y-transparent border-l-[7px] border-l-chat-bubbleRight"
          aria-hidden
        />
        {children}
      </div>
    </div>
  );
}

function CoachRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <ChatAvatar>教</ChatAvatar>
      <CoachBubble>{children}</CoachBubble>
    </div>
  );
}

function UserRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start justify-end gap-2">
      <UserBubble>{children}</UserBubble>
      <ChatAvatar>我</ChatAvatar>
    </div>
  );
}

function TrainInner() {
  const router = useRouter();
  const search = useSearchParams();
  const url = useMemo(() => {
    const u = search.get("url");
    return u ? decodeURIComponent(u) : "";
  }, [search]);
  const scene = useMemo(() => search.get("scene") || "", [search]);
  const opponent = useMemo(() => {
    const v = search.get("opponent");
    return v ? decodeURIComponent(v) : "";
  }, [search]);

  const parse = useMemo(
    () => (scene ? mockParseFromScene(scene, opponent) : mockParse(url)),
    [opponent, scene, url]
  );
  const contextSource = useMemo(() => {
    if (url) return url;
    if (!scene) return "";
    const q = opponent ? `?opponent=${encodeURIComponent(opponent)}` : "";
    return `scene://${scene}${q}`;
  }, [opponent, scene, url]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [rounds, setRounds] = useState<TrainingRound[]>([]);
  const [draft, setDraft] = useState("");
  const [pendingAi, setPendingAi] = useState("");
  const [aiLoading, setAiLoading] = useState(true);
  const isDone = roundIndex >= 3;

  useEffect(() => {
    if (roundIndex >= 3) return;
    if (rounds.length !== roundIndex) return;

    let cancelled = false;
    setAiLoading(true);
    setPendingAi("");

    fetchCoachLine(parse, rounds, roundIndex).then(({ text }) => {
      if (cancelled) return;
      setPendingAi(text);
      setAiLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [roundIndex, rounds, parse]);

  useEffect(() => {
    if (!isDone) return;
    let cancelled = false;
    (async () => {
      const report = await buildReportWithOptionalAi(contextSource, parse, rounds);
      if (cancelled) return;
      sessionStorage.setItem(SESSION_REPORT_KEY, JSON.stringify(report));
      router.replace("/report");
    })();
    return () => {
      cancelled = true;
    };
  }, [contextSource, isDone, parse, rounds, router]);

  const submitRound = () => {
    const text = draft.trim();
    if (!text || roundIndex >= 3 || aiLoading || !pendingAi) return;
    const next: TrainingRound = {
      round: roundIndex + 1,
      aiMessage: pendingAi,
      userReply: text,
    };
    setRounds((r) => [...r, next]);
    setDraft("");
    setRoundIndex((i) => i + 1);
  };

  return (
    <div className="flex min-h-[calc(100dvh-120px)] flex-col pt-2">
      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        <AnimatePresence mode="popLayout">
          {rounds.map((r) => (
            <motion.div
              key={r.round}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2.5"
            >
              <CoachRow>{r.aiMessage}</CoachRow>
              <UserRow>{r.userReply}</UserRow>
            </motion.div>
          ))}
        </AnimatePresence>

        {roundIndex < 3 && (
          <motion.div
            key={`ai-${roundIndex}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <CoachRow>
              {aiLoading ? (
                <span className="inline-flex items-center gap-1 text-[#6e6e6e]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-dojo-accent" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-dojo-accent [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-dojo-accent [animation-delay:300ms]" />
                  生成台词中…
                </span>
              ) : (
                <TypewriterText text={pendingAi} speedMs={26} />
              )}
            </CoachRow>
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
          className="sticky bottom-0 border-t border-dojo-line bg-dojo-ink/95 pb-[max(1rem,var(--safe-bottom))] pt-3 backdrop-blur-lg"
        >
          <div className="flex items-center gap-2">
            <input
              className={`${inputField} flex-1 rounded-full py-2.5 text-[15px]`}
              placeholder={aiLoading ? "等待教练台词…" : "输入回复"}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && submitRound()
              }
              disabled={aiLoading || !pendingAi}
            />
            <motion.button
              type="button"
              className="shrink-0 rounded-full bg-dojo-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-40"
              onClick={submitRound}
              disabled={!draft.trim() || aiLoading || !pendingAi}
              whileTap={{ scale: 0.94 }}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 500, damping: 24 }}
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
