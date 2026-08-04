"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type JournalEntry = {
  id: string;
  date: string;
  status: "planned" | "open" | "closed" | "cancelled";
  direction: "long" | "short";
  setup_type: string | null;
  result: "win" | "loss" | "breakeven" | null;
  pnl: number | null;
  risk_amount: number | null;
  target_amount: number | null;
  followed_plan: boolean;
  respected_stop: boolean;
  mistake_type: string | null;
  before_analysis: string | null;
  entry_reason: string | null;
  result_conclusion: string | null;
  review_notes: string | null;
  closing_commentary: string | null;
  before_screenshot_path: string | null;
  after_screenshot_path: string | null;
  before_screenshot_url?: string | null;
  after_screenshot_url?: string | null;
  assets: { symbol: string; name: string } | null;
};

const demoEntries: JournalEntry[] = [
  {
    id: "demo-journal-entry",
    date: "2026-07-21",
    status: "closed",
    direction: "short",
    setup_type: "Risk entry",
    result: "loss",
    pnl: -120.15,
    risk_amount: 120.15,
    target_amount: 346,
    followed_plan: false,
    respected_stop: true,
    mistake_type: "no_clear_entry",
    before_analysis: "Downtrend context with downside momentum and an hourly imbalance near the pullback area.",
    entry_reason: "Expected continuation from the higher-timeframe area, but the lower-timeframe entry method was not sufficiently clear.",
    result_conclusion: "The scenario was reasonable, but execution timing was not.",
    review_notes: "The overall bias was useful. The main improvement is to wait for a clear lower-timeframe trigger.",
    closing_commentary: "Focus on process quality and avoid forcing an entry when the setup goes against the intended method.",
    before_screenshot_path: null,
    after_screenshot_path: null,
    assets: { symbol: "XAUUSD", name: "Gold" },
  },
];

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const displayDate = (value: string) => new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T12:00:00`));
const titleCase = (value: string | null) => value ? value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "None recorded";

function monthBounds(month: Date) {
  const year = month.getFullYear();
  const index = month.getMonth();
  const start = `${year}-${String(index + 1).padStart(2, "0")}-01`;
  const last = new Date(year, index + 1, 0).getDate();
  const end = `${year}-${String(index + 1).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  return { start, end };
}

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function TradeJournalHistory() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [entries, setEntries] = useState<JournalEntry[]>(demoEntries);
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return toDateKey(now.getFullYear(), now.getMonth(), now.getDate());
  });
  const [isDemo, setIsDemo] = useState(true);
  const [status, setStatus] = useState("Showing a demonstration entry until Supabase authentication is connected.");
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    const refresh = () => setRefreshVersion((value) => value + 1);
    window.addEventListener("trade-journal-updated", refresh);
    return () => window.removeEventListener("trade-journal-updated", refresh);
  }, []);

  useEffect(() => {
    async function loadMonth() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) return;
        const { start, end } = monthBounds(month);
        const { data, error } = await supabase
          .from("trades")
          .select("id,date,status,direction,setup_type,result,pnl,risk_amount,target_amount,followed_plan,respected_stop,mistake_type,before_analysis,entry_reason,result_conclusion,review_notes,closing_commentary,before_screenshot_path,after_screenshot_path,assets(symbol,name)")
          .gte("date", start)
          .lte("date", end)
          .order("date", { ascending: false });
        if (error) throw error;

        const withScreenshots = await Promise.all(((data ?? []) as unknown as JournalEntry[]).map(async (entry) => {
          const sign = async (path: string | null) => {
            if (!path) return null;
            const { data: signed } = await supabase.storage.from("trade-journal-screenshots").createSignedUrl(path, 3600);
            return signed?.signedUrl ?? null;
          };
          const [beforeUrl, afterUrl] = await Promise.all([sign(entry.before_screenshot_path), sign(entry.after_screenshot_path)]);
          return { ...entry, before_screenshot_url: beforeUrl, after_screenshot_url: afterUrl };
        }));

        setEntries(withScreenshots);
        setIsDemo(false);
        setStatus(withScreenshots.length ? `${withScreenshots.length} journal ${withScreenshots.length === 1 ? "entry" : "entries"} logged this month.` : "No journal entries logged in this month.");
        const firstDate = withScreenshots[0]?.date;
        if (firstDate) setSelectedDate(firstDate);
      } catch (error) {
        setStatus(error instanceof Error ? `${error.message} Showing demonstration data instead.` : "Showing demonstration data instead.");
      }
    }
    loadMonth();
  }, [month, refreshVersion]);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, JournalEntry[]>();
    entries.forEach((entry) => map.set(entry.date, [...(map.get(entry.date) ?? []), entry]));
    return map;
  }, [entries]);
  const selectedEntries = entriesByDate.get(selectedDate) ?? [];
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const leadingDays = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const calendarCells = Array.from({ length: 42 }, (_, index) => {
    const cellDate = new Date(year, monthIndex, 1 - leadingDays + index);
    return {
      day: cellDate.getDate(),
      key: toDateKey(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate()),
      currentMonth: cellDate.getMonth() === monthIndex,
      month: cellDate.getMonth(),
      year: cellDate.getFullYear(),
    };
  });
  const monthTitle = new Intl.DateTimeFormat("en-ZA", { month: "long", year: "numeric" }).format(month);
  const today = new Date();
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  function changeMonth(offset: number) {
    const next = new Date(year, monthIndex + offset, 1);
    setMonth(next);
    setSelectedDate(toDateKey(next.getFullYear(), next.getMonth(), 1));
  }

  return <section id="journal-calendar" className="mb-8 rounded-2xl border border-white/[0.08] bg-[#0e131d] p-5 sm:p-7">
    <div className="flex flex-col justify-between gap-4 border-b border-white/[0.07] pb-5 sm:flex-row sm:items-center">
      <div><div className="flex items-center gap-2"><p className="text-xs font-medium uppercase tracking-[0.15em] text-indigo-300">Journal calendar</p><span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${isDemo ? "bg-amber-300/10 text-amber-100" : "bg-emerald-400/10 text-emerald-200"}`}>{isDemo ? "Demo" : "Live"}</span></div><h2 className="mt-1 text-xl font-semibold text-white">Review previously logged trades.</h2><p className="mt-2 text-sm text-slate-500">{status}</p></div>
      <a href="#new-entry" className="rounded-lg bg-indigo-500 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-indigo-400">Log a new trade</a>
    </div>

    <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_1.05fr]">
      <div>
        <div className="mb-4 flex items-center justify-between rounded-xl border border-white/[0.07] bg-[#080b10] px-2 py-2"><button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month" className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white">←</button><div className="text-center"><p className="font-semibold text-white">{monthTitle}</p><p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-600">{entries.length} logged {entries.length === 1 ? "trade" : "trades"}</p></div><button type="button" onClick={() => changeMonth(1)} aria-label="Next month" className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white">→</button></div>
        <div className="journal-calendar-grid">{dayLabels.map((label) => <div key={label} className="py-2 text-center text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</div>)}{calendarCells.map((cell) => {
          const dayEntries = entriesByDate.get(cell.key) ?? [];
          const closedEntries = dayEntries.filter((entry) => entry.status === "closed");
          const dayPnl = closedEntries.reduce((sum, entry) => sum + Number(entry.pnl ?? 0), 0);
          const openCount = dayEntries.filter((entry) => entry.status === "open").length;
          const selected = selectedDate === cell.key;
          const isToday = todayKey === cell.key;
          return <button type="button" key={cell.key} aria-pressed={selected} onClick={() => {
            setSelectedDate(cell.key);
            if (!cell.currentMonth) setMonth(new Date(cell.year, cell.month, 1));
          }} className={`journal-calendar-cell flex min-w-0 flex-col items-start rounded-xl border p-2 text-left transition ${selected ? "border-indigo-400 bg-indigo-400/15 shadow-[0_0_0_1px_rgba(129,140,248,0.15)]" : dayEntries.length ? "border-white/10 bg-white/[0.04] hover:border-indigo-400/30 hover:bg-white/[0.06]" : "border-white/[0.045] bg-[#0a0e15] hover:border-white/10"} ${cell.currentMonth ? "" : "opacity-35"}`}><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs ${isToday ? "bg-indigo-500 font-semibold text-white" : selected ? "font-semibold text-indigo-100" : "text-slate-400"}`}>{cell.day}</span>{dayEntries.length > 0 && <div className="mt-auto w-full min-w-0 pt-1.5"><div className="flex min-w-0 items-center gap-1"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${openCount ? "bg-amber-300" : "bg-indigo-300"}`} /><span className="truncate text-[9px] leading-3 text-slate-500">{dayEntries.length} {dayEntries.length === 1 ? "trade" : "trades"}</span></div><p className={`mt-0.5 truncate text-[10px] font-semibold leading-3 ${openCount && !closedEntries.length ? "text-amber-200" : dayPnl >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{openCount && !closedEntries.length ? `${openCount} open` : `${dayPnl >= 0 ? "+" : ""}$${dayPnl.toFixed(0)}`}</p></div>}</button>;
        })}</div>
      </div>

      <div className="min-w-0">
        <p className="text-xs uppercase tracking-[0.15em] text-slate-500">{displayDate(selectedDate)}</p>
        {selectedEntries.length === 0 ? <div className="mt-3 grid min-h-64 place-items-center rounded-xl border border-dashed border-white/10 bg-[#080b10] px-6 text-center"><div><p className="text-sm text-slate-400">No journal entry for this date.</p><a href="#new-entry" className="mt-2 inline-block text-sm text-indigo-300">Create an entry ↓</a></div></div> : <div className="mt-3 space-y-4">{selectedEntries.map((entry) => <article key={entry.id} className="rounded-xl border border-white/[0.08] bg-[#080b10] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-medium tracking-wider text-slate-500">{entry.assets?.symbol ?? "ASSET"}</p><h3 className="mt-1 font-semibold text-white">{entry.assets?.name ?? "Trade"} · <span className="capitalize">{entry.direction}</span></h3><p className="mt-1 text-xs text-slate-500">{entry.setup_type || "No setup type recorded"}</p></div><div className="text-right">{entry.status === "open" ? <><p className="text-sm font-semibold text-amber-200">Open</p><button type="button" onClick={() => window.dispatchEvent(new CustomEvent("trade-journal-complete-requested", { detail: { tradeId: entry.id } }))} className="mt-1 text-xs font-medium text-indigo-300">Complete review ↓</button></> : <><p className={`text-sm font-semibold ${entry.result === "win" ? "text-emerald-300" : entry.result === "loss" ? "text-rose-300" : "text-slate-300"}`}>{titleCase(entry.result)}</p><p className={`mt-1 text-sm ${Number(entry.pnl ?? 0) >= 0 ? "text-emerald-200" : "text-rose-200"}`}>{entry.pnl == null ? "P&L not recorded" : `${Number(entry.pnl) >= 0 ? "+" : ""}$${Number(entry.pnl).toFixed(2)}`}</p></>}</div></div>
          {entry.status === "closed" && <div className="mt-4 grid grid-cols-2 gap-2 text-xs"><div className="rounded-lg bg-white/[0.035] p-2.5"><p className="text-slate-600">Followed plan</p><p className={entry.followed_plan ? "mt-1 text-emerald-200" : "mt-1 text-rose-200"}>{entry.followed_plan ? "Yes" : "No"}</p></div><div className="rounded-lg bg-white/[0.035] p-2.5"><p className="text-slate-600">Respected stop</p><p className={entry.respected_stop ? "mt-1 text-emerald-200" : "mt-1 text-rose-200"}>{entry.respected_stop ? "Yes" : "No"}</p></div></div>}
          <details className="mt-4 border-t border-white/[0.07] pt-3"><summary className="cursor-pointer text-sm font-medium text-indigo-300">View full journal review</summary><div className="mt-4 space-y-4 text-sm leading-6 text-slate-400">{entry.before_analysis && <div><p className="text-xs uppercase tracking-wider text-slate-600">Before analysis</p><p className="mt-1">{entry.before_analysis}</p></div>}{entry.entry_reason && <div><p className="text-xs uppercase tracking-wider text-slate-600">Entry rationale</p><p className="mt-1">{entry.entry_reason}</p></div>}{entry.result_conclusion && <div><p className="text-xs uppercase tracking-wider text-slate-600">Result and conclusion</p><p className="mt-1">{entry.result_conclusion}</p></div>}{entry.review_notes && <div><p className="text-xs uppercase tracking-wider text-slate-600">Review</p><p className="mt-1">{entry.review_notes}</p></div>}<div><p className="text-xs uppercase tracking-wider text-slate-600">Primary mistake</p><p className="mt-1">{titleCase(entry.mistake_type)}</p></div>{entry.closing_commentary && <div><p className="text-xs uppercase tracking-wider text-slate-600">Closing commentary</p><p className="mt-1">{entry.closing_commentary}</p></div>}{(entry.before_screenshot_url || entry.after_screenshot_url) && <div className="grid gap-3 sm:grid-cols-2">{entry.before_screenshot_url && <figure><img src={entry.before_screenshot_url} alt="Before-trade chart" className="w-full rounded-lg border border-white/10" /><figcaption className="mt-1 text-xs text-slate-600">Before</figcaption></figure>}{entry.after_screenshot_url && <figure><img src={entry.after_screenshot_url} alt="After-trade chart" className="w-full rounded-lg border border-white/10" /><figcaption className="mt-1 text-xs text-slate-600">After</figcaption></figure>}</div>}</div></details>
        </article>)}</div>}
      </div>
    </div>
  </section>;
}
