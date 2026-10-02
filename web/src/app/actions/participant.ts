"use server"

import { auth } from "@/auth"
import { PrismaClient } from "@prisma/client"
import { requestCompile, submitSolution, saveDraftCode } from "@/lib/competition-engine"

const prisma = new PrismaClient()

export async function compileCode(questionId: string, language: string, code: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized: Please log in first." }
  }

  try {
    const attempt = await requestCompile(session.user.id, questionId, language, code)
    return { success: true, attempt }
  } catch (error: any) {
    const isExceeded = error.message.includes("ATTEMPT LIMIT EXHAUSTED")
    return {
      success: false,
      error: error.message,
      autoSubmitted: isExceeded
    }
  }
}

export async function submitFinalCode(questionId: string, language: string, code: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized: Please log in first." }
  }

  try {
    const submission = await submitSolution(session.user.id, questionId, language, code, false)
    return { success: true, submission }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function saveDraft(questionId: string, language: string, code: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false }

  try {
    await saveDraftCode(session.user.id, questionId, language, code)
    return { success: true }
  } catch {
    return { success: false }
  }
}

export async function getUserQuestionStatus(questionId: string) {
  const session = await auth()
  if (!session?.user?.id) return null

  const userId = session.user.id

  const attempts = await prisma.compileAttempt.findMany({
    where: { userId, questionId },
    orderBy: { createdAt: "desc" }
  })

  const latestSubmission = await prisma.submission.findFirst({
    where: { userId, questionId },
    orderBy: { createdAt: "desc" },
    include: { score: true }
  })

  const draft = await prisma.draftCode.findUnique({
    where: {
      userId_questionId: {
        userId,
        questionId
      }
    }
  })

  return {
    attemptsCount: attempts.length,
    attempts,
    latestSubmission,
    draft
  }
}
