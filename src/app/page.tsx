"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { btnPrimary, glassPanel, inputField } from "@/lib/ui";

const SCENE_ENTRIES = [
  { id: "boss", label: "老板/导师" },
  { id: "roommate", label: "同学/室友" },
  { id: "relative", label: "烦人亲戚" },
  { id: "racist", label: "海外 racist" },
] as const;

function SceneIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className="h-6 w-6 text-blue-500"
      aria-hidden
    >
      <path
        d="M4 16.5V7.5M8 14V10M12 18V6M16 13V11M20 15V9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M3 19h18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.65"
      />
    </svg>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [link, setLink] = useState("");

  const startImport = () => {
    const q = encodeURIComponent(link.trim() || "https://example.com/video");
    router.push(`/parse?url=${q}`);
  };
  const goSceneSetup = (sceneId: string) => {
    router.push(`/scene?scene=${sceneId}`);
  };
  const subtitle = useMemo(
    () => "先选场景开练，或继续用链接导入语境。",
    []
  );

  return (
    <div className="flex flex-col gap-6 pt-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-3"
      >
        <p className="text-xs uppercase tracking-[0.25em] text-dojo-accent">
          高压对话 · 模拟训练
        </p>
        <h1 className="font-display text-3xl font-semibold leading-tight text-dojo-text">
          选择场景
          <br />
          <span className="text-dojo-gold/90">直接开练</span>
        </h1>
        <p className="text-sm leading-relaxed text-dojo-muted">
          {subtitle}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-3">
          {SCENE_ENTRIES.map((scene) => (
            <button
              key={scene.id}
              type="button"
              className="rounded-2xl bg-white p-4 text-left text-slate-900 shadow-md ring-1 ring-blue-100 transition-colors hover:bg-blue-50 active:bg-blue-100"
              onClick={() => goSceneSetup(scene.id)}
            >
              <SceneIcon />
              <p className="mt-3 text-sm font-semibold">{scene.label}</p>
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.3 }}
        className={`${glassPanel} space-y-4 p-5`}
      >
        <label className="block text-xs font-medium text-dojo-muted">
          或从链接导入语境
        </label>
        <input
          className={inputField}
          placeholder="粘贴短视频链接"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && startImport()}
        />
        <motion.button
          type="button"
          className={`${btnPrimary} w-full`}
          onClick={startImport}
          whileTap={{ scale: 0.94 }}
          transition={{ type: "spring", stiffness: 480, damping: 26 }}
        >
          链接导入并开始训练
        </motion.button>
      </motion.div>
    </div>
  );
}
