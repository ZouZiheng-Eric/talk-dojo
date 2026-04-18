"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { btnPrimary, glassPanel, inputField, linkPressable } from "@/lib/ui";

const SCENE_LABELS: Record<string, string> = {
  boss: "老板/导师",
  roommate: "同学/室友",
  relative: "烦人亲戚",
  racist: "海外 racist",
};

function SceneSetupInner() {
  const router = useRouter();
  const search = useSearchParams();
  const scene = search.get("scene") || "boss";
  const initialOpponent = search.get("opponent") || "";
  const sceneLabel = SCENE_LABELS[scene] ?? SCENE_LABELS.boss;
  const [opponentHint, setOpponentHint] = useState(initialOpponent);
  const trainHref = useMemo(() => {
    const hint = opponentHint.trim();
    const q = hint ? `&opponent=${encodeURIComponent(hint)}` : "";
    return `/train?scene=${scene}${q}`;
  }, [opponentHint, scene]);

  return (
    <div className="flex flex-col gap-6 pt-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <p className="text-xs uppercase tracking-[0.22em] text-dojo-accent">
          场景设置
        </p>
        <h1 className="font-display text-2xl font-semibold text-dojo-text">
          补充对方特征
        </h1>
        <p className="text-sm text-dojo-muted">已选择场景：{sceneLabel}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.03 }}
        className={`${glassPanel} space-y-3 p-4`}
      >
        <label className="block text-xs font-medium text-dojo-muted">
          可选：对方特征
        </label>
        <input
          className={inputField}
          placeholder="如：强势、爱打断、阴阳怪气"
          value={opponentHint}
          onChange={(e) => setOpponentHint(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && router.push(trainHref)}
        />
      </motion.div>

      <motion.button
        type="button"
        className={`${btnPrimary} w-full`}
        onClick={() => router.push(trainHref)}
        whileTap={{ scale: 0.94 }}
      >
        进入训练舱
      </motion.button>

      <Link href="/" className={`${linkPressable} text-center text-sm text-dojo-muted`}>
        返回场景列表
      </Link>
    </div>
  );
}

export default function SceneSetupPage() {
  return (
    <Suspense
      fallback={<div className="py-20 text-center text-sm text-dojo-muted">加载场景设置…</div>}
    >
      <SceneSetupInner />
    </Suspense>
  );
}

