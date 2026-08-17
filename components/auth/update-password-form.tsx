"use client";

import { useActionState } from "react";
import { updatePassword, type PasswordUpdateState } from "@/app/auth/actions";

const initialState: PasswordUpdateState = {};

export function UpdatePasswordForm() {
  const [state, formAction, isPending] = useActionState(updatePassword, initialState);
  return <form className="auth-card" action={formAction}><p className="eyebrow">NEW PASSWORD</p><label>New password<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label><label>Confirm new password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required /></label><button className="primary" type="submit" disabled={isPending}>{isPending ? "Updating password…" : "Update password"}</button>{state.error ? <p className="form-message" role="alert">{state.error}</p> : null}</form>;
}
