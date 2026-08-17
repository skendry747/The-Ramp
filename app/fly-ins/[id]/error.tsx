"use client";

import Link from "next/link";

export default function FlyInError() {
  return <section className="page-shell empty-state"><p className="eyebrow">RAMP REPORT UNAVAILABLE</p><h1>We couldn&apos;t load this fly-in.</h1><p>The event service is temporarily unavailable. Try again shortly or return to Discover.</p><Link className="primary-link" href="/discover">Back to Discover</Link></section>;
}
