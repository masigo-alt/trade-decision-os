"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Database } from "@/lib/database.types";
import { assetOptionLabel, useJournalAssets } from "@/lib/journal-assets";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type ChecklistRecommendation = Database["public"]["Enums"]["checklist_recommendation"];
type Result = Database["public"]["Enums"]["trade_outcome"];
type RecentChecklist = Pick<
  Database["public"]["Tables"]["pre_trade_checklists"]["Row"],
  "id" | "submitted_at" | "recommendation" | "setup_type" | "direction" | "risk_percent"
> & {
  assets: { name: string; symbol: string } | null;
};
type OpenTrade = Pick<
  Database["public"]["Tables"]["trades"]["Row"],
  "id" | "date" | "direction" | "setup_type" | "before_analysis" | "entry_reason" | "risk_amount" | "target_amount" | "before_screenshot_path"
> & {
  assets: { name: string; symbol: string } | null;
  before_screenshot_url?: string | null;
};

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

const displayDate = (value: string) => new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`));
const money = (value: number | null) => value === null ? "Not recorded" : `$${Number(value).toFixed(2)}`;
const OPEN_TRADE_DRAFT_KEY = "trade-decision-os:open-trade-draft";

export function TradeJournalForm() {
  const [asset, setAsset] = useState("XAUUSD");
  const { watchlistAssets, otherAssets, status: assetStatus } = useJournalAssets();
  const [recentChecklists, setRecentChecklists] = useState<RecentChecklist[]>([]);
  const [selectedChecklistId, setSelectedChecklistId] = useState("");
  const [checklistLoadStatus, setChecklistLoadStatus] = useState<"loading" | "ready" | "error">("loading");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [setupType, setSetupType] = useState("");
  const [beforeAnalysis, setBeforeAnalysis] = useState("");
  const [entryReason, setEntryReason] = useState("");
  const [riskAmount, setRiskAmount] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [result, setResult] = useState<Result | "">("");
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
  const [stage, setStage] = useState<"before" | "after">("before");
  const [openTrades, setOpenTrades] = useState<OpenTrade[]>([]);
  const [selectedOpenTradeId, setSelectedOpenTradeId] = useState("");
  const [openTradesStatus, setOpenTradesStatus] = useState<"loading" | "ready" | "error">("loading");
  const [openTradesRefresh, setOpenTradesRefresh] = useState(0);
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    try {
      const rawDraft = window.localStorage.getItem(OPEN_TRADE_DRAFT_KEY);
      if (rawDraft) {
        const draft = JSON.parse(rawDraft) as Partial<{
          asset: string;
          selectedChecklistId: string;
          date: string;
          direction: "long" | "short";
          setupType: string;
          beforeAnalysis: string;
          entryReason: string;
          riskAmount: string;
          targetAmount: string;
        }>;
        if (draft.asset) setAsset(draft.asset);
        if (draft.selectedChecklistId) setSelectedChecklistId(draft.selectedChecklistId);
        if (draft.date) setDate(draft.date);
        if (draft.direction) setDirection(draft.direction);
        if (draft.setupType) setSetupType(draft.setupType);
        if (draft.beforeAnalysis) setBeforeAnalysis(draft.beforeAnalysis);
        if (draft.entryReason) setEntryReason(draft.entryReason);
        if (draft.riskAmount) setRiskAmount(draft.riskAmount);
        if (draft.targetAmount) setTargetAmount(draft.targetAmount);
      }
    } catch {
      window.localStorage.removeItem(OPEN_TRADE_DRAFT_KEY);
    } finally {
      setDraftReady(true);
    }
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    window.localStorage.setItem(OPEN_TRADE_DRAFT_KEY, JSON.stringify({
      asset,
      selectedChecklistId,
      date,
      direction,
      setupType,
      beforeAnalysis,
      entryReason,
      riskAmount,
      targetAmount,
    }));
  }, [asset, beforeAnalysis, date, direction, draftReady, entryReason, riskAmount, selectedChecklistId, setupType, targetAmount]);

  useEffect(() => {
    let active = true;

    async function loadRecentChecklists() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData.user) throw new Error("Sign in to load recent pre-trade checklists.");

        const { data, error } = await supabase
          .from("pre_trade_checklists")
          .select("id,submitted_at,recommendation,setup_type,direction,risk_percent,assets(name,symbol)")
          .order("submitted_at", { ascending: false })
          .limit(20);

        if (error) throw error;
        if (!active) return;
        setRecentChecklists((data ?? []) as RecentChecklist[]);
        setChecklistLoadStatus("ready");
      } catch {
        if (active) setChecklistLoadStatus("error");
      }
    }

    loadRecentChecklists();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadOpenTrades() {
      setOpenTradesStatus("loading");
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData.user) throw new Error("Sign in to load open trades.");
        const { data, error } = await supabase
          .from("trades")
          .select("id,date,direction,setup_type,before_analysis,entry_reason,risk_amount,target_amount,before_screenshot_path,assets(symbol,name)")
          .eq("status", "open")
          .order("opened_at", { ascending: false });
        if (error) throw error;

        const records = (data ?? []) as unknown as OpenTrade[];
        const withScreenshots = await Promise.all(records.map(async (trade) => {
          if (!trade.before_screenshot_path) return { ...trade, before_screenshot_url: null };
          const { data: signed } = await supabase.storage.from("trade-journal-screenshots").createSignedUrl(trade.before_screenshot_path, 3600);
          return { ...trade, before_screenshot_url: signed?.signedUrl ?? null };
        }));

        if (!active) return;
        setOpenTrades(withScreenshots);
        setOpenTradesStatus("ready");
      } catch {
        if (active) setOpenTradesStatus("error");
      }
    }

    loadOpenTrades();
    return () => {
      active = false;
    };
  }, [openTradesRefresh]);

  useEffect(() => {
    const completeRequested = (event: Event) => {
      const tradeId = (event as CustomEvent<{ tradeId?: string }>).detail?.tradeId;
      setStage("after");
      if (tradeId) setSelectedOpenTradeId(tradeId);
      setStatus("idle");
      window.requestAnimationFrame(() => document.getElementById("open-trades")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    };
    window.addEventListener("trade-journal-complete-requested", completeRequested);
    return () => window.removeEventListener("trade-journal-complete-requested", completeRequested);
  }, []);

  async function uploadScreenshot(file: File, userId: string, tradeId: string, phase: "before" | "after") {
    const supabase = getSupabaseBrowserClient();
    const extension = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${userId}/${tradeId}/${phase}-${Date.now()}.${extension}`;
    const { error } = await supabase.storage.from("trade-journal-screenshots").upload(path, file, { upsert: false });
    if (error) throw error;
    return path;
  }

  function resetBeforeFields() {
    window.localStorage.removeItem(OPEN_TRADE_DRAFT_KEY);
    setSelectedChecklistId("");
    setSetupType("");
    setBeforeAnalysis("");
    setEntryReason("");
    setRiskAmount("");
    setTargetAmount("");
    setBeforeScreenshot(null);
  }

  function resetAfterFields() {
    setResult("");
    setPnl("");
    setResultConclusion("");
    setReviewNotes("");
    setFollowedPlan(true);
    setRespectedStop(true);
    setMistakeType("");
    setClosingCommentary("");
    setNotes("");
    setAfterScreenshot(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (stage === "before" && (!setupType.trim() || !beforeAnalysis.trim() || !entryReason.trim())) {
      setStatus("error");
      setMessage("Complete the setup type, before analysis, and entry rationale before saving the open trade.");
      return;
    }
    if (stage === "after" && (!selectedOpenTradeId || !result || pnl.trim() === "" || !resultConclusion.trim() || !reviewNotes.trim() || !closingCommentary.trim())) {
      setStatus("error");
      setMessage("Select an open trade and complete its result, realised P&L, conclusion, review, and closing commentary.");
      return;
    }

    setStatus("saving");
    setMessage("");
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw new Error("Sign in before saving a trade journal entry.");

      if (stage === "before") {
        const { data: assetRow, error: assetError } = await supabase.from("assets").select("id").eq("symbol", asset).single();
        if (assetError) throw new Error(`The selected asset could not be loaded: ${assetError.message}`);
        if (!assetRow) throw new Error("The selected asset could not be found.");

        const tradeId = crypto.randomUUID();
        const beforePath = beforeScreenshot ? await uploadScreenshot(beforeScreenshot, authData.user.id, tradeId, "before") : null;
        const numericRisk = riskAmount.trim() === "" ? null : Number(riskAmount);
        const numericTarget = targetAmount.trim() === "" ? null : Number(targetAmount);
        const { error } = await supabase.from("trades").insert({
          id: tradeId,
          user_id: authData.user.id,
          asset_id: assetRow.id,
          checklist_id: selectedChecklistId || null,
          date,
          direction,
          setup_type: setupType.trim(),
          status: "open",
          opened_at: new Date().toISOString(),
          risk_amount: numericRisk,
          target_amount: numericTarget,
          currency: "USD",
          before_analysis: beforeAnalysis.trim(),
          entry_reason: entryReason.trim(),
          before_screenshot_path: beforePath,
        });
        if (error) throw error;

        resetBeforeFields();
        setSelectedOpenTradeId(tradeId);
        setOpenTradesRefresh((value) => value + 1);
        setStage("after");
        setStatus("success");
        setMessage("Open trade saved. Complete the outcome and review here after the position closes.");
      } else {
        const selectedTrade = openTrades.find((trade) => trade.id === selectedOpenTradeId);
        if (!selectedTrade) throw new Error("The selected open trade could not be found.");
        const numericPnl = Number(pnl);
        const numericRisk = selectedTrade.risk_amount === null ? null : Number(selectedTrade.risk_amount);
        const realisedRMultiple = numericRisk !== null && numericRisk > 0
          ? Math.round((numericPnl / numericRisk) * 100) / 100
          : null;
        const afterPath = afterScreenshot ? await uploadScreenshot(afterScreenshot, authData.user.id, selectedTrade.id, "after") : null;

        const { data: updatedTrade, error } = await supabase.from("trades").update({
          status: "closed",
          closed_at: new Date().toISOString(),
          result: result as Result,
          pnl: numericPnl,
          realised_r_multiple: realisedRMultiple,
          followed_plan: followedPlan,
          respected_stop: respectedStop,
          mistake_type: mistakeType.trim() || null,
          result_conclusion: resultConclusion.trim(),
          review_notes: reviewNotes.trim(),
          closing_commentary: closingCommentary.trim(),
          after_screenshot_path: afterPath,
          notes: notes.trim() || null,
        }).eq("id", selectedTrade.id).eq("status", "open").select("id").single();
        if (error) throw error;
        if (!updatedTrade) throw new Error("This trade is no longer open.");

        resetAfterFields();
        setSelectedOpenTradeId("");
        setOpenTradesRefresh((value) => value + 1);
        setStatus("success");
        setMessage("Trade closed and its outcome review was linked to the original entry.");
      }

      window.dispatchEvent(new CustomEvent("trade-journal-updated"));
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to save this trade journal entry.");
    }
  }

  const inputClass = "mt-2 w-full rounded-lg border border-white/10 bg-[#080b10] px-3 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-indigo-400";
  const textAreaClass = `${inputClass} resize-y`;
  const compatibleChecklists = recentChecklists.filter((checklist) => checklist.assets?.symbol === asset);
  const selectedOpenTrade = useMemo(() => openTrades.find((trade) => trade.id === selectedOpenTradeId) ?? null, [openTrades, selectedOpenTradeId]);
  const recommendationLabel: Record<ChecklistRecommendation, string> = {
    proceed: "Proceed",
    wait: "Wait",
    reduce_size: "Reduce Size",
    avoid: "Avoid",
  };

  return <form onSubmit={submit} className="decision-form">
    <section className="rounded-2xl border border-violet-400/15 bg-violet-400/[0.035] p-5 sm:p-7">
      <p className="text-xs font-medium uppercase tracking-[0.15em] text-violet-300">Two-stage journal</p>
      <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h2 className="text-xl font-semibold text-white">Capture now. Review when the trade closes.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">The original setup and its later outcome stay connected as one journal entry.</p></div><div className="form-segment min-w-[280px]"><button type="button" onClick={() => { setStage("before"); setStatus("idle"); }} className={stage === "before" ? "is-positive" : ""}>1 · Open trade</button><button type="button" onClick={() => { setStage("after"); setStatus("idle"); }} className={stage === "after" ? "is-positive" : ""}>2 · Complete trade</button></div></div>
    </section>

    {stage === "before" ? <>
      <section className="form-section"><p className="form-eyebrow">Trade details</p><h2 className="form-title">Record the execution context.</h2><p className="form-description">These details are stored while the position is still open.</p><div className="form-grid mt-5"><label className="form-field"><FieldLabel>Trading pair</FieldLabel><select value={asset} onChange={(event) => { setAsset(event.target.value); setSelectedChecklistId(""); }} className={inputClass}><optgroup label="My watchlist">{watchlistAssets.map((item) => <option key={item.id} value={item.symbol}>{assetOptionLabel(item)}</option>)}</optgroup>{otherAssets.length > 0 && <optgroup label="All supported markets">{otherAssets.map((item) => <option key={item.id} value={item.symbol}>{assetOptionLabel(item)}</option>)}</optgroup>}</select><span className="form-help">{assetStatus === "loading" ? "Loading the supported market catalogue…" : assetStatus === "fallback" ? "Showing the local market catalogue while Supabase reconnects." : `${watchlistAssets.length} watchlist markets shown first; all ${watchlistAssets.length + otherAssets.length} markets can be journaled.`}</span></label><label className="form-field"><FieldLabel>Date</FieldLabel><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className={inputClass} /></label><fieldset className="form-field"><FieldLabel>Direction</FieldLabel><div className="form-segment">{(["long", "short"] as const).map((value) => <button key={value} type="button" onClick={() => setDirection(value)} className={`capitalize ${direction === value ? value === "long" ? "is-positive" : "is-negative" : ""}`}>{value}</button>)}</div></fieldset><label className="form-field"><FieldLabel>Entry / setup type</FieldLabel><input value={setupType} onChange={(event) => setSetupType(event.target.value)} placeholder="e.g. Risk entry, break and retest" className={inputClass} /></label><label className="form-field sm:col-span-2"><FieldLabel>Related pre-trade checklist (optional)</FieldLabel><select value={selectedChecklistId} onChange={(event) => setSelectedChecklistId(event.target.value)} className={inputClass}><option value="">Not linked to a checklist</option>{compatibleChecklists.map((checklist) => <option key={checklist.id} value={checklist.id}>{new Date(checklist.submitted_at).toLocaleDateString("en-ZA", { day: "2-digit", month: "short" })} · {recommendationLabel[checklist.recommendation]} · {checklist.direction} · {checklist.setup_type} · {Number(checklist.risk_percent)}% risk</option>)}</select><span className="form-help">{checklistLoadStatus === "loading" ? "Loading your recent decision gates…" : checklistLoadStatus === "error" ? "Recent checklists could not be loaded. You can still save the trade unlinked." : compatibleChecklists.length ? "Link the decision made before this trade so Weekly Insights can compare preparation with outcome." : `No recent ${asset} checklists found. Complete a pre-trade check first or save this trade unlinked.`}</span></label></div></section>

      <section className="rounded-2xl border border-indigo-400/15 bg-indigo-400/[0.04] p-5 sm:p-7"><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center"><p className="text-xs font-medium uppercase tracking-[0.15em] text-indigo-300">Before the trade</p><span className="text-xs text-slate-500">Text fields save locally as you type</span></div><div className="mt-5 space-y-5"><label className="block"><FieldLabel>Before analysis</FieldLabel><textarea rows={5} value={beforeAnalysis} onChange={(event) => setBeforeAnalysis(event.target.value)} placeholder="Describe structure, context, levels, and the scenario you expected." className={textAreaClass} /></label><label className="block"><FieldLabel>Reason(s) for entry</FieldLabel><textarea rows={5} value={entryReason} onChange={(event) => setEntryReason(event.target.value)} placeholder="What specifically justified the entry at that moment?" className={textAreaClass} /></label><div className="grid gap-5 sm:grid-cols-2"><label><FieldLabel>Planned risk amount (USD)</FieldLabel><input type="number" min="0" step="0.01" value={riskAmount} onChange={(event) => setRiskAmount(event.target.value)} placeholder="120.15" className={inputClass} /></label><label><FieldLabel>Planned target amount (USD)</FieldLabel><input type="number" min="0" step="0.01" value={targetAmount} onChange={(event) => setTargetAmount(event.target.value)} placeholder="346.00" className={inputClass} /></label></div><ScreenshotPicker label="Screenshot before" file={beforeScreenshot} onChange={setBeforeScreenshot} tone="indigo" /><p className="text-xs leading-5 text-slate-500">For security, browsers do not retain selected files after a full refresh. If the page reloads, reselect the screenshot before saving.</p></div></section>
    </> : <>
      <section id="open-trades" className="scroll-mt-6 rounded-2xl border border-amber-300/15 bg-amber-300/[0.035] p-5 sm:p-7"><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><p className="text-xs font-medium uppercase tracking-[0.15em] text-amber-200">Open trades</p><h2 className="mt-1 text-xl font-semibold text-white">Choose the position that has finished.</h2></div><span className="rounded-full bg-amber-300/10 px-3 py-1 text-xs font-medium text-amber-100">{openTrades.length} open</span></div>
        {openTradesStatus === "loading" ? <p className="mt-5 text-sm text-slate-400">Loading your open trades…</p> : openTradesStatus === "error" ? <p className="mt-5 text-sm text-rose-200">Open trades could not be loaded. Check your connection and sign-in state.</p> : openTrades.length === 0 ? <div className="mt-5 rounded-xl border border-dashed border-white/10 bg-[#080b10] p-6 text-center"><p className="text-sm text-slate-300">No open trades are waiting for review.</p><button type="button" onClick={() => setStage("before")} className="mt-2 text-sm font-medium text-indigo-300">Start a new entry</button></div> : <div className="mt-5 grid gap-3 lg:grid-cols-2">{openTrades.map((trade) => <button key={trade.id} type="button" onClick={() => { setSelectedOpenTradeId(trade.id); setStatus("idle"); }} className={`rounded-xl border p-4 text-left transition ${selectedOpenTradeId === trade.id ? "border-amber-300/50 bg-amber-300/[0.08]" : "border-white/[0.08] bg-[#080b10] hover:border-amber-300/25"}`}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium tracking-wider text-amber-200">{trade.assets?.symbol ?? "ASSET"} · <span className="capitalize">{trade.direction}</span></p><p className="mt-1 font-semibold text-white">{trade.setup_type || "Setup not named"}</p></div><span className="rounded-full bg-amber-300/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-amber-100">Open</span></div><p className="mt-3 text-xs text-slate-500">{displayDate(trade.date)} · Risk {money(trade.risk_amount)} · Target {money(trade.target_amount)}</p></button>)}</div>}
      </section>

      {selectedOpenTrade && <section className="rounded-2xl border border-white/[0.08] bg-[#0e131d] p-5 sm:p-7"><p className="text-xs font-medium uppercase tracking-[0.15em] text-slate-500">Original entry context</p><div className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.8fr]"><div className="space-y-4 text-sm leading-6 text-slate-400"><div><p className="text-xs uppercase tracking-wider text-slate-600">Before analysis</p><p className="mt-1">{selectedOpenTrade.before_analysis}</p></div><div><p className="text-xs uppercase tracking-wider text-slate-600">Entry rationale</p><p className="mt-1">{selectedOpenTrade.entry_reason}</p></div><div className="grid grid-cols-2 gap-3"><div className="rounded-lg bg-white/[0.035] p-3"><p className="text-xs text-slate-600">Planned risk</p><p className="mt-1 font-medium text-white">{money(selectedOpenTrade.risk_amount)}</p></div><div className="rounded-lg bg-white/[0.035] p-3"><p className="text-xs text-slate-600">Planned target</p><p className="mt-1 font-medium text-white">{money(selectedOpenTrade.target_amount)}</p></div></div></div>{selectedOpenTrade.before_screenshot_url ? <figure className="overflow-hidden rounded-xl border border-white/10 bg-[#080b10]"><img src={selectedOpenTrade.before_screenshot_url} alt="Before-trade chart" className="max-h-[360px] w-full object-contain" /><figcaption className="border-t border-white/[0.07] px-3 py-2 text-xs text-slate-500">Before-trade screenshot</figcaption></figure> : <div className="grid min-h-40 place-items-center rounded-xl border border-dashed border-white/10 bg-[#080b10] text-sm text-slate-600">No before screenshot saved</div>}</div></section>}

      {selectedOpenTrade && <><section className="rounded-2xl border border-white/[0.08] bg-[#0e131d] p-5 sm:p-7"><p className="text-xs font-medium uppercase tracking-[0.15em] text-slate-500">Outcome</p><div className="mt-5 grid gap-5 sm:grid-cols-2"><label><FieldLabel>Result</FieldLabel><select value={result} onChange={(event) => setResult(event.target.value as Result | "")} className={inputClass}><option value="">Select the final result</option><option value="win">Win</option><option value="loss">Loss</option><option value="breakeven">Breakeven</option></select></label><label><FieldLabel>Realised P&amp;L (USD)</FieldLabel><input type="number" step="0.01" value={pnl} onChange={(event) => setPnl(event.target.value)} placeholder="Use a negative value for a loss" className={inputClass} /></label></div><label className="mt-5 block"><FieldLabel>Result and conclusion</FieldLabel><textarea rows={3} value={resultConclusion} onChange={(event) => setResultConclusion(event.target.value)} placeholder="Summarise the outcome in one clear paragraph." className={textAreaClass} /></label></section>

      <section className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.035] p-5 sm:p-7"><p className="text-xs font-medium uppercase tracking-[0.15em] text-emerald-300">Post-trade review</p><div className="mt-5 space-y-5"><label className="block"><FieldLabel>What went well and what should improve?</FieldLabel><textarea rows={6} value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} placeholder="Separate good analysis from execution mistakes. Be specific." className={textAreaClass} /></label><div className="grid gap-5 sm:grid-cols-2"><fieldset><FieldLabel>Did the trade follow the plan?</FieldLabel><div className="mt-2"><YesNo value={followedPlan} onChange={setFollowedPlan} /></div></fieldset><fieldset><FieldLabel>Was the stop respected?</FieldLabel><div className="mt-2"><YesNo value={respectedStop} onChange={setRespectedStop} /></div></fieldset></div><label className="block"><FieldLabel>Primary mistake type</FieldLabel><select value={mistakeType} onChange={(event) => setMistakeType(event.target.value)} className={inputClass}><option value="">No mistake / not categorised</option><option value="entry_timing">Entry timing</option><option value="no_clear_entry">No clear entry methodology</option><option value="overtrading">Overtrading</option><option value="revenge_trading">Revenge trading</option><option value="forced_trade">Forced trade</option><option value="risk_management">Risk management</option><option value="news_exposure">News exposure</option><option value="plan_deviation">Plan deviation</option><option value="analysis_error">Analysis error</option></select></label><ScreenshotPicker label="Screenshot after" file={afterScreenshot} onChange={setAfterScreenshot} tone="emerald" /><label className="block"><FieldLabel>Closing commentary</FieldLabel><textarea rows={6} value={closingCommentary} onChange={(event) => setClosingCommentary(event.target.value)} placeholder="What will you carry forward into the next session?" className={textAreaClass} /></label><label className="block"><FieldLabel>Additional notes (optional)</FieldLabel><textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} className={textAreaClass} /></label></div></section></>}
    </>}

    {status !== "idle" && <p className={`form-status ${status === "success" ? "is-success" : status === "error" ? "is-error" : "is-saving"}`}>{message || (stage === "before" ? "Saving open trade…" : "Completing trade review…")}</p>}
    {(stage === "before" || selectedOpenTrade) && <button disabled={status === "saving"} type="submit" className="form-submit">{status === "saving" ? stage === "before" ? "Saving open trade…" : "Completing trade…" : stage === "before" ? "Save as open trade" : "Complete trade and close entry"}</button>}
  </form>;
}
