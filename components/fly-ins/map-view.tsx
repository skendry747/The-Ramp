import Link from "next/link";
import type { FlyIn } from "@/lib/types/fly-in";

export function MapView({ flyIns }: { flyIns: FlyIn[] }) {
  return <section className="map-panel" aria-label="Illustrative map of sample fly-ins"><div className="map-grid" /><div className="map-route route-one" /><div className="map-route route-two" /><div className="map-city city-one">DENTON</div><div className="map-city city-two">DALLAS</div><div className="map-city city-three">FORT WORTH</div>{flyIns.map((flyIn) => <Link key={flyIn.id} className={`map-pin ${flyIn.color}`} style={flyIn.position} href={`/fly-ins/${flyIn.id}`} aria-label={`View ${flyIn.title}`}><span aria-hidden="true">✦</span><b>{flyIn.title}</b></Link>)}<p className="map-disclaimer">Illustrative map only — not for navigation or flight planning.</p></section>;
}

