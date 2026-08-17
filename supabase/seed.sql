-- Development-only airport seed. Replace with a vetted, versioned airport import before wider launch.
insert into public.airports (identifier, identifier_type, name, city, state, latitude, longitude)
values
  ('KADS', 'ICAO', 'Addison Airport', 'Addison', 'TX', 32.968600, -96.836400),
  ('KDTO', 'ICAO', 'Denton Enterprise Airport', 'Denton', 'TX', 33.200700, -97.197000),
  ('KGLE', 'ICAO', 'Gainesville Municipal Airport', 'Gainesville', 'TX', 33.651400, -97.196900),
  ('KF35', 'FAA', 'Granbury Regional Airport', 'Granbury', 'TX', 32.927800, -97.666900),
  ('KDFW', 'ICAO', 'Dallas Fort Worth International Airport', 'Dallas-Fort Worth', 'TX', 32.899800, -97.040300)
on conflict (identifier) do update
set
  identifier_type = excluded.identifier_type,
  name = excluded.name,
  city = excluded.city,
  state = excluded.state,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  is_active = true;
