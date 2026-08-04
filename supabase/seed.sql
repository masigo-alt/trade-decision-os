-- Trade Decision OS — supported market catalogue
-- Idempotent: safe to run against a database after the asset-symbol expansion
-- migration. Existing asset UUIDs remain unchanged.
--
-- How to run:
--   Supabase CLI, local dev: runs automatically as part of `supabase db reset`.
--   Supabase CLI, any project: supabase db execute --file supabase/seed.sql
--   No CLI: paste this file's contents into the Supabase Studio SQL editor and run.
--   psql directly: psql "$DATABASE_URL" -f supabase/seed.sql

insert into public.assets (symbol, name, market) values
  ('XAUUSD', 'Gold', 'Metals'),
  ('XAGUSD', 'Silver', 'Metals'),
  ('XPTUSD', 'Platinum', 'Metals'),
  ('NAS100', 'Nasdaq 100', 'Equity index'),
  ('SPX500', 'S&P 500', 'Equity index'),
  ('US30', 'Dow Jones 30', 'Equity index'),
  ('GER40', 'GER40', 'Equity index'),
  ('UK100', 'FTSE 100', 'Equity index'),
  ('JPN225', 'Nikkei 225', 'Equity index'),
  ('FRA40', 'CAC 40', 'Equity index'),
  ('EU50', 'Euro Stoxx 50', 'Equity index'),
  ('AUS200', 'ASX 200', 'Equity index'),
  ('USOIL', 'WTI Crude Oil', 'Energy'),
  ('UKOIL', 'Brent Crude Oil', 'Energy'),
  ('NATGAS', 'Natural Gas', 'Energy'),
  ('EURUSD', 'EUR / USD', 'FX major'),
  ('GBPUSD', 'GBP / USD', 'FX major'),
  ('USDJPY', 'USD / JPY', 'FX major'),
  ('AUDUSD', 'AUD / USD', 'FX major'),
  ('USDCAD', 'USD / CAD', 'FX major'),
  ('USDCHF', 'USD / CHF', 'FX major'),
  ('NZDUSD', 'NZD / USD', 'FX major'),
  ('EURGBP', 'EUR / GBP', 'FX cross'),
  ('GBPJPY', 'GBP / JPY', 'FX cross'),
  ('EURJPY', 'EUR / JPY', 'FX cross'),
  ('BTCUSD', 'Bitcoin', 'Crypto'),
  ('ETHUSD', 'Ethereum', 'Crypto'),
  ('SOLUSD', 'Solana', 'Crypto')
on conflict (symbol) do update set
  name = excluded.name,
  market = excluded.market,
  is_active = true,
  updated_at = now();
