"use client";

import { useState } from "react";
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
import { CHAT_AVATAR_QUERY } from "@/lib/chatAvatarMap";

/**
 * 首页四宫格按钮 1–4 的跳转地址（可分别改成不同聊天/训练路由）
 * 顺序：左上 → 右上 → 左下 → 右下
 */
const HOME_CHAT_HREF_BUTTON_1 = "/train?scene=boss";
const HOME_CHAT_HREF_BUTTON_2 = "/train?scene=colleague";
const HOME_CHAT_HREF_BUTTON_3 = "/train?scene=relative";
const HOME_CHAT_HREF_BUTTON_4 = "/train?scene=racist";

type HomeTile = {
  label: string;
  href: string;
  /** 两个 emoji 组合：主体 + 表情 */
  emoji: [string, string];
  pick?: "authority" | "peer";
};

const HOME_QUICK_GRID: HomeTile[] = [
  {
    label: "老板/导师",
    href: HOME_CHAT_HREF_BUTTON_1,
    emoji: ["👨🏻‍🏫", "🤯"],
    pick: "authority",
  },
  {
    label: "同学/同事",
    href: HOME_CHAT_HREF_BUTTON_2,
    emoji: ["👩🏻‍🎓", "😅"],
    pick: "peer",
  },
  {
    label: "烦人亲戚",
    href: HOME_CHAT_HREF_BUTTON_3,
    emoji: ["👴🏻", "🙄"],
  },
  {
    label: "海外 racist",
    href: HOME_CHAT_HREF_BUTTON_4,
    emoji: ["💂🏻‍♀️", "🤬"],
  },
];

/** Emoji 双字组合图标：系统原生 emoji 字体，跨端风格尽量一致 */
function HomeTileGraphic({ item }: { item: HomeTile }) {
  return (
    <div
      className="pointer-events-none flex select-none items-center justify-center gap-0.5 leading-none"
      style={{
        fontSize: "clamp(1.75rem, 8.5vw, 2.35rem)",
        fontFamily:
          '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif',
      }}
      aria-hidden
    >
      <span>{item.emoji[0]}</span>
      <span>{item.emoji[1]}</span>
    </div>
  );
}

/**
 * 苹果磨砂玻璃风：半透明白 + 强 backdrop-blur + 细内描边 + 内顶高光
 * 保留白底基调但不再是死白，hover/press 有层次反馈
 */
const TILE_CLASS = `${linkPressable} group relative flex h-full min-h-0 w-full min-w-0 flex-col items-center justify-center gap-1.5 overflow-hidden rounded-[22px] bg-white/55 px-2 py-2 text-center shadow-[0_8px_28px_-12px_rgba(15,23,42,0.25)] ring-1 ring-white/60 backdrop-blur-2xl backdrop-saturate-150 transition-[transform,box-shadow,background-color] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:rounded-t-[22px] before:bg-gradient-to-b before:from-white/55 before:to-transparent before:opacity-80 hover:bg-white/65 hover:shadow-[0_14px_36px_-10px_rgba(15,23,42,0.32)] active:bg-white/50`;

export default function HomePage() {
  const router = useRouter();
  const [rolePicker, setRolePicker] = useState<null | "authority" | "peer">(
    null
  );

  const confirmAuthorityChoice = (value: HomeStoredAuthorityChoice) => {
    sessionStorage.setItem(HOME_STORED_AUTHORITY_CHOICE_KEY, value);
    setRolePicker(null);
    router.push(
      `/train?scene=boss&${CHAT_AVATAR_QUERY.authority}=${encodeURIComponent(value)}`
    );
  };

  const confirmPeerChoice = (value: HomeStoredPeerChoice) => {
    sessionStorage.setItem(HOME_STORED_PEER_CHOICE_KEY, value);
    setRolePicker(null);
    router.push(
      `/train?scene=colleague&${CHAT_AVATAR_QUERY.peer}=${encodeURIComponent(value)}`
    );
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* 极轻颗粒：与 Shell 渐变叠加以增加层次，不抢眼 */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.14] mix-blend-overlay"
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

      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="shrink-0 text-center"
        >
          <p className="font-display text-[15px] font-semibold tracking-wide text-white/95">
            回怼道场<span className="mx-1.5 text-white/50">|</span>
            <span className="font-normal uppercase tracking-[0.12em] text-white/85">
              Talk Dojo
            </span>
          </p>
        </motion.header>

        {/* 四宫格区域横向居中；slogan 与四宫格同宽、左对齐 */}
        <div className="flex min-h-0 flex-1 w-full flex-col items-center justify-center px-0 pb-4 pt-2">
          <div className="mx-auto flex w-full max-w-[min(100%,19rem)] flex-col items-stretch gap-[20px]">
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.06 }}
              className="w-full text-left font-display font-bold leading-[1.08] tracking-tight text-white"
              style={{
                fontSize: "clamp(2.85rem, 11vw, 4.25rem)",
              }}
            >
              吵不过？
              <br />
              来练练吧
            </motion.h1>

            <div className="w-full">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.14 }}
                className="aspect-[4/3] w-full"
              >
                <div className="grid h-full min-h-0 w-full grid-cols-2 grid-rows-2 gap-[10px]">
                {HOME_QUICK_GRID.map((item) => {
                  const body = (
                    <>
                      <HomeTileGraphic item={item} />
                      <span className="text-balance px-0.5 text-center text-xs font-bold leading-snug text-[#0f172a] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)] sm:text-sm">
                        {item.label}
                      </span>
                    </>
                  );
                  if (item.pick === "authority") {
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
                  if (item.pick === "peer") {
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
        </div>

        <div className="shrink-0 pt-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="mx-auto w-full max-w-[22rem] space-y-4 rounded-[1.75rem] border border-white/[0.14] bg-white/[0.1] p-5 shadow-[0_20px_50px_-18px_rgba(0,0,0,0.35)] backdrop-blur-xl"
          >
            <p className="text-center text-[15px] leading-relaxed text-white/88">
              上传本地视频，解析语境再开练。
            </p>
            <motion.div
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 480, damping: 26 }}
            >
              <Link
                href="/parse"
                className="flex w-full items-center justify-center rounded-full bg-white py-3.5 text-[15px] font-semibold text-[#0a1f1e] shadow-[0_8px_24px_-6px_rgba(0,0,0,0.25)] transition-opacity hover:opacity-95 active:opacity-90"
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
                      onClick={() => confirmPeerChoice("colleague")}
                    >
                      同事
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
