"use server"

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function getLeaderboard(competitionId: string) {
  // Fetch all participants with their users and summed scores
  const participants = await prisma.competitionParticipant.findMany({
    where: { competitionId },
    include: {
      user: {
        select: { name: true, email: true }
      },
      scores: true
    }
  })

  // Map to a clean structure and calculate total score
  const leaderboard = participants.map(p => {
    const totalScore = p.scores.reduce((sum, s) => sum + s.pointsEarned, 0)
    
    // Find the timestamp of the last score record to resolve ties
    const latestScoreTimestamp = p.scores.reduce((latest, s) => {
      return s.createdAt > latest ? s.createdAt : latest
    }, new Date(0))

    return {
      id: p.id,
      userId: p.userId,
      name: p.user.name || p.user.email.split("@")[0],
      totalScore,
      lastUpdate: latestScoreTimestamp
    }
  })

  // Sort descending by score, then ascending by time (faster solve = better rank)
  leaderboard.sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore
    }
    return a.lastUpdate.getTime() - b.lastUpdate.getTime()
  })

  return leaderboard.map((p, index) => ({
    ...p,
    rank: index + 1
  }))
}
