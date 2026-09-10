"use client";

import { useActionState } from "react";
import { createFlyIn, updateFlyIn, type FlyInFormState } from "@/app/fly-ins/actions";
import { AirportAutocomplete } from "@/components/airports/airport-autocomplete";
import type { AirportOption } from "@/lib/airports";
import type { FlyIn } from "@/lib/types/fly-in";

const timezones = [
  ["America/New_York", "Eastern"],
  ["America/Chicago", "Central"],
  ["America/Denver", "Mountain"],
  ["America/Phoenix", "Arizona"],
  ["America/Los_Angeles", "Pacific"],
  ["America/Anchorage", "Alaska"],
  ["Pacific/Honolulu", "Hawaii"],
] as const;

export function FlyInForm({ airport, flyIn }: { airport?: AirportOption | null; flyIn?: FlyIn }) {
  const action = flyIn ? updateFlyIn.bind(null, flyIn.id) : createFlyIn;
  const [state, formAction, pending] = useActionState<FlyInFormState, FormData>(action, {});

  return <form className="create-form" action={formAction}>
    <div className="form-section"><p className="eyebrow">THE PLAN</p>
      <label>Fly-in name<input name="title" required maxLength={120} defaultValue={flyIn?.title} placeholder="e.g. Sunset Hangar Social" /></label>
      <label htmlFor="fly-in-airport">Airport<span className="field-hint">Search active FAA facilities by FAA or ICAO identifier, name, city, or state.</span></label>
      <AirportAutocomplete inputId="fly-in-airport" name="airportId" initialAirport={airport} required />
    </div>
    <div className="form-section"><p className="eyebrow">THE TIMING</p><div className="form-row">
      <label>Date<input name="date" type="date" defaultValue={flyIn?.date} required /></label>
      <label>Start time<input name="time" type="time" defaultValue={flyIn?.time ?? "10:00"} required /></label>
    </div><label>Event timezone<span className="field-hint">Times are saved and displayed in this airport-local timezone.</span><select name="timezone" defaultValue={flyIn?.timezone ?? "America/Chicago"} required>{timezones.map(([value, label]) => <option key={value} value={value}>{label} — {value}</option>)}</select></label></div>
    <div className="form-section"><p className="eyebrow">THE INVITE</p><div className="form-row">
      <label>Event type<select name="category" defaultValue={flyIn?.category ?? "Social"}><option>Social</option><option>Breakfast</option><option>Scenic</option><option>Community</option></select></label>
      <label>Visibility<select name="visibility" defaultValue={flyIn?.visibility ?? "public"}><option value="public">Public</option><option value="unlisted">Unlisted — link only</option></select></label>
    </div><label>Briefing notes<span className="field-hint">Include the plan, arrival details, or anything pilots should know.</span><textarea name="briefing" required maxLength={4000} defaultValue={flyIn?.description} placeholder="What should pilots know before they arrive?" /></label></div>
    {state.error && <p className="form-error" role="alert">{state.error}</p>}
    <button className="primary" type="submit" disabled={pending}>{pending ? "Saving…" : flyIn ? "Save fly-in" : "Create fly-in"} <span aria-hidden="true">↗</span></button>
  </form>;
}
