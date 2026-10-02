"use server"

import { auth } from "@/auth"
import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import {
  startCompetition,
  activateRound,
  endRound,
  endCompetition,
  getCurrentRound
} from "@/lib/competition-engine"
import { seedPirateChampionship } from "@/lib/seed-championship"
import { runAICompetitionEvaluation } from "@/lib/ai-debugger"

const prisma = new PrismaClient()

async function checkAdmin() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized: Captain's Quarters (Admin) access only!")
  }
  return session
}

export async function triggerSeedChampionship() {
  await checkAdmin()
  const comp = await seedPirateChampionship()
  revalidatePath("/admin/competitions")
  revalidatePath(`/admin/competitions/${comp.id}`)
  return { success: true, competitionId: comp.id }
}

export async function createCompetition(formData: FormData) {
  await checkAdmin()
  const name = formData.get("name") as string
  const description = formData.get("description") as string

  if (!name) throw new Error("Name is required")

  const comp = await prisma.competition.create({
    data: { name, description, status: "WAITING" },
  })

  revalidatePath("/admin/competitions")
  redirect(`/admin/competitions/${comp.id}`)
}

export async function startTestAdmin(competitionId: string) {
  await checkAdmin()
  const comp = await startCompetition(competitionId)
  revalidatePath(`/admin/competitions/${competitionId}`)
  revalidatePath(`/competition/${competitionId}`)
  return { success: true, status: comp.status }
}

export async function activateRoundAdmin(competitionId: string, roundOrder: number) {
  await checkAdmin()
  const round = await activateRound(competitionId, roundOrder)
  revalidatePath(`/admin/competitions/${competitionId}`)
  revalidatePath(`/competition/${competitionId}`)
  return { success: true, round }
}

export async function endTestAdmin(competitionId: string) {
  await checkAdmin()
  const result = await endCompetition(competitionId)
  revalidatePath(`/admin/competitions/${competitionId}`)
  revalidatePath(`/admin/competitions/${competitionId}/leaderboard`)
  revalidatePath(`/competition/${competitionId}`)
  return {
    success: true,
    top3Winners: result.top3Winners,
    allParticipants: result.allParticipants
  }
}

export async function createRound(competitionId: string, formData: FormData) {
  await checkAdmin()

  const name = formData.get("name") as string
  const durationSeconds = parseInt(formData.get("durationSeconds") as string, 10)
  const maxCompileAttempts = parseInt(formData.get("maxCompileAttempts") as string, 10)
  const order = parseInt(formData.get("order") as string, 10)

  if (!name || isNaN(durationSeconds) || isNaN(maxCompileAttempts) || isNaN(order)) {
    throw new Error("Invalid round data")
  }

  await prisma.round.create({
    data: {
      competitionId,
      name,
      durationSeconds,
      maxCompileAttempts,
      order,
    },
  })

  revalidatePath(`/admin/competitions/${competitionId}`)
  redirect(`/admin/competitions/${competitionId}`)
}

export async function createQuestionWithStarterCodes(roundId: string, formData: FormData) {
  await checkAdmin()

  const round = await prisma.round.findUnique({
    where: { id: roundId },
    include: { competition: true }
  })

  if (!round) throw new Error("Round not found")

  const title = (formData.get("title") as string)?.trim()
  const description = (formData.get("description") as string)?.trim()
  const points = parseInt(formData.get("points") as string, 10)
  const jsStarter = (formData.get("jsStarter") as string) || ""
  const pyStarter = (formData.get("pyStarter") as string) || ""
  const cppStarter = (formData.get("cppStarter") as string) || ""

  const testInput1 = (formData.get("testInput1") as string) || ""
  const testExpected1 = (formData.get("testExpected1") as string) || ""
  const testInput2 = (formData.get("testInput2") as string) || ""
  const testExpected2 = (formData.get("testExpected2") as string) || ""

  if (!title || !description || isNaN(points)) {
    throw new Error("Title, description, and points are required")
  }

  const question = await prisma.question.create({
    data: {
      roundId,
      title,
      description,
      points,
    },
  })

  // Starter codes
  if (jsStarter.trim()) {
    await prisma.starterCode.create({
      data: { questionId: question.id, language: "javascript", code: jsStarter }
    })
  }
  if (pyStarter.trim()) {
    await prisma.starterCode.create({
      data: { questionId: question.id, language: "python", code: pyStarter }
    })
  }
  if (cppStarter.trim()) {
    await prisma.starterCode.create({
      data: { questionId: question.id, language: "cpp", code: cppStarter }
    })
  }

  // Test cases
  if (testExpected1.trim()) {
    await prisma.testCase.create({
      data: {
        questionId: question.id,
        input: testInput1,
        expected: testExpected1,
        isHidden: false
      }
    })
  }
  if (testExpected2.trim()) {
    await prisma.testCase.create({
      data: {
        questionId: question.id,
        input: testInput2,
        expected: testExpected2,
        isHidden: true
      }
    })
  }

  revalidatePath(`/admin/rounds/${roundId}`)
  redirect(`/admin/rounds/${roundId}`)
}

export async function updateQuestionWithStarterCodes(questionId: string, formData: FormData) {
  await checkAdmin()

  const title = (formData.get("title") as string)?.trim()
  const description = (formData.get("description") as string)?.trim()
  const points = parseInt(formData.get("points") as string, 10)
  const jsStarter = (formData.get("jsStarter") as string) || ""
  const pyStarter = (formData.get("pyStarter") as string) || ""
  const cppStarter = (formData.get("cppStarter") as string) || ""

  const testInput1 = (formData.get("testInput1") as string) || ""
  const testExpected1 = (formData.get("testExpected1") as string) || ""
  const testInput2 = (formData.get("testInput2") as string) || ""
  const testExpected2 = (formData.get("testExpected2") as string) || ""
  const testInput3 = (formData.get("testInput3") as string) || ""
  const testExpected3 = (formData.get("testExpected3") as string) || ""

  if (!title || !description || isNaN(points)) {
    throw new Error("Title, description, and points are required")
  }

  const question = await prisma.question.update({
    where: { id: questionId },
    data: {
      title,
      description,
      points,
    },
  })

  // Clear existing starter codes and test cases
  await prisma.starterCode.deleteMany({ where: { questionId } })
  await prisma.testCase.deleteMany({ where: { questionId } })

  // Re-create Starter codes
  if (jsStarter.trim()) {
    await prisma.starterCode.create({
      data: { questionId: question.id, language: "javascript", code: jsStarter }
    })
  }
  if (pyStarter.trim()) {
    await prisma.starterCode.create({
      data: { questionId: question.id, language: "python", code: pyStarter }
    })
  }
  if (cppStarter.trim()) {
    await prisma.starterCode.create({
      data: { questionId: question.id, language: "cpp", code: cppStarter }
    })
  }

  // Re-create Test cases
  if (testExpected1.trim()) {
    await prisma.testCase.create({
      data: {
        questionId: question.id,
        input: testInput1,
        expected: testExpected1,
        isHidden: false
      }
    })
  }
  if (testExpected2.trim()) {
    await prisma.testCase.create({
      data: {
        questionId: question.id,
        input: testInput2,
        expected: testExpected2,
        isHidden: true
      }
    })
  }
  if (testExpected3.trim()) {
    await prisma.testCase.create({
      data: {
        questionId: question.id,
        input: testInput3,
        expected: testExpected3,
        isHidden: true
      }
    })
  }

  redirect(`/admin/rounds/${question.roundId}`)
}

export async function uploadStarterCode(questionId: string, language: string, code: string) {
  await checkAdmin()
  return await prisma.starterCode.upsert({
    where: {
      questionId_language: {
        questionId,
        language
      }
    },
    update: { code },
    create: {
      questionId,
      language,
      code
    }
  })
}

export async function getLiveAdminData(competitionId: string) {
  await checkAdmin()

  const comp = await prisma.competition.findUnique({
    where: { id: competitionId },
    include: {
      rounds: {
        orderBy: { order: "asc" },
        include: {
          questions: {
            include: {
              starterCodes: true,
              _count: { select: { submissions: true, compileAttempts: true } }
            }
          }
        }
      },
      participants: {
        include: {
          user: true,
          scores: true
        }
      }
    }
  })

  if (!comp) return null

  // Active round with remaining backend timer (visible ONLY to Admin)
  const activeRound = comp.rounds.find(r => r.status === "ACTIVE")
  let secondsRemaining = 0
  if (activeRound && activeRound.startedAt) {
    const elapsed = Math.floor((Date.now() - new Date(activeRound.startedAt).getTime()) / 1000)
    secondsRemaining = Math.max(0, activeRound.durationSeconds - elapsed)
  }

  // AI Evaluation if test ended
  let evaluation = null
  if (comp.status === "ENDED") {
    try {
      evaluation = await runAICompetitionEvaluation(competitionId)
    } catch (e) {
      console.error("Evaluation fetch error:", e)
    }
  }

  return {
    competition: comp,
    activeRound,
    secondsRemaining,
    evaluation
  }
}
