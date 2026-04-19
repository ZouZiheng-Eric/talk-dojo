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
import {
  SESSION_REPORT_KEY,
  HOME_STORED_AUTHORITY_CHOICE_KEY,
  HOME_STORED_PEER_CHOICE_KEY,
  type HomeStoredAuthorityChoice,
  type HomeStoredPeerChoice,
} from "@/lib/constants";
import { readSessionParse } from "@/lib/sessionParse";
import {
  parseAuthorityFromSearch,
  parsePeerFromSearch,
  readAuthorityFromSession,
  readPeerFromSession,
  resolveCoachAvatar,
  resolveUserAvatar,
  reportGeneratingWhipUrl,
} from "@/lib/chatAvatarMap";
import { buildReport, buildReportWithOptionalAi } from "@/lib/report";
import type { BattleReport, ParseResult, TrainingRound } from "@/lib/types";
import { btnPrimary, glassPanel, inputField } from "@/lib/ui";
import { fetchCoachLine } from "@/lib/llm/client";
import { useToast } from "@/components/ToastProvider";
import { useSpeechToText } from "@/lib/useSpeechToText";

const SCENE_LABELS: Record<string, string> = {
  boss: "老板/导师",
  colleague: "同学/同事",
  relative: "烦人亲戚",
  racist: "海外 racist",
};

/** 首页曾错误把角色枚举塞进 `opponent=`，不作为「对方特征」文案 */
const RESERVED_OPPONENT_ROLE_TOKENS = new Set([
  "boss",
  "mentor",
  "classmate",
  "colleague",
  "roommate",
]);

/** 每轮轮换，避免加载态文案重复 */
const COACH_LOADING_PHRASES = [
  "教练正在热身",
  "杠精在组织语言",
  "对手在酝酿话术",
  "正在模拟对线",
  "脑子在转，稍等",
  "排练抬杠中",
] as const;

function ChatAvatarImage({
  src,
  fallbackText,
}: {
  src: string;
  fallbackText: string;
}) {
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    setBroken(false);
  }, [src]);
  if (broken) {
    return (
      <div
        className="flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-md bg-[#e5e5ea] text-[13px] font-semibold text-[#1d1d1f]"
        aria-hidden
      >
        {fallbackText}
      </div>
    );
  }
  return (
    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-[#e5e5ea] ring-1 ring-black/[0.08]">
      <img
        key={src}
        src={src}
        alt=""
        className="h-full w-full object-cover object-top"
        onError={() => setBroken(true)}
      />
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

function CoachRow({
  children,
  avatarSrc,
}: {
  children: ReactNode;
  avatarSrc: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <ChatAvatarImage src={avatarSrc} fallbackText="教" />
      <CoachBubble>{children}</CoachBubble>
    </div>
  );
}

function UserRow({
  children,
  avatarSrc,
}: {
  children: ReactNode;
  avatarSrc: string;
}) {
  return (
    <div className="flex items-start justify-end gap-2">
      <UserBubble>{children}</UserBubble>
      <ChatAvatarImage src={avatarSrc} fallbackText="我" />
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
  const scene = useMemo(() => {
    const raw = search.get("scene") || "";
    return raw === "roommate" ? "colleague" : raw;
  }, [search]);
  const opponentFromUrl = useMemo(() => {
    const v = search.get("opponent");
    return v ? decodeURIComponent(v) : "";
  }, [search]);

  const authorityFromQuery = useMemo(
    () => parseAuthorityFromSearch(search),
    [search]
  );
  const peerFromQuery = useMemo(() => parsePeerFromSearch(search), [search]);

  const [homeAuthority, setHomeAuthority] =
    useState<HomeStoredAuthorityChoice | null>(readAuthorityFromSession);
  const [homePeer, setHomePeer] = useState<HomeStoredPeerChoice | null>(
    readPeerFromSession
  );

  /** URL 优先（可分享、刷新保留），并回写 sessionStorage 与首页逻辑对齐 */
  useEffect(() => {
    const aQ = authorityFromQuery;
    const pQ = peerFromQuery;
    try {
      if (aQ) {
        sessionStorage.setItem(HOME_STORED_AUTHORITY_CHOICE_KEY, aQ);
        setHomeAuthority(aQ);
      } else {
        setHomeAuthority(readAuthorityFromSession());
      }
      if (pQ) {
        sessionStorage.setItem(HOME_STORED_PEER_CHOICE_KEY, pQ);
        setHomePeer(pQ);
      } else {
        setHomePeer(readPeerFromSession());
      }
    } catch {
      setHomeAuthority(aQ ?? readAuthorityFromSession());
      setHomePeer(pQ ?? readPeerFromSession());
    }
  }, [authorityFromQuery, peerFromQuery]);

  const coachAvatar = useMemo(
    () => resolveCoachAvatar(scene, homeAuthority, homePeer),
    [scene, homeAuthority, homePeer]
  );
  const userAvatar = useMemo(
    () => resolveUserAvatar(scene, homePeer),
    [scene, homePeer]
  );

  /** 对应「场景设置」里补充对方特征；语音按住说话写入此处，并与 URL 初始值衔接。 */
  const [opponentHint, setOpponentHint] = useState("");
  const opponentHintRef = useRef("");
  useEffect(() => {
    opponentHintRef.current = opponentHint;
  }, [opponentHint]);
  useEffect(() => {
    const raw = opponentFromUrl.trim();
    if (RESERVED_OPPONENT_ROLE_TOKENS.has(raw)) setOpponentHint("");
    else setOpponentHint(opponentFromUrl);
  }, [opponentFromUrl]);

  /** 会话/场景解析结果（不含语音里临时改动的对方特征，避免与 parseEffective 重复拼接） */
  const [parse, setParse] = useState<ParseResult>(() =>
    scene ? mockParseFromScene(scene) : mockParse(url)
  );

  useEffect(() => {
    if (scene) {
      setParse(mockParseFromScene(scene));
      return;
    }
    if (url) {
      const s = readSessionParse(url);
      if (s) setParse(s);
      else setParse(mockParse(url));
    } else {
      setParse(mockParse(""));
    }
  }, [scene, url]);

  /** 教练与战报：在解析结果上叠加当前对方特征描述 */
  const parseEffective = useMemo(() => {
    const h = opponentHint.trim();
    if (!h) return parse;
    return {
      ...parse,
      contextKeywords: `${parse.contextKeywords}（对方特征：${h}）`,
    };
  }, [parse, opponentHint]);
  const contextSource = useMemo(() => {
    if (url) return url;
    if (!scene) return "";
    const h = opponentHint.trim();
    const q = h ? `?opponent=${encodeURIComponent(h)}` : "";
    return `scene://${scene}${q}`;
  }, [opponentHint, scene, url]);
  /** false：准备页（对方特征：打字 + 按住说话同一框）；true：进入多轮对话 */
  const [trainingStarted, setTrainingStarted] = useState(false);
  const [roundIndex, setRoundIndex] = useState(0);
  const [rounds, setRounds] = useState<TrainingRound[]>([]);
  const [draft, setDraft] = useState("");
  const [pendingAi, setPendingAi] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
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
  const prepSpeech = useSpeechToText({
    lang: "zh-CN",
    getPrefix: useCallback(() => opponentHintRef.current, []),
    onText: useCallback((t: string) => setOpponentHint(t), []),
    onError: useCallback((m: string) => showToast(m), [showToast]),
  });
  const speechMicBlocked = aiLoading || !pendingAi;
  const isDone = roundIndex >= 3;
  const coachLoadingPhrase =
    COACH_LOADING_PHRASES[roundIndex % COACH_LOADING_PHRASES.length];

  /** 战报已生成并写入 sessionStorage；同时保留内存副本 */
  const [reportReady, setReportReady] = useState(false);
  const [builtReport, setBuiltReport] = useState<BattleReport | null>(null);
  const navigateToReportRef = useRef(false);

  const goToReport = useCallback(() => {
    if (navigateToReportRef.current) return;
    navigateToReportRef.current = true;
    router.replace("/report");
  }, [router]);

  const startTraining = useCallback(() => {
    prepSpeech.stop();
    speech.stop();
    setTrainingStarted(true);
  }, [prepSpeech, speech]);

  useEffect(() => {
    if (!trainingStarted) return;
    if (roundIndex >= 3) return;
    if (rounds.length !== roundIndex) return;

    let cancelled = false;
    setAiLoading(true);
    setPendingAi("");

    fetchCoachLine(parseEffective, rounds, roundIndex).then(({ text }) => {
      if (cancelled) return;
      setPendingAi(text);
      setAiLoading(false);
      setAiMessagePulse((n) => n + 1);
    });

    return () => {
      cancelled = true;
    };
  }, [trainingStarted, roundIndex, rounds, parseEffective]);

  /** 评分：仅 await LLM */
  useEffect(() => {
    if (!isDone) return;
    setReportReady(false);
    setBuiltReport(null);
    navigateToReportRef.current = false;
    let cancelled = false;
    (async () => {
      try {
        const report = await buildReportWithOptionalAi(
          contextSource,
          parseEffective,
          rounds
        );
        if (cancelled) return;
        sessionStorage.setItem(SESSION_REPORT_KEY, JSON.stringify(report));
        setBuiltReport(report);
      } catch {
        if (cancelled) return;
        const fallback = buildReport(
          contextSource,
          parseEffective,
          rounds
        );
        sessionStorage.setItem(SESSION_REPORT_KEY, JSON.stringify(fallback));
        setBuiltReport(fallback);
      } finally {
        if (!cancelled) setReportReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [contextSource, isDone, parseEffective, rounds]);

  /** 战报就绪后进入结算页（生成中在聊天区下方循环播 `public/profile/鞭子.mp4`） */
  useEffect(() => {
    if (!isDone || !reportReady || !builtReport) return;
    goToReport();
  }, [isDone, reportReady, builtReport, goToReport]);

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

  if (!trainingStarted) {
    const sceneLabel = SCENE_LABELS[scene] ?? SCENE_LABELS.boss;
    return (
      <div className="flex min-h-[calc(100dvh-100px)] flex-col bg-transparent pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 text-dojo-text">
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 space-y-2.5 pl-1 pr-1 pt-6 sm:pl-2">
            <p className="text-[19px] font-semibold leading-relaxed text-dojo-accent">
              在开始之前，聊一句？
            </p>
            <p className="text-[15px] leading-relaxed text-dojo-text/90">
              对方是谁，发生了什么事？
            </p>
            <p className="text-[13px] leading-relaxed text-dojo-muted">
              细节越具体，对练越贴近真实。支持打字与语音，二选一或混用皆可。
            </p>
            {scene ? (
              <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-dojo-muted/90">
                场景 · {sceneLabel}
              </p>
            ) : null}
          </div>

          <div className={`${glassPanel} mt-4 space-y-3 p-5 sm:p-6`}>
            <textarea
              id="opponent-hint"
              rows={5}
              className={`${inputField} min-h-[7.5rem] resize-y py-3 text-[15px] leading-relaxed`}
              placeholder="例：语气强势、爱打断、阴阳怪气。语音会同步进本框。"
              value={opponentHint}
              onChange={(e) => setOpponentHint(e.target.value)}
              readOnly={prepSpeech.listening}
              aria-live="polite"
              aria-label="对方与现场（可选）"
            />
            <div className="flex flex-col items-center pt-1">
              <div
                role="button"
                tabIndex={0}
                className={`flex h-[6.5rem] w-[6.5rem] touch-none select-none items-center justify-center rounded-full bg-dojo-accent text-white shadow-[0_8px_28px_rgba(13,148,136,0.42)] transition-transform active:scale-[0.96] ${
                  prepSpeech.listening ? "ring-4 ring-dojo-accent/35" : ""
                }`}
                onPointerDown={(e) => {
                  if (!prepSpeech.supported) {
                    showToast(
                      "当前环境无法使用语音，请改用文字输入；桌面端推荐 Chrome。"
                    );
                    return;
                  }
                  try {
                    (e.currentTarget as HTMLDivElement).setPointerCapture(
                      e.pointerId
                    );
                  } catch {
                    /* noop */
                  }
                  prepSpeech.start();
                }}
                onPointerUp={(e) => {
                  prepSpeech.stop();
                  try {
                    (e.currentTarget as HTMLDivElement).releasePointerCapture(
                      e.pointerId
                    );
                  } catch {
                    /* noop */
                  }
                }}
                onPointerCancel={() => {
                  prepSpeech.stop();
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="36"
                  height="36"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 1 1-10 0H5a7 7 0 0 0 6 6.92V20H8v2h8v-2h-3v-2.08A7 7 0 0 0 19 11h-2Z" />
                </svg>
              </div>
              <p className="mt-4 max-w-[18rem] text-center text-[13px] leading-snug text-dojo-muted">
                长按麦克风 · 与上方文字同步
              </p>
            </div>
          </div>

          <motion.button
            type="button"
            className={`${btnPrimary} mt-6 w-full shrink-0`}
            onClick={startTraining}
            whileTap={{ scale: 0.98 }}
          >
            进入训练舱
          </motion.button>
          <button
            type="button"
            onClick={startTraining}
            className="mt-3 w-full shrink-0 rounded-2xl bg-dojo-coral px-4 py-4 text-left shadow-[0_10px_28px_-6px_rgba(255,59,48,0.35)] transition-opacity active:opacity-95"
          >
            <span className="block text-center text-[16px] font-semibold text-white">
              直接开练 · 不描述了
            </span>
            <span className="mt-1 block text-center text-[12px] leading-snug text-white/90">
              懒得喷？AI 用默认人设直接开整
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative isolate flex min-h-[calc(100dvh-96px)] w-full flex-col overflow-x-hidden rounded-[1.75rem] border border-dojo-line/50 bg-gradient-to-b from-dojo-ink to-dojo-mist/90 p-4 pt-4 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.12)] sm:rounded-[2rem] sm:p-5 sm:pt-5">
      <div className="relative z-0 flex-1 space-y-4 overflow-y-auto pb-5">
        <AnimatePresence mode="popLayout">
          {rounds.map((r) => (
            <motion.div
              key={r.round}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2.5"
            >
              <CoachRow avatarSrc={coachAvatar.primary}>
                {r.aiMessage}
              </CoachRow>
              <UserRow avatarSrc={userAvatar.primary}>
                {r.userReply}
              </UserRow>
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
            }}
            transition={{
              opacity: { duration: 0.18 },
              y: { duration: 0.18 },
            }}
          >
            <CoachRow avatarSrc={coachAvatar.primary}>
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

        {isDone && !reportReady ? (
          <div
            className="mt-3 flex flex-col items-center gap-2 pt-1"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            {/* mix-blend-multiply：把视频里接近白底的区域与下方渐变「乘」在一起，减轻白块感；完美去底需透明素材（WebM/APNG 等） */}
            <video
              className="mx-auto block max-h-[min(52vh,380px)] w-auto max-w-[min(100%,400px)] border-0 bg-transparent object-contain shadow-none outline-none ring-0 mix-blend-multiply"
              src={reportGeneratingWhipUrl()}
              autoPlay
              loop
              muted
              playsInline
              controls={false}
            />
            <p className="text-center text-sm font-medium tracking-wide text-dojo-muted">
              正在生成战报…
            </p>
          </div>
        ) : null}
      </div>

      {roundIndex < 3 && (
        <motion.div
          layout
          className="sticky bottom-0 z-10 -mx-1 rounded-b-[1.65rem] border-t border-dojo-line/70 bg-dojo-ink/92 pb-[max(1rem,var(--safe-bottom))] pt-3.5 backdrop-blur-lg sm:-mx-0 sm:rounded-b-[1.85rem]"
        >
          <div className="flex items-center gap-2">
            <input
              className={`${inputField} flex-1 rounded-full py-2.5 text-[15px]`}
              placeholder={
                speech.listening
                  ? "听写中…"
                  : aiLoading
                    ? "教练在憋台词…"
                    : "输入你的回复"
              }
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && submitRound()
              }
              readOnly={speech.listening}
              disabled={aiLoading || !pendingAi}
            />
            <motion.button
              type="button"
              aria-label={speech.listening ? "停止语音识别" : "语音输入"}
              title={
                speechMicBlocked
                  ? "请先等本轮台词出现"
                  : !speech.supported
                    ? "当前环境可能不支持语音，点此了解"
                    : speech.listening
                      ? "结束听写"
                      : "语音输入（中文）"
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
                    "语音需浏览器支持 Web Speech API。微信内置页可能不可用；请换 Chrome；手机非 HTTPS 局域网亦可能受限。"
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
        <div className="py-20 text-center text-sm text-dojo-muted">
          载入训练舱…
        </div>
      }
    >
      <TrainInner />
    </Suspense>
  );
}
