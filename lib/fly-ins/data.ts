import "server-only";

import { createClient } from "@/lib/supabase/server";
import { eventDateTime } from "@/lib/fly-ins/time";
import type { AirportRecord, FlyInRecord, ProfileRecord } from "@/lib/supabase/domain-types";
import type { FlyIn } from "@/lib/types/fly-in";

export type AirportOption = Pick<AirportRecord, "id" | "identifier" | "name" | "city" | "state">;
export type FlyInLoadResult = { data: FlyIn[]; error: boolean };

const flyInFields = "id,host_id,airport_id,title,starts_at,timezone,category,visibility,status,briefing";

function mapFlyIn(record: FlyInRecord, airport?: AirportOption, host?: Pick<ProfileRecord, "id" | "display_name">): FlyIn {
  const local = eventDateTime(record.starts_at, record.timezone);
  const location = airport ? [airport.city, airport.state].filter(Boolean).join(", ") : "Airport details unavailable";
  const seed = [...record.id].reduce((total, character) => total + character.charCodeAt(0), 0);
  return {
    id: record.id,
    title: record.title,
    airport: airport ? `${airport.identifier} · ${location}` : "Airport unavailable",
    airportId: record.airport_id,
    date: local.date,
    time: local.time,
    timezone: record.timezone,
    distance: "Local",
    tags: [record.category, record.visibility === "unlisted" ? "Link-only" : "Open ramp"],
    category: record.category,
    visibility: record.visibility,
    status: record.status,
    hostId: record.host_id,
    host: host?.display_name ?? "Ramp pilot",
    description: record.briefing || "The host has not added briefing notes yet.",
    attendees: 0,
    attendeeNames: host?.display_name ? [host.display_name] : [],
    color: seed % 2 ? "orange" : "blue",
    position: { left: `${20 + (seed % 55)}%`, top: `${18 + ((seed * 7) % 62)}%` },
  };
}

async function hydrate(records: FlyInRecord[]) {
  if (!records.length) return [];
  const supabase = await createClient();
  const airportIds = [...new Set(records.map((item) => item.airport_id))];
  const hostIds = [...new Set(records.map((item) => item.host_id))];
  const [{ data: airports }, { data: hosts }] = await Promise.all([
    supabase.from("airports").select("id,identifier,name,city,state").in("id", airportIds),
    supabase.from("profiles").select("id,display_name").in("id", hostIds),
  ]);
  const airportMap = new Map((airports ?? []).map((item) => [item.id, item as AirportOption]));
  const hostMap = new Map((hosts ?? []).map((item) => [item.id, item as Pick<ProfileRecord, "id" | "display_name">]));
  return records.map((record) => mapFlyIn(record, airportMap.get(record.airport_id), hostMap.get(record.host_id)));
}

export async function getDiscoverableFlyIns(limit?: number): Promise<FlyInLoadResult> {
  const supabase = await createClient();
  let query = supabase.from("discoverable_fly_ins").select(flyInFields).gte("starts_at", new Date().toISOString()).order("starts_at");
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) return { data: [], error: true };
  return { data: await hydrate((data ?? []) as FlyInRecord[]), error: false };
}

export async function getFlyIn(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("fly_ins").select(flyInFields).eq("id", id).maybeSingle();
  if (error) throw new Error("The fly-in could not be loaded.");
  if (!data) return null;
  return (await hydrate([data as FlyInRecord]))[0] ?? null;
}

export async function getAirports(): Promise<AirportOption[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("airports").select("id,identifier,name,city,state").eq("is_active", true).order("identifier");
  return (data ?? []) as AirportOption[];
}
