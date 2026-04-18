"use client";

import { useEffect, useState } from "react";

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

type Props = {
  value: number;
  durationMs?: number;
  className?: string;
};

export function AnimatedScore({
  value,
  durationMs = 1400,
  className,
}: Props) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    setDisplay(0);
    let cancelled = false;
    const start = performance.now();

    const loop = (now: number) => {
      if (cancelled) return;
      const t = Math.min((now - start) / durationMs, 1);
      setDisplay(Math.round(easeOutCubic(t) * value));
      if (t < 1) requestAnimationFrame(loop);
    };

    const id = requestAnimationFrame(loop);
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [value, durationMs]);

  return <span className={className}>{display}</span>;
}
