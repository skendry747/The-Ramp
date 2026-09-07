"use client";

import { FormEvent, useState } from "react";
import { AirportAutocomplete } from "@/components/airports/airport-autocomplete";
import { airportCodeLabel, type AirportOption } from "@/lib/airports";
import { createClient } from "@/lib/supabase/client";
import type { ProfileRecord } from "@/lib/supabase/domain-types";

type ProfileEditorProps = {
  profile: ProfileRecord;
  initialHomeAirport: AirportOption | null;
};

export function ProfileEditor({ profile: initialProfile, initialHomeAirport }: ProfileEditorProps) {
  const [profile, setProfile] = useState(initialProfile);
  const [homeAirport, setHomeAirport] = useState(initialHomeAirport);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (!profile.display_name.trim()) {
      setMessage("Add a display name before saving your profile.");
      return;
    }

    setIsSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase.from("profiles").update({
      display_name: profile.display_name.trim(),
      home_airport_id: profile.home_airport_id,
      aircraft: profile.aircraft?.trim() || null,
      bio: profile.bio?.trim() || null,
    }).eq("id", profile.id).select("id, display_name, home_airport_id, aircraft, bio, avatar_path, is_public").single();

    if (error || !data) {
      setMessage("We could not save your profile. Check your connection and try again.");
    } else {
      setProfile(data as ProfileRecord);
      setMessage("Profile saved.");
    }
    setIsSaving(false);
  }

  return <section className="page-shell profile-page"><div className="profile-card"><div className="profile-banner"><span>THE RAMP</span><p>MEET. FLY. CONNECT.</p></div><div className="profile-content"><div className="profile-avatar" aria-hidden="true">{profile.display_name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</div><p className="eyebrow">PILOT PROFILE</p><h1>{profile.display_name}</h1><p className="home-airport">⌖ {homeAirport ? `${airportCodeLabel(homeAirport)} · ${homeAirport.city ?? homeAirport.name}` : "Home airport not set"}</p><p className="profile-aircraft">{profile.aircraft || "Aircraft not set"}</p><p className="profile-bio">{profile.bio || "Add a short bio so other pilots know who they’ll meet on the ramp."}</p><div className="activity-summary"><p className="eyebrow">YOUR PILOT PROFILE</p><b>Built for the next ramp day.</b><span>Hosted and joined fly-ins will appear here once persistent fly-ins arrive in Phase 3.3.</span></div><form className="profile-form" onSubmit={submit}><p className="eyebrow">EDIT PROFILE</p><label>Display name<input value={profile.display_name} onChange={(event) => setProfile({ ...profile, display_name: event.target.value })} required /></label><label htmlFor="home-airport">Home airport<span className="field-hint">Search active FAA facilities, including private-use airports and facilities without ICAO codes.</span></label><AirportAutocomplete inputId="home-airport" name="homeAirportId" initialAirport={initialHomeAirport} onSelectionChange={(airport) => { setHomeAirport(airport); setProfile({ ...profile, home_airport_id: airport?.id ?? null }); }} /><label>Aircraft<input value={profile.aircraft ?? ""} onChange={(event) => setProfile({ ...profile, aircraft: event.target.value })} placeholder="e.g. Cessna 172 Skyhawk" /></label><label>About<textarea value={profile.bio ?? ""} onChange={(event) => setProfile({ ...profile, bio: event.target.value })} placeholder="A short note about how you fly." /></label><button className="primary" type="submit" disabled={isSaving}>{isSaving ? "Saving profile…" : "Save profile"}</button>{message ? <p className="form-message" role="status">{message}</p> : null}</form></div></div></section>;
}
