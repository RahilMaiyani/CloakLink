import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LightRays from "@/components/LightRays";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cloaker | Zero-Knowledge Ephemeral Secrets",
  description: "End-to-end encrypted, self-destructing secret sharing platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-neutral-950 text-neutral-100 flex flex-col relative overflow-x-hidden">
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <LightRays
            raysOrigin="top-center-offset"
            raysColor="#5dfeca"
            raysSpeed={0.9}
            lightSpread={0.9}
            rayLength={1.5}
            followMouse={true}
            mouseInfluence={0.1}
            noiseAmount={0}
            distortion={0.05}
            pulsating={false}
            fadeDistance={1}
            saturation={1}
          />
        </div>

        <Navbar />

        <div className="relative z-10 flex-1 flex flex-col">{children}</div>
      </body>
    </html>
  );
}
