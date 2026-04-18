"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { mockParse } from "@/lib/mock";
import Link from "next/link";
import { glassPanel, linkPressable } from "@/lib/ui";
import { writeSessionParse } from "@/lib/sessionParse";
import {
  LOCAL_VIDEO_SESSION_URL,
  VIDEO_UPLOAD_MAX_MB,
} from "@/lib/constants";
import { appendStoredRolesToTrainHref } from "@/lib/chatAvatarMap";
import { clientConfig } from "@/config/client";
import type { ParseResult } from "@/lib/types";

type LoadState = "idle" | "loading" | "ready";

export default function ParsePage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [parse, setParse] = useState<ParseResult | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  /** 训练页 `?url=` 与 session 对齐（本地上传固定为 local://video） */
  const [sessionUrl, setSessionUrl] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);

  const onPickLocalVideo = async (f: File | null) => {
    if (!f) return;

    if (!clientConfig.useLlmApi) {
      setLoadState("loading");
      setParse(null);
      const fb = mockParse(LOCAL_VIDEO_SESSION_URL);
      writeSessionParse(LOCAL_VIDEO_SESSION_URL, fb);
      setParse(fb);
      setSessionUrl(LOCAL_VIDEO_SESSION_URL);
      setLoadState("ready");
      return;
    }

    setLoadState("loading");
    setParse(null);
    setParseError(null);
    try {
      const fd = new FormData();
      fd.set("file", f);
      const res = await fetch("/api/video-parse", { method: "POST", body: fd });
      let data: {
        ok?: boolean;
        parse?: ParseResult;
        message?: string;
        code?: string;
      } = {};
      try {
        data = (await res.json()) as typeof data;
      } catch {
        setParseError(`解析失败（HTTP ${res.status}）`);
        setLoadState("idle");
        return;
      }
      if (res.ok && data.ok && data.parse) {
        writeSessionParse(LOCAL_VIDEO_SESSION_URL, data.parse);
        setParse(data.parse);
        setSessionUrl(LOCAL_VIDEO_SESSION_URL);
        setLoadState("ready");
        return;
      }
      const code = typeof data.code === "string" ? data.code : "";
      const msg = typeof data.message === "string" ? data.message : "";
      setParseError(
        [code && `[${code}]`, msg || `请求失败（HTTP ${res.status}）`]
          .filter(Boolean)
          .join(" ")
      );
      setLoadState("idle");
      return;
    } catch {
      setParseError("网络异常，请重试");
      setLoadState("idle");
      return;
    }
  };

  const [trainHref, setTrainHref] = useState(
    `/train?url=${encodeURIComponent(sessionUrl || LOCAL_VIDEO_SESSION_URL)}`
  );
  useEffect(() => {
    const base = `/train?url=${encodeURIComponent(sessionUrl || LOCAL_VIDEO_SESSION_URL)}`;
    setTrainHref(appendStoredRolesToTrainHref(base));
  }, [sessionUrl]);

  const canEnter =
    Boolean(sessionUrl.trim()) && loadState === "ready" && parse;

  return (
    <div className="flex flex-col gap-6 pb-10 pt-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <p className="text-xs text-dojo-cyan">
          {loadState === "loading"
            ? "正在理解视频语境…"
            : loadState === "ready"
              ? "解析完成"
              : "解析语境"}
        </p>
        <h2 className="mt-2 font-display text-xl text-dojo-gold">语境画像</h2>
        {clientConfig.useLlmApi && loadState === "loading" ? (
          <p className="mt-2 text-xs text-dojo-muted">
            本地视频将送交大模型（多模态）
          </p>
        ) : null}
      </motion.div>

      <div className={`${glassPanel} space-y-2 px-4 py-3`}>
        <p className="text-xs font-medium text-dojo-muted">本地素材</p>
        <input
          ref={fileRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm,video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            void onPickLocalVideo(file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={loadState === "loading"}
          className={`${linkPressable} w-full rounded-xl border border-dojo-line/80 bg-dojo-mist/50 px-4 py-3 text-left text-sm text-dojo-text`}
          onClick={() => fileRef.current?.click()}
        >
          选择本地视频（建议 mp4，小于约 {VIDEO_UPLOAD_MAX_MB} MB，受部署环境限制）
        </button>
      </div>

      {parseError ? (
        <p
          role="alert"
          className="rounded-xl bg-red-500/10 px-4 py-3 text-center text-sm text-red-700"
        >
          {parseError}
        </p>
      ) : null}

      {loadState === "loading" ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <span
            className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-dojo-accent border-t-transparent"
            aria-hidden
          />
          <p className="text-sm text-dojo-muted">大模型理解中…</p>
        </div>
      ) : null}

      {parse && loadState === "ready" ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className={`${glassPanel} divide-y divide-dojo-line/40 overflow-hidden`}
        >
          {(
            [
              { k: "标题", v: parse.title },
              { k: "冲突", v: parse.conflict },
              { k: "关键词", v: parse.contextKeywords },
            ] as const
          ).map((row, i) => (
            <motion.div
              key={row.k}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 + i * 0.05 }}
              className="flex flex-col gap-1 px-5 py-4"
            >
              <span className="text-[10px] uppercase tracking-wider text-dojo-muted">
                {row.k}
              </span>
              <span className="text-base text-dojo-text">{row.v}</span>
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 + 3 * 0.05 }}
            className="flex flex-col gap-2 px-5 py-4"
          >
            <span className="text-[10px] uppercase tracking-wider text-dojo-muted">
              策略要点
            </span>
            {parse.strategies.length > 0 ? (
              <ul className="list-inside list-decimal space-y-1 text-base text-dojo-text">
                {parse.strategies.map((s, j) => (
                  <li key={j} className="leading-relaxed">
                    {s}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-base text-dojo-muted">
                暂无（解析未归纳出具体策略）
              </span>
            )}
          </motion.div>
        </motion.div>
      ) : null}

      {!sessionUrl && !parse && !parseError ? (
        <p className="text-center text-sm text-dojo-muted">
          请上传本地视频，解析语境后再进入训练。
        </p>
      ) : null}

      {canEnter ? (
        <Link
          href={trainHref}
          className={`${linkPressable} flex min-h-14 w-full items-center justify-center rounded-2xl bg-dojo-accent px-4 py-4 text-center text-base font-semibold text-white no-underline shadow-sm hover:opacity-95 active:opacity-90`}
        >
          进入训练
        </Link>
      ) : (
        <span
          className={`flex min-h-14 w-full cursor-not-allowed items-center justify-center rounded-2xl bg-dojo-line/60 px-4 py-4 text-center text-base font-semibold text-dojo-muted`}
        >
          {loadState === "loading" ? "请稍候…" : "进入训练"}
        </span>
      )}
    </div>
  );
}
