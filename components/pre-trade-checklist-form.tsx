"use client";

import { FormEvent, useState } from "react";
import { assetOptionLabel, useJournalAssets } from "@/lib/journal-assets";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { decidePreTrade } from "@/lib/pre-trade-decision";

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

function checksAreComplete(
  answers: Record<CheckKey, boolean | null>,
): answers is Record<CheckKey, boolean> {
  return checks.every(({ key }) => answers[key] !== null);
}

export function PreTradeChecklistForm() {
  const [asset, setAsset] = useState("XAUUSD");
  const { watchlistAssets, otherAssets, status: assetStatus } = useJournalAssets();
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [setupType, setSetupType] = useState("");
  const [risk, setRisk] = useState("1");
  const [answers, setAnswers] = useState(defaultChecks);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const allAnswered = checksAreComplete(answers);
  const numericRisk = Number(risk);
  const decision = allAnswered && Number.isFinite(numericRisk) && numericRisk > 0
    ? decidePreTrade({ plannedRiskPercentage: numericRisk, ...answers })
    : null;
  const decisionStyle = decision?.recommendation === "proceed" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : decision?.recommendation === "avoid" ? "border-rose-400/20 bg-rose-400/10 text-rose-200" : decision?.recommendation === "reduce_size" ? "border-orange-400/20 bg-orange-400/10 text-orange-200" : "border-amber-300/20 bg-amber-300/10 text-amber-100";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!setupType.trim() || !checksAreComplete(answers) || !decision || !Number.isFinite(numericRisk) || numericRisk <= 0 || numericRisk > 100) {
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
      if (assetError) throw new Error(`The selected asset could not be loaded: ${assetError.message}`);
      if (!assetRow) throw new Error("The selected asset could not be found.");

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

  return <form onSubmit={submit} className="decision-form">
    <section className="form-section">
      <div className="form-grid">
        <label className="form-field"><span className="form-label">Asset</span><select value={asset} onChange={(event) => setAsset(event.target.value)}><optgroup label="My watchlist">{watchlistAssets.map((item) => <option key={item.id} value={item.symbol}>{assetOptionLabel(item)}</option>)}</optgroup>{otherAssets.length > 0 && <optgroup label="All supported markets">{otherAssets.map((item) => <option key={item.id} value={item.symbol}>{assetOptionLabel(item)}</option>)}</optgroup>}</select><span className="form-help">{assetStatus === "loading" ? "Loading the supported market catalogue…" : assetStatus === "fallback" ? "Showing the local market catalogue while Supabase reconnects." : `${watchlistAssets.length} watchlist markets shown first; all ${watchlistAssets.length + otherAssets.length} markets can be journaled.`}</span></label>
        <fieldset className="form-field"><legend className="form-label">Intended direction</legend><div className="form-segment">{(["long", "short"] as const).map((value) => <button key={value} type="button" onClick={() => setDirection(value)} className={`capitalize ${direction === value ? value === "long" ? "is-positive" : "is-negative" : ""}`}>{value}</button>)}</div></fieldset>
        <label className="form-field"><span className="form-label">Setup type</span><input value={setupType} onChange={(event) => setSetupType(event.target.value)} placeholder="e.g. Break and retest" /></label>
        <label className="form-field"><span className="form-label">Planned risk percentage</span><input value={risk} min="0.01" max="100" step="0.01" onChange={(event) => setRisk(event.target.value)} type="number" /><span className="form-help">Percentage of account equity at risk.</span></label>
      </div>
    </section>

    <section className="form-section">
      <p className="form-eyebrow">Decision gate</p>
      <h2 className="form-title">Confirm the conditions before taking risk.</h2>
      <p className="form-description">Answer every condition. Your output updates automatically.</p>
      <div className="form-question-list">{checks.map(({ key, label, help }, index) => <fieldset key={key} className="form-question"><div><legend className="form-label"><span className="question-index">{String(index + 1).padStart(2, "0")}</span>{label}</legend>{help && <p className="form-help question-help">{help}</p>}</div><div className="form-segment form-segment-compact">{([true, false] as const).map((value) => <button key={String(value)} type="button" onClick={() => setAnswers((current) => ({ ...current, [key]: value }))} className={answers[key] === value ? value ? "is-positive" : "is-negative" : ""}>{value ? "Yes" : "No"}</button>)}</div></fieldset>)}</div>
    </section>

    {decision && <section className={`form-section border ${decisionStyle}`}><div className="flex items-center justify-between"><div><p className="form-eyebrow opacity-75">Decision output</p><h2 className="form-title">{decision.label}</h2></div><span className="rounded-full border border-current/30 px-3 py-1.5 text-xs font-semibold">Rule-based</span></div><p className="mt-3 text-sm leading-6 opacity-90">{decision.reason}</p></section>}

    <section className="form-section"><label htmlFor="notes" className="form-field"><span className="form-label">Optional notes</span><span className="form-help">Capture the reasoning or context you may want to review later.</span><textarea id="notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} placeholder="What makes this scenario worth considering?" /></label></section>
    {status !== "idle" && <p className={`form-status ${status === "success" ? "is-success" : status === "error" ? "is-error" : "is-saving"}`}>{message || "Saving checklist…"}</p>}
    <button disabled={status === "saving"} type="submit" className="form-submit">{status === "saving" ? "Saving checklist…" : "Save pre-trade checklist"}</button>
  </form>;
}
