"use client";

import { FormEvent, useMemo, useState } from "react";

type FlyIn = {
  id: number;
  title: string;
  airport: string;
  date: string;
  month: string;
  day: string;
  time: string;
  distance: string;
  tags: string[];
  host: string;
  color: string;
  position: { left: string; top: string };
};

const initialFlyIns: FlyIn[] = [
  { id: 1, title: "Sunset Ramp Social", airport: "KDTO · Denton, TX", date: "Friday, Aug 21", month: "AUG", day: "21", time: "6:30 PM", distance: "18 mi", tags: ["Food trucks", "Open ramp"], host: "Mia Torres", color: "blue", position: { left: "42%", top: "44%" } },
  { id: 2, title: "Breakfast & Briefing", airport: "KGLE · Gainesville, TX", date: "Saturday, Aug 22", month: "AUG", day: "22", time: "8:00 AM", distance: "41 mi", tags: ["Pancake breakfast", "Hangar talk"], host: "North Texas Aviators", color: "orange", position: { left: "24%", top: "20%" } },
  { id: 3, title: "Lake Run Fly-In", airport: "KF35 · Granbury, TX", date: "Sunday, Aug 23", month: "AUG", day: "23", time: "10:30 AM", distance: "56 mi", tags: ["Scenic route", "All aircraft"], host: "Jamie Lee", color: "blue", position: { left: "56%", top: "76%" } },
  { id: 4, title: "First Saturday Coffee", airport: "KADS · Addison, TX", date: "Saturday, Sep 5", month: "SEP", day: "05", time: "9:00 AM", distance: "24 mi", tags: ["Coffee", "New pilots welcome"], host: "Addison Flyers", color: "orange", position: { left: "60%", top: "30%" } },
];

const navItems = ["Discover", "Create", "Profile"] as const;
type Screen = (typeof navItems)[number];

export default function Home() {
  const [screen, setScreen] = useState<Screen>("Discover");
  const [view, setView] = useState<"list" | "map">("list");
  const [flyIns, setFlyIns] = useState(initialFlyIns);
  const [selected, setSelected] = useState<FlyIn | null>(null);
  const [joined, setJoined] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([{ author: "Mia", text: "Heads up: west ramp is open after 6:00. See you there!", mine: false }]);
  const [profile, setProfile] = useState({ name: "Shane Kendry", home: "KADS · Addison", bio: "Weekend pilot, always up for a new route and a good ramp conversation.", aircraft: "Cessna 172 Skyhawk" });

  const upcoming = useMemo(() => flyIns.slice(0, 4), [flyIns]);

  function openFlyIn(flyIn: FlyIn) {
    setSelected(flyIn);
    setJoined(false);
    setMessages([{ author: "Mia", text: "Heads up: west ramp is open after 6:00. See you there!", mine: false }]);
  }

  function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;
    setMessages((current) => [...current, { author: "You", text: trimmed, mine: true }]);
    setMessage("");
  }

  function createFlyIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") || "New Fly-In");
    const airport = String(form.get("airport") || "KADS · Addison, TX");
    const next: FlyIn = { id: Date.now(), title, airport, date: "Saturday, Sep 12", month: "SEP", day: "12", time: String(form.get("time") || "10:00 AM"), distance: "New", tags: [String(form.get("theme") || "Community"), String(form.get("privacy") || "Public")], host: profile.name, color: "orange", position: { left: "72%", top: "59%" } };
    setFlyIns((current) => [next, ...current]);
    setScreen("Discover");
    setView("list");
    setSelected(next);
  }

  return (
    <main>
      <header className="topbar">
        <button className="brand" onClick={() => setScreen("Discover")} aria-label="The Ramp home"><span className="brand-mark">↗</span>THE RAMP</button>
        <nav aria-label="Main navigation">{navItems.map((item) => <button key={item} className={screen === item ? "active" : ""} onClick={() => setScreen(item)}>{item === "Create" ? "+ Create" : item}</button>)}</nav>
        <button className="avatar-button" onClick={() => setScreen("Profile")} aria-label="Open profile">SK</button>
      </header>

      <section className="notice"><span>DEMO MODE</span> This is a local product prototype. Events, people, messages, and availability are sample data only.</section>

      {screen === "Discover" && <Discover flyIns={upcoming} view={view} setView={setView} openFlyIn={openFlyIn} />}
      {screen === "Create" && <CreateFlyIn onCreate={createFlyIn} />}
      {screen === "Profile" && <Profile profile={profile} setProfile={setProfile} />}

      {selected && <FlyInDetail flyIn={selected} joined={joined} setJoined={setJoined} messages={messages} message={message} setMessage={setMessage} submitMessage={submitMessage} onClose={() => setSelected(null)} />}
      <footer><strong>THE RAMP</strong><span>Built for the people who make aviation feel smaller.</span><a href="https://madethis.com" target="_blank" rel="noreferrer">Built with MadeThis </a></footer>
    </main>
  );
}

function Discover({ flyIns, view, setView, openFlyIn }: { flyIns: FlyIn[]; view: "list" | "map"; setView: (view: "list" | "map") => void; openFlyIn: (flyIn: FlyIn) => void }) {
  return <section className="page-shell">
    <div className="hero"><p className="eyebrow">LOCAL AVIATION, MADE EASY</p><h1>Find your next<br /><em>fly-in.</em></h1><p>Meet pilots, swap stories, and put more great days on the calendar.</p></div>
    <div className="discover-toolbar"><div><h2>Upcoming near Dallas–Fort Worth</h2><p>Four sample fly-ins within a short flight.</p></div><div className="view-switch"><button className={view === "list" ? "selected" : ""} onClick={() => setView("list")}>☷ List</button><button className={view === "map" ? "selected" : ""} onClick={() => setView("map")}>⌖ Map</button></div></div>
    {view === "list" ? <div className="flyin-grid">{flyIns.map((flyIn) => <FlyInCard key={flyIn.id} flyIn={flyIn} openFlyIn={openFlyIn} />)}</div> : <MapView flyIns={flyIns} openFlyIn={openFlyIn} />}
  </section>;
}

function FlyInCard({ flyIn, openFlyIn }: { flyIn: FlyIn; openFlyIn: (flyIn: FlyIn) => void }) {
  return <article className="flyin-card"><div className={`date-tile ${flyIn.color}`}><small>{flyIn.month}</small><b>{flyIn.day}</b></div><div className="card-body"><p className="eyebrow">{flyIn.distance} · {flyIn.time}</p><h3>{flyIn.title}</h3><p className="airport">⌖ {flyIn.airport}</p><div className="tag-row">{flyIn.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div><button className="arrow-button" onClick={() => openFlyIn(flyIn)} aria-label={`View ${flyIn.title}`}>↗</button></article>;
}

function MapView({ flyIns, openFlyIn }: { flyIns: FlyIn[]; openFlyIn: (flyIn: FlyIn) => void }) {
  return <div className="map-panel"><div className="map-grid" /><div className="map-route route-one" /><div className="map-route route-two" /><div className="map-city city-one">DENTON</div><div className="map-city city-two">DALLAS</div><div className="map-city city-three">FORT WORTH</div>{flyIns.map((flyIn) => <button key={flyIn.id} className={`map-pin ${flyIn.color}`} style={flyIn.position} onClick={() => openFlyIn(flyIn)}><span>✦</span><b>{flyIn.title}</b></button>)}<p className="map-disclaimer">Illustrative map only — not for navigation or flight planning.</p></div>;
}

function FlyInDetail({ flyIn, joined, setJoined, messages, message, setMessage, submitMessage, onClose }: { flyIn: FlyIn; joined: boolean; setJoined: (value: boolean) => void; messages: { author: string; text: string; mine: boolean }[]; message: string; setMessage: (value: string) => void; submitMessage: (event: FormEvent<HTMLFormElement>) => void; onClose: () => void }) {
  return <div className="modal-backdrop" role="presentation"><section className="detail-panel" role="dialog" aria-modal="true" aria-labelledby="flyin-title"><button className="close" onClick={onClose}>×</button><div className="detail-hero"><p className="eyebrow">{flyIn.date} · {flyIn.time}</p><h2 id="flyin-title">{flyIn.title}</h2><p>⌖ {flyIn.airport}</p><div className="tag-row">{flyIn.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div><div className="detail-content"><div><h3>Ramp briefing</h3><p>Come as you are. Park, say hello, and settle in for an easygoing evening around the airplanes. Hosted by <b>{flyIn.host}</b>.</p><div className="host"><div className="host-avatar">MT</div><div><b>{flyIn.host}</b><small>Fly-in host · Demo profile</small></div></div><button className={joined ? "join joined" : "join"} onClick={() => setJoined(!joined)}>{joined ? "✓ You’re on the list" : "Join this fly-in"}</button><p className="demo-caption">Joining is a local demo state and does not reserve a spot or send notifications.</p></div><div className="chat"><div><p className="eyebrow">DEMO GROUP CHAT</p><h3>Flight line</h3></div><div className="messages">{messages.map((entry, index) => <div className={entry.mine ? "message mine" : "message"} key={`${entry.author}-${index}`}><b>{entry.author}</b><p>{entry.text}</p></div>)}</div><form onSubmit={submitMessage}><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Say something to the group" aria-label="Chat message" /><button>Send</button></form><p className="demo-caption">Messages stay in this browser session only.</p></div></div></section></div>;
}

function CreateFlyIn({ onCreate }: { onCreate: (event: FormEvent<HTMLFormElement>) => void }) {
  return <section className="page-shell create-page"><div className="hero compact"><p className="eyebrow">HOST A GREAT DAY</p><h1>Start a <em>fly-in.</em></h1><p>Keep the details simple. Your people will bring the rest.</p></div><form className="create-form" onSubmit={onCreate}><label>Fly-in name<input name="title" required placeholder="e.g. Sunset Hangar Social" /></label><label>Airport<input name="airport" required placeholder="e.g. KADS · Addison, TX" /></label><div className="form-row"><label>Date<input name="date" type="date" defaultValue="2026-09-12" required /></label><label>Start time<input name="time" type="time" defaultValue="10:00" required /></label></div><label>What’s the feel?<select name="theme" defaultValue="Coffee & conversation"><option>Coffee & conversation</option><option>Breakfast</option><option>Scenic flight</option><option>Hangar talk</option></select></label><label>Visibility<select name="privacy" defaultValue="Public"><option>Public</option><option>Invite only</option></select></label><label>Briefing notes<textarea name="notes" placeholder="What should pilots know before they arrive?" /></label><button className="primary" type="submit">Publish demo fly-in ↗</button><p className="demo-caption">This creates a temporary demo card locally. Nothing is published or shared.</p></form></section>;
}

function Profile({ profile, setProfile }: { profile: { name: string; home: string; bio: string; aircraft: string }; setProfile: (profile: { name: string; home: string; bio: string; aircraft: string }) => void }) {
  return <section className="page-shell profile-page"><div className="profile-card"><div className="profile-banner"><span>THE RAMP</span></div><div className="profile-content"><div className="profile-avatar">SK</div><p className="eyebrow">DEMO PILOT PROFILE</p><h1>{profile.name}</h1><p className="home-airport">⌖ {profile.home}</p><div className="profile-stats"><div><b>12</b><span>Fly-ins</span></div><div><b>6</b><span>Routes saved</span></div><div><b>4</b><span>Pilot friends</span></div></div><label>Name<input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /></label><label>Home airport<input value={profile.home} onChange={(event) => setProfile({ ...profile, home: event.target.value })} /></label><label>Aircraft<input value={profile.aircraft} onChange={(event) => setProfile({ ...profile, aircraft: event.target.value })} /></label><label>About<textarea value={profile.bio} onChange={(event) => setProfile({ ...profile, bio: event.target.value })} /></label><p className="demo-caption">Edits are for this demo only and reset when the page reloads.</p></div></div></section>;
}
