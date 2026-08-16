import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Fluxline — Flux Lighting Sequencer",
  description:
    "Build timeline-based Flux lighting shows and export them for AccelSystems in Roblox Studio.",
  openGraph: {
    title: "Fluxline — Flux Lighting Sequencer",
    description: "Build browser-based Flux lighting timelines and export AccelSystems-ready Luau.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Fluxline lighting sequencer timeline" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fluxline — Flux Lighting Sequencer",
    description: "Build browser-based Flux lighting timelines and export AccelSystems-ready Luau.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
