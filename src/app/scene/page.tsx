"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * 旧「场景设置」已下线：保留路由以便书签/外链，统一跳到训练入场（语音准备页）。
 */
function SceneRedirectInner() {
  const router = useRouter();
  const search = useSearchParams();

  useEffect(() => {
    const sceneRaw = search.get("scene") || "boss";
    const scene = sceneRaw === "roommate" ? "colleague" : sceneRaw;
    const q = new URLSearchParams();
    q.set("scene", scene);
    const opponent = search.get("opponent")?.trim();
    if (opponent) q.set("opponent", opponent);
    const authority = search.get("authority");
    if (authority === "boss" || authority === "mentor") {
      q.set("authority", authority);
    }
    const peer = search.get("peer");
    if (peer === "classmate") {
      q.set("peer", "classmate");
    } else if (peer === "colleague" || peer === "roommate") {
      q.set("peer", "colleague");
    }
    router.replace(`/train?${q.toString()}`);
  }, [router, search]);

  return (
    <div className="py-20 text-center text-sm text-dojo-muted">正在进入训练…</div>
  );
}

export default function SceneRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-sm text-dojo-muted">加载中…</div>
      }
    >
      <SceneRedirectInner />
    </Suspense>
  );
}
