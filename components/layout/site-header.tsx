"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";

const guestLinks = [{ href: "/", label: "Home" }, { href: "/discover", label: "Discover" }, { href: "/about", label: "About" }];
const pilotLinks = [{ href: "/", label: "Home" }, { href: "/discover", label: "Discover" }, { href: "/create", label: "Create" }, { href: "/profile", label: "Profile" }, { href: "/about", label: "About" }];

export function SiteHeader({ isAuthenticated }: { isAuthenticated: boolean }) {
  const pathname = usePathname();
  const links = isAuthenticated ? pilotLinks : guestLinks;
  return <header className="topbar"><Link className="brand" href="/" aria-label="The Ramp home"><span className="brand-mark" aria-hidden="true">↗</span>THE RAMP</Link><nav aria-label="Main navigation">{links.map((link) => <Link key={link.href} className={pathname === link.href ? "active" : ""} href={link.href}>{link.label === "Create" ? "+ Create" : link.label}</Link>)}{isAuthenticated ? <SignOutButton /> : <><Link className="nav-sign-in" href="/login">Sign In</Link><Link className="nav-join" href="/signup">Join The Ramp</Link></>}</nav>{isAuthenticated ? <Link className="avatar-button" href="/profile" aria-label="Open your pilot profile">ME</Link> : <Link className="avatar-button guest" href="/signup" aria-label="Join The Ramp">↗</Link>}</header>;
}
