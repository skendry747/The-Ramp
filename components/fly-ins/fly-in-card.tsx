import Link from "next/link";
import { formatShortDate, formatTime } from "@/lib/format";
import type { FlyIn } from "@/lib/types/fly-in";
import { AttendeeStack } from "@/components/ui/attendee-stack";

export function FlyInCard({ flyIn, featured = false }: { flyIn: FlyIn; featured?: boolean }) {
  const [month, day] = formatShortDate(flyIn.date).split(" ");
  return <article className={`flyin-card ${featured ? "featured" : ""}`}><div className={`date-tile ${flyIn.color}`} aria-label={`${formatShortDate(flyIn.date)}`}><small>{month}</small><b>{day}</b></div><div className="card-body"><div className="card-meta"><span className={`category-badge ${flyIn.color}`}>{flyIn.category}</span><span>{flyIn.distance} away</span></div><h3><Link href={`/fly-ins/${flyIn.id}`}>{flyIn.title}</Link></h3><p className="airport"><b>{flyIn.airport.split(" · ")[0]}</b><span>{flyIn.airport.split(" · ")[1]}</span></p><p className="event-time">{formatTime(flyIn.time)} · {flyIn.tags[0]}</p><AttendeeStack names={flyIn.attendeeNames} total={flyIn.attendees} /></div><Link className="arrow-button" href={`/fly-ins/${flyIn.id}`} aria-label={`View ${flyIn.title}`}>↗</Link></article>;
}
