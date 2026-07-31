-- Trade Decision OS — reference data seed
-- Idempotent: safe to run against a fresh database or one that has already
-- run the migrations (migration 20260711000000_initial_schema.sql inserts
-- the same three rows; the ON CONFLICT below makes re-running this a no-op).
--
-- How to run:
--   Supabase CLI, local dev: runs automatically as part of `supabase db reset`.
--   Supabase CLI, any project: supabase db execute --file supabase/seed.sql
--   No CLI: paste this file's contents into the Supabase Studio SQL editor and run.
--   psql directly: psql "$DATABASE_URL" -f supabase/seed.sql

insert into public.assets (symbol, name, market) values
  ('XAUUSD', 'Gold / XAUUSD', 'Metals'),
  ('NAS100', 'Nasdaq 100', 'Equity index'),
  ('GER40', 'GER40 / DAX', 'Equity index')
on conflict (symbol) do nothing;
