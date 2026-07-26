"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type JournalEntry = {
  id: string;
  date: string;
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
  const [month, setMonth] = useState(new Date(2026, 6, 1));
  const [entries, setEntries] = useState<JournalEntry[]>(demoEntries);
  const [selectedDate, setSelectedDate] = useState("2026-07-21");
  const [isDemo, setIsDemo] = useState(true);
  const [status, setStatus] = useState("Showing a demonstration entry until Supabase authentication is connected.");

  useEffect(() => {
    async function loadMonth() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) return;
        const { start, end } = monthBounds(month);
        const { data, error } = await supabase
          .from("trades")
          .select("id,date,direction,setup_type,result,pnl,risk_amount,target_amount,followed_plan,respected_stop,mistake_type,before_analysis,entry_reason,result_conclusion,review_notes,closing_commentary,before_screenshot_path,after_screenshot_path,assets(symbol,name)")
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
  }, [month]);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, JournalEntry[]>();
    entries.forEach((entry) => map.set(entry.date, [...(map.get(entry.date) ?? []), entry]));
    return map;
  }, [entries]);
  const selectedEntries = entriesByDate.get(selectedDate) ?? [];
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const leadingDays = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const calendarCells = Array.from({ length: leadingDays + daysInMonth }, (_, index) => index < leadingDays ? null : index - leadingDays + 1);
  const monthTitle = new Intl.DateTimeFormat("en-ZA", { month: "long", year: "numeric" }).format(month);

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
        <div className="mb-4 flex items-center justify-between"><button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month" className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-slate-400 hover:text-white">←</button><p className="font-semibold text-white">{monthTitle}</p><button type="button" onClick={() => changeMonth(1)} aria-label="Next month" className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-slate-400 hover:text-white">→</button></div>
        <div className="grid grid-cols-7 gap-1">{dayLabels.map((label) => <div key={label} className="py-2 text-center text-[10px] font-medium uppercase tracking-wider text-slate-600">{label}</div>)}{calendarCells.map((day, index) => {
          if (!day) return <div key={`empty-${index}`} />;
          const key = toDateKey(year, monthIndex, day);
          const dayEntries = entriesByDate.get(key) ?? [];
          const dayPnl = dayEntries.reduce((sum, entry) => sum + Number(entry.pnl ?? 0), 0);
          const selected = selectedDate === key;
          return <button type="button" key={key} onClick={() => setSelectedDate(key)} className={`relative min-h-16 rounded-lg border p-1.5 text-left transition ${selected ? "border-indigo-400 bg-indigo-400/10" : dayEntries.length ? "border-white/10 bg-white/[0.035] hover:border-indigo-400/30" : "border-transparent hover:bg-white/[0.025]"}`}><span className={`text-xs ${selected ? "text-indigo-200" : "text-slate-400"}`}>{day}</span>{dayEntries.length > 0 && <><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-indigo-300" /><p className={`mt-3 truncate text-[10px] font-medium ${dayPnl >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{dayPnl >= 0 ? "+" : ""}${dayPnl.toFixed(0)}</p></>}</button>;
        })}</div>
      </div>

      <div className="min-w-0">
        <p className="text-xs uppercase tracking-[0.15em] text-slate-500">{displayDate(selectedDate)}</p>
        {selectedEntries.length === 0 ? <div className="mt-3 grid min-h-64 place-items-center rounded-xl border border-dashed border-white/10 bg-[#080b10] px-6 text-center"><div><p className="text-sm text-slate-400">No journal entry for this date.</p><a href="#new-entry" className="mt-2 inline-block text-sm text-indigo-300">Create an entry ↓</a></div></div> : <div className="mt-3 space-y-4">{selectedEntries.map((entry) => <article key={entry.id} className="rounded-xl border border-white/[0.08] bg-[#080b10] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-medium tracking-wider text-slate-500">{entry.assets?.symbol ?? "ASSET"}</p><h3 className="mt-1 font-semibold text-white">{entry.assets?.name ?? "Trade"} · <span className="capitalize">{entry.direction}</span></h3><p className="mt-1 text-xs text-slate-500">{entry.setup_type || "No setup type recorded"}</p></div><div className="text-right"><p className={`text-sm font-semibold ${entry.result === "win" ? "text-emerald-300" : entry.result === "loss" ? "text-rose-300" : "text-slate-300"}`}>{titleCase(entry.result)}</p><p className={`mt-1 text-sm ${Number(entry.pnl ?? 0) >= 0 ? "text-emerald-200" : "text-rose-200"}`}>{entry.pnl == null ? "P&L not recorded" : `${Number(entry.pnl) >= 0 ? "+" : ""}$${Number(entry.pnl).toFixed(2)}`}</p></div></div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs"><div className="rounded-lg bg-white/[0.035] p-2.5"><p className="text-slate-600">Followed plan</p><p className={entry.followed_plan ? "mt-1 text-emerald-200" : "mt-1 text-rose-200"}>{entry.followed_plan ? "Yes" : "No"}</p></div><div className="rounded-lg bg-white/[0.035] p-2.5"><p className="text-slate-600">Respected stop</p><p className={entry.respected_stop ? "mt-1 text-emerald-200" : "mt-1 text-rose-200"}>{entry.respected_stop ? "Yes" : "No"}</p></div></div>
          <details className="mt-4 border-t border-white/[0.07] pt-3"><summary className="cursor-pointer text-sm font-medium text-indigo-300">View full journal review</summary><div className="mt-4 space-y-4 text-sm leading-6 text-slate-400">{entry.before_analysis && <div><p className="text-xs uppercase tracking-wider text-slate-600">Before analysis</p><p className="mt-1">{entry.before_analysis}</p></div>}{entry.entry_reason && <div><p className="text-xs uppercase tracking-wider text-slate-600">Entry rationale</p><p className="mt-1">{entry.entry_reason}</p></div>}{entry.result_conclusion && <div><p className="text-xs uppercase tracking-wider text-slate-600">Result and conclusion</p><p className="mt-1">{entry.result_conclusion}</p></div>}{entry.review_notes && <div><p className="text-xs uppercase tracking-wider text-slate-600">Review</p><p className="mt-1">{entry.review_notes}</p></div>}<div><p className="text-xs uppercase tracking-wider text-slate-600">Primary mistake</p><p className="mt-1">{titleCase(entry.mistake_type)}</p></div>{entry.closing_commentary && <div><p className="text-xs uppercase tracking-wider text-slate-600">Closing commentary</p><p className="mt-1">{entry.closing_commentary}</p></div>}{(entry.before_screenshot_url || entry.after_screenshot_url) && <div className="grid gap-3 sm:grid-cols-2">{entry.before_screenshot_url && <figure><img src={entry.before_screenshot_url} alt="Before-trade chart" className="w-full rounded-lg border border-white/10" /><figcaption className="mt-1 text-xs text-slate-600">Before</figcaption></figure>}{entry.after_screenshot_url && <figure><img src={entry.after_screenshot_url} alt="After-trade chart" className="w-full rounded-lg border border-white/10" /><figcaption className="mt-1 text-xs text-slate-600">After</figcaption></figure>}</div>}</div></details>
        </article>)}</div>}
      </div>
    </div>
  </section>;
}
