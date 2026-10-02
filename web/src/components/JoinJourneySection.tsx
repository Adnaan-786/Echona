"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Spotlight } from "@/components/ui/spotlight";

export function JoinJourneySection({ session }: { session: any }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.25, delayChildren: 0.1 },
    },
  };

  const maskItemVariants = {
    hidden: { y: "100%", opacity: 0, rotateX: -20 },
    show: { 
      y: 0, 
      opacity: 1, 
      rotateX: 0,
      transition: { duration: 1.4, ease: [0.16, 1, 0.3, 1] as any }
    },
  };

  const fadeUpVariants = {
    hidden: { opacity: 0, y: 40 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] as any } 
    },
  };

  return (
    <section 
      className="relative w-full flex flex-col items-center justify-center px-4 z-10" 
      style={{ height: 'calc(100vh - 120px)', marginTop: '120px' }}
    >
      {/* Outer wrapper: h-fit ensures it only takes up as much space as the text needs, allowing it to center perfectly without touching the header. rounded-3xl for soft corners. */}
      <div className="relative w-full max-w-4xl h-fit overflow-hidden rounded-[2rem] bg-[#d4af37]/20 p-[2px] shadow-2xl">
        {/* Glow effect that follows mouse across the border */}
        <Spotlight 
          className="from-[#f4ede0] via-[#d4af37] to-transparent blur-3xl" 
          size={500} 
        />
        
        {/* Inner wrapper: 25% opacity background, matching rounded-[2rem] corners */}
        <div className="relative w-full h-full rounded-[2rem] bg-[#1a1714]/25 backdrop-blur-sm p-8 md:p-12 flex flex-col items-center">
          
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-150px" }}
            className="w-full flex flex-col items-center text-center space-y-8 perspective-1000"
          >
            <div className="space-y-2 flex flex-col items-center">
              <div className="overflow-hidden pb-1">
                <motion.h2 variants={maskItemVariants} className="font-cinzel font-bold text-4xl md:text-5xl text-[#f4ede0] tracking-[0.1em] drop-shadow-[0_0_15px_rgba(244,237,224,0.3)] origin-bottom">
                  A Voyage
                </motion.h2>
              </div>
              
              <div className="overflow-hidden pb-2">
                <motion.div variants={maskItemVariants} className="origin-bottom">
                  <span className="text-5xl md:text-6xl italic font-garamond font-bold text-[#f4ede0] tracking-wider drop-shadow-[0_0_15px_rgba(244,237,224,0.3)]">Into the</span>
                </motion.div>
              </div>
              
              <div className="overflow-hidden pb-1">
                <motion.h2 variants={maskItemVariants} className="font-cinzel font-bold text-4xl md:text-5xl text-[#f4ede0] tracking-[0.1em] drop-shadow-[0_0_15px_rgba(244,237,224,0.3)] origin-bottom">
                  Unknown
                </motion.h2>
              </div>
            </div>

            <motion.div variants={fadeUpVariants} className="w-full max-w-2xl flex flex-col items-center">
              <div className="w-[2px] h-8 bg-gradient-to-b from-[#d4af37] to-transparent mb-6" />
              <p className="font-garamond font-semibold text-lg md:text-xl text-[#f4ede0] leading-[1.6] drop-shadow-md text-balance px-4">
                Defy the ancient code-pirates of La Jamaïque, sever the Kraken's 
                tentacles, and claim the pirate king's vault of cursed doubloons in the 
                Brethren Court of Competitive Programming.
              </p>
            </motion.div>

            <motion.div variants={fadeUpVariants} className="pt-6">
              <Link href={session ? "/dashboard" : "/login"} className="group relative inline-block">
                <div className="absolute inset-0 bg-[#d4af37]/30 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <button className="relative px-10 py-4 bg-[#1a1714]/80 border-2 border-[#d4af37]/60 hover:bg-[#1a1714] hover:border-[#d4af37] transition-all duration-700 font-cinzel font-bold tracking-[0.25em] text-[#d4af37] text-xs uppercase backdrop-blur-md">
                  Begin the Voyage
                </button>
              </Link>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
