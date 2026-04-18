"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { btnPrimary, glassPanel, inputField } from "@/lib/ui";

export default function HomePage() {
  const router = useRouter();
  const [link, setLink] = useState("");

  const start = () => {
    const q = encodeURIComponent(link.trim() || "https://example.com/video");
    router.push(`/parse?url=${q}`);
  };

  return (
    <div className="flex flex-col gap-8 pt-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="space-y-3"
      >
        <p className="text-xs uppercase tracking-[0.25em] text-dojo-accent">
          高压对话 · 模拟训练
        </p>
        <h1 className="font-display text-3xl font-semibold leading-tight text-dojo-text">
          贴一条短视频链接
          <br />
          <span className="text-dojo-gold/90">练到敢回嘴</span>
        </h1>
        <p className="text-sm leading-relaxed text-dojo-muted">
          解析语境 → 三轮对话 → 战报与金句。
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.45 }}
        className={`${glassPanel} space-y-4 p-5`}
      >
        <label className="block text-xs font-medium text-dojo-muted">
          短视频链接
        </label>
        <input
          className={inputField}
          placeholder="粘贴短视频链接"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && start()}
        />
        <motion.button
          type="button"
          className={`${btnPrimary} w-full`}
          onClick={start}
          whileTap={{ scale: 0.98 }}
        >
          开始训练
        </motion.button>
      </motion.div>

    </div>
  );
}
