export const PROFILE_IMAGE_BUCKET = "profile-images";
export const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const PROFILE_IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

const profileImageExtensions = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type ProfileImageMimeType = keyof typeof profileImageExtensions;

export function isProfileImageMimeType(value: string): value is ProfileImageMimeType {
  return value in profileImageExtensions;
}

export function profileImageExtension(value: ProfileImageMimeType) {
  return profileImageExtensions[value];
}

export function hasExpectedProfileImageSignature(bytes: Uint8Array, type: ProfileImageMimeType) {
  if (type === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  return bytes.length >= 12
    && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF"
    && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
}

export function getProfileImageUrl(path: string | null | undefined) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!supabaseUrl || !path) return null;
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `${supabaseUrl}/storage/v1/object/public/${PROFILE_IMAGE_BUCKET}/${encodedPath}`;
}
