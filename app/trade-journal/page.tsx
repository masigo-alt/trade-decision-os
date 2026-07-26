import { TradeJournalForm } from "@/components/trade-journal-form";
import { TradeJournalHistory } from "@/components/trade-journal-history";
import { AppShell } from "@/components/app-shell";

export default function TradeJournalPage() {
  return <AppShell><header className="mb-8"><p className="eyebrow text-violet-300">Trade journal</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-white">Review the decision, not only the result.</h1><p className="mt-2 text-sm leading-6 text-slate-500">Browse previous entries or document a completed trade and what it taught you.</p></header><TradeJournalHistory /><section id="new-entry" className="scroll-mt-6"><div className="mb-5"><p className="eyebrow text-violet-300">New entry</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-white">Log a completed trade</h2></div><TradeJournalForm /></section></AppShell>;
}
