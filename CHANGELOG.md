# Changelog — 31 July 2026

**Branch:** `agent/audit-implementation` (off `agent/auth-presentation-foundation`)
**Status:** Local only — nothing pushed. Verified: `tsc --noEmit` clean · **23/23 unit tests pass** · production build passes · manual browser walkthrough.
**Backend follow-ups for Lerato:** see [LERATO-TODO.md](./LERATO-TODO.md). Full audit: [AUDIT.md](./AUDIT.md).

> One-line summary: turned the hardcoded, mock front-of-house into a live app — real market data + charts from no-registration feeds, a searchable market watchlist, real (not faked) readiness scoring, a working risk gate, tests, and a pile of hygiene fixes. Everything that touches money/decisions stays rule-based; no AI.

---

## ✨ New features

### Live market data (no API keys / no registration)
- **`app/api/quotes/route.ts`** — server route serving live prices from the Yahoo Finance chart API. Accepts `?symbols=A,B,C`; defaults to the 3 core markets. Per-asset timeout + graceful fallback (never throws).
- **`app/api/calendar/route.ts`** — server route serving the **Forex Factory** weekly economic calendar (High/Medium impact, USD + EUR), used for the event radar.
- **`lib/market-data.ts`** — `fetchQuotes(assets)` / `fetchCalendar()` helpers.
- The **dashboard** market brief, asset decision board, per-asset "key risk", and **event radar** now show **live data** (were 100% hardcoded mock). Event times render in **SAST (Africa/Johannesburg)**. Anything subjective/editorial is now labelled with a **"Demo"** badge — real numbers show as real, opinions are marked.

### Market catalog + watchlist ("Manage markets")
- **`lib/assets.ts`** — a **28-market catalog** (metals, indices, energy, FX majors/crosses, crypto), every entry data-verified to have both a live price feed and a real-time chart symbol.
- **`lib/watchlist.ts`** — `useWatchlist()` hook; the watchlist is saved in the browser (`localStorage['tdos.watchlist.v1']`) and stays in sync across components via a window event. Defaults to the 3 markets (Lerato's picks).
- **`components/manage-markets.tsx`** — a searchable **"Manage markets"** modal to add/remove markets; only markets with verified live data are selectable.
- Added markets get a live price on the dashboard, a real-time chart, and an asset-context page immediately.
- ⚠️ **Limitation:** new markets can be *watched/charted* but not *journaled* until the Supabase enum→FK change (see LERATO-TODO.md). The pre-trade/trade forms still cover the fixed 3.

### Charts
- **`components/tradingview-chart.tsx`** — free TradingView Advanced Chart widget on each asset page (real-time, dark theme).
- Chart height increased ~2× (and fixed a latent bug where the `height` prop never applied — TradingView's `autosize` was overwriting the container height).

---

## 🩹 Fixes (from the audit)

- **Chart symbols corrected:** NAS100 → `OANDA:NAS100USD`, GER40 → `OANDA:DE30EUR`. The old `NASDAQ:NDX` / `XETR:DAX` are exchange symbols that TradingView **blocks on free embeds** ("only available on TradingView"). OANDA CFD feeds are freely embeddable **and** real-time — which is also the answer to "can the charts be real-time?": yes, they now are.
- **Real trader-readiness score:** the dashboard and behaviour-journal header showed a hardcoded **`82`** (plus fake sub-bars), disconnected from the real engine. Now wired to `scoreTraderReadiness`, with an honest **"No check-in yet today"** empty state. (`app/page.tsx`, `app/behaviour-journal/page.tsx`, `components/readiness-ring.tsx`)
- **Decision gate now uses planned risk:** `decidePreTrade` collected `plannedRiskPercentage` but ignored it. Now: **> 5% → Avoid**, **> 2% → Reduce Size** on an otherwise-Proceed setup, with existing hard-blocker ordering preserved. (`lib/pre-trade-decision.ts`)
- **Single source of truth for markets** (`lib/assets.ts`) — the asset list was previously duplicated across several files.

---

## 🧹 Quality & hygiene

- **Tests:** Vitest added with **23 table-driven tests** across the three rule engines (`lib/pre-trade-decision.test.ts`, `lib/trader-readiness.test.ts`, `lib/weekly-insights.test.ts`). Scripts: `pnpm test`, `pnpm test:watch`, `pnpm typecheck`.
- **Bypass-auth guard:** `NEXT_PUBLIC_BYPASS_AUTH` now only takes effect when `NODE_ENV !== "production"`, and shows a loud amber **"Presentation mode — nothing is saved"** banner when active — so a misconfigured deploy can't silently ship an authless build. (`components/app-shell.tsx`, `app/login/page.tsx`)
- **Resilience:** added `app/error.tsx`, `app/loading.tsx`, `app/not-found.tsx`.
- **`next.config.ts`** — sets `outputFileTracingRoot` to silence the multi-lockfile workspace-root warning.
- **`pnpm-workspace.yaml`** — replaced the invalid `allowBuilds: sharp: "set this to true or false"` placeholder with a valid `onlyBuiltDependencies: [sharp]`.
- **Docs & scaffolding:** `README.md`, `supabase/seed.sql`, `.github/workflows/ci.yml` (typecheck+test+build, activates on push), `public/manifest.webmanifest` (PWA), Tailwind theme tokens, and shared `ReadinessRing` + `DemoBadge` components.
- **`AUDIT.md`** — the full product & engineering audit that drove all of the above.

---

## 📁 Files at a glance

**New:** `app/api/quotes/route.ts`, `app/api/calendar/route.ts`, `app/error.tsx`, `app/loading.tsx`, `app/not-found.tsx`, `lib/assets.ts`, `lib/market-data.ts`, `lib/watchlist.ts`, `lib/*.test.ts` (3), `components/manage-markets.tsx`, `components/readiness-ring.tsx`, `components/tradingview-chart.tsx`, `components/demo-badge.tsx`, `next.config.ts`, `pnpm-workspace.yaml`, `vitest.config.ts`, `supabase/seed.sql`, `README.md`, `AUDIT.md`, `LERATO-TODO.md`, `.github/workflows/ci.yml`, `public/manifest.webmanifest`.

**Modified:** `app/page.tsx`, `app/assets/[symbol]/page.tsx`, `app/behaviour-journal/page.tsx`, `app/login/page.tsx`, `app/layout.tsx`, `components/app-shell.tsx`, `lib/pre-trade-decision.ts`, `package.json`, `tailwind.config.ts`.

---

## ⏳ Deferred — needs the Supabase backend (see [LERATO-TODO.md](./LERATO-TODO.md))

- Authentication + all journaling **persistence** (currently presentation/bypass mode).
- **Decision → outcome linkage** (`trades.checklist_id`) — schema-ready, highest-value next feature.
- **Weekly Insights persistence** (currently recomputed each visit; table unused).
- **Journaling of watchlist markets** beyond the default 3 (needs the enum → FK change).
- Optional: server-side market-data caching into `market_briefs`, scheduled backups, enabling CI.

## 🔎 Notes
- **No AI** is used in any score or decision — deliberate.
- **Live data** is from unofficial/free public feeds (Yahoo Finance chart endpoint + Forex Factory weekly JSON). Fine for a private tool; verify their terms before any commercial/public use.
- Nothing has been pushed to GitHub — all changes are local on `agent/audit-implementation`.
