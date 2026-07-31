import { BehaviourJournalForm } from "@/components/behaviour-journal-form";
import { AppShell } from "@/components/app-shell";

export default function BehaviourJournalPage() {
  return (
    <AppShell>
        <header className="mb-8">
          <p className="eyebrow text-violet-300">Behaviour journal</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-white">Check in with yourself.</h1>
          <p className="mt-2 text-sm text-slate-500">Build an honest record of the patterns behind your trading decisions.</p>
        </header>
        <BehaviourJournalForm />
    </AppShell>
  );
}
