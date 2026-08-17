import Link from "next/link";

export default function FlyInNotFound() {
  return <section className="page-shell empty-state"><p className="eyebrow">FLY-IN NOT FOUND</p><h1>That fly-in isn&apos;t on the ramp.</h1><p>The link may be invalid, the event may be unavailable, or your account may not have access.</p><Link className="primary-link" href="/discover">Explore fly-ins</Link></section>;
}
