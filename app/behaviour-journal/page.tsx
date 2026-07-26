import Link from "next/link";
import { BehaviourJournalForm } from "@/components/behaviour-journal-form";

export default function BehaviourJournalPage() {
  return (
    <main className="min-h-screen bg-[#080b10] px-5 py-6 text-slate-100 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/" className="text-sm text-indigo-300 transition hover:text-indigo-200">← Dashboard</Link>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Behaviour journal</h1>
            <p className="mt-2 text-sm text-slate-500">Build an honest record of the patterns behind your decisions.</p>
          </div>
          <div className="grid h-11 w-11 place-items-center rounded-full border-4 border-emerald-400 text-xs font-bold text-emerald-200">82</div>
        </header>
        <BehaviourJournalForm />
      </div>
    </main>
  );
}
