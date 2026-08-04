"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === "true" && process.env.NODE_ENV !== "production";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"checking" | "idle" | "submitting" | "error">("checking");
  const [message, setMessage] = useState("");

  const requestedPath = searchParams.get("next");
  const destination = requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
    ? requestedPath
    : "/";

  useEffect(() => {
    if (bypassAuth) {
      router.replace(destination);
      return;
    }

    let active = true;

    getSupabaseBrowserClient().auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) {
        router.replace(destination);
        return;
      }
      setStatus("idle");
    });

    return () => {
      active = false;
    };
  }, [bypassAuth, destination, router]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !password) {
      setStatus("error");
      setMessage("Enter the email address and password created in Supabase.");
      return;
    }

    setStatus("submitting");
    setMessage("");

    const { error } = await getSupabaseBrowserClient().auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setStatus("error");
      setMessage(error.message === "Invalid login credentials"
        ? "The email address or password is incorrect."
        : error.message);
      return;
    }

    router.replace(destination);
    router.refresh();
  }

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

        <div className="surface p-6 sm:p-8">
          <p className="eyebrow text-violet-300">Private workspace</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white">Sign in to your decision process.</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Your journals, screenshots and insights are protected by your Supabase account.</p>

          <form onSubmit={signIn} className="mt-7 space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-slate-300">Email address</span>
              <input
                autoComplete="email"
                autoFocus
                disabled={status === "checking" || status === "submitting"}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                type="email"
                value={email}
                className="mt-2 block w-full rounded-xl border border-white/[0.09] bg-[#090c12] px-3.5 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-700 focus:border-violet-400/40 focus:ring-2 focus:ring-violet-400/10"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-300">Password</span>
              <input
                autoComplete="current-password"
                disabled={status === "checking" || status === "submitting"}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Your private password"
                type="password"
                value={password}
                className="mt-2 block w-full rounded-xl border border-white/[0.09] bg-[#090c12] px-3.5 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-700 focus:border-violet-400/40 focus:ring-2 focus:ring-violet-400/10"
              />
            </label>

            {status === "error" && (
              <p role="alert" className="rounded-xl border border-rose-400/15 bg-rose-400/[0.07] px-3.5 py-3 text-sm text-rose-200">
                {message}
              </p>
            )}

            <button
              disabled={status === "checking" || status === "submitting"}
              type="submit"
              className="flex w-full items-center justify-center rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/25 transition hover:bg-violet-400 disabled:cursor-wait disabled:opacity-60"
            >
              {status === "checking" ? "Checking session…" : status === "submitting" ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-slate-600">
          Private decision support and journaling. Not financial advice.
        </p>
      </section>
    </main>
  );
}
