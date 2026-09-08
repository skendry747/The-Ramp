-- Optional pilot profile photos backed by a public-read, owner-write bucket.

alter table public.profiles
  add column if not exists avatar_path text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_avatar_path_in_owner_folder'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_avatar_path_in_owner_folder
      check (avatar_path is null or split_part(avatar_path, '/', 1) = id::text);
  end if;
end;
$$;

comment on column public.profiles.avatar_path is 'Storage object path in the profile-images bucket; never a full public URL.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-images',
  'profile-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read profile images" on storage.objects;
create policy "Public can read profile images"
on storage.objects for select
to public
using (bucket_id = 'profile-images');

drop policy if exists "Users can upload their own profile images" on storage.objects;
create policy "Users can upload their own profile images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
);

drop policy if exists "Users can replace their own profile images" on storage.objects;
create policy "Users can replace their own profile images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
)
with check (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
);

drop policy if exists "Users can delete their own profile images" on storage.objects;
create policy "Users can delete their own profile images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
