import { createClient } from "@/lib/supabase/server";
import type { AirportOption } from "@/lib/airports";

const responseHeaders = {
  "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
};

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 100) ?? "";
  if (!query) return Response.json({ results: [] }, { headers: responseHeaders });

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_airports", {
    search_text: query,
    result_limit: 20,
  });

  if (error) {
    return Response.json(
      { results: [], error: "Airport search is temporarily unavailable." },
      { status: 503 },
    );
  }

  return Response.json({ results: (data ?? []) as AirportOption[] }, { headers: responseHeaders });
}
