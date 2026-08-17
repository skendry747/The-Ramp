create extension if not exists pgcrypto;

create table public.airports (
  id uuid primary key default gen_random_uuid(),
  identifier text not null unique,
  identifier_type text,
  name text not null,
  city text,
  state text,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint airports_identifier_not_blank check (length(trim(identifier)) > 0),
  constraint airports_name_not_blank check (length(trim(name)) > 0)
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  home_airport_id uuid references public.airports (id) on delete set null,
  aircraft text,
  bio text,
  avatar_path text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_not_blank check (length(trim(display_name)) > 0)
);

create table public.fly_ins (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles (id) on delete restrict,
  airport_id uuid not null references public.airports (id) on delete restrict,
  title text not null,
  starts_at timestamptz not null,
  timezone text not null,
  category text not null,
  visibility text not null default 'public',
  briefing text,
  status text not null default 'scheduled',
  cover_image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fly_ins_title_not_blank check (length(trim(title)) > 0),
  constraint fly_ins_timezone_not_blank check (length(trim(timezone)) > 0),
  constraint fly_ins_category_check check (category in ('Social', 'Breakfast', 'Scenic', 'Community')),
  constraint fly_ins_visibility_check check (visibility in ('public', 'unlisted')),
  constraint fly_ins_status_check check (status in ('scheduled', 'cancelled', 'completed'))
);

create table public.fly_in_attendees (
  fly_in_id uuid not null references public.fly_ins (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (fly_in_id, profile_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  fly_in_id uuid not null references public.fly_ins (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  constraint messages_body_not_blank check (length(trim(body)) > 0),
  constraint messages_body_length check (char_length(body) <= 4000)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete restrict,
  target_profile_id uuid references public.profiles (id) on delete set null,
  target_fly_in_id uuid references public.fly_ins (id) on delete set null,
  target_message_id uuid references public.messages (id) on delete set null,
  reason text not null,
  details text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reports_one_target check (num_nonnulls(target_profile_id, target_fly_in_id, target_message_id) = 1),
  constraint reports_reason_not_blank check (length(trim(reason)) > 0),
  constraint reports_status_check check (status in ('open', 'reviewing', 'resolved', 'dismissed'))
);

create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_distinct_users check (blocker_id <> blocked_id)
);

create index profiles_home_airport_id_idx on public.profiles (home_airport_id);
create index fly_ins_status_starts_at_idx on public.fly_ins (status, starts_at);
create index fly_ins_airport_id_idx on public.fly_ins (airport_id);
create index fly_ins_host_id_idx on public.fly_ins (host_id);
create index fly_in_attendees_profile_id_idx on public.fly_in_attendees (profile_id);
create index fly_in_attendees_fly_in_id_joined_at_idx on public.fly_in_attendees (fly_in_id, joined_at);
create index messages_fly_in_id_created_at_idx on public.messages (fly_in_id, created_at);
create index reports_status_created_at_idx on public.reports (status, created_at);
create index blocks_blocked_id_idx on public.blocks (blocked_id);

-- Discovery must query this view, never public.fly_ins directly. Unlisted events are
-- intentionally accessible by their UUID, but are excluded from normal browsing.
create view public.discoverable_fly_ins
with (security_invoker = true)
as
select *
from public.fly_ins
where visibility = 'public'
  and status = 'scheduled';

grant select on public.discoverable_fly_ins to anon, authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger airports_set_updated_at before update on public.airports
for each row execute function public.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger fly_ins_set_updated_at before update on public.fly_ins
for each row execute function public.set_updated_at();
create trigger reports_set_updated_at before update on public.reports
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Pilot'
    )
  );
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from public;
revoke execute on function public.handle_new_user() from public;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.airports enable row level security;
alter table public.profiles enable row level security;
alter table public.fly_ins enable row level security;
alter table public.fly_in_attendees enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;

create policy "Public can read active airports"
on public.airports for select
to public
using (is_active = true);

create policy "Public can read public profiles and users can read themselves"
on public.profiles for select
to public
using (is_public = true or auth.uid() = id);
create policy "Users can insert their matching profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);
create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Public can read scheduled fly-ins"
on public.fly_ins for select
to public
using (status = 'scheduled' and visibility in ('public', 'unlisted'));
create policy "Hosts can read their own non-public fly-ins"
on public.fly_ins for select
to authenticated
using (host_id = auth.uid());
create policy "Authenticated users can create their own fly-ins"
on public.fly_ins for insert
to authenticated
with check (host_id = auth.uid());
create policy "Hosts can update their own fly-ins"
on public.fly_ins for update
to authenticated
using (host_id = auth.uid())
with check (host_id = auth.uid());

create policy "Permitted fly-in viewers can read attendees"
on public.fly_in_attendees for select
to public
using (
  exists (
    select 1 from public.fly_ins
    where fly_ins.id = fly_in_attendees.fly_in_id
      and fly_ins.status = 'scheduled'
      and fly_ins.visibility in ('public', 'unlisted')
  )
);
create policy "Users can join scheduled fly-ins as themselves"
on public.fly_in_attendees for insert
to authenticated
with check (
  profile_id = auth.uid()
  and exists (
    select 1 from public.fly_ins
    where fly_ins.id = fly_in_attendees.fly_in_id
      and fly_ins.status = 'scheduled'
  )
);
create policy "Users can leave their own fly-in attendance"
on public.fly_in_attendees for delete
to authenticated
using (profile_id = auth.uid());

create policy "Hosts and attendees can read scheduled fly-in messages"
on public.messages for select
to authenticated
using (
  exists (
    select 1 from public.fly_ins
    where fly_ins.id = messages.fly_in_id
      and fly_ins.status = 'scheduled'
      and (
        fly_ins.host_id = auth.uid()
        or exists (
          select 1 from public.fly_in_attendees
          where fly_in_attendees.fly_in_id = fly_ins.id
            and fly_in_attendees.profile_id = auth.uid()
        )
      )
  )
);
create policy "Hosts and attendees can send scheduled fly-in messages"
on public.messages for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.fly_ins
    where fly_ins.id = messages.fly_in_id
      and fly_ins.status = 'scheduled'
      and (
        fly_ins.host_id = auth.uid()
        or exists (
          select 1 from public.fly_in_attendees
          where fly_in_attendees.fly_in_id = fly_ins.id
            and fly_in_attendees.profile_id = auth.uid()
        )
      )
  )
);
create policy "Senders can update their own active messages"
on public.messages for update
to authenticated
using (sender_id = auth.uid() and deleted_at is null)
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.fly_ins
    where fly_ins.id = messages.fly_in_id
      and fly_ins.status = 'scheduled'
      and (
        fly_ins.host_id = auth.uid()
        or exists (
          select 1 from public.fly_in_attendees
          where fly_in_attendees.fly_in_id = fly_ins.id
            and fly_in_attendees.profile_id = auth.uid()
        )
      )
  )
);

create policy "Users can read their own reports"
on public.reports for select
to authenticated
using (reporter_id = auth.uid());
create policy "Users can submit reports as themselves"
on public.reports for insert
to authenticated
with check (reporter_id = auth.uid());

create policy "Users can read their own blocks"
on public.blocks for select
to authenticated
using (blocker_id = auth.uid());
create policy "Users can create their own blocks"
on public.blocks for insert
to authenticated
with check (blocker_id = auth.uid());
create policy "Users can delete their own blocks"
on public.blocks for delete
to authenticated
using (blocker_id = auth.uid());
