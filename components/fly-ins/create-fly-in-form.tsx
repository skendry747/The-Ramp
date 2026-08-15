"use client";

import { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useDemo } from "@/components/ui/demo-provider";
import type { FlyInCategory } from "@/lib/types/fly-in";

export function CreateFlyInForm() {
  const { createFlyIn, profile } = useDemo();
  const router = useRouter();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title"));
    const id = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now()}`;
    createFlyIn({ id, title, airport: String(form.get("airport")), date: String(form.get("date")), time: String(form.get("time")), category: String(form.get("category")) as FlyInCategory, tags: [String(form.get("category")), String(form.get("visibility"))], description: String(form.get("notes")), host: profile.name, attendees: 1, attendeeNames: [profile.name], distance: "New", color: "orange", position: { left: "72%", top: "59%" } });
    router.push(`/fly-ins/${id}`);
  }
  return <form className="create-form" onSubmit={submit}><div className="form-section"><p className="eyebrow">THE PLAN</p><label>Fly-in name<input name="title" required placeholder="e.g. Sunset Hangar Social" /></label><label>Airport<span className="field-hint">ICAO code and city keeps the destination clear.</span><input name="airport" required placeholder="e.g. KADS · Addison, TX" /></label></div><div className="form-section"><p className="eyebrow">THE TIMING</p><div className="form-row"><label>Date<input name="date" type="date" defaultValue="2026-09-12" required /></label><label>Start time<input name="time" type="time" defaultValue="10:00" required /></label></div></div><div className="form-section"><p className="eyebrow">THE INVITE</p><div className="form-row"><label>Event type<select name="category" defaultValue="Social"><option>Social</option><option>Breakfast</option><option>Scenic</option><option>Community</option></select></label><label>Visibility<select name="visibility" defaultValue="Public"><option>Public</option><option>Invite only</option></select></label></div><label>Briefing notes<span className="field-hint">Include the plan, arrival details, or anything pilots should know.</span><textarea name="notes" required placeholder="What should pilots know before they arrive?" /></label></div><button className="primary" type="submit">Create demo fly-in <span aria-hidden="true">↗</span></button><p className="demo-caption">This is browser-only demo data. It will not publish, reserve a spot, or send notifications.</p></form>;
}
