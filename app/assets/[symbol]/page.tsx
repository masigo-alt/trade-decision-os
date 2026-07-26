"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

type Bias = "Bullish" | "Bearish" | "Neutral" | "Mixed";

type AssetBrief = {
  name: string;
  symbol: string;
  bias: Bias;
  conviction: number;
  macro: string;
  sentiment: string;
  priceBehaviour: string;
  longConditions: string[];
  shortConditions: string[];
  invalidation: string;
  riskEvents: string[];
  summary: string;
};

const briefs: Record<string, AssetBrief> = {
  XAUUSD: {
    name: "Gold",
    symbol: "XAUUSD",
    bias: "Bullish",
    conviction: 74,
    macro: "Softer real-yield pressure and continued uncertainty around growth keep gold supported, though the dollar response to US data remains the near-term swing factor.",
    sentiment: "Positioning is constructive rather than euphoric. Demand for defensive exposure is present, but event-driven reversals remain possible.",
    priceBehaviour: "Price is holding above the 2,350 pivot with higher lows on the intraday structure. Momentum needs sustained acceptance above nearby resistance to broaden the recovery.",
    longConditions: ["Price accepts and holds above 2,370 after a retest.", "Real yields and the dollar soften together.", "A pullback respects the 2,350 area and buyers reclaim momentum."],
    shortConditions: ["Price fails repeatedly at 2,370–2,380 and closes back below 2,350.", "A stronger dollar and rising yields shift the macro response.", "The higher-low structure breaks with expanding downside momentum."],
    invalidation: "The constructive scenario is weakened by sustained acceptance below 2,350, especially if accompanied by broad dollar strength and rising real yields.",
    riskEvents: ["US CPI release · 14:30 SAST", "US real-yield and dollar reaction", "Unexpected central-bank commentary"],
    summary: "Context currently favours patience for constructive price acceptance rather than chasing an extended move. The key decision point is whether price can maintain structure above 2,350 around US data.",
  },
  NAS100: {
    name: "Nasdaq 100",
    symbol: "NAS100",
    bias: "Mixed",
    conviction: 58,
    macro: "Growth expectations remain resilient, but elevated valuation sensitivity leaves the index exposed to any sharp repricing in yields or policy expectations.",
    sentiment: "Risk appetite is stable but selective. Participation needs to broaden before a move away from the current range carries stronger conviction.",
    priceBehaviour: "The index is compressed near recent highs and rotating around the 20,450 area. Neither side has established a decisive range expansion yet.",
    longConditions: ["A break above 20,520 holds through the cash-session open.", "Market breadth improves while yields remain contained.", "A pullback finds support above 20,390 and reclaims the range midpoint."],
    shortConditions: ["Price loses 20,390 with follow-through during the cash session.", "Yields rise sharply and higher-beta participation deteriorates.", "An upside break fails quickly and price returns inside the prior range."],
    invalidation: "The neutral-to-mixed context changes only with sustained acceptance outside the current range. Avoid treating a single wick or headline move as confirmation.",
    riskEvents: ["US CPI release · 14:30 SAST", "Fed speaker: Williams · 16:00 SAST", "US cash equity open · 16:30 SAST"],
    summary: "This is a range-resolution environment. A disciplined approach waits for price, breadth, and rates to align before assigning greater weight to either scenario.",
  },
  GER40: {
    name: "GER40",
    symbol: "GER40",
    bias: "Bearish",
    conviction: 65,
    macro: "European growth concerns and sensitivity to global risk appetite keep the index vulnerable when external conditions tighten.",
    sentiment: "Sentiment is cautious after repeated failed recoveries. A stronger global risk tone would need to persist to change that posture.",
    priceBehaviour: "Lower highs remain intact while price trades below the weekly open. The 18,460–18,480 area is acting as near-term decision resistance.",
    longConditions: ["Price reclaims 18,510 and holds above the weekly open.", "Global equity sentiment improves and the euro does not strengthen sharply.", "A higher low forms above 18,420 with improving participation."],
    shortConditions: ["A rejection from 18,460–18,480 keeps the lower-high structure intact.", "Price breaks below 18,420 with momentum into the US session.", "Broader risk appetite weakens and cyclical sectors underperform."],
    invalidation: "The bearish context is weakened by sustained acceptance above 18,510 and a clear reclaim of the weekly open.",
    riskEvents: ["US cash equity open", "European growth and inflation headlines", "Euro and global risk-sentiment moves"],
    summary: "The current structure remains cautious while price is below the weekly open. The more useful scenario is to observe whether resistance holds, rather than anticipate a move before it develops.",
  },
};

const biasStyle: Record<Bias, string> = {
  Bullish: "bg-emerald-400/10 text-emerald-200 ring-emerald-400/20",
  Bearish: "bg-rose-400/10 text-rose-200 ring-rose-400/20",
  Neutral: "bg-amber-300/10 text-amber-100 ring-amber-300/20",
  Mixed: "bg-indigo-400/10 text-indigo-200 ring-indigo-400/20",
};

function ScenarioList({ title, tone, items }: { title: string; tone: "long" | "short"; items: string[] }) {
  return <section className={`rounded-2xl border p-5 ${tone === "long" ? "border-emerald-400/15 bg-emerald-400/[0.045]" : "border-rose-400/15 bg-rose-400/[0.045]"}`}><p className={`text-xs font-medium uppercase tracking-[0.15em] ${tone === "long" ? "text-emerald-300" : "text-rose-300"}`}>{title}</p><ul className="mt-4 space-y-3">{items.map((item) => <li key={item} className="flex gap-3 text-sm leading-5 text-slate-300"><span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${tone === "long" ? "bg-emerald-300" : "bg-rose-300"}`} />{item}</li>)}</ul></section>;
}

export default function AssetDetailPage() {
  const params = useParams<{ symbol: string }>();
  const brief = briefs[params.symbol?.toUpperCase()];

  if (!brief) return <main className="grid min-h-screen place-items-center bg-[#080b10] p-6 text-center"><div><p className="text-sm text-slate-500">Asset not found</p><Link href="/" className="mt-3 inline-block text-indigo-300">← Return to dashboard</Link></div></main>;

  return <main className="min-h-screen bg-[#080b10] px-5 py-6 text-slate-100 sm:px-8 lg:px-10"><div className="mx-auto max-w-6xl"><header className="mb-8"><Link href="/" className="text-sm text-indigo-300 transition hover:text-indigo-200">← Dashboard</Link><div className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Asset context</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">{brief.name} <span className="text-slate-500">/ {brief.symbol}</span></h1></div><div className="flex items-center gap-3"><span className={`rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ${biasStyle[brief.bias]}`}>{brief.bias} context</span><div className="rounded-xl border border-white/10 bg-[#0e131d] px-4 py-2 text-right"><p className="text-[11px] uppercase tracking-wider text-slate-500">Conviction</p><p className="text-lg font-semibold text-white">{brief.conviction}<span className="text-xs text-slate-500">/100</span></p></div></div></div></header>

    <section className="rounded-2xl border border-indigo-400/15 bg-gradient-to-br from-indigo-500/[0.12] via-[#121827] to-[#0d1119] p-6"><p className="text-xs font-medium uppercase tracking-[0.15em] text-indigo-200">Decision-support summary</p><p className="mt-3 max-w-4xl text-lg leading-7 text-slate-100">{brief.summary}</p></section>

    <div className="mt-5 grid gap-5 lg:grid-cols-3"><section className="rounded-2xl border border-white/[0.08] bg-[#0e131d] p-5"><p className="text-xs uppercase tracking-[0.15em] text-slate-500">Macro backdrop</p><p className="mt-3 text-sm leading-6 text-slate-300">{brief.macro}</p></section><section className="rounded-2xl border border-white/[0.08] bg-[#0e131d] p-5"><p className="text-xs uppercase tracking-[0.15em] text-slate-500">Sentiment backdrop</p><p className="mt-3 text-sm leading-6 text-slate-300">{brief.sentiment}</p></section><section className="rounded-2xl border border-white/[0.08] bg-[#0e131d] p-5"><p className="text-xs uppercase tracking-[0.15em] text-slate-500">Current price behaviour</p><p className="mt-3 text-sm leading-6 text-slate-300">{brief.priceBehaviour}</p></section></div>

    <div className="mt-5 grid gap-5 lg:grid-cols-2"><ScenarioList title="Conditions supporting constructive scenarios" tone="long" items={brief.longConditions} /><ScenarioList title="Conditions supporting defensive scenarios" tone="short" items={brief.shortConditions} /></div>

    <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]"><section className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.045] p-5"><p className="text-xs font-medium uppercase tracking-[0.15em] text-amber-200">Invalidation</p><p className="mt-3 text-sm leading-6 text-slate-300">{brief.invalidation}</p></section><section className="rounded-2xl border border-white/[0.08] bg-[#0e131d] p-5"><p className="text-xs font-medium uppercase tracking-[0.15em] text-slate-500">Key risk events</p><ul className="mt-3 space-y-2">{brief.riskEvents.map((event) => <li key={event} className="flex gap-3 text-sm text-slate-300"><span className="text-amber-200">•</span>{event}</li>)}</ul></section></div>

    <aside className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.025] px-5 py-4 text-xs leading-5 text-slate-500">This page provides market context and decision support for educational purposes. It is not financial advice, a recommendation, or a solicitation to transact. Consider your own objectives, risk tolerance, and professional advice before making any decision.</aside>
  </div></main>;
}
