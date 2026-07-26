"use client";

import { FormEvent, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { decidePreTrade } from "@/lib/pre-trade-decision";

const assets = [
  { value: "XAUUSD", label: "Gold / XAUUSD" },
  { value: "NAS100", label: "Nasdaq 100" },
  { value: "GER40", label: "GER40 / DAX" },
];

type CheckKey = "economicCalendarChecked" | "marketConditionsSupportIdea" | "hasClearInvalidation" | "riskRewardAcceptable" | "matchesTradingPlan" | "emotionalStateAcceptable";

const checks: Array<{ key: CheckKey; label: string; help?: string }> = [
  { key: "economicCalendarChecked", label: "Has the economic calendar been checked?", help: "Confirm there is no unplanned high-impact event risk." },
  { key: "marketConditionsSupportIdea", label: "Do market conditions support the idea?" },
  { key: "hasClearInvalidation", label: "Is there clear invalidation?", help: "Define what would prove the scenario wrong before taking risk." },
  { key: "riskRewardAcceptable", label: "Is risk/reward acceptable?" },
  { key: "matchesTradingPlan", label: "Does the trade match the trading plan?" },
  { key: "emotionalStateAcceptable", label: "Is emotional state acceptable?" },
];

const defaultChecks = Object.fromEntries(checks.map(({ key }) => [key, null])) as Record<CheckKey, boolean | null>;

export function PreTradeChecklistForm() {
  const [asset, setAsset] = useState("XAUUSD");
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [setupType, setSetupType] = useState("");
  const [risk, setRisk] = useState("1");
  const [answers, setAnswers] = useState(defaultChecks);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const allAnswered = checks.every(({ key }) => answers[key] !== null);
  const numericRisk = Number(risk);
  const decision = allAnswered && Number.isFinite(numericRisk) && numericRisk > 0
    ? decidePreTrade({ plannedRiskPercentage: numericRisk, ...answers as Record<CheckKey, boolean> })
    : null;
  const decisionStyle = decision?.recommendation === "proceed" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : decision?.recommendation === "avoid" ? "border-rose-400/20 bg-rose-400/10 text-rose-200" : decision?.recommendation === "reduce_size" ? "border-orange-400/20 bg-orange-400/10 text-orange-200" : "border-amber-300/20 bg-amber-300/10 text-amber-100";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!setupType.trim() || !allAnswered || !decision || !Number.isFinite(numericRisk) || numericRisk <= 0 || numericRisk > 100) {
      setStatus("error");
      setMessage("Complete every field and use a valid planned risk percentage.");
      return;
    }

    setStatus("saving");
    setMessage("");
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw new Error("Sign in before saving a pre-trade checklist.");

      const { data: assetRow, error: assetError } = await supabase.from("assets").select("id").eq("symbol", asset).single();
      if (assetError || !assetRow) throw new Error("The selected asset could not be found.");

      const { error } = await supabase.from("pre_trade_checklists").insert({
        user_id: authData.user.id,
        asset_id: assetRow.id,
        direction,
        setup_type: setupType.trim(),
        risk_percent: numericRisk,
        reason_for_trade: notes.trim() || "Pre-trade checklist completed.",
        economic_calendar_checked: answers.economicCalendarChecked,
        market_conditions_aligned: answers.marketConditionsSupportIdea,
        has_clear_invalidation: answers.hasClearInvalidation,
        risk_reward_acceptable: answers.riskRewardAcceptable,
        emotional_state_acceptable: answers.emotionalStateAcceptable,
        trade_matches_plan: answers.matchesTradingPlan,
        recommendation: decision.recommendation,
        recommendation_reason: decision.reason,
        notes: notes.trim() || null,
      });
      if (error) throw error;
      setStatus("success");
      setMessage(`${decision.label}: checklist saved with its decision rationale.`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to save this checklist.");
    }
  }

  return <form onSubmit={submit} className="space-y-6"><section className="rounded-2xl border border-white/[0.08] bg-[#0e131d] p-5 sm:p-7"><div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-medium text-slate-200">Asset<select value={asset} onChange={(event) => setAsset(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-[#080b10] px-3 py-2.5 text-slate-200 outline-none focus:border-indigo-400">{assets.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><fieldset><legend className="text-sm font-medium text-slate-200">Intended direction</legend><div className="mt-2 grid grid-cols-2 rounded-lg border border-white/10 bg-[#080b10] p-1">{(["long", "short"] as const).map((value) => <button key={value} type="button" onClick={() => setDirection(value)} className={`rounded-md py-2 text-sm font-medium capitalize ${direction === value ? value === "long" ? "bg-emerald-400 text-[#06251d]" : "bg-rose-400 text-[#31080c]" : "text-slate-500 hover:text-slate-200"}`}>{value}</button>)}</div></fieldset><label className="text-sm font-medium text-slate-200">Setup type<input value={setupType} onChange={(event) => setSetupType(event.target.value)} placeholder="e.g. Break and retest" className="mt-2 w-full rounded-lg border border-white/10 bg-[#080b10] px-3 py-2.5 text-slate-200 outline-none placeholder:text-slate-600 focus:border-indigo-400" /></label><label className="text-sm font-medium text-slate-200">Planned risk percentage<input value={risk} min="0.01" max="100" step="0.01" onChange={(event) => setRisk(event.target.value)} type="number" className="mt-2 w-full rounded-lg border border-white/10 bg-[#080b10] px-3 py-2.5 text-slate-200 outline-none focus:border-indigo-400" /></label></div></section><section className="rounded-2xl border border-white/[0.08] bg-[#0e131d] p-5 sm:p-7"><p className="text-xs font-medium uppercase tracking-[0.15em] text-indigo-300">Decision gate</p><h2 className="mt-1 text-xl font-semibold text-white">Confirm the conditions before taking risk.</h2><div className="mt-4 divide-y divide-white/[0.07]">{checks.map(({ key, label, help }, index) => <fieldset key={key} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div><legend className="text-sm font-medium text-slate-200"><span className="mr-3 text-xs text-slate-600">{String(index + 1).padStart(2, "0")}</span>{label}</legend>{help && <p className="mt-1 pl-7 text-xs text-slate-500">{help}</p>}</div><div className="grid grid-cols-2 rounded-lg border border-white/10 bg-[#080b10] p-1 sm:w-40">{([true, false] as const).map((value) => <button key={String(value)} type="button" onClick={() => setAnswers((current) => ({ ...current, [key]: value }))} className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${answers[key] === value ? value ? "bg-emerald-400 text-[#06251d]" : "bg-rose-400 text-[#31080c]" : "text-slate-500 hover:text-slate-200"}`}>{value ? "Yes" : "No"}</button>)}</div></fieldset>)}</div></section>{decision && <section className={`rounded-2xl border p-5 ${decisionStyle}`}><div className="flex items-center justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.15em] opacity-75">Decision output</p><h2 className="mt-1 text-xl font-semibold">{decision.label}</h2></div><span className="rounded-full border border-current/30 px-3 py-1.5 text-xs font-semibold">Rule-based</span></div><p className="mt-3 text-sm leading-6 opacity-90">{decision.reason}</p></section>}<section className="rounded-2xl border border-white/[0.08] bg-[#0e131d] p-5 sm:p-7"><label htmlFor="notes" className="text-sm font-medium text-slate-200">Optional notes</label><textarea id="notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} placeholder="What makes this scenario worth considering?" className="mt-3 w-full resize-y rounded-lg border border-white/10 bg-[#080b10] p-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-indigo-400" /></section>{status !== "idle" && <p className={`rounded-lg border px-4 py-3 text-sm ${status === "success" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : status === "error" ? "border-rose-400/20 bg-rose-400/10 text-rose-200" : "border-indigo-400/20 bg-indigo-400/10 text-indigo-200"}`}>{message || "Saving checklist…"}</p>}<button disabled={status === "saving"} type="submit" className="w-full rounded-lg bg-indigo-500 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60">{status === "saving" ? "Saving checklist…" : "Save pre-trade checklist"}</button></form>;
}
