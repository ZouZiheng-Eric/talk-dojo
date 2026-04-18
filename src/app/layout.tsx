import type { Metadata, Viewport } from "next";
import { DM_Sans, Outfit } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/Shell";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "回嘴道场 Talk Dojo",
  description: "回嘴道场",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a0f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${outfit.variable} ${dmSans.variable}`}>
      <body className="min-h-screen bg-dojo-void font-sans text-dojo-text antialiased [-webkit-tap-highlight-color:transparent]">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
