"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

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

export function AppShell({ children, width = "wide" }: { children: ReactNode; width?: "wide" | "reading" }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return <main className="min-h-screen bg-[#090b10] text-slate-100">
    <div className="app-shell-frame mx-auto flex min-h-screen">
      <aside className="app-desktop-sidebar app-shell-sidebar sticky top-0 h-screen shrink-0 flex-col border-r border-white/[0.06] bg-[#0b0e14]/95 px-4 py-6">
        <div className="px-2"><Brand /></div>
        <div className="app-shell-nav"><Navigation /></div>
        <div className="app-shell-account rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-semibold text-slate-200 ring-1 ring-white/10">M</div>
            <div className="min-w-0"><p className="truncate text-sm font-medium text-slate-200">Masigo</p><p className="text-[11px] text-slate-600">Private workspace</p></div>
          </div>
        </div>
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
