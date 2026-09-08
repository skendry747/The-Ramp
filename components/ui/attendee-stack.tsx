import { PilotAvatar } from "@/components/ui/pilot-avatar";
import type { AttendeeProfile } from "@/lib/types/fly-in";

type AttendeeStackProps = {
  names: string[];
  total: number;
  profiles?: AttendeeProfile[];
  className?: string;
};

export function AttendeeStack({ names, profiles = [], total, className = "" }: AttendeeStackProps) {
  const visiblePilots = profiles.length
    ? profiles.slice(0, 3).map((profile) => ({ name: profile.displayName, avatarPath: profile.avatarPath }))
    : names.slice(0, 3).map((name) => ({ name, avatarPath: null }));
  return <div className={`attendee-stack ${className}`} aria-label={`${total} pilots attending`}>
    <div className="avatar-stack" aria-hidden="true">
      {visiblePilots.map((pilot, index) => <PilotAvatar name={pilot.name} avatarPath={pilot.avatarPath} className="mini-avatar" key={`${pilot.name}-${index}`} />)}
    </div>
    <span><b>{total}</b> {total === 1 ? "pilot" : "pilots"} going</span>
  </div>;
}
