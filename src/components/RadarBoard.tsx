"use client";

import { motion } from "framer-motion";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import type { ReportScores } from "@/lib/types";
import { glassPanel } from "@/lib/ui";

const LABELS: Record<keyof ReportScores, string> = {
  composure: "镇定",
  logic: "逻辑",
  boundary: "边界",
  empathy: "共情",
  punch: "回击",
};

type Props = { scores: ReportScores };

export function RadarBoard({ scores }: Props) {
  const data = (Object.keys(scores) as (keyof ReportScores)[]).map((k) => ({
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
            tick={{ fill: "#8a8794", fontSize: 11 }}
          />
          <Radar
            name="得分"
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
