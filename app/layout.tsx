import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trade Decision OS",
  description: "A disciplined trading decision workflow.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
