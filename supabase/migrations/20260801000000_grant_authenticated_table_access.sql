-- Allow signed-in app users to reach the private MVP tables. Row-level
-- security remains the ownership boundary for every user-owned row.

grant usage on schema public to authenticated;

grant select on table public.assets to authenticated;

grant select, insert, update, delete on table
  public.users,
  public.market_briefs,
  public.pre_trade_checklists,
  public.trades,
  public.behaviour_journal_entries,
  public.weekly_insights
to authenticated;
