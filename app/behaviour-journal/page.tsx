import { BehaviourJournalForm } from "@/components/behaviour-journal-form";
import { AppShell } from "@/components/app-shell";

export default function BehaviourJournalPage() {
  return (
    <AppShell width="reading">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="eyebrow text-violet-300">Behaviour journal</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-white">Check in with yourself.</h1>
            <p className="mt-2 text-sm text-slate-500">Build an honest record of the patterns behind your trading decisions.</p>
          </div>
          <div className="grid h-14 w-14 place-items-center rounded-full border-[5px] border-emerald-400/80 bg-emerald-400/[0.06] text-sm font-bold text-emerald-200">82</div>
        </header>
        <BehaviourJournalForm />
    </AppShell>
  );
}
