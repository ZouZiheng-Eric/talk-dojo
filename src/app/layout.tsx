import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = {
  title: "回怼道场 Talk Dojo",
  description: "回怼道场",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0d9488",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen overflow-x-hidden bg-dojo-void font-sans text-dojo-text antialiased [-webkit-tap-highlight-color:transparent]">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
