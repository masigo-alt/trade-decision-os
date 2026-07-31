"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { DemoBadge } from "@/components/demo-badge";
import { ManageMarketsButton } from "@/components/manage-markets";
import { ReadinessRing } from "@/components/readiness-ring";
import { getAssets, type AssetSymbol } from "@/lib/assets";
import type { CalEvent, Quote } from "@/lib/market-data";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { scoreTraderReadiness, type BehaviourReadinessInput, type TraderReadiness } from "@/lib/trader-readiness";
import { useWatchlist } from "@/lib/watchlist";

type Bias = "Bullish" | "Bearish" | "Neutral" | "No data";
type EventRow = { key: string; time: string; title: string; secondary: string; impact: CalEvent["impact"] };

const biasStyles: Record<Bias, string> = {
  Bullish: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20",
  Bearish: "bg-rose-400/10 text-rose-300 ring-rose-400/20",
  Neutral: "bg-amber-300/10 text-amber-200 ring-amber-300/20",
  "No data": "bg-white/[0.05] text-slate-500 ring-white/10",
};

const biasFromTrend: Record<NonNullable<Quote["trend"]>, Bias> = { up: "Bullish", down: "Bearish", flat: "Neutral" };

// Static per-asset colour behind the live board. Never presented as real analysis — always wrapped in a DemoBadge.
const demoContext: Partial<Record<AssetSymbol, { summary: string; constructive: string; defensive: string; risk: string }>> = {
  XAUUSD: { summary: "Holding above the 2,350 pivot as real-yield pressure eases.", constructive: "Acceptance above 2,370", defensive: "Failure back below 2,350", risk: "US CPI · 14:30 SAST" },
  NAS100: { summary: "Compressed near recent highs; breadth and range expansion remain the key confirmation.", constructive: "Hold above 20,520", defensive: "Loss of 20,390 support", risk: "Fed speakers · 16:00 SAST" },
  GER40: { summary: "Lower highs persist while price remains below the weekly open.", constructive: "Reclaim of 18,510", defensive: "Rejection at 18,460–480", risk: "US open volatility" },
};

const demoEvents: Array<{ time: string; title: string; impact: CalEvent["impact"]; note: string }> = [
  { time: "14:30", title: "US CPI release", impact: "High", note: "Stay patient into the release." },
  { time: "16:00", title: "Fed speaker · Williams", impact: "Medium", note: "Watch yields and dollar reaction." },
  { time: "16:30", title: "US cash equity open", impact: "High", note: "Observe NAS100 range resolution." },
];

const johannesburgDateFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit" });
const johannesburgTimeFormatter = new Intl.DateTimeFormat("en-ZA", { timeZone: "Africa/Johannesburg", hour: "2-digit", minute: "2-digit", hour12: false });

export default function DashboardPage() {
  const today = new Intl.DateTimeFormat("en-ZA", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Johannesburg" }).format(new Date());

  const { symbols } = useWatchlist();
  const assets = getAssets(symbols);

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quotesLive, setQuotesLive] = useState(false);
  const [quotesStatus, setQuotesStatus] = useState<"loading" | "ready" | "error">("loading");
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [calendarLive, setCalendarLive] = useState(false);
  const [calendarStatus, setCalendarStatus] = useState<"loading" | "ready" | "error">("loading");
  const [checkIn, setCheckIn] = useState<"loading" | "none" | "ready">("loading");
  const [readiness, setReadiness] = useState<TraderReadiness | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/quotes?symbols=" + encodeURIComponent(symbols.join(",")))
      .then((res) => { if (!res.ok) throw new Error("quotes request failed"); return res.json(); })
      .then((data: { asOf: string; live: boolean; quotes: Quote[] }) => {
        if (!active) return;
        setQuotes(data.quotes);
        setQuotesLive(data.live);
        setQuotesStatus("ready");
      })
      .catch(() => { if (active) { setQuotes([]); setQuotesLive(false); setQuotesStatus("error"); } });

    fetch("/api/calendar")
      .then((res) => { if (!res.ok) throw new Error("calendar request failed"); return res.json(); })
      .then((data: { live: boolean; events: CalEvent[] }) => {
        if (!active) return;
        setEvents(data.events);
        setCalendarLive(data.live);
        setCalendarStatus("ready");
      })
      .catch(() => { if (active) { setEvents([]); setCalendarLive(false); setCalendarStatus("error"); } });

    return () => { active = false; };
  }, [symbols.join(",")]);

  useEffect(() => {
    let active = true;

    async function loadCheckIn() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) { if (active) setCheckIn("none"); return; }

        const entryDate = johannesburgDateFormatter.format(new Date());
        const { data, error } = await supabase
          .from("behaviour_journal_entries")
          .select("slept_well,felt_calm_before_trading,felt_pressure_to_make_money,traded_after_a_loss,overtraded,revenge_traded,respected_stop,followed_plan,traded_during_news,net_positive")
          .eq("entry_date", entryDate)
          .maybeSingle();

        if (!active) return;
        if (error || !data) { setCheckIn("none"); return; }

        setReadiness(scoreTraderReadiness(data as BehaviourReadinessInput));
        setCheckIn("ready");
      } catch {
        if (active) setCheckIn("none");
      }
    }

    loadCheckIn();
    return () => { active = false; };
  }, []);

  const findQuote = (symbol: AssetSymbol): Quote | null => quotes.find((quote) => quote.symbol === symbol) ?? null;

  const todayKey = johannesburgDateFormatter.format(new Date());
  const todayEvents = events.filter((event) => johannesburgDateFormatter.format(new Date(event.time)) === todayKey);
  const hasHighImpactToday = todayEvents.some((event) => event.impact === "High");
  const nextHighImpact = todayEvents.find((event) => event.impact === "High") ?? null;
  const showLiveEvents = calendarLive && todayEvents.length > 0;
  const eventRows: EventRow[] = showLiveEvents
    ? todayEvents.map((event) => ({ key: event.id, time: johannesburgTimeFormatter.format(new Date(event.time)), title: event.title, secondary: event.currency, impact: event.impact }))
    : demoEvents.map((event) => ({ key: event.title, time: event.time, title: event.title, secondary: event.note, impact: event.impact }));

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
          <h2 className="mt-4 max-w-3xl text-2xl font-semibold leading-tight tracking-[-0.025em] text-white">Live snapshot across today&apos;s tracked markets.</h2>
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm leading-6 text-slate-400">
            {assets.map((asset) => {
              const quote = findQuote(asset.symbol);
              const price = quote && quote.live && quote.price !== null ? quote.price : null;
              const changePct = quote && quote.live && quote.changePct !== null ? quote.changePct : null;
              const up = (changePct ?? 0) >= 0;
              return <span key={asset.symbol} className="inline-flex items-baseline gap-1.5">
                <span className="font-medium text-slate-200">{asset.symbol}</span>
                {price !== null ? <span>{price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> : <span className="text-slate-600">—</span>}
                {changePct !== null && <span className={up ? "text-emerald-300" : "text-rose-300"}>{up ? "+" : ""}{changePct.toFixed(2)}%</span>}
              </span>;
            })}
            {!quotesLive && <DemoBadge />}
          </div>
          <div className="mt-6 grid gap-4 border-t border-white/[0.08] pt-5 sm:grid-cols-3">
            <ContextItem label="Constructive when" value="Higher lows hold as yields soften" demoLabel="Demo context" />
            <ContextItem label="Defensive when" value="Breaks fail into event risk" demoLabel="Demo context" />
            <ContextItem label="Context changes if" value="The USD strengthens broadly" demoLabel="Demo context" />
          </div>
        </div>
        <aside className="rounded-2xl border border-white/[0.08] bg-black/15 p-5">
          <p className="eyebrow text-slate-500">Session posture</p>
          <div className="mt-3 flex flex-wrap items-center gap-2"><p className="text-lg font-semibold text-amber-200">Selective risk-on</p><DemoBadge label="Demo context" /></div>
          <p className="mt-2 text-sm leading-5 text-slate-500">Prioritise clear confirmation. Avoid forcing an idea before CPI.</p>
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-4 text-xs text-slate-500">
            <span className={`h-2 w-2 rounded-full ${hasHighImpactToday ? "bg-amber-300" : "bg-slate-600"}`} />
            <span>{calendarLive ? (hasHighImpactToday ? "High-impact event pending" : "No high-impact events today") : "Event data unavailable"}</span>
            {!calendarLive && <DemoBadge />}
          </div>
        </aside>
      </div>
    </section>

    <div className="mt-9 mb-4 flex items-end justify-between gap-4">
      <div><p className="eyebrow text-slate-600">Market coverage</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-white">Asset decision board</h2></div>
      <div className="flex items-center gap-3">
        <p className="hidden text-sm text-slate-600 sm:block">{`${assets.length} active ${assets.length === 1 ? "market" : "markets"}`}</p>
        <ManageMarketsButton />
      </div>
    </div>
    {assets.length === 0 ? <section className="surface flex flex-col items-center gap-3 p-8 text-center"><p className="text-sm text-slate-500">No markets selected yet.</p><ManageMarketsButton /></section> : <section className="grid items-stretch gap-4 lg:grid-cols-3">
      {assets.map((asset) => {
        const quote = findQuote(asset.symbol);
        const trend = quote?.trend ?? null;
        const bias: Bias = trend ? biasFromTrend[trend] : "No data";
        const demo = demoContext[asset.symbol];
        const riskValue = nextHighImpact ? `${nextHighImpact.title} · ${johannesburgTimeFormatter.format(new Date(nextHighImpact.time))}` : (demo?.risk ?? null);

        return <article key={asset.symbol} className="surface group flex min-w-0 flex-col p-5 transition duration-200 hover:-translate-y-0.5 hover:border-white/[0.13]">
          <div className="flex items-start justify-between gap-3">
            <div><p className="eyebrow text-slate-600">{asset.symbol}</p><h3 className="mt-1 text-lg font-semibold tracking-[-0.015em] text-white">{asset.name}</h3></div>
            <div className="flex flex-col items-end gap-1">
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${biasStyles[bias]}`}>{bias}</span>
              <span className="text-[10px] text-slate-600">today</span>
            </div>
          </div>
          <PriceBlock quote={quote} />
          <p className="mt-3 min-h-[4.5rem] text-sm leading-6 text-slate-500">{demo ? <>{demo.summary} <DemoBadge /></> : "Live price and real-time chart. Open for market context."}</p>
          <dl className="mt-5 space-y-3 border-t border-white/[0.07] pt-4 text-xs">
            {demo && <AssetRow label="Constructive if" value={demo.constructive} tone="text-emerald-200" demoLabel="Demo context" />}
            {demo && <AssetRow label="Defensive if" value={demo.defensive} tone="text-rose-200" demoLabel="Demo context" />}
            {riskValue && <AssetRow label="Key risk" value={riskValue} tone="text-amber-200" demoLabel={nextHighImpact ? undefined : "Demo"} />}
          </dl>
          <Link href={`/assets/${asset.symbol}`} className="mt-5 flex h-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-sm font-medium text-slate-300 transition hover:border-violet-400/30 hover:bg-violet-400/[0.06] hover:text-violet-200">View market context <span className="ml-2 text-slate-600 transition group-hover:translate-x-0.5">→</span></Link>
        </article>;
      })}
    </section>}

    <section className="mt-8 grid items-stretch gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.6fr)]">
      <article className="surface p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div><p className="eyebrow text-slate-600">Event radar</p><h2 className="mt-1 text-lg font-semibold text-white">Today&apos;s focus</h2></div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[11px] text-slate-500">{calendarStatus === "loading" ? "Loading…" : `${eventRows.length} events`}</span>
            {!showLiveEvents && <DemoBadge />}
          </div>
        </div>
        <div className="mt-5 divide-y divide-white/[0.07]">{eventRows.map((event) => <div key={event.key} className="grid grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-3 py-4 first:pt-0 last:pb-0"><span className="text-xs font-semibold text-violet-300">{event.time}</span><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-200">{event.title}</p><p className="mt-1 truncate text-xs text-slate-600">{event.secondary}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${event.impact === "High" ? "bg-amber-300/10 text-amber-200" : "bg-slate-400/10 text-slate-400"}`}>{event.impact}</span></div>)}</div>
      </article>
      <article className="surface overflow-hidden p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div><p className="eyebrow text-emerald-300">Trader readiness</p><h2 className="mt-1 text-lg font-semibold capitalize text-white">{checkIn === "ready" && readiness ? readiness.recommendation.replace("_", " ") : checkIn === "loading" ? "Checking today" : "No check-in yet"}</h2></div>
          <ReadinessRing score={readiness?.score ?? null} />
        </div>
        <p className="mt-3 text-sm leading-5 text-slate-500">
          {checkIn === "ready" && readiness ? readiness.summary : checkIn === "loading" ? "Checking today's behaviour check-in…" : <>No check-in yet today. <Link href="/behaviour-journal" className="font-medium text-emerald-300 transition hover:text-emerald-200">Complete your check-in →</Link></>}
        </p>
        <Link href="/behaviour-journal" className="mt-6 flex h-10 items-center justify-center rounded-xl bg-emerald-400 text-sm font-semibold text-[#06251d] transition hover:bg-emerald-300">{checkIn === "ready" ? "Update readiness" : "Start check-in"}</Link>
      </article>
    </section>
  </AppShell>;
}

function ContextItem({ label, value, demoLabel }: { label: string; value: string; demoLabel?: string }) {
  return <div><p className="text-[11px] font-medium text-slate-600">{label}</p><p className="mt-1 text-sm leading-5 text-slate-200">{value}{demoLabel && <> <DemoBadge label={demoLabel} /></>}</p></div>;
}

function AssetRow({ label, value, tone, demoLabel }: { label: string; value: string; tone: string; demoLabel?: string }) {
  return <div className="grid grid-cols-[90px_minmax(0,1fr)] gap-3"><dt className="text-slate-600">{label}</dt><dd className={`text-right leading-5 ${tone}`}>{value}{demoLabel && <> <DemoBadge label={demoLabel} /></>}</dd></div>;
}

function PriceBlock({ quote }: { quote: Quote | null }) {
  if (!quote || !quote.live || quote.price === null) return <div className="mt-6 flex items-center gap-2"><span className="text-2xl font-semibold tracking-[-0.03em] text-slate-600">—</span><DemoBadge /></div>;

  const up = (quote.changePct ?? 0) >= 0;
  return <div className="mt-6 flex items-baseline gap-2"><span className="text-2xl font-semibold tracking-[-0.03em] text-white">{quote.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>{quote.changePct !== null && <span className={`text-xs font-medium ${up ? "text-emerald-300" : "text-rose-300"}`}>{up ? "+" : ""}{quote.changePct.toFixed(2)}%</span>}</div>;
}
