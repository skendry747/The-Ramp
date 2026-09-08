import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { AttendeeProfile } from "@/lib/types/fly-in";

type FlyInIdentity = { id: string; hostId: string };
type AttendanceSummary = { count: number; names: string[]; profiles: AttendeeProfile[] };

export async function getAttendanceForFlyIns(flyIns: FlyInIdentity[]) {
  const summaries = new Map<string, AttendanceSummary>();
  flyIns.forEach(({ id }) => summaries.set(id, { count: 0, names: [], profiles: [] }));
  if (!flyIns.length) return summaries;

  const supabase = await createClient();
  const ids = flyIns.map(({ id }) => id);
  const hostByFlyIn = new Map(flyIns.map(({ id, hostId }) => [id, hostId]));
  const { data: rows, error } = await supabase.from("fly_in_attendees")
    .select("fly_in_id,profile_id,joined_at").in("fly_in_id", ids).order("joined_at");
  if (error) throw new Error("Attendance could not be loaded.");

  const attendeeRows = (rows ?? []).filter((row) => row.profile_id !== hostByFlyIn.get(row.fly_in_id));
  const profileIds = [...new Set(attendeeRows.map((row) => row.profile_id))];
  if (!profileIds.length) return summaries;

  const { data: profiles, error: profileError } = await supabase.from("profiles")
    .select("id,display_name,home_airport_id,aircraft,avatar_path").in("id", profileIds);
  if (profileError) throw new Error("Attendee profiles could not be loaded.");
  const homeAirportIds = [...new Set((profiles ?? []).map((profile) => profile.home_airport_id).filter((id): id is string => Boolean(id)))];
  const { data: airports } = homeAirportIds.length
    ? await supabase.from("airports").select("id,identifier,city,state").in("id", homeAirportIds)
    : { data: [] };
  const airportMap = new Map((airports ?? []).map((airport) => [airport.id, `${airport.identifier} · ${[airport.city, airport.state].filter(Boolean).join(", ")}`]));
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, {
    id: profile.id,
    displayName: profile.display_name,
    homeAirport: profile.home_airport_id ? airportMap.get(profile.home_airport_id) ?? null : null,
    aircraft: profile.aircraft,
    avatarPath: profile.avatar_path,
  } satisfies AttendeeProfile]));

  for (const row of attendeeRows) {
    const summary = summaries.get(row.fly_in_id);
    if (!summary) continue;
    summary.count += 1;
    const profile = profileMap.get(row.profile_id);
    if (profile) {
      summary.profiles.push(profile);
      summary.names.push(profile.displayName);
    }
  }
  return summaries;
}

export async function getCurrentUserAttendance(flyInId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("fly_in_attendees").select("fly_in_id")
    .eq("fly_in_id", flyInId).eq("profile_id", userId).maybeSingle();
  if (error) throw new Error("Attendance status could not be loaded.");
  return Boolean(data);
}

export async function joinFlyInAs(flyInId: string, userId: string) {
  const supabase = await createClient();
  return supabase.from("fly_in_attendees").insert({ fly_in_id: flyInId, profile_id: userId });
}

export async function leaveFlyInAs(flyInId: string, userId: string) {
  const supabase = await createClient();
  return supabase.from("fly_in_attendees").delete().eq("fly_in_id", flyInId).eq("profile_id", userId);
}
