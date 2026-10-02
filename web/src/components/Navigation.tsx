"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { signOut } from "next-auth/react";

export function Navigation({ session }: { session: any }) {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <motion.nav 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] as any, delay: 0.2 }}
      className="fixed top-0 w-full z-[100] px-12 py-8 grid grid-cols-3 items-center pointer-events-none mix-blend-difference"
    >
      {/* LEFT: Home Button */}
      <div className="flex items-center justify-start">
        {pathname !== "/" && (
          <Link href="/" className="flex items-center gap-2 group pointer-events-auto">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f4ede0" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline strokeLinecap="round" strokeLinejoin="round" points="9 22 9 12 15 12 15 22" />
            </svg>
            <span className="font-cinzel font-bold tracking-[0.2em] text-[#f4ede0] text-sm transition-colors group-hover:text-white uppercase">
              HOME
            </span>
          </Link>
        )}
      </div>

      {/* CENTER: Logo & Title (Only visible on the home/landing page) */}
      <div className="flex items-center justify-center">
        {pathname === "/" && (
          <Link href="/" className="flex flex-col items-center justify-center group pointer-events-auto">

            <div className="flex flex-col items-center text-center mt-1">
              <span className="font-cinzel font-bold tracking-[0.2em] text-[#f4ede0] text-lg leading-none">
                TREASURE VOYAGE
              </span>
              <span className="font-cinzel font-bold tracking-[0.25em] text-[#f4ede0]/90 text-[10px] uppercase mt-1.5 leading-none">
                Archipelago Caribbeana • 1726
              </span>
            </div>
          </Link>
        )}
      </div>

      {/* RIGHT: Auth & Links */}
      <div className="flex items-center justify-end">
        {session ? (
          <div 
            className="relative pointer-events-auto" 
            onMouseLeave={() => setDropdownOpen(false)}
          >
            {/* We add a padding-bottom to the button so the hover area connects seamlessly to the dropdown below */}
            <button 
              onMouseEnter={() => setDropdownOpen(true)}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 group cursor-pointer pb-4"
            >
              <span className="font-cinzel font-bold tracking-[0.15em] text-[#f4ede0] text-sm transition-colors group-hover:text-white uppercase">
                {session.user?.name || "Captain"}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f4ede0" strokeWidth="2" className={`transition-transform duration-500 ${dropdownOpen ? 'rotate-180' : ''}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as any }}
                  className="absolute right-0 top-[100%] w-56 bg-[#1a1714]/95 backdrop-blur-md border border-[#d4af37]/50 shadow-2xl overflow-hidden flex flex-col z-[200]"
                >
                  <Link href="/profile" className="px-6 py-4 font-cinzel font-bold tracking-[0.1em] text-[#f4ede0] text-xs hover:bg-[#d4af37]/20 hover:text-white transition-colors border-b border-[#d4af37]/20">
                    My Profile
                  </Link>
                  <Link href="/standings" className="px-6 py-4 font-cinzel font-bold tracking-[0.1em] text-[#f4ede0] text-xs hover:bg-[#d4af37]/20 hover:text-white transition-colors border-b border-[#d4af37]/20">
                    Standings
                  </Link>
                  <button 
                    onClick={() => signOut({ callbackUrl: "/" })} 
                    className="px-6 py-4 font-cinzel font-bold tracking-[0.1em] text-[#ef4444] text-xs text-left hover:bg-[#ef4444]/20 hover:text-[#ef4444] transition-colors"
                  >
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex gap-10 pointer-events-auto">
            <Link href="/login" className="flex items-center gap-2 group">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f4ede0" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
              <span className="font-cinzel font-bold tracking-[0.15em] text-[#f4ede0] text-sm transition-colors group-hover:text-white uppercase">
                LOG IN
              </span>
            </Link>
          </div>
        )}
      </div>
    </motion.nav>
  );
}
