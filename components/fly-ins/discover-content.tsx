"use client";

import { useState } from "react";
import { FlyInCard } from "@/components/fly-ins/fly-in-card";
import { MapView } from "@/components/fly-ins/map-view";
import type { FlyIn, FlyInCategory } from "@/lib/types/fly-in";

const filters: Array<"All" | FlyInCategory> = ["All", "Social", "Breakfast", "Scenic", "Community"];

export function DiscoverContent({ flyIns, loadError = false }: { flyIns: FlyIn[]; loadError?: boolean }) {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [view, setView] = useState<"list" | "map">("list");
  const displayed = filter === "All" ? flyIns : flyIns.filter((flyIn) => flyIn.category === filter);
  return <section className="page-shell discover-page"><div className="page-intro"><p className="eyebrow">DISCOVER THE RAMP</p><h1>Find a reason<br />to <em>fly.</em></h1><p>Browse nearby fly-ins, see the pilots already on the list, and put the next great airport day on your calendar.</p></div><div className="discover-toolbar"><div><p className="eyebrow">NORTH TEXAS · SEEDED AIRPORTS</p><h2>What&apos;s happening on the ramp</h2><p>{displayed.length} public fly-ins in view. Event details are live; the map remains illustrative.</p></div><div className="view-switch" aria-label="Choose discover view"><button className={view === "list" ? "selected" : ""} onClick={() => setView("list")} aria-pressed={view === "list"}>☷ List</button><button className={view === "map" ? "selected" : ""} onClick={() => setView("map")} aria-pressed={view === "map"}>⌖ Map</button></div></div><div className="filter-row" aria-label="Fly-in category filters"><span>Filter by:</span>{filters.map((item) => <button key={item} className={filter === item ? "selected" : ""} onClick={() => setFilter(item)} aria-pressed={filter === item}>{item}</button>)}</div>{loadError ? <div className="inline-empty"><h3>The ramp report is temporarily unavailable.</h3><p>We could not load fly-ins right now. Please try again shortly.</p></div> : displayed.length === 0 ? <div className="inline-empty"><h3>No fly-ins match this view yet.</h3><p>Try another category, or create the next reason for pilots to gather.</p></div> : view === "list" ? <div className="flyin-grid">{displayed.map((flyIn, index) => <FlyInCard key={flyIn.id} flyIn={flyIn} featured={index === 0} />)}</div> : <MapView flyIns={displayed} />}</section>;
}
