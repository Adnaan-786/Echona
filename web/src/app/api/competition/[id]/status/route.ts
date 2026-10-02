import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: competitionId } = await params

  try {
    const comp = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        rounds: {
          orderBy: { order: "asc" },
          include: {
            questions: {
              include: {
                starterCodes: true,
                testCases: {
                  where: { isHidden: false },
                  select: { input: true, expected: true }
                }
              }
            }
          }
        }
      }
    })

    if (!comp) {
      return NextResponse.json({ error: "Competition not found" }, { status: 404 })
    }

    if (comp.status === "WAITING" || comp.status === "DRAFT") {
      return NextResponse.json({
        status: "WAITING",
        competitionName: comp.name,
        description: comp.description
      })
    }

    if (comp.status === "COUNTDOWN") {
      const firstRound = comp.rounds[0]
      return NextResponse.json({
        status: "COUNTDOWN",
        competitionName: comp.name,
        countdownSeconds: 60,
        roundName: firstRound?.name || "Quest for the Lost Treasure"
      })
    }

    if (comp.status === "ENDED") {
      return NextResponse.json({
        status: "ENDED",
        competitionName: comp.name
      })
    }

    // Active round
    const activeRound = comp.rounds.find(r => r.status === "ACTIVE")
    if (!activeRound) {
      return NextResponse.json({
        status: "WAITING_ROUND",
        competitionName: comp.name
      })
    }

    // Fetch user's compile attempts count and submission status per question
    const questionIds = activeRound.questions.map(q => q.id)

    const attempts = await prisma.compileAttempt.groupBy({
      by: ["questionId"],
      where: {
        userId: session.user.id,
        questionId: { in: questionIds }
      },
      _count: { id: true }
    })

    const attemptMap = attempts.reduce((acc, curr) => {
      acc[curr.questionId] = curr._count.id
      return acc
    }, {} as Record<string, number>)

    const submissions = await prisma.submission.findMany({
      where: {
        userId: session.user.id,
        questionId: { in: questionIds }
      },
      select: {
        questionId: true,
        status: true
      }
    })

    const submissionMap = submissions.reduce((acc, curr) => {
      acc[curr.questionId] = curr.status
      return acc
    }, {} as Record<string, string>)

    // User's drafts
    const drafts = await prisma.draftCode.findMany({
      where: {
        userId: session.user.id,
        questionId: { in: questionIds }
      }
    })

    const draftMap = drafts.reduce((acc, curr) => {
      acc[curr.questionId] = { code: curr.code, language: curr.language }
      return acc
    }, {} as Record<string, { code: string; language: string }>)

    // NOTICE: PER SPECIFICATION, THE TIMER RUNS IN BACKEND AND IS NOT SENT TO THE USER SCREEN!
    return NextResponse.json({
      status: "ACTIVE_ROUND",
      competitionName: comp.name,
      round: {
        id: activeRound.id,
        name: activeRound.name,
        order: activeRound.order,
        maxCompileAttempts: activeRound.maxCompileAttempts,
        questions: activeRound.questions.map(q => ({
          id: q.id,
          title: q.title,
          description: q.description,
          points: q.points,
          starterCodes: q.starterCodes,
          testCases: q.testCases
        }))
      },
      userState: {
        attempts: attemptMap,
        submissions: submissionMap,
        drafts: draftMap
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized Admin Only" }, { status: 401 })
  }

  const { id: competitionId } = await params
  const { status } = await req.json()

  try {
    const comp = await prisma.competition.update({
      where: { id: competitionId },
      data: { status }
    })
    
    // Also reset the rounds if restarting
    if (status === "ACTIVE") {
       await prisma.round.updateMany({
         where: { competitionId },
         data: { status: "ACTIVE" }
       })
    }
    
    return NextResponse.json({ success: true, comp })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
