import { getLeaderboard } from "@/app/actions/leaderboard"
import { PrismaClient } from "@prisma/client"
import { Spotlight } from "@/components/ui/spotlight"
import LeaderboardRefresher from "@/components/LeaderboardRefresher"

const prisma = new PrismaClient()

export default async function StandingsPage() {
  // Get the most recent competition
  const competition = await prisma.competition.findFirst({
    orderBy: { createdAt: "desc" }
  })

  // If no competition or not ended yet
  if (!competition || competition.status !== "ENDED") {
    return (
      <div className="relative min-h-screen flex flex-col items-center pt-40 px-6 z-10">
        {competition && <LeaderboardRefresher competitionId={competition.id} />}
        <div className="max-w-4xl w-full flex flex-col items-center text-center space-y-12">
          
          <div className="space-y-4">
            <h1 className="font-cinzel text-5xl md:text-6xl text-[#f4ede0] font-bold tracking-wide drop-shadow-lg">
              The Brethren Court
            </h1>
            <p className="font-garamond text-2xl text-[#f4ede0]/80 font-semibold italic">
              Current Standings & Bounties
            </p>
            <div className="w-[1px] h-12 bg-gradient-to-b from-[#d4af37]/60 to-transparent mx-auto mt-6" />
          </div>

          <div className="w-full bg-[#1a1714]/80 backdrop-blur-md border border-[#d4af37]/40 p-12 shadow-2xl relative rounded-[2rem] overflow-hidden">
            <Spotlight className="from-[#f4ede0] via-[#d4af37] to-transparent blur-3xl" size={400} />
            
            <div className="flex flex-col items-center justify-center py-12 space-y-6 relative z-10">
              <div className="text-6xl mb-4 opacity-80">🏴‍☠️</div>
              <p className="font-garamond text-xl text-[#f4ede0]/70 max-w-lg text-center leading-relaxed">
                {competition 
                  ? "The tournament is currently underway! The final ledgers will remain strictly hidden until the High Admiral officially ends the test."
                  : "The tournament has not yet commenced. The ledgers are being prepared and the bounties await the bold."}
              </p>
              <p className="font-cinzel font-bold text-[#d4af37] text-sm tracking-[0.2em] uppercase mt-4">
                Check back at dawn
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If competition IS ended, show the actual leaderboard
  const leaderboard = await getLeaderboard(competition.id)
  const top3 = leaderboard.slice(0, 3)

  return (
    <div className="relative min-h-screen flex flex-col items-center pt-40 px-6 z-10 pb-20">
      <div className="max-w-5xl w-full flex flex-col items-center text-center space-y-12">
        
        <div className="space-y-4">
          <div className="inline-flex items-center space-x-2 rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 px-3 py-1 text-xs font-bold text-[#ffd700] mb-2 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
            <span>🏆</span>
            <span>FINAL RESULTS DECLARED</span>
          </div>
          <h1 className="font-cinzel text-5xl md:text-6xl text-[#ffd700] font-black tracking-wide drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
            THE PIRATE BOUNTY BOARD
          </h1>
          <p className="font-garamond text-2xl text-[#f4ede0]/80 font-semibold italic">
            {competition.name}
          </p>
          <div className="w-[1px] h-8 bg-gradient-to-b from-[#d4af37]/60 to-transparent mx-auto mt-6" />
        </div>

        {/* Top 3 Podium */}
        {top3.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-3 w-full">
            {top3.map((p, idx) => (
              <div
                key={p.id}
                className={`relative overflow-hidden bg-[#1a1714]/80 backdrop-blur-md shadow-2xl rounded-[2rem] p-8 text-center transition-all ${
                  idx === 0
                    ? "border-2 border-[#ffd700] bg-gradient-to-b from-[#d4af37]/20 to-[#0f172a] shadow-[0_0_40px_rgba(255,215,0,0.4)] scale-105 z-10"
                    : "border border-[#d4af37]/30"
                }`}
              >
                {idx === 0 && <Spotlight className="from-[#ffd700] via-[#d4af37] to-transparent blur-3xl opacity-50" size={300} />}
                
                <div className="relative z-10">
                  <div className="text-5xl mb-4 drop-shadow-lg">
                    {idx === 0 ? "👑" : idx === 1 ? "⚔️" : "⚓"}
                  </div>
                  <div className="text-xs font-garamond font-bold uppercase tracking-widest text-[#ffd700] mb-2">
                    RANK #{idx + 1}
                  </div>
                  <div className="text-2xl font-black text-[#f4ede0] font-cinzel tracking-wider drop-shadow-md">{p.name}</div>
                  <div className="mt-4 text-3xl font-garamond font-black text-[#ffd700] drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]">
                    {p.totalScore} <span className="text-sm">PTS</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Full Table */}
        <div className="w-full bg-[#1a1714]/80 backdrop-blur-md shadow-2xl overflow-hidden rounded-[2rem] border border-[#d4af37]/30">
          <table className="w-full text-left text-sm md:text-base">
            <thead className="border-b border-[#d4af37]/30 bg-[#0a0f1d]/50 text-[#ffd700] font-garamond uppercase tracking-widest">
              <tr>
                <th className="px-8 py-6">Rank</th>
                <th className="px-8 py-6">Corsair / Pirate</th>
                <th className="px-8 py-6 text-right">Final Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d4af37]/10">
              {leaderboard.map((participant) => (
                <tr
                  key={participant.id}
                  className="hover:bg-[#d4af37]/5 transition-colors"
                >
                  <td className="px-8 py-5 font-garamond font-bold text-[#f4ede0] text-lg">
                    {participant.rank === 1 ? <span className="text-[#ffd700]">👑 1</span> : `#${participant.rank}`}
                  </td>
                  <td className="px-8 py-5 font-bold text-[#f4ede0] font-cinzel tracking-widest">
                    {participant.name}
                  </td>
                  <td className="px-8 py-5 text-right font-garamond text-xl font-black text-[#ffd700]">
                    {participant.totalScore}
                  </td>
                </tr>
              ))}

              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-8 py-16 text-center text-[#f4ede0]/60 font-garamond italic text-lg">
                    No bounties claimed. The crew was lost at sea.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
