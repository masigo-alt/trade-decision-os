-- Daily Brief structure
-- One owned daily brief per asset. user_id, updated_at, and is_published remain
-- as private-MVP metadata alongside the requested decision-support fields.

alter table public.market_briefs
  rename column brief_date to date;

alter table public.market_briefs
  rename column market_bias to overall_bias;

alter table public.market_briefs
  rename column price_behaviour_summary to price_behaviour;

alter table public.market_briefs
  rename column key_risk_events to risk_events;

alter table public.market_briefs
  rename column decision_support_summary to decision_summary;

alter table public.market_briefs
  alter column asset_id set not null,
  add column market_conviction_score smallint not null default 50
    check (market_conviction_score between 0 and 100);

comment on table public.market_briefs is
  'Daily market decision brief for one asset, owned by one authenticated user.';

comment on column public.market_briefs.market_conviction_score is
  'Manual confidence score from 0 (no conviction) to 100 (highest conviction).';
