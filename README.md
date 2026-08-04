# Trade Decision OS

Trade Decision OS is a private, single-operator trading decision-discipline and journaling tool for a discretionary retail trader working XAUUSD, NAS100, and GER40. It is deliberately **rule-based, not AI-based**: every recommendation — the pre-trade go/no-go, the readiness score, the weekly insight — comes from a plain TypeScript function you can read top to bottom in `lib/`, not a model call. See [`AUDIT.md`](./AUDIT.md) for the full product/engineering audit and the roadmap this repo is being built against.

## Design principles

- **Rule-based, not AI-based.** `lib/pre-trade-decision.ts`, `lib/trader-readiness.ts`, and `lib/weekly-insights.ts` are pure, ordered functions — no model, no prompt, no hidden scoring.
- **Honest about what's real.** Live prices, percentages, and calendar events are shown as real data. Anything subjective — bias narratives, posture commentary, a score that isn't actually computed — is either backed by live data or explicitly marked with the amber `<DemoBadge/>` (`components/demo-badge.tsx`) as illustrative. Nothing invented is presented as real.
- **Private by design.** No self-serve signup, row-level security on every user-owned table. See "Accounts" below.

## Tech stack

- [Next.js 15](https://nextjs.org) (App Router) + React 19, TypeScript in strict mode
- Tailwind CSS v3
- [Supabase](https://supabase.com) (Postgres, Auth, RLS) via `@supabase/supabase-js`
- Recharts for in-app charts, a TradingView embed (`components/tradingview-chart.tsx`) for live price charts
- Vitest for unit tests

## Prerequisites

- Node.js 20 or newer (CI runs Node 22)
- [Corepack](https://nodejs.org/api/corepack.html) for pnpm — ships with Node. Either enable it once with `corepack enable` and use `pnpm` directly, or prefix each command below with `corepack` (e.g. `corepack pnpm install`) without enabling anything globally.

## Setup

1. Install dependencies:

   ```bash
   corepack pnpm install
   ```

2. Create `.env.local` (already gitignored) with:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
   NEXT_PUBLIC_BYPASS_AUTH=false
   ```

   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — from the Supabase project dashboard under Settings → API (the publishable key is the current anon-equivalent public key).
   - `NEXT_PUBLIC_BYPASS_AUTH` — **non-production only.** Set to `true` to run the app without a Supabase session (presentation/demo mode, no login required). Whenever it's on, the sidebar shows an "Authentication bypassed" banner and the session is a local placeholder — nothing is actually persisted under a real account. Leave it `false` (or unset) for any deployment a real trader will rely on.

## Run

```bash
corepack pnpm dev
```

Serves the app at http://localhost:3000.

## Tests

```bash
corepack pnpm test        # single run (vitest run)
corepack pnpm test:watch  # watch mode
```

## Typecheck

```bash
corepack pnpm typecheck
```

## Supabase migrations

SQL migrations live in `supabase/migrations/`, applied in filename (timestamp) order. Apply them with the Supabase CLI against a linked project:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Without the CLI linked, paste each migration file into the Supabase Studio SQL editor, in order.

`supabase/seed.sql` seeds the three tracked reference assets (`XAUUSD`, `NAS100`, `GER40`) into `public.assets`. It's idempotent (`on conflict (symbol) do nothing`), so it's safe to run at any time — including via `supabase db reset` locally, which applies it automatically after replaying the migrations.

## Accounts

There is no self-serve signup. Accounts are created directly in Supabase — Studio → Authentication → Users, or the Admin API — by whoever operates the project. `app/login` only signs an existing email/password in; it never registers one.

## Live market data

`/api/quotes` and `/api/calendar` (backed by `lib/market-data.ts`) serve real data with no registration or API key required:

- **Quotes** — the public Yahoo Finance chart endpoint, one call per tracked asset, revalidated every 5 minutes.
- **Calendar** — Forex Factory's public weekly calendar feed, filtered to High/Medium-impact USD/EUR events, revalidated every 15 minutes. `CalEvent.time` is an ISO timestamp — render it in `Africa/Johannesburg`.

Both degrade gracefully instead of throwing: a failed fetch returns `live: false` with null fields (quotes) or an empty list (calendar), never a fabricated number.

## Progressive web app

`public/manifest.webmanifest` declares the app as installable (standalone display, dark theme to match the UI). It references `/icon-192.png` and `/icon-512.png`, which **still need to be added** to `public/` — until then those icon requests 404 and installed instances fall back to a generic icon.

## Project structure

- `app/` — routes (App Router): dashboard, pre-trade check, trade journal, behaviour journal, weekly insights, login, and the `/api/quotes` + `/api/calendar` route handlers
- `components/` — shared UI (`app-shell`, journal forms, `readiness-ring`, `tradingview-chart`, `demo-badge`)
- `lib/` — the rule engines, market-data fetchers, the asset registry, and the Supabase client
- `supabase/` — SQL migrations and the reference-data seed

## Further reading

[`AUDIT.md`](./AUDIT.md) — the full audit: what's solid, prioritized findings, the phased roadmap, and the free-API research this live-data integration is based on.
