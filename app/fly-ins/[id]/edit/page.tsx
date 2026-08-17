import { notFound, redirect } from "next/navigation";
import { FlyInForm } from "@/components/fly-ins/fly-in-form";
import { getAirports, getFlyIn } from "@/lib/fly-ins/data";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Edit Fly-In | The Ramp" };

export default async function EditFlyInPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/fly-ins/${id}/edit`);
  const [flyIn, airports] = await Promise.all([getFlyIn(id), getAirports()]);
  if (!flyIn || flyIn.hostId !== user.id || flyIn.status !== "scheduled") notFound();
  return <section className="page-shell create-page"><div className="page-intro compact"><p className="eyebrow">HOST CONTROLS</p><h1>Refine the <em>plan.</em></h1><p>Update the event brief while keeping ownership and history intact.</p></div><FlyInForm airports={airports} flyIn={flyIn} /></section>;
}
