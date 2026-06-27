alter table public.tasks enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.tasks to authenticated;

do $$
begin
	if to_regclass('public.tasks_id_seq') is not null then
		execute 'grant usage, select on sequence public.tasks_id_seq to authenticated';
	end if;
end
$$;

drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own"
on public.tasks
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own"
on public.tasks
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own"
on public.tasks
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own"
on public.tasks
for delete
to authenticated
using (user_id = auth.uid());

create index if not exists tasks_user_id_idx on public.tasks (user_id);