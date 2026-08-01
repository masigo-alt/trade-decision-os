"use client";

import { FormEvent, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { scoreTraderReadiness } from "@/lib/trader-readiness";

type QuestionKey =
  | "slept_well"
  | "felt_calm_before_trading"
  | "felt_pressure_to_make_money"
  | "traded_after_a_loss"
  | "overtraded"
  | "revenge_traded"
  | "respected_stop"
  | "followed_plan"
  | "traded_during_news"
  | "net_positive";

type Answers = Record<QuestionKey, boolean | null>;

const questions: Array<{ key: QuestionKey; label: string; help?: string }> = [
  { key: "slept_well", label: "Did I sleep well?" },
  { key: "felt_calm_before_trading", label: "Did I feel calm before trading?" },
  { key: "felt_pressure_to_make_money", label: "Did I feel pressure to make money?" },
  { key: "traded_after_a_loss", label: "Did I trade after a loss?" },
  { key: "overtraded", label: "Did I overtrade?", help: "More entries than your written plan allowed." },
  { key: "revenge_traded", label: "Did I revenge trade?" },
  { key: "respected_stop", label: "Did I respect my stop?" },
  { key: "followed_plan", label: "Did I follow my plan?" },
  { key: "traded_during_news", label: "Did I trade during high-impact news?" },
  { key: "net_positive", label: "Was the day net positive?" },
];

const initialAnswers = Object.fromEntries(questions.map(({ key }) => [key, null])) as Answers;

function answersAreComplete(answers: Answers): answers is Record<QuestionKey, boolean> {
  return questions.every(({ key }) => answers[key] !== null);
}

export function BehaviourJournalForm() {
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const readiness = scoreTraderReadiness(answers);
  const readinessStyle = {
    proceed: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
    wait: "border-amber-300/20 bg-amber-300/10 text-amber-100",
    reduce_size: "border-orange-400/20 bg-orange-400/10 text-orange-200",
    avoid: "border-rose-400/20 bg-rose-400/10 text-rose-200",
    incomplete: "border-white/[0.08] bg-white/[0.03] text-slate-400",
  }[readiness.recommendation];

  function setAnswer(key: QuestionKey, value: boolean) {
    setAnswers((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!answersAreComplete(answers)) {
      setStatus("error");
      setMessage("Answer every question before saving your entry.");
      return;
    }

    setStatus("saving");
    setMessage("");

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw new Error("Sign in before saving a behaviour journal entry.");

      const { error } = await supabase.from("behaviour_journal_entries").upsert(
        {
          user_id: authData.user.id,
          entry_date: entryDate,
          slept_well: answers.slept_well,
          felt_calm_before_trading: answers.felt_calm_before_trading,
          felt_pressure_to_make_money: answers.felt_pressure_to_make_money,
          traded_after_a_loss: answers.traded_after_a_loss,
          overtraded: answers.overtraded,
          revenge_traded: answers.revenge_traded,
          respected_stop: answers.respected_stop,
          followed_plan: answers.followed_plan,
          traded_during_news: answers.traded_during_news,
          net_positive: answers.net_positive,
          notes: notes.trim() || null,
        },
        { onConflict: "user_id,entry_date" },
      );

      if (error) throw error;
      setStatus("success");
      setMessage("Journal entry saved. It will feed your weekly insights.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to save your entry. Please try again.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="decision-form">
      <section className="form-section">
        <div className="flex flex-col justify-between gap-4 border-b border-white/[0.07] pb-5 sm:flex-row sm:items-center">
          <div>
            <p className="form-eyebrow">Daily check-in</p>
            <h2 className="form-title">How did you show up today?</h2>
            <p className="form-description">Answer honestly. This is a private signal, not a scorecard.</p>
          </div>
          <label className="text-sm text-slate-400">
            <span className="form-label">Entry date</span>
            <input value={entryDate} onChange={(event) => setEntryDate(event.target.value)} type="date" />
          </label>
        </div>

        <div className="mt-2 divide-y divide-white/[0.07]">
          {questions.map(({ key, label, help }, index) => (
            <fieldset key={key} className="form-question">
              <div>
                <legend className="form-label"><span className="question-index">{String(index + 1).padStart(2, "0")}</span>{label}</legend>
                {help && <p className="form-help question-help">{help}</p>}
              </div>
              <div className="form-segment form-segment-compact">
                {([true, false] as const).map((value) => {
                  const selected = answers[key] === value;
                  return <button key={String(value)} type="button" onClick={() => setAnswer(key, value)} className={selected ? value ? "is-positive" : "is-negative" : ""}>{value ? "Yes" : "No"}</button>;
                })}
              </div>
            </fieldset>
          ))}
        </div>
      </section>

      <section className={`form-section border ${readinessStyle}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-xs font-medium uppercase tracking-[0.15em] opacity-75">Rule-based readiness</p><h3 className="mt-1 text-lg font-semibold capitalize">{readiness.recommendation.replace("_", " ")}</h3></div>
          <div className="rounded-full border border-current/30 px-3 py-1.5 text-sm font-semibold">{readiness.score === null ? "—" : `${readiness.score}/100`}</div>
        </div>
        <p className="mt-3 text-sm leading-5 opacity-90">{readiness.summary}</p>
        {readiness.factors.length > 0 && <ul className="mt-4 grid gap-1.5 text-xs opacity-80 sm:grid-cols-2">{readiness.factors.slice(0, 6).map((factor) => <li key={factor}>• {factor}</li>)}</ul>}
      </section>

      <section className="form-section">
        <label htmlFor="notes" className="form-field"><span className="form-label">Optional note</span><span className="form-help">Capture context you may want to recognise later.</span>
        <textarea id="notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} placeholder="What influenced your decisions today?" /></label>
      </section>

      {status !== "idle" && <p className={`form-status ${status === "success" ? "is-success" : status === "error" ? "is-error" : "is-saving"}`}>{message || "Saving your entry…"}</p>}
      <button disabled={status === "saving"} type="submit" className="form-submit">{status === "saving" ? "Saving entry…" : "Save behaviour journal"}</button>
    </form>
  );
}
