import { redirect } from "next/navigation";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { createClient } from "@/lib/supabase/server";
import type { AirportRecord, ProfileRecord } from "@/lib/supabase/domain-types";

export const metadata = { title: "Your Profile | The Ramp" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login?next=/profile");

  const [{ data: profile }, { data: airports }] = await Promise.all([
    supabase.from("profiles").select("id, display_name, home_airport_id, aircraft, bio, avatar_path, is_public").eq("id", userId).maybeSingle(),
    supabase.from("airports").select("id, identifier, identifier_type, name, city, state, latitude, longitude").order("identifier"),
  ]);

  if (!profile) return <section className="page-shell empty-state"><p className="eyebrow">PROFILE SETUP</p><h1>Your pilot profile is still getting ready.</h1><p>Your account is authenticated, but its profile record is unavailable. Please sign out and back in; if this persists, contact The Ramp support.</p></section>;

  return <ProfileEditor profile={profile as ProfileRecord} airports={(airports ?? []) as AirportRecord[]} />;
}
