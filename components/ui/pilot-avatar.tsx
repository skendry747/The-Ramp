"use client";

import { useState } from "react";
import { getProfileImageUrl } from "@/lib/profile-images";

type PilotAvatarProps = {
  name: string;
  avatarPath?: string | null;
  className?: string;
};

export function pilotInitials(name: string) {
  const initials = name.trim().split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return initials || "P";
}

export function PilotAvatar({ name, avatarPath = null, className = "" }: PilotAvatarProps) {
  const source = getProfileImageUrl(avatarPath);
  const [failedSource, setFailedSource] = useState<string | null>(null);

  return <span className={`pilot-avatar ${className}`} role="img" aria-label={`${name || "Pilot"} profile image`}>
    {source && source !== failedSource
      // Supabase serves user-owned dynamic URLs directly; onError provides an immediate initials fallback.
      // eslint-disable-next-line @next/next/no-img-element
      ? <img src={source} alt="" onError={() => setFailedSource(source)} />
      : <span aria-hidden="true">{pilotInitials(name)}</span>}
  </span>;
}
