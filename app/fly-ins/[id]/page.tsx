import { FlyInDetail } from "@/components/fly-ins/fly-in-detail";

export default async function FlyInPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FlyInDetail id={id} />;
}

