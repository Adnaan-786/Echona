import { PrismaClient } from "@prisma/client"
import Link from "next/link"

const prisma = new PrismaClient()

export default async function AdminCompetitionsPage() {
  const competitions = await prisma.competition.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { rounds: true, participants: true }
      }
    }
  })

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-8 text-[#d4cbb3] font-sans">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between border-b-2 border-[#8b7355] pb-4">
          <div>
            <h1 className="text-4xl font-bold tracking-widest text-[#d4af37]">COMPETITIONS</h1>
            <p className="mt-2 text-[#8b7355]">Manage the Pirate Code Clash</p>
          </div>
          <Link
            href="/admin/competitions/new"
            className="rounded bg-[#8b0000] px-4 py-2 font-bold tracking-wide text-white transition-colors hover:bg-[#660000]"
          >
            + NEW COMPETITION
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {competitions.map((comp) => (
            <Link
              key={comp.id}
              href={`/admin/competitions/${comp.id}`}
              className="block rounded-lg border-2 border-[#8b7355] bg-[#2a2a2a] p-6 shadow-xl transition-transform hover:-translate-y-1 hover:border-[#d4af37]"
            >
              <h2 className="mb-2 text-2xl font-bold text-[#d4af37]">{comp.name}</h2>
              <p className="mb-4 text-sm text-[#8b7355] line-clamp-2">{comp.description}</p>
              
              <div className="flex items-center justify-between text-sm">
                <span className={`rounded px-2 py-1 font-bold ${
                  comp.status === "ACTIVE" ? "bg-green-900 text-green-300" :
                  comp.status === "ENDED" ? "bg-gray-700 text-gray-300" :
                  "bg-yellow-900 text-yellow-300"
                }`}>
                  {comp.status}
                </span>
                <span className="text-[#d4cbb3]">{comp._count.rounds} Rounds</span>
              </div>
            </Link>
          ))}
          
          {competitions.length === 0 && (
            <div className="col-span-full rounded border-2 border-dashed border-[#8b7355] p-12 text-center text-[#8b7355]">
              No competitions found. Time to chart a new course!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
