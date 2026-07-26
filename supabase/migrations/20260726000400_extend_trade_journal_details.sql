-- Detailed Trade Journal workflow: before analysis, execution context, review,
-- and private before/after chart screenshots.

alter table public.trades
  add column before_analysis text,
  add column entry_reason text,
  add column risk_amount numeric(18,2) check (risk_amount is null or risk_amount >= 0),
  add column target_amount numeric(18,2) check (target_amount is null or target_amount >= 0),
  add column currency text not null default 'USD' check (char_length(currency) = 3),
  add column result_conclusion text,
  add column review_notes text,
  add column closing_commentary text,
  add column before_screenshot_path text,
  add column after_screenshot_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'trade-journal-screenshots',
  'trade-journal-screenshots',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "users can read their trade screenshots"
on storage.objects for select to authenticated
using (
  bucket_id = 'trade-journal-screenshots'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "users can upload their trade screenshots"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'trade-journal-screenshots'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "users can update their trade screenshots"
on storage.objects for update to authenticated
using (
  bucket_id = 'trade-journal-screenshots'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'trade-journal-screenshots'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "users can delete their trade screenshots"
on storage.objects for delete to authenticated
using (
  bucket_id = 'trade-journal-screenshots'
  and (storage.foldername(name))[1] = auth.uid()::text
);

comment on column public.trades.before_analysis is
  'Market and chart context recorded before execution.';

comment on column public.trades.review_notes is
  'What went well and what should improve after the trade.';
