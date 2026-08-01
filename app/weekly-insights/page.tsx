"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Database, Json } from "@/lib/database.types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { AppShell } from "@/components/app-shell";
import {
  analyseWeek,
  buildWeeklyInsightDraft,
  demoBehaviourEntries,
  demoChecklists,
  demoTrades,
  type BehaviourEntry,
  type PreTradeEntry,
  type TradeOutcome,
} from "@/lib/weekly-insights";

const card = "surface p-5";
type SavedWeeklyInsight = Pick<
  Database["public"]["Tables"]["weekly_insights"]["Row"],
  "id" | "week_start" | "week_end" | "summary" | "trades_taken" | "win_rate" | "net_pnl" | "net_r_multiple" | "recommendations" | "generated_at"
>;

function currentWeekBounds() {
  const now = new Date();
  const monday = new Date(now);
  monday.setHours(12, 0, 0, 0);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { weekStart: monday.toISOString().slice(0, 10), weekEnd: sunday.toISOString().slice(0, 10) };
}

function reportWeekLabel(start: string, end: string) {
  const format = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
  return `${format(start)} – ${format(end)}`;
}

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
  const [{ weekStart, weekEnd }] = useState(currentWeekBounds);
  const [savedReports, setSavedReports] = useState<SavedWeeklyInsight[]>([]);
  const [isDemo, setIsDemo] = useState(true);
  const [status, setStatus] = useState("Showing demonstration data until your Supabase account is connected.");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    async function loadInsights() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) return;
        const [behaviourResult, tradeResult, checklistResult, historyResult] = await Promise.all([
          supabase.from("behaviour_journal_entries").select("entry_date,slept_well,felt_calm_before_trading,felt_pressure_to_make_money,traded_after_a_loss,overtraded,revenge_traded,respected_stop,followed_plan,traded_during_news,net_positive").gte("entry_date", weekStart).order("entry_date"),
          supabase.from("trades").select("date,pnl,realised_r_multiple,result,followed_plan,respected_stop,mistake_type,setup_type,checklist_id,pre_trade_checklists(recommendation)").gte("date", weekStart).order("date"),
          supabase.from("pre_trade_checklists").select("submitted_at,risk_percent,economic_calendar_checked,market_conditions_aligned,has_clear_invalidation,risk_reward_acceptable,emotional_state_acceptable,trade_matches_plan,recommendation").gte("submitted_at", `${weekStart}T00:00:00`).order("submitted_at"),
          supabase.from("weekly_insights").select("id,week_start,week_end,summary,trades_taken,win_rate,net_pnl,net_r_multiple,recommendations,generated_at").order("week_start", { ascending: false }).limit(12),
        ]);
        if (behaviourResult.error) throw behaviourResult.error;
        if (tradeResult.error) throw tradeResult.error;
        if (checklistResult.error) throw checklistResult.error;
        if (historyResult.error) throw historyResult.error;

        setEntries((behaviourResult.data ?? []) as BehaviourEntry[]);
        setTrades((tradeResult.data ?? []).map((trade) => ({
          date: trade.date,
          pnl: trade.pnl,
          realised_r_multiple: trade.realised_r_multiple,
          result: trade.result,
          followed_plan: trade.followed_plan,
          respected_stop: trade.respected_stop,
          mistake_type: trade.mistake_type,
          setup_type: trade.setup_type,
          checklist_id: trade.checklist_id,
          checklist_recommendation: trade.pre_trade_checklists?.recommendation ?? null,
        })));
        setChecklists((checklistResult.data ?? []) as PreTradeEntry[]);
        setSavedReports(historyResult.data ?? []);
        setIsDemo(false);
        setStatus("All three sections use this week’s saved checklist, trade, and behaviour records.");
      } catch (error) {
        setStatus(error instanceof Error ? `${error.message} Showing demonstration data instead.` : "Showing demonstration data instead.");
      }
    }
    loadInsights();
  }, [weekStart]);

  const insights = useMemo(() => analyseWeek(entries, trades, checklists), [entries, trades, checklists]);
  const hasWeekData = insights.overview.tradingDays > 0 || insights.overview.checklistCount > 0;
  const currentWeekSaved = savedReports.some((report) => report.week_start === weekStart);

  async function saveCurrentReport() {
    if (isDemo || !hasWeekData) {
      setSaveStatus("error");
      setSaveMessage("Log at least one checklist, trade, or behaviour entry before saving this week.");
      return;
    }

    setSaveStatus("saving");
    setSaveMessage("");

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw new Error("Sign in before saving a weekly report.");
      const draft = buildWeeklyInsightDraft(insights, weekStart, weekEnd);
      const { data, error } = await supabase.from("weekly_insights").upsert({
        ...draft,
        correlations: draft.correlations as Json,
        user_id: authData.user.id,
        generated_at: new Date().toISOString(),
      }, { onConflict: "user_id,week_start" }).select("id,week_start,week_end,summary,trades_taken,win_rate,net_pnl,net_r_multiple,recommendations,generated_at").single();

      if (error) throw error;
      setSavedReports((current) => [data, ...current.filter((report) => report.id !== data.id)].sort((a, b) => b.week_start.localeCompare(a.week_start)));
      setSaveStatus("success");
      setSaveMessage(currentWeekSaved ? "This week’s saved report has been updated." : "This week’s report has been saved.");
    } catch (error) {
      setSaveStatus("error");
      setSaveMessage(error instanceof Error ? error.message : "Unable to save this weekly report.");
    }
  }

  return <AppShell>
    <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow text-violet-300">Weekly insights</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-white">Your process, seen clearly.</h1><p className="mt-2 text-sm text-slate-500">Rule-based findings across preparation, execution, and behaviour.</p></div><span className={`rounded-full px-3 py-1.5 text-xs font-medium ${isDemo ? "bg-amber-300/10 text-amber-100" : "bg-emerald-400/10 text-emerald-200"}`}>{isDemo ? "Demo data" : "Live weekly data"}</span></header>
    <p className="mb-5 rounded-lg border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-sm text-slate-400">{status}</p>
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Trading days" value={insights.overview.tradingDays} note="Journal and trade activity" /><Metric label="Net positive days" value={insights.overview.netPositiveDays} note="Daily outcome or summed P&L" tone="text-emerald-200" /><Metric label="Average discipline" value={`${insights.overview.averageDiscipline}/100`} note="Nine behaviour controls" tone="text-indigo-200" /><Metric label="Pre-trade checks" value={insights.overview.checklistCount} note="Decision gates completed" /></section>

    <section className="mt-8"><p className="text-xs font-medium uppercase tracking-[0.15em] text-indigo-300">01 · Pre-Trade Checklist insights</p><h2 className="mt-1 text-xl font-semibold text-white">Preparation and decision quality</h2><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Proceed rate" value={`${insights.preTrade.proceedRate}%`} note={`${insights.preTrade.total} total checklists`} tone="text-emerald-200" /><Metric label="Plan alignment" value={`${insights.preTrade.planAlignment}%`} note="Ideas matching the trading plan" /><Metric label="Calendar compliance" value={`${insights.preTrade.calendarCompliance}%`} note="High-impact calendar checked" /><Metric label="Average planned risk" value={`${insights.preTrade.averageRisk}%`} note="Risk declared before execution" /></div><div className="mt-4 grid gap-4 lg:grid-cols-2"><article className={card}><p className="text-xs uppercase tracking-wider text-slate-500">Decision outputs</p><Breakdown items={insights.preTrade.decisionBreakdown} /></article><article className={card}><p className="text-xs uppercase tracking-wider text-slate-500">Most common blocker</p><p className="mt-4 text-xl font-semibold text-amber-100">{insights.preTrade.mostCommonBlocker}</p><p className="mt-2 text-sm leading-6 text-slate-500">This is the condition most frequently preventing full alignment before a trade.</p></article></div></section>

    <section className="mt-8">
      <p className="text-xs font-medium uppercase tracking-[0.15em] text-emerald-300">02 · Trade Journal insights</p>
      <h2 className="mt-1 text-xl font-semibold text-white">Execution and actual outcomes</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Trades recorded" value={insights.trades.total} note="Completed journal outcomes" /><Metric label="Win rate" value={`${insights.trades.winRate}%`} note="Wins as a share of recorded trades" tone="text-emerald-200" /><Metric label="Net P&L" value={`$${insights.trades.netPnl.toFixed(2)}`} note="Total realised outcome" tone={insights.trades.netPnl >= 0 ? "text-emerald-200" : "text-rose-200"} /><Metric label="Plan adherence" value={`${insights.trades.planAdherence}%`} note={`Stop discipline: ${insights.trades.stopDiscipline}%`} /></div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2"><article className={card}><p className="text-xs uppercase tracking-wider text-slate-500">Trade results</p><Breakdown items={insights.trades.resultBreakdown} /></article><article className={card}><p className="text-xs uppercase tracking-wider text-slate-500">Most common execution mistake</p><p className="mt-4 text-xl font-semibold text-rose-200">{insights.trades.commonMistake}</p><p className="mt-2 text-sm leading-6 text-slate-500">Categorised from post-trade reviews, independent of whether the trade made money.</p></article></div>
      <article className={`${card} mt-4 border-emerald-400/15 bg-emerald-400/[0.035]`}>
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><p className="text-xs uppercase tracking-[0.15em] text-emerald-300">Decision gate → outcome</p><h3 className="mt-1 text-lg font-semibold text-white">Checklist adherence versus recorded result</h3></div><span className="text-sm font-medium text-slate-300">{insights.trades.checklistLinkRate}% of trades linked</span></div>
        <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead><tr className="border-b border-white/[0.08] text-xs uppercase tracking-wider text-slate-500"><th className="pb-3 font-medium">Pre-trade output</th><th className="pb-3 text-right font-medium">Trades</th><th className="pb-3 text-right font-medium">Win rate</th><th className="pb-3 text-right font-medium">Net P&amp;L</th><th className="pb-3 text-right font-medium">Combined R</th></tr></thead><tbody>{insights.trades.gateOutcomes.map((group) => <tr key={group.label} className="border-b border-white/[0.05] last:border-0"><td className="py-3.5 font-medium" style={{ color: group.colour }}>{group.label}</td><td className="py-3.5 text-right text-slate-300">{group.trades}</td><td className="py-3.5 text-right text-slate-300">{group.winRate}%</td><td className={`py-3.5 text-right ${group.netPnl >= 0 ? "text-emerald-200" : "text-rose-200"}`}>${group.netPnl.toFixed(2)}</td><td className={`py-3.5 text-right ${group.netR >= 0 ? "text-emerald-200" : "text-rose-200"}`}>{group.netR.toFixed(2)}R</td></tr>)}</tbody></table></div>
        <p className="mt-4 text-xs leading-5 text-slate-500">This comparison is descriptive. It shows what happened after each rule-based decision output; it does not predict future outcomes.</p>
      </article>
    </section>

    <section className="mt-8"><p className="text-xs font-medium uppercase tracking-[0.15em] text-violet-300">03 · Behaviour Journal insights</p><h2 className="mt-1 text-xl font-semibold text-white">Personal state and discipline patterns</h2><div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_0.6fr]"><article className={card}><p className="text-xs uppercase tracking-wider text-slate-500">Discipline by day</p><div className="mt-5 h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={insights.behaviour.dailyDiscipline}><CartesianGrid vertical={false} stroke="#ffffff12" /><XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} /><YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: "#ffffff08" }} contentStyle={{ background: "#111827", border: "1px solid #ffffff18", borderRadius: 10 }} /><Bar dataKey="score" radius={[6, 6, 0, 0]}>{insights.behaviour.dailyDiscipline.map((entry) => <Cell key={entry.date} fill={entry.score >= 75 ? "#34d399" : entry.score >= 60 ? "#fbbf24" : "#fb7185"} />)}</Bar></BarChart></ResponsiveContainer></div></article><article className={card}><p className="text-xs uppercase tracking-wider text-slate-500">Most common negative behaviour</p><p className="mt-4 text-xl font-semibold text-rose-200">{insights.behaviour.mostCommonNegative}</p><p className="mt-2 text-sm leading-6 text-slate-500">Frequency identifies what deserves attention; it does not prove causation.</p></article></div><div className="mt-4 grid gap-4 lg:grid-cols-2"><Associations title="Associated with net positive days" items={insights.behaviour.positiveAssociations} tone="positive" /><Associations title="Associated with net negative days" items={insights.behaviour.negativeAssociations} tone="negative" /></div></section>

    <section className={`${card} mt-8 border-indigo-400/15 bg-indigo-400/[0.04]`}><p className="text-xs uppercase tracking-[0.15em] text-indigo-300">Combined next-week actions</p><h2 className="mt-1 text-lg font-semibold text-white">Recommendations across all three datasets</h2><ol className="mt-5 space-y-3">{insights.recommendations.map((item, index) => <li key={item} className="flex gap-3 text-sm leading-6 text-slate-300"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-400/10 text-xs font-semibold text-indigo-200">{index + 1}</span>{item}</li>)}</ol></section>

    <section className="mt-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-medium uppercase tracking-[0.15em] text-sky-300">Saved reports</p><h2 className="mt-1 text-xl font-semibold text-white">Weekly review history</h2><p className="mt-2 text-sm text-slate-500">Save a snapshot at week-end, or update it as this week’s records change.</p></div><button type="button" onClick={saveCurrentReport} disabled={saveStatus === "saving" || isDemo || !hasWeekData} className="inline-flex h-11 items-center justify-center rounded-xl bg-sky-400 px-5 text-sm font-semibold text-[#06202a] transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-40">{saveStatus === "saving" ? "Saving report…" : currentWeekSaved ? "Update this week’s report" : "Save this week’s report"}</button></div>
      {saveStatus !== "idle" && <p className={`mt-4 rounded-lg border px-4 py-3 text-sm ${saveStatus === "success" ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-200" : saveStatus === "error" ? "border-rose-400/20 bg-rose-400/[0.06] text-rose-200" : "border-white/[0.08] bg-white/[0.025] text-slate-400"}`}>{saveMessage || "Saving this week’s report…"}</p>}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">{savedReports.length ? savedReports.map((report) => <article key={report.id} className={card}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-wider text-slate-500">{reportWeekLabel(report.week_start, report.week_end)}</p><p className="mt-2 text-sm leading-6 text-slate-300">{report.summary}</p></div>{report.week_start === weekStart && <span className="rounded-full bg-sky-400/10 px-2.5 py-1 text-xs font-medium text-sky-200">Current week</span>}</div><div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/[0.07] pt-4"><div><p className="text-xs text-slate-500">Trades</p><p className="mt-1 font-semibold text-white">{report.trades_taken}</p></div><div><p className="text-xs text-slate-500">Net P&amp;L</p><p className={`mt-1 font-semibold ${Number(report.net_pnl ?? 0) >= 0 ? "text-emerald-200" : "text-rose-200"}`}>{report.net_pnl === null ? "—" : `$${Number(report.net_pnl).toFixed(2)}`}</p></div><div><p className="text-xs text-slate-500">Combined R</p><p className={`mt-1 font-semibold ${Number(report.net_r_multiple ?? 0) >= 0 ? "text-emerald-200" : "text-rose-200"}`}>{report.net_r_multiple === null ? "—" : `${Number(report.net_r_multiple).toFixed(2)}R`}</p></div></div>{report.recommendations.length > 0 && <p className="mt-4 text-xs leading-5 text-slate-500">Priority: {report.recommendations[0]}</p>}</article>) : <div className="surface p-6 lg:col-span-2"><p className="text-sm font-medium text-slate-300">No weekly reports saved yet.</p><p className="mt-2 text-sm leading-6 text-slate-500">Once this week contains logged activity, save its report here to start building your review history.</p></div>}</div>
    </section>
    <p className="mt-5 text-xs leading-5 text-slate-500">These are transparent rule-based summaries, not causal findings, predictions, or financial advice. No AI is used.</p>
  </AppShell>;
}
