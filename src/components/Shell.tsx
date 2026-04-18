"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ToastProvider } from "@/components/ToastProvider";
import { linkPressable } from "@/lib/ui";

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div className="relative min-h-dvh bg-dojo-void">
      <ToastProvider>
        {!isHome ? (
          <header className="sticky top-0 z-40 border-b border-dojo-line/80 bg-dojo-ink/85 backdrop-blur-md supports-[backdrop-filter]:bg-dojo-ink/72">
            <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
              <Link
                href="/"
                className={`${linkPressable} flex flex-col leading-tight`}
              >
                <motion.span
                  className="font-display text-lg font-semibold tracking-tight text-dojo-gold"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  回嘴道场
                </motion.span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-dojo-muted">
                  Talk Dojo
                </span>
              </Link>
              <nav className="flex gap-4 text-sm">
                <Link
                  href="/favorites"
                  className={`${linkPressable} block text-dojo-muted transition-colors hover:text-dojo-accent`}
                >
                  我的收藏
                </Link>
              </nav>
            </div>
          </header>
        ) : null}
        <main
          className={
            isHome
              ? "mx-auto min-h-dvh max-w-lg"
              : "mx-auto max-w-lg px-4 pb-8 pt-4"
          }
        >
          {children}
        </main>
      </ToastProvider>
    </div>
  );
}
