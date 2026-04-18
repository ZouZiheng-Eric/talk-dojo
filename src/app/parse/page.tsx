"use client";

import { useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { mockParse } from "@/lib/mock";
import Link from "next/link";
import { glassPanel, linkPressable } from "@/lib/ui";

function ParseInner() {
  const search = useSearchParams();
  const url = useMemo(() => {
    const u = search.get("url");
    return u ? decodeURIComponent(u) : "";
  }, [search]);

  const parsed = useMemo(() => mockParse(url), [url]);
  const trainHref = `/train?url=${encodeURIComponent(url || "https://example.com/video")}`;

  return (
    <div className="flex flex-col gap-6 pb-10 pt-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <p className="text-xs text-dojo-cyan">解析完成</p>
        <h2 className="mt-2 font-display text-xl text-dojo-gold">语境画像</h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className={`${glassPanel} divide-y divide-dojo-line/40 overflow-hidden`}
      >
        {[
          { k: "标题", v: parsed.title },
          { k: "冲突", v: parsed.conflict },
          { k: "高频评论", v: parsed.hotComment },
        ].map((row, i) => (
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
      </motion.div>

      <Link
        href={trainHref}
        className={`${linkPressable} flex min-h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-dojo-accent to-dojo-coral px-4 py-4 text-center text-base font-semibold text-white no-underline shadow-lg shadow-dojo-accent/30 ring-1 ring-white/15 hover:brightness-105 active:brightness-95`}
      >
        进入训练
      </Link>
    </div>
  );
}

export default function ParsePage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-sm text-dojo-muted">加载中…</div>
      }
    >
      <ParseInner />
    </Suspense>
  );
}
