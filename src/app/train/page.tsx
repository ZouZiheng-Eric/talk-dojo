"use client";

import {
  useMemo,
  useState,
  Suspense,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { mockParse, mockParseFromScene } from "@/lib/mock";
import { SESSION_REPORT_KEY } from "@/lib/constants";
import { buildReportWithOptionalAi } from "@/lib/report";
import type { TrainingRound } from "@/lib/types";
import { inputField } from "@/lib/ui";
import { fetchCoachLine } from "@/lib/llm/client";
import { useToast } from "@/components/ToastProvider";
import { useSpeechToText } from "@/lib/useSpeechToText";

/** 每轮轮换，避免「生成台词中」重复 */
const COACH_LOADING_PHRASES = [
  "教练正在热身",
  "杠精在组织语言",
  "对手在酝酿话术",
  "正在模拟对线",
  "脑子在转，稍等",
  "排练抬杠中",
] as const;

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
      <div className="relative inline-block rounded-lg bg-white px-[14px] py-[10px] text-[15px] leading-[1.45] text-[#000000] text-justify shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
        <span
          className="absolute left-[-6px] top-1/2 z-0 h-0 w-0 -translate-y-1/2 border-y-[6px] border-y-transparent border-r-[7px] border-r-white"
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
      <div className="relative inline-block rounded-lg bg-chat-bubbleRight px-[14px] py-[10px] text-[15px] leading-[1.45] text-[#000000] text-justify">
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
  const [aiMessagePulse, setAiMessagePulse] = useState(0);
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
  const speechMicBlocked = aiLoading || !pendingAi;
  const isDone = roundIndex >= 3;
  const coachLoadingPhrase =
    COACH_LOADING_PHRASES[roundIndex % COACH_LOADING_PHRASES.length];

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
      setAiMessagePulse((n) => n + 1);
      // 设备支持时给一个很短的触觉反馈，接近 IM 新消息到达感受
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(18);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [roundIndex, rounds, parse]);

  /** 评分：仅 await LLM；与下方怒气条 CSS 动画并行，互不阻塞、互不依赖 */
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
    <div className="flex min-h-[calc(100dvh-120px)] flex-col rounded-2xl bg-[#f2f3f5] p-2 pt-2">
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
            key={`ai-${roundIndex}-${aiMessagePulse}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{
              opacity: 1,
              y: 0,
              x: aiLoading ? 0 : [0, -2, 2, -1, 1, 0],
            }}
            transition={{
              opacity: { duration: 0.18 },
              y: { duration: 0.18 },
              x: { duration: 0.28, ease: "easeOut" },
            }}
          >
            <CoachRow>
              {aiLoading ? (
                <span className="inline-flex items-center gap-1 text-[#6e6e6e]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-dojo-accent" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-dojo-accent [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-dojo-accent [animation-delay:300ms]" />
                  {coachLoadingPhrase}
                </span>
              ) : (
                pendingAi
              )}
            </CoachRow>
          </motion.div>
        )}

        {isDone && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="mx-auto w-full max-w-xs space-y-3 px-2 py-6"
          >
            <p className="text-center text-sm text-dojo-muted">生成战报中…</p>
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2 text-[11px] font-medium uppercase tracking-wide text-dojo-muted">
                <span>怒气值</span>
                <span className="tabular-nums normal-case tracking-normal text-[#b45309]">
                  蓄力中
                </span>
              </div>
              <div
                className="h-2.5 overflow-hidden rounded-full bg-black/[0.08]"
                role="progressbar"
                aria-label="战报生成进度指示"
                aria-busy="true"
              >
                <div
                  className="h-full w-full origin-left rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-dojo-coral animate-rage-fill motion-reduce:animate-none"
                  aria-hidden
                />
              </div>
            </div>
          </motion.div>
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
              placeholder={aiLoading ? "教练在憋台词…" : "输入回复"}
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
              className={`shrink-0 rounded-full border px-3 py-2.5 text-dojo-text transition-colors disabled:opacity-40 ${
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
              whileTap={{ scale: 0.94 }}
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
