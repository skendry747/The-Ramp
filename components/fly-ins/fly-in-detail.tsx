"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useDemo, useDemoChat } from "@/components/ui/demo-provider";
import { formatDate, formatTime } from "@/lib/format";
import { AttendeeStack } from "@/components/ui/attendee-stack";

export function FlyInDetail({ id }: { id: string }) {
  const { flyIns, joinedIds, toggleJoin, addMessage } = useDemo();
  const flyIn = flyIns.find((item) => item.id === id);
  const messages = useDemoChat(id);
  const [message, setMessage] = useState("");
  if (!flyIn) return <section className="page-shell empty-state"><p className="eyebrow">DEMO FLY-IN</p><h1>That fly-in has left the ramp.</h1><p>Created demo events last only for the active browser session.</p><Link className="primary-link" href="/discover">Explore fly-ins</Link></section>;
  const joined = joinedIds.has(id);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const trimmed = message.trim(); if (!trimmed) return; addMessage(id, trimmed); setMessage(""); }
  const attendance = flyIn.attendees + (joined ? 1 : 0);
  return <section className="page-shell detail-page"><Link className="back-link" href="/discover">← Back to Discover</Link><header className="detail-hero"><div><p className="eyebrow">{flyIn.category} FLY-IN · {flyIn.distance} AWAY</p><h1>{flyIn.title}</h1><p className="detail-airport"><b>{flyIn.airport.split(" · ")[0]}</b><span>{flyIn.airport.split(" · ")[1]}</span></p></div><div className="detail-when"><span>WHEN</span><b>{formatDate(flyIn.date)}</b><p>{formatTime(flyIn.time)} local</p></div><div className="tag-row">{flyIn.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></header><div className="detail-content"><div className="briefing"><p className="eyebrow">RAMP BRIEFING</p><h2>Make the connection.</h2><p>{flyIn.description}</p><dl className="event-logistics"><div><dt>Airport</dt><dd>{flyIn.airport}</dd></div><div><dt>Arrival</dt><dd>Check in with the host on the ramp</dd></div></dl><div className="host"><div className="host-avatar" aria-hidden="true">{flyIn.host.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div><div><small>HOSTED BY</small><b>{flyIn.host}</b><span>Demo pilot profile</span></div></div></div><aside className="event-action"><p className="eyebrow">FLIGHT CREW</p><AttendeeStack names={flyIn.attendeeNames} total={attendance} className="detail-attendees" /><button className={joined ? "join joined" : "join"} onClick={() => toggleJoin(id)} aria-pressed={joined}>{joined ? "✓ You’re on the list" : "Join this fly-in"}</button><p className="demo-caption">Local demo state only. Joining does not reserve a spot or notify the host.</p></aside><section className="chat" aria-labelledby="chat-heading"><p className="eyebrow">DEMO GROUP CHAT</p><h2 id="chat-heading">Flight line</h2><div className="messages" aria-live="polite">{messages.map((entry, index) => <div className={entry.mine ? "message mine" : "message"} key={`${entry.author}-${index}`}><b>{entry.author}</b><p>{entry.text}</p></div>)}</div><form onSubmit={submit}><label className="sr-only" htmlFor="chat-message">Message the group</label><input id="chat-message" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Say something to the group" /><button>Send</button></form><p className="demo-caption">Messages stay in this browser session only.</p></section></div></section>;
}
