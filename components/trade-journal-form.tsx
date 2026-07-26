"use client";

import { FormEvent, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const assets = [
  { value: "XAUUSD", label: "Gold / XAUUSD" },
  { value: "NAS100", label: "Nasdaq 100" },
  { value: "GER40", label: "GER40 / DAX" },
];

type Result = "win" | "loss" | "breakeven";

function YesNo({ value, onChange }: { value: boolean; onChange: (value: boolean) => void }) {
  return <div className="form-segment">{([true, false] as const).map((choice) => <button key={String(choice)} type="button" onClick={() => onChange(choice)} className={value === choice ? choice ? "is-positive" : "is-negative" : ""}>{choice ? "Yes" : "No"}</button>)}</div>;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="form-label">{children}</span>;
}

function ScreenshotPicker({ label, file, onChange, tone }: { label: string; file: File | null; onChange: (file: File | null) => void; tone: "indigo" | "emerald" }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const toneClass = tone === "indigo" ? "file:bg-indigo-400/10 file:text-indigo-200" : "file:bg-emerald-400/10 file:text-emerald-200";
  return <div className="form-field"><label className="block"><FieldLabel>{label}</FieldLabel><span className="form-help">PNG, JPEG, or WebP. Your preview appears below.</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => onChange(event.target.files?.[0] ?? null)} className={`form-file ${toneClass}`} /></label>{previewUrl ? <figure className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-[#080b10]"><img src={previewUrl} alt={`${label} preview`} className="max-h-[520px] w-full object-contain" /><figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] px-3 py-2 text-xs text-slate-500"><span className="truncate">{file?.name}</span><span>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ""}</span></figcaption></figure> : <div className="form-upload-placeholder">Your chart screenshot preview will appear here.</div>}</div>;
}

export function TradeJournalForm() {
  const [asset, setAsset] = useState("XAUUSD");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [setupType, setSetupType] = useState("");
  const [beforeAnalysis, setBeforeAnalysis] = useState("");
  const [entryReason, setEntryReason] = useState("");
  const [riskAmount, setRiskAmount] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [result, setResult] = useState<Result>("win");
  const [pnl, setPnl] = useState("");
  const [resultConclusion, setResultConclusion] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [followedPlan, setFollowedPlan] = useState(true);
  const [respectedStop, setRespectedStop] = useState(true);
  const [mistakeType, setMistakeType] = useState("");
  const [closingCommentary, setClosingCommentary] = useState("");
  const [notes, setNotes] = useState("");
  const [beforeScreenshot, setBeforeScreenshot] = useState<File | null>(null);
  const [afterScreenshot, setAfterScreenshot] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function uploadScreenshot(file: File, userId: string, tradeId: string, phase: "before" | "after") {
    const supabase = getSupabaseBrowserClient();
    const extension = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${userId}/${tradeId}/${phase}-${Date.now()}.${extension}`;
    const { error } = await supabase.storage.from("trade-journal-screenshots").upload(path, file, { upsert: false });
    if (error) throw error;
    return path;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!setupType.trim() || !beforeAnalysis.trim() || !entryReason.trim() || !reviewNotes.trim() || !closingCommentary.trim()) {
      setStatus("error");
      setMessage("Complete the analysis, entry rationale, review, and closing commentary.");
      return;
    }

    setStatus("saving");
    setMessage("");
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw new Error("Sign in before saving a trade journal entry.");
      const { data: assetRow, error: assetError } = await supabase.from("assets").select("id").eq("symbol", asset).single();
      if (assetError || !assetRow) throw new Error("The selected asset could not be found.");

      const tradeId = crypto.randomUUID();
      const beforePath = beforeScreenshot ? await uploadScreenshot(beforeScreenshot, authData.user.id, tradeId, "before") : null;
      const afterPath = afterScreenshot ? await uploadScreenshot(afterScreenshot, authData.user.id, tradeId, "after") : null;
      const numericPnl = pnl.trim() === "" ? null : Number(pnl);
      const numericRisk = riskAmount.trim() === "" ? null : Number(riskAmount);
      const numericTarget = targetAmount.trim() === "" ? null : Number(targetAmount);

      const { error } = await supabase.from("trades").insert({
        id: tradeId,
        user_id: authData.user.id,
        asset_id: assetRow.id,
        date,
        direction,
        setup_type: setupType.trim(),
        status: "closed",
        result,
        pnl: numericPnl,
        risk_amount: numericRisk,
        target_amount: numericTarget,
        currency: "USD",
        followed_plan: followedPlan,
        respected_stop: respectedStop,
        mistake_type: mistakeType.trim() || null,
        before_analysis: beforeAnalysis.trim(),
        entry_reason: entryReason.trim(),
        result_conclusion: resultConclusion.trim() || null,
        review_notes: reviewNotes.trim(),
        closing_commentary: closingCommentary.trim(),
        before_screenshot_path: beforePath,
        after_screenshot_path: afterPath,
        notes: notes.trim() || null,
      });
      if (error) throw error;
      setStatus("success");
      setMessage("Trade journal entry saved, including its before-and-after review context.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to save this trade journal entry.");
    }
  }

  const inputClass = "mt-2 w-full rounded-lg border border-white/10 bg-[#080b10] px-3 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-indigo-400";
  const textAreaClass = `${inputClass} resize-y`;

  return <form onSubmit={submit} className="decision-form">
    <section className="form-section"><p className="form-eyebrow">Trade details</p><h2 className="form-title">Record the execution context.</h2><p className="form-description">Start with the facts of the trade before reviewing the outcome.</p><div className="form-grid mt-5"><label className="form-field"><FieldLabel>Trading pair</FieldLabel><select value={asset} onChange={(event) => setAsset(event.target.value)} className={inputClass}>{assets.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label className="form-field"><FieldLabel>Date</FieldLabel><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className={inputClass} /></label><fieldset className="form-field"><FieldLabel>Direction</FieldLabel><div className="form-segment">{(["long", "short"] as const).map((value) => <button key={value} type="button" onClick={() => setDirection(value)} className={`capitalize ${direction === value ? value === "long" ? "is-positive" : "is-negative" : ""}`}>{value}</button>)}</div></fieldset><label className="form-field"><FieldLabel>Entry / setup type</FieldLabel><input value={setupType} onChange={(event) => setSetupType(event.target.value)} placeholder="e.g. Risk entry, break and retest" className={inputClass} /></label></div></section>

    <section className="rounded-2xl border border-indigo-400/15 bg-indigo-400/[0.04] p-5 sm:p-7"><p className="text-xs font-medium uppercase tracking-[0.15em] text-indigo-300">Before the trade</p><div className="mt-5 space-y-5"><label className="block"><FieldLabel>Before analysis</FieldLabel><textarea rows={5} value={beforeAnalysis} onChange={(event) => setBeforeAnalysis(event.target.value)} placeholder="Describe structure, context, levels, and the scenario you expected." className={textAreaClass} /></label><label className="block"><FieldLabel>Reason(s) for entry</FieldLabel><textarea rows={5} value={entryReason} onChange={(event) => setEntryReason(event.target.value)} placeholder="What specifically justified the entry at that moment?" className={textAreaClass} /></label><ScreenshotPicker label="Screenshot before" file={beforeScreenshot} onChange={setBeforeScreenshot} tone="indigo" /></div></section>

    <section className="rounded-2xl border border-white/[0.08] bg-[#0e131d] p-5 sm:p-7"><p className="text-xs font-medium uppercase tracking-[0.15em] text-slate-500">Risk and outcome</p><div className="mt-5 grid gap-5 sm:grid-cols-2"><label><FieldLabel>Risk amount (USD)</FieldLabel><input type="number" min="0" step="0.01" value={riskAmount} onChange={(event) => setRiskAmount(event.target.value)} placeholder="120.15" className={inputClass} /></label><label><FieldLabel>Target amount (USD)</FieldLabel><input type="number" min="0" step="0.01" value={targetAmount} onChange={(event) => setTargetAmount(event.target.value)} placeholder="346.00" className={inputClass} /></label><label><FieldLabel>Result</FieldLabel><select value={result} onChange={(event) => setResult(event.target.value as Result)} className={inputClass}><option value="win">Win</option><option value="loss">Loss</option><option value="breakeven">Breakeven</option></select></label><label><FieldLabel>Realised P&amp;L (USD)</FieldLabel><input type="number" step="0.01" value={pnl} onChange={(event) => setPnl(event.target.value)} placeholder="Use a negative value for a loss" className={inputClass} /></label></div><label className="mt-5 block"><FieldLabel>Result and conclusion</FieldLabel><textarea rows={3} value={resultConclusion} onChange={(event) => setResultConclusion(event.target.value)} placeholder="Summarise the outcome in one clear paragraph." className={textAreaClass} /></label></section>

    <section className="rounded-2xl border border-white/[0.08] bg-[#0e131d] p-5 sm:p-7"><p className="text-xs font-medium uppercase tracking-[0.15em] text-emerald-300">Post-trade review</p><div className="mt-5 space-y-5"><label className="block"><FieldLabel>What went well and what should improve?</FieldLabel><textarea rows={6} value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} placeholder="Separate good analysis from execution mistakes. Be specific." className={textAreaClass} /></label><div className="grid gap-5 sm:grid-cols-2"><fieldset><FieldLabel>Did the trade follow the plan?</FieldLabel><div className="mt-2"><YesNo value={followedPlan} onChange={setFollowedPlan} /></div></fieldset><fieldset><FieldLabel>Was the stop respected?</FieldLabel><div className="mt-2"><YesNo value={respectedStop} onChange={setRespectedStop} /></div></fieldset></div><label className="block"><FieldLabel>Primary mistake type</FieldLabel><select value={mistakeType} onChange={(event) => setMistakeType(event.target.value)} className={inputClass}><option value="">No mistake / not categorised</option><option value="entry_timing">Entry timing</option><option value="no_clear_entry">No clear entry methodology</option><option value="overtrading">Overtrading</option><option value="revenge_trading">Revenge trading</option><option value="forced_trade">Forced trade</option><option value="risk_management">Risk management</option><option value="news_exposure">News exposure</option><option value="plan_deviation">Plan deviation</option><option value="analysis_error">Analysis error</option></select></label><ScreenshotPicker label="Screenshot after" file={afterScreenshot} onChange={setAfterScreenshot} tone="emerald" /><label className="block"><FieldLabel>Closing commentary</FieldLabel><textarea rows={6} value={closingCommentary} onChange={(event) => setClosingCommentary(event.target.value)} placeholder="What will you carry forward into the next session?" className={textAreaClass} /></label><label className="block"><FieldLabel>Additional notes (optional)</FieldLabel><textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} className={textAreaClass} /></label></div></section>

    {status !== "idle" && <p className={`form-status ${status === "success" ? "is-success" : status === "error" ? "is-error" : "is-saving"}`}>{message || "Saving trade journal…"}</p>}
    <button disabled={status === "saving"} type="submit" className="form-submit">{status === "saving" ? "Saving journal entry…" : "Save trade journal entry"}</button>
  </form>;
}
