"use client"

import { useActionState, useState } from "react"
import { registerUser as register } from "@/app/actions/auth"
import Link from "next/link"
import { Spotlight } from "@/components/ui/spotlight"

export default function RegisterPage() {
  const [errorMessage, dispatch, isPending] = useActionState(register, undefined)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [mobile, setMobile] = useState("")
  const [inviteCode, setInviteCode] = useState("")

  return (
    <div className="relative min-h-[calc(100vh-65px)] flex flex-col items-center justify-center p-6 z-10 pt-32 pb-24">
      
      <div className="relative w-full max-w-xl overflow-hidden rounded-[2rem] bg-[#d4af37]/20 p-[2px] shadow-2xl">
        <Spotlight 
          className="from-[#f4ede0] via-[#d4af37] to-transparent blur-3xl" 
          size={500} 
        />
        
        <div className="relative w-full h-full rounded-[2rem] bg-[#1a1714]/70 backdrop-blur-md p-10 flex flex-col items-center border border-[#d4af37]/10">
          
          {/* Header */}
          <div className="mb-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full border border-[#d4af37]/50 flex items-center justify-center bg-[#1a1714]/80 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path>
              </svg>
            </div>
            
            <h1 className="text-3xl font-cinzel font-bold tracking-[0.15em] text-[#f4ede0] drop-shadow-[0_0_10px_rgba(244,237,224,0.3)]">
              ENLIST IN THE CREW
            </h1>
            <p className="text-xs font-garamond font-semibold text-[#f4ede0]/70 tracking-wide uppercase">
              Sign the Articles and claim your spot
            </p>
          </div>

          {/* Form */}
          <form action={dispatch} className="w-full space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="block text-[10px] font-cinzel font-bold uppercase tracking-[0.15em] text-[#d4af37]" htmlFor="name">
                  Pirate Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jack Rackham"
                  className="w-full bg-[#1a1714]/80 border border-[#d4af37]/30 rounded-lg px-4 py-3 text-sm font-garamond text-[#f4ede0] placeholder:text-[#f4ede0]/60 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-cinzel font-bold uppercase tracking-[0.15em] text-[#d4af37]" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sailor@echona.com"
                  className="w-full bg-[#1a1714]/80 border border-[#d4af37]/30 rounded-lg px-4 py-3 text-sm font-garamond text-[#f4ede0] placeholder:text-[#f4ede0]/60 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="block text-[10px] font-cinzel font-bold uppercase tracking-[0.15em] text-[#d4af37]" htmlFor="mobile">
                  Mobile Number (Optional)
                </label>
                <input
                  id="mobile"
                  name="mobile"
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+1 234 567 890"
                  className="w-full bg-[#1a1714]/80 border border-[#d4af37]/30 rounded-lg px-4 py-3 text-sm font-garamond text-[#f4ede0] placeholder:text-[#f4ede0]/60 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-cinzel font-bold uppercase tracking-[0.15em] text-[#d4af37]" htmlFor="inviteCode">
                  Invite Code (For Captains)
                </label>
                <input
                  id="inviteCode"
                  name="inviteCode"
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Optional Admin Code"
                  className="w-full bg-[#1a1714]/80 border border-[#d4af37]/30 rounded-lg px-4 py-3 text-sm font-garamond text-[#f4ede0] placeholder:text-[#f4ede0]/60 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-cinzel font-bold uppercase tracking-[0.15em] text-[#d4af37]" htmlFor="password">
                Passcode
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#1a1714]/80 border border-[#d4af37]/30 rounded-lg px-4 py-3 text-sm font-garamond text-[#f4ede0] placeholder:text-[#f4ede0]/60 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all"
              />
            </div>

            {errorMessage && (
              <div className="rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 p-3 text-xs font-garamond font-semibold text-[#ef4444] text-center">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-xl border border-[#d4af37]/60 bg-[#1a1714]/80 hover:bg-[#d4af37]/20 py-4 text-xs font-cinzel font-bold tracking-[0.2em] text-[#d4af37] uppercase transition-all mt-4 disabled:border-[#d4af37]/20 disabled:bg-[#d4af37]/5 disabled:text-[#d4af37]/80"
            >
              {isPending ? "SIGNING ARTICLES..." : "SIGN THE ARTICLES"}
            </button>
          </form>

          {/* Footer link */}
          <div className="mt-8 text-center">
            <p className="text-xs font-garamond font-semibold text-[#f4ede0]/60">
              Already swore the oath?{" "}
              <Link href="/login" className="font-bold text-[#d4af37] hover:text-[#f4ede0] transition-colors">
                Return to your ship
              </Link>
            </p>
          </div>
          
        </div>
      </div>
    </div>
  )
}
