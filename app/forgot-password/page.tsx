import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Reset Password | The Ramp" };

export default function ForgotPasswordPage() {
  return <AuthForm mode="forgot" />;
}
