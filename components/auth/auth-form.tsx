"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup" | "forgot";

function messageFor(error: unknown) {
  const authError = error as { code?: string; status?: number; message?: string } | undefined;
  const text = error instanceof Error ? error.message : authError?.message ?? "";
  if (authError?.code === "over_email_send_rate_limit" || authError?.status === 429) return "Too many verification emails have been requested. Please wait a little while and try again.";
  if (/invalid login credentials/i.test(text)) return "We could not sign you in with those details.";
  if (/email not confirmed/i.test(text)) return "Confirm your email before signing in.";
  if (/already registered/i.test(text)) return "An account with that email may already exist. Try signing in instead.";
  return "Something went wrong. Please try again.";
}

export function AuthForm({ mode, notice, returnTo = "/profile" }: { mode: AuthMode; notice?: string; returnTo?: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(notice ?? "");
  const isSignup = mode === "signup";
  const isForgot = mode === "forgot";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");
    const displayName = String(form.get("displayName") ?? "").trim();
    setMessage("");

    if (!email) return setMessage("Enter your email address.");
    if (isSignup && !displayName) return setMessage("Add the name other pilots should see.");
    if (!isForgot && password.length < 8) return setMessage("Use a password with at least 8 characters.");
    if (isSignup && password !== confirmPassword) return setMessage("Passwords do not match.");

    setIsSubmitting(true);
    const supabase = createClient();

    if (isForgot) {
      await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/auth/confirm?next=/update-password" });
      setMessage("If an account exists for that email, a password recovery link is on its way.");
      setIsSubmitting(false);
      return;
    }

    if (isSignup) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
          emailRedirectTo: window.location.origin + "/auth/confirm?next=/profile",
        },
      });
      setMessage(error ? messageFor(error) : "Check your email to verify your address before signing in.");
      setIsSubmitting(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(messageFor(error));
      setIsSubmitting(false);
      return;
    }
    if (!data.user.email_confirmed_at) {
      await supabase.auth.signOut();
      setMessage("Confirm your email before signing in.");
      setIsSubmitting(false);
      return;
    }
    router.replace(returnTo);
    router.refresh();
  }

  const title = isSignup ? <>Join the <em>ramp.</em></> : isForgot ? <>Reset your <em>password.</em></> : <>Welcome <em>back.</em></>;
  const intro = isSignup ? "Create your pilot profile, then verify your email before you take part." : isForgot ? "We’ll send a secure link if that email belongs to a Ramp account." : "Sign in to keep your pilot profile close to the next great fly-in.";
  const button = isSignup ? "Create your account" : isForgot ? "Send recovery link" : "Sign in";

  return <section className="auth-page page-shell"><div className="auth-intro"><p className="eyebrow">MEET. FLY. CONNECT.</p><h1>{title}</h1><p>{intro}</p><Link href="/discover">Explore fly-ins while you&apos;re here <span aria-hidden="true">↗</span></Link></div><form className="auth-card" onSubmit={submit}><p className="eyebrow">{isSignup ? "PILOT ACCOUNT" : isForgot ? "ACCOUNT RECOVERY" : "SIGN IN"}</p>{isSignup ? <label>Display name<input name="displayName" autoComplete="name" placeholder="e.g. Jamie Lee" required /></label> : null}<label>Email<input name="email" type="email" autoComplete="email" placeholder="pilot@example.com" required /></label>{!isForgot ? <label>Password<input name="password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} minLength={8} required /></label> : null}{isSignup ? <label>Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required /></label> : null}<button className="primary" type="submit" disabled={isSubmitting}>{isSubmitting ? "Please wait…" : button}</button>{message ? <p className="form-message" role="status">{message}</p> : null}<div className="auth-links">{mode === "login" ? <><Link href="/forgot-password">Forgot password?</Link><span>New here? <Link href="/signup">Join The Ramp</Link></span></> : <span>Already have an account? <Link href="/login">Sign in</Link></span>}</div></form></section>;
}
