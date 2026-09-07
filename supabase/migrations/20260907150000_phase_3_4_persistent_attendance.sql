-- Phase 3.4: keep attendance public for link-addressable event briefs while
-- enforcing verified, self-only, scheduled-event mutations at the RLS boundary.

create or replace function public.current_user_email_is_verified()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users
    where id = auth.uid()
      and email_confirmed_at is not null
  );
$$;

revoke all on function public.current_user_email_is_verified() from public;
grant execute on function public.current_user_email_is_verified() to authenticated;

drop policy if exists "Permitted fly-in viewers can read attendees" on public.fly_in_attendees;
create policy "Permitted fly-in viewers can read attendees"
on public.fly_in_attendees for select
to public
using (
  exists (
    select 1
    from public.fly_ins
    where fly_ins.id = fly_in_attendees.fly_in_id
      and fly_ins.visibility in ('public', 'unlisted')
      and fly_ins.status in ('scheduled', 'cancelled', 'completed')
  )
);

drop policy if exists "Users can join scheduled fly-ins as themselves" on public.fly_in_attendees;
create policy "Verified users can join scheduled fly-ins as themselves"
on public.fly_in_attendees for insert
to authenticated
with check (
  profile_id = auth.uid()
  and public.current_user_email_is_verified()
  and exists (
    select 1
    from public.fly_ins
    where fly_ins.id = fly_in_attendees.fly_in_id
      and fly_ins.status = 'scheduled'
      and fly_ins.host_id <> auth.uid()
  )
);

drop policy if exists "Users can leave their own fly-in attendance" on public.fly_in_attendees;
create policy "Verified users can leave their own scheduled attendance"
on public.fly_in_attendees for delete
to authenticated
using (
  profile_id = auth.uid()
  and public.current_user_email_is_verified()
  and exists (
    select 1
    from public.fly_ins
    where fly_ins.id = fly_in_attendees.fly_in_id
      and fly_ins.status = 'scheduled'
  )
);
