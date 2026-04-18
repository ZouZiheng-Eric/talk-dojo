"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { linkPressable } from "@/lib/ui";
import type { FavoriteItem } from "@/lib/types";
import { loadFavorites, removeFavorite } from "@/lib/storage";
import { clipUserQuoteForList, sortedTrainingRounds } from "@/lib/reportSnippets";
import {
  overallToPerformanceTier,
  performanceTierTone,
} from "@/lib/performanceTier";
import { glassPanel } from "@/lib/ui";

export default function FavoritesPage() {
  const [items, setItems] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    setItems(loadFavorites());
  }, []);

  const del = (id: string) => {
    removeFavorite(id);
    setItems(loadFavorites());
  };

  return (
    <div className="space-y-5 pt-2">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-display text-xl text-dojo-gold">我的收藏</h2>
          <p className="mt-1 text-xs text-dojo-muted">仅存本机</p>
        </div>
        <span className="rounded-full border border-dojo-line px-2 py-0.5 text-[10px] text-dojo-muted">
          {items.length} 条
        </span>
      </div>

      {items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`${glassPanel} py-16 text-center`}
        >
          <p className="text-sm text-dojo-muted">还没有收藏</p>
          <Link
            href="/"
            className={`${linkPressable} mt-4 inline-block text-sm text-dojo-accent underline-offset-4 hover:underline`}
          >
            去首页开练
          </Link>
        </motion.div>
      ) : (
        <ul className="space-y-3">
          <AnimatePresence mode="popLayout">
            {items.map((it) => (
              <motion.li
                key={it.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className={`${glassPanel} overflow-hidden`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-display text-base text-dojo-text">
                        {it.parse.title}
                      </p>
                      <p className="mt-1 text-xs text-dojo-muted">
                        评级{" "}
                        <span
                          className={`font-semibold ${performanceTierTone(
                            overallToPerformanceTier(it.overall)
                          )}`}
                        >
                          {overallToPerformanceTier(it.overall)}
                        </span>
                        {" · "}
                        {new Date(it.savedAt).toLocaleString("zh-CN")}
                      </p>
                    </div>
                    <motion.button
                      type="button"
                      onClick={() => del(it.id)}
                      className="shrink-0 rounded-lg px-2 py-1 text-xs text-dojo-coral/90 hover:underline"
                      whileTap={{ scale: 0.9 }}
                    >
                      删除
                    </motion.button>
                  </div>
                  <p className="mt-3 text-xs text-dojo-muted">
                    冲突：{it.parse.conflict}
                  </p>
                  {(() => {
                    const golden = it.goldenQuote?.text?.trim();
                    const fromRounds = sortedTrainingRounds(it.rounds)
                      .map((r) => clipUserQuoteForList(r.userReply, 44))
                      .find((q) => q.length > 0);
                    const preview =
                      (golden && clipUserQuoteForList(golden, 44)) ||
                      fromRounds ||
                      it.quotes[0];
                    return preview ? (
                      <p className="mt-2 border-l-2 border-dojo-accent/40 pl-2 text-xs italic text-dojo-text/80">
                        「{preview}」
                      </p>
                    ) : null;
                  })()}
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <Link
        href="/"
        className={`${linkPressable} block text-center text-sm text-dojo-muted hover:text-dojo-accent`}
      >
        ← 返回首页
      </Link>
    </div>
  );
}
