import type { Metadata } from "next";
import { DemoProvider } from "@/components/ui/demo-provider";
import { Footer } from "@/components/layout/footer";
import { SiteHeader } from "@/components/layout/site-header";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Ramp | Turn flying into connection",
  description: "A browser-only demo for discovering and hosting aviation fly-ins.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(claims?.claims?.sub);
  return <html lang="en" data-scroll-behavior="smooth"><body><DemoProvider><SiteHeader isAuthenticated={isAuthenticated} /><main>{children}</main><Footer /></DemoProvider></body></html>;
}
