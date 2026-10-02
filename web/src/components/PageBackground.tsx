"use client";

import { usePathname } from "next/navigation";

export function PageBackground() {
  const pathname = usePathname();

  // The landing page uses the video scroll sequence, so no static background needed there.
  if (pathname === "/") return null;

  // The battle section gets a distinct, dramatic sea battle background (as requested)
  if (pathname.includes("/competition/")) {
    return (
      <div 
        className="fixed inset-0 -z-40 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 opacity-60"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2094&auto=format&fit=crop')" }}
      >
        <div className="absolute inset-0 bg-[#1a1714]/70" />
      </div>
    );
  }

  // Profile, Dashboard, Admin, Login, Register get the custom user background.
  return (
    <div 
      className="fixed inset-0 -z-40 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 opacity-80"
      style={{ backgroundImage: "url('/images/dashboard-bg.jpg')" }}
    >
      <div className="absolute inset-0 bg-[#1a1714]/80" />
    </div>
  );
}
