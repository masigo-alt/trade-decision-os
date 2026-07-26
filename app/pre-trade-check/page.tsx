import Link from "next/link";
import { PreTradeChecklistForm } from "@/components/pre-trade-checklist-form";

export default function PreTradeCheckPage() {
  return <main className="min-h-screen bg-[#080b10] px-5 py-6 text-slate-100 sm:px-8 lg:px-10"><div className="mx-auto max-w-3xl"><header className="mb-8"><Link href="/" className="text-sm text-indigo-300 transition hover:text-indigo-200">← Dashboard</Link><p className="mt-5 text-xs font-medium uppercase tracking-[0.15em] text-indigo-300">Pre-trade checklist</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Make the decision process visible.</h1><p className="mt-2 text-sm leading-6 text-slate-500">This is a risk gate, not a prediction tool. Complete it before committing to an idea.</p></header><PreTradeChecklistForm /></div></main>;
}
