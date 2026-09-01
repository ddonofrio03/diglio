-- Diglio tracker — database setup.
--
-- Run this in the Supabase SQL editor for the "Evening Scout & Life Stuff"
-- project (ref bawcxalgdcuwnpkajkxa). It is safe to run more than once.
--
-- Two things happen here:
--   1. The per-user scoping comes off, so the tracker needs no sign-in.
--   2. A bucket and a table are added for attached PDFs and scans.
--
-- Access model, stated plainly: anyone who has the site URL can read and edit
-- the checklist and download any attached document. Deletes are withheld on
-- progress, facts and stored files, so a stray visitor can scribble but cannot
-- destroy anything you have paid to obtain.

-- ---------------------------------------------------------------- checklist

drop policy if exists diglio_progress_own on public.diglio_progress;
drop policy if exists diglio_facts_own    on public.diglio_facts;
drop policy if exists diglio_log_own      on public.diglio_log;
drop policy if exists diglio_costs_own    on public.diglio_costs;

alter table public.diglio_progress drop column if exists user_id;
alter table public.diglio_facts    drop column if exists user_id;
alter table public.diglio_log      drop column if exists user_id;
alter table public.diglio_costs    drop column if exists user_id;

do $$
begin
  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.diglio_progress'::regclass and contype = 'p') then
    alter table public.diglio_progress add primary key (item_key);
  end if;
  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.diglio_facts'::regclass and contype = 'p') then
    alter table public.diglio_facts add primary key (fact_key);
  end if;
end $$;

drop policy if exists diglio_progress_read   on public.diglio_progress;
drop policy if exists diglio_progress_insert on public.diglio_progress;
drop policy if exists diglio_progress_update on public.diglio_progress;
create policy diglio_progress_read   on public.diglio_progress for select to anon, authenticated using (true);
create policy diglio_progress_insert on public.diglio_progress for insert to anon, authenticated with check (true);
create policy diglio_progress_update on public.diglio_progress for update to anon, authenticated using (true) with check (true);

drop policy if exists diglio_facts_read   on public.diglio_facts;
drop policy if exists diglio_facts_insert on public.diglio_facts;
drop policy if exists diglio_facts_update on public.diglio_facts;
create policy diglio_facts_read   on public.diglio_facts for select to anon, authenticated using (true);
create policy diglio_facts_insert on public.diglio_facts for insert to anon, authenticated with check (true);
create policy diglio_facts_update on public.diglio_facts for update to anon, authenticated using (true) with check (true);

-- The log and cost ledger have row delete buttons in the UI, so they allow it.
drop policy if exists diglio_log_all   on public.diglio_log;
drop policy if exists diglio_costs_all on public.diglio_costs;
create policy diglio_log_all   on public.diglio_log   for all to anon, authenticated using (true) with check (true);
create policy diglio_costs_all on public.diglio_costs for all to anon, authenticated using (true) with check (true);

grant select, insert, update         on public.diglio_progress to anon, authenticated;
grant select, insert, update         on public.diglio_facts    to anon, authenticated;
grant select, insert, update, delete on public.diglio_log      to anon, authenticated;
grant select, insert, update, delete on public.diglio_costs    to anon, authenticated;

-- ---------------------------------------------------------------- documents

create table if not exists public.diglio_docs (
  id         uuid primary key default gen_random_uuid(),
  item_key   text not null,
  name       text not null,
  path       text not null,
  mime       text not null default '',
  size_bytes bigint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists diglio_docs_item_idx on public.diglio_docs (item_key, created_at);

alter table public.diglio_docs enable row level security;

-- Deleting a row only takes the file out of the checklist; the stored object
-- stays, so a removal cannot lose the scan itself.
drop policy if exists diglio_docs_all on public.diglio_docs;
create policy diglio_docs_all on public.diglio_docs for all to anon, authenticated using (true) with check (true);

grant select, insert, update, delete on public.diglio_docs to anon, authenticated;

-- Public bucket: readable by exact URL, capped at 25 MB, PDFs and scans only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'diglio-docs', 'diglio-docs', true, 26214400,
  array['application/pdf','image/jpeg','image/png','image/tiff','image/webp','image/heic']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Uploads are allowed. Listing, overwriting and deleting are not: without a
-- select policy the bucket cannot be enumerated, so files are reachable only
-- by their random URL, and nobody can wipe or replace what you have uploaded.
drop policy if exists diglio_docs_upload on storage.objects;
create policy diglio_docs_upload on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'diglio-docs');
