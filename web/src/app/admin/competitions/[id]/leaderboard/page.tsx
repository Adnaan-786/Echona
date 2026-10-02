import { getLeaderboard } from "@/app/actions/leaderboard"
import LeaderboardRefresher from "@/components/LeaderboardRefresher"
import Link from "next/link"
import { PrismaClient } from "@prisma/client"
import { notFound } from "next/navigation"

const prisma = new PrismaClient()

export default async function AdminLeaderboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: competitionId } = await params
  
  const competition = await prisma.competition.findUnique({ where: { id: competitionId } })
  if (!competition) return notFound()

  const leaderboard = await getLeaderboard(competitionId)

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-8 text-[#d4cbb3] font-sans">
      <LeaderboardRefresher competitionId={competitionId} />
      
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between border-b-2 border-[#8b7355] pb-4">
          <div>
            <h1 className="text-4xl font-bold tracking-widest text-[#d4af37]">ADMIN BOUNTY BOARD</h1>
            <p className="mt-2 text-lg text-[#8b7355]">{competition.name} (Live Sync)</p>
          </div>
          <Link href={`/admin/competitions/${competitionId}`} className="text-[#8b7355] underline hover:text-[#d4cbb3]">
            Back to Details
          </Link>
        </div>

        <div className="overflow-hidden rounded-lg border-2 border-[#8b7355] bg-[#2a2a2a] shadow-2xl shadow-black">
          <table className="w-full text-left">
            <thead className="border-b-2 border-[#8b7355] bg-[#0a0a0a]">
              <tr>
                <th className="px-6 py-4 text-xl font-bold text-[#d4af37]">Rank</th>
                <th className="px-6 py-4 text-xl font-bold text-[#d4af37]">Pirate</th>
                <th className="px-6 py-4 text-right text-xl font-bold text-[#d4af37]">Bounty (Score)</th>
                <th className="px-6 py-4 text-right text-xl font-bold text-[#d4af37]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((participant) => (
                <tr 
                  key={participant.id} 
                  className="border-b border-[#8b7355] last:border-0 hover:bg-[#1e1e1e] transition-colors"
                >
                  <td className="px-6 py-4 text-2xl font-bold text-[#d4cbb3]">{participant.rank}</td>
                  <td className="px-6 py-4 text-xl text-[#d4cbb3]">
                    {participant.name}
                    <div className="text-xs text-[#8b7355] mt-1">{participant.userId}</div>
                  </td>
                  <td className="px-6 py-4 text-right text-2xl font-bold text-[#d4af37]">{participant.totalScore}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="rounded bg-[#8b0000] px-3 py-1 text-sm font-bold text-white hover:bg-[#660000]">
                      INSPECT SUBMISSIONS & AI
                    </button>
                  </td>
                </tr>
              ))}
              
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-[#8b7355]">
                    No bounties claimed yet.
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
