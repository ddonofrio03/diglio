-- Diglio tracker: remove the sign-in requirement.
--
-- Run this once in the Supabase SQL editor for the
-- "Evening Scout & Life Stuff" project (ref bawcxalgdcuwnpkajkxa).
--
-- What it does: drops the per-user scoping so the tracker is one shared set of
-- rows readable and writable with the anon key. Deletes stay closed on
-- progress and facts, so a stray visitor cannot wipe the research; the log and
-- cost ledger allow delete because the UI has row delete buttons.

drop policy if exists diglio_progress_own on public.diglio_progress;
drop policy if exists diglio_facts_own    on public.diglio_facts;
drop policy if exists diglio_log_own      on public.diglio_log;
drop policy if exists diglio_costs_own    on public.diglio_costs;

alter table public.diglio_progress drop column if exists user_id;
alter table public.diglio_facts    drop column if exists user_id;
alter table public.diglio_log      drop column if exists user_id;
alter table public.diglio_costs    drop column if exists user_id;

alter table public.diglio_progress add primary key (item_key);
alter table public.diglio_facts    add primary key (fact_key);

create policy diglio_progress_read   on public.diglio_progress for select to anon, authenticated using (true);
create policy diglio_progress_insert on public.diglio_progress for insert to anon, authenticated with check (true);
create policy diglio_progress_update on public.diglio_progress for update to anon, authenticated using (true) with check (true);

create policy diglio_facts_read   on public.diglio_facts for select to anon, authenticated using (true);
create policy diglio_facts_insert on public.diglio_facts for insert to anon, authenticated with check (true);
create policy diglio_facts_update on public.diglio_facts for update to anon, authenticated using (true) with check (true);

create policy diglio_log_all   on public.diglio_log   for all to anon, authenticated using (true) with check (true);
create policy diglio_costs_all on public.diglio_costs for all to anon, authenticated using (true) with check (true);

grant select, insert, update         on public.diglio_progress to anon, authenticated;
grant select, insert, update         on public.diglio_facts    to anon, authenticated;
grant select, insert, update, delete on public.diglio_log      to anon, authenticated;
grant select, insert, update, delete on public.diglio_costs    to anon, authenticated;
