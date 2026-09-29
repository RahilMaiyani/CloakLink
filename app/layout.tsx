import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Grainient from "@/components/Grainient";

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
      <body className="min-h-full bg-neutral-950 text-neutral-100 flex flex-col relative overflow-hidden">
        <div style={{ width: "100%", height: "100%", position: "absolute" }}>
          <Grainient
            color1="#5dfeca"
            color2="#000000"
            color3="#000000"
            timeSpeed={0.5}
            colorBalance={0.0}
            warpStrength={1.0}
            warpFrequency={2.3}
            warpSpeed={2.0}
            warpAmplitude={50.0}
            blendAngle={-65}
            blendSoftness={0.05}
            rotationAmount={500.0}
            noiseScale={0.45}
            grainAmount={0.1}
            grainScale={2.0}
            grainAnimated={false}
            contrast={1.5}
            gamma={1.0}
            saturation={0.55}
            centerX={0.0}
            centerY={0.0}
            zoom={1.25}
          />
        </div>
        <Navbar />
        <div className="relative z-10 flex-1 flex flex-col">{children}</div>
      </body>
    </html>
  );
}
