import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getExecutionService } from "@/lib/execution"
import { evaluateCodeScore } from "@/lib/ai-debugger"
import { broadcastEvent } from "@/lib/realtime"

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const { submissionId } = await req.json()
    if (!submissionId) return NextResponse.json({ error: "Missing submissionId" }, { status: 400 })

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        question: {
          include: { round: true }
        },
        user: true,
        score: true
      }
    })

    if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 })

    // Rerun local tests quickly to gather logs for AI
    const execService = getExecutionService()
    const allTestCases = await prisma.testCase.findMany({ where: { questionId: submission.questionId } })
    
    let totalTimeMs = 0
    let executionLogs = ""
    let passedCount = 0

    for (const tc of allTestCases) {
      const res = await execService.execute({
        language: submission.language,
        code: submission.code,
        input: tc.input,
        expectedOutput: tc.expected
      })
      totalTimeMs += res.time
      if (res.passed) {
        passedCount++
        executionLogs += `Test Case passed.\n`
      } else {
        executionLogs += `Test Case failed. Output: ${res.stdout || res.stderr}\n`
      }
    }

    if (allTestCases.length === 0) {
      const res = await execService.execute({ language: submission.language, code: submission.code, input: "", expectedOutput: "" })
      totalTimeMs += res.time
      executionLogs += res.passed ? `Execution passed: ${res.stdout}\n` : `Execution failed: ${res.stderr || res.stdout}\n`
    }

    const totalPoints = submission.question.points || 100
    const baselineScore = submission.score?.pointsEarned || 0

    // Evaluate with AI
    const aiEval = await evaluateCodeScore(
      submission.code,
      submission.language,
      submission.question.title,
      submission.question.description || "",
      executionLogs,
      totalPoints,
      totalTimeMs
    )

    // Calculate score diff
    const scoreDiff = aiEval.earnedScore - baselineScore

    // Update AI Analysis
    await prisma.aIAnalysis.update({
      where: { submissionId },
      data: {
        status: "COMPLETED",
        feedback: aiEval.feedback,
        correctness: Math.round((aiEval.earnedScore / totalPoints) * 100)
      }
    })

    // Update Submission Score if it changed
    if (scoreDiff !== 0) {
      await prisma.score.update({
        where: { submissionId },
        data: { pointsEarned: aiEval.earnedScore }
      })

      // Update Participant total score
      const participant = await prisma.competitionParticipant.findUnique({
        where: {
          competitionId_userId: {
            competitionId: submission.question.round.competitionId,
            userId: submission.userId
          }
        }
      })
      if (participant) {
        await prisma.competitionParticipant.update({
          where: { id: participant.id },
          data: { score: participant.score + scoreDiff }
        })
      }
    }

    // Broadcast AI finished
    await broadcastEvent(submission.question.round.competitionId, "leaderboard_updated", {
      competitionId: submission.question.round.competitionId
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("[Background AI Error]", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
