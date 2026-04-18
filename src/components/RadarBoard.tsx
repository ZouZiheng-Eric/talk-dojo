"use client";

import { motion } from "framer-motion";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { ReportScores } from "@/lib/types";
import { glassPanel } from "@/lib/ui";
import {
  overallToPerformanceTier,
  performanceTierTone,
} from "@/lib/performanceTier";

const LABELS: Record<keyof ReportScores, string> = {
  boundary: "🛡️ 边界意识",
  pushback: "⚔️ 反弹力度",
  logic: "🧠 逻辑闭环",
  sarcasm: "🍵 阴阳段位",
  zen: "🧘 情绪内核",
};

const ORDER: (keyof ReportScores)[] = [
  "boundary",
  "pushback",
  "logic",
  "sarcasm",
  "zen",
];

type Props = { scores: ReportScores };

export function RadarBoard({ scores }: Props) {
  const data = ORDER.map((k) => ({
    subject: LABELS[k],
    value: scores[k],
    fullMark: 100,
  }));

  return (
    <motion.div
      className={`${glassPanel} h-[280px] w-full overflow-hidden p-2`}
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.08 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="52%" outerRadius="72%" data={data}>
          <PolarGrid stroke="#2a2a3d" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#8a8794", fontSize: 9 }}
          />
          <PolarRadiusAxis
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ stroke: "#c9a962", strokeOpacity: 0.35 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload as {
                subject?: string;
                value?: number;
              };
              const v = Number(row.value);
              const tier = overallToPerformanceTier(
                Number.isFinite(v) ? v : 0
              );
              return (
                <div className="rounded-lg border border-dojo-line/80 bg-dojo-ink/95 px-3 py-2 text-left text-xs shadow-xl backdrop-blur-sm">
                  <p className="text-[10px] text-dojo-muted">{row.subject}</p>
                  <p
                    className={`mt-0.5 font-display text-sm font-semibold ${performanceTierTone(tier)}`}
                  >
                    {tier}
                  </p>
                </div>
              );
            }}
          />
          <Radar
            name="档位"
            dataKey="value"
            stroke="#c9a962"
            fill="#c9a962"
            fillOpacity={0.35}
            isAnimationActive
            animationBegin={200}
            animationDuration={1100}
            animationEasing="ease-out"
          />
        </RadarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
