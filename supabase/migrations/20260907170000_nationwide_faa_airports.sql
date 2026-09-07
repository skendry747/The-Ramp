create extension if not exists pg_trgm with schema extensions;

alter table public.airports
  add column if not exists faa_site_no text,
  add column if not exists faa_lid text,
  add column if not exists icao_id text,
  add column if not exists country_code text,
  add column if not exists facility_type_code text,
  add column if not exists facility_use_code text,
  add column if not exists ownership_type_code text,
  add column if not exists operational_status_code text,
  add column if not exists tower_type_code text,
  add column if not exists source_effective_date date;

alter table public.airports
  alter column latitude type numeric(10, 7) using latitude::numeric(10, 7),
  alter column longitude type numeric(11, 7) using longitude::numeric(11, 7);

-- FAA documents SITE_NO as unique, but the 2026-09-03 APT_BASE file contains
-- one SITE_NO shared by an airport and a heliport. The documented APT_BASE
-- ordering key (SITE_NO, SITE_TYPE_CODE) is therefore the safe import key.
alter table public.airports
  add constraint airports_faa_site_type_unique unique (faa_site_no, facility_type_code),
  add constraint airports_faa_lid_unique unique (faa_lid),
  add constraint airports_icao_id_unique unique (icao_id);

create index airports_active_faa_lid_prefix_idx
on public.airports (upper(faa_lid) text_pattern_ops)
where is_active and faa_lid is not null;

create index airports_active_icao_id_prefix_idx
on public.airports (upper(icao_id) text_pattern_ops)
where is_active and icao_id is not null;

create index airports_active_identifier_prefix_idx
on public.airports (upper(identifier) text_pattern_ops)
where is_active;

create index airports_active_name_trgm_idx
on public.airports using gin (lower(name) gin_trgm_ops)
where is_active;

create index airports_active_city_trgm_idx
on public.airports using gin (lower(city) gin_trgm_ops)
where is_active and city is not null;

create index airports_active_state_idx
on public.airports (upper(state))
where is_active and state is not null;

create or replace function public.search_airports(
  search_text text,
  result_limit integer default 20
)
returns table (
  id uuid,
  identifier text,
  faa_lid text,
  icao_id text,
  name text,
  city text,
  state text,
  country_code text,
  facility_type_code text,
  facility_use_code text,
  operational_status_code text,
  tower_type_code text,
  is_active boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  with input as (
    select
      lower(trim(coalesce(search_text, ''))) as lower_query,
      upper(trim(coalesce(search_text, ''))) as upper_query
  )
  select
    airport.id,
    airport.identifier,
    airport.faa_lid,
    airport.icao_id,
    airport.name,
    airport.city,
    airport.state,
    airport.country_code,
    airport.facility_type_code,
    airport.facility_use_code,
    airport.operational_status_code,
    airport.tower_type_code,
    airport.is_active
  from public.airports as airport
  cross join input
  where airport.is_active
    and length(input.lower_query) > 0
    and (
      upper(airport.faa_lid) like input.upper_query || '%'
      or upper(airport.icao_id) like input.upper_query || '%'
      or upper(airport.identifier) like input.upper_query || '%'
      or lower(airport.name) like '%' || input.lower_query || '%'
      or lower(airport.city) like '%' || input.lower_query || '%'
      or upper(airport.state) = input.upper_query
    )
  order by
    case
      when upper(airport.faa_lid) = input.upper_query then 0
      when upper(airport.icao_id) = input.upper_query then 0
      when upper(airport.identifier) = input.upper_query then 0
      when upper(airport.faa_lid) like input.upper_query || '%' then 1
      when upper(airport.icao_id) like input.upper_query || '%' then 1
      when upper(airport.identifier) like input.upper_query || '%' then 1
      when lower(airport.name) = input.lower_query then 2
      when lower(airport.name) like input.lower_query || '%' then 3
      when lower(airport.city) = input.lower_query then 4
      when lower(airport.city) like input.lower_query || '%' then 5
      when upper(airport.state) = input.upper_query then 6
      else 7
    end,
    case when airport.facility_type_code = 'A' then 0 else 1 end,
    case when airport.facility_use_code = 'PU' then 0 else 1 end,
    airport.faa_lid,
    airport.name
  limit greatest(1, least(coalesce(result_limit, 20), 25));
$$;

-- Called only after every row in a cycle has been upserted successfully. Rows
-- missing from the new cycle remain available for historical references, but
-- no longer appear in new-airport search results.
create or replace function public.finish_faa_airport_import(p_effective_date date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected integer;
begin
  if p_effective_date is null then
    raise exception 'FAA effective date is required';
  end if;

  update public.airports
  set is_active = false
  where faa_site_no is not null
    and source_effective_date is distinct from p_effective_date
    and is_active;

  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.finish_faa_airport_import(date) from public;
revoke all on function public.finish_faa_airport_import(date) from anon, authenticated;
grant execute on function public.finish_faa_airport_import(date) to service_role;

grant execute on function public.search_airports(text, integer) to anon, authenticated;
grant select on public.airports to anon, authenticated;

drop policy if exists "Public can read active airports" on public.airports;
drop policy if exists "Public can read airport reference data" on public.airports;
create policy "Public can read airport reference data"
on public.airports for select
to public
using (true);

comment on column public.airports.faa_site_no is 'FAA NASR landing facility SITE_NO; paired with facility_type_code for import uniqueness.';
comment on column public.airports.faa_lid is 'FAA NASR ARPT_ID location identifier.';
comment on column public.airports.source_effective_date is 'Most recent FAA 28-Day NASR cycle in which this facility appeared.';
comment on function public.search_airports(text, integer) is 'Searches active FAA facilities without exposing the full airports table to a browser.';
