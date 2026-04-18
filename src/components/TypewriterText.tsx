"use client";

import { useEffect, useState } from "react";

type Props = {
  text: string;
  /** 每个字的间隔 ms，中文按字 */
  speedMs?: number;
  className?: string;
};

export function TypewriterText({ text, speedMs = 28, className }: Props) {
  const [shown, setShown] = useState("");

  useEffect(() => {
    setShown("");
    if (!text) return;

    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, speedMs);

    return () => window.clearInterval(id);
  }, [text, speedMs]);

  const done = shown.length >= text.length;

  return (
    <span className={className}>
      {shown}
      {!done && text ? (
        <span className="ml-0.5 inline-block w-0.5 animate-pulse text-dojo-accent">
          |
        </span>
      ) : null}
    </span>
  );
}
