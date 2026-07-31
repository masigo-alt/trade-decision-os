# Trade Decision OS — Product & Engineering Audit

**Audited:** 30 July 2026 · Repo: `trade-decision-os` (full read) · Advisor: Fable (senior product/engineering review)
**Scope:** codebase, data model, product design, and forward roadmap incl. free market-data API research.

> **Correction applied after review:** the automated draft claimed the project "has no version control" and advised `git init`. That is **incorrect** — this repo is git-tracked and already hosted on GitHub (`masigo-alt/trade-decision-os`). The only valid part of that observation is that the working copy lives inside iCloud Drive (see F5). All git-related advice below has been corrected accordingly.

---

## 1. Executive summary

Trade Decision OS is a private decision-discipline and journaling tool for one discretionary retail trader (XAUUSD, NAS100, GER40), deliberately framed as "decision support, not financial advice" — and the parts that embody that philosophy are genuinely good. The three pure-TypeScript rule engines (`lib/pre-trade-decision.ts`, `lib/trader-readiness.ts`, `lib/weekly-insights.ts`) are thoughtful, transparent, and well-separated from the UI, and the Supabase schema underneath them is properly designed with row-level security done correctly everywhere. The honest maturity assessment: **this is a strong-bones MVP with a mock front-of-house** — everything the user *writes* (checklists, trades, behaviour entries) is real and persisted; almost everything the user *reads about the market* (prices, biases, session posture, the CPI/Fed event radar, every asset brief) is hardcoded fiction in the TSX, presented without a demo label. Two "readiness" scores are literally the number `82` typed into JSX, disconnected from the real scoring engine sitting one import away. The single biggest opportunity is therefore obvious and high-leverage: replace the hardcoded market/context/calendar surfaces with a thin live-data pipeline (free-tier APIs, cached server-side into the already-existing but never-used `market_briefs` table), which converts the dashboard from a design prototype into the daily instrument it's meant to be. Secondary wins — wiring the real readiness score, making the decision gate actually use the risk% it collects, and linking checklists to outcomes via the `checklist_id` column that already exists — are small efforts with outsized payoff for the app's actual purpose. Ship those and this stops being a demo of a good idea and becomes the good idea.

---

## 2. What's genuinely good (don't break these)

- **The rule engines are the right product.** `decidePreTrade()` is a conservative, *ordered* gate — plan mismatch and missing invalidation short-circuit to Avoid before anything else is considered, and an off emotional state can only ever downgrade (Reduce Size at best). That ordering encodes real trading discipline, not a naive checklist sum. Keep this function pure and boring forever.
- **Excluding `net_positive` from the readiness score** in `lib/trader-readiness.ts` is the single smartest product decision in the repo: a green day must not license more risk tomorrow. Same for the hard blockers (revenge trade / broke plan / broke stop) overriding everything. This is psychology-aware design most retail tools get wrong.
- **Security posture is correct.** RLS enabled on every table with `auth.uid() = user_id` owner policies, a private storage bucket with per-user folder policies, signed URLs for screenshots, no self-serve signup. For a private two-person tool this is exactly the right amount of security, done properly.
- **The schema is better than the app currently deserves** — `assets` as typed reference data, `trades.checklist_id` FK to `pre_trade_checklists` (migration `20260711000000_initial_schema.sql:79`), a rich `weekly_insights` shape, `updated_at` triggers throughout. The data model already anticipates the product's best future features.
- **The honesty framing is consistent and load-bearing.** "Rule-based" badges on decision outputs, "These are transparent rule-based summaries… No AI is used" (`app/weekly-insights/page.tsx:86`), and Demo/Live badges on the journal and weekly pages. This transparency is the product's trust foundation — every recommendation below preserves it.
- **Clean separation** of engines (`lib/`) from presentation, so making surfaces "real" is mostly a data-plumbing job, not a rewrite.

---

## 3. Audit findings — prioritized

Severity is ranked by impact on the product's actual purpose: *helping a trader make disciplined decisions with trustworthy context.*

| # | Sev | Area | Finding | Recommended fix |
|---|-----|------|---------|-----------------|
| F1 | **High** | Data integrity | The entire market surface is hardcoded and **unlabeled**: dashboard prices (`app/page.tsx:19` — gold "2,368.42"), biases, session posture, and the event radar ("US CPI release · 14:30", "Fed speaker · Williams" at `app/page.tsx:31-32`), plus every `/assets/[symbol]` brief. For a tool whose gate literally asks "economic calendar checked?", showing fictional CPI/Fed times is actively dangerous — it can create false confidence there is or isn't event risk today. Notably, the journal and weekly pages *do* badge Demo vs Live; the market surfaces don't. | Two-step: (a) today, add the same amber "Demo" badge to dashboard market brief, event radar, and asset pages — one hour of honesty; (b) Phase 1, replace with a live pipeline cached into `market_briefs` (see §4/§5). |
| F2 | **High** | Data integrity | Two readiness scores are hardcoded `82` — the dashboard ring (`app/page.tsx:97`, plus fabricated sub-bars "Sleep & energy 8/10") and the behaviour-journal header (`app/behaviour-journal/page.tsx:13`) — while the real `scoreTraderReadiness` engine exists and the day's entry is in `behaviour_journal_entries`. The app currently tells the trader a psychological state that is fiction. | Fetch today's entry, run it through `scoreTraderReadiness`, render the real score; show an explicit "No check-in yet today" empty state (which doubles as a nudge). Delete the fake sub-bars or derive them from real answers. Effort: small. |
| F3 | **High** | Rule-engine correctness | `decidePreTrade()` accepts `plannedRiskPercentage` (`lib/pre-trade-decision.ts:2`) and the form collects it, but the logic never reads it. The user reasonably believes their stated risk% is part of the gate — false assurance inside the app's core mechanism. | Either use it (e.g., `> 2%` → Reduce Size with reason; `> 5%` → Avoid; thresholds configurable later) or remove it from the input type and form. Using it is better — it's the only *quantitative* check the gate would have. Add unit tests with the change. |
| F4 | **Med** | Quality | **Zero tests** on the three rule engines — which are the product. They're pure functions, ideal for table-driven tests, and the gate's *ordering* semantics (F3 will touch it) are exactly the kind of thing that silently regresses. No CI either. | Add Vitest; ~30 table-driven cases across the three engines in a day. A 25-line GitHub Actions workflow: typecheck, lint, test, build. |
| F5 | **Med** | Operations | The working copy lives in **iCloud Drive** (`~/Library/Mobile Documents/...`). iCloud sync + a `node_modules`/pnpm store is a known source of sync churn and occasional file corruption. *(The repo itself is fine — git-tracked and pushed to GitHub — so history is safe; this is purely about the local working directory's location.)* | Consider moving the working copy outside iCloud (e.g., `~/dev/trade-decision-os`) and let GitHub be the sync mechanism between you and your friend. At minimum ensure `node_modules`/`.next` stay gitignored (they are) and don't rely on iCloud for anything but convenience. |
| F6 | **Med** | Architecture | `market_briefs` table: never read or written. `weekly_insights` table: never written — the weekly page recomputes client-side each visit, so there's no historical record of weekly reports and no way to see "am I improving month over month". | `market_briefs` becomes the cache for the F1 pipeline (it's already shaped for it). For `weekly_insights`: on week rollover (or a "Save this week's report" button first — simplest), write the computed output; add a small history list to the page. |
| F7 | **Med** | Rigidity | The asset list is duplicated across several files (`app/page.tsx`, `app/assets/[symbol]/page.tsx`, `components/pre-trade-checklist-form.tsx`, `components/trade-journal-form.tsx`) *and* as a Postgres enum. Adding US30 = a migration plus several edits. Ironically the forms already query the `assets` table for IDs — the DB is half-wired as the source of truth. | Short term: one `lib/assets.ts` constant imported everywhere. Proper fix: fetch the `assets` table for dropdowns/dashboard; migrate the enum column to `text` + FK to `assets`. |
| F8 | **Med** | Security config | `NEXT_PUBLIC_BYPASS_AUTH=true` (checked in `app/login/page.tsx:10`, `components/app-shell.tsx:117`) skips auth entirely. RLS still protects data (no session → no rows), so it's not a data breach — but it's a footgun: one wrong env var on a deployed build and the app silently runs authless in demo mode. | Guard it: `process.env.NODE_ENV !== "production" && bypassAuth`, plus a loud persistent banner whenever bypass is active ("Presentation mode — nothing is saved"). |
| F9 | **Med** | Resilience | No error boundaries, no `error.tsx`/`loading.tsx`, no `not-found.tsx`. A render error anywhere white-screens the app; only a session spinner exists. Fetch failures fall back to demo data with a small status line — easy to miss mid-session. | Add a root `error.tsx` + per-route `loading.tsx` skeletons (cheap in App Router). Make the fallback-to-demo state visually unmissable (amber wash, not just a badge). |
| F10 | **Low/Med** | Architecture | Everything is `"use client"` with browser-side Supabase queries. Legitimate Supabase pattern, but: all query shapes and business logic ship in the public bundle, there's no server-side rate limiting surface, and — critically — there is **nowhere to put a secret**, which blocks any API-key-based data integration (see §6). | Accept the pattern for CRUD (fine at this scale), but introduce your first route handlers / Edge Functions for the F1 data pipeline. No paid or keyed API may ever appear in a `NEXT_PUBLIC_` var. |
| F11 | **Low** | Tooling | `pnpm-workspace.yaml` contains a literal unfilled placeholder: `allowBuilds: sharp: set this to true or false` — not a valid pnpm setting, and the cause of the `sharp` ignored-build-script warning. | Run `pnpm approve-builds` and approve `sharp` (writes `onlyBuiltDependencies: ["sharp"]`); delete the bogus `allowBuilds` key. |
| F12 | **Low** | Tooling | Next.js workspace-root warning caused by a stray `~/package-lock.json` on the dev machine. | Delete the stray lockfile or set `outputFileTracingRoot: __dirname` in `next.config.ts`. Two minutes. |
| F13 | **Low** | Onboarding | No README, no seed script, no LICENSE. There are two of you — the bus factor is real, and "how do I run this / provision an account / apply migrations" lives in one person's head. (There is a `.env.example`.) | Half-day: README (setup, env vars incl. `NEXT_PUBLIC_BYPASS_AUTH` semantics, migration workflow, account provisioning) and a seed script for the `assets` table + a demo user. |
| F14 | **Low** | Consistency | Tailwind config is empty (`theme.extend:{}`); the design system lives as custom classes in `app/globals.css` + repeated inline emerald/amber/violet utilities. Works, but tokens are uncentralized and drift is starting (the same ring styles are copy-pasted between the two `82`s). | When touching styling next, lift colors/radii into Tailwind theme tokens and extract a shared `ReadinessRing` component. Not urgent. |
| F15 | **Low** | Data safety | Supabase free tier: no automated backups, and projects pause after ~1 week of inactivity. The journal is irreplaceable personal history. | Scheduled weekly export (pg_dump via CLI, or a cron'd Edge Function dumping tables to CSV in Storage / email). Verify current free-tier terms. |

---

## 4. Improvement roadmap

Effort: **S** ≤ half a day · **M** 1–3 days · **L** a week+ (part-time pace).

### Phase 1 — Stop showing fiction; close loose ends (target: 2–3 weeks)

| Item | Why it matters here | Effort |
|---|---|---|
| 1. Badge all mock surfaces "Demo" (dashboard brief, event radar, asset pages) | Restores honesty *today*, before the pipeline exists; consistent with the app's own trust framing | S |
| 2. Wire both `82`s to `scoreTraderReadiness` + real empty state (F2) | The readiness ring is the dashboard's emotional centerpiece; it must be true | S |
| 3. Use `plannedRiskPercentage` in the gate, or remove it (F3) | Integrity of the core decision mechanism | S |
| 4. **Live event radar**: route handler fetches the Forex Factory weekly JSON (cached; see §5.2) + a small static FOMC-dates JSON (published a year ahead); render in `Africa/Johannesburg` | The gate asks "calendar checked?" — the app should *be* the calendar. This is the most dangerous mock to leave in place | M |
| 5. **Live prices/context pipeline**: scheduled job (Vercel cron or Supabase Edge Function + pg_cron) → fetches quotes/macro from the §5 starter stack → writes a row to `market_briefs` → dashboard and asset pages read from the table | The core move. Server-side keys, one vendor call per day serves both users, `market_briefs` finally earns its keep, and the dashboard becomes a real morning instrument | L |
| 6. Vitest on the three engines + GitHub Actions CI (F4) | Protects the product's brain while you change it (item 3 touches the gate) | M |
| 7. Hygiene batch: pnpm-workspace fix (F11), `outputFileTracingRoot` (F12), README + seed (F13), bypass-auth prod guard (F8), move working copy out of iCloud (F5) | Cheap, permanent risk reduction | M |

### Phase 2 — Close the loop; make history compound (next 1–2 months)

| Item | Why | Effort |
|---|---|---|
| 1. **Decision → outcome linkage**: when logging a trade, offer to link a recent checklist (populate the existing `trades.checklist_id`); weekly page then reports "trades taken on Proceed vs. against a Wait/Avoid" and their outcomes | The highest product-value feature available: it answers *"does my own gate work, and do I obey it?"* — the entire point of the app. The schema already supports it; only UI + one aggregation are missing | M |
| 2. Persist `weekly_insights` (start with a "Save report" button; automate on week rollover later) + history view (F6) | Turns a recomputed dashboard into longitudinal self-knowledge | M |
| 3. Assets from the `assets` table everywhere; enum → text+FK (F7) | Adding US30/UK100 becomes a DB row, not a multi-file surgery | M |
| 4. TradingView Advanced Chart embeds on `/assets/[symbol]` (see §5.5) | Real charts with zero data contract; makes asset pages instantly useful | S |
| 5. `error.tsx`, `loading.tsx` skeletons, unmissable demo-fallback state (F9) | Daily-use tool reliability | S |
| 6. `supabase gen types typescript` in the workflow; CSV/JSON export of journals; scheduled backup (F15) | Type drift protection after 6 rapid migrations; the data is the asset — make it portable and safe | M |

### Phase 3 — Bigger bets (when Phases 1–2 are digested)

| Item | Why | Effort |
|---|---|---|
| 1. **MT5/MT4 statement import** (parse the broker's exported HTML/CSV account statement → bulk-create `trades`) | Manual trade entry is the #1 abandonment risk for journaling tools; import removes the friction and backfills history. Reconcile fills against journal entries rather than replacing them | L |
| 2. PWA + daily check-in reminder (installable, notification or even a simple scheduled email), plus streak/consistency stats on the behaviour journal | The behaviour journal only works if it's done daily; habit mechanics are product features here, not gimmicks | M |
| 3. Weekly report email (rendered from the now-persisted `weekly_insights`) | Reflection arrives without opening the app | M |
| 4. *Optional, opt-in, clearly-labeled* AI reflection assistant — summarizes the user's **own** journal prose; never scores, never gates, never predicts; off by default; badge "AI-generated reflection — not part of any score" | Respects the "No AI is used" stance by keeping it literally true for all scoring/decisions while adding value where LLMs are genuinely good (mirroring your own words back). If either owner is uncomfortable, skip it — the app is complete without it | M |

---

## 5. Free APIs & data sources

**Honest framing first.** (1) Free tiers drift constantly — Alpha Vantage went 500 → 100 → 25 req/day in two years; verify every number below against the vendor's pricing page before building. (2) **True CFD prices are broker-side** — your MT5 broker's XAUUSD/NAS100/GER40 quotes (with their spread and their exact levels) are not available via any public free API. Everything below is a *proxy*: spot metals feeds, cash index values (^NDX, ^GDAXI), futures, or ETFs. For this app that's fine — the dashboard needs *context* ("gold is up, holding above 2,350"), not tick-accurate broker levels; just label the source and never present a proxy as the broker's price. Cash-index proxies also freeze outside exchange hours while CFDs trade nearly 24h — the DAX proxy will be stale during your SAST morning. (3) Several free tiers are personal/non-commercial use only — fine for a private two-user tool, but re-check if this ever becomes a product.

### 5.1 Prices / quotes

| Service | Free-tier reality (verify) | Fit for XAUUSD / NAS100 / GER40 |
|---|---|---|
| **Twelve Data** | 800 credits/day, 8 req/min; US equities, forex, crypto | **Good.** `XAU/USD` available as a forex-style pair. Indices are generally paid-tier → cover NAS100 via `QQQ` ETF proxy; GER40 has no good free symbol here. 800/day is ample for a cached daily brief |
| **TraderMade** | ~1,000 req/month total, personal use, live + historical FX/CFD endpoints | **Best symbol fit.** The only free API in this list with *direct* CFD-style indices — its CFD list includes Nasdaq 100 and DAX — plus XAUUSD. ~33 req/day is tiny but exactly enough for one scheduled brief fetch. Confirm whether the 1,000 is monthly or a one-time trial before committing |
| **Finnhub** | 60 req/min; real-time US stocks, company news, websocket | Decent for `QQQ`-style proxies and news; forex/index coverage on free has shifted over time — verify symbols with a free key |
| **Alpha Vantage** | **25 req/day**, 5/min | Barely usable. `CURRENCY_EXCHANGE_RATE` for XAU→USD works, but the quota makes it a backup at best |
| **Financial Modeling Prep** | 250 req/day, but free-tier endpoint/symbol coverage has been repeatedly cut | Not a foundation; verify any endpoint you'd rely on still exists on free |
| **Tiingo** | Generous for this scale (~1k req/day ballpark); EOD + IEX intraday US equities | Fine ETF-proxy source (`GLD`, `QQQ`); no direct XAU or European indices; news API is paid |
| **Polygon.io** | 5 req/min, EOD/delayed, US stocks; indices are a separate paid product | Skip for this use case |
| **Metals-API / GoldAPI** | Tiny free quotas (tens to low hundreds of req/month) | Skip — Twelve Data/TraderMade cover gold better |
| **Yahoo Finance (unofficial)** | No official API; `yfinance`-style endpoints; free, keyless | Excellent symbol coverage (`GC=F`, `^NDX`, `^GDAXI`) but ToS-gray and breaks without notice (crumb/cookie changes, rate blocks). Acceptable as a *fallback* in a private tool if you accept the fragility; never the primary |
| **Nasdaq Data Link** | Free key; LBMA gold AM/PM fix dataset; many legacy Quandl datasets stale | Daily gold benchmark only; niche |

### 5.2 Economic calendar (the app's CPI/Fed framing)

This is the hardest need to fill freely, and the most important for this app:

- **Forex Factory weekly feed** — `https://nfs.faireconomy.media/ff_calendar_thisweek.json` (also `.xml`/`.csv`/`.ics`). Unofficial but the de-facto standard consumed by thousands of MT4/MT5 EAs; includes impact ratings (High/Medium/Low), exactly matching your event-radar UI. Rate limit ~2 downloads per 5 minutes — **fetch once server-side, cache in Supabase, render for the week.** Caveats: no SLA, could vanish or change shape any week, personal use; build your parser defensively and keep the "Demo" badge as the degraded state.
- **Finnhub economic calendar** — the earnings calendar is free; the *macro* economic calendar endpoint has moved between tiers historically. Spend five minutes with a free key to verify before designing around it.
- **Trading Economics** — real calendar access is paid (the guest key returns sample countries only). Not viable free.
- **FRED release dates** — the `fred/releases/dates` endpoint gives official upcoming release dates for CPI and other US series: a rock-solid, ToS-clean way to answer "when is CPI?" even if you use nothing else.
- **FOMC dates** — published on federalreserve.gov over a year in advance. A 20-line static JSON in the repo, refreshed once or twice a year, is the pragmatic, zero-dependency answer. Don't over-engineer this.
- **Zero-effort alternative:** TradingView's free **Economic Calendar widget** embeds a live calendar with no API at all (see 5.5) — a legitimate way to ship Phase 1 faster, at the cost of styling control and your own filtering logic.

Render all event times converted to `Africa/Johannesburg` at display time — never store or hardcode SAST.

### 5.3 Macro / rates — **FRED** (unambiguous winner)

Free API key, generous limits (~120 req/min), stable, clean ToS. Directly serves the app's existing narrative ("real-yield pressure eases" is currently hardcoded fiction — FRED makes it true):

- `DFII10` — 10Y real yield (the gold driver your copy already references)
- `CPIAUCSL` / `CPILFESL` — headline/core CPI
- `DFF` / `DGS10` — Fed funds, 10Y nominal
- `T10YIE` — breakeven inflation; `DTWEXBGS` — broad dollar index (DXY-adjacent)

One cron fetch per day into `market_briefs` gives the dashboard genuinely true macro one-liners.

### 5.4 News / headlines

Candidates: **Marketaux** (~100 req/day, few articles per call, finance-tagged), **GNews** (~100/day, article caps), **NewsAPI.org** (100/day but **24h-delayed and dev/non-production use only** on free — effectively disqualifying), **Finnhub news** (free, US-centric), **Tiingo news** (paid). Honest product take: **skip news in Phase 1.** This app's philosophy is protecting the trader *from* noise; a headline feed works against the grain. If added later, constrain it to a small "context for today's brief" panel, three items max, from Marketaux or Finnhub.

### 5.5 Charts — TradingView (free tier is the pragmatic unlock)

- **Embeddable widgets** (Advanced Chart, Symbol Overview, Economic Calendar) are free, bring **their own data** — including broker-style feeds such as `OANDA:XAUUSD`, `CAPITALCOM:US100`, `CAPITALCOM:DE40`, far closer to your CFD instruments than any free REST API — and require keeping the TradingView attribution/logo intact (removal is a paid arrangement; stripping it risks a ban). For a private tool the practical risk is low, but leave the attribution alone and skim the widget terms.
- **lightweight-charts** (Apache-2.0) is the opposite trade: full styling control, but you supply the data — only worth it after the §5.1 pipeline exists.

### Recommended starter stack (private, 1–2 users, $0)

> **FRED** (macro series + CPI release dates) + **TraderMade** (XAUUSD, NAS100, GER40 quotes — verify the monthly quota) with **Twelve Data** as the XAU/equity-proxy backup + **Forex Factory weekly JSON** (event radar, defensively parsed) + **static FOMC JSON** + **TradingView Advanced Chart widgets** on asset pages.
>
> Integration pattern (non-negotiable): one scheduled server-side job per day → route handler / Edge Function holds all keys → writes one row to `market_briefs` → clients only ever read your own Supabase. Tiny free quotas become irrelevant because the vendors see one caller: your cron.

Verification links: Twelve Data pricing · TraderMade CFD list · Finnhub pricing / economic-calendar docs · Alpha Vantage limits · FRED API docs · TradingView widget docs & policies. *(Verify all free-tier numbers against the live pricing pages before building — they change often.)*

---

## 6. Architecture & security notes

- **Client-only + RLS is a legitimate pattern at this scale — with eyes open.** The anon/publishable key is public by design; RLS is the *only* wall. Consequences: every query shape and all business logic ship in the public JS bundle; there's no server chokepoint for rate limiting or abuse handling beyond Supabase's defaults; and the auth gate in `components/app-shell.tsx` is client-side only (data stays safe via RLS, but page shells render for anyone). Acceptable for a private tool with provisioned accounts — just don't let it drift unexamined into a multi-user product.
- **The hard rule for the data pipeline: no vendor key ever enters a `NEXT_PUBLIC_` var.** `NEXT_PUBLIC_` values are inlined into the shipped bundle — a "free" key leaked this way gets scraped and quota-drained, and a paid key becomes a liability. All TraderMade/Twelve Data/FRED calls belong in a Next.js route handler or Supabase Edge Function using server-only env vars, with results cached in `market_briefs`. This also happens to be the only architecture under which the free quotas work (§5).
- **`NEXT_PUBLIC_BYPASS_AUTH` is compile-time and env-driven** — guard it with a `NODE_ENV` check (F8) so a misconfigured deploy can't ship an authless build, and banner it loudly when active.
- **RLS regression risk is untested.** A one-file integration test (or at minimum a documented manual check) that user B cannot read user A's `trades` would protect the security property you most depend on across future migrations.
- **Operational**: Supabase free tier pauses inactive projects and lacks automated backups — schedule an export (F15). Adopt `supabase gen types typescript` so the 6-migration schema evolution can't silently diverge from your TS types. Keep migrations append-only; consider a squashed baseline once the schema settles.

---

## 7. Other suggestions

- **Broker import beats manual entry** (Phase 3 item 1). MT4/MT5 exports account statements as HTML/CSV; a parser that bulk-creates `trades` rows (then lets the user attach the qualitative journal fields) is the difference between a journal that's complete and one that's abandoned. Start with your actual broker's export format only.
- **Exploit `checklist_id` — it's your moat.** No mainstream journal ties a pre-trade *decision* to the eventual outcome. "You took 3 trades against a Wait/Avoid this month; they lost 2.1R combined" is the sentence this entire app exists to produce. The column has been waiting in the schema since the initial migration.
- **Habit mechanics for the behaviour journal**: current-streak counter, a dashboard nudge when today's entry is missing (the real empty state from F2 gives you this for free), optional email reminder. Discipline tools live or die on daily use.
- **Export everything** (CSV/JSON per table, screenshots via signed URLs): trader's data sovereignty, tax/records usefulness, and your own backup story in one feature.
- **README + seed script** aren't bureaucracy here — they're how the second friend (and future-you) can rebuild the environment. Document `NEXT_PUBLIC_BYPASS_AUTH` semantics explicitly, since it changes auth behavior.
- **Mobile/PWA**: journaling and check-ins happen away from the desk more than you'd think. The app is already responsive-ish; a manifest + install prompt is cheap. Native apps are not warranted.
- **On AI — respect the stance.** "No AI is used" is a genuine differentiator for a discipline tool; don't dilute it. If you ever add the reflection assistant (Phase 3.4): opt-in, visually quarantined, summarizes only the user's own written words, and the scoring/gating pages keep saying — truthfully — that no AI touches any score or recommendation.

---

## 8. If you do only 5 things

1. **Wire the two hardcoded `82`s to `scoreTraderReadiness`** with a real "no check-in yet" empty state (`app/page.tsx:97`, `app/behaviour-journal/page.tsx:13`) — hours of work, restores the app's core integrity.
2. **Make the event radar real**: Forex Factory weekly JSON (server-side, cached) + static FOMC dates + FRED CPI release dates, rendered in SAST — and until it ships, badge today's fake events "Demo". Stale event times are the one mock that can cause real harm.
3. **Make the gate honest**: use `plannedRiskPercentage` in `decidePreTrade` (or remove the field), and add Vitest coverage for all three rule engines while you're in there.
4. **Stand up the `market_briefs` pipeline**: daily cron → route handler/Edge Function (keys server-side only) → FRED + TraderMade/Twelve Data → one row in `market_briefs` → dashboard and asset pages read the table. This single move converts the mock front-of-house into the real product.
5. **Link decisions to outcomes**: populate `trades.checklist_id` at logging time and add the "gate adherence vs. outcome" stat to weekly insights — then start persisting those weekly reports to `weekly_insights`.

---

*Prepared by Fable acting as advisor, via Claude Code. Free-tier API details are directional and must be verified against current vendor terms before implementation.*
