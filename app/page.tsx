"use client";

import Link from "next/link";
import { useState } from "react";

type Bias = "Bullish" | "Bearish" | "Neutral";

const assets: Array<{
  symbol: string;
  name: string;
  bias: Bias;
  price: string;
  change: string;
  summary: string;
  long: string;
  short: string;
  risk: string;
}> = [
  {
    symbol: "XAUUSD",
    name: "Gold",
    bias: "Bullish",
    price: "2,368.42",
    change: "+0.48%",
    summary: "Holding above the 2,350 pivot as real-yield pressure eases.",
    long: "Acceptance above 2,370",
    short: "Failure back below 2,350",
    risk: "US CPI · 14:30 SAST",
  },
  {
    symbol: "NAS100",
    name: "Nasdaq 100",
    bias: "Neutral",
    price: "20,486.30",
    change: "+0.12%",
    summary: "Compressed near highs; wait for breadth and range expansion.",
    long: "Break and hold above 20,520",
    short: "Loss of 20,390 support",
    risk: "Fed speakers · 16:00 SAST",
  },
  {
    symbol: "GER40",
    name: "GER40",
    bias: "Bearish",
    price: "18,422.10",
    change: "−0.31%",
    summary: "Lower highs persist while price remains below the weekly open.",
    long: "Reclaim of 18,510",
    short: "Rejection from 18,460–480",
    risk: "US open volatility",
  },
];

type IconName = "grid" | "brief" | "check" | "journal" | "chart" | "settings";

const navigation: Array<{ icon: IconName; label: string; href: string }> = [
  { icon: "grid", label: "Dashboard", href: "/" },
  { icon: "brief", label: "Daily Brief", href: "#" },
  { icon: "check", label: "Pre-trade Check", href: "/pre-trade-check" },
  { icon: "journal", label: "Trade Journal", href: "#" },
  { icon: "settings", label: "Behaviour Journal", href: "/behaviour-journal" },
  { icon: "chart", label: "Weekly Insights", href: "#" },
];

function Icon({ name }: { name: IconName }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    brief: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.6 2.6L16.5 9" /></>,
    journal: <><path d="M6 3h11a2 2 0 0 1 2 2v16H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M8 8h7M8 12h7M8 16h5" /></>,
    chart: <><path d="M4 19V5M4 19h16" /><path d="m7 15 4-4 3 2 5-6" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.1 2.1-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56v.08h-3v-.08A1.7 1.7 0 0 0 10.7 18.6a1.7 1.7 0 0 0-1.88.34l-.06.06-2.1-2.1.06-.06A1.7 1.7 0 0 0 7.06 15 1.7 1.7 0 0 0 5.5 14H5v-3h.5A1.7 1.7 0 0 0 7.06 10a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.1-2.1.06.06A1.7 1.7 0 0 0 10.7 6.36a1.7 1.7 0 0 0 1.03-1.56V4.7h3v.1a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.1 2.1-.06.06A1.7 1.7 0 0 0 19.4 10c.18.67.8 1.14 1.5 1.14h.1v3h-.1c-.7 0-1.32.47-1.5 1.14Z" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">{paths[name]}</svg>;
}

const biasStyles: Record<Bias, string> = {
  Bullish: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20",
  Bearish: "bg-rose-400/10 text-rose-300 ring-rose-400/20",
  Neutral: "bg-amber-300/10 text-amber-200 ring-amber-300/20",
};

export default function DashboardPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#080b10]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-white/[0.07] bg-[#0b0f16] px-4 py-6 lg:flex">
          <div className="mb-12 flex items-center gap-3 px-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500 text-sm font-black text-white">T</div>
            <div><p className="text-sm font-semibold tracking-tight text-white">Trade Decision OS</p><p className="text-[11px] text-slate-500">PRIVATE WORKSPACE</p></div>
          </div>
          <nav className="space-y-1 text-sm">
            {navigation.map(({ icon, label, href }) => (
              <Link href={href} key={label} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left ${label === "Dashboard" ? "bg-indigo-500/12 text-indigo-200" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
                <Icon name={icon} /><span>{label}</span>
              </Link>
            ))}
          </nav>
          <div className="mt-auto border-t border-white/[0.07] pt-4">
            <div className="mt-4 flex items-center gap-3 px-3"><div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 text-xs font-bold">M</div><div><p className="text-sm text-slate-200">Masigo</p><p className="text-xs text-slate-500">Private account</p></div></div>
          </div>
        </aside>

        {menuOpen && <button aria-label="Close navigation menu" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden" />}
        <aside aria-label="Mobile navigation" className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/[0.08] bg-[#0b0f16] px-4 py-6 shadow-2xl shadow-black/50 transition-transform duration-200 lg:hidden ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="mb-10 flex items-center justify-between px-2">
            <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500 text-sm font-black text-white">T</div><div><p className="text-sm font-semibold text-white">Trade Decision OS</p><p className="text-[11px] text-slate-500">PRIVATE WORKSPACE</p></div></div>
            <button aria-label="Close menu" onClick={() => setMenuOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
          </div>
          <nav className="space-y-1 text-sm">
            {navigation.map(({ icon, label, href }) => <Link onClick={() => setMenuOpen(false)} href={href} key={label} className={`flex items-center gap-3 rounded-lg px-3 py-3 ${label === "Dashboard" ? "bg-indigo-500/12 text-indigo-200" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}><Icon name={icon} /><span>{label}</span></Link>)}
          </nav>
          <div className="mt-auto flex items-center gap-3 border-t border-white/[0.07] px-3 pt-5"><div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 text-xs font-bold">M</div><div><p className="text-sm text-slate-200">Masigo</p><p className="text-xs text-slate-500">Private account</p></div></div>
        </aside>

        <section className="flex-1 px-5 py-6 sm:px-8 lg:px-10">
          <header className="mb-9 flex items-center justify-between">
            <div className="flex items-start gap-3"><button aria-label="Open navigation menu" onClick={() => setMenuOpen(true)} className="mt-1 grid h-10 w-10 place-items-center rounded-lg border border-white/[0.08] bg-[#0e131d] text-slate-300 transition hover:border-indigo-400/40 hover:text-white lg:hidden"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg></button><div><p className="mb-1 text-sm text-slate-500">Friday, 11 July 2026</p><h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Good morning, Masigo.</h1></div></div>
            <Link href="/pre-trade-check" className="rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400">New trade check</Link>
          </header>

          <section className="mb-8 overflow-hidden rounded-2xl border border-indigo-400/15 bg-gradient-to-br from-indigo-500/[0.13] via-[#121827] to-[#0d1119] p-6 sm:p-7">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
              <div className="max-w-3xl"><div className="mb-4 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-indigo-300" /><span className="text-xs font-medium uppercase tracking-[0.15em] text-indigo-200">Today&apos;s market brief</span></div><h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">Cautiously constructive, but conviction needs confirmation.</h2><p className="mt-3 text-sm leading-6 text-slate-300">Risk appetite is stable into US CPI, while price action remains selective. Gold holds a constructive structure; equity indices need clean range breaks before risk is added. Keep size modest around event risk.</p></div>
              <div className="min-w-48 rounded-xl border border-white/10 bg-black/10 p-4"><p className="text-xs uppercase tracking-wider text-slate-500">Session posture</p><p className="mt-2 text-lg font-semibold text-amber-200">Selective risk-on</p><p className="mt-1 text-xs leading-5 text-slate-400">Avoid forcing entries before CPI.</p></div>
            </div>
            <div className="mt-6 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3"><div><p className="text-xs text-slate-500">Longs supported by</p><p className="mt-1 text-sm text-slate-200">Higher lows and softer yields</p></div><div><p className="text-xs text-slate-500">Shorts supported by</p><p className="mt-1 text-sm text-slate-200">Failed breaks into event risk</p></div><div><p className="text-xs text-slate-500">Invalidation</p><p className="mt-1 text-sm text-slate-200">Broad USD strength after CPI</p></div></div>
          </section>

          <div className="mb-4 flex items-end justify-between"><div><h2 className="text-lg font-semibold text-white">Asset decision board</h2><p className="mt-1 text-sm text-slate-500">Your active markets, distilled into a decision.</p></div><button className="hidden text-sm text-indigo-300 sm:block">View all details →</button></div>
          <section className="grid gap-4 xl:grid-cols-3">
            {assets.map((asset) => <article key={asset.symbol} className="rounded-2xl border border-white/[0.08] bg-[#0e131d] p-5 shadow-xl shadow-black/10"><div className="flex items-start justify-between"><div><p className="text-xs font-medium tracking-wider text-slate-500">{asset.symbol}</p><h3 className="mt-1 text-lg font-semibold text-white">{asset.name}</h3></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${biasStyles[asset.bias]}`}>{asset.bias}</span></div><div className="mt-6 flex items-baseline gap-2"><span className="text-2xl font-semibold tracking-tight text-white">{asset.price}</span><span className={asset.change.startsWith("+") ? "text-xs font-medium text-emerald-300" : "text-xs font-medium text-rose-300"}>{asset.change}</span></div><p className="mt-4 min-h-10 text-sm leading-5 text-slate-400">{asset.summary}</p><div className="mt-5 space-y-3 border-t border-white/[0.07] pt-4 text-xs"><div className="flex justify-between gap-4"><span className="text-slate-500">Long trigger</span><span className="text-right text-emerald-200">{asset.long}</span></div><div className="flex justify-between gap-4"><span className="text-slate-500">Short trigger</span><span className="text-right text-rose-200">{asset.short}</span></div><div className="flex justify-between gap-4"><span className="text-slate-500">Key risk</span><span className="text-right text-amber-200">{asset.risk}</span></div></div><Link href={`/assets/${asset.symbol}`} className="mt-5 block w-full rounded-lg border border-white/[0.09] py-2 text-center text-sm font-medium text-slate-300 transition hover:border-indigo-400/40 hover:bg-indigo-400/5 hover:text-indigo-200">Open asset context</Link></article>)}
          </section>

          <section className="mt-8 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="rounded-2xl border border-white/[0.08] bg-[#0e131d] p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold text-white">Today&apos;s focus</h2><p className="mt-1 text-sm text-slate-500">The small number of things worth waiting for.</p></div><span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-xs text-slate-400">3 events</span></div><div className="mt-5 divide-y divide-white/[0.07]">{[["14:30", "US CPI release", "High impact", "Stay flat into the number"], ["16:00", "Fed speaker: Williams", "Medium impact", "Watch yield and dollar reaction"], ["16:30", "US cash equity open", "High impact", "Look for NAS100 range resolution"]].map(([time, title, impact, note]) => <div key={title} className="grid grid-cols-[52px_1fr] gap-3 py-4 first:pt-0"><span className="pt-0.5 text-xs font-medium text-indigo-300">{time}</span><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium text-slate-200">{title}</p><span className="text-[11px] text-amber-200">{impact}</span></div><p className="mt-1 text-xs text-slate-500">{note}</p></div></div>)}</div></div>
            <div className="rounded-2xl border border-emerald-400/15 bg-gradient-to-b from-emerald-400/[0.10] to-[#0e131d] p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.15em] text-emerald-300">Trader readiness</p><h2 className="mt-1 text-lg font-semibold text-white">You&apos;re clear to trade</h2></div><div className="grid h-12 w-12 place-items-center rounded-full border-4 border-emerald-400 text-sm font-bold text-emerald-200">82</div></div><p className="mt-4 text-sm leading-5 text-slate-400">Good baseline. Keep your risk small while CPI is pending.</p><div className="mt-5 space-y-3"><div><div className="mb-1.5 flex justify-between text-xs"><span className="text-slate-400">Sleep &amp; energy</span><span className="text-emerald-200">8/10</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[80%] rounded-full bg-emerald-400" /></div></div><div><div className="mb-1.5 flex justify-between text-xs"><span className="text-slate-400">Emotional state</span><span className="text-emerald-200">Calm</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[82%] rounded-full bg-emerald-400" /></div></div><div><div className="mb-1.5 flex justify-between text-xs"><span className="text-slate-400">Plan alignment</span><span className="text-emerald-200">Complete</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-full rounded-full bg-emerald-400" /></div></div></div><button className="mt-6 w-full rounded-lg bg-emerald-400 py-2.5 text-sm font-semibold text-[#06251d] transition hover:bg-emerald-300">Complete readiness check</button></div>
          </section>
        </section>
      </div>
    </main>
  );
}
