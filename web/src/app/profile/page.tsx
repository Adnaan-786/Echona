import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="relative min-h-screen flex flex-col items-center pt-40 px-6 z-10">
      <div className="max-w-3xl w-full flex flex-col items-center text-center space-y-12">
        
        <div className="space-y-4">
          <h1 className="font-cinzel text-5xl md:text-6xl text-[#f4ede0] font-bold tracking-wide drop-shadow-lg">
            Captain's Quarters
          </h1>
          <div className="w-[1px] h-12 bg-gradient-to-b from-[#d4af37]/60 to-transparent mx-auto mt-6" />
        </div>

        <div className="w-full bg-[#1a1714]/80 backdrop-blur-md border border-[#d4af37]/40 p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37]/50 to-transparent" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-left">
            <div className="space-y-2">
              <p className="font-cinzel font-bold text-[#d4af37] text-sm tracking-widest uppercase">Name</p>
              <p className="font-garamond text-2xl text-[#f4ede0] font-semibold">{session.user?.name}</p>
            </div>
            
            <div className="space-y-2">
              <p className="font-cinzel font-bold text-[#d4af37] text-sm tracking-widest uppercase">Email</p>
              <p className="font-garamond text-2xl text-[#f4ede0] font-semibold">{session.user?.email}</p>
            </div>
            
            <div className="space-y-2">
              <p className="font-cinzel font-bold text-[#d4af37] text-sm tracking-widest uppercase">Rank</p>
              <p className="font-garamond text-2xl text-[#f4ede0] font-semibold">{(session.user as any)?.role || "Pirate"}</p>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-[#d4af37]/20 flex justify-center">
            <Link href="/dashboard" className="px-10 py-4 bg-[#1a1714] border border-[#d4af37]/60 hover:bg-[#d4af37]/10 transition-all duration-500 font-cinzel font-bold tracking-[0.2em] text-[#d4af37] text-sm uppercase">
              Return to Fleet
            </Link>
          </div>
        </div>
        
      </div>
    </div>
  );
}
