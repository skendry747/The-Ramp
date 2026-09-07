import { redirect } from "next/navigation";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { getAirportOption } from "@/lib/fly-ins/data";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRecord } from "@/lib/supabase/domain-types";

export const metadata = { title: "Your Profile | The Ramp" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login?next=/profile");

  const { data: profile } = await supabase.from("profiles")
    .select("id, display_name, home_airport_id, aircraft, bio, avatar_path, is_public")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return <section className="page-shell empty-state"><p className="eyebrow">PROFILE SETUP</p><h1>Your pilot profile is still getting ready.</h1><p>Your account is authenticated, but its profile record is unavailable. Please sign out and back in; if this persists, contact The Ramp support.</p></section>;

  const typedProfile = profile as ProfileRecord;
  const homeAirport = typedProfile.home_airport_id ? await getAirportOption(typedProfile.home_airport_id) : null;
  return <ProfileEditor profile={typedProfile} initialHomeAirport={homeAirport} />;
}
