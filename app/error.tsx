"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#090b10] px-5 py-10 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(124,58,237,0.16),transparent_34rem)]" />
      <section className="relative w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-violet-950/30">
            TD
          </div>
          <div>
            <p className="text-sm font-semibold tracking-[-0.01em] text-white">Trade Decision</p>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-600">Private OS</p>
          </div>
        </div>

        <div className="surface p-6 text-center sm:p-8">
          <p className="eyebrow text-rose-300">Something went wrong</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white">We hit a snag loading this page.</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Sorry about that. Your data is safe — try again, or head back to the dashboard.</p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => reset()}
              className="flex h-11 flex-1 items-center justify-center rounded-xl bg-violet-500 px-4 text-sm font-semibold text-white shadow-lg shadow-violet-950/25 transition hover:bg-violet-400"
            >
              Try again
            </button>
            <Link href="/" className="flex h-11 flex-1 items-center justify-center rounded-xl border border-white/[0.09] bg-white/[0.025] px-4 text-sm font-medium text-slate-300 transition hover:border-white/[0.14] hover:bg-white/[0.05] hover:text-white">
              Back to dashboard
            </Link>
          </div>
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-slate-600">
          Private decision support and journaling. Not financial advice.
        </p>
      </section>
    </main>
  );
}
