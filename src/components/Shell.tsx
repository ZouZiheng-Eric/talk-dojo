"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { ToastProvider } from "@/components/ToastProvider";
import { linkPressable } from "@/lib/ui";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative min-h-dvh bg-dojo-void bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(201,169,98,0.12),transparent_55%),radial-gradient(ellipse_80%_50%_at_100%_100%,rgba(125,211,192,0.06),transparent_45%),linear-gradient(180deg,rgba(18,18,26,0.9)_0%,rgba(10,10,15,1)_100%)]"
    >
      <ToastProvider>
        <header className="sticky top-0 z-40 border-b border-dojo-line/40 bg-dojo-void/80 backdrop-blur-md">
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
        <main className="mx-auto max-w-lg px-4 pb-8 pt-4">
          <PageTransition>{children}</PageTransition>
        </main>
      </ToastProvider>
    </div>
  );
}
