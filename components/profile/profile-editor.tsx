"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { createProfileImageUpload, finalizeProfileImage, removeProfileImage } from "@/app/profile/avatar-actions";
import { AirportAutocomplete } from "@/components/airports/airport-autocomplete";
import { PilotAvatar } from "@/components/ui/pilot-avatar";
import { airportCodeLabel, type AirportOption } from "@/lib/airports";
import { hasExpectedProfileImageSignature, isProfileImageMimeType, PROFILE_IMAGE_ACCEPT, PROFILE_IMAGE_BUCKET, PROFILE_IMAGE_MAX_BYTES } from "@/lib/profile-images";
import { createClient } from "@/lib/supabase/client";
import type { ProfileRecord } from "@/lib/supabase/domain-types";

type ProfileEditorProps = {
  profile: ProfileRecord;
  initialHomeAirport: AirportOption | null;
};

type PhotoMessage = { text: string; error: boolean } | null;

export function ProfileEditor({ profile: initialProfile, initialHomeAirport }: ProfileEditorProps) {
  const [profile, setProfile] = useState(initialProfile);
  const [homeAirport, setHomeAirport] = useState(initialHomeAirport);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [photoMessage, setPhotoMessage] = useState<PhotoMessage>(null);
  const photoInput = useRef<HTMLInputElement>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (!profile.display_name.trim()) {
      setMessage("Add a display name before saving your profile.");
      return;
    }

    setIsSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase.from("profiles").update({
      display_name: profile.display_name.trim(),
      home_airport_id: profile.home_airport_id,
      aircraft: profile.aircraft?.trim() || null,
      bio: profile.bio?.trim() || null,
    }).eq("id", profile.id).select("id, display_name, home_airport_id, aircraft, bio, avatar_path, is_public").single();

    if (error || !data) {
      setMessage("We could not save your profile. Check your connection and try again.");
    } else {
      setProfile(data as ProfileRecord);
      setMessage("Profile saved.");
    }
    setIsSaving(false);
  }

  async function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    setPhotoMessage(null);
    if (!isProfileImageMimeType(file.type)) {
      setPhotoMessage({ text: "Use a JPG, PNG, or WebP image.", error: true });
      input.value = "";
      return;
    }
    if (file.size > PROFILE_IMAGE_MAX_BYTES) {
      setPhotoMessage({ text: "Profile photos must be 5 MB or smaller.", error: true });
      input.value = "";
      return;
    }
    const signature = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    if (!hasExpectedProfileImageSignature(signature, file.type)) {
      setPhotoMessage({ text: "The selected file does not appear to be a valid image.", error: true });
      input.value = "";
      return;
    }

    setIsUpdatingPhoto(true);
    try {
      const ticket = await createProfileImageUpload(file.type, file.size);
      if (!ticket.ok || !ticket.path || !ticket.token) {
        setPhotoMessage({ text: ticket.error ?? "We could not prepare that upload.", error: true });
        return;
      }

      const supabase = createClient();
      const { error: uploadError } = await supabase.storage.from(PROFILE_IMAGE_BUCKET)
        .uploadToSignedUrl(ticket.path, ticket.token, file, { cacheControl: "31536000", contentType: file.type });
      if (uploadError) {
        setPhotoMessage({ text: "We could not upload that photo. Check your connection and try again.", error: true });
        return;
      }

      const result = await finalizeProfileImage(ticket.path);
      if (!result.ok) {
        setPhotoMessage({ text: result.error ?? "We could not upload that photo.", error: true });
      } else {
        setProfile((current) => ({ ...current, avatar_path: result.avatarPath ?? null }));
        setPhotoMessage({ text: result.message ?? "Profile photo updated.", error: false });
      }
    } catch {
      setPhotoMessage({ text: "We could not upload that photo. Check your connection and try again.", error: true });
    } finally {
      setIsUpdatingPhoto(false);
      input.value = "";
    }
  }

  async function removePhoto() {
    setPhotoMessage(null);
    setIsUpdatingPhoto(true);
    try {
      const result = await removeProfileImage();
      if (!result.ok) {
        setPhotoMessage({ text: result.error ?? "We could not remove your profile photo.", error: true });
      } else {
        setProfile((current) => ({ ...current, avatar_path: null }));
        setPhotoMessage({ text: result.message ?? "Profile photo removed.", error: false });
      }
    } catch {
      setPhotoMessage({ text: "We could not remove your profile photo. Check your connection and try again.", error: true });
    } finally {
      setIsUpdatingPhoto(false);
      if (photoInput.current) photoInput.current.value = "";
    }
  }

  return <section className="page-shell profile-page"><div className="profile-card"><div className="profile-banner"><span>THE RAMP</span><p>MEET. FLY. CONNECT.</p></div><div className="profile-content"><PilotAvatar name={profile.display_name} avatarPath={profile.avatar_path} className="profile-avatar" /><p className="eyebrow">PILOT PROFILE</p><h1>{profile.display_name}</h1><p className="home-airport">⌖ {homeAirport ? `${airportCodeLabel(homeAirport)} · ${homeAirport.city ?? homeAirport.name}` : "Home airport not set"}</p><p className="profile-aircraft">{profile.aircraft || "Aircraft not set"}</p><p className="profile-bio">{profile.bio || "Add a short bio so other pilots know who they’ll meet on the ramp."}</p><div className="activity-summary"><p className="eyebrow">YOUR PILOT PROFILE</p><b>Built for the next ramp day.</b><span>Hosted and joined fly-ins will appear here as pilots connect.</span></div><form className="profile-form" onSubmit={submit}><div className="profile-photo-section"><p className="eyebrow">OPTIONAL</p><h2>Add a profile photo</h2><p>Upload a photo of yourself or your aircraft so other pilots can recognize you around the ramp.</p><span>JPG, PNG, or WebP · 5 MB maximum</span><div className="profile-photo-actions"><label className="photo-upload-button" htmlFor="profile-photo">{isUpdatingPhoto ? "Uploading…" : profile.avatar_path ? "Replace Photo" : "Upload Photo"}</label><input ref={photoInput} className="photo-upload-input" id="profile-photo" name="avatar" type="file" accept={PROFILE_IMAGE_ACCEPT} disabled={isUpdatingPhoto} onChange={selectPhoto} />{profile.avatar_path ? <button className="photo-remove-button" type="button" disabled={isUpdatingPhoto} onClick={removePhoto}>{isUpdatingPhoto ? "Working…" : "Remove Photo"}</button> : null}</div>{photoMessage ? <p className={photoMessage.error ? "photo-message error" : "photo-message"} role={photoMessage.error ? "alert" : "status"}>{photoMessage.text}</p> : null}</div><p className="eyebrow">EDIT PROFILE</p><label>Display name<input value={profile.display_name} onChange={(event) => setProfile({ ...profile, display_name: event.target.value })} required /></label><label htmlFor="home-airport">Home airport<span className="field-hint">Search active FAA facilities, including private-use airports and facilities without ICAO codes.</span></label><AirportAutocomplete inputId="home-airport" name="homeAirportId" initialAirport={initialHomeAirport} onSelectionChange={(airport) => { setHomeAirport(airport); setProfile({ ...profile, home_airport_id: airport?.id ?? null }); }} /><label>Aircraft<input value={profile.aircraft ?? ""} onChange={(event) => setProfile({ ...profile, aircraft: event.target.value })} placeholder="e.g. Cessna 172 Skyhawk" /></label><label>About<textarea value={profile.bio ?? ""} onChange={(event) => setProfile({ ...profile, bio: event.target.value })} placeholder="A short note about how you fly." /></label><button className="primary" type="submit" disabled={isSaving || isUpdatingPhoto}>{isSaving ? "Saving profile…" : "Save profile"}</button>{message ? <p className="form-message" role="status">{message}</p> : null}</form></div></div></section>;
}
