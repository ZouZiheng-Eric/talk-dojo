"use client";

import { useState, type SVGProps } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { linkPressable } from "@/lib/ui";
import {
  HOME_STORED_AUTHORITY_CHOICE_KEY,
  HOME_STORED_PEER_CHOICE_KEY,
  type HomeStoredAuthorityChoice,
  type HomeStoredPeerChoice,
} from "@/lib/constants";

/** 与全站 dojo.accent 同色（主页四宫格图标） */
const ICON_THEME = "text-dojo-accent";

/**
 * 首页四宫格按钮 1–4 的跳转地址（可分别改成不同聊天/训练路由）
 * 顺序：左上 → 右上 → 左下 → 右下
 */
const HOME_CHAT_HREF_BUTTON_1 = "/scene?scene=boss";
const HOME_CHAT_HREF_BUTTON_2 = "/scene?scene=roommate";
const HOME_CHAT_HREF_BUTTON_3 = "/scene?scene=relative";
const HOME_CHAT_HREF_BUTTON_4 = "/scene?scene=racist";

function IconBossMentor(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      aria-hidden
      {...props}
    >
      <circle cx="19" cy="17" r="6.5" strokeWidth="2" />
      <path
        d="M8 42v-2.5c0-4.5 3.8-8.2 8.5-8.2h5c4.7 0 8.5 3.7 8.5 8.2V42"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M34 10v10M29 15h10" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconClassmate(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      aria-hidden
      {...props}
    >
      <path
        d="M10 18c0-4.4 3.6-8 8-8h12c4.4 0 8 3.6 8 8v8c0 4.4-3.6 8-8 8H18c-4.4 0-8-3.6-8-8v-8Z"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M16 22h4M22 22h4M28 22h4M16 27h10M28 27h4"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconRelative(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      aria-hidden
      {...props}
    >
      <path
        d="M24 39s-11-7.2-11-16a7 7 0 0 1 14 0c0 8.8-11 16-11 16Z"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconOverseas(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      aria-hidden
      {...props}
    >
      <circle cx="24" cy="24" r="14" strokeWidth="2" />
      <ellipse cx="24" cy="24" rx="6" ry="14" strokeWidth="2" />
      <path
        d="M10 24h28M24 10c-3 4-3 20 0 28M24 10c3 4 3 20 0 28"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

const HOME_QUICK_GRID = [
  {
    label: "老板/导师",
    href: HOME_CHAT_HREF_BUTTON_1,
    Icon: IconBossMentor,
    pick: "authority" as const,
  },
  {
    label: "同学/室友",
    href: HOME_CHAT_HREF_BUTTON_2,
    Icon: IconClassmate,
    pick: "peer" as const,
  },
  {
    label: "烦人亲戚",
    href: HOME_CHAT_HREF_BUTTON_3,
    Icon: IconRelative,
  },
  {
    label: "海外 racist",
    href: HOME_CHAT_HREF_BUTTON_4,
    Icon: IconOverseas,
  },
] as const;

const TILE_CLASS = `${linkPressable} flex h-full min-h-0 w-full min-w-0 flex-col items-center justify-center gap-1.5 rounded-[20px] bg-white px-2 py-2 text-center shadow-[0_4px_18px_rgba(0,0,0,0.1)] ring-1 ring-black/[0.04] transition-shadow hover:shadow-[0_6px_22px_rgba(0,0,0,0.12)]`;

export default function HomePage() {
  const router = useRouter();
  const [rolePicker, setRolePicker] = useState<null | "authority" | "peer">(
    null
  );

  const confirmAuthorityChoice = (value: HomeStoredAuthorityChoice) => {
    sessionStorage.setItem(HOME_STORED_AUTHORITY_CHOICE_KEY, value);
    setRolePicker(null);
    router.push(`/scene?scene=boss&opponent=${encodeURIComponent(value)}`);
  };

  const confirmPeerChoice = (value: HomeStoredPeerChoice) => {
    sessionStorage.setItem(HOME_STORED_PEER_CHOICE_KEY, value);
    setRolePicker(null);
    router.push(`/scene?scene=roommate&opponent=${encodeURIComponent(value)}`);
  };

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#0c2826] text-white">
      {/* 渐变底 + 颗粒质感（对齐图1） */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0a2220] via-[#134e4a] via-40% to-[#5ec4e8]"
      />
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.2] mix-blend-overlay"
      >
        <filter id="home-grain" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#home-grain)" />
      </svg>

      <Link
        href="/favorites"
        className={`${linkPressable} absolute right-4 top-[max(0.75rem,env(safe-area-inset-top))] z-20 text-sm text-white/75 underline-offset-4 hover:text-white hover:underline`}
      >
        我的收藏
      </Link>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))]">
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="shrink-0 text-center"
        >
          <p className="font-display text-[15px] font-semibold tracking-wide text-white/95">
            回嘴道场<span className="mx-1.5 text-white/50">|</span>
            <span className="font-normal uppercase tracking-[0.12em] text-white/85">
              Talk Dojo
            </span>
          </p>
        </motion.header>

        {/* slogan 与四宫格同一列居中；gap 固定 20px = slogan 底到按钮区顶 */}
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[20px] px-0 pb-4 pt-2">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.06 }}
            className="max-w-[min(100%,22rem)] px-5 text-center font-display font-bold leading-[1.08] tracking-tight text-white"
            style={{
              fontSize: "clamp(2.85rem, 11vw, 4.25rem)",
            }}
          >
            吵不过？
            <br />
            来练练吧
          </motion.h1>

          <div className="w-full max-w-[min(100%,19rem)]">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.14 }}
              className="mx-auto aspect-[4/3] w-full"
            >
              <div className="grid h-full min-h-0 w-full grid-cols-2 grid-rows-2 gap-[10px]">
                {HOME_QUICK_GRID.map((item) => {
                  const Icon = item.Icon;
                  const body = (
                    <>
                      <Icon
                        className={`h-12 w-12 shrink-0 sm:h-14 sm:w-14 ${ICON_THEME}`}
                      />
                      <span className="text-balance px-0.5 text-center text-xs font-bold leading-snug text-[#111827] sm:text-sm">
                        {item.label}
                      </span>
                    </>
                  );
                  if ("pick" in item && item.pick === "authority") {
                    return (
                      <button
                        key={item.label}
                        type="button"
                        className={TILE_CLASS}
                        onClick={() => setRolePicker("authority")}
                      >
                        {body}
                      </button>
                    );
                  }
                  if ("pick" in item && item.pick === "peer") {
                    return (
                      <button
                        key={item.label}
                        type="button"
                        className={TILE_CLASS}
                        onClick={() => setRolePicker("peer")}
                      >
                        {body}
                      </button>
                    );
                  }
                  return (
                    <Link key={item.label} href={item.href} className={TILE_CLASS}>
                      {body}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>

        <div className="shrink-0 pt-2">
          <div className="mx-auto mb-5 h-px max-w-[20rem] bg-white/25" />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.22 }}
            className="mx-auto w-full max-w-[20rem] space-y-3 rounded-[1.35rem] bg-white/95 p-4 shadow-lg shadow-black/15 ring-1 ring-black/5"
          >
            <p className="text-center text-sm leading-relaxed text-[#475569]">
              上传本地视频，解析语境再开练。
            </p>
            <motion.div whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 480, damping: 26 }}>
              <Link
                href="/parse"
                className="flex w-full items-center justify-center rounded-full bg-[#0f172a] py-3.5 text-[15px] font-semibold text-white shadow-sm transition-opacity hover:opacity-95 active:opacity-90"
              >
                选择视频并解析
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {rolePicker ? (
          <motion.div
            key="role-picker"
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:items-center"
            onClick={() => setRolePicker(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="role-picker-title"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 16, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-black/5"
              onClick={(e) => e.stopPropagation()}
            >
              {rolePicker === "authority" ? (
                <>
                  <p
                    id="role-picker-title"
                    className="text-center text-base font-semibold text-[#0f172a]"
                  >
                    选择对话对象
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className="rounded-xl bg-dojo-accent py-3.5 text-sm font-semibold text-white shadow-sm active:opacity-90"
                      onClick={() => confirmAuthorityChoice("boss")}
                    >
                      老板
                    </button>
                    <button
                      type="button"
                      className="rounded-xl bg-dojo-accent py-3.5 text-sm font-semibold text-white shadow-sm active:opacity-90"
                      onClick={() => confirmAuthorityChoice("mentor")}
                    >
                      导师
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p
                    id="role-picker-title"
                    className="text-center text-base font-semibold text-[#0f172a]"
                  >
                    选择关系
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className="rounded-xl bg-dojo-accent py-3.5 text-sm font-semibold text-white shadow-sm active:opacity-90"
                      onClick={() => confirmPeerChoice("classmate")}
                    >
                      同学
                    </button>
                    <button
                      type="button"
                      className="rounded-xl bg-dojo-accent py-3.5 text-sm font-semibold text-white shadow-sm active:opacity-90"
                      onClick={() => confirmPeerChoice("roommate")}
                    >
                      室友
                    </button>
                  </div>
                </>
              )}
              <button
                type="button"
                className="mt-4 w-full py-2 text-sm text-dojo-muted transition-colors hover:text-dojo-text"
                onClick={() => setRolePicker(null)}
              >
                取消
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
