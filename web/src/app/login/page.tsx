"use client"

import { useActionState, useState } from "react"
import { authenticate } from "@/app/actions/auth"
import Link from "next/link"
import { Spotlight } from "@/components/ui/spotlight"
import { signIn } from "next-auth/react"
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { app } from "@/lib/firebase"

export default function LoginPage() {
  const [errorMessage, dispatch, isPending] = useActionState(authenticate, undefined)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true)
      const auth = getAuth(app)
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      
      const idToken = await result.user.getIdToken()
      
      // Pass the secure Firebase ID token to NextAuth
      await signIn("firebase", {
        idToken,
        callbackUrl: "/dashboard"
      })
    } catch (error) {
      console.error("Firebase Google Auth Error:", error)
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-65px)] flex flex-col items-center justify-center p-6 z-10 pt-32">
      
      <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-[#d4af37]/20 p-[2px] shadow-2xl">
        <Spotlight 
          className="from-[#f4ede0] via-[#d4af37] to-transparent blur-3xl" 
          size={400} 
        />
        
        <div className="relative w-full h-full rounded-[2rem] bg-[#1a1714]/60 backdrop-blur-md p-10 flex flex-col items-center border border-[#d4af37]/10">
          
          {/* Header */}
          <div className="mb-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full border border-[#d4af37]/50 flex items-center justify-center bg-[#1a1714]/80 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="1.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            
            <h1 className="text-3xl font-cinzel font-bold tracking-[0.15em] text-[#f4ede0] drop-shadow-[0_0_10px_rgba(244,237,224,0.3)]">
              BOARD THE FLAGSHIP
            </h1>
            <p className="text-xs font-garamond font-semibold text-[#f4ede0]/70 tracking-wide uppercase">
              Enter your credentials to access the Arena
            </p>
          </div>

          {/* ── Google Sign In ──────────────────────────── */}
          <div className="w-full mb-6">
            <button
              type="button"
              disabled={isGoogleLoading}
              onClick={handleGoogleSignIn}
              className="group relative w-full flex items-center justify-center gap-3 rounded-xl border border-[#d4af37]/60 bg-[#1a1714]/80 hover:bg-[#d4af37]/20 py-4 text-xs font-cinzel font-bold tracking-[0.2em] text-[#d4af37] uppercase transition-all shadow-lg disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="transition-transform group-hover:scale-110">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {isGoogleLoading ? "AUTHENTICATING..." : "CONTINUE WITH GOOGLE"}
            </button>
          </div>

          <div className="flex items-center w-full mb-6">
            <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-[#d4af37]/30"></div>
            <span className="px-4 text-[10px] font-cinzel font-bold tracking-widest text-[#d4af37]/60 uppercase">OR</span>
            <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-[#d4af37]/30"></div>
          </div>

          {/* ── Form ──────────────────────────────────────────── */}
          <form action={dispatch} className="w-full space-y-5">
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
                placeholder="captain@echona.com"
                className="w-full bg-[#1a1714]/80 border border-[#d4af37]/30 rounded-lg px-4 py-3 text-sm font-garamond text-[#f4ede0] placeholder:text-[#f4ede0]/60 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all"
              />
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
              {isPending ? "VERIFYING ORDERS..." : "SIGN IN & ENTER ARENA"}
            </button>
          </form>

          {/* Footer link */}
          <div className="mt-8 text-center">
            <p className="text-xs font-garamond font-semibold text-[#f4ede0]/60">
              No pirate commission yet?{" "}
              <Link href="/register" className="font-bold text-[#d4af37] hover:text-[#f4ede0] transition-colors">
                Enlist in the crew
              </Link>
            </p>
          </div>
          
        </div>
      </div>
    </div>
  )
}
