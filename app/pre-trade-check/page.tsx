import { PreTradeChecklistForm } from "@/components/pre-trade-checklist-form";
import { AppShell } from "@/components/app-shell";

export default function PreTradeCheckPage() {
  return <AppShell><header className="mb-8"><p className="eyebrow text-violet-300">Pre-trade check</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-white">Pause before you commit.</h1><p className="mt-2 text-sm leading-6 text-slate-500">A structured risk gate for your idea—not a prediction or signal.</p></header><PreTradeChecklistForm /></AppShell>;
}
