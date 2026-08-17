export type FlyInCategory = "Social" | "Breakfast" | "Scenic" | "Community";

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
  description: string;
  attendees: number;
  attendeeNames: string[];
  color: "blue" | "orange";
  position: { left: string; top: string };
  airportId?: string;
  hostId?: string;
  timezone?: string;
  visibility?: "public" | "unlisted";
  status?: "scheduled" | "cancelled" | "completed";
};

export type ChatMessage = { author: string; text: string; mine: boolean };
