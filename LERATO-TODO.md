# Backend Setup TODO — for Lerato

**Branch:** `agent/audit-implementation`
**Context:** You already run the Supabase backend — Dewald doesn't have access to it, so he works on the frontend and runs locally in **presentation mode** (`NEXT_PUBLIC_BYPASS_AUTH=true`, no Supabase connection). Live market data (prices + economic calendar) comes from **no-registration public feeds** via server route handlers, so the frontend is fully usable without touching your backend. What's left is on your side: **connecting auth**, **persisting** journals/checklists/insights, and a few **schema additions** for the new features below.

Most of this is written so you can hand it to **Codex** and let it execute. A few steps need a human (accounts, secret keys) — those are marked.

**Legend:** 🧑 = you must do it (credentials / dashboard) · 🤖 = Codex can do it once the project is linked.

---

## Part A — Human steps (Codex can't do these)

Your Supabase project already exists — this is about connecting to it and confirming its state, not creating it.

- [x] 🧑 **Grab the Project URL + publishable (anon) key** from *Project Settings → API*, put them in `.env.local` (repo root), and turn bypass off:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://<your-ref>.supabase.co
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-publishable-anon-key>
  NEXT_PUBLIC_BYPASS_AUTH=false
  ```
  The publishable/anon key is public by design (it ships in the browser bundle), so it's safe to share with Dewald if you want him developing against real data — otherwise the frontend just stays in presentation mode. `.env.local` is gitignored — never commit it.
- [x] 🧑 **Link the Supabase CLI** to your project so Codex can run the DB steps: `supabase login`, then `supabase link --project-ref <your-ref>`.
- [ ] 🧑 **Confirm the two user accounts** exist under *Authentication → Users* (add email+password users for you and Dewald if missing — there's no self-serve signup).
  - Foundation audit on 1 August 2026 found one active Auth user and one matching app profile. Dewald has now been invited; the two-user isolation test remains pending until he accepts and activates his account.

---

## Part B — Codex can execute these (after Part A)

- [x] 🤖 **Reconcile migrations with your existing project.** This session added **no** schema migrations (only frontend + `seed.sql`), so your DB may already be in sync. Run `supabase migration list` to compare `supabase/migrations/*.sql` against what's applied, and `supabase db push` anything missing. Confirm all 7 tables + RLS exist (`users`, `assets`, `market_briefs`, `pre_trade_checklists`, `trades`, `behaviour_journal_entries`, `weekly_insights`) plus the private `trade-journal-screenshots` storage bucket. *(The feature work further down **will** introduce new migrations.)*
  - Migration history was repaired to match the six schema stages already present. A seventh migration now grants the authenticated role table access while RLS remains the row-ownership boundary.
- [x] 🤖 **Seed the reference data.** Run `supabase/seed.sql` (idempotent — inserts the 3 default assets: XAUUSD, NAS100, GER40). Run it via the Supabase SQL editor or `psql "$DATABASE_URL" -f supabase/seed.sql`.
- [x] 🤖 **Generate typed DB bindings** for safety: `supabase gen types typescript --linked > lib/database.types.ts`, then thread the type into `getSupabaseBrowserClient()` in `lib/supabase/client.ts` (`createClient<Database>(...)`). Optional but recommended after 6 migrations of schema churn.
- [ ] 🤖 **Smoke-test auth + RLS.** With `NEXT_PUBLIC_BYPASS_AUTH=false`, sign in as a provisioned user and confirm the journals save. Add (or at least document) a check that user B cannot read user A's `trades` — RLS is the only wall, so protect it against future migrations.
  - Auth plus checklist, behaviour, and trade persistence passed. Temporary test rows were removed. Policy definitions and storage privileges were verified; a true cross-user test remains pending until a second Auth account exists.

### Higher-value feature work Codex can build (schema is already ready)

- [ ] 🤖 **Decision → outcome linkage** — *the single highest-value feature and the whole point of the app.* The `trades` table already has a `checklist_id` FK to `pre_trade_checklists` (since the initial migration) but nothing populates it. Add a "link a recent pre-trade checklist" selector to the trade-journal form (`components/trade-journal-form.tsx`), then add a "gate adherence vs. outcome" stat to Weekly Insights (`lib/weekly-insights.ts` + `app/weekly-insights/page.tsx`) — e.g. *"trades taken on Proceed vs. against a Wait/Avoid, and their combined R."*
- [x] 🤖 **Persist Weekly Insights.** The page now provides an idempotent "Save this week’s report" action and a 12-week history backed by `weekly_insights`, including the rule-based summary, patterns, recommendations, and decision-to-outcome correlations.
- [x] 🤖 **Let watchlist markets be journaled (enum → FK).** `assets.symbol` now uses validated text, all 28 supported markets are seeded without changing existing asset UUIDs, and both journal forms load Supabase assets with the managed watchlist shown first and the complete catalogue available underneath.

### Optional / nice-to-have (Codex can do, not required)

- [ ] 🤖 **Server-side market-data cache.** Current live data hits Yahoo/Forex-Factory per request via `app/api/quotes` + `app/api/calendar`. If you prefer, move fetching into a Supabase Edge Function + `pg_cron` that writes one daily row into the (currently unused) `market_briefs` table, and have the dashboard read from it. Reduces upstream calls; not needed for correctness.
- [ ] 🤖 **Scheduled backups.** Supabase free tier has no automated backups and pauses inactive projects. Add a scheduled export (Edge Function → CSV to Storage, or `pg_dump`). The journals are irreplaceable personal history.
- [ ] 🤖 **Enable CI.** `.github/workflows/ci.yml` exists (typecheck + test + build) and activates once the repo is pushed to GitHub. Add any repo secrets it needs.

---

## Part C — Rules for whoever (or whatever) does this

1. **No secret keys in `NEXT_PUBLIC_*` vars.** Those get inlined into the browser bundle. The current live-data APIs need **no keys**, but if you add any keyed provider, proxy it through a route handler or Edge Function with server-only env vars.
2. **Keep the "No AI" stance.** No AI touches any score or decision anywhere in this app — that's a deliberate trust feature. Don't add AI to scoring/gating.
3. **Live data is from unofficial/free feeds** (Yahoo Finance chart endpoint + Forex Factory weekly JSON). Fine for a private 2-person tool; verify their terms before any commercial/public use.
4. Migrations are append-only. Consider a squashed baseline once the schema settles.

Full detail on everything shipped this session is in [CHANGELOG.md](./CHANGELOG.md). The broader product/engineering audit is in [AUDIT.md](./AUDIT.md).
