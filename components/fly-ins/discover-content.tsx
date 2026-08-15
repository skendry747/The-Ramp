"use client";

import { useState } from "react";
import { FlyInCard } from "@/components/fly-ins/fly-in-card";
import { MapView } from "@/components/fly-ins/map-view";
import { useDemo } from "@/components/ui/demo-provider";
import type { FlyInCategory } from "@/lib/types/fly-in";

const filters: Array<"All" | FlyInCategory> = ["All", "Social", "Breakfast", "Scenic", "Community"];

export function DiscoverContent() {
  const { flyIns } = useDemo();
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [view, setView] = useState<"list" | "map">("list");
  const displayed = filter === "All" ? flyIns : flyIns.filter((flyIn) => flyIn.category === filter);
  return <section className="page-shell discover-page"><div className="page-intro"><p className="eyebrow">DISCOVER THE RAMP</p><h1>Find a reason<br />to <em>fly.</em></h1><p>Browse nearby fly-ins, see the pilots already on the list, and put the next great airport day on your calendar.</p></div><div className="discover-toolbar"><div><p className="eyebrow">NORTH TEXAS · DEMO AREA</p><h2>What&apos;s happening on the ramp</h2><p>{displayed.length} fly-ins in view. All event and map data is illustrative for this browser-only demo.</p></div><div className="view-switch" aria-label="Choose discover view"><button className={view === "list" ? "selected" : ""} onClick={() => setView("list")} aria-pressed={view === "list"}>☷ List</button><button className={view === "map" ? "selected" : ""} onClick={() => setView("map")} aria-pressed={view === "map"}>⌖ Map</button></div></div><div className="filter-row" aria-label="Fly-in category filters"><span>Filter by:</span>{filters.map((item) => <button key={item} className={filter === item ? "selected" : ""} onClick={() => setFilter(item)} aria-pressed={filter === item}>{item}</button>)}</div>{view === "list" ? <div className="flyin-grid">{displayed.map((flyIn, index) => <FlyInCard key={flyIn.id} flyIn={flyIn} featured={index === 0} />)}</div> : <MapView flyIns={displayed} />}</section>;
}
