import Link from "next/link";
import { DISCORD_COMMUNITY_URL } from "@/lib/community";

export function Footer() {
  return <footer><div><strong>THE RAMP</strong><p>TURN FLYING INTO CONNECTION.</p></div><div className="footer-links"><Link href="/about">MEET. FLY. CONNECT.</Link><div className="footer-community"><a href={DISCORD_COMMUNITY_URL} target="_blank" rel="noopener noreferrer">Join The Ramp on Discord</a><small>Meet pilots and coordinate plans. Official fly-ins stay on The Ramp.</small></div></div></footer>;
}
