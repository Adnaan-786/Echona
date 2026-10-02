import { PrismaClient } from "@prisma/client"
import Link from "next/link"
import { notFound } from "next/navigation"
import { DeleteButton } from "@/components/DeleteButton"
import { deleteCompetition } from "@/app/actions/admin"

const prisma = new PrismaClient()

export default async function AdminCompetitionDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const comp = await prisma.competition.findUnique({
    where: { id },
    include: {
      rounds: {
        orderBy: { order: "asc" },
        include: { _count: { select: { questions: true } } }
      }
    }
  })

  if (!comp) return notFound()

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-8 text-[#d4cbb3] font-sans">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 border-b-2 border-[#8b7355] pb-4">
          <Link href="/admin/competitions" className="text-sm text-[#8b7355] hover:text-[#d4af37]">
            &larr; Back to Competitions
          </Link>
          <h1 className="mt-2 text-4xl font-bold tracking-widest text-[#d4af37]">{comp.name}</h1>
          <p className="mt-2 text-[#8b7355]">{comp.description}</p>
          <div className="flex items-center gap-4 mt-4">
            <div className="inline-block rounded bg-[#2a2a2a] px-3 py-1 font-bold text-[#d4cbb3] border border-[#8b7355]">
              Status: {comp.status}
            </div>
            <DeleteButton 
              action={deleteCompetition} 
              id={comp.id} 
              label="DELETE COMPETITION" 
              confirmText="Are you sure you want to permanently delete this competition? This will destroy all rounds, questions, and submissions inside it!" 
            />
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#d4af37]">Rounds</h2>
          {comp.status === "DRAFT" && (
            <Link
              href={`/admin/competitions/${comp.id}/rounds/new`}
              className="rounded bg-[#8b0000] px-4 py-2 text-sm font-bold tracking-wide text-white transition-colors hover:bg-[#660000]"
            >
              + ADD ROUND
            </Link>
          )}
        </div>

        <div className="space-y-4">
          {comp.rounds.map((round) => (
            <Link
              key={round.id}
              href={`/admin/rounds/${round.id}`}
              className="flex items-center justify-between rounded-lg border border-[#8b7355] bg-[#2a2a2a] p-4 transition-colors hover:border-[#d4af37]"
            >
              <div>
                <h3 className="text-lg font-bold text-[#d4af37]">
                  Round {round.order}: {round.name}
                </h3>
                <p className="text-sm text-[#8b7355]">
                  {round.durationSeconds / 60} minutes | {round.maxCompileAttempts} compile attempts
                </p>
              </div>
              <div className="text-right">
                <span className="text-[#d4cbb3] font-semibold">{round._count.questions} Questions</span>
                <p className="text-xs text-[#8b7355] mt-1">Status: {round.status}</p>
              </div>
            </Link>
          ))}

          {comp.rounds.length === 0 && (
            <div className="rounded border-2 border-dashed border-[#8b7355] p-8 text-center text-[#8b7355]">
              No rounds defined yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
