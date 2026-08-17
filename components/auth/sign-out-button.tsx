"use client";

import { useTransition } from "react";
import { signOut } from "@/app/auth/actions";

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();
  return <button className="nav-sign-out" type="button" onClick={() => startTransition(() => signOut())} disabled={isPending}>{isPending ? "Signing out…" : "Sign Out"}</button>;
}
