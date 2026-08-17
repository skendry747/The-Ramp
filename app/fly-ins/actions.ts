"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isValidTimeZone, localDateTimeToIso } from "@/lib/fly-ins/time";
import type { FlyInCategory, FlyInVisibility } from "@/lib/supabase/domain-types";

export type FlyInFormState = { error?: string };

const categories = new Set<FlyInCategory>(["Social", "Breakfast", "Scenic", "Community"]);
const visibilities = new Set<FlyInVisibility>(["public", "unlisted"]);

async function authenticatedUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return { supabase, user: error ? null : data.user };
}

async function validatedValues(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const airportId = String(formData.get("airportId") ?? "");
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const timezone = String(formData.get("timezone") ?? "");
  const category = String(formData.get("category") ?? "") as FlyInCategory;
  const visibility = String(formData.get("visibility") ?? "") as FlyInVisibility;
  const briefing = String(formData.get("briefing") ?? "").trim();

  if (!title || title.length > 120) return { error: "Use a fly-in name between 1 and 120 characters." } as const;
  if (!briefing || briefing.length > 4000) return { error: "Add briefing notes no longer than 4,000 characters." } as const;
  if (!categories.has(category) || !visibilities.has(visibility)) return { error: "Choose a valid event type and visibility." } as const;
  if (!isValidTimeZone(timezone)) return { error: "Choose a valid event timezone." } as const;
  const startsAt = localDateTimeToIso(date, time, timezone);
  if (!startsAt) return { error: "That local date and time does not exist in the selected timezone." } as const;
  if (new Date(startsAt).getTime() <= Date.now()) return { error: "Choose a start time in the future." } as const;

  const supabase = await createClient();
  const { data: airport } = await supabase.from("airports").select("id").eq("id", airportId).eq("is_active", true).maybeSingle();
  if (!airport) return { error: "Choose an airport from the available list." } as const;
  return { values: { title, airport_id: airport.id, starts_at: startsAt, timezone, category, visibility, briefing } } as const;
}

export async function createFlyIn(_: FlyInFormState, formData: FormData): Promise<FlyInFormState> {
  const { supabase, user } = await authenticatedUser();
  if (!user) return { error: "Sign in before creating a fly-in." };
  if (!user.email_confirmed_at) return { error: "Confirm your email before creating a fly-in." };
  const validated = await validatedValues(formData);
  if ("error" in validated) return { error: validated.error };

  const { data, error } = await supabase.from("fly_ins").insert({
    ...validated.values,
    host_id: user.id,
    status: "scheduled",
  }).select("id").single();
  if (error || !data) return { error: "We could not create this fly-in. Check the details and try again." };
  revalidatePath("/");
  revalidatePath("/discover");
  redirect(`/fly-ins/${data.id}`);
}

export async function updateFlyIn(id: string, _: FlyInFormState, formData: FormData): Promise<FlyInFormState> {
  const { supabase, user } = await authenticatedUser();
  if (!user) return { error: "Sign in with the host account to edit this fly-in." };
  const validated = await validatedValues(formData);
  if ("error" in validated) return { error: validated.error };

  const { data, error } = await supabase.from("fly_ins").update(validated.values)
    .eq("id", id).eq("host_id", user.id).eq("status", "scheduled").select("id").maybeSingle();
  if (error || !data) return { error: "This fly-in could not be updated. It may be cancelled or you may not be its host." };
  revalidatePath("/");
  revalidatePath("/discover");
  revalidatePath(`/fly-ins/${id}`);
  redirect(`/fly-ins/${id}`);
}

export async function cancelFlyIn(id: string) {
  const { supabase, user } = await authenticatedUser();
  if (!user) redirect(`/login?next=/fly-ins/${id}`);
  const { data, error } = await supabase.from("fly_ins").update({ status: "cancelled" })
    .eq("id", id).eq("host_id", user.id).eq("status", "scheduled").select("id").maybeSingle();
  if (error || !data) redirect(`/fly-ins/${id}?cancel=failed`);
  revalidatePath("/");
  revalidatePath("/discover");
  revalidatePath(`/fly-ins/${id}`);
  redirect(`/fly-ins/${id}?cancelled=1`);
}
