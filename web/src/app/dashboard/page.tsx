import { auth } from "@/auth"
import { PrismaClient } from "@prisma/client"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Spotlight } from "@/components/ui/spotlight"

const prisma = new PrismaClient()

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  let competitions = await prisma.competition.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      rounds: { orderBy: { order: "asc" } },
      _count: { select: { participants: true } },
    },
  })

  if (competitions.length === 0) {
    const { seedPirateChampionship } = await import("@/lib/seed-championship")
    await seedPirateChampionship()
    competitions = await prisma.competition.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        rounds: { orderBy: { order: "asc" } },
        _count: { select: { participants: true } },
      },
    })
  }

  const statusMap: Record<
    string,
    { label: string; dotClass: string; pillBg: string; pillText: string }
  > = {
    ACTIVE: {
      label: "BATTLE ACTIVE",
      dotClass: "bg-green-400 animate-pulse",
      pillBg: "bg-green-900/30",
      pillText: "text-green-400",
    },
    COUNTDOWN: {
      label: "COUNTDOWN",
      dotClass: "bg-yellow-400 animate-pulse",
      pillBg: "bg-yellow-900/30",
      pillText: "text-yellow-400",
    },
    ENDED: {
      label: "CONCLUDED",
      dotClass: "bg-slate-400",
      pillBg: "bg-slate-900/30",
      pillText: "text-slate-400",
    },
    WAITING: {
      label: "AWAITING CAPTAIN",
      dotClass: "bg-blue-400",
      pillBg: "bg-blue-900/30",
      pillText: "text-blue-400",
    },
  }

  return (
    <div className="relative min-h-screen pt-32 pb-24 px-6 z-10">
      <div className="mx-auto max-w-6xl space-y-12">
        
        {/* ── WELCOME BANNER ─────────────────────────────── */}
        <div className="relative w-full overflow-hidden rounded-[2rem] bg-[#d4af37]/20 p-[2px] shadow-2xl">
          <Spotlight className="from-[#f4ede0] via-[#d4af37] to-transparent blur-3xl" size={600} />
          <div className="relative w-full h-full rounded-[2rem] bg-[#1a1714]/60 backdrop-blur-md p-10 flex flex-col md:flex-row items-center justify-between border border-[#d4af37]/10">
            
            <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4">
              <div className="inline-block px-4 py-1.5 border border-[#d4af37]/30 bg-[#d4af37]/10 rounded-full text-[10px] font-cinzel font-bold tracking-[0.2em] text-[#d4af37] uppercase">
                Corsair Quarters
              </div>
              <h1 className="text-3xl md:text-5xl font-cinzel font-bold tracking-wider text-[#f4ede0] drop-shadow-[0_0_15px_rgba(244,237,224,0.2)]">
                WELCOME ABOARD, <br className="hidden md:block" />
                <span className="text-[#d4af37]">{session.user.name?.toUpperCase() ?? "NAVIGATOR"}</span>
              </h1>
              <div className="flex items-center gap-4 text-xs font-garamond font-semibold tracking-widest text-[#f4ede0]/60 uppercase">
                <span>{session.user.email}</span>
                {(session.user as any).mobile && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-[#d4af37]/50" />
                    <span>{(session.user as any).mobile}</span>
                  </>
                )}
              </div>
            </div>

            {(session.user as any).role === "ADMIN" && (
              <div className="mt-8 md:mt-0">
                <Link href="/admin" className="px-8 py-4 border-2 border-[#d4af37]/60 bg-[#1a1714]/80 hover:bg-[#d4af37]/20 transition-all font-cinzel font-bold tracking-[0.2em] text-[#d4af37] text-xs uppercase flex items-center gap-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                  </svg>
                  Captain's Console
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── SECTION TITLE ──────────────────────────────── */}
        <div className="flex flex-col items-center">
          <div className="w-[1px] h-12 bg-gradient-to-b from-transparent to-[#d4af37]/60 mb-6" />
          <h2 className="font-cinzel text-xl md:text-2xl font-bold tracking-[0.2em] text-[#f4ede0] uppercase drop-shadow-md">
            Active Tournaments
          </h2>
          <div className="w-[1px] h-12 bg-gradient-to-t from-transparent to-[#d4af37]/60 mt-6" />
        </div>

        {/* ── COMPETITION CARDS ──────────────────────────── */}
        {competitions.length === 0 ? (
          <div className="relative w-full overflow-hidden rounded-[2rem] bg-[#d4af37]/10 p-[1px]">
            <div className="relative w-full h-full rounded-[2rem] bg-[#1a1714]/80 backdrop-blur-md p-16 flex flex-col items-center justify-center text-center border border-[#d4af37]/10">

              <p className="font-garamond text-xl text-[#f4ede0]/70 max-w-lg">
                No voyages found. The Captain shall announce one soon.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {competitions.map((comp) => {
              const status = statusMap[comp.status] ?? statusMap["WAITING"]
              const isLive = comp.status === "ACTIVE"

              return (
                <div key={comp.id} className="relative w-full overflow-hidden rounded-3xl bg-[#d4af37]/20 p-[1px] group">
                  <Spotlight className="from-[#f4ede0] via-[#d4af37] to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" size={300} />
                  
                  <div className="relative w-full h-full rounded-3xl bg-[#1a1714]/80 backdrop-blur-md p-8 flex flex-col justify-between border border-[#d4af37]/10">
                    <div>
                      {/* Status badge */}
                      <div className="flex items-center justify-between mb-6">
                        <div className={`flex items-center gap-2 rounded-full border border-[#d4af37]/20 px-3 py-1 text-[9px] font-cinzel font-bold tracking-widest uppercase ${status.pillBg} ${status.pillText}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
                          {status.label}
                        </div>
                        <span className="text-[10px] font-garamond font-bold tracking-widest text-[#f4ede0]/60 uppercase">
                          {comp._count.participants} Sailors
                        </span>
                      </div>

                      <h3 className="text-2xl font-cinzel font-bold text-[#f4ede0] leading-tight group-hover:text-[#d4af37] transition-colors">
                        {comp.name}
                      </h3>
                      <p className="mt-3 text-sm font-garamond text-[#f4ede0]/70 line-clamp-3 leading-relaxed">
                        {comp.description ?? "The Grand Pirate Code Championship."}
                      </p>

                      {/* Rounds meta */}
                      <div className="mt-6 pt-5 border-t border-[#d4af37]/10 space-y-3 font-garamond text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-[#f4ede0]/60 tracking-wider">Rounds</span>
                          <span className="text-[#d4af37] font-bold">{comp.rounds.length} Trials</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[#f4ede0]/60 tracking-wider">Format</span>
                          <span className="text-[#d4af37] font-bold text-xs uppercase tracking-widest">Hidden Timers</span>
                        </div>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="mt-8 pt-6 border-t border-[#d4af37]/10">
                      <Link
                        href={`/competition/${comp.id}`}
                        className="block w-full text-center border border-[#d4af37]/40 bg-[#d4af37]/5 hover:bg-[#d4af37]/20 rounded-xl py-4 font-cinzel font-bold tracking-[0.2em] text-[#d4af37] text-xs uppercase transition-all"
                      >
                        {isLive ? "JOIN BATTLE NOW" : "ENTER ARENA"}
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
