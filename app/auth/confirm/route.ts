import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safePath(value: string | null, fallback: string) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = safePath(searchParams.get("next"), "/profile");

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL("/login?error=confirmation", request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as EmailOtpType });
  if (error) {
    return NextResponse.redirect(new URL("/login?error=confirmation", request.url));
  }

  const redirectPath = type === "recovery" ? "/update-password" : next;
  const response = NextResponse.redirect(new URL(redirectPath, request.url));
  if (type === "recovery") {
    response.cookies.set("ramp_password_recovery", "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 30,
      path: "/",
    });
  }

  return response;
}
