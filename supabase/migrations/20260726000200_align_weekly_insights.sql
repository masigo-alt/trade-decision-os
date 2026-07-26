-- Weekly Insights structure
-- Quantitative trade metrics and correlations remain as supporting data for the
-- generated reflection fields introduced below.

alter table public.weekly_insights
  rename column week_start_date to week_start;

alter table public.weekly_insights
  rename column week_end_date to week_end;

alter table public.weekly_insights
  rename column behaviour_summary to summary;

alter table public.weekly_insights
  add column positive_patterns text[] not null default '{}',
  add column negative_patterns text[] not null default '{}',
  add column top_behaviour_risks text[] not null default '{}',
  add column recommendations text[] not null default '{}';

comment on table public.weekly_insights is
  'Generated weekly reflections combining trade outcomes and behaviour patterns.';

comment on column public.weekly_insights.positive_patterns is
  'Observed behaviours associated with stronger trading discipline or outcomes.';

comment on column public.weekly_insights.negative_patterns is
  'Observed behaviours associated with weaker trading discipline or outcomes.';

comment on column public.weekly_insights.top_behaviour_risks is
  'Highest-priority behavioural risks identified for the week.';
