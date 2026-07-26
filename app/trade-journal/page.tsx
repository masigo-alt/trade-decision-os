import Link from "next/link";
import { TradeJournalForm } from "@/components/trade-journal-form";

export default function TradeJournalPage() {
  return <main className="min-h-screen bg-[#080b10] px-5 py-6 text-slate-100 sm:px-8 lg:px-10"><div className="mx-auto max-w-3xl"><header className="mb-8"><Link href="/" className="text-sm text-indigo-300 transition hover:text-indigo-200">← Dashboard</Link><p className="mt-5 text-xs font-medium uppercase tracking-[0.15em] text-indigo-300">Trade journal</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Capture the whole trade, not only the result.</h1><p className="mt-2 text-sm leading-6 text-slate-500">Record the original context, execution, outcome, screenshots, and what you learned.</p></header><TradeJournalForm /></div></main>;
}
