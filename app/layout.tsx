import type { Metadata } from "next";
import { DemoProvider } from "@/components/ui/demo-provider";
import { Footer } from "@/components/layout/footer";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Ramp | Turn flying into connection",
  description: "A browser-only demo for discovering and hosting aviation fly-ins.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth"><body><DemoProvider><SiteHeader /><main>{children}</main><Footer /></DemoProvider></body></html>;
}
