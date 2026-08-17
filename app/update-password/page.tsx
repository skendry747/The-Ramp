import Link from "next/link";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";

export const metadata = { title: "Update Password | The Ramp" };

export default function UpdatePasswordPage() {
  return <section className="auth-page page-shell"><div className="auth-intro"><p className="eyebrow">ACCOUNT RECOVERY</p><h1>Choose a <em>new password.</em></h1><p>Use the secure recovery link from your email to complete this step.</p><Link href="/login">Back to sign in</Link></div><UpdatePasswordForm /></section>;
}
