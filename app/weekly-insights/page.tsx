"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { analyseWeek, demoBehaviourEntries, demoTrades, type BehaviourEntry, type TradeOutcome } from "@/lib/weekly-insights";

const card = "rounded-2xl border border-white/[0.08] bg-[#0e131d] p-5";

export default function WeeklyInsightsPage() {
  const [entries, setEntries] = useState<BehaviourEntry[]>(demoBehaviourEntries);
  const [trades, setTrades] = useState<TradeOutcome[]>(demoTrades);
  const [isDemo, setIsDemo] = useState(true);
  const [status, setStatus] = useState("Showing demonstration data until your Supabase account is connected.");

  useEffect(() => {
    async function loadInsights() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) return;
        const now = new Date();
        const day = now.getDay();
        const monday = new Date(now);
        monday.setDate(now.getDate() - ((day + 6) % 7));
        const weekStart = monday.toISOString().slice(0, 10);
        const [{ data: behaviourData, error: behaviourError }, { data: tradeData, error: tradeError }] = await Promise.all([
          supabase.from("behaviour_journal_entries").select("entry_date,slept_well,felt_calm_before_trading,felt_pressure_to_make_money,traded_after_a_loss,overtraded,revenge_traded,respected_stop,followed_plan,traded_during_news,net_positive").gte("entry_date", weekStart).order("entry_date"),
          supabase.from("trades").select("date,pnl,result").gte("date", weekStart).order("date"),
        ]);
        if (behaviourError) throw behaviourError;
        if (tradeError) throw tradeError;
        setEntries((behaviourData ?? []) as BehaviourEntry[]);
        setTrades((tradeData ?? []) as TradeOutcome[]);
        setIsDemo(false);
        setStatus("This week’s insights are calculated from your saved journal entries and trade outcomes.");
      } catch (error) {
        setStatus(error instanceof Error ? `${error.message} Showing demonstration data instead.` : "Showing demonstration data instead.");
      }
    }
    loadInsights();
  }, []);

  const insights = useMemo(() => analyseWeek(entries, trades), [entries, trades]);
  const associationData = insights.positiveAssociations.map((item) => ({ ...item, type: "Positive" })).concat(insights.negativeAssociations.map((item) => ({ ...item, type: "Negative" })));

  return <main className="min-h-screen bg-[#080b10] px-5 py-6 text-slate-100 sm:px-8 lg:px-10"><div className="mx-auto max-w-6xl"><header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><Link href="/" className="text-sm text-indigo-300 transition hover:text-indigo-200">← Dashboard</Link><p className="mt-5 text-xs font-medium uppercase tracking-[0.15em] text-indigo-300">Weekly insights</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Review the process, not just the outcome.</h1><p className="mt-2 text-sm text-slate-500">Rule-based reflections from your behaviour journal and trade outcomes.</p></div><span className={`rounded-full px-3 py-1.5 text-xs font-medium ${isDemo ? "bg-amber-300/10 text-amber-100" : "bg-emerald-400/10 text-emerald-200"}`}>{isDemo ? "Demo data" : "Live weekly data"}</span></header><p className="mb-5 rounded-lg border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-sm text-slate-400">{status}</p><section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><article className={card}><p className="text-xs uppercase tracking-wider text-slate-500">Trading days</p><p className="mt-3 text-3xl font-semibold text-white">{insights.tradingDays}</p><p className="mt-1 text-xs text-slate-500">Journal and trade activity</p></article><article className={card}><p className="text-xs uppercase tracking-wider text-slate-500">Net positive days</p><p className="mt-3 text-3xl font-semibold text-emerald-200">{insights.netPositiveDays}</p><p className="mt-1 text-xs text-slate-500">Journal outcome or daily P&amp;L</p></article><article className={card}><p className="text-xs uppercase tracking-wider text-slate-500">Average discipline</p><p className="mt-3 text-3xl font-semibold text-indigo-200">{insights.averageDiscipline}<span className="text-base text-slate-500">/100</span></p><p className="mt-1 text-xs text-slate-500">Nine behaviour checks</p></article><article className={card}><p className="text-xs uppercase tracking-wider text-slate-500">Most common risk</p><p className="mt-3 text-lg font-semibold leading-6 text-rose-200">{insights.mostCommonNegative}</p><p className="mt-1 text-xs text-slate-500">Most frequently logged this week</p></article></section><section className={`${card} mt-5`}><div><p className="text-xs uppercase tracking-[0.15em] text-slate-500">Discipline by day</p><h2 className="mt-1 text-lg font-semibold text-white">Process consistency</h2></div><div className="mt-5 h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={insights.dailyDiscipline}><CartesianGrid vertical={false} stroke="#ffffff12" /><XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} /><YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: "#ffffff08" }} contentStyle={{ background: "#111827", border: "1px solid #ffffff18", borderRadius: 10 }} /><Bar dataKey="score" radius={[6, 6, 0, 0]}>{insights.dailyDiscipline.map((entry) => <Cell key={entry.date} fill={entry.score >= 75 ? "#34d399" : entry.score >= 60 ? "#fbbf24" : "#fb7185"} />)}</Bar></BarChart></ResponsiveContainer></div></section><section className="mt-5 grid gap-5 lg:grid-cols-2"><article className={card}><p className="text-xs uppercase tracking-[0.15em] text-emerald-300">Associated with net positive days</p><h2 className="mt-1 text-lg font-semibold text-white">Helpful behaviours</h2><div className="mt-5 space-y-4">{insights.positiveAssociations.map((item) => <div key={item.label}><div className="flex justify-between gap-4 text-sm"><span className="text-slate-300">{item.label}</span><span className="text-emerald-200">{item.rate}% positive <span className="text-slate-500">({item.days} days)</span></span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${item.rate}%` }} /></div></div>)}</div></article><article className={card}><p className="text-xs uppercase tracking-[0.15em] text-rose-300">Associated with net negative days</p><h2 className="mt-1 text-lg font-semibold text-white">Risk behaviours</h2><div className="mt-5 space-y-4">{insights.negativeAssociations.map((item) => <div key={item.label}><div className="flex justify-between gap-4 text-sm"><span className="text-slate-300">{item.label}</span><span className="text-rose-200">{item.rate}% negative <span className="text-slate-500">({item.days} days)</span></span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-rose-400" style={{ width: `${item.rate}%` }} /></div></div>)}</div></article></section><section className={`${card} mt-5`}><p className="text-xs uppercase tracking-[0.15em] text-indigo-300">Next week</p><h2 className="mt-1 text-lg font-semibold text-white">Simple process recommendations</h2><ol className="mt-5 space-y-3">{insights.recommendations.map((recommendation, index) => <li key={recommendation} className="flex gap-3 text-sm leading-6 text-slate-300"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-400/10 text-xs font-semibold text-indigo-200">{index + 1}</span>{recommendation}</li>)}</ol></section><p className="mt-5 text-xs leading-5 text-slate-500">These associations are simple rule-based summaries, not causal findings or financial advice. As more weeks are logged, the patterns become more useful for reviewing your own process.</p></div></main>;
}
