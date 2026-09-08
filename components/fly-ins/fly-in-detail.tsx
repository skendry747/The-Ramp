"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useDemo, useDemoChat } from "@/components/ui/demo-provider";
import { formatDate, formatTime } from "@/lib/format";
import { AttendeeStack } from "@/components/ui/attendee-stack";
import { AttendanceControl } from "@/components/fly-ins/attendance-control";
import { CancelFlyInButton } from "@/components/fly-ins/cancel-fly-in-button";
import { PilotAvatar } from "@/components/ui/pilot-avatar";
import type { FlyIn } from "@/lib/types/fly-in";

type FlyInDetailProps = {
  flyIn: FlyIn;
  isHost: boolean;
  currentUserId: string | null;
  isAuthenticated: boolean;
  isVerified: boolean;
  isAttending: boolean;
};

export function FlyInDetail({ flyIn, isHost, currentUserId, isAuthenticated, isVerified, isAttending }: FlyInDetailProps) {
  const { addMessage } = useDemo();
  const messages = useDemoChat(flyIn.id);
  const [message, setMessage] = useState("");
  const active = flyIn.status === "scheduled";
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const trimmed = message.trim(); if (!trimmed || !active) return; addMessage(flyIn.id, trimmed); setMessage(""); }
  const attendeeProfiles = flyIn.attendeeProfiles ?? [];
  const hiddenAttendeeCount = Math.max(0, flyIn.attendees - attendeeProfiles.length);

  return <section className={`page-shell detail-page ${!active ? "event-inactive" : ""}`}><Link className="back-link" href="/discover">← Back to Discover</Link>
    {!active && <div className="status-banner" role="status"><b>{flyIn.status?.toUpperCase()}</b><span>This fly-in is no longer scheduled. Its event record remains available for reference.</span></div>}
    <header className="detail-hero"><div><p className="eyebrow">{flyIn.category} FLY-IN · {flyIn.visibility === "unlisted" ? "UNLISTED" : `${flyIn.distance} AWAY`}</p><h1>{flyIn.title}</h1><p className="detail-airport"><b>{flyIn.airport.split(" · ")[0]}</b><span>{flyIn.airport.split(" · ")[1]}</span></p></div><div className="detail-when"><span>WHEN</span><b>{formatDate(flyIn.date)}</b><p>{formatTime(flyIn.time)} · {flyIn.timezone?.replaceAll("_", " ")}</p></div><div className="tag-row">{flyIn.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></header>
    {isHost && <div className="host-controls"><span>You&apos;re hosting this fly-in.</span>{active && <><Link href={`/fly-ins/${flyIn.id}/edit`}>Edit</Link><CancelFlyInButton id={flyIn.id} /></>}</div>}
    <div className="detail-content"><div className="briefing"><p className="eyebrow">RAMP BRIEFING</p><h2>Make the connection.</h2><p>{flyIn.description}</p><dl className="event-logistics"><div><dt>Airport</dt><dd>{flyIn.airport}</dd></div><div><dt>Local time</dt><dd>{formatTime(flyIn.time)} · {flyIn.timezone}</dd></div><div><dt>Arrival</dt><dd>Check in with the host on the ramp</dd></div></dl><div className="host"><PilotAvatar name={flyIn.host} avatarPath={flyIn.hostAvatarPath} className="host-avatar" /><div><small>HOSTED BY · NOT INCLUDED IN ATTENDEE COUNT</small><b>{flyIn.host}</b><span>Ramp pilot profile</span></div></div></div>
      <aside className="event-action"><p className="eyebrow">FLIGHT CREW</p><AttendeeStack names={flyIn.attendeeNames} profiles={attendeeProfiles} total={flyIn.attendees} className="detail-attendees" />
        <div className="attendee-list">{attendeeProfiles.length ? attendeeProfiles.map((attendee) => <div className="attendee-row" key={attendee.id}><PilotAvatar name={attendee.displayName} avatarPath={attendee.avatarPath} className="mini-avatar" /><div><b>{attendee.displayName}</b><small>{[attendee.aircraft, attendee.homeAirport].filter(Boolean).join(" · ") || "Pilot profile"}</small></div>{attendee.id === currentUserId ? <em>You</em> : null}</div>) : <p className="attendee-empty">No pilots have joined yet.</p>}{hiddenAttendeeCount > 0 && <p className="attendee-private">+ {hiddenAttendeeCount} private {hiddenAttendeeCount === 1 ? "pilot" : "pilots"}</p>}</div>
        <AttendanceControl flyInId={flyIn.id} isActive={active} isAuthenticated={isAuthenticated} isVerified={isVerified} isHost={isHost} initialJoined={isAttending} />
      </aside>
      <section className="chat" aria-labelledby="chat-heading"><p className="eyebrow">TEMPORARY DEMO CHAT</p><h2 id="chat-heading">Flight line</h2><div className="messages" aria-live="polite">{messages.map((entry, index) => <div className={entry.mine ? "message mine" : "message"} key={`${entry.author}-${index}`}><b>{entry.author}</b><p>{entry.text}</p></div>)}</div><form onSubmit={submit}><label className="sr-only" htmlFor="chat-message">Message the group</label><input id="chat-message" value={message} disabled={!active} onChange={(event) => setMessage(event.target.value)} placeholder="Say something to the group" /><button disabled={!active}>Send</button></form><p className="demo-caption">Messages stay in this browser session only and are not part of the persistent event record.</p></section>
    </div>
  </section>;
}
