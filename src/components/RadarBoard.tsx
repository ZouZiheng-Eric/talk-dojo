"use client";

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
    <div className={`${glassPanel} h-[280px] w-full p-2`}>
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
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
