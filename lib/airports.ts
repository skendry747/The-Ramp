import type { AirportRecord } from "@/lib/supabase/domain-types";

export type AirportOption = Pick<
  AirportRecord,
  | "id"
  | "identifier"
  | "faa_lid"
  | "icao_id"
  | "name"
  | "city"
  | "state"
  | "country_code"
  | "facility_type_code"
  | "facility_use_code"
  | "operational_status_code"
  | "tower_type_code"
  | "is_active"
>;

const facilityTypes: Record<string, string> = {
  A: "Airport",
  B: "Balloonport",
  C: "Seaplane base",
  G: "Gliderport",
  H: "Heliport",
  U: "Ultralight",
};

export function airportCodeLabel(airport: AirportOption) {
  const identifiers = [airport.faa_lid, airport.icao_id].filter(
    (identifier, index, values): identifier is string => Boolean(identifier) && values.indexOf(identifier) === index,
  );
  return identifiers.length ? identifiers.join(" / ") : airport.identifier;
}

export function airportFacilityType(airport: AirportOption) {
  return facilityTypes[airport.facility_type_code ?? ""] ?? "Landing facility";
}

export function airportUseLabel(airport: AirportOption) {
  if (!airport.is_active) return "Inactive";
  if (airport.facility_use_code === "PR") return "Private";
  if (airport.facility_use_code === "PU") return "Public";
  return "FAA listed";
}

export function airportInputValue(airport: AirportOption) {
  return `${airportCodeLabel(airport)} — ${airport.name}`;
}
