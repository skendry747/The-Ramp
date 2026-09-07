"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updateAttendance, type AttendanceActionState } from "@/app/fly-ins/attendance-actions";

type AttendanceControlProps = {
  flyInId: string;
  isActive: boolean;
  isAuthenticated: boolean;
  isVerified: boolean;
  isHost: boolean;
  initialJoined: boolean;
};

export function AttendanceControl({ flyInId, isActive, isAuthenticated, isVerified, isHost, initialJoined }: AttendanceControlProps) {
  const action = updateAttendance.bind(null, flyInId);
  const initialState: AttendanceActionState = { joined: initialJoined };
  const [state, formAction, pending] = useActionState(action, initialState);

  if (!isActive) return <button className="join" disabled>Fly-in not open</button>;
  if (isHost) return <div className="attendance-host-state"><b>✓ You&apos;re the host</b><span>Hosts are shown separately from attendees.</span></div>;
  if (!isAuthenticated) return <Link className="join join-link" href={`/login?next=/fly-ins/${flyInId}`}>Sign In to Join</Link>;
  if (!isVerified) return <><button className="join" disabled>Verify Email to Join</button><p className="attendance-feedback">Confirm your email, then refresh this page.</p></>;

  return <form action={formAction} className="attendance-form">
    <input type="hidden" name="intent" value={state.joined ? "leave" : "join"} />
    {state.joined && <p className="attendance-status">✓ Joined</p>}
    <button className={state.joined ? "join leave" : "join"} type="submit" disabled={pending}>{pending ? state.joined ? "Leaving…" : "Joining…" : state.joined ? "Leave Fly-In" : "Join Fly-In"}</button>
    {state.error && <p className="attendance-error" role="alert">{state.error}</p>}
    {state.message && <p className="attendance-feedback" role="status">{state.message}</p>}
  </form>;
}
