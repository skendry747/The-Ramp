import { notFound } from "next/navigation";
import { FlyInDetail } from "@/components/fly-ins/fly-in-detail";
import { getFlyIn } from "@/lib/fly-ins/data";
import { createClient } from "@/lib/supabase/server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function FlyInPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidPattern.test(id)) notFound();
  const [flyIn, supabase] = await Promise.all([getFlyIn(id), createClient()]);
  if (!flyIn) notFound();
  const { data: { user } } = await supabase.auth.getUser();
  return <FlyInDetail flyIn={flyIn} isHost={user?.id === flyIn.hostId} />;
}
