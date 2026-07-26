-- Trade Journal structure
-- Existing status, checklist linkage, exit price, and risk metrics remain as
-- useful execution metadata beside the requested actual-outcome fields.

alter table public.trades
  rename column realised_pnl to pnl;

alter table public.trades
  rename column outcome to result;

alter table public.trades
  add column date date not null default current_date,
  add column followed_plan boolean not null default true,
  add column respected_stop boolean not null default true,
  add column mistake_type text;

-- Preserve the opening timestamp where available, while exposing a simple
-- journal date for reporting and filters.
update public.trades
set date = coalesce(opened_at::date, created_at::date)
where date = current_date and opened_at is not null;

create index trades_user_date_idx on public.trades (user_id, date desc);
create index trades_asset_date_idx on public.trades (asset_id, date desc);

comment on table public.trades is
  'Actual trade outcomes and execution-discipline records.';

comment on column public.trades.mistake_type is
  'Optional categorisation of the primary execution or behavioural mistake.';
