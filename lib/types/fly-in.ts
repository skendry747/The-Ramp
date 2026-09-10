export type FlyInCategory = "Social" | "Breakfast" | "Scenic" | "Community";

export type AttendeeProfile = {
  id: string;
  displayName: string;
  homeAirport: string | null;
  aircraft: string | null;
  avatarPath: string | null;
};

export type FlyIn = {
  id: string;
  title: string;
  airport: string;
  date: string;
  time: string;
  distance: string;
  tags: string[];
  category: FlyInCategory;
  host: string;
  hostAvatarPath?: string | null;
  description: string;
  attendees: number;
  attendeeNames: string[];
  attendeeProfiles?: AttendeeProfile[];
  color: "blue" | "orange";
  position: { left: string; top: string };
  airportId?: string;
  hostId?: string;
  timezone?: string;
  visibility?: "public" | "unlisted";
  status?: "scheduled" | "cancelled" | "completed";
};
