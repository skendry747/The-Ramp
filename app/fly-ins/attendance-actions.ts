"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { joinFlyInAs, leaveFlyInAs } from "@/lib/attendance/data";

export type AttendanceActionState = {
  joined: boolean;
  error?: string;
  message?: string;
};

export async function updateAttendance(flyInId: string, previous: AttendanceActionState, formData: FormData): Promise<AttendanceActionState> {
  const intent = String(formData.get("intent") ?? "");
  if (intent !== "join" && intent !== "leave") return { joined: previous.joined, error: "Choose a valid attendance action." };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { joined: false, error: "Sign in before joining a fly-in." };
  if (!user.email_confirmed_at) return { joined: previous.joined, error: "Verify your email before joining a fly-in." };

  const { data: flyIn, error: flyInError } = await supabase.from("fly_ins").select("id,host_id,status").eq("id", flyInId).maybeSingle();
  if (flyInError || !flyIn) return { joined: previous.joined, error: "This fly-in is unavailable." };
  if (flyIn.status !== "scheduled") return { joined: previous.joined, error: "This fly-in is no longer open for attendance changes." };
  if (flyIn.host_id === user.id) return { joined: false, error: "You are already listed separately as this fly-in’s host." };

  if (intent === "join") {
    const { error } = await joinFlyInAs(flyInId, user.id);
    if (error && error.code !== "23505") return { joined: previous.joined, error: "We could not add you to this fly-in. Please try again." };
    revalidateAttendance(flyInId);
    return { joined: true, message: error?.code === "23505" ? "You’re already on the list." : "Joined. You’re on the list." };
  }

  const { error } = await leaveFlyInAs(flyInId, user.id);
  if (error) return { joined: previous.joined, error: "We could not remove you from this fly-in. Please try again." };
  revalidateAttendance(flyInId);
  return { joined: false, message: "You’ve left this fly-in." };
}

function revalidateAttendance(flyInId: string) {
  revalidatePath("/");
  revalidatePath("/discover");
  revalidatePath(`/fly-ins/${flyInId}`);
}
