import { BehaviourJournalForm } from "@/components/behaviour-journal-form";
import { AppShell } from "@/components/app-shell";

export default function BehaviourJournalPage() {
  return (
    <AppShell>
        <header className="mb-8">
          <p className="eyebrow text-violet-300">Behaviour journal</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-white">Pause before you participate.</h1>
          <p className="mt-2 text-sm text-slate-500">Check whether your state, intentions, and discipline support being in the market today.</p>
        </header>
        <BehaviourJournalForm />
    </AppShell>
  );
}
