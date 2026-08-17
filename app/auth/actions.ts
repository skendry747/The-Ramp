"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type PasswordUpdateState = { error?: string };

function isValidPassword(password: string) {
  return password.length >= 8;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function updatePassword(_: PasswordUpdateState, formData: FormData): Promise<PasswordUpdateState> {
  const cookieStore = await cookies();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (cookieStore.get("ramp_password_recovery")?.value !== "1") {
    return { error: "Open the password recovery link from your email to set a new password." };
  }
  if (!isValidPassword(password)) return { error: "Use a password with at least 8 characters." };
  if (password !== confirmPassword) return { error: "Passwords do not match." };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return { error: "Your recovery session has expired. Request a new password reset link." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "We could not update your password. Request a new recovery link and try again." };

  cookieStore.delete("ramp_password_recovery");
  redirect("/login?password=updated");
}
