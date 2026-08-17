import { FlyInForm } from "@/components/fly-ins/fly-in-form";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAirports } from "@/lib/fly-ins/data";

export const metadata = { title: "Create a Fly-In | The Ramp" };
export default async function CreatePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/create");
  const airports = await getAirports();
  return <section className="page-shell create-page"><div className="page-intro compact"><p className="eyebrow">HOST A GREAT DAY</p><h1>Start a <em>fly-in.</em></h1><p>Make the plan clear, invite the right people, and give pilots a reason to point the nose your way.</p><div className="create-aside"><span>01</span><p>Choose the airport, local time, and timezone.</p><span>02</span><p>Add a short ramp briefing.</p><span>03</span><p>Publish the plan to The Ramp.</p></div>{!user.email_confirmed_at && <p className="verification-note">Confirm your email before publishing a fly-in.</p>}</div><FlyInForm airports={airports} /></section>;
}
