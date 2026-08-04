import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trade Decision OS",
  description: "A disciplined trading decision workflow.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#090b10",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
