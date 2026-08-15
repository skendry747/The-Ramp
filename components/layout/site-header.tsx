"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [{ href: "/", label: "Home" }, { href: "/discover", label: "Discover" }, { href: "/create", label: "Create" }, { href: "/profile", label: "Profile" }, { href: "/about", label: "About" }];

export function SiteHeader() {
  const pathname = usePathname();
  return <header className="topbar"><Link className="brand" href="/" aria-label="The Ramp home"><span className="brand-mark" aria-hidden="true">↗</span>THE RAMP</Link><nav aria-label="Main navigation">{links.map((link) => <Link key={link.href} className={pathname === link.href ? "active" : ""} href={link.href}>{link.label === "Create" ? "+ Create" : link.label}</Link>)}</nav><Link className="avatar-button" href="/profile" aria-label="Open demo profile">SK</Link></header>;
}
