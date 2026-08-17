"use client";

import { useActionState } from "react";
import { createFlyIn, updateFlyIn, type FlyInFormState } from "@/app/fly-ins/actions";
import type { AirportOption } from "@/lib/fly-ins/data";
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

export function FlyInForm({ airports, flyIn }: { airports: AirportOption[]; flyIn?: FlyIn }) {
  const action = flyIn ? updateFlyIn.bind(null, flyIn.id) : createFlyIn;
  const [state, formAction, pending] = useActionState<FlyInFormState, FormData>(action, {});
  const unavailable = airports.length === 0;

  return <form className="create-form" action={formAction}>
    <div className="form-section"><p className="eyebrow">THE PLAN</p>
      <label>Fly-in name<input name="title" required maxLength={120} defaultValue={flyIn?.title} placeholder="e.g. Sunset Hangar Social" /></label>
      <label>Airport<span className="field-hint">Choose a seeded airport by identifier, name, and location.</span>
        <select name="airportId" required defaultValue={flyIn?.airportId ?? ""}><option value="" disabled>Select an airport</option>{airports.map((airport) => <option key={airport.id} value={airport.id}>{airport.identifier} — {airport.name} — {[airport.city, airport.state].filter(Boolean).join(", ")}</option>)}</select>
      </label>
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
    <button className="primary" type="submit" disabled={pending || unavailable}>{pending ? "Saving…" : flyIn ? "Save fly-in" : "Create fly-in"} <span aria-hidden="true">↗</span></button>
    {unavailable && <p className="form-error" role="alert">Airport choices are temporarily unavailable. Try again shortly.</p>}
    <p className="demo-caption">Fly-in details publish to The Ramp. Attendance and chat remain temporary demo features for now.</p>
  </form>;
}
