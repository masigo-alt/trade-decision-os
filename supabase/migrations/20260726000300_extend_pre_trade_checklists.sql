-- Pre-Trade Checklist additions for the decision gate.

alter table public.pre_trade_checklists
  rename column upcoming_news_checked to economic_calendar_checked;

alter table public.pre_trade_checklists
  add column has_clear_invalidation boolean not null default false,
  add column risk_reward_acceptable boolean not null default false,
  add column notes text;

comment on table public.pre_trade_checklists is
  'Pre-trade decision gate with transparent rule-based recommendation output.';
