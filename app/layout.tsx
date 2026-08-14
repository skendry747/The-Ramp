import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Ramp | Find your next fly-in",
  description: "A local Phase 0 MVP demo for pilots and fly-in organizers.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
