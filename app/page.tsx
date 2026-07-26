"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";

type Bias = "Bullish" | "Bearish" | "Neutral";

const assets: Array<{
  symbol: string;
  name: string;
  bias: Bias;
  price: string;
  change: string;
  summary: string;
  constructive: string;
  defensive: string;
  risk: string;
}> = [
  { symbol: "XAUUSD", name: "Gold", bias: "Bullish", price: "2,368.42", change: "+0.48%", summary: "Holding above the 2,350 pivot as real-yield pressure eases.", constructive: "Acceptance above 2,370", defensive: "Failure back below 2,350", risk: "US CPI · 14:30 SAST" },
  { symbol: "NAS100", name: "Nasdaq 100", bias: "Neutral", price: "20,486.30", change: "+0.12%", summary: "Compressed near recent highs; breadth and range expansion remain the key confirmation.", constructive: "Hold above 20,520", defensive: "Loss of 20,390 support", risk: "Fed speakers · 16:00 SAST" },
  { symbol: "GER40", name: "GER40", bias: "Bearish", price: "18,422.10", change: "−0.31%", summary: "Lower highs persist while price remains below the weekly open.", constructive: "Reclaim of 18,510", defensive: "Rejection at 18,460–480", risk: "US open volatility" },
];

const biasStyles: Record<Bias, string> = {
  Bullish: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20",
  Bearish: "bg-rose-400/10 text-rose-300 ring-rose-400/20",
  Neutral: "bg-amber-300/10 text-amber-200 ring-amber-300/20",
};

const events = [
  { time: "14:30", title: "US CPI release", impact: "High", note: "Stay patient into the release." },
  { time: "16:00", title: "Fed speaker · Williams", impact: "Medium", note: "Watch yields and dollar reaction." },
  { time: "16:30", title: "US cash equity open", impact: "High", note: "Observe NAS100 range resolution." },
];

export default function DashboardPage() {
  const today = new Intl.DateTimeFormat("en-ZA", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return <AppShell>
    <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Decision dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-white sm:text-[2.15rem]">Today&apos;s trading context</h1>
        <p className="mt-2 text-sm text-slate-500">{today} · Context, readiness, and risk in one view.</p>
      </div>
      <Link href="/pre-trade-check" className="inline-flex h-11 items-center justify-center rounded-xl bg-violet-500 px-4 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-400">Start pre-trade check</Link>
    </header>

    <section className="surface-highlight overflow-hidden p-5 sm:p-7">
      <div className="grid gap-7 lg:grid-cols-[minmax(0,1.65fr)_minmax(240px,0.55fr)]">
        <div>
          <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-violet-300" /><p className="eyebrow text-violet-200">Today&apos;s market brief</p></div>
          <h2 className="mt-4 max-w-3xl text-2xl font-semibold leading-tight tracking-[-0.025em] text-white">Cautiously constructive. Confirmation still matters.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">Risk appetite is stable into US CPI, while price action remains selective. Gold retains a constructive structure; equity indices still need clean range resolution. Keep exposure measured around event risk.</p>
          <div className="mt-6 grid gap-4 border-t border-white/[0.08] pt-5 sm:grid-cols-3">
            <ContextItem label="Constructive when" value="Higher lows hold as yields soften" />
            <ContextItem label="Defensive when" value="Breaks fail into event risk" />
            <ContextItem label="Context changes if" value="The USD strengthens broadly" />
          </div>
        </div>
        <aside className="rounded-2xl border border-white/[0.08] bg-black/15 p-5">
          <p className="eyebrow text-slate-500">Session posture</p>
          <p className="mt-3 text-lg font-semibold text-amber-200">Selective risk-on</p>
          <p className="mt-2 text-sm leading-5 text-slate-500">Prioritise clear confirmation. Avoid forcing an idea before CPI.</p>
          <div className="mt-5 flex items-center gap-2 border-t border-white/[0.07] pt-4 text-xs text-slate-500"><span className="h-2 w-2 rounded-full bg-amber-300" />High-impact event pending</div>
        </aside>
      </div>
    </section>

    <div className="mt-9 mb-4 flex items-end justify-between gap-4">
      <div><p className="eyebrow text-slate-600">Market coverage</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-white">Asset decision board</h2></div>
      <p className="hidden text-sm text-slate-600 sm:block">3 active markets</p>
    </div>
    <section className="grid items-stretch gap-4 lg:grid-cols-3">
      {assets.map((asset) => <article key={asset.symbol} className="surface group flex min-w-0 flex-col p-5 transition duration-200 hover:-translate-y-0.5 hover:border-white/[0.13]">
        <div className="flex items-start justify-between gap-3">
          <div><p className="eyebrow text-slate-600">{asset.symbol}</p><h3 className="mt-1 text-lg font-semibold tracking-[-0.015em] text-white">{asset.name}</h3></div>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${biasStyles[asset.bias]}`}>{asset.bias}</span>
        </div>
        <div className="mt-6 flex items-baseline gap-2"><span className="text-2xl font-semibold tracking-[-0.03em] text-white">{asset.price}</span><span className={asset.change.startsWith("+") ? "text-xs font-medium text-emerald-300" : "text-xs font-medium text-rose-300"}>{asset.change}</span></div>
        <p className="mt-3 min-h-[4.5rem] text-sm leading-6 text-slate-500">{asset.summary}</p>
        <dl className="mt-5 space-y-3 border-t border-white/[0.07] pt-4 text-xs">
          <AssetRow label="Constructive if" value={asset.constructive} tone="text-emerald-200" />
          <AssetRow label="Defensive if" value={asset.defensive} tone="text-rose-200" />
          <AssetRow label="Key risk" value={asset.risk} tone="text-amber-200" />
        </dl>
        <Link href={`/assets/${asset.symbol}`} className="mt-5 flex h-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-sm font-medium text-slate-300 transition hover:border-violet-400/30 hover:bg-violet-400/[0.06] hover:text-violet-200">View market context <span className="ml-2 text-slate-600 transition group-hover:translate-x-0.5">→</span></Link>
      </article>)}
    </section>

    <section className="mt-8 grid items-stretch gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.6fr)]">
      <article className="surface p-5 sm:p-6">
        <div className="flex items-center justify-between"><div><p className="eyebrow text-slate-600">Event radar</p><h2 className="mt-1 text-lg font-semibold text-white">Today&apos;s focus</h2></div><span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[11px] text-slate-500">3 events</span></div>
        <div className="mt-5 divide-y divide-white/[0.07]">{events.map((event) => <div key={event.title} className="grid grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-3 py-4 first:pt-0 last:pb-0"><span className="text-xs font-semibold text-violet-300">{event.time}</span><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-200">{event.title}</p><p className="mt-1 truncate text-xs text-slate-600">{event.note}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${event.impact === "High" ? "bg-amber-300/10 text-amber-200" : "bg-slate-400/10 text-slate-400"}`}>{event.impact}</span></div>)}</div>
      </article>
      <article className="surface overflow-hidden p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><p className="eyebrow text-emerald-300">Trader readiness</p><h2 className="mt-1 text-lg font-semibold text-white">Strong baseline</h2></div><div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-[5px] border-emerald-400/80 bg-emerald-400/[0.06] text-sm font-bold text-emerald-200">82</div></div>
        <p className="mt-3 text-sm leading-5 text-slate-500">Your state supports disciplined decisions. Keep risk measured while CPI is pending.</p>
        <div className="mt-5 space-y-3"><ReadinessBar label="Sleep & energy" value="8/10" width="80%" /><ReadinessBar label="Emotional state" value="Calm" width="82%" /><ReadinessBar label="Plan alignment" value="Complete" width="100%" /></div>
        <Link href="/behaviour-journal" className="mt-6 flex h-10 items-center justify-center rounded-xl bg-emerald-400 text-sm font-semibold text-[#06251d] transition hover:bg-emerald-300">Update readiness</Link>
      </article>
    </section>
  </AppShell>;
}

function ContextItem({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[11px] font-medium text-slate-600">{label}</p><p className="mt-1 text-sm leading-5 text-slate-200">{value}</p></div>;
}

function AssetRow({ label, value, tone }: { label: string; value: string; tone: string }) {
  return <div className="grid grid-cols-[90px_minmax(0,1fr)] gap-3"><dt className="text-slate-600">{label}</dt><dd className={`text-right leading-5 ${tone}`}>{value}</dd></div>;
}

function ReadinessBar({ label, value, width }: { label: string; value: string; width: string }) {
  return <div><div className="mb-1.5 flex justify-between text-xs"><span className="text-slate-500">{label}</span><span className="font-medium text-emerald-200">{value}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-emerald-400" style={{ width }} /></div></div>;
}
