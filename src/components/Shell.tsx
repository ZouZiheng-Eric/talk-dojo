"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ToastProvider } from "@/components/ToastProvider";
import { linkPressable } from "@/lib/ui";

const HEADER_ROW_CLASS =
  "mx-auto flex w-full max-w-2xl items-center px-5 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]";

/** 首页整页背景：顶栏与主内容共用，避免「顶栏长条 + 内容区」拼接感 */
function HomeBackdrop() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#061312] via-[#0c2e2c] via-[42%] via-[#134a47] via-[68%] to-[#5eb8d4]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_85%_at_50%_108%,rgba(120,214,232,0.42),transparent_52%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-10%,rgba(255,255,255,0.06),transparent_45%)]"
      />
    </>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const favoritesLink = (
    <Link
      href="/favorites"
      className={`${linkPressable} block text-sm underline-offset-4 ${
        isHome
          ? "text-white/75 hover:text-white hover:underline"
          : "text-dojo-muted transition-colors hover:text-dojo-accent"
      }`}
    >
      我的收藏
    </Link>
  );

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden bg-dojo-void">
      <ToastProvider>
        {isHome ? (
          <div className="relative flex min-h-dvh flex-1 flex-col overflow-x-hidden text-white">
            <HomeBackdrop />
            <header className="relative z-40 shrink-0 border-b border-white/[0.07] bg-[#061312]/20 backdrop-blur-md supports-[backdrop-filter]:bg-[#061312]/12">
              <div className={`${HEADER_ROW_CLASS} justify-end`}>
                <nav className="flex gap-4">{favoritesLink}</nav>
              </div>
            </header>
            <main className="relative z-10 mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col overflow-x-hidden px-0">
              {children}
            </main>
          </div>
        ) : (
          <>
            <header className="sticky top-0 z-40 border-b border-dojo-line/80 bg-dojo-ink/85 backdrop-blur-md supports-[backdrop-filter]:bg-dojo-ink/72">
              <div className={`${HEADER_ROW_CLASS} justify-between`}>
                <Link
                  href="/"
                  className={`${linkPressable} flex flex-col leading-tight`}
                >
                  <motion.span
                    className="font-display text-lg font-semibold tracking-tight text-dojo-gold"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    回怼道场
                  </motion.span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-dojo-muted">
                    Talk Dojo
                  </span>
                </Link>
                <nav className="flex gap-4">{favoritesLink}</nav>
              </div>
            </header>
            <main className="mx-auto w-full max-w-2xl px-5 pb-10 pt-5">
              {children}
            </main>
          </>
        )}
      </ToastProvider>
    </div>
  );
}
