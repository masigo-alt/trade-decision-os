"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  analyseWeek,
  demoBehaviourEntries,
  demoChecklists,
  demoTrades,
  type BehaviourEntry,
  type PreTradeEntry,
  type TradeOutcome,
} from "@/lib/weekly-insights";

const card = "rounded-2xl border border-white/[0.08] bg-[#0e131d] p-5";

function Metric({ label, value, note, tone = "text-white" }: { label: string; value: string | number; note: string; tone?: string }) {
  return <article className={card}><p className="text-xs uppercase tracking-wider text-slate-500">{label}</p><p className={`mt-3 text-2xl font-semibold ${tone}`}>{value}</p><p className="mt-1 text-xs leading-5 text-slate-500">{note}</p></article>;
}

function Breakdown({ items }: { items: Array<{ label: string; value: number; colour: string }> }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  return <div className="mt-5 space-y-3">{items.map((item) => <div key={item.label}><div className="flex justify-between text-sm"><span className="text-slate-300">{item.label}</span><span className="text-slate-500">{item.value}</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full" style={{ backgroundColor: item.colour, width: `${total ? (item.value / total) * 100 : 0}%` }} /></div></div>)}</div>;
}

function Associations({ title, items, tone }: { title: string; items: Array<{ label: string; rate: number; days: number }>; tone: "positive" | "negative" }) {
  const colour = tone === "positive" ? "bg-emerald-400" : "bg-rose-400";
  return <article className={card}><p className={`text-xs uppercase tracking-[0.15em] ${tone === "positive" ? "text-emerald-300" : "text-rose-300"}`}>{title}</p><div className="mt-5 space-y-4">{items.map((item) => <div key={item.label}><div className="flex justify-between gap-4 text-sm"><span className="text-slate-300">{item.label}</span><span className="text-slate-400">{item.rate}% <span className="text-slate-600">({item.days} days)</span></span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${colour}`} style={{ width: `${item.rate}%` }} /></div></div>)}</div></article>;
}

export default function WeeklyInsightsPage() {
  const [entries, setEntries] = useState<BehaviourEntry[]>(demoBehaviourEntries);
  const [trades, setTrades] = useState<TradeOutcome[]>(demoTrades);
  const [checklists, setChecklists] = useState<PreTradeEntry[]>(demoChecklists);
  const [isDemo, setIsDemo] = useState(true);
  const [status, setStatus] = useState("Showing demonstration data until your Supabase account is connected.");

  useEffect(() => {
    async function loadInsights() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) return;
        const now = new Date();
        const monday = new Date(now);
        monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
        const weekStart = monday.toISOString().slice(0, 10);

        const [behaviourResult, tradeResult, checklistResult] = await Promise.all([
          supabase.from("behaviour_journal_entries").select("entry_date,slept_well,felt_calm_before_trading,felt_pressure_to_make_money,traded_after_a_loss,overtraded,revenge_traded,respected_stop,followed_plan,traded_during_news,net_positive").gte("entry_date", weekStart).order("entry_date"),
          supabase.from("trades").select("date,pnl,result,followed_plan,respected_stop,mistake_type,setup_type").gte("date", weekStart).order("date"),
          supabase.from("pre_trade_checklists").select("submitted_at,risk_percent,economic_calendar_checked,market_conditions_aligned,has_clear_invalidation,risk_reward_acceptable,emotional_state_acceptable,trade_matches_plan,recommendation").gte("submitted_at", `${weekStart}T00:00:00`).order("submitted_at"),
        ]);
        if (behaviourResult.error) throw behaviourResult.error;
        if (tradeResult.error) throw tradeResult.error;
        if (checklistResult.error) throw checklistResult.error;

        setEntries((behaviourResult.data ?? []) as BehaviourEntry[]);
        setTrades((tradeResult.data ?? []) as TradeOutcome[]);
        setChecklists((checklistResult.data ?? []) as PreTradeEntry[]);
        setIsDemo(false);
        setStatus("All three sections use this week’s saved checklist, trade, and behaviour records.");
      } catch (error) {
        setStatus(error instanceof Error ? `${error.message} Showing demonstration data instead.` : "Showing demonstration data instead.");
      }
    }
    loadInsights();
  }, []);

  const insights = useMemo(() => analyseWeek(entries, trades, checklists), [entries, trades, checklists]);

  return <main className="min-h-screen bg-[#080b10] px-5 py-6 text-slate-100 sm:px-8 lg:px-10"><div className="mx-auto max-w-6xl">
    <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><Link href="/" className="text-sm text-indigo-300 hover:text-indigo-200">← Dashboard</Link><p className="mt-5 text-xs font-medium uppercase tracking-[0.15em] text-indigo-300">Weekly insights</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">One week, three views of your process.</h1><p className="mt-2 text-sm text-slate-500">Rule-based findings from preparation, execution, and behaviour.</p></div><span className={`rounded-full px-3 py-1.5 text-xs font-medium ${isDemo ? "bg-amber-300/10 text-amber-100" : "bg-emerald-400/10 text-emerald-200"}`}>{isDemo ? "Demo data" : "Live weekly data"}</span></header>
    <p className="mb-5 rounded-lg border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-sm text-slate-400">{status}</p>
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Trading days" value={insights.overview.tradingDays} note="Journal and trade activity" /><Metric label="Net positive days" value={insights.overview.netPositiveDays} note="Daily outcome or summed P&L" tone="text-emerald-200" /><Metric label="Average discipline" value={`${insights.overview.averageDiscipline}/100`} note="Nine behaviour controls" tone="text-indigo-200" /><Metric label="Pre-trade checks" value={insights.overview.checklistCount} note="Decision gates completed" /></section>

    <section className="mt-8"><p className="text-xs font-medium uppercase tracking-[0.15em] text-indigo-300">01 · Pre-Trade Checklist insights</p><h2 className="mt-1 text-xl font-semibold text-white">Preparation and decision quality</h2><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Proceed rate" value={`${insights.preTrade.proceedRate}%`} note={`${insights.preTrade.total} total checklists`} tone="text-emerald-200" /><Metric label="Plan alignment" value={`${insights.preTrade.planAlignment}%`} note="Ideas matching the trading plan" /><Metric label="Calendar compliance" value={`${insights.preTrade.calendarCompliance}%`} note="High-impact calendar checked" /><Metric label="Average planned risk" value={`${insights.preTrade.averageRisk}%`} note="Risk declared before execution" /></div><div className="mt-4 grid gap-4 lg:grid-cols-2"><article className={card}><p className="text-xs uppercase tracking-wider text-slate-500">Decision outputs</p><Breakdown items={insights.preTrade.decisionBreakdown} /></article><article className={card}><p className="text-xs uppercase tracking-wider text-slate-500">Most common blocker</p><p className="mt-4 text-xl font-semibold text-amber-100">{insights.preTrade.mostCommonBlocker}</p><p className="mt-2 text-sm leading-6 text-slate-500">This is the condition most frequently preventing full alignment before a trade.</p></article></div></section>

    <section className="mt-8"><p className="text-xs font-medium uppercase tracking-[0.15em] text-emerald-300">02 · Trade Journal insights</p><h2 className="mt-1 text-xl font-semibold text-white">Execution and actual outcomes</h2><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Trades recorded" value={insights.trades.total} note="Completed journal outcomes" /><Metric label="Win rate" value={`${insights.trades.winRate}%`} note="Wins as a share of recorded trades" tone="text-emerald-200" /><Metric label="Net P&L" value={`$${insights.trades.netPnl.toFixed(2)}`} note="Total realised outcome" tone={insights.trades.netPnl >= 0 ? "text-emerald-200" : "text-rose-200"} /><Metric label="Plan adherence" value={`${insights.trades.planAdherence}%`} note={`Stop discipline: ${insights.trades.stopDiscipline}%`} /></div><div className="mt-4 grid gap-4 lg:grid-cols-2"><article className={card}><p className="text-xs uppercase tracking-wider text-slate-500">Trade results</p><Breakdown items={insights.trades.resultBreakdown} /></article><article className={card}><p className="text-xs uppercase tracking-wider text-slate-500">Most common execution mistake</p><p className="mt-4 text-xl font-semibold text-rose-200">{insights.trades.commonMistake}</p><p className="mt-2 text-sm leading-6 text-slate-500">Categorised from post-trade reviews, independent of whether the trade made money.</p></article></div></section>

    <section className="mt-8"><p className="text-xs font-medium uppercase tracking-[0.15em] text-violet-300">03 · Behaviour Journal insights</p><h2 className="mt-1 text-xl font-semibold text-white">Personal state and discipline patterns</h2><div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_0.6fr]"><article className={card}><p className="text-xs uppercase tracking-wider text-slate-500">Discipline by day</p><div className="mt-5 h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={insights.behaviour.dailyDiscipline}><CartesianGrid vertical={false} stroke="#ffffff12" /><XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} /><YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: "#ffffff08" }} contentStyle={{ background: "#111827", border: "1px solid #ffffff18", borderRadius: 10 }} /><Bar dataKey="score" radius={[6, 6, 0, 0]}>{insights.behaviour.dailyDiscipline.map((entry) => <Cell key={entry.date} fill={entry.score >= 75 ? "#34d399" : entry.score >= 60 ? "#fbbf24" : "#fb7185"} />)}</Bar></BarChart></ResponsiveContainer></div></article><article className={card}><p className="text-xs uppercase tracking-wider text-slate-500">Most common negative behaviour</p><p className="mt-4 text-xl font-semibold text-rose-200">{insights.behaviour.mostCommonNegative}</p><p className="mt-2 text-sm leading-6 text-slate-500">Frequency identifies what deserves attention; it does not prove causation.</p></article></div><div className="mt-4 grid gap-4 lg:grid-cols-2"><Associations title="Associated with net positive days" items={insights.behaviour.positiveAssociations} tone="positive" /><Associations title="Associated with net negative days" items={insights.behaviour.negativeAssociations} tone="negative" /></div></section>

    <section className={`${card} mt-8 border-indigo-400/15 bg-indigo-400/[0.04]`}><p className="text-xs uppercase tracking-[0.15em] text-indigo-300">Combined next-week actions</p><h2 className="mt-1 text-lg font-semibold text-white">Recommendations across all three datasets</h2><ol className="mt-5 space-y-3">{insights.recommendations.map((item, index) => <li key={item} className="flex gap-3 text-sm leading-6 text-slate-300"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-400/10 text-xs font-semibold text-indigo-200">{index + 1}</span>{item}</li>)}</ol></section>
    <p className="mt-5 text-xs leading-5 text-slate-500">These are transparent rule-based summaries, not causal findings, predictions, or financial advice. No AI is used.</p>
  </div></main>;
}
