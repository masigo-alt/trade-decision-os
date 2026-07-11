-- Trade Decision OS — initial private MVP schema
-- Supabase creates auth.users. The public.users table is its application profile.

create extension if not exists "pgcrypto";

create type public.asset_symbol as enum ('XAUUSD', 'NAS100', 'GER40');
create type public.market_bias as enum ('bullish', 'bearish', 'neutral');
create type public.trade_direction as enum ('long', 'short');
create type public.trade_status as enum ('planned', 'open', 'closed', 'cancelled');
create type public.trade_outcome as enum ('win', 'loss', 'breakeven');
create type public.checklist_recommendation as enum ('proceed', 'wait', 'reduce_size', 'avoid');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text not null default 'Africa/Johannesburg',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  symbol public.asset_symbol not null unique,
  name text not null,
  market text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.assets (symbol, name, market) values
  ('XAUUSD', 'Gold / XAUUSD', 'Metals'),
  ('NAS100', 'Nasdaq 100', 'Equity index'),
  ('GER40', 'GER40 / DAX', 'Equity index');

create table public.market_briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  asset_id uuid references public.assets(id) on delete set null,
  brief_date date not null,
  market_bias public.market_bias not null,
  macro_backdrop text not null,
  sentiment_backdrop text not null,
  price_behaviour_summary text not null,
  long_case text not null,
  short_case text not null,
  invalidation text not null,
  key_risk_events text[] not null default '{}',
  decision_support_summary text not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, asset_id, brief_date)
);

create table public.pre_trade_checklists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete restrict,
  direction public.trade_direction not null,
  setup_type text not null,
  risk_percent numeric(5,2) not null check (risk_percent > 0 and risk_percent <= 100),
  reason_for_trade text not null,
  upcoming_news_checked boolean not null,
  market_conditions_aligned boolean not null,
  emotional_state_acceptable boolean not null,
  trade_matches_plan boolean not null,
  recommendation public.checklist_recommendation not null,
  recommendation_reason text not null,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete restrict,
  checklist_id uuid references public.pre_trade_checklists(id) on delete set null,
  direction public.trade_direction not null,
  setup_type text,
  status public.trade_status not null default 'planned',
  opened_at timestamptz,
  closed_at timestamptz,
  entry_price numeric(18,6),
  exit_price numeric(18,6),
  stop_loss numeric(18,6),
  take_profit numeric(18,6),
  risk_percent numeric(5,2) check (risk_percent > 0 and risk_percent <= 100),
  realised_pnl numeric(18,2),
  realised_r_multiple numeric(10,2),
  outcome public.trade_outcome,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (closed_at is null or opened_at is null or closed_at >= opened_at),
  check ((status <> 'closed') or (outcome is not null))
);

create table public.behaviour_journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  entry_date date not null,
  slept_well boolean not null,
  felt_calm_before_trading boolean not null,
  felt_pressure_to_make_money boolean not null,
  traded_after_a_loss boolean not null,
  overtraded boolean not null,
  revenge_traded boolean not null,
  respected_stop boolean not null,
  followed_plan boolean not null,
  traded_during_news boolean not null,
  net_positive boolean,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

create table public.weekly_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  week_start_date date not null,
  week_end_date date not null,
  trades_taken integer not null default 0 check (trades_taken >= 0),
  win_rate numeric(5,2) check (win_rate is null or (win_rate >= 0 and win_rate <= 100)),
  net_pnl numeric(18,2),
  net_r_multiple numeric(10,2),
  checklist_compliance_rate numeric(5,2) check (checklist_compliance_rate is null or (checklist_compliance_rate >= 0 and checklist_compliance_rate <= 100)),
  behaviour_summary text not null,
  correlations jsonb not null default '[]'::jsonb,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (week_end_date >= week_start_date),
  unique (user_id, week_start_date)
);

create index market_briefs_user_date_idx on public.market_briefs (user_id, brief_date desc);
create unique index market_briefs_one_global_brief_per_day_idx
  on public.market_briefs (user_id, brief_date) where asset_id is null;
create index pre_trade_checklists_user_submitted_idx on public.pre_trade_checklists (user_id, submitted_at desc);
create index trades_user_opened_idx on public.trades (user_id, opened_at desc);
create index trades_user_status_idx on public.trades (user_id, status);
create index behaviour_journal_entries_user_date_idx on public.behaviour_journal_entries (user_id, entry_date desc);
create index weekly_insights_user_week_idx on public.weekly_insights (user_id, week_start_date desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_set_updated_at before update on public.users
  for each row execute function public.set_updated_at();
create trigger assets_set_updated_at before update on public.assets
  for each row execute function public.set_updated_at();
create trigger market_briefs_set_updated_at before update on public.market_briefs
  for each row execute function public.set_updated_at();
create trigger pre_trade_checklists_set_updated_at before update on public.pre_trade_checklists
  for each row execute function public.set_updated_at();
create trigger trades_set_updated_at before update on public.trades
  for each row execute function public.set_updated_at();
create trigger behaviour_journal_entries_set_updated_at before update on public.behaviour_journal_entries
  for each row execute function public.set_updated_at();
create trigger weekly_insights_set_updated_at before update on public.weekly_insights
  for each row execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.market_briefs enable row level security;
alter table public.pre_trade_checklists enable row level security;
alter table public.trades enable row level security;
alter table public.behaviour_journal_entries enable row level security;
alter table public.weekly_insights enable row level security;

create policy "users can manage their profile" on public.users
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "users can manage their own market briefs" on public.market_briefs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can manage their own checklists" on public.pre_trade_checklists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can manage their own trades" on public.trades
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can manage their own behaviour entries" on public.behaviour_journal_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can manage their own weekly insights" on public.weekly_insights
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.assets enable row level security;
create policy "authenticated users can read assets" on public.assets
  for select to authenticated using (true);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
