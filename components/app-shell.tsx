"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type IconName = "dashboard" | "check" | "trade" | "behaviour" | "insights";

const navigation: Array<{ icon: IconName; label: string; href: string }> = [
  { icon: "dashboard", label: "Dashboard", href: "/" },
  { icon: "check", label: "Pre-trade check", href: "/pre-trade-check" },
  { icon: "trade", label: "Trade journal", href: "/trade-journal" },
  { icon: "behaviour", label: "Behaviour journal", href: "/behaviour-journal" },
  { icon: "insights", label: "Weekly insights", href: "/weekly-insights" },
];

function NavIcon({ name }: { name: IconName }) {
  const paths = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.6 2.6L16.5 9" /></>,
    trade: <><path d="M6 3h11a2 2 0 0 1 2 2v16H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M8 8h7M8 12h7M8 16h5" /></>,
    behaviour: <><path d="M12 3a4 4 0 0 0-4 4v2a3 3 0 0 0-2 2.83V14a3 3 0 0 0 3 3h.5v4M12 3a4 4 0 0 1 4 4v2a3 3 0 0 1 2 2.83V14a3 3 0 0 1-3 3h-.5v4M9 11h.01M15 11h.01M10 15h4" /></>,
    insights: <><path d="M4 19V5M4 19h16" /><path d="m7 15 4-4 3 2 5-6" /></>,
  };

  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">{paths[name]}</svg>;
}

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return <nav aria-label="Primary navigation" className="app-primary-nav">
    {navigation.map(({ icon, label, href }) => {
      const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
      return <Link
        href={href}
        key={href}
        onClick={onNavigate}
        data-active={active ? "true" : "false"}
        className={`app-primary-link group text-sm font-medium transition ${
          active
            ? "bg-white/[0.08] text-white shadow-sm ring-1 ring-inset ring-white/[0.06]"
            : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-200"
        }`}
      >
        <span className={active ? "text-violet-300" : "text-slate-600 transition group-hover:text-slate-400"}><NavIcon name={icon} /></span>
        <span>{label}</span>
        {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400" />}
      </Link>;
    })}
  </nav>;
}

function Brand() {
  return <Link href="/" className="app-brand">
    <div className="app-brand-mark relative grid place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-violet-950/30">
      <span className="relative z-10">TD</span>
      <span className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-white/20 blur-md" />
    </div>
    <div>
      <p className="text-sm font-semibold tracking-[-0.01em] text-white">Trade Decision</p>
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-600">Private OS</p>
    </div>
  </Link>;
}

function SessionLoading() {
  return <main className="grid min-h-screen place-items-center bg-[#090b10] text-slate-100">
    <div className="text-center">
      <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-violet-950/30">TD</div>
      <p className="mt-4 text-sm text-slate-500">Opening your private workspace…</p>
    </div>
  </main>;
}

function Account({
  user,
  onSignOut,
}: {
  user: User | null;
  onSignOut: () => void;
}) {
  const email = user?.email ?? "Local demo · saving disabled";
  const displayName = user
    ? typeof user.user_metadata.display_name === "string"
      ? user.user_metadata.display_name
      : email.split("@")[0]
    : "Presentation mode";
  const initial = displayName.charAt(0).toUpperCase() || "M";

  return <div className="app-shell-account rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3">
    <div className="flex items-center gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-semibold text-slate-200 ring-1 ring-white/10">{initial}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-200">{displayName}</p>
        <p className="truncate text-[11px] text-slate-600">{email}</p>
      </div>
    </div>
    {user ? <button
      onClick={onSignOut}
      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-xs font-medium text-slate-500 transition hover:border-white/[0.1] hover:bg-white/[0.05] hover:text-slate-200"
    >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <path d="M10 17l5-5-5-5M15 12H3" />
          <path d="M14 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5" />
        </svg>
        <span>Sign out</span>
    </button> : <div className="mt-3 rounded-xl border border-amber-300/10 bg-amber-300/[0.05] px-3 py-2 text-center text-[11px] font-medium text-amber-100/70">
      Authentication bypassed
    </div>}
  </div>;
}

export function AppShell({ children, width = "wide" }: { children: ReactNode; width?: "wide" | "reading" }) {
  const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === "true" && process.env.NODE_ENV !== "production";
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(!bypassAuth);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (bypassAuth) return;

    const supabase = getSupabaseBrowserClient();
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (!data.session?.user) {
        const next = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`;
        router.replace(`/login${next}`);
        return;
      }
      setUser(data.session.user);
      setCheckingSession(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (!session?.user) {
        setUser(null);
        router.replace("/login");
        return;
      }
      setUser(session.user);
      setCheckingSession(false);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [bypassAuth, pathname, router]);

  async function signOut() {
    setCheckingSession(true);
    await getSupabaseBrowserClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  if (!bypassAuth && (checkingSession || !user)) return <SessionLoading />;

  return <main className="min-h-screen bg-[#090b10] text-slate-100">
    {bypassAuth && <div role="alert" className="w-full bg-amber-400 px-4 py-2.5 text-center text-xs font-semibold tracking-wide text-amber-950 sm:text-sm">
      Presentation mode — authentication bypassed. Nothing is saved.
    </div>}
    <div className="app-shell-frame mx-auto flex min-h-screen">
      <aside className="app-desktop-sidebar app-shell-sidebar sticky top-0 h-screen shrink-0 flex-col border-r border-white/[0.06] bg-[#0b0e14]/95 px-4 py-6">
        <div className="px-2"><Brand /></div>
        <div className="app-shell-nav"><Navigation /></div>
        <Account user={user} onSignOut={signOut} />
      </aside>

      {menuOpen && <button aria-label="Close navigation menu" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden" />}
      <aside className={`app-mobile-drawer app-shell-mobile fixed inset-y-0 left-0 z-50 flex-col border-r border-white/[0.07] bg-[#0b0e14] px-4 py-6 shadow-2xl transition-transform duration-200 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between px-2">
          <Brand />
          <button aria-label="Close menu" onClick={() => setMenuOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-white/5 hover:text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </div>
        <div className="app-shell-nav"><Navigation onNavigate={() => setMenuOpen(false)} /></div>
        <Account user={user} onSignOut={signOut} />
      </aside>

      <div className="app-shell-main">
        <div className="app-mobile-topbar sticky top-0 z-30 h-16 items-center border-b border-white/[0.06] bg-[#090b10]/85 px-5 backdrop-blur-xl sm:px-7">
          <button aria-label="Open navigation menu" onClick={() => setMenuOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-slate-300">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-5 w-5"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
          <p className="ml-3 text-sm font-semibold text-white">Trade Decision OS</p>
        </div>
        <div className={`mx-auto px-5 py-7 sm:px-8 lg:px-10 lg:py-9 xl:px-12 ${width === "reading" ? "max-w-4xl" : "app-shell-content"}`}>
          {children}
        </div>
      </div>
    </div>
  </main>;
}
