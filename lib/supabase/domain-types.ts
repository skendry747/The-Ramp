export type FlyInCategory = "Social" | "Breakfast" | "Scenic" | "Community";
export type FlyInVisibility = "public" | "unlisted";
export type FlyInStatus = "scheduled" | "cancelled" | "completed";
export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";

export type AirportRecord = {
  id: string;
  identifier: string;
  identifier_type: string | null;
  faa_site_no: string | null;
  faa_lid: string | null;
  icao_id: string | null;
  name: string;
  city: string | null;
  state: string | null;
  country_code: string | null;
  facility_type_code: string | null;
  facility_use_code: string | null;
  ownership_type_code: string | null;
  operational_status_code: string | null;
  tower_type_code: string | null;
  source_effective_date: string | null;
  is_active: boolean;
  latitude: number | null;
  longitude: number | null;
};

export type ProfileRecord = {
  id: string;
  display_name: string;
  home_airport_id: string | null;
  aircraft: string | null;
  bio: string | null;
  avatar_path: string | null;
  is_public: boolean;
};

export type FlyInRecord = {
  id: string;
  host_id: string;
  airport_id: string;
  title: string;
  starts_at: string;
  timezone: string;
  category: FlyInCategory;
  visibility: FlyInVisibility;
  status: FlyInStatus;
  briefing: string | null;
};
