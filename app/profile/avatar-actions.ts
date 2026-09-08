"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  hasExpectedProfileImageSignature,
  isProfileImageMimeType,
  PROFILE_IMAGE_BUCKET,
  PROFILE_IMAGE_MAX_BYTES,
  profileImageExtension,
} from "@/lib/profile-images";

export type AvatarActionResult = {
  ok: boolean;
  avatarPath?: string | null;
  error?: string;
  message?: string;
};

export type ProfileImageUploadTicket = {
  ok: boolean;
  path?: string;
  token?: string;
  error?: string;
};

async function authenticatedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return { supabase, user: error ? null : user };
}

function belongsToUser(path: string | null, userId: string) {
  return Boolean(path && path.startsWith(`${userId}/`));
}

function isPreparedAvatarPath(path: string, userId: string) {
  const filename = path.slice(userId.length + 1);
  return path.startsWith(`${userId}/`)
    && /^avatar-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$/i.test(filename);
}

function revalidateAvatarDisplays() {
  revalidatePath("/profile");
  revalidatePath("/");
  revalidatePath("/discover");
  revalidatePath("/fly-ins/[id]", "page");
}

export async function createProfileImageUpload(mimeType: string, size: number): Promise<ProfileImageUploadTicket> {
  const { supabase, user } = await authenticatedClient();
  if (!user) return { ok: false, error: "Sign in before uploading a profile photo." };
  if (!isProfileImageMimeType(mimeType)) return { ok: false, error: "Use a JPG, PNG, or WebP image." };
  if (!Number.isSafeInteger(size) || size <= 0) return { ok: false, error: "That image is empty. Choose another file." };
  if (size > PROFILE_IMAGE_MAX_BYTES) return { ok: false, error: "Profile photos must be 5 MB or smaller." };

  const { data: profile, error: profileError } = await supabase.from("profiles").select("avatar_path").eq("id", user.id).maybeSingle();
  if (profileError || !profile) return { ok: false, error: "Your profile could not be loaded. Please try again." };
  const { data: existingObjects } = await supabase.storage.from(PROFILE_IMAGE_BUCKET).list(user.id, { limit: 100, search: "avatar-" });
  const stalePaths = (existingObjects ?? [])
    .filter((object) => object.id && `${user.id}/${object.name}` !== profile?.avatar_path)
    .map((object) => `${user.id}/${object.name}`);
  if (stalePaths.length) await supabase.storage.from(PROFILE_IMAGE_BUCKET).remove(stalePaths);

  const path = `${user.id}/avatar-${randomUUID()}.${profileImageExtension(mimeType)}`;
  const { data, error } = await supabase.storage.from(PROFILE_IMAGE_BUCKET).createSignedUploadUrl(path, { upsert: false });
  if (error || !data) return { ok: false, error: "We could not prepare that upload. Please try again." };
  return { ok: true, path, token: data.token };
}

export async function finalizeProfileImage(path: string): Promise<AvatarActionResult> {
  const { supabase, user } = await authenticatedClient();
  if (!user) return { ok: false, error: "Sign in before updating a profile photo." };
  if (!isPreparedAvatarPath(path, user.id)) return { ok: false, error: "That profile image path is not valid for your account." };

  const storage = supabase.storage.from(PROFILE_IMAGE_BUCKET);
  const { data: info, error: infoError } = await storage.info(path);
  const mimeType = info?.contentType ?? "";
  if (infoError || !info || !isProfileImageMimeType(mimeType) || !info.size || info.size > PROFILE_IMAGE_MAX_BYTES) {
    await storage.remove([path]);
    return { ok: false, error: "The uploaded file did not pass profile image validation." };
  }
  if (!path.endsWith(`.${profileImageExtension(mimeType)}`)) {
    await storage.remove([path]);
    return { ok: false, error: "The uploaded image type did not match its file name." };
  }

  const { data: image, error: downloadError } = await storage.download(path);
  if (downloadError || !image) {
    await storage.remove([path]);
    return { ok: false, error: "We could not verify the uploaded photo. Please try again." };
  }
  const signature = new Uint8Array(await image.slice(0, 12).arrayBuffer());
  if (!hasExpectedProfileImageSignature(signature, mimeType)) {
    await storage.remove([path]);
    return { ok: false, error: "The uploaded file does not appear to be a valid image." };
  }

  const { data: profile, error: profileError } = await supabase.from("profiles")
    .select("avatar_path").eq("id", user.id).maybeSingle();
  if (profileError || !profile) {
    await storage.remove([path]);
    return { ok: false, error: "Your profile could not be loaded. Please try again." };
  }

  const { data: updatedProfile, error: updateError } = await supabase.from("profiles")
    .update({ avatar_path: path }).eq("id", user.id).select("avatar_path").maybeSingle();
  if (updateError || !updatedProfile) {
    await storage.remove([path]);
    return { ok: false, error: "The photo uploaded, but your profile could not be updated. Please try again." };
  }

  const previousPath = profile.avatar_path as string | null;
  let cleanupFailed = false;
  if (belongsToUser(previousPath, user.id) && previousPath !== path) {
    const { error } = await storage.remove([previousPath!]);
    cleanupFailed = Boolean(error);
  }

  revalidateAvatarDisplays();
  return {
    ok: true,
    avatarPath: path,
    message: cleanupFailed ? "Photo updated. The previous file will be cleaned up later." : "Profile photo updated.",
  };
}

export async function removeProfileImage(): Promise<AvatarActionResult> {
  const { supabase, user } = await authenticatedClient();
  if (!user) return { ok: false, error: "Sign in before removing a profile photo." };

  const { data: profile, error: profileError } = await supabase.from("profiles")
    .select("avatar_path").eq("id", user.id).maybeSingle();
  if (profileError || !profile) return { ok: false, error: "Your profile could not be loaded. Please try again." };

  const previousPath = profile.avatar_path as string | null;
  const { data: updatedProfile, error: updateError } = await supabase.from("profiles")
    .update({ avatar_path: null }).eq("id", user.id).select("avatar_path").maybeSingle();
  if (updateError || !updatedProfile) return { ok: false, error: "We could not remove your profile photo. Please try again." };

  let cleanupFailed = false;
  if (belongsToUser(previousPath, user.id)) {
    const { error } = await supabase.storage.from(PROFILE_IMAGE_BUCKET).remove([previousPath!]);
    cleanupFailed = Boolean(error);
  }

  revalidateAvatarDisplays();
  return {
    ok: true,
    avatarPath: null,
    message: cleanupFailed ? "Photo removed. The previous file will be cleaned up later." : "Profile photo removed.",
  };
}
