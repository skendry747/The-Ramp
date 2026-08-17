import { DiscoverContent } from "@/components/fly-ins/discover-content";
import { getDiscoverableFlyIns } from "@/lib/fly-ins/data";

export const metadata = { title: "Discover Fly-Ins | The Ramp" };
export default async function DiscoverPage() {
  const result = await getDiscoverableFlyIns();
  return <DiscoverContent flyIns={result.data} loadError={result.error} />;
}
