import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Sign In | The Ramp" };

function safeReturnPath(value: string | undefined) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/profile";
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ password?: string; next?: string; error?: string }> }) {
  const params = await searchParams;
  const notice = params.password === "updated"
    ? "Password updated. You can sign in now."
    : params.error === "confirmation"
      ? "We could not verify that link. Request a new email and try again."
      : undefined;
  return <AuthForm mode="login" notice={notice} returnTo={safeReturnPath(params.next)} />;
}
