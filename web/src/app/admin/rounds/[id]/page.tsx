import { PrismaClient } from "@prisma/client"
import Link from "next/link"
import { notFound } from "next/navigation"
import { DeleteButton } from "@/components/DeleteButton"
import { deleteRound } from "@/app/actions/admin"

const prisma = new PrismaClient()

export default async function AdminRoundDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const round = await prisma.round.findUnique({
    where: { id },
    include: {
      competition: true,
      questions: {
        include: {
          _count: { select: { testCases: true, starterCodes: true } }
        }
      }
    }
  })

  if (!round) return notFound()

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-8 text-[#d4cbb3] font-sans">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 border-b-2 border-[#8b7355] pb-4">
          <Link href={`/admin/competitions/${round.competitionId}`} className="text-sm text-[#8b7355] hover:text-[#d4af37]">
            &larr; Back to {round.competition.name}
          </Link>
          <h1 className="mt-2 text-4xl font-bold tracking-widest text-[#d4af37]">Round {round.order}: {round.name}</h1>
          <p className="mt-2 text-[#8b7355]">{round.durationSeconds / 60} mins | Max {round.maxCompileAttempts} compile attempts</p>
          <div className="flex items-center gap-4 mt-4">
            <div className="inline-block rounded bg-[#2a2a2a] px-3 py-1 font-bold text-[#d4cbb3] border border-[#8b7355]">
              Status: {round.status}
            </div>
            <DeleteButton 
              action={deleteRound} 
              id={round.id} 
              label="DELETE ROUND" 
              confirmText={`Are you sure you want to permanently delete "${round.name}"? This will destroy all questions and submissions inside it!`} 
            />
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#d4af37]">Questions</h2>
          <Link
            href={`/admin/rounds/${round.id}/questions/new`}
            className="rounded bg-[#8b0000] px-4 py-2 text-sm font-bold tracking-wide text-white transition-colors hover:bg-[#660000]"
          >
            + ADD QUESTION
          </Link>
        </div>

        <div className="space-y-4">
          {round.questions.map((q) => (
            <div
              key={q.id}
              className="rounded-lg border border-[#8b7355] bg-[#2a2a2a] p-4"
            >
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-[#d4af37]">{q.title}</h3>
                <Link 
                  href={`/admin/rounds/${round.id}/questions/${q.id}/edit`}
                  className="text-xs text-[#d4af37] hover:text-white border border-[#d4af37]/30 hover:bg-[#d4af37]/20 px-3 py-1 rounded transition-colors"
                >
                  Edit
                </Link>
              </div>
              <p className="text-sm text-[#8b7355] line-clamp-2 mt-1">{q.description}</p>
              <div className="mt-4 flex gap-4 text-xs font-semibold text-[#d4cbb3]">
                <span className="rounded bg-[#1a1a1a] px-2 py-1">{q.points} Points</span>
                <span className="rounded bg-[#1a1a1a] px-2 py-1">{q._count.testCases} Test Cases</span>
                <span className="rounded bg-[#1a1a1a] px-2 py-1">{q._count.starterCodes} Starter Codes</span>
              </div>
            </div>
          ))}

          {round.questions.length === 0 && (
            <div className="rounded border-2 border-dashed border-[#8b7355] p-8 text-center text-[#8b7355]">
              No questions added to this round yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
