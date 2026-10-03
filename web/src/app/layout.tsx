import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navigation } from "@/components/Navigation";

import { Cinzel, Cormorant_Garamond, Rye, Sancreek } from "next/font/google";

const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel" });
const garamond = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-garamond" });
const rye = Rye({ subsets: ["latin"], weight: "400", variable: "--font-rye" });
const sancreek = Sancreek({ subsets: ["latin"], weight: "400", variable: "--font-sancreek" });

import { CloudOverlay } from "@/components/CloudOverlay";
import { PageBackground } from "@/components/PageBackground";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "ECHONA 2K26 | Pirate Code Championship",
  description: "Live Algorithmic Pirate Battle Arena with Real-time synchronization and AI Debugging Engine.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en" className={`${cinzel.variable} ${garamond.variable} ${rye.variable} ${sancreek.variable} antialiased`} data-scroll-behavior="smooth">
      <body className="min-h-screen flex flex-col font-garamond bg-[#1a1714] text-[#d6c7b0]">
        <ThemeProvider>
          <PageBackground />
          <CloudOverlay />
          <Navigation session={session} />
          <main className="flex-1 flex flex-col z-10">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
