"use client";

import { useMemo, useState, Suspense, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { mockParse } from "@/lib/mock";
import { SESSION_REPORT_KEY } from "@/lib/constants";
import { buildReportWithOptionalAi } from "@/lib/report";
import type { TrainingRound } from "@/lib/types";
import { inputField } from "@/lib/ui";
import { TypewriterText } from "@/components/TypewriterText";
import { fetchCoachLine } from "@/lib/llm/client";
import { useToast } from "@/components/ToastProvider";
import { useSpeechToText } from "@/lib/useSpeechToText";

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
  const [pendingAi, setPendingAi] = useState("");
  const [aiLoading, setAiLoading] = useState(true);
  const [fromApi, setFromApi] = useState(false);

  const draftRef = useRef("");
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const showToast = useToast();
  const speech = useSpeechToText({
    lang: "zh-CN",
    getPrefix: useCallback(() => draftRef.current, []),
    onText: useCallback((t: string) => setDraft(t), []),
    onError: useCallback((m: string) => showToast(m), [showToast]),
  });

  const isDone = roundIndex >= 3;
  /** 仅「等教练台词」时禁用麦克风；不支持语音的浏览器仍可点，会弹出说明 */
  const speechMicBlocked = aiLoading || !pendingAi;

  useEffect(() => {
    if (roundIndex >= 3) return;
    if (rounds.length !== roundIndex) return;

    let cancelled = false;
    setAiLoading(true);
    setPendingAi("");
    setFromApi(false);

    fetchCoachLine(parse, rounds, roundIndex).then(({ text, fromApi: fa }) => {
      if (cancelled) return;
      setPendingAi(text);
      setFromApi(fa);
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
      const report = await buildReportWithOptionalAi(url || "", parse, rounds);
      if (cancelled) return;
      sessionStorage.setItem(SESSION_REPORT_KEY, JSON.stringify(report));
      router.replace("/report");
    })();
    return () => {
      cancelled = true;
    };
  }, [isDone, parse, rounds, router, url]);

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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-4 rounded-xl border border-dojo-accent/20 bg-dojo-mist/40 px-3 py-2"
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] text-dojo-muted">语境</p>
            <p className="font-display text-sm text-dojo-gold">{parse.title}</p>
          </div>
          {!aiLoading && roundIndex < 3 ? (
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wide ${
                fromApi
                  ? "bg-dojo-cyan/15 text-dojo-cyan"
                  : "bg-dojo-line/50 text-dojo-muted"
              }`}
            >
              {fromApi ? "AI" : "演示"}
            </span>
          ) : null}
        </div>
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
              {aiLoading ? (
                <span className="inline-flex items-center gap-1 text-dojo-muted">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-dojo-accent" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-dojo-accent [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-dojo-accent [animation-delay:300ms]" />
                  生成台词中…
                </span>
              ) : (
                <TypewriterText text={pendingAi} speedMs={26} />
              )}
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
              className={`${inputField} min-w-0 flex-1 text-sm`}
              placeholder={aiLoading ? "等待教练台词…" : "输入回复"}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && submitRound()
              }
              disabled={aiLoading || !pendingAi || speech.listening}
            />
            <motion.button
              type="button"
              aria-label={speech.listening ? "停止语音识别" : "语音输入"}
              title={
                speechMicBlocked
                  ? "请等待本轮教练台词出现后再用语音"
                  : !speech.supported
                    ? "当前环境可能不支持网页语音，点此查看说明"
                    : speech.listening
                      ? "点击停止"
                      : "点击说话（中文）"
              }
              className={`shrink-0 rounded-xl border px-3 py-3 text-dojo-text transition-colors disabled:opacity-40 ${
                speech.listening
                  ? "border-dojo-coral bg-dojo-coral/15 ring-2 ring-dojo-coral/40"
                  : "border-dojo-line/80 bg-dojo-mist/40"
              } ${!speech.supported && !speechMicBlocked ? "opacity-70" : ""}`}
              disabled={speechMicBlocked}
              onClick={() => {
                if (speechMicBlocked) return;
                if (!speech.supported) {
                  showToast(
                    "网页语音需要浏览器支持 Web Speech API。若按钮无效：勿用微信内置浏览器，改用系统 Chrome；手机用 http://局域网 访问时可能不可用，可试 HTTPS 隧道或在电脑 localhost 测试；iOS Safari 常不支持。"
                  );
                  return;
                }
                speech.toggle();
              }}
              whileTap={{ scale: 0.92 }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
                aria-hidden
              >
                <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 1 1-10 0H5a7 7 0 0 0 6 6.92V20H8v2h8v-2h-3v-2.08A7 7 0 0 0 19 11h-2Z" />
              </svg>
            </motion.button>
            <motion.button
              type="button"
              className="shrink-0 rounded-xl bg-gradient-to-r from-dojo-accent to-dojo-coral px-4 py-3 text-sm font-semibold text-white shadow-md shadow-dojo-accent/25 ring-1 ring-white/10 disabled:opacity-40"
              onClick={submitRound}
              disabled={!draft.trim() || aiLoading || !pendingAi}
              whileTap={{ scale: 0.92 }}
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
