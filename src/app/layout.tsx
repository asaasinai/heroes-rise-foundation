import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://heroes-rise-foundation.vercel.app"),
  title: "Heroes Rise Foundation | Serving Those Who Serve",
  description:
    "Heroes Rise Foundation supports veterans, first responders, and vulnerable animals through community-powered programs, rescue services, and compassionate outreach.",
  keywords: [
    "non-profit",
    "veterans support",
    "animal rescue",
    "community outreach",
    "Heroes Rise Foundation"
  ],
  openGraph: {
    title: "Heroes Rise Foundation",
    description: "Serving Those Who Serve. Saving Those Who Can't Speak.",
    type: "website",
    url: "https://heroes-rise-foundation.vercel.app"
  },
  twitter: {
    card: "summary_large_image",
    title: "Heroes Rise Foundation",
    description: "Serving Those Who Serve. Saving Those Who Can't Speak."
  },
  alternates: {
    canonical: "https://heroes-rise-foundation.vercel.app"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
